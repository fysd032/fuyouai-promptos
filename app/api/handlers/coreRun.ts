import { runEngine } from "@/lib/promptos/run-engine";
import {
  CORE_PROMPT_BANK_KEY,
  type CoreKey,
  type PlanTier,
} from "@/lib/promptos/core/core-map";

/**
 * 只允许的 CoreKey：按你工程里实际支持的 key 来写
 * （你原来写的这几个我先保留）
 */
function isCoreKey(v: unknown): v is CoreKey {
  return (
    typeof v === "string" &&
    ["task_breakdown", "cot_reasoning", "content_builder", "analytical_engine", "task_tree"].includes(v)
  );
}

function isTier(v: unknown): v is PlanTier {
  return v === "basic" || v === "pro";
}

/**
 * 安全提取模型输出：兼容 output/text/aiOutput/modelOutput/result/content
 * 入参用 unknown，内部再做类型收窄，TS 更稳
 */
function pickOutput(engineResult: unknown): string {
  if (!engineResult || typeof engineResult !== "object") return "";
  const r = engineResult as Record<string, unknown>;

  const direct =
    (typeof r.content === "string" ? r.content : undefined) ??
    (typeof r.output === "string" ? r.output : undefined) ??
    (typeof r.text === "string" ? r.text : undefined) ??
    (typeof r.aiOutput === "string" ? r.aiOutput : undefined) ??
    (typeof r.modelOutput === "string" ? r.modelOutput : undefined);

  if (direct != null) return String(direct);

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

/**
 * coreRun：给 api route 调用的核心函数
 * 返回统一结构：{ status, json }
 */
export async function coreRun(body: unknown) {
  const b = (body && typeof body === "object") ? (body as Record<string, unknown>) : {};

  const coreKey = b.coreKey;
  const tier = b.tier;
  const userInput = String(b.userInput ?? b.input ?? "").trim();

  if (!isCoreKey(coreKey)) {
    return {
      status: 400,
      json: {
        ok: false,
        error: { code: "INVALID_COREKEY", message: "Invalid coreKey" },
      },
    };
  }

  if (!isTier(tier)) {
    return {
      status: 400,
      json: {
        ok: false,
        error: { code: "INVALID_TIER", message: "Invalid tier" },
      },
    };
  }

  if (!userInput) {
    return {
      status: 400,
      json: {
        ok: false,
        error: { code: "INPUT_REQUIRED", message: "input/userInput required" },
      },
    };
  }

  // ✅ tier 统一成 basic/pro
  const tierKey: "basic" | "pro" = tier === "pro" ? "pro" : "basic";

  // ✅ 从映射里取 promptKey（这里做了安全读取）
  const mapping = CORE_PROMPT_BANK_KEY as unknown as Record<string, any>;
  const promptKeyUsed: unknown = mapping?.[coreKey]?.[tierKey];

  if (typeof promptKeyUsed !== "string" || !promptKeyUsed.trim()) {
    return {
      status: 500,
      json: {
        ok: false,
        error: {
          code: "PROMPT_KEY_MISSING",
          message: `Unknown prompt mapping for coreKey="${coreKey}" tier="${tierKey}"`,
        },
      },
    };
  }

  // ✅ 调用引擎（runEngine 的类型声明可能不稳定，所以入参/返回都保守处理）
  const engineResult: unknown = await runEngine({
    promptKey: promptKeyUsed,
    userInput,
    engineType: "deepseek",
    mode: "core",
    moduleId: coreKey,
  } as any);

  const output = pickOutput(engineResult).trim();

  return {
    status: 200,
    json: {
      ok: true,
      output,
      content: output, // 给前端兜底用
      meta: { coreKey, tier: tierKey, promptKeyUsed },
    },
  };
}
