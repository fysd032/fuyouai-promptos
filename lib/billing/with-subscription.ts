// lib/billing/with-subscription.ts
// ────────────────────────────────────────────────
// 第一层：订阅门禁中间件
//
// 职责：
//   1. 检查 BILLING_ENABLED 总开关
//   2. 把 req 原样传给 requireSubscription(opts, req)
//   3. 将 guard 返回的 status/code 原样透传给前端
//
// 验收点：
//   - BILLING_ENABLED=0 → 直接放行，不做任何校验
//   - BILLING_ENABLED=1 → 调用 guard，status/code 一一对应：
//       401 UNAUTHORIZED        → "Please sign in."
//       402 SUBSCRIPTION_REQUIRED → "No active subscription."
//       402 SUBSCRIPTION_EXPIRED  → "Subscription expired."
// ────────────────────────────────────────────────
import "server-only";
import { NextResponse } from "next/server";
import { requireSubscription } from "./guard";

type Handler = (req: Request) => Promise<NextResponse>;

function isBillingEnabled() {
  return process.env.BILLING_ENABLED === "1";
}

const ERROR_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: "Please sign in.",
  SUBSCRIPTION_REQUIRED: "No active subscription.",
  SUBSCRIPTION_EXPIRED: "Subscription expired.",
};

export function withSubscription(
  handler: Handler,
  opts?: { scope?: string }
): Handler {
  return async function wrapped(req: Request) {
    // 总开关关闭 → 直接放行
    if (!isBillingEnabled()) {
      return handler(req);
    }

    // ✅ 关键：把 req 传给 guard，使其能读取 Authorization header
    const gate = await requireSubscription({ scope: opts?.scope }, req);

    if (!gate.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: gate.code,
          error: ERROR_MESSAGES[gate.code] ?? "Access denied.",
        },
        { status: gate.status }
      );
    }

    return handler(req);
  };
}
