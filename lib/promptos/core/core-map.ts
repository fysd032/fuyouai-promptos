// lib/promptos/core/core-map.ts

export type PlanTier = "basic" | "pro";

export type CoreKey =
  | "task_breakdown"
  | "cot_reasoning"
  | "content_builder"
  | "analytical_engine"
  | "task_tree";

/**
 * 每个 Core 的定义
 * prompts 明确是：按 PlanTier 映射 promptKey
 */
export type CoreDefinition = {
  id: CoreKey;
  label: string;
  description?: string;
  prompts: Partial<Record<PlanTier, string>>;
};

/**
 * coreKey -> engine 名称映射
 */
export const CORE_ENGINE_NAME: Record<CoreKey, string> = {
  task_breakdown: "task_breakdown_engine",
  cot_reasoning: "cot_reasoning_engine",
  content_builder: "content_builder_engine",
  analytical_engine: "analytical_engine",
  task_tree: "task_tree_engine",
};

/**
 * Core 定义表
 */
export const CORE_DEFINITIONS: Record<CoreKey, CoreDefinition> = {
  task_breakdown: {
    id: "task_breakdown",
    label: "任务拆解",
    prompts: {
      basic: "core.task_breakdown_engine.basic",
      pro: "core.task_breakdown_engine.pro",
    },
  },

  cot_reasoning: {
    id: "cot_reasoning",
    label: "CoT 推理",
    prompts: {
      basic: "core.cot_reasoning_engine.basic",
    },
  },

  content_builder: {
    id: "content_builder",
    label: "内容生成",
    prompts: {
      basic: "core.content_builder_engine.basic",
    },
  },

  analytical_engine: {
    id: "analytical_engine",
    label: "分析引擎",
    prompts: {
      basic: "core.analytical_engine.basic",
    },
  },

  task_tree: {
    id: "task_tree",
    label: "任务树",
    prompts: {
      basic: "core.task_tree_engine.basic",
    },
  },
};
