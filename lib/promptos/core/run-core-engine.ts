// lib/promptos/core/run-core-engine.ts
import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";
// ✅ 正确：引入真正跑模型的函数
import { runEngine } from "@/lib/promptos/run-engine";

type EngineType = "deepseek" | "gemini";

function rid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function runCoreEngine(opts: {
  moduleId: string;              // coreKey
  promptKey: keyof typeof PROMPT_BANK;
  engineType?: EngineType | string;
  mode?: string;                 // basic / pro
  industryId?: string | null;
  userInput: any;
}) {
  const requestId = rid();

  const engineType = String(opts.engineType ?? "deepseek").toLowerCase();
  const mode = String(opts.mode ?? "basic").toLowerCase();

  const pk = String(opts.promptKey) as keyof typeof PROMPT_BANK;
  if (!PROMPT_BANK[pk]) {
    return {
      ok: false as const,
      requestId,
      error: `promptKey not found in PROMPT_BANK: ${String(pk)}`,
    };
  }

  const userInputStr =
    typeof opts.userInput === "string"
      ? opts.userInput
      : JSON.stringify(opts.userInput ?? {}, null, 2);

  // ✅ 关键：这里才是真正跑模型
const result = await runEngine({
  moduleId: opts.moduleId,
  promptKey: String(pk),
  userInput: userInputStr,
  engineType,
  mode,
  industryId: opts.industryId ?? null,
});

  if (!result || (result as any).error) {
    return {
      ok: false as const,
      requestId,
      error: (result as any)?.error ?? "Unknown engine error",
    };
  }

  return {
    ok: true as const,
    requestId,
    moduleId: opts.moduleId,
    promptKey: String(pk),
    engineTypeRequested: engineType,
    engineTypeUsed: (result as any)?.engineType ?? engineType,
    mode,
    industryId: opts.industryId ?? null,
    finalPrompt: (result as any)?.finalPrompt,
    modelOutput: (result as any)?.modelOutput ?? (result as any)?.output,
  };
}
