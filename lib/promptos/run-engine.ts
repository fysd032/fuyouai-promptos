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
}: {
  moduleId?: string;
  promptKey?: string;
  engineType?: string;
  mode?: string;
  industryId?: string | null;
  userInput: any;
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

  const result = await runPromptModule(realKey, userInputStr, finalEngineType);

  return {
    ok: true,
    requestId,
    moduleId: normalizedModuleId,
    promptKey: realKey,
    engineTypeRequested: finalEngineType,
    engineTypeUsed: result.engineType,
    mode: finalMode,
    industryId: industryId ?? null,
    finalPrompt: result.finalPrompt,
    modelOutput: result.modelOutput,
    error: result.error ?? null,
  };
}
