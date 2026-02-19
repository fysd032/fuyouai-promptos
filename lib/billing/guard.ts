// lib/billing/guard.ts
// ────────────────────────────────────────────────
// 认证 + 访问校验（含 Redis 缓存）
//
// 放行顺序（OR 逻辑）：
//   1. subscription active / trialing 且未过期  → ok
//   2. user_entitlements beta_trial 未过期      → ok
//   3. 两者都无效                               → 402
//
// 其他规则：
//   - 优先从 req.headers.authorization 读 Bearer token
//   - token 无效 / 缺失 → 回退 cookie getUser()
//   - 两种方式都拿不到 user → 401
//   - Redis 命中时直接返回，不查 DB
//   - Redis 不可用时降级为直接查 DB
// ────────────────────────────────────────────────
import "server-only";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import {
  getEntitlement,
  setEntitlement,
} from "./entitlement-cache";

const GATE_LOG = process.env.GATE_LOG === "1";

export type GateFail = {
  ok: false;
  status: 401 | 402;
  code: "UNAUTHORIZED" | "SUBSCRIPTION_REQUIRED" | "SUBSCRIPTION_EXPIRED";
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

  // ── Step 1: identify user ───────────────────────────────
  let user: { id: string } | null = null;

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

  if (!user) {
    const { data, error } = await supabase.auth.getUser();
    if (!error && data?.user) {
      user = data.user;
    }
  }

  if (!user) {
    if (GATE_LOG) console.log(`[gate] userId=- cache_hit=false result=401 ms=${Date.now() - t0}`);
    return { ok: false, status: 401, code: "UNAUTHORIZED" };
  }

  const userId = user.id;

  // ── Step 2: Redis cache ─────────────────────────────────
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

  // ── Step 3: cache miss → check DB ──────────────────────
  const admin = getSupabaseAdmin();

  // 3a. Check subscriptions table
  type SubRow = {
    status: string;
    plan: string | null;
    trial_end: string | null;
    cancel_at_period_end: boolean | null;
    current_period_end: string | null;
  };

  const { data: sub } = await admin
    .from("subscriptions")
    .select("status, plan, trial_end, cancel_at_period_end, current_period_end")
    .eq("user_id", userId)
    .maybeSingle<SubRow>();

  if (sub !== null && isSubscriptionActiveNow(sub)) {
    await setEntitlement(userId, { allowed: true });
    if (GATE_LOG) console.log(`[gate] userId=${userId} source=subscription cache_hit=false result=ok ms=${Date.now() - t0}`);
    return { ok: true, userId };
  }

  // 3b. Subscription absent/expired → check user_entitlements (beta_trial)
  type EntRow = { expires_at: string | null };

  const { data: ent } = await admin
    .from("user_entitlements")
    .select("expires_at")
    .eq("user_id", userId)
    .eq("type", "beta_trial")
    .maybeSingle<EntRow>();

  if (ent !== null) {
    const expiresAt = ent.expires_at ? new Date(ent.expires_at) : null;
    if (expiresAt !== null && new Date() < expiresAt) {
      await setEntitlement(userId, { allowed: true });
      if (GATE_LOG) console.log(`[gate] userId=${userId} source=entitlement cache_hit=false result=ok ms=${Date.now() - t0}`);
      return { ok: true, userId };
    }
  }

  // ── Step 4: no valid subscription or entitlement ────────
  const failCode = sub === null ? "SUBSCRIPTION_REQUIRED" : "SUBSCRIPTION_EXPIRED";
  await setEntitlement(userId, { allowed: false, code: failCode });
  if (GATE_LOG) console.log(`[gate] userId=${userId} cache_hit=false result=402(${failCode}) ms=${Date.now() - t0}`);
  return { ok: false, status: 402, code: failCode };
}

/**
 * Returns true when the subscription row represents currently usable access.
 *
 * Rules:
 *  1. trialing + trial_end not yet passed            → allowed
 *  2. plan free / null                                → denied
 *  3. active + current_period_end set → now < end    → allowed
 *  4. active + no current_period_end + not canceling → allowed
 *  5. everything else                                 → denied
 */
function isSubscriptionActiveNow(sub: {
  status: string;
  plan: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean | null;
  current_period_end: string | null;
}): boolean {
  const now = new Date();

  if (sub.status === "trialing") {
    const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
    return trialEnd !== null && now < trialEnd;
  }

  if (!sub.plan || sub.plan === "free") return false;

  if (sub.status === "active") {
    if (sub.current_period_end) {
      return now < new Date(sub.current_period_end);
    }
    return !sub.cancel_at_period_end;
  }

  return false;
}
