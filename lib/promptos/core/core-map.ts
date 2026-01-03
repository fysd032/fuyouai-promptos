// lib/promptos/core/core-map.ts

import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";

/**
 * ✅ 从 PROMPT_BANK 派生出“合法 promptKey 联合类型”
 * 只要你在 CORE_DEFINITIONS 里写错 key，TS 会直接报错（最强约束）。
 */
export type PromptKey = keyof typeof PROMPT_BANK;

export type PlanTier = "basic" | "pro";

export type CoreKey =
  | "task_breakdown"
  | "cot_reasoning"
  | "content_builder"
  | "analytical_engine"
  | "task_tree";

/**
 * coreKey -> engine 名称映射（用于埋点/日志/计费维度）
 * 注意：engineName 不一定等于 promptKey 的中段命名，promptKey 以 PROMPT_BANK 为准
 */
export const CORE_ENGINE_NAME: Record<CoreKey, string> = {
  task_breakdown: "task_breakdown_engine",
  cot_reasoning: "cot_reasoning_engine",
  content_builder: "content_builder_engine",
  analytical_engine: "analytical_engine",
  task_tree: "task_tree_engine",
};

export type CoreDefinition = {
  id: CoreKey;
  label: string;
  description?: string;

  /**
   * ✅ 强类型：promptKey 必须存在于 PROMPT_BANK
   * pro 可缺省（用于自然降级到 basic）
   */
  prompts: Partial<Record<PlanTier, PromptKey>>;
};

/**
 * ✅ 核心映射表（单一事实源）
 * 规则：
 * - basic 必填（推荐）
 * - pro 可选；缺省时 resolve 会自动降级到 basic
 */
export const CORE_DEFINITIONS: Record<CoreKey, CoreDefinition> = {
  task_breakdown: {
    id: "task_breakdown",
    label: "任务拆解",
    prompts: {
      basic: "core.task_breakdown.basic",
      pro: "core.task_breakdown.pro",
    },
  },

  cot_reasoning: {
    id: "cot_reasoning",
    label: "CoT 推理",
    prompts: {
      basic: "core.cot_reasoning.basic",
      pro: "core.cot_reasoning.pro",
    },
  },

  content_builder: {
    id: "content_builder",
    label: "内容生成",
    prompts: {
      basic: "core.content_builder.basic",
      pro: "core.content_builder.pro",
    },
  },

  analytical_engine: {
    id: "analytical_engine",
    label: "分析引擎",
    prompts: {
      basic: "core.analytical_engine.basic",
      pro: "core.analytical_engine.pro",
    },
  },

  task_tree: {
    id: "task_tree",
    label: "任务树",
    prompts: {
      /**
       * ✅ 当前没有 pro，就不要写 pro，避免“假 key”造成校验/上线踩坑
       * 未来真有了再加：
       * pro: "core.task_tree.pro",
       */
      basic: "core.task_tree.basic",
    },
  },
} as const;

/**
 * ✅ 兼容旧代码：一些地方还在用 CORE_PROMPT_BANK_KEY
 * 结构：coreKey -> tier -> promptKey
 */
export const CORE_PROMPT_BANK_KEY: Record<
  CoreKey,
  Partial<Record<PlanTier, PromptKey>>
> = Object.fromEntries(
  Object.entries(CORE_DEFINITIONS).map(([k, def]) => [k, def.prompts])
) as Record<CoreKey, Partial<Record<PlanTier, PromptKey>>>;

/**
 * ✅ resolve 结果类型（稳定、可复用）
 */
export type ResolvedCorePlan = {
  coreKey: CoreKey;
  promptKey: PromptKey;
  degraded: boolean; // 是否从 pro 降级到 basic
  tier: PlanTier; // 实际使用的 tier
  engineName: string; // 用于埋点/日志
  label: string; // 可用于 UI 或日志
};

/**
 * ✅ 统一入口：返回 promptKey + 是否降级 + 实际使用 tier
 * 规则：
 * - 优先 tier
 * - tier 没配：降级到 basic
 * - basic 也没配：抛错（配置错误，建议启动期/CI 抓出来）
 */
export function resolveCorePlan(coreKey: CoreKey, tier: PlanTier): ResolvedCorePlan {
  const def = CORE_DEFINITIONS[coreKey];
  const prompts = def?.prompts;

  const exact = prompts?.[tier];
  const fallback = prompts?.basic;

  const promptKey = exact ?? fallback;
  if (!promptKey) {
    throw new Error(
      `Prompt mapping not found. coreKey="${coreKey}", tier="${tier}". ` +
        `Check CORE_DEFINITIONS (basic/pro).`
    );
  }

  const degraded = !exact;
  const usedTier: PlanTier = degraded ? "basic" : tier;

  return {
    coreKey,
    promptKey,
    degraded,
    tier: usedTier,
    engineName: CORE_ENGINE_NAME[coreKey],
    label: def.label,
  };
}

/**
 * ✅ 启动期校验：确保 CORE_DEFINITIONS 的 key 都真实存在于 PROMPT_BANK
 * 用法：
 * - dev：启动时调用一次
 * - CI：build 前跑一次
 */
export function assertCorePromptMapping() {
  const missing: Array<{ coreKey: CoreKey; tier: PlanTier; promptKey: string }> = [];

  (Object.keys(CORE_DEFINITIONS) as CoreKey[]).forEach((coreKey) => {
    const prompts = CORE_DEFINITIONS[coreKey].prompts;

    (Object.keys(prompts) as PlanTier[]).forEach((tier) => {
      const key = prompts[tier];
      if (!key) return;

      if (!Object.prototype.hasOwnProperty.call(PROMPT_BANK, key)) {
        missing.push({ coreKey, tier, promptKey: String(key) });
      }
    });

    // 建议 basic 至少存在
    if (!prompts.basic) {
      missing.push({ coreKey, tier: "basic", promptKey: "(missing basic mapping)" });
    }
  });

  if (missing.length) {
    const msg = missing.map((m) => `${m.coreKey}.${m.tier} -> ${m.promptKey}`).join("\n");
    throw new Error(
      `Invalid CORE_DEFINITIONS prompt mapping (not found in PROMPT_BANK or missing basic):\n${msg}`
    );
  }

  return true;
}

/**
 * ✅ 辅助：给 UI/日志用
 */
export function listCoreDefinitions(): CoreDefinition[] {
  return (Object.keys(CORE_DEFINITIONS) as CoreKey[]).map((k) => CORE_DEFINITIONS[k]);
}

export function getCoreDefinition(coreKey: CoreKey): CoreDefinition {
  return CORE_DEFINITIONS[coreKey];
}
