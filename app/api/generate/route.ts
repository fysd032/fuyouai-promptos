// app/api/generate/route.ts
import { NextResponse } from "next/server";
import { buildFinalPrompt } from "@/lib/promptos/prompts";

export async function POST(req: Request) {
  const body = await req.json();
  const { promptKey, userInput, options } = body;

  const finalPrompt = buildFinalPrompt(promptKey, userInput, options);

  return NextResponse.json({
    promptKey,
    finalPrompt,
  });
}

// 方便在浏览器里直接 GET 看路由是否存在
export async function GET() {
  return NextResponse.json({
    message: "PromptOS generate API is ready. Please POST JSON body.",
  });
}
