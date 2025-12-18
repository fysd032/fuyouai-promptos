import { CORE_PROMPT_BANK_KEY, type CoreKey, type PlanTier } from "./core-map";
import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";

// 如果你没有 PROMPT_BANK，而是 getPrompt，也可以改成 getPrompt(promptKey) 判断

export function validateCorePromptMap() {
  const coreEntries = Object.entries(CORE_PROMPT_BANK_KEY) as Array<
    [CoreKey, Record<PlanTier, string>]
  >;

  for (const [coreKey, tierMap] of coreEntries) {
    const tierEntries = Object.entries(tierMap) as Array<[PlanTier, string]>;

    for (const [tier, promptKey] of tierEntries) {
      if (!PROMPT_BANK[promptKey]) {
        throw new Error(
          `Missing promptKey in PROMPT_BANK: coreKey=${coreKey}, tier=${tier}, promptKey=${promptKey}`
        );
      }
    }
  }
}
