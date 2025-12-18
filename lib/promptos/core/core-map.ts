// lib/promptos/core/core-map.ts
import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";

export type CoreKey =
  | "task_breakdown"
  | "cot_reasoning"
  | "content_builder"
  | "analytical_engine"
  | "task_tree";

export type PlanTier = "basic" | "pro";

type PromptKey = keyof typeof PROMPT_BANK;

export const CORE_PROMPT_BANK_KEY = {
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
} as const satisfies Record<CoreKey, Record<PlanTier, PromptKey>>;
