// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runPromptModule } from "@/lib/promptos/engine";
import { resolvePromptKey } from "@/lib/promptos/module-map.generated";

// -----------------------------
// CORS 配置（本地开发用）
// -----------------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000", // 本地前端
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// 处理预检请求（OPTIONS）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// 处理真正的业务请求（POST）
export async function POST(req: NextRequest) {
  try {
    const { moduleId, promptKey, userInput } = await req.json();

    // 1) 通过映射解析出真实的 promptKey
    const realKey = resolvePromptKey({ moduleId, promptKey });

    if (!realKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unknown moduleId / promptKey",
          moduleId,
          promptKey,
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // 2) 调用执行引擎（里面会用大模型，也可能降级返回占位内容）
    const result = await runPromptModule(realKey, userInput || "");

    // 如果引擎返回里也有 promptKey，避免覆盖我们这里的 realKey
    const { promptKey: _ignored, ...rest } = result as any;

    // 3) 统一返回：moduleId + 真实 promptKey + 引擎结果
    return NextResponse.json(
      {
        ok: true,
        moduleId,
        promptKey: realKey,
        ...rest, // { finalPrompt, modelOutput, ... }
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
