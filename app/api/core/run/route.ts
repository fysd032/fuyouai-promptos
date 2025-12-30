// app/api/core/run/route.ts
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

/** ✅ 兼容 on/true/1/yes（修复本次事故的核心） */
function envOn(name: string) {
  const v = String(process.env[name] ?? "").toLowerCase().trim();
  return ["1", "true", "on", "yes"].includes(v);
}

function rid() {
  try {
    if (typeof globalThis.crypto !== "undefined" && "randomUUID" in globalThis.crypto) {
      // @ts-ignore
      return globalThis.crypto.randomUUID();
    }
  } catch {}
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function serializeError(err: unknown) {
  if (err instanceof Error) return { name: err.name, message: err.message, stack: err.stack };
  return { name: "UnknownError", message: String(err) };
}

// ✅ 永远 JSON（避免 Next 默认错误页 text/html）
function json(status: number, payload: any, requestId: string) {
  return NextResponse.json(
    { ...payload, meta: { requestId, ...(payload?.meta ?? {}) } },
    { status }
  );
}

/** ✅ 统一输出字段（兼容 UI 老代码：output/text/content/modelOutput） */
function ok200(output: string, meta: any, requestId: string, extra?: any) {
  return json(
    200,
    {
      ok: true,
      output,
      text: output,
      content: output,
      modelOutput: output,
      ...extra,
      meta,
    },
    requestId
  );
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
      return json(
        400,
        { ok: false, error: { code: "INVALID_INPUT", message: "Missing coreKey" } },
        requestId
      );
    }
    if (!userInput) {
      return json(
        400,
        { ok: false, error: { code: "INVALID_INPUT", message: "Missing userInput" } },
        requestId
      );
    }

    // ✅ 开关（兼容 on/true/1/yes）
    const useRealCore = envOn("CORE_RUN_REAL");

    // ✅ 如果没开真实链路：不要假成功，直接明确返回“被禁用”
    if (!useRealCore) {
      return json(
        503,
        {
          ok: false,
          error: {
            code: "CORE_DISABLED",
            message: "Core Run Real is disabled by env CORE_RUN_REAL",
            hint: "Set CORE_RUN_REAL=on/true/1/yes and redeploy.",
          },
          meta: {
            coreKey,
            tier,
            engineType,
            useRealCore: false,
            CORE_RUN_REAL: process.env.CORE_RUN_REAL ?? null,
          },
        },
        requestId
      );
    }

    // ✅ 初始化 core（映射/缓存等）
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
            hint: "检查 core-map / resolve-core / PROMPT_BANK 是否一致",
          },
          meta: { coreKey, tier, tried: resolved.tried, useRealCore: true },
        },
        requestId
      );
    }

    // ✅ PROMPT_BANK 二次校验
    const record = getPrompt(resolved.promptKey);
    if (!record) {
      return json(
        400,
        {
          ok: false,
          error: {
            code: "PROMPT_NOT_FOUND",
            message: `Prompt not found in PROMPT_BANK: ${resolved.promptKey}`,
            hint: "重新生成 prompt-bank.generated.ts，并确认 key 命名规则与 resolve-core/core-map 对齐",
          },
          meta: {
            coreKey,
            tier,
            promptKeyResolved: resolved.promptKey,
            tried: resolved.tried,
            useRealCore: true,
          },
        },
        requestId
      );
    }

    const result = await runCoreEngine({
      coreKey: resolved.coreKey,
      tier,
      moduleId: resolved.coreKey,
      promptKey: resolved.promptKey,
      engineType,
      mode: tier,
      industryId,
      userInput,
    });

    if (!result.ok) {
      return json(
        500,
        {
          ok: false,
          error: {
            code: "CORE_RUNENGINE_FAILED",
            message: result.error || "runCoreEngine returned ok=false",
            hint: "检查：API_KEY 环境变量、engineType、PROMPT_BANK 是否有该 promptKey",
          },
          meta: {
            coreKey,
            tier,
            engineTypeRequested: engineType,
            promptKeyResolved: resolved.promptKey,
            tried: resolved.tried,
            useRealCore: true,
          },
        },
        requestId
      );
    }

    const output = String(result.modelOutput ?? "").trim();

    if (!output) {
      return json(
        500,
        {
          ok: false,
          error: {
            code: "EMPTY_OUTPUT",
            message: "Model returned empty output",
            hint: "检查：模型返回结构解析 / runCoreEngine 内部 adapter / 上游是否被短路",
          },
          meta: {
            coreKey,
            tier,
            engineType,
            promptKey: resolved.promptKey,
            tried: resolved.tried,
            useRealCore: true,
            engineTypeRequested: result.engineTypeRequested,
            engineTypeUsed: result.engineTypeUsed,
          },
          // 保留 raw 便于你排查（稳定后可删）
          raw: result.raw ?? null,
        },
        requestId
      );
    }

    // ✅ 成功返回：同时给 output/text/content/modelOutput（兼容 UI）
    return ok200(
      output,
      {
        coreKey,
        tier,
        engineType,
        useRealCore: true,
        promptKey: resolved.promptKey,
        tried: resolved.tried,
        engineTypeRequested: result.engineTypeRequested,
        engineTypeUsed: result.engineTypeUsed,
      },
      requestId,
      {
        finalPrompt: result.finalPrompt,
        raw: result.raw,
      }
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
