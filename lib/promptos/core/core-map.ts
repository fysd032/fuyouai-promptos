// lib/promptos/core/core-map.ts

export type PlanTier = "basic" | "pro";

/**
 * 前端 → 后端传的功能 key（协议层 coreKey）
 */
export type CoreKey =
  | "task_breakdown"
  | "cot_reasoning"
  | "content_builder"
  | "analytical_engine"
  | "task_tree";

/**
 * 单条 Core 的定义
 * engineId 必须与 prompt-bank.generated.ts 里 key 的 slug 完全一致：
 *   promptKey = `core.${engineId}.${tier}`
 */
export type CoreDefinition = {
  engineId: string;
  label: string;        // 给人看的英文名/短名（可选但建议有）
  description: string;  // 给人看的说明（可选但建议有）
};

export const CORE_MAP: Record<CoreKey, CoreDefinition> = {
  task_breakdown: {
    engineId: "task_breakdown_engine",
    label: "Task Breakdown",
    description: "将任务拆解为可执行的 Step-by-Step 结构",
  },
  cot_reasoning: {
    engineId: "cot_reasoning",
    label: "CoT Reasoning",
    description: "多路径推理与逻辑验证",
  },
  content_builder: {
    engineId: "content_builder",
    label: "Content Builder",
    description: "结构化内容生成与长文构建",
  },
  analytical_engine: {
    engineId: "analytical_engine",
    label: "Analytical Engine",
    description: "多维度分析与决策支持",
  },
  task_tree: {
    engineId: "task_tree",
    label: "Task Tree",
    description: "复杂任务的层级拆分与依赖建模",
  },
} as const;

/**
 * 兼容旧 import（如果 validate-core.ts / route.ts 还在用这个名字）
 */
export const CORE_PROMPT_BANK_KEY = CORE_MAP;

/**
 * resolve-core.ts 只需要 engineName 的话，用这个更方便
 */
export const CORE_ENGINE_NAME: Record<CoreKey, string> = Object.fromEntries(
  Object.entries(CORE_MAP).map(([k, v]) => [k, v.engineId])
) as Record<CoreKey, string>;
