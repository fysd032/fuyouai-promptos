// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runPromptModule } from "@/lib/promptos/engine";

/**
 * 统一的模块执行 API：
 * 前端传 { promptKey, userInput }
 * 调用后端执行引擎 runPromptModule
 * 返回 { ok, promptKey, finalPrompt, modelOutput }
 */
export async function POST(req: NextRequest) {
  try {
    const { promptKey, userInput } = await req.json();

    if (!promptKey) {
      return NextResponse.json(
        { ok: false, error: "promptKey is required" },
        { status: 400 }
      );
    }

    const result = await runPromptModule(promptKey, userInput || "");

    return NextResponse.json({
      ok: true,
      ...result, // { promptKey, finalPrompt, modelOutput }
    });
  } catch (error: any) {
    console.error("[/api/generate] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Internal Server Error",
      },
      { status: 500 }
    );
  }
}
