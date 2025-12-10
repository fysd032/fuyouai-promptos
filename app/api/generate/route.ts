// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runPromptModule } from "@/lib/promptos/engine";
import { resolvePromptKey } from "@/lib/promptos/module-map.generated";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000", // 本地前端
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    const { moduleId, promptKey, userInput } = await req.json();

    // 通过映射解析出真实的 promptKey
    const realKey = resolvePromptKey({ moduleId, promptKey });

    if (!realKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unknown moduleId/promptKey",
          moduleId,
          promptKey,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // 调用执行引擎（里面会用 Gemini / OpenAI 等模型）
    const result = await runPromptModule(realKey, userInput || "");

    return NextResponse.json(
      {
        ok: true,
        moduleId,
        promptKey: realKey,
        ...result, // { finalPrompt, modelOutput, ... }
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("[/api/generate] Error:", error);
    return NextResponse.json(
      {
        ok: false,
        error: error?.message ?? "Internal Server Error",
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
