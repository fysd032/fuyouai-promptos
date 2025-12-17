import { NextRequest, NextResponse } from "next/server";
import { CORE_PROMPT_BANK_KEY, type CoreKey, type PlanTier } from "@/lib/promptos/core/core-map";
import { getPrompt } from "@/lib/promptos/prompt-bank.generated";
import { runEngine } from "@/lib/promptos/run-engine";

/**
 * ✅ 如果你要从别的域名访问（Vite 前端），这里先放宽一点：
 * 你上线后建议改成白名单域名（你的前端域名）
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

function isCoreKey(v: unknown): v is CoreKey {
  return (
    v === "task_breakdown" ||
    v === "cot_reasoning" ||
    v === "content_builder" ||
    v === "analytical_engine" ||
    v === "task_tree"
  );
}

function isTier(v: unknown): v is PlanTier {
  return v === "basic" || v === "pro";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { coreKey, tier, userInput } = body ?? {};

    if (!isCoreKey(coreKey)) {
      return NextResponse.json({ ok: false, error: "Invalid coreKey" }, { status: 400, headers: corsHeaders });
    }
    if (!isTier(tier)) {
      return NextResponse.json({ ok: false, error: "Invalid tier" }, { status: 400, headers: corsHeaders });
    }
    if (typeof userInput !== "string" || !userInput.trim()) {
      return NextResponse.json({ ok: false, error: "userInput required" }, { status: 400, headers: corsHeaders });
    }

    // ✅ 通过 coreKey + tier 找到 prompt-bank 的 key
    const promptBankKey = CORE_PROMPT_BANK_KEY[coreKey][tier];
    const record = getPrompt(promptBankKey);

    if (!record?.content?.trim()) {
      return NextResponse.json(
        {
          ok: false,
          error: `Prompt not found for ${coreKey}/${tier}`,
          debug: { promptBankKey },
        },
        { status: 404, headers: corsHeaders }
      );
    }

    /**
     * ✅ 复用你现有 runEngine，不改变你的后端架构
     * 我们把 promptKey 当成 promptBankKey 传进去（你也可以让 runEngine 直接吃 prompt 文本，下一步再优化）
     */
    const result = await runEngine({
      promptKey: promptBankKey,
      userInput,
      engineType: "deepseek", // 你也可以从 body 里传，但先固定最稳
      mode: "core",
      moduleId: coreKey,
    } as any);

    return NextResponse.json(
      {
        ok: true,
        ...result,
        coreKey,
        tier,
        promptKeyUsed: promptBankKey,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error("[/api/core/generate] error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Unknown error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
