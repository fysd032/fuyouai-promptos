// app/api/core/run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PROMPT_BANK } from "@/lib/promptos/prompt-bank.generated";

// ✅ runEngine 真正位置在这里（不是 engine.ts）
import { runCoreEngine } from "@/lib/promptos/core/run-core-engine";

// ✅ core 自检 + 映射
import { bootstrapCore } from "@/lib/promptos/core/bootstrap";
import { resolveCorePromptKey } from "@/lib/promptos/core/resolve-core";

// ✅ 用于“快速验证 PROMPT_BANK 里是否存在该 promptKey”
import { getPrompt } from "@/lib/promptos/prompt-bank.generated";

export const runtime = "nodejs"; // ✅ 避免 edge runtime 下某些依赖不兼容导致直接炸成 HTML 500

type Tier = "basic" | "pro";
type EngineType = "deepseek" | "gemini";

const ALLOWED_CORE_KEYS = new Set([
  "task_breakdown",
  "cot_reasoning",
  "content_builder",
  "analytical_engine",
  "task_tree",
]);

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

function  json(
  status: number,
  payload: any,
  requestId: string
): NextResponse {
  // ✅ 统一注入 keys（给前端 / 调试用）
  const keys = {
    coreKey: payload?.coreKey ?? null,
    engineType: payload?.engineType ?? payload?.engineName ?? null,
    tier: payload?.tier ?? null,
    runReal: process.env.CORE_RUN_REAL === "on",
  };

  return NextResponse.json(
    {
      ...payload,
      keys, // 👈 新增字段
      meta: {
        requestId,
        ...(payload?.meta ?? {}),
      },
    },
    { status }
  );
}


function serializeError(err: unknown) {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
    };
  }
  return { name: "UnknownError", message: String(err) };
}

export async function POST(req: NextRequest) {
  const requestId = rid();

  try {
    // ✅ body 解析失败也别 throw，返回 400 JSON
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== "object") {
      return json(
        400,
        {
          ok: false,
          error: {
            code: "INVALID_JSON",
            message: "Request body must be valid JSON object",
          },
        },
        requestId
      );
    }

    const coreKey = String((body as any)?.coreKey ?? "").trim();
    const tier = normalizeTier((body as any)?.tier);
    const userInput = String((body as any)?.userInput ?? "").trim();
    const engineType = normalizeEngineType((body as any)?.engineType);
    const industryId = (body as any)?.industryId ?? null;

    // ✅ 基础校验
    if (!coreKey) {
      return json(
        400,
        {
          ok: false,
          error: { code: "INVALID_INPUT", message: "Missing coreKey" },
        },
        requestId
      );
    }

    // ✅ 可选：防止前端 tabKey 直接穿透到后端
    if (!ALLOWED_CORE_KEYS.has(coreKey)) {
      return json(
        400,
        {
          ok: false,
          error: {
            code: "INVALID_CORE_KEY",
            message: `Unknown coreKey="${coreKey}". Expect one of: ${Array.from(ALLOWED_CORE_KEYS).join(
              ", "
            )}`,
            hint: "你可能把前端 tabKey 直接传给后端了；请先用 CORE_TAB_TO_COREKEY 做映射。",
          },
          meta: { coreKey, tier },
        },
        requestId
      );
    }

    if (!userInput) {
      return json(
        400,
        {
          ok: false,
          error: { code: "INVALID_INPUT", message: "Missing userInput" },
          meta: { coreKey, tier },
        },
        requestId
      );
    }

    // ✅ 开关：默认 mock；只有 CORE_RUN_REAL=on 才走真实链路
    const useRealCore = (process.env.CORE_RUN_REAL || "").toLowerCase() === "on";
    console.log("[core/run] CORE_RUN_REAL=", process.env.CORE_RUN_REAL);

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

    // ✅ 真实路径：bootstrap -> resolve ->（先验证 PROMPT_BANK）-> runEngine
    // 任何一步 throw，都必须被 catch 到并返回 JSON（不让 Next 返回 HTML 错误页）
    try {
      await bootstrapCore(); // ✅ 必须 await，避免异步自检/加载时序问题
    } catch (e) {
      console.error("[core/run] bootstrapCore failed", e);
      return json(
        500,
        {
          ok: false,
          error: {
            code: "CORE_BOOTSTRAP_FAILED",
            message: "bootstrapCore failed",
            detail: serializeError(e),
          },
          meta: { coreKey, tier, useRealCore: true },
        },
        requestId
      );
    }

    let resolved: any;
    try {
      resolved = resolveCorePromptKey(coreKey, tier);
    } catch (e) {
      console.error("[core/run] resolveCorePromptKey threw", e);
      return json(
        500,
        {
          ok: false,
          error: {
            code: "CORE_RESOLVE_THREW",
            message: "resolveCorePromptKey threw an exception",
            detail: serializeError(e),
          },
          meta: { coreKey, tier, useRealCore: true },
        },
        requestId
      );
    }

    if (!resolved?.ok) {
      return json(
        400,
        {
          ok: false,
          error: {
            code: "CORE_RESOLVE_FAILED",
            message: resolved?.error || "resolveCorePromptKey returned ok=false",
            hint: "优先检查：core-map / resolve-core / PROMPT_INDEX 是否一致。",
          },
          meta: { coreKey, tier, useRealCore: true },
        },
        requestId
      );
    }

    // ✅ 关键：在真正跑模型前，先确认 PROMPT_BANK 里真的存在这个 promptKey
    let record: any;
    try {
      record = getPrompt(resolved.promptKey);
    } catch (e) {
      console.error("[core/run] getPrompt threw", e);
      return json(
        500,
        {
          ok: false,
          error: {
            code: "PROMPT_LOOKUP_THREW",
            message: "getPrompt threw an exception",
            detail: serializeError(e),
          },
          meta: { coreKey, tier, promptKeyResolved: resolved.promptKey, useRealCore: true },
        },
        requestId
      );
    }

    if (!record) {
      // 这个本质是配置/生成物缺失，给 500 但依旧 JSON
      return json(
        500,
        {
          ok: false,
          error: {
            code: "PROMPT_NOT_FOUND",
            message: `Prompt not found in PROMPT_BANK: ${resolved.promptKey}`,
            hint: "请重新生成 prompt-bank.generated.ts，并确认文件名->slug 规则与 engineId 对齐。",
          },
          meta: { coreKey, tier, promptKeyResolved: resolved.promptKey, useRealCore: true },
        },
        requestId
      );
    }

    let result: any;
    try {
      result = await runCoreEngine({
        moduleId: coreKey,
        promptKey: resolved.promptKey, // ✅ 强制使用 resolve 出来的 promptKey
        engineType,
        mode: tier,
        industryId,
        userInput,
      });
    } catch (e) {
      console.error("[core/run] runCoreEngine threw", e);
      return json(
        500,
        {
          ok: false,
          error: {
            code: "CORE_RUNENGINE_THREW",
            message: "runCoreEngine threw an exception",
            detail: serializeError(e),
            hint:
              "优先检查：1) DEEPSEEK_API_KEY / GEMINI_API_KEY 是否在环境变量里；2) engineType=deepseek/gemini；3) PROMPT_BANK 是否有该 promptKey。",
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

    const output = (result as any)?.modelOutput ?? (result as any)?.output ?? "";

    if (!result?.ok) {
      return json(
        500,
        {
          ok: false,
          error: {
            code: "CORE_RUNENGINE_FAILED",
            message: (result as any)?.error || "runEngine returned ok=false",
            hint:
              "优先检查：1) DEEPSEEK_API_KEY / GEMINI_API_KEY 是否在环境变量里；2) engineType=deepseek/gemini；3) PROMPT_BANK 是否有该 promptKey。",
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

    return json(
      200,
      {
        ok: true,
        output,
        finalPrompt: (result as any)?.finalPrompt,
        meta: {
          coreKey,
          tier,
          useRealCore: true,
          promptKey: resolved.promptKey,
        },
      },
      requestId
    );
  } catch (err) {
    // ✅ 终极兜底：任何未预料的异常都转成 JSON，杜绝 HTML 错误页
    console.error("[core/run] UNCAUGHT", err);
    return json(
      500,
      {
        ok: false,
        error: {
          code: "UNCAUGHT",
          message: "Unhandled error in /api/core/run",
          detail: serializeError(err),
        },
      },
      requestId
    );
  }
}
