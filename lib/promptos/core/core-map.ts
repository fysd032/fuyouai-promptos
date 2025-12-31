// lib/promptos/core/core-map.ts

export type PlanTier = "basic" | "pro";

export type CoreKey =
  | "task_breakdown"
  | "cot_reasoning"
  | "content_builder"
  | "analytical_engine"
  | "task_tree";

/**
 * coreKey -> engine 名称映射（可用于埋点/日志/未来计费）
 */
export const CORE_ENGINE_NAME: Record<CoreKey, string> = {
  task_breakdown: "task_breakdown_engine",
  cot_reasoning: "cot_reasoning_engine",
  content_builder: "content_builder_engine",
  analytical_engine: "analytical_engine",
  task_tree: "task_tree_engine",
};

/**
 * 每个 Core 的定义（这里先以 promptKey 为核心）
 * 后面你做价格体系，也可以在这里加 price / limits / features
 */
export type CoreDefinition = {
  id: CoreKey;
  label: string;
  description?: string;
  prompts: Partial<Record<PlanTier, string>>;
};

export const CORE_DEFINITIONS: Record<CoreKey, CoreDefinition> = {
  task_breakdown: {
    id: "task_breakdown",
    label: "任务拆解",
    prompts: {
      basic: "core.task_breakdown_engine.pro",
      pro: "core.task_breakdown_engine.pro",
    },
  },

  cot_reasoning: {
    id: "cot_reasoning",
    label: "CoT 推理",
    prompts: {
      basic: "core.cot_reasoning_engine.pro",
      // pro 未来再加
    },
  },

  content_builder: {
    id: "content_builder",
    label: "内容生成",
    prompts: {
      basic: "core.content_builder_engine.pro",
    },
  },

  analytical_engine: {
    id: "analytical_engine",
    label: "分析引擎",
    prompts: {
      basic: "core.analytical_engine.pro",
    },
  },

  task_tree: {
    id: "task_tree",
    label: "任务树",
    prompts: {
      basic: "core.task_tree_engine.pro",
    },
  },
};

/**
 * ✅ 兼容旧代码：一些地方还在用 CORE_PROMPT_BANK_KEY
 * 结构：coreKey -> tier -> promptKey
 */
export const CORE_PROMPT_BANK_KEY: Record<
  CoreKey,
  Partial<Record<PlanTier, string>>
> = Object.fromEntries(
  Object.entries(CORE_DEFINITIONS).map(([k, def]) => [k, def.prompts])
) as Record<CoreKey, Partial<Record<PlanTier, string>>>;

/**
 * ✅ 统一入口：返回 promptKey + 是否降级 + 实际使用 tier
 * 规则：优先 tier；如果 tier 没配，自动降级到 basic
 */
export function resolveCorePlan(coreKey: CoreKey, tier: PlanTier) {
  const prompts = CORE_PROMPT_BANK_KEY[coreKey];

  const exact = prompts?.[tier];
  const fallback = prompts?.basic;

  const promptKey = exact ?? fallback;
  if (!promptKey) {
    throw new Error(
      `Prompt mapping not found. coreKey="${coreKey}", tier="${tier}". Check CORE_DEFINITIONS/CORE_PROMPT_BANK_KEY.`
    );
  }

  const degraded = !exact; // 没找到 exact 就说明发生了降级
  const usedTier: PlanTier = degraded ? "basic" : tier;

  return { promptKey, degraded, tier: usedTier };
}
