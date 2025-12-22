// app/api/core/run/route.ts
import { NextRequest, NextResponse } from "next/server";
import { runCoreEngine } from "@/lib/promptos/core/run-core-engine";
import { bootstrapCore } from "@/lib/promptos/core/bootstrap";
import { resolveCorePromptKey } from "@/lib/promptos/core/resolve-core";
import { getPrompt } from "@/lib/promptos/prompt-bank.generated";

type Tier = "basic" | "pro";
type EngineType = "deepseek" | "gemini";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

function rid() {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeTier(raw: unknown): Tier {
  const t = String(raw ?? "basic").toLowerCase().trim();
  return t === "pro" ? "pro" : "basic";
}

function normalizeEngineType(raw: unknown): EngineType {
  const t = String(raw ?? "deepseek").toLowerCase().trim();
  return t === "gemini" ? "gemini" : "deepseek";
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
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_INPUT", message: "Missing coreKey" }, meta: { requestId } },
        { status: 400, headers: corsHeaders }
      );
    }
    if (!userInput) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_INPUT", message: "Missing userInput" }, meta: { requestId } },
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ 确保核心初始化（如果你项目里需要）
    bootstrapCore();

    // ✅ 解析 promptKey（coreKey + tier -> promptKey）
    const resolved = resolveCorePromptKey(coreKey, tier);
    if (!resolved.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "CORE_RESOLVE_FAILED", message: resolved.error },
          meta: { requestId, coreKey, tier },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ 在真正跑模型前，先验证 PROMPT_BANK 里确实存在
    const record = getPrompt(resolved.promptKey);
    if (!record) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: "PROMPT_NOT_FOUND",
            message: `Unknown promptKey: ${resolved.promptKey}`,
            hint: "请先 pnpm run gen:prompt-bank；并确保 TXT 文件名生成的 slug 与 core-map 的 engineId 对齐（尤其别带 Prompt Engine 之类的额外词）。",
          },
          meta: { requestId, coreKey, tier, promptKeyResolved: resolved.promptKey },
        },
        { status: 500, headers: corsHeaders }
      );
    }

    // ✅ 真正执行
    const result = await runCoreEngine({
      coreKey: resolved.coreKey,
      tier: resolved.tier,
      promptKey: resolved.promptKey,
      userInput,
      engineType,
      industryId,
    });

    return NextResponse.json(
      {
        ok: true,
        output: result.output,
        finalPrompt: result.finalPrompt,
        meta: { requestId, coreKey: resolved.coreKey, tier: resolved.tier, promptKey: resolved.promptKey },
        raw: result.raw,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "CORE_RUN_FAILED", message: String(e?.message ?? e) },
        meta: { requestId },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
