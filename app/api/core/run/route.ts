// app/api/core/run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { CORE_PROMPT_BANK_KEY, type CoreKey, type PlanTier } from "@/lib/promptos/core/core-map";
import { getPrompt } from "@/lib/promptos/prompt-bank.generated";
import { runEngine } from "@/lib/promptos/run-engine";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

function makeRequestId() {
  try {
    // Edge/Node 兼容
    // @ts-ignore
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
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

function json(status: number, body: any, extraHeaders?: Record<string, string>) {
  return NextResponse.json(body, { status, headers: { ...corsHeaders, ...(extraHeaders ?? {}) } });
}

export async function POST(req: NextRequest) {
  const requestId = makeRequestId();
  const startedAt = Date.now();

  try {
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return json(400, { ok: false, requestId, error: { code: "INVALID_JSON", message: "Invalid JSON body" } });
    }

    const coreKey = body?.coreKey;
    const tier = body?.tier;

    // ✅ 兼容：input 或 userInput
    const userInput =
      typeof body?.userInput === "string"
        ? body.userInput
        : typeof body?.input === "string"
          ? body.input
          : "";

    if (!isCoreKey(coreKey)) {
      return json(400, { ok: false, requestId, error: { code: "INVALID_COREKEY", message: "Invalid coreKey" } });
    }
    if (!isTier(tier)) {
      return json(400, { ok: false, requestId, error: { code: "INVALID_TIER", message: "Invalid tier" } });
    }
    if (!userInput.trim()) {
      return json(400, { ok: false, requestId, error: { code: "INPUT_REQUIRED", message: "input/userInput required" } });
    }

    const promptBankKey = CORE_PROMPT_BANK_KEY[coreKey][tier];
    const record = getPrompt(promptBankKey);

    if (!record?.content?.trim()) {
      return json(404, {
        ok: false,
        requestId,
        error: { code: "PROMPT_NOT_FOUND", message: `Prompt not found for ${coreKey}/${tier}` },
        meta: { coreKey, tier, promptKeyUsed: promptBankKey },
      });
    }

    // ✅ 执行（先固定 deepseek 最稳；后续再做路由/灰度）
    const engineResult: any = await runEngine({
      promptKey: promptBankKey,
      userInput,
      engineType: "deepseek",
      mode: "core",
      moduleId: coreKey,
    } as any);

    // ✅ 强制统一 output 字段（兼容 runEngine 不同返回）
    const output =
      engineResult?.output ??
      engineResult?.text ??
      engineResult?.aiOutput ??
      engineResult?.modelOutput ??
      engineResult?.result ??
      "";

    const latencyMs = Date.now() - startedAt;

    // ✅ 标准返回（前端永远只用 output）
    return json(200, {
      ok: true,
      requestId,
      output: String(output),
      meta: {
        coreKey,
        tier,
        promptKeyUsed: promptBankKey,
        latencyMs,
      },
      // 如果你想保留调试信息可放这，但建议后续用环境变量控制
      // debug: engineResult,
    });
  } catch (err: any) {
    console.error("[/api/core/run] error:", err);
    return json(500, {
      ok: false,
      requestId,
      error: { code: "INTERNAL_ERROR", message: err?.message || "Unknown error" },
    });
  }
}
