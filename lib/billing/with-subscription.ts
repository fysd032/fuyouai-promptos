// src/lib/billing/with-subscription.ts
import "server-only";
import { NextResponse } from "next/server";
import { requireSubscription } from "./guard";

type Handler = (req: Request) => Promise<NextResponse>;

/**
 * 订阅系统总开关
 * - BILLING_ENABLED=0（默认）：完全放行（当前阶段）
 * - BILLING_ENABLED=1：启用订阅校验（上线/收费阶段）
 */
function isBillingEnabled() {
  return process.env.BILLING_ENABLED === "1";
}

export function withSubscription(
  handler: Handler,
  opts?: { scope?: string }
): Handler {
  return async function wrapped(req: Request) {
    // ✅ 订阅系统未启用：直接放行
    if (!isBillingEnabled()) {
      return handler(req);
    }

    const gate = await requireSubscription({ scope: opts?.scope });

    if (!gate.ok) {
      const status = gate.status; // 401 | 403

      return NextResponse.json(
        {
          ok: false,
          code: gate.code,
          error:
            status === 401
              ? "Please sign in."
              : "Trial ended. Please upgrade.",
        },
        { status }
      );
    }

    // ✅ 校验通过，继续原逻辑
    return handler(req);
  };
}
