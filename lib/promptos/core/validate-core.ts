// lib/promptos/core/validate-core.ts
import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";
import { CORE_DEFINITIONS, type PlanTier } from "./core-map";

function hasPromptKey(k: string): boolean {
  return Object.prototype.hasOwnProperty.call(PROMPT_BANK as any, k);
}

/**
 * 启动时校验：
 * - core-map 里的 promptKey 是否真实存在于 PROMPT_BANK
 */
export function validateCoreDefinitions() {
  for (const def of Object.values(CORE_DEFINITIONS)) {
    const tierMap = def.prompts;

    for (const [tier, promptKey] of Object.entries(tierMap) as [
      PlanTier,
      string
    ][]) {
      if (!promptKey) continue;

      if (!hasPromptKey(promptKey)) {
        throw new Error(
          `[CoreValidate] Missing promptKey "${promptKey}" for core="${def.id}", tier="${tier}"`
        );
      }
    }
  }
}
