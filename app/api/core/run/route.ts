// app/api/core/run/route.ts
import { NextResponse } from "next/server";

// ✅ runEngine 真正位置在这里（不是 engine.ts）
import { runEngine } from "@/lib/promptos/run-engine";

// ✅ core 自检 + 映射
import { bootstrapCore } from "@/lib/promptos/core/bootstrap";
import { resolveCorePromptKey } from "@/lib/promptos/core/resolve-core";

type Tier = "basic" | "pro";

const ALLOWED_CORE_KEYS = new Set([
  "task_breakdown",
  "cot_reasoning",
  "content_builder",
  "analytical_engine",
  "task_tree",
]);

function normalizeTier(raw: unknown): Tier {
  const t = String(raw ?? "basic").toLowerCase();
  return t === "pro" ? "pro" : "basic";
}

function rid() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export async function POST(req: Request) {
  const requestId = rid();

  try {
    const body = await req.json().catch(() => ({} as any));

    const coreKey = String(body?.coreKey ?? "").trim();
    const tier = normalizeTier(body?.tier);
    const userInput = String(body?.userInput ?? "").trim();
    const engineType = String(body?.engineType ?? "deepseek").toLowerCase();
    const industryId = body?.industryId ?? null;

    // ✅ 基础校验
    if (!coreKey) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "INVALID_INPUT", message: "Missing coreKey" },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    if (!ALLOWED_CORE_KEYS.has(coreKey)) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "INVALID_CORE_KEY",
            message: `Unknown coreKey="${coreKey}". Expect one of: ${Array.from(
              ALLOWED_CORE_KEYS
            ).join(", ")}`,
            hint: "你可能把前端 tabKey 传成了 coreKey；请先用 CORE_TAB_TO_COREKEY 做映射。",
          },
          meta: { requestId, coreKey, tier },
        },
        { status: 400 }
      );
    }

    if (!userInput) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "INVALID_INPUT", message: "Missing userInput" },
          meta: { requestId, coreKey, tier },
        },
        { status: 400 }
      );
    }

    // ✅ 开关：默认 mock；只有 CORE_RUN_REAL=on 才走真实链路
    const useRealCore = (process.env.CORE_RUN_REAL || "").toLowerCase() === "on";

    if (!useRealCore) {
      return NextResponse.json({
        ok: true,
        output: `TEMP_CORE_OK: ${userInput}`,
        meta: { requestId, coreKey, tier, useRealCore: false },
      });
    }

    // ✅ 真实路径：bootstrap -> resolve -> runEngine（强制用 resolved.promptKey）
    bootstrapCore();

    const resolved = resolveCorePromptKey(coreKey, tier);
    if (!resolved.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "CORE_RESOLVE_FAILED",
            message: resolved.error,
            hint:
              "检查 core-map.ts 的 key 是否存在于 PROMPT_BANK（prompt-bank.generated.ts）里。",
          },
          meta: { requestId, coreKey, tier, useRealCore: true },
        },
        { status: 400 }
      );
    }

    const result = await runEngine({
      moduleId: coreKey,
      promptKey: resolved.promptKey, // ✅ 零歧义：只用 resolve 后的 promptKey
      engineType,
      mode: tier, // ✅ basic/pro 直接当 mode
      industryId,
      userInput,
    });

    if (!result?.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "CORE_RUNENGINE_FAILED",
            message: result?.error || "runEngine returned ok=false",
            hint:
              "优先检查：1) DEEPSEEK_API_KEY / GEMINI_API_KEY 是否在 Vercel 环境变量里；2) engineType=deepseek/gemini；3) PROMPT_BANK 是否有该 promptKey。",
          },
          meta: {
            requestId,
            coreKey,
            tier,
            engineTypeRequested: engineType,
            promptKeyResolved: resolved.promptKey,
            useRealCore: true,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      output: result.modelOutput,
      finalPrompt: result.finalPrompt,
      meta: {
        requestId,
        coreKey,
        tier,
        useRealCore: true,
        promptKey: resolved.promptKey,
        engineTypeRequested: result.engineTypeRequested,
        engineTypeUsed: result.engineTypeUsed,
        mode: result.mode,
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "CORE_RUN_FATAL",
          message: e?.message ?? String(e),
          hint:
            "如果是线上：看 Vercel Functions Logs；如果是本地：npm run build 看 TS 报错。",
        },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
