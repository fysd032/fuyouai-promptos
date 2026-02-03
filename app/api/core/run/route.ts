// app/api/core/run/route.ts
import { NextResponse } from "next/server";
import { runEngine } from "@/lib/promptos/run-engine";
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

function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin as string;
  }
  return headers;
}

/**
 * ✅ Highest-priority language mirroring rule.
 * This MUST be injected as the very first system message (messages[0]).
 */
const LANGUAGE_GUARD = `
SYSTEM OVERRIDE — LANGUAGE MIRRORING (HIGHEST PRIORITY)

- Detect the primary language of the user's input.
- The output language MUST strictly match the user's input language.
- Do NOT translate between languages.
- Do NOT mix multiple languages in a single response.
- If the input contains multiple languages, follow the dominant language.
- If dominance cannot be determined, follow the language of the last user message.
- This rule has higher priority than any module description, titles, bullets, examples, or templates.
- Apply to ALL outputs, including clarifying questions and error messages.
`.trim();

// 把原来的 POST 内容改名为 handler（内容基本不动）
async function handler(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  try {
    const body = await req.json();

    const coreKey = body?.coreKey as CoreKey;
    const tierRequested = (body?.tier as PlanTier) ?? "basic";
    const userInput = String(body?.userInput ?? "").trim();
    const engineType = String(body?.engineType ?? "deepseek").trim();
    const systemOverride = typeof body?.systemOverride === "string" && body.systemOverride.trim()
      ? body.systemOverride.trim()
      : LANGUAGE_GUARD;

    // 基础参数校验
    if (!coreKey || !userInput) {
      return NextResponse.json(
        { ok: false, error: "Missing coreKey or userInput" },
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ 统一入口：解析 promptKey（包含校验 + 降级 + tried）
    const resolved = resolveCorePromptKey(coreKey, tierRequested);

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
        },
        { status: 400, headers: corsHeaders }
      );
    }

    const { promptKey, tier: tierUsed, tried } = resolved;
    const degraded = tierUsed !== tierRequested;

    // ✅ 调用引擎（只新增 systemOverride，不改其他逻辑）
    const engineResult = await runEngine({
      moduleId: coreKey,
      promptKey,
      engineType,
      mode: "core",
      userInput,
      systemOverride,
    });

    if (!engineResult.ok) {
      console.error("[api/core/run] engine failed", {
        requestId: engineResult.requestId,
        coreKey,
        tierRequested,
        tierUsed,
        degraded,
        promptKey,
        engineType,
        error: engineResult.error,
      });

      return NextResponse.json(
        {
          ok: false,
          error: engineResult.error || "Engine failed",
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

    const out = String(engineResult.modelOutput ?? "").trim();
    if (!out) {
      return NextResponse.json(
        {
          ok: false,
          error: "Model returned empty output",
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

    return NextResponse.json(
      {
        ok: true,
        output: out,
        text: out,
        content: out,
        modelOutput: out,
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
      { headers: corsHeaders }
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
export const POST = withSubscription(handler, { scope: "core" });

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
