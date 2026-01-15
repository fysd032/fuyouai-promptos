// app/api/core/run/route.ts
<<<<<<< HEAD
import { NextResponse, NextRequest } from "next/server";
import { runEngine } from "@/lib/promptos/run-engine";
=======
import { NextRequest, NextResponse } from "next/server";

// 真正跑模型
import { runCoreEngine } from "@/lib/promptos/core/run-core-engine";

// core 自检 + 映射
import { bootstrapCore } from "@/lib/promptos/core/bootstrap";
>>>>>>> 3bc01f508905bbaa2df9ad7d9b2b63438ba5a5cd
import { resolveCorePromptKey } from "@/lib/promptos/core/resolve-core";
import type { CoreKey, PlanTier } from "@/lib/promptos/core/core-map";
import { withSubscription } from "@/lib/billing/with-subscription";

const allowedOrigins = new Set([
  "https://fuyouai-promptos.vercel.app",
  "https://fuyouai.com",
  "https://www.fuyouai.com",
]);

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  if (allowedOrigins.has(origin)) return true;
  return /^https:\/\/fuyouai-promptos.*\.vercel\.app$/i.test(origin);
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
    const body = await req.json();

    const coreKey = body?.coreKey as CoreKey;
    const tierRequested = (body?.tier as PlanTier) ?? "basic";
    const userInput = String(body?.userInput ?? "").trim();
    const engineType = String(body?.engineType ?? "deepseek").trim();

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

    if (!resolved.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: resolved.error,
          meta: {
            coreKey: resolved.coreKey,
            tierRequested,
            tried: resolved.tried,
          },
          meta: { coreKey, tier, tried: resolved.tried, useRealCore: true },
        },
        { status: 400, headers: corsHeaders }
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
            tierRequested,
            tierUsed,
            degraded,
            promptKey,
            tried,
            requestId: engineResult.requestId,
          },
        },
        { status: 500, headers: corsHeaders }
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
            tierRequested,
            tierUsed,
            degraded,
            promptKey,
            tried,
            requestId: engineResult.requestId,
          },
        },
        { status: 500, headers: corsHeaders }
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
  } catch (e: any) {
    console.error("[api/core/run]", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

// ✅ 只保留一个 POST 导出（文件顶层）
export async function POST(req: NextRequest) {
  return withSubscription(handler, { scope: "core" })(req);
}


export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
