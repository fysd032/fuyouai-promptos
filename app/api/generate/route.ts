import { NextRequest, NextResponse } from "next/server";
import { runEngine } from "@/lib/promptos/run-engine";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
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
    const body = await req.json();

    const {
      moduleId,
      promptKey,
      engineType,
      mode,
      industryId,
      userInput,
    } = body;

    /**
     * ✅ 兜底：保证 runEngine 永远能收到值
     * （前端 / test.http / 外部请求 都不容易把你打挂）
     */
    const finalEngineType: string = engineType ?? "gemini";
    const finalMode: string = mode ?? "default";

    const result = await runEngine({
      moduleId,
      promptKey,
      engineType: finalEngineType,
      mode: finalMode,
      industryId,
      userInput,
    });

    /**
     * ⚠️ 关键点：
     * runEngine 内部已经返回 { ok: true, ... }
     * 这里绝对不要再包一层 ok
     */
    return NextResponse.json(result, {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error: any) {
    console.error("[/api/generate] Error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unknown error",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
