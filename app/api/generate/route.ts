// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runPromptModule } from "@/lib/promptos/engine";

// -----------------------------
// CORS 设置（关键！！！）
// -----------------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000", // 开发模式用
  // 如需允许所有可改为 "*"
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// -----------------------------
// 处理 OPTIONS 预检请求
// -----------------------------
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// -----------------------------
// 处理 POST 请求（真正业务逻辑）
// -----------------------------
export async function POST(req: NextRequest) {
  try {
    const { promptKey, userInput } = await req.json();

    if (!promptKey) {
      return NextResponse.json(
        { ok: false, error: "promptKey is required" },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await runPromptModule(promptKey, userInput || "");

    return NextResponse.json(
      {
        ok: true,
        ...result,
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
