// lib/promptos/core/core-map.ts

import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";

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

/**
 * 每个 Core 的定义（以 promptKey 为核心真相源）
 */
export type CoreDefinition = {
  id: CoreKey;
  label: string;
  description?: string;
  prompts: Partial<Record<PlanTier, string>>;
};

/**
 * ✅ 关键：这里的 promptKey 必须 100% 存在于 PROMPT_BANK
 * 对齐你当前的 prompt-bank.generated.ts 实际 keys：
 * - core.task_breakdown_engine.basic / pro
 * - core.cot_reasoning.basic / pro
 * - core.content_builder.basic / pro
 * - core.analytical_engine.basic / pro
 * - core.task_tree.basic (无 pro)
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
      // ✅ PROMPT_BANK 中实际是 core.cot_reasoning.basic / pro
      basic: "core.cot_reasoning.basic",
      pro: "core.cot_reasoning.pro",
    },
  },

  content_builder: {
    id: "content_builder",
    label: "内容生成",
    prompts: {
      // ✅ PROMPT_BANK 中实际是 core.content_builder.basic / pro
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
      // ✅ PROMPT_BANK 中实际是 core.task_tree.basic（当前没有 pro）
      basic: "core.task_tree.basic",
      pro: "core.task_tree.pro",
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
 * 规则：
 * - 优先 tier
 * - 若 tier 没配：降级到 basic
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

/**
 * ✅（强烈建议）启动期校验：确保 CORE_DEFINITIONS 里的 key 都真实存在于 PROMPT_BANK
 * 用法：在 app 启动时调用一次（dev/CI 最有用）
 */
export function assertCorePromptMapping() {
  const missing: Array<{ coreKey: CoreKey; tier: PlanTier; promptKey: string }> =
    [];

  (Object.keys(CORE_DEFINITIONS) as CoreKey[]).forEach((coreKey) => {
    const prompts = CORE_DEFINITIONS[coreKey].prompts;
    (Object.keys(prompts) as PlanTier[]).forEach((tier) => {
      const key = prompts[tier];
      if (key && !Object.prototype.hasOwnProperty.call(PROMPT_BANK as any, key)) {
        missing.push({ coreKey, tier, promptKey: key });
      }
    });
  });

  if (missing.length) {
    const msg = missing
      .map((m) => `${m.coreKey}.${m.tier} -> ${m.promptKey}`)
      .join("\n");
    throw new Error(
      `Invalid CORE_DEFINITIONS prompt mapping (not found in PROMPT_BANK):\n${msg}`
    );
  }

  return true;
}
