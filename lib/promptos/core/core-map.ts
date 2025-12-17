// lib/promptos/core/core-map.ts
export type CoreKey =
  | "task_breakdown"
  | "cot_reasoning"
  | "content_builder"
  | "analytical_engine"
  | "task_tree";

export type PlanTier = "basic" | "pro";

/**
 * ✅ 这里的 value 必须等于 prompt-bank.generated.ts 里面的 key
 * 如果你生成出来的 key 不长这样，就把它改成 generated 文件里的真实 key
 */
export const CORE_PROMPT_BANK_KEY: Record<
  CoreKey,
  Record<PlanTier, string>
> = {
  task_breakdown: {
    basic: "core.task_breakdown_engine.basic",
    pro: "core.task_breakdown_engine.pro",
  },
  cot_reasoning: {
    basic: "core.cot_reasoning.basic",
    pro: "core.cot_reasoning.pro",
  },
  content_builder: {
    basic: "core.content_builder.basic",
    pro: "core.content_builder.pro",
  },
  analytical_engine: {
    basic: "core.analytical_engine.basic",
    pro: "core.analytical_engine.pro",
  },
  task_tree: {
    basic: "core.task_tree_mpt_engine.basic",
    pro: "core.task_tree_mpt_engine.pro",
  },
};
