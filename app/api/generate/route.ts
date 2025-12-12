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
    const {
      moduleId,
      promptKey,
      engineType,
      mode,
      industryId,
      userInput
    } = await req.json();

    // 基础校验
    if (!engineType || !mode) {
      return NextResponse.json(
        {
          ok: false,
          error: "engineType 和 mode 为必填字段",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // 调用统一大脑 runEngine
    const result = await runEngine({
      moduleId,
      promptKey,
      engineType,
      mode,
      industryId,
      userInput,
    });

    return NextResponse.json(
      {
        ok: true,
        ...result, // finalPrompt + modelOutput + promptKey
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
