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

function hasKey(k: string): boolean {
  return Object.prototype.hasOwnProperty.call(PROMPT_BANK as any, k);
}

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

  // ✅ canonical engineName（由 core-map 维护）
  const engineName = CORE_ENGINE_NAME[coreKey];

  // ✅ 多候选：同时兼容 coreKey / engineName 的各种命名
  const candidatesRaw = [
    // 1) coreKey.tier
    `${coreKey}.${tier}`,
    `core.${coreKey}.${tier}`,

    // 2) engine 后缀
    `${coreKey}_engine.${tier}`,
    `core.${coreKey}_engine.${tier}`,

    // 3) 使用 core-map 的映射名（关键）
    `${engineName}.${tier}`,
    `core.${engineName}.${tier}`,

    // 4) 目录分隔（兼容生成器按目录拼 key）
    `${coreKey}/${tier}`,
    `core/${coreKey}/${tier}`,
    `${coreKey}_engine/${tier}`,
    `core/${coreKey}_engine/${tier}`,
    `${engineName}/${tier}`,
    `core/${engineName}/${tier}`,

    // 5) 兼容你历史出现过的奇怪命名（可选但安全）
    `core.${coreKey}_enginein.${tier}`,
    `${coreKey}_enginein.${tier}`,
  ];

  const candidates = Array.from(new Set(candidatesRaw));

  for (const k of candidates) {
    tried.push(k);
    // ✅ 不用 truthy 判断，避免值为空导致误判
    if (hasKey(k)) {
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
