// lib/promptos/core/resolve-core.ts

import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";
import {
  CORE_ENGINE_NAME,
  resolveCorePlan,
  type CoreKey,
  type PlanTier,
} from "./core-map";

type ResolveOk = {
  ok: true;
  coreKey: CoreKey;
  tier: PlanTier;        // 实际使用的 tier（可能降级）
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

function normalizeTier(tierRaw: unknown): PlanTier {
  return String(tierRaw ?? "basic").toLowerCase().trim() === "pro"
    ? "pro"
    : "basic";
}

/**
 * ✅ 解析 coreKey + tier -> promptKey
 * - 不再拼接猜测 candidates
 * - 只使用 core-map 中的确定映射（唯一真相源）
 * - 对 PROMPT_BANK 做存在性校验
 * - pro 失败自动降级 basic（符合你原本降级语义）
 */
export function resolveCorePromptKey(
  coreKeyRaw: unknown,
  tierRaw: unknown
): ResolveOk | ResolveFail {
  const coreKeyStr = String(coreKeyRaw ?? "").trim();
  const tierStr = String(tierRaw ?? "").trim();
  const tier = normalizeTier(tierRaw);

  const tried: string[] = [];

  // 1) coreKey 合法性校验
  const coreKey = coreKeyStr as CoreKey;
  if (!coreKeyStr || !(coreKey in CORE_ENGINE_NAME)) {
    return {
      ok: false,
      coreKey: coreKeyStr,
      tier: tierStr,
      error: `Unknown coreKey: "${coreKeyStr}"`,
      tried,
    };
  }

  // 2) 先用确定映射拿到“期望 key”
  try {
    const primary = resolveCorePlan(coreKey, tier);
    tried.push(primary.promptKey);

    if (hasKey(primary.promptKey)) {
      // ✅ 命中
      return {
        ok: true,
        coreKey,
        tier: primary.tier, // resolveCorePlan 会返回降级后的 tier
        promptKey: primary.promptKey,
        tried,
      };
    }

    // 3) 如果 tier=pro 且未命中，强制降级到 basic 再试一次（防止映射缺失）
    //    （即使 resolveCorePlan 已经降级过，也不影响；tried 会记录）
    if (tier === "pro") {
      const fallback = resolveCorePlan(coreKey, "basic");
      if (fallback.promptKey !== primary.promptKey) {
        tried.push(fallback.promptKey);
      }

      if (hasKey(fallback.promptKey)) {
        return {
          ok: true,
          coreKey,
          tier: "basic",
          promptKey: fallback.promptKey,
          tried,
        };
      }
    }

    // 4) （可选）是否允许 basic 自动升 pro？
    //    默认关闭：避免 basic 用户使用 pro prompt
    const ALLOW_BASIC_UPGRADE_TO_PRO = false;
    if (ALLOW_BASIC_UPGRADE_TO_PRO && tier === "basic") {
      const up = resolveCorePlan(coreKey, "pro");
      if (up.promptKey !== tried[tried.length - 1]) tried.push(up.promptKey);
      if (hasKey(up.promptKey)) {
        return {
          ok: true,
          coreKey,
          tier: "pro",
          promptKey: up.promptKey,
          tried,
        };
      }
    }

    // 5) 最终失败：给出明确诊断（包含 engineName，方便你排查生成器命名）
    const engineName = CORE_ENGINE_NAME[coreKey];
    return {
      ok: false,
      coreKey,
      tier,
      error:
        `PromptKey not found in PROMPT_BANK. ` +
        `coreKey="${coreKey}", tier="${tier}", engineName="${engineName}". ` +
        `Tried: ${tried.join(", ")}`,
      tried,
    };
  } catch (e: any) {
    // resolveCorePlan 本身找不到 mapping
    return {
      ok: false,
      coreKey: coreKeyStr,
      tier: tierStr,
      error: `Resolve mapping error: ${e?.message ?? String(e)}`,
      tried,
    };
  }
}
