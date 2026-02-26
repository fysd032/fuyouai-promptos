// lib/billing/with-daily-limit.ts
// ─────────────────────────────────────────────────────────────────
// 每日调用限制中间件
//
// 逻辑：
//   - BILLING_ENABLED !== "1"  → 直接放行（开发环境）
//   - Paid（tier=paid）        → 直接放行，无限制
//   - 未登录（401）            → 返回 401
//   - Trial / Free             → 调用 consume_daily_call(p_limit=20)
//       计数未超 → 放行
//       计数已超 → 返回 402 DAILY_LIMIT_REACHED
//
// 依赖：
//   - Supabase RPC: consume_daily_call(p_user_id UUID, p_limit INT)
//   - 表: daily_api_usage(user_id, usage_date, call_count)  UTC 日期粒度
// ─────────────────────────────────────────────────────────────────
import "server-only";
import { NextResponse } from "next/server";
import { requireSubscription } from "./guard";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { redis } from "./redis";

type Handler = (req: Request) => Promise<NextResponse>;

/**
 * 记录每个 Request 对应的 gate tier，供下游 handler 读取。
 * 使用 WeakMap 保证 Request 对象被 GC 时自动清理，无内存泄漏。
 */
export const requestGateTier = new WeakMap<Request, "paid" | "trial" | "free">();

const DEFAULT_FREE_LIMIT = 20;

// 每 IP 每小时请求上限（防脚本批量攻击）
// 可通过环境变量覆盖，例如企业内网多用户共享 IP 时适当调高
const IP_HOURLY_LIMIT = Number(process.env.IP_RATE_LIMIT_PER_HOUR) || 300;

/** 返回 true = 允许通过；false = 已超限 */
async function checkIpRateLimit(ip: string): Promise<boolean> {
  try {
    const key = `rl:ip:run:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) redis.expire(key, 3600).catch(() => {});
    return count <= IP_HOURLY_LIMIT;
  } catch {
    // Redis 不可用 → fail-open，不阻断正常请求
    return true;
  }
}

function isBillingEnabled() {
  return process.env.BILLING_ENABLED === "1";
}

async function consumeDailyCall(
  userId: string,
  limit: number
): Promise<{ ok: boolean; code?: string; count: number; limit: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = getSupabaseAdmin() as any;
  const { data, error } = await admin.rpc("consume_daily_call", {
    p_user_id: userId,
    p_limit: limit,
  });
  if (error) throw new Error(error.message);
  return data as { ok: boolean; code?: string; count: number; limit: number };
}

export function withDailyLimit(
  handler: Handler,
  opts?: { scope?: string; freeLimit?: number }
): Handler {
  return async function wrapped(req: Request) {
    // 总开关关闭 → 直接放行（开发环境，视为 paid 不受限）
    if (!isBillingEnabled()) {
      requestGateTier.set(req, "paid");
      return handler(req);
    }

    // ── IP 速率限制：在认证前执行，防脚本高频轮询 ──────────
    const ip =
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    const ipAllowed = await checkIpRateLimit(ip);
    if (!ipAllowed) {
      return NextResponse.json(
        { ok: false, code: "RATE_LIMITED", error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }

    const limit = opts?.freeLimit ?? DEFAULT_FREE_LIMIT;

    // 复用 requireSubscription 判断用户层级
    const gate = await requireSubscription({ scope: opts?.scope }, req);

    // ── 未登录 ─────────────────────────────────────────────
    if (!gate.ok && gate.status === 401) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", error: "Please sign in." },
        { status: 401 }
      );
    }

    // ── Paid → 直接放行，无限制 ────────────────────────────
    if (gate.ok && gate.tier === "paid") {
      requestGateTier.set(req, "paid");
      return handler(req);
    }

    // ── Trial / Free → 检查每日限额 ────────────────────────
    // gate.ok=true means trial; gate.ok=false (402) means free
    const userId: string | undefined = gate.ok ? gate.userId : gate.userId;
    if (!userId) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", error: "Please sign in." },
        { status: 401 }
      );
    }

    // Trial/Free 的 gate tier
    const tierForHandler: "trial" | "free" = gate.ok ? "trial" : "free";

    try {
      const result = await consumeDailyCall(userId, limit);
      if (!result.ok) {
        return NextResponse.json(
          {
            ok: false,
            code: "DAILY_LIMIT_REACHED",
            error: `Free plan: daily limit of ${limit} runs reached. Resets at UTC midnight.`,
            count: result.count,
            limit: result.limit,
          },
          { status: 402 }
        );
      }
      // 未超限 → 放行
      requestGateTier.set(req, tierForHandler);
      return handler(req);
    } catch (e: unknown) {
      // DB 异常时 fail-closed：拒绝 trial/free 请求，防止通过制造异常绕过计数
      // paid 用户不经过此分支（已在上方提前 return）
      console.error("[withDailyLimit] consumeDailyCall error:", e);
      return NextResponse.json(
        { ok: false, code: "SERVICE_UNAVAILABLE", error: "Service temporarily unavailable, please retry." },
        { status: 503 }
      );
    }
  };
}
