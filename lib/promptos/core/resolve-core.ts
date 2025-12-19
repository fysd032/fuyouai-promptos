// lib/promptos/core/resolve-core.ts
import { CORE_PROMPT_BANK_KEY, type CoreKey, type PlanTier } from "./core-map";
import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";

export type ResolveCoreResult =
  | { ok: true; coreKey: CoreKey; tier: PlanTier; promptKey: keyof typeof PROMPT_BANK }
  | { ok: false; coreKey: string; tier: string; error: string };

export function resolveCorePromptKey(coreKeyRaw: string, tierRaw: string): ResolveCoreResult {
  const coreKey = coreKeyRaw as CoreKey;
  const tier = (tierRaw || "basic") as PlanTier;

  const tierMap = (CORE_PROMPT_BANK_KEY as any)[coreKey];
  if (!tierMap) {
    return { ok: false, coreKey: coreKeyRaw, tier: tierRaw, error: `Unknown coreKey: ${coreKeyRaw}` };
  }

  const promptKey = tierMap[tier] as keyof typeof PROMPT_BANK | undefined;
  if (!promptKey) {
    return { ok: false, coreKey: coreKeyRaw, tier: tierRaw, error: `Unsupported tier for coreKey: coreKey=${coreKeyRaw}, tier=${tierRaw}` };
  }

  if (!PROMPT_BANK[promptKey]) {
    return { ok: false, coreKey: coreKeyRaw, tier: tierRaw, error: `Missing promptKey in PROMPT_BANK: ${String(promptKey)}` };
  }

  return { ok: true, coreKey, tier, promptKey };
}
