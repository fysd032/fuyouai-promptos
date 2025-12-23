import { NextRequest, NextResponse } from "next/server";
import { runEngine } from "@/lib/promptos/run-engine";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await runEngine({
      moduleId: body.moduleId,        // 可选，但推荐前端传
      promptKey: body.promptKey,      // A1-01
      engineType: body.engineType,    // 可选
      mode: body.mode,                // 可选
      industryId: body.industryId ?? null,
      userInput: body.userInput,      // 用户输入
    });

    if (!result.ok) {
      return NextResponse.json(result, {
        status: 400,
        headers: CORS_HEADERS,
      });
    }

    return NextResponse.json(result, {
      status: 200,
      headers: CORS_HEADERS,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? String(err),
      },
      {
        status: 500,
        headers: CORS_HEADERS,
      }
    );
  }
}
