// lib/promptos/module-map.generated.ts
// 说明：从 modules.config.json 自动构建 moduleId → promptKey 的映射表

import modulesConfig from "./modules.config.json";

type ModuleConfig = {
  moduleId?: string;   // 标准字段
  module_id?: string;  // 兼容旧字段（如有的话）
  promptKey?: string;
  // 其他字段（name、description、use_case 等）我们暂时不关心
};

/**
 * MODULE_KEY_MAP:
 *   key   = moduleId  (比如 "a1", "b12", "c3", "e1"...)
 *   value = promptKey (比如 "A1-01", "B4-02", "C1-03", "E1-01"...)
 */
export const MODULE_KEY_MAP: Record<string, string> = (
  modulesConfig as ModuleConfig[]
).reduce((acc, item) => {
  // 兼容 moduleId / module_id 两种写法，优先 moduleId
  const moduleId = item.moduleId ?? item.module_id;
  const promptKey = item.promptKey;

  if (moduleId && promptKey) {
    acc[moduleId] = promptKey;
  }

  return acc;
}, {} as Record<string, string>);

/**
 * 小工具函数：
 * - 如果直接传 promptKey，则优先使用（认为调用方已经指定了最终 key）
 * - 否则用 moduleId 去映射表里找 promptKey
 */
export function resolvePromptKey(input: {
  moduleId?: string;
  promptKey?: string;
}): string | undefined {
  if (input.promptKey) return input.promptKey;
  if (input.moduleId) return MODULE_KEY_MAP[input.moduleId];
  return undefined;
}
