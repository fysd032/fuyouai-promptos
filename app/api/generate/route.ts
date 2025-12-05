// app/api/generate/route.ts

import { NextResponse } from "next/server";
import { buildFinalPrompt } from "@/lib/promptos/prompts";

export async function POST(req: Request) {
  const body = await req.json();
  const { promptKey, userInput, options } = body;

  // 从 PromptOS 内核生成最终提示词
  const finalPrompt = buildFinalPrompt(promptKey, userInput, options);

  return NextResponse.json({
    promptKey,
    finalPrompt
    // 后续你再接模型输出即可
  });
}
