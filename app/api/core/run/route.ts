// app/api/core/run/route.ts
import { NextResponse } from "next/server";

type CoreRunBody = {
  coreKey?: string;
  tier?: "basic" | "pro";
  input?: string;
  userInput?: string;
  text?: string;
  prompt?: string;

  // 这些可能会从前端传来，但我们“忽略”，不参与输出
  history?: unknown;
  messages?: unknown;
  [k: string]: unknown;
};

export const runtime = "nodejs"; // 默认就是 nodejs；写上更明确
export const dynamic = "force-dynamic"; // 避免被缓存（可选）

function json(data: any, init?: number | ResponseInit) {
  const responseInit: ResponseInit =
    typeof init === "number" ? { status: init } : init ?? {};
  return NextResponse.json(data, {
    ...responseInit,
    headers: {
      "Cache-Control": "no-store",
      ...(responseInit.headers || {}),
    },
  });
}

export async function POST(req: Request) {
  try {
    const body: CoreRunBody = await req.json().catch(() => ({} as CoreRunBody));

    // ✅ 统一提取“用户输入”
    const userText =
      (body.userInput ??
        body.input ??
        body.text ??
        body.prompt ??
        "") as string;

    const coreKey = (body.coreKey ?? "") as string;
    const tier = (body.tier ?? "basic") as "basic" | "pro";

    // ✅ 基本校验
    if (!userText || !String(userText).trim()) {
      return json(
        { ok: false, error: "缺少输入：请传 userInput / input / text / prompt" },
        400
      );
    }

    // ✅ 不回传 history / received，不“再回复历史问题”
    // 现在先用“回显输出”证明链路（你后续要接真实 AI，就改这里）
    const output = `ECHO: ${String(userText)}`;

    return json({
      ok: true,
      requestId: `core-${Date.now()}`,
      output,
      // 如果你将来要用 coreKey/tier 做分流，这里已经拿到了，但不必回传
      // coreKey,
      // tier,
    });
  } catch (e: any) {
    return json(
      { ok: false, error: e?.message ?? "unknown error" },
      500
    );
  }
}
