import { runPromptModule } from "@/lib/promptos/engine";

export async function runCoreEngine(opts: {
  moduleId: string;       // coreKey
  promptKey: string;      // 已经 resolve 好的 promptKey（强制使用）
  engineType?: string;    // deepseek / gemini
  mode?: string;          // basic / pro
  industryId?: string | null;
  userInput: any;
}) {
  const requestId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  const engineType = (opts.engineType ?? "deepseek").toLowerCase();
  const mode = (opts.mode ?? "basic").toLowerCase();

  // ✅ 可选：这里你也可以做 engineType 白名单
  if (engineType !== "deepseek" && engineType !== "gemini") {
    return {
      ok: false,
      requestId,
      error: `Unsupported engineType="${engineType}"`,
    };
  }

  const userInputStr =
    typeof opts.userInput === "string"
      ? opts.userInput
      : JSON.stringify(opts.userInput ?? {}, null, 2);

  // ✅ 关键：不再 resolvePromptKey，不走 module-map.generated
  const result = await runPromptModule(opts.promptKey, userInputStr, engineType);

  const ok = !result?.error && typeof result?.modelOutput === "string";

  return {
    ok,
    requestId,
    moduleId: opts.moduleId,
    promptKey: opts.promptKey,
    engineTypeRequested: engineType,
    engineTypeUsed: result?.engineType ?? engineType,
    mode,
    industryId: opts.industryId ?? null,
    finalPrompt: result?.finalPrompt ?? null,
    modelOutput: result?.modelOutput ?? "",
    error: result?.error ?? null,
  };
}
