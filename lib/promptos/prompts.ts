import { MODULE_TEMPLATES } from "./prompts.generated";

/**
 * Stable API for engine layer.
 * DO NOT call MODULE_TEMPLATES directly from engine.ts
 */
export function getModuleTemplate(promptKey: string): string | undefined {
  const key = (promptKey || "").trim();
  return (MODULE_TEMPLATES as Record<string, string>)[key];
}
