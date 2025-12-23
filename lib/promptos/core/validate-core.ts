// lib/promptos/core/validate-core.ts
import { CORE_PROMPT_BANK_KEY, type CoreKey, type PlanTier } from "./core-map";
import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";

export function validateCorePromptMap() {
  // ✅ 关键：不要用 for...in（会变 string）
  for (const coreKey of Object.keys(CORE_PROMPT_BANK_KEY) as CoreKey[]) {
    const tierMap = CORE_PROMPT_BANK_KEY[coreKey];

    for (const tier of Object.keys(tierMap) as PlanTier[]) {
      const promptKey = tierMap[tier];

      if (!PROMPT_BANK[promptKey]) {
        throw new Error(
          `Missing promptKey in PROMPT_BANK: coreKey=${coreKey}, tier=${tier}, promptKey=${promptKey}`
        );
      }
    }
  }
}
