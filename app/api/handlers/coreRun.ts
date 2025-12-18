import { getPrompt } from "@/lib/promptos/prompt-bank.generated";
import { runEngine } from "@/lib/promptos/run-engine";
import { CORE_PROMPT_BANK_KEY, type CoreKey, type PlanTier } from "@/lib/promptos/core/core-map";

function isCoreKey(v: any): v is CoreKey {
  return ["task_breakdown","cot_reasoning","content_builder","analytical_engine","task_tree"].includes(v);
}
function isTier(v: any): v is PlanTier {
  return v === "basic" || v === "pro";
}

export async function coreRun(body: any) {
  const coreKey = body?.coreKey;
  const tier = body?.tier;
  const userInput = String(body?.userInput ?? body?.input ?? "").trim();

  if (!isCoreKey(coreKey)) return { status: 400, json: { ok:false, error:{code:"INVALID_COREKEY", message:"Invalid coreKey"} } };
  if (!isTier(tier)) return { status: 400, json: { ok:false, error:{code:"INVALID_TIER", message:"Invalid tier"} } };
  if (!userInput) return { status: 400, json: { ok:false, error:{code:"INPUT_REQUIRED", message:"input/userInput required"} } };

  const promptBankKey = CORE_PROMPT_BANK_KEY[coreKey][tier];
  const record = getPrompt(promptBankKey);
  if (!record?.content?.trim()) {
    return { status: 404, json: { ok:false, error:{code:"PROMPT_NOT_FOUND", message:`Prompt not found for ${coreKey}/${tier}`}, meta:{promptKeyUsed:promptBankKey} } };
  }

  const engineResult = await runEngine({
    promptKey: promptBankKey,
    userInput,
    engineType: "deepseek",
    mode: "core",
    moduleId: coreKey,
  } as any);

  const output =
    engineResult?.output ??
    engineResult?.text ??
    engineResult?.aiOutput ??
    engineResult?.modelOutput ??
    engineResult?.result ??
    "";

  return { status: 200, json: { ok:true, output: String(output), meta:{ coreKey, tier, promptKeyUsed: promptBankKey } } };
}
