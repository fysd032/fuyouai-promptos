// lib/billing/guard.ts
// ────────────────────────────────────────────────
// 第二层：认证 + 订阅校验（含 Redis 缓存）
//
// 验收点：
//   1. 优先从 req.headers.authorization 读 Bearer token
//   2. token 无效 / 缺失 → 回退 cookie getUser()
//   3. 两种方式都拿不到 user → 401 UNAUTHORIZED
//   4. 有 user 但无订阅记录 → 402 SUBSCRIPTION_REQUIRED
//   5. 有 user 但订阅过期 → 402 SUBSCRIPTION_EXPIRED
//   6. 订阅 active / trialing 未过期 → ok
//   7. 缓存命中时直接返回，不查 DB
//   8. Redis 不可用时降级为直接查 DB（entitlement-cache 内部 try/catch）
// ────────────────────────────────────────────────
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getEntitlement,
  setEntitlement,
  type Entitlement,
} from "./entitlement-cache";

const GATE_LOG = process.env.GATE_LOG === "1";

export type GateFail = {
  ok: false;
  status: 401 | 402;
  code: "UNAUTHORIZED" | "SUBSCRIPTION_REQUIRED" | "SUBSCRIPTION_EXPIRED"prod
};

export type GateOk = {
  ok: true;
  userId: string;
};

export type GateResult = GateOk | GateFail;

export async function requireSubscription(
  opts?: { scope?: string },
  req?: Request
): Promise<GateResult> {
  const t0 = Date.now();
  const supabase = await createClient();

  // ── 第 1 步：识别用户 ──────────────────────────
  let user: { id: string } | null = null;

  // 优先：Bearer token（跨域前端场景）
  if (req) {
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        user = data.user;
      }
    }
  }

  // 回退：cookie（同域 SSR 场景）
  if (!user) {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    }
  }

  // 两种方式都失败 → 401
  if (!user) {
    if (GATE_LOG) console.log(`[gate] userId=- cache_hit=false result=401 ms=${Date.now() - t0}`);
    return { ok: false, status: 401, code: "UNAUTHORIZED" };
  }

  const userId = user.id;

  // ── 第 2 步：查缓存（Redis 失败 → 返回 null → 走 DB）──
  const cached = await getEntitlement(userId);

  if (cached !== null) {
    if (cached.allowed) {
      if (GATE_LOG) console.log(`[gate] userId=${userId} cache_hit=true result=ok ms=${Date.now() - t0}`);
      return { ok: true, userId };
    }
    const code = cached.code ?? "SUBSCRIPTION_REQUIRED";
    if (GATE_LOG) console.log(`[gate] userId=${userId} cache_hit=true result=402 ms=${Date.now() - t0}`);
    return { ok: false, status: 402, code };
  }

  // ── 第 3 步：cache miss → 查 DB（用 admin 绕过 RLS）──
  type SubRow = {
    status: string;
    plan: string | null;
    trial_end: string | null;
    cancel_at_period_end: boolean | null;
    current_period_end: string | null;
  };
  const admin = getSupabaseAdmin();
  const { data: sub, error } = await admin
    .from("subscriptions")
    .select("status, plan, trial_end, cancel_at_period_end, current_period_end")
    .eq("user_id", userId)
    .single<SubRow>();

  if (error || !sub) {
    await setEntitlement(userId, { allowed: false, code: "SUBSCRIPTION_REQUIRED" });
    if (GATE_LOG) console.log(`[gate] userId=${userId} cache_hit=false result=402 ms=${Date.now() - t0}`);
    return { ok: false, status: 402, code: "SUBSCRIPTION_REQUIRED" };
  }

  // ── 第 4 步：判断是否有效 ──────────────────────
  const allowed = isSubscriptionActiveNow(sub);

  if (!allowed) {
    await setEntitlement(userId, { allowed: false, code: "SUBSCRIPTION_EXPIRED" });
    if (GATE_LOG) console.log(`[gate] userId=${userId} cache_hit=false result=402 ms=${Date.now() - t0}`);
    return { ok: false, status: 402, code: "SUBSCRIPTION_EXPIRED" };
  }

  await setEntitlement(userId, { allowed: true });
  if (GATE_LOG) console.log(`[gate] userId=${userId} cache_hit=false result=ok ms=${Date.now() - t0}`);
  return { ok: true, userId };
}

/**
 * 判断订阅是否"此刻仍然可用"。
 *
 * 行业标准行为：cancel_at_period_end=true 的订阅在
 * current_period_end 之前仍然可用。
 *
 * 规则：
 *  1. trialing + trial_end 未过期 → 可用（不受 plan 限制）
 *  2. plan 为 free / 空 → 不可用
 *  3. status=active 且有 current_period_end → now < period_end 就可用
 *     （无论 cancel_at_period_end 是否为 true）
 *  4. status=active 且无 current_period_end →
 *     仅在 cancel_at_period_end 不为 true 时可用（fallback）
 *  5. 其余 → 不可用
 */
function isSubscriptionActiveNow(sub: {
  status: string;
  plan: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean | null;
  current_period_end: string | null;
}): boolean {
  const now = new Date();

  // trialing：只看 trial_end（不受 plan 限制）
  if (sub.status === "trialing") {
    const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
    return trialEnd !== null && now < trialEnd;
  }

  // plan 为 free 或空 → 无付费订阅（对 active 等状态成立）
  if (!sub.plan || sub.plan === "free") return false;

  if (sub.status === "active") {
    if (sub.current_period_end) {
      // 有明确的到期时间：只要还没到就允许（cancel_at_period_end 不影响）
      return now < new Date(sub.current_period_end);
    }
    // 无 current_period_end：正常 active 且未预约取消 → 允许
    return !sub.cancel_at_period_end;
  }

  return false;
}
