import { MODULE_TEMPLATES } from "./prompts.generated";

/**
 * Stable API for engine layer.
 * DO NOT call MODULE_TEMPLATES directly from engine.ts
 */
export function getModuleTemplate(promptKey: string): string | undefined {
  const key = (promptKey || "").trim();
  return (MODULE_TEMPLATES as Record<string, string>)[key];
}
// lib/promptos/prompts.ts

export type PromptModule = {
  id: string;                 // 例如 A1-01-writing-generator
  title?: string;
  description?: string;
  // 允许挂任意字段（因为你是从 json 导入，字段可能很多）
  [k: string]: any;
};
