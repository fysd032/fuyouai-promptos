// lib/promptos/core/run-core-engine.ts

import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";
import { runEngine } from "@/lib/promptos/run-engine";

/**
 * 支持的模型类型
 */
type EngineType = "deepseek" | "gemini";

/**
 * 请求 ID 生成
 */
function rid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/**
 * Core Engine 入参（与 /api/core/run 对齐）
 */
export type RunCoreEngineParams = {
  moduleId: string;
  coreKey: string;               // 预留：目前不参与计算，但必须存在
  tier: "basic" | "pro";         // 预留：目前不参与计算，但必须存在
  promptKey: string;
  userInput: unknown;

  engineType?: EngineType;
  mode?: string;
  industryId?: string | null;
};

/**
 * Core Engine 主执行函数
 * ⚠️ 注意：所有 return 都必须在这个函数内部（这是你之前 build 失败的根因）
 */
export async function runCoreEngine(opts: RunCoreEngineParams) {
  const requestId = rid();

  const engineType: EngineType =
    String(opts.engineType ?? "deepseek").toLowerCase() === "gemini"
      ? "gemini"
      : "deepseek";

  const mode = String(opts.mode ?? "basic").toLowerCase();

  // ---------- promptKey 校验 ----------
  const pk = String(opts.promptKey) as keyof typeof PROMPT_BANK;
  if (!PROMPT_BANK[pk]) {
    return {
      ok: false as const,
      requestId,
      error: `promptKey not found in PROMPT_BANK: ${String(pk)}`,
    };
  }

  // ---------- userInput 统一转 string ----------
  const userInputStr =
    typeof opts.userInput === "string"
      ? opts.userInput
      : JSON.stringify(opts.userInput ?? {}, null, 2);

  // ---------- 真正调用模型 ----------
  let result: any;
  try {
    result = await runEngine({
      moduleId: opts.moduleId,
      promptKey: String(pk),
      userInput: userInputStr,
      engineType,
      mode,
      industryId: opts.industryId ?? null,
    });
  } catch (err) {
    return {
      ok: false as const,
      requestId,
      error:
        err instanceof Error
          ? err.message
          : "runEngine execution failed",
    };
  }

  if (!result || (result as any).error) {
    return {
      ok: false as const,
      requestId,
      error: (result as any)?.error ?? "Unknown engine error",
    };
  }

  // ---------- 成功返回 ----------
  return {
    ok: true as const,
    requestId,

    moduleId: opts.moduleId,
    coreKey: opts.coreKey,
    tier: opts.tier,

    promptKey: String(pk),
    engineTypeRequested: engineType,
    engineTypeUsed: (result as any)?.engineType ?? engineType,
    mode,
    industryId: opts.industryId ?? null,

    finalPrompt: (result as any)?.finalPrompt ?? null,
    modelOutput:
      (result as any)?.modelOutput ??
      (result as any)?.output ??
      null,
  };
}
