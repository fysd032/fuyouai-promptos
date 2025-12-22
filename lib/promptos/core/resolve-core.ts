// lib/promptos/core/resolve-core.ts
import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";
import { CORE_ENGINE_NAME, type CoreKey, type PlanTier } from "./core-map";

type ResolveOk = {
  ok: true;
  coreKey: CoreKey;
  tier: PlanTier;
  promptKey: string;
  tried: string[];
};

type ResolveFail = {
  ok: false;
  coreKey: string;
  tier: string;
  error: string;
  tried: string[];
};

export function resolveCorePromptKey(
  coreKeyRaw: unknown,
  tierRaw: unknown
): ResolveOk | ResolveFail {
  const coreKey = String(coreKeyRaw ?? "").trim() as CoreKey;
  const tier: PlanTier =
    String(tierRaw ?? "basic").toLowerCase().trim() === "pro" ? "pro" : "basic";

  const tried: string[] = [];

  if (!coreKey || !(coreKey in CORE_ENGINE_NAME)) {
    return {
      ok: false,
      coreKey: String(coreKeyRaw ?? ""),
      tier: String(tierRaw ?? ""),
      error: `Unknown coreKey: "${String(coreKeyRaw ?? "")}"`,
      tried,
    };
  }

  // ✅ canonical engineName（你项目里 core-map 维护的映射名）
  const engineName = CORE_ENGINE_NAME[coreKey]; // 例如：task_breakdown_engine / core.task_breakdown_engine 等（取决于你的 core-map）

  // ✅ 候选 key：同时兼容 coreKey 与 engineName 两套命名
  const candidatesRaw = [
    // 1) 最简单：coreKey.tier
    `${coreKey}.${tier}`,
    `core.${coreKey}.${tier}`,

    // 2) engine 后缀（你历史/当前报错风格）
    `${coreKey}_engine.${tier}`,
    `core.${coreKey}_engine.${tier}`,

    // 3) 使用 core-map 的映射名（关键！）
    `${engineName}.${tier}`,
    `core.${engineName}.${tier}`,

    // 4) 目录分隔（兼容生成器按目录拼 key 的情况）
    `${coreKey}/${tier}`,
    `core/${coreKey}/${tier}`,
    `${coreKey}_engine/${tier}`,
    `core/${coreKey}_engine/${tier}`,
    `${engineName}/${tier}`,
    `core/${engineName}/${tier}`,
  ];

  // ✅ 去重（避免 tried 重复干扰排查）
  const candidates = Array.from(new Set(candidatesRaw));

  for (const k of candidates) {
    tried.push(k);
    // ✅ 关键修复：不要用 truthy 判断，直接判断 key 是否存在
    if (k in (PROMPT_BANK as any)) {
      return { ok: true, coreKey, tier, promptKey: k, tried };
    }
  }

  return {
    ok: false,
    coreKey,
    tier,
    error: `Unknown promptKey for coreKey="${coreKey}", tier="${tier}". Tried: ${tried.join(
      ", "
    )}`,
    tried,
  };
}
