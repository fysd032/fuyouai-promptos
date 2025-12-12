// lib/promptos/run-engine.ts
import { frontendModuleIdMap } from "./frontendModuleIdMap";
import { runPromptModule } from "./engine";
import { resolvePromptKey } from "./module-map.generated";

/**
 * 调度器：只做路由/映射/兜底，然后调用执行器
 */
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
  const finalEngineType = (engineType ?? "gemini").toString();
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
    throw new Error(
      `无法解析 promptKey，请检查：moduleId=${normalizedModuleId}, promptKey=${promptKey}`
    );
  }

  const userInputStr =
    typeof userInput === "string"
      ? userInput
      : JSON.stringify(userInput ?? {}, null, 2);

const result = await runPromptModule(realKey, userInputStr, finalEngineType);


  const { promptKey: _pk, engineType: _et, ...rest } = result;

return {
  ok: true,
  moduleId: normalizedModuleId,
  promptKey: realKey,
  engineType: finalEngineType,
  mode: finalMode,
  industryId: industryId ?? null,
  ...rest,
};

  };

