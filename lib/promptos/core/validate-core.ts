import { CORE_PROMPT_BANK_KEY } from "./core-map";
import { PROMPT_BANK } from "../prompt-bank.generated";

let validated = false;

export function validateCorePromptBank() {
  if (validated) return;

  for (const coreKey in CORE_PROMPT_BANK_KEY) {
    for (const tier in CORE_PROMPT_BANK_KEY[coreKey]) {
      const promptKey = CORE_PROMPT_BANK_KEY[coreKey][tier];
      if (!PROMPT_BANK[promptKey]) {
        throw new Error(
          `[CorePromptValidationError] Prompt key not found: ${promptKey}`
        );
      }
    }
  }

  validated = true;
  console.log("[CorePromptValidation] OK");
}
