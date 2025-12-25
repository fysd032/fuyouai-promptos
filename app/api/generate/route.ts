import { NextResponse } from "next/server";
import { runPromptModule } from "@/lib/promptos/engine";

export async function POST(req: Request) {
  try {
    // 1️⃣ 读取前端传参
    const body = await req.json();
    const {
      promptKey,
      userInput,
      engineType = "deepseek",
    } = body || {};

    if (!promptKey || !userInput) {
      return NextResponse.json(
        { ok: false, error: "Missing promptKey or userInput" },
        { status: 400 }
      );
    }

    // 2️⃣ 真正调用你已经写好的引擎
    const result = await runPromptModule(
      promptKey,
      userInput,
      engineType
    );

    // 3️⃣ 返回给前端
    return NextResponse.json({
      ok: !result.error,
      ...result,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}
