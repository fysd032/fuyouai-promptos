// lib/promptos/core/run-core-engine.ts
import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";
// ✅ 正确：引入真正跑模型的函数
import { runEngine } from "@/lib/promptos/run-engine";

export type EngineType = "deepseek" | "gemini";
export type Tier = "basic" | "pro";

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

export type RunCoreEngineParams = {
  coreKey: string;        // ✅ route.ts 传入的 coreKey
  tier: Tier;             // ✅ route.ts 传入的 tier
  promptKey: string;      // ✅ 解析后的 promptKey
  userInput: unknown;     // ✅ 可以是 string / object
  engineType?: EngineType | string;
  // 下面这几个如果你 route.ts 有就传；没有也不影响
  moduleId?: string;      // 不传的话默认用 coreKey
  industryId?: string | null;
  mode?: string;          // 不传的话默认用 tier
};

export type RunCoreEngineOk = {
  ok: true;
  requestId: string;
  coreKey: string;
  tier: Tier;
  moduleId: string;
  promptKey: string;
  engineTypeRequested: EngineType;
  engineTypeUsed: EngineType;
  mode: string;
  industryId: string | null;
  finalPrompt?: string;
  modelOutput?: string;
};

export type RunCoreEngineFail = {
  ok: false;
  requestId: string;
  error: string;
};

export type RunCoreEngineResult = RunCoreEngineOk | RunCoreEngineFail;

export async function runCoreEngine(opts: RunCoreEngineParams): Promise<RunCoreEngineResult> {
  const requestId = rid();

  const coreKey = String(opts.coreKey ?? "").trim();
  const tier = normalizeTier(opts.tier);
  const engineType = normalizeEngineType(opts.engineType);
  const moduleId = String(opts.moduleId ?? coreKey).trim();
  const mode = String(opts.mode ?? tier).toLowerCase().trim();
  const industryId = opts.industryId ?? null;

  if (!coreKey) {
    return { ok: false, requestId, error: "Missing coreKey" };
  }
  if (!moduleId) {
    return { ok: false, requestId, error: "Missing moduleId" };
  }

  const pk = String(opts.promptKey ?? "").trim() as keyof typeof PROMPT_BANK;
  if (!pk) {
    return { ok: false, requestId, error: "Missing promptKey" };
  }
  if (!PROMPT_BANK[pk]) {
    return { ok: false, requestId, error: `promptKey not found in PROMPT_BANK: ${String(pk)}` };
  }

  const userInputStr =
    typeof opts.userInput === "string"
      ? opts.userInput
      : JSON.stringify(opts.userInput ?? {}, null, 2);

  // ✅ 真正跑模型（由 runEngine 决定具体调用 deepseek/gemini）
  const result = await runEngine({
    moduleId,
    promptKey: String(pk),
    userInput: userInputStr,
    engineType,
    mode,
    industryId,
  });

  if (!result || (result as any).error) {
    return {
      ok: false,
      requestId,
      error: (result as any)?.error ?? "Unknown engine error",
    };
  }

  return {
    ok: true,
    requestId,
    coreKey,
    tier,
    moduleId,
    promptKey: String(pk),
    engineTypeRequested: engineType,
    engineTypeUsed: (result as any)?.engineType ?? engineType,
    mode,
    industryId,
    finalPrompt: (result as any)?.finalPrompt,
    modelOutput: (result as any)?.modelOutput ?? (result as any)?.output,
  };
}
