// lib/promptos/core/core-map.ts

export type PlanTier = "basic" | "pro";

export type CoreKey =
  | "task_breakdown"
  | "cot_reasoning"
  | "content_builder"
  | "analytical_engine"
  | "task_tree";

/**
 * ✅ 为未来收费/Pro预留：每个 tier 的配置
 * 现在你只用 promptKey，其他字段后面再加（不影响现在）
 */
export type CorePlanConfig = {
  promptKey: string;
  // 预留扩展位（以后收费时可以用到）
  // priceCents?: number;
  // engineType?: string;
  // maxTokens?: number;
  // enabled?: boolean;
};

export type CoreDefinition = {
  id: CoreKey;
  label: string;
  description?: string;
  plans: Partial<Record<PlanTier, CorePlanConfig>>;
};

/**
 * coreKey -> engine 名称映射（你现在的保留）
 */
export const CORE_ENGINE_NAME: Record<CoreKey, string> = {
  task_breakdown: "task_breakdown_engine",
  cot_reasoning: "cot_reasoning_engine",
  content_builder: "content_builder_engine",
  analytical_engine: "analytical_engine",
  task_tree: "task_tree_engine",
};

/**
 * ✅ Core 定义表（把 prompts 换成 plans）
 */
export const CORE_DEFINITIONS: Record<CoreKey, CoreDefinition> = {
  task_breakdown: {
    id: "task_breakdown",
    label: "任务拆解",
    plans: {
      basic: { promptKey: "core.task_breakdown_engine.basic" },
      pro: { promptKey: "core.task_breakdown_engine.pro" },
    },
  },

  cot_reasoning: {
    id: "cot_reasoning",
    label: "CoT 推理",
    plans: {
      basic: { promptKey: "core.cot_reasoning_engine.basic" },
      // pro 以后要做再加
    },
  },

  content_builder: {
    id: "content_builder",
    label: "内容生成",
    plans: {
      basic: { promptKey: "core.content_builder_engine.basic" },
    },
  },

  analytical_engine: {
    id: "analytical_engine",
    label: "分析引擎",
    plans: {
      basic: { promptKey: "core.analytical_engine.basic" },
    },
  },

  task_tree: {
    id: "task_tree",
    label: "任务树",
    plans: {
      basic: { promptKey: "core.task_tree_engine.basic" },
    },
  },
};

/**
 * ✅ 统一解析：自动降级到 basic
 * - tier=pro 且 pro 不存在 -> 用 basic
 * - basic 也不存在 -> 返回 null（表示配置缺失）
 */
export function resolveCorePlan(
  coreKey: CoreKey,
  tier: PlanTier
): CorePlanConfig | null {
  const def = CORE_DEFINITIONS[coreKey];
  const plan = def?.plans?.[tier] ?? def?.plans?.basic ?? null;
  return plan;
}

/**
 * ✅ 兼容旧代码：你原来 coreRun.ts 还在 import CORE_PROMPT_BANK_KEY
 * 保持结构：coreKey -> tier -> promptKey
 * （注意：这里不做降级，降级在 resolveCorePlan 里做）
 */
export const CORE_PROMPT_BANK_KEY: Record<
  CoreKey,
  Partial<Record<PlanTier, string>>
> = Object.fromEntries(
  Object.entries(CORE_DEFINITIONS).map(([k, def]) => [
    k,
    Object.fromEntries(
      Object.entries(def.plans).map(([tier, cfg]) => [tier, cfg.promptKey])
    ),
  ])
) as Record<CoreKey, Partial<Record<PlanTier, string>>>;
// ✅ 方案2：统一入口（支持 pro 自动降级到 basic）
// 返回：promptKey + 是否降级 degraded + 实际使用的 tier
export function resolveCorePlan(coreKey: CoreKey, tier: PlanTier) {
  const prompts = CORE_PROMPT_BANK_KEY?.[coreKey];

  // 先拿目标 tier；没有则自动降级到 basic
  const exact = prompts?.[tier];
  const fallback = prompts?.basic;

  const promptKey = exact ?? fallback;

  if (!promptKey) {
    // basic 也没有，就说明 mapping 没配
    throw new Error(
      `Prompt mapping not found for coreKey="${coreKey}". Check CORE_DEFINITIONS / CORE_PROMPT_BANK_KEY.`
    );
  }

  const degraded = !exact; // 没拿到 exact 就说明降级了
  const usedTier: PlanTier = degraded ? "basic" : tier;

  return {
    promptKey,
    degraded,
    tier: usedTier,
  };
}
