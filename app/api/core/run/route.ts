import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));

    // 统一取用户输入（兼容你前端多种写法）
    const userInput =
      body?.userInput ??
      body?.input ??
      body?.text ??
      body?.prompt ??
      "";

    // 👉 这里是“假逻辑”（当前阶段用来验证 UI → API → UI 是否跑通）
    // 后面你只需要把下面这段替换成“真实 Core 逻辑调用”即可
    const output = `【Core Mock 输出】\n你输入的是：${String(userInput)}`;

    return NextResponse.json({
      ok: true,
      output,
      debug: {
        receivedBody: body,
        timestamp: Date.now(),
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: e?.message ?? "unknown error",
      },
      { status: 500 }
    );
  }
}
