import { getPrompt } from "@/lib/promptos/prompt-bank.generated";
import { runEngine } from "@/lib/promptos/run-engine";
import {
  CORE_PROMPT_BANK_KEY,
  type CoreKey,
  type PlanTier,
} from "@/lib/promptos/core/core-map";

function isCoreKey(v: any): v is CoreKey {
  return ["task_breakdown", "cot_reasoning", "content_builder", "analytical_engine", "task_tree"].includes(v);
}
function isTier(v: any): v is PlanTier {
  return v === "basic" || v === "pro";
}

/**
 * 安全提取模型输出：兼容 output/text/aiOutput/modelOutput/result/content
 * 关键点：入参是 unknown，内部用类型守卫 narrow，TS 构建必过
 */
function pickOutput(engineResult: unknown): string {
  if (!engineResult || typeof engineResult !== "object") return "";

  const r = engineResult as Record<string, unknown>;

  // 1) 直接字段（你之前兜底的那几个）
  const direct =
    (typeof r.content === "string" ? r.content : undefined) ??
    (typeof r.output === "string" ? r.output : undefined) ??
    (typeof r.text === "string" ? r.text : undefined) ??
    (typeof r.aiOutput === "string" ? r.aiOutput : undefined) ??
    (typeof r.modelOutput === "string" ? r.modelOutput : undefined);

  if (direct != null) return String(direct);

  // 2) result 可能是 string 或对象（常见于一些 engine 包装）
  const result = r.result;
  if (typeof result === "string") return result;
  if (result && typeof result === "object") {
    const rr = result as Record<string, unknown>;
    const nested =
      (typeof rr.content === "string" ? rr.content : undefined) ??
      (typeof rr.output === "string" ? rr.output : undefined) ??
      (typeof rr.text === "string" ? rr.text : undefined);
    if (nested != null) return String(nested);
  }

  return "";
}

export async function coreRun(body: any) {
  const coreKey = body?.coreKey;
  const tier = body?.tier;
  const userInput = String(body?.userInput ?? body?.input ?? "").trim();

  if (!isCoreKey(coreKey)) {
    return {
      status: 400,
      json: { ok: false, error: { code: "INVALID_COREKEY", message: "Invalid coreKey" } },
    };
  }
  if (!isTier(tier)) {
    return {
      status: 400,
      json: { ok: false, error: { code: "INVALID_TIER", message: "Invalid tier" } },
    };
  }
  if (!userInput) {
    return {
      status: 400,
      json: { ok: false, error: { code: "INPUT_REQUIRED", message: "input/userInput required" } },
    };
  }

  const promptBankKey = CORE_PROMPT_BANK_KEY[coreKey][tier];
  const record = getPrompt(promptBankKey);

  if (!record?.content?.trim()) {
    return {
      status: 404,
      json: {
        ok: false,
        error: { code: "PROMPT_NOT_FOUND", message: `Prompt not found for ${coreKey}/${tier}` },
        meta: { promptKeyUsed: promptBankKey },
      },
    };
  }

  // ✅ 关键：把 runEngine 的返回当成 unknown（不信任其类型声明）
  const engineResult: unknown = await runEngine({
    promptKey: promptBankKey,
    userInput,
    engineType: "deepseek",
    mode: "core",
    moduleId: coreKey,
  } as any);

  const output = pickOutput(engineResult);

  return {
    status: 200,
    json: {
      ok: true,
      output,
      // 可选：把 content 也带上，方便你未来统一字段（不破坏旧前端）
      content: output,
      meta: { coreKey, tier, promptKeyUsed: promptBankKey },
      // 可选：保留 raw 便于排查（稳定后可删）
      // engineRaw: engineResult,
    },
  };
}
