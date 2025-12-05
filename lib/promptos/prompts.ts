// lib/promptos/prompts.ts
// PromptOS · Kernel - 使用外部 registry（支持 N 个模块）

export type PromptModule = {
  module_id: string;
  module_name: string;
  module_type: string;
  module_description: string;

  role: string;
  goal: string[];
  steps: string[];
  output_format: string;
  quality_check: string[];

  human_tone_enabled?: boolean;
  human_tone_level?: string;
  use_modules?: string[];

  input_requirements?: Record<string, any>;
  use_cases?: string[];
};

// 由脚本生成的模块注册表
import { modulesRegistry } from "./registry.generated";

/**
 * 将模块 JSON 转为 prompt 字符串
 */
export function getModulePrompt(
  moduleConfig: PromptModule,
  userInput: any,
  options: any = {}
) {
  return `
# 角色
${moduleConfig.role}

# 目标
${moduleConfig.goal.map((g) => `- ${g}`).join("\n")}

# 输入信息
${JSON.stringify(userInput, null, 2)}

# 生成步骤
${moduleConfig.steps.map((s) => `- ${s}`).join("\n")}

# 输出格式
${moduleConfig.output_format}

# 质量校验
${moduleConfig.quality_check.map((q) => `- ${q}`).join("\n")}
`;
}

/**
 * 统一 Prompt 生成器：buildFinalPrompt
 */
export function buildFinalPrompt(
  promptKey: string,
  userInput: any,
  options: any = {}
): string {
  const moduleConfig = modulesRegistry[promptKey];
  if (!moduleConfig) {
    throw new Error(`Prompt module not found: ${promptKey}`);
  }
  return getModulePrompt(moduleConfig, userInput, options);
}

export function listPromptKeys(): string[] {
  return Object.keys(modulesRegistry);
}
