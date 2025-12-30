// app/api/handlers/coreRun.ts

import { runEngine } from "@/lib/promptos/run-engine";
import {
  CORE_PROMPT_BANK_KEY,
  type CoreKey,
  type PlanTier,
} from "@/lib/promptos/core/core-map";

function isCoreKey(v: unknown): v is CoreKey {
  return (
    typeof v === "string" &&
    ["task_breakdown", "cot_reasoning", "content_builder", "analytical_engine", "task_tree"].includes(v)
  );
}

function isTier(v: unknown): v is PlanTier {
  return v === "basic" || v === "pro";
}

/** 安全提取模型输出：兼容 output/text/aiOutput/modelOutput/result/content */
function pickOutput(engineResult: unknown): string {
  if (!engineResult || typeof engineResult !== "object") return "";
  const r = engineResult as Record<string, unknown>;

  const direct =
    (typeof r.content === "string" ? r.content : undefined) ??
    (typeof r.output === "string" ? r.output : undefined) ??
    (typeof r.text === "string" ? r.text : undefined) ??
    (typeof r.aiOutput === "string" ? r.aiOutput : undefined) ??
    (typeof r.modelOutput === "string" ? r.modelOutput : undefined);

  if (direct != null) return String(direct).trim();

  const result = r.result;
  if (typeof result === "string") return result.trim();
  if (result && typeof result === "object") {
    const rr = result as Record<string, unknown>;
    const nested =
      (typeof rr.content === "string" ? rr.content : undefined) ??
      (typeof rr.output === "string" ? rr.output : undefined) ??
      (typeof rr.text === "string" ? rr.text : undefined);
    if (nested != null) return String(nested).trim();
  }
  return "";
}

export async function coreRun(body: unknown) {
  const b = (body && typeof body === "object") ? (body as Record<string, unknown>) : {};

  const coreKey = b.coreKey;
  const tier = b.tier;
  const userInput = String(b.userInput ?? b.input ?? "").trim();

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

  // ✅ 统一 tier
  const tierKey: "basic" | "pro" = tier === "pro" ? "pro" : "basic";

  // ✅ 从映射取 promptKey（5 大模块的 5 个提示词）
  const promptKeyUsed = (CORE_PROMPT_BANK_KEY as any)?.[coreKey]?.[tierKey];
  if (typeof promptKeyUsed !== "string" || !promptKeyUsed.trim()) {
    return {
      status: 500,
      json: {
        ok: false,
        error: {
          code: "PROMPT_KEY_MISSING",
          message: `Unknown promptBankKey. coreKey="${String(coreKey)}", tier="${tierKey}"`,
        },
      },
    };
  }

  const engineResult: unknown = await runEngine({
    promptKey: promptKeyUsed,
    userInput,
    engineType: "deepseek",
    mode: "core",
    moduleId: coreKey,
  } as any);

  const output = pickOutput(engineResult);

  if (!output) {
    return {
      status: 500,
      json: { ok: false, error: { code: "EMPTY_OUTPUT", message: "Engine returned empty output" } },
    };
  }

  return {
    status: 200,
    json: {
      ok: true,
      output,
      text: output,     // ✅ 给前端更通用的字段
      content: output,  // ✅ 兼容字段
      meta: { coreKey, tier: tierKey, promptKeyUsed },
    },
  };
}
