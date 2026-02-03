import { frontendModuleIdMap } from "./frontendModuleIdMap";
import { runPromptModule } from "./engine";
import { resolvePromptKey } from "./module-map.generated";

export async function runEngine({
  moduleId,
  promptKey,
  engineType,
  mode,
  industryId,
  userInput,
  systemOverride,
  language,
}: {
  moduleId?: string;
  promptKey?: string;
  engineType?: string;
  mode?: string;
  industryId?: string | null;
  userInput: any;
  systemOverride?: string;
  language?: string;
}) {
  const requestId = crypto.randomUUID();

  const finalEngineType = (engineType ?? "deepseek").toString(); // ✅ 先跑稳，默认 deepseek
  const finalMode = (mode ?? "default").toString();

  const normalizedModuleId =
    moduleId && (frontendModuleIdMap as any)[moduleId]
      ? (frontendModuleIdMap as any)[moduleId]
      : moduleId;

  const realKey = resolvePromptKey({
    moduleId: normalizedModuleId,
    promptKey,
    engineType: finalEngineType,
    mode: finalMode,
  });

  if (!realKey) {
    return {
      ok: false,
      requestId,
      engineTypeRequested: finalEngineType,
      promptKeyResolved: null,
      error: `无法解析 promptKey，请检查：moduleId=${normalizedModuleId}, promptKey=${promptKey}`,
    };
  }

  const userInputStr =
    typeof userInput === "string"
      ? userInput
      : JSON.stringify(userInput ?? {}, null, 2);

  const result = await runPromptModule(realKey, userInputStr, finalEngineType, systemOverride);

  const out = String(result.modelOutput ?? "").trim();
  const ok = !result.error && out.length > 0;
  const outputMode = isClarificationOnly(out) ? "clarification" : "normal";

  return {
    ok,
    requestId,
    moduleId: normalizedModuleId,
    promptKey: realKey,
    engineTypeRequested: finalEngineType,
    engineTypeUsed: result.engineType,
    mode: outputMode,
    industryId: industryId ?? null,
    finalPrompt: result.finalPrompt,
    modelOutput: result.modelOutput,
    language,
    error: result.error ?? null,
  };

}

function isClarificationOnly(output: string) {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0 || lines.length > 3) return false;

  const marker = /^(\d+[\.\)]|[-*•])\s*/;
  for (const line of lines) {
    const text = line.replace(marker, "").trim();
    if (!text) return false;
    if (text.length > 200) return false;
    if (/[:：]/.test(text)) return false;
    if (/```|---|===|\||\{|\}|\[|\]/.test(text)) return false;
  }

  return true;
}
