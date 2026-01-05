import "server-only";
import { NextResponse } from "next/server";
import { requireSubscription } from "./guard";

type Handler = (req: Request) => Promise<NextResponse>;

export function withSubscription(
  handler: Handler,
  opts?: { scope?: string }
): Handler {
  return async function wrapped(req: Request) {
    const gate = await requireSubscription({ scope: opts?.scope });

    if (!gate.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: gate.code,
          error: "Trial ended. Please upgrade.",
        },
        { status: gate.status }
      );
    }

    // ✅ 通过订阅校验，继续执行原逻辑
    return handler(req);
  };
}
