// lib/promptos/prompt-index.ts
import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";

/**
 * PROMPT_INDEX 的 key 形态： `${engine}.${tier}`
 * 例： "task_breakdown_engine.basic" -> "core.task_breakdown_engine.basic"
 */
export const PROMPT_INDEX: Record<string, string> = Object.keys(PROMPT_BANK).reduce(
  (acc, fullKey) => {
    // fullKey: "core.task_breakdown_engine.basic"
    const shortKey = fullKey.startsWith("core.") ? fullKey.slice("core.".length) : fullKey;
    // shortKey: "task_breakdown_engine.basic"
    acc[shortKey] = fullKey;
    return acc;
  },
  {} as Record<string, string>
);
