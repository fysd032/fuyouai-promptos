import { MODULE_TEMPLATES, PromptKey } from "./prompts.generated";

export function getModuleTemplate(promptKey: string): string {
  return MODULE_TEMPLATES[promptKey as PromptKey];
}
