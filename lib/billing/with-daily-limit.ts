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

type Handler = (req: Request) => Promise<NextResponse>;

const DEFAULT_FREE_LIMIT = 20;

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
    // 总开关关闭 → 直接放行
    if (!isBillingEnabled()) {
      return handler(req);
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
      return handler(req);
    } catch (e: unknown) {
      // DB 异常时 fail-open，避免误伤用户
      console.error("[withDailyLimit] consumeDailyCall error:", e);
      return handler(req);
    }
  };
}
