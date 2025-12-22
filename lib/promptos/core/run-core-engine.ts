// lib/promptos/core/run-core-engine.ts

import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";
import { runEngine } from "@/lib/promptos/run-engine";

/** 支持的模型类型 */
export type EngineType = "deepseek" | "gemini";

/** tier（你现在 Core 用的是这个） */
export type Tier = "basic" | "pro";

/** 统一生成 requestId */
function rid() {
  try {
    // Edge / Node18+
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {}
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

/** Core Engine 入参（API 层要严格对齐这个） */
export type RunCoreEngineParams = {
  coreKey: string;          // 核心方法 key（如 task_decomposition）
  tier: Tier;               // basic / pro
  promptKey: string;        // 具体 prompt key
  userInput: string;        // 用户输入（最终一定是 string）
  engineType?: EngineType;  // 可选，默认 deepseek
  mode?: string;            // 可选
  moduleId?: string;        // 可选
  industryId?: string | null;
};

/** 成功返回 */
export type RunCoreEngineSuccess = {
  ok: true;
  requestId: string;
  moduleId?: string;
  coreKey: string;
  tier: Tier;
  promptKey: string;
  engineTypeRequested: EngineType;
  engineTypeUsed: EngineType;
  mode: string;
  industryId: string | null;
  finalPrompt?: string;
  modelOutput?: string;
};

/** 失败返回 */
export type RunCoreEngineError = {
  ok: false;
  requestId: string;
  error: string;
};

export type RunCoreEngineResult =
  | RunCoreEngineSuccess
  | RunCoreEngineError;

/**
 * ✅ 真正跑 Core Engine 的函数
 */
export async function runCoreEngine(
  opts: RunCoreEngineParams
): Promise<RunCoreEngineResult> {
  const requestId = rid();

  try {
    /* ------------------ 基础参数标准化 ------------------ */

    const engineType: EngineType =
      opts.engineType === "gemini" ? "gemini" : "deepseek";

    const mode = String(opts.mode ?? opts.tier ?? "basic");

    /* ------------------ promptKey 校验 ------------------ */

    const pk = String(opts.promptKey) as keyof typeof PROMPT_BANK;

    if (!PROMPT_BANK[pk]) {
      return {
        ok: false,
        requestId,
        error: `promptKey not found in PROMPT_BANK: ${String(pk)}`,
      };
    }

    /* ------------------ userInput 标准化 ------------------ */

    const userInputStr =
      typeof opts.userInput === "string"
        ? opts.userInput
        : JSON.stringify(opts.userInput ?? {}, null, 2);

    /* ------------------ 真正调用模型 ------------------ */

    const result = await runEngine({
      moduleId: opts.moduleId ?? opts.coreKey,
      promptKey: String(pk),
      userInput: userInputStr,
      engineType,
      mode,
      industryId: opts.industryId ?? null,
    });

    if (!result || (result as any).error) {
      return {
        ok: false,
        requestId,
        error: (result as any)?.error ?? "Unknown engine error",
      };
    }

    /* ------------------ 成功返回 ------------------ */

    return {
      ok: true,
      requestId,
      moduleId: opts.moduleId ?? opts.coreKey,
      coreKey: opts.coreKey,
      tier: opts.tier,
      promptKey: String(pk),
      engineTypeRequested: engineType,
      engineTypeUsed: (result as any)?.engineType ?? engineType,
      mode,
      industryId: opts.industryId ?? null,
      finalPrompt: (result as any)?.finalPrompt,
      modelOutput:
        (result as any)?.modelOutput ??
        (result as any)?.output,
    };
  } catch (err) {
    return {
      ok: false,
      requestId,
      error:
        err instanceof Error ? err.message : String(err),
    };
  }
}
