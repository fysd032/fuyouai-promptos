// lib/promptos/prompts.ts
import { MODULE_TEMPLATES } from "./prompts.generated";

/**
 * Stable API for engine layer.
 * DO NOT call MODULE_TEMPLATES directly from engine.ts
 */
export function getModuleTemplate(promptKey: string): string | undefined {
  const key = (promptKey || "").trim();
  return (MODULE_TEMPLATES as Record<string, string>)[key];
}

/**
 * Prompt module shape (loaded from json).
 * 兼容旧字段 id，以及新字段 module_id / module_name ...
 */
export type PromptModule = Record<string, any> & {
  /** 旧字段（有些模块可能没有） */
  id?: string;

  /** 新字段（你 public/modules/*.json 里常见） */
  module_id?: string;
  module_name?: string;
  module_type?: string;
  module_description?: string;
};

/** 统一取模块 id（下游要用 id 时用这个） */
export function getPromptModuleId(m: PromptModule): string {
  return String(m.id ?? m.module_id ?? "");
}
