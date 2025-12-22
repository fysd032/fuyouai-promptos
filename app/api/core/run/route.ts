import { NextRequest, NextResponse } from "next/server";

// 真正跑模型
import { runCoreEngine } from "@/lib/promptos/core/run-core-engine";

// core 自检 + 映射
import { bootstrapCore } from "@/lib/promptos/core/bootstrap";
import { resolveCorePromptKey } from "@/lib/promptos/core/resolve-core";

// 用于验证 PROMPT_BANK 是否存在该 promptKey
import { getPrompt } from "@/lib/promptos/prompt-bank.generated";

type Tier = "basic" | "pro";
type EngineType = "deepseek" | "gemini";

function normalizeTier(raw: unknown): Tier {
  const t = String(raw ?? "basic").toLowerCase().trim();
  return t === "pro" ? "pro" : "basic";
}

function normalizeEngineType(raw: unknown): EngineType {
  const t = String(raw ?? "deepseek").toLowerCase().trim();
  return t === "gemini" ? "gemini" : "deepseek";
}

function rid() {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {}
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function serializeError(err: unknown) {
  if (err instanceof Error) {
    return { name: err.name, message: err.message, stack: err.stack };
  }
  return { name: "UnknownError", message: String(err) };
}

// ✅ 强制永远 JSON（避免 Next 默认错误页 text/html）
function json(status: number, payload: any, requestId: string) {
  return NextResponse.json({ ...payload, meta: { requestId, ...(payload?.meta ?? {}) } }, { status });
}

export async function POST(req: NextRequest) {
  const requestId = rid();

  try {
    const body = await req.json().catch(() => ({} as any));

    const coreKey = String(body?.coreKey ?? "").trim();
    const tier = normalizeTier(body?.tier);
    const userInput = String(body?.userInput ?? "").trim();
    const engineType = normalizeEngineType(body?.engineType);
    const industryId = body?.industryId ?? null;

    if (!coreKey) {
      return json(400, { ok: false, error: { code: "INVALID_INPUT", message: "Missing coreKey" } }, requestId);
    }
    if (!userInput) {
      return json(400, { ok: false, error: { code: "INVALID_INPUT", message: "Missing userInput" } }, requestId);
    }

    // ✅ 开关：只有 CORE_RUN_REAL=on 才走真实链路
    const useRealCore = (process.env.CORE_RUN_REAL || "").toLowerCase() === "on";
    if (!useRealCore) {
      return json(
        200,
        {
          ok: true,
          output: `TEMP_CORE_OK: ${userInput}`,
          meta: { coreKey, tier, useRealCore: false },
        },
        requestId
      );
    }

    // ✅ 真实路径：bootstrap -> resolve -> 校验 PROMPT_BANK -> runEngine
    await bootstrapCore();

    const resolved = resolveCorePromptKey(coreKey, tier);
    if (!resolved.ok) {
      return json(
        400,
        {
          ok: false,
          error: {
            code: "CORE_RESOLVE_FAILED",
            message: resolved.error,
            hint: "检查 core-map / resolve-core / PROMPT_INDEX 是否一致",
          },
          meta: { coreKey, tier },
        },
        requestId
      );
    }

    const record = getPrompt(resolved.promptKey);
    if (!record) {
      return json(
        500,
        {
          ok: false,
          error: {
            code: "PROMPT_NOT_FOUND",
            message: `Prompt not found in PROMPT_BANK: ${resolved.promptKey}`,
            hint: "请重新生成 prompt-bank.generated.ts，并确认 slug 规则与 engineId 对齐",
          },
          meta: { coreKey, tier, promptKeyResolved: resolved.promptKey },
        },
        requestId
      );
    }

    const result = await runCoreEngine({
  coreKey: resolved.coreKey,
  tier: resolved.tier,              // ✅ 关键：补上
  moduleId: resolved.coreKey,       // 可选：你之前就是这么干的
  promptKey: resolved.promptKey,
  engineType,
  mode: resolved.tier,              // 可选：不写也行，默认用 tier
  industryId,
  userInput,
});


    const output = (result as any)?.modelOutput ?? (result as any)?.output ?? "";

    if (!(result as any)?.ok) {
      return json(
        500,
        {
          ok: false,
          error: {
            code: "CORE_RUNENGINE_FAILED",
            message: (result as any)?.error || "runEngine returned ok=false",
            hint: "检查：API_KEY 环境变量、engineType、PROMPT_BANK 是否有该 promptKey",
          },
          meta: {
            coreKey,
            tier,
            engineTypeRequested: engineType,
            promptKeyResolved: resolved.promptKey,
            useRealCore: true,
          },
        },
        requestId
      );
    }

    // ✅ 你说的 “返回 JSON 前拼一个 keys”
    // 这里把关键字段统一塞 meta.keys，前端更好调试
    return json(
      200,
      {
        ok: true,
        output,
        finalPrompt: (result as any)?.finalPrompt,
        meta: {
          coreKey,
          tier,
          engineType,
          useRealCore: true,
          promptKey: resolved.promptKey,
          keys: {
            coreKey,
            tier,
            engineType,
            promptKey: resolved.promptKey,
          },
        },
      },
      requestId
    );
  } catch (err) {
    return json(
      500,
      {
        ok: false,
        error: {
          code: "UNHANDLED_ERROR",
          message: "Unhandled error in /api/core/run",
          detail: serializeError(err),
        },
      },
      requestId
    );
  }
}
