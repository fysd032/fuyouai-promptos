import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // 先做“回显测试”：你传什么，我就把关键信息拼到 output 里返回
    const userText =
      body?.userInput ?? body?.input ?? body?.text ?? body?.prompt ?? "";

    return NextResponse.json({
      ok: true,
      requestId: "echo-core",
      received: body, // 你发来的完整 payload（方便你排查）
      output: `ECHO: ${String(userText)}`,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "unknown error" },
      { status: 500 }
    );
  }
}
