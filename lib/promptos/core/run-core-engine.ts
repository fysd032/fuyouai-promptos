// lib/promptos/core/run-core-engine.ts
import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";
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
  // ✅ 新要求（你现在的 /api/core/run 需要它）
  coreKey: string;
  tier: Tier;
  promptKey: string;
  userInput: string;

  // ✅ 兼容老/现有调用（route.ts 可能还在传这些）
  moduleId?: string;
  engineType?: EngineType | string;
  mode?: Tier | string; // 一般等同 tier
  industryId?: string | null;
};

export type RunCoreEngineResult =
  | {
      ok: true;
      requestId: string;
      coreKey: string;
      tier: Tier;
      moduleId: string;
      promptKey: string;
      engineTypeRequested: EngineType;
      engineTypeUsed: EngineType;
      mode: Tier;
      industryId: string | null;
      finalPrompt?: string;
      modelOutput?: string;
      raw?: unknown;
    }
  | {
      ok: false;
      requestId: string;
      coreKey?: string;
      tier?: Tier;
      promptKey?: string;
      error: string;
      raw?: unknown;
    };

export async function runCoreEngine(opts: RunCoreEngineParams): Promise<RunCoreEngineResult> {
  const requestId = rid();

  const coreKey = String(opts.coreKey ?? "").trim();
  const tier = normalizeTier(opts.tier);

  if (!coreKey) {
    return { ok: false, requestId, error: "Missing coreKey" };
  }

  const engineType = normalizeEngineType(opts.engineType);
  const mode = normalizeTier(opts.mode ?? tier);

  const pk = String(opts.promptKey ?? "") as keyof typeof PROMPT_BANK;
  if (!pk || !PROMPT_BANK[pk]) {
    return {
      ok: false,
      requestId,
      coreKey,
      tier,
      promptKey: String(opts.promptKey ?? ""),
      error: `promptKey not found in PROMPT_BANK: ${String(pk)}`,
    };
  }

  const userInputStr =
    typeof opts.userInput === "string"
      ? opts.userInput
      : JSON.stringify(opts.userInput ?? {}, null, 2);

  const moduleId = String(opts.moduleId ?? coreKey); // ✅ 默认用 coreKey 当 moduleId
  const industryId = opts.industryId ?? null;

  try {
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
        coreKey,
        tier,
        promptKey: String(pk),
        error: (result as any)?.error ?? "Unknown engine error",
        raw: result,
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
      raw: result,
    };
  } catch (e: any) {
    return {
      ok: false,
      requestId,
      coreKey,
      tier,
      promptKey: String(pk),
      error: e?.message ?? String(e),
    };
  }
}
