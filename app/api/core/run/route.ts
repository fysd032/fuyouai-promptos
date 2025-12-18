import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1️⃣ 解析请求体（容错）
    const body = await req.json().catch(() => ({}));

    // 2️⃣ 统一取用户输入（前端怎么传都能接住）
    const userText =
      body?.userInput ??
      body?.input ??
      body?.text ??
      body?.prompt ??
      "";

    // 3️⃣ 返回稳定结构（前端只认 output）
    return NextResponse.json({
      ok: true,
      requestId: "core-echo-v1",
      output: userText || "（空输入）",
    });
  } catch (err: any) {
    console.error("Core API error:", err);

    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? "Unknown error",
      },
      { status: 500 }
    );
  }
}
