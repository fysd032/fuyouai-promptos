// lib/promptos/core/run-core-engine.ts

import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";
// ✅ 真正跑模型的函数
import { runEngine } from "@/lib/promptos/run-engine";

export type EngineType = "deepseek" | "gemini";
export type Tier = "basic" | "pro";

// ✅ 为了兼容你当前 /api/core/run 的调用：传的是 moduleId + mode
export type RunCoreEngineParams = {
  // 兼容字段（你 route.ts 里现在用的是 moduleId）
  moduleId: string;

  // 你想新增也可以传，但不是必填（不影响现有调用）
  coreKey?: string;

  // 兼容字段：route.ts 里传的是 promptKey（resolve 后的）
  promptKey: string;

  // 兼容字段：route.ts 里传 engineType
  engineType?: EngineType | string;

  // 兼容字段：route.ts 里传 mode: tier
  mode?: Tier | string;

  // 兼容字段：route.ts 里传 industryId
  industryId?: any;

  // 兼容字段：route.ts 里传 userInput（可能 string，也可能对象）
  userInput: unknown;
};

function rid() {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {}
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeEngineType(raw: unknown): EngineType {
  const t = String(raw ?? "deepseek").toLowerCase().trim();
  return t === "gemini" ? "gemini" : "deepseek";
}

function normalizeTier(raw: unknown): Tier {
  const t = String(raw ?? "basic").toLowerCase().trim();
  return t === "pro" ? "pro" : "basic";
}

export async function runCoreEngine(opts: RunCoreEngineParams) {
  const requestId = rid();

  const engineType = normalizeEngineType((opts as any)?.engineType);
  const mode = normalizeTier((opts as any)?.mode);

  const moduleId = String(opts?.moduleId ?? "").trim();
  const promptKeyRaw = String(opts?.promptKey ?? "").trim();

  if (!moduleId) {
    return {
      ok: false as const,
      requestId,
      error: "Missing moduleId",
    };
  }

  if (!promptKeyRaw) {
    return {
      ok: false as const,
      requestId,
      error: "Missing promptKey",
    };
  }

  // ✅ 验证 PROMPT_BANK 里是否存在该 promptKey
  const pk = promptKeyRaw as keyof typeof PROMPT_BANK;
  if (!(pk in PROMPT_BANK)) {
    return {
      ok: false as const,
      requestId,
      error: `promptKey not found in PROMPT_BANK: ${promptKeyRaw}`,
    };
  }

  const userInputStr =
    typeof opts.userInput === "string"
      ? opts.userInput
      : JSON.stringify(opts.userInput ?? {}, null, 2);

  // ✅ 真正跑模型
  const result = await runEngine({
    moduleId,
    promptKey: String(pk),
    userInput: userInputStr,
    engineType,
    mode,
    industryId: (opts as any)?.industryId ?? null,
  });

  if (!result || (result as any)?.error || (result as any)?.ok === false) {
    return {
      ok: false as const,
      requestId,
      error: (result as any)?.error ?? "Unknown engine error",
      engineTypeRequested: engineType,
      mode,
    };
  }

  return {
    ok: true as const,
    requestId,
    moduleId,
    promptKey: String(pk),
    engineTypeRequested: engineType,
    engineTypeUsed: (result as any)?.engineType ?? engineType,
    mode,
    industryId: (opts as any)?.industryId ?? null,
    finalPrompt: (result as any)?.finalPrompt,
    modelOutput: (result as any)?.modelOutput ?? (result as any)?.output,
  };
}
