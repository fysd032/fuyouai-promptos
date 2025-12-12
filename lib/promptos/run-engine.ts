// lib/promptos/run-engine.ts
import { frontendModuleIdMap } from "./frontendModuleIdMap";
import { runPromptModule } from "./engine";
import { resolvePromptKey } from "./module-map.generated";

/**
 * PromptEngine - 系统大脑调度中心
 * 负责：
 * 1) 解析真实 promptKey（路由）
 * 2) 处理 userInput（对象→JSON）
 * 3) 调用 runPromptModule（原始 prompt + 模型执行器）
 */
export async function runEngine({
  moduleId,
  promptKey,
  engineType,
  mode,
  industryId,
  userInput
}: {
  moduleId?: string;
  promptKey?: string;
  engineType?: string;
  mode?: string;
  industryId?: string | null;
  userInput: any;
}) {
  /**
   * ✅ Step 0（新增）：前端 moduleId → 后端 frontModuleId 翻译
   * - m9 → researcher
   * - 如果已经是 frontModuleId，则原样兜底
   */
  const normalizedModuleId =
    moduleId && frontendModuleIdMap[moduleId]
      ? frontendModuleIdMap[moduleId]
      : moduleId;

  /**
   * Step 1：走你现有的 moduleId + promptKey 路由
   * ⚠️ 注意：这里传入的是“翻译后的 moduleId”
   */
  const realKey = resolvePromptKey({
    moduleId: normalizedModuleId,
    promptKey,
    engineType,
    mode,
  });

  if (!realKey) {
    throw new Error(
      `无法解析 promptKey，请检查：moduleId=${normalizedModuleId}, promptKey=${promptKey}`
    );
  }

  /**
   * Step 2：处理用户输入
   * - 如果前端传来对象，我们转成 JSON 格式
   * - 保持兼容旧行为
   */
  let userInputStr = "";
  if (typeof userInput === "string") {
    userInputStr = userInput;
  } else {
    userInputStr = JSON.stringify(userInput, null, 2);
  }

  /**
   * Step 3：调用 PromptOS 执行器
   */
const result = await runPromptModule(
  realKey,
  userInputStr,
  finalEngineType // 👈 你之前兜底过的 engineType
);

  /**
   * Step 4：统一返回
   */
  return {
    ok: true,
    moduleId: normalizedModuleId, // ✅ 返回真实执行用的 moduleId
    promptKey: realKey,
    engineType,
    mode,
    industryId,
    ...result,
  };
}
