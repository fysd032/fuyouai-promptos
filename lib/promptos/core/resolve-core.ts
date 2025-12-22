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

export function resolveCorePromptKey(coreKeyRaw: unknown, tierRaw: unknown): ResolveOk | ResolveFail {
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

  // ✅ 多候选：按你的项目常见命名方式都试一遍
  const candidates = [
    // 1) 最简单：coreKey.tier
    `${coreKey}.${tier}`,

    // 2) core 前缀
    `core.${coreKey}.${tier}`,

    // 3) engine 后缀（你之前用过）
    `${coreKey}_engine.${tier}`,
    `core.${coreKey}_engine.${tier}`,

    // 4) 三段式（你之前报错风格）
    `core.${coreKey}_engine.${tier}`,
    `core.${coreKey}_engine_name.${tier}`,

    // 5) 如果你的 PROMPT_BANK 是按目录生成的，可能是 / 分隔（这里也兼容）
    `${coreKey}/${tier}`,
    `core/${coreKey}/${tier}`,
    `${coreKey}_engine/${tier}`,
    `core/${coreKey}_engine/${tier}`,
  ];

  for (const k of candidates) {
    tried.push(k);
    if ((PROMPT_BANK as any)[k]) {
      return { ok: true, coreKey, tier, promptKey: k, tried };
    }
  }

  // ✅ 如果都不匹配，返回详细 tried 列表，方便你直接看到应该改哪边
  return {
    ok: false,
    coreKey,
    tier,
    error: `Unknown promptKey for coreKey="${coreKey}", tier="${tier}". Tried: ${tried.join(", ")}`,
    tried,
  };
}
