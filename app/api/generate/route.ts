// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runPromptModule } from "@/lib/promptos/engine";

// -----------------------------
// CORS 设置（关键！！！）
// -----------------------------
const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

// -----------------------------
// 模块 ID → 模板 key 映射表（关键!!!）
// -----------------------------
const MODULE_KEY_MAP: Record<string, string> = {
  m1: "A1-01",   // 写作大师 Writing Master
  // 后续的模块再加：
  // m2: "A1-02",
  // m3: "A1-03",
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

    // ⭐⭐ 前端的 m1 转换成后端的真实模板 key ⭐⭐
    const realKey = MODULE_KEY_MAP[promptKey] ?? promptKey;

    const result = await runPromptModule(realKey, userInput || "");

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
