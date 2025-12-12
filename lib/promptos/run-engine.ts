// lib/promptos/run-engine.ts
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
  moduleId?: string;           // m1..m31 或 frontModuleId
  promptKey?: string;          // 允许直接传 A1-01（最终态）
  engineType?: string;         // "gemini" | "deepseek"
  mode?: string;
  industryId?: string | null;
  userInput: any;
}) {
  const finalEngineType = (engineType ?? "gemini").toString();
  const finalMode = (mode ?? "default").toString();

  // 1) 若传 m1..m31 → 映射到 frontModuleId
  const normalizedModuleId =
    moduleId && (frontendModuleIdMap as Record<string, string>)[moduleId]
      ? (frontendModuleIdMap as Record<string, string>)[moduleId]
      : moduleId;

  // 2) 解析最终 promptKey（A1-xx / E5-xx）
  const realKey = resolvePromptKey({
    moduleId: normalizedModuleId,
    promptKey,
    engineType: finalEngineType,
    mode: finalMode,
  } as any);

  if (!realKey) {
    throw new Error(
      `无法解析 promptKey，请检查：moduleId=${normalizedModuleId}, promptKey=${promptKey}`
    );
  }

  // 3) userInput 统一成 string
  const userInputStr =
    typeof userInput === "string"
      ? userInput
      : JSON.stringify(userInput ?? {}, null, 2);

  // 4) 调用执行器（真正调用模型在 engine.ts）
  const result = await runPromptModule(realKey, userInputStr, finalEngineType);

  // 5) 统一返回结构
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
}
