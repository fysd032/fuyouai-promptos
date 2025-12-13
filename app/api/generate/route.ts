import { NextRequest, NextResponse } from "next/server";
import { runEngine } from "@/lib/promptos/run-engine";

const corsHeaders = {
  "Access-Control-Allow-Origin": "http://localhost:3000",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  try {
    // ===== STEP 1: ENV CHECK =====
    const ENGINE_LOCK = process.env.ENGINE_LOCK; // off | deepseek | gemini
    const ROLLOUT_GEMINI_PERCENT = process.env.ROLLOUT_GEMINI_PERCENT;
    const FALLBACK_TO_DEEPSEEK = process.env.FALLBACK_TO_DEEPSEEK;

    console.log("[ENV CHECK]", {
      ENGINE_LOCK,
      ROLLOUT_GEMINI_PERCENT,
      FALLBACK_TO_DEEPSEEK,
    });
    // =============================

    const requestId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

    const body = await req.json();

    const { moduleId, promptKey, engineType, mode, industryId, userInput } = body;

    // ✅ 打透：看看前端到底传了什么
    console.log("[API IN]", {
      requestId,
      moduleId,
      promptKey,
      engineType,
      mode,
      industryId,
      userInputPreview: typeof userInput === "string" ? userInput.slice(0, 80) : typeof userInput,
    });

    /**
     * ✅ 引擎选择（先做“锁死开关”）
     * - ENGINE_LOCK=deepseek：强制 deepseek（推荐，先让线上稳定）
     * - ENGINE_LOCK=gemini：强制 gemini
     * - ENGINE_LOCK=off：不锁死，按请求传入 engineType（下一步再接灰度）
     */
    const lock = (ENGINE_LOCK ?? "off").toLowerCase();
    const requestedEngineType: string | null = engineType ?? null;

    let finalEngineType: string;
    if (lock === "deepseek" || lock === "gemini") {
      finalEngineType = lock;
    } else {
      // ✅ 不锁死：优先用请求值，否则兜底 deepseek（不要再默认 gemini）
      finalEngineType = (engineType ?? "deepseek").toString();
    }

    // ✅ mode 兜底
    const finalMode: string = (mode ?? "default").toString();

    console.log("[API ENGINE]", {
      requestId,
      requestedEngineType,
      engineLock: lock,
      engineTypeUsed: finalEngineType,
      modeUsed: finalMode,
    });

    const result = await runEngine({
      moduleId,
      promptKey,
      engineType: finalEngineType,
      mode: finalMode,
      industryId,
      userInput,
      requestId, // runEngine 不接也没关系，我们先透传
    } as any);

    /**
     * ✅ 关键：不改 runEngine 返回结构，只在外面“追加”调试字段
     * 这样 Test UI 能立刻看到：请求传了啥 / 实际用了啥
     */
    return NextResponse.json(
      {
        ...result,
        requestId,

        moduleIdRequested: moduleId ?? null,
        promptKeyRequested: promptKey ?? null,
        engineTypeRequested: requestedEngineType,

        engineLock: lock,
        engineTypeUsed: finalEngineType,
        modeUsed: finalMode,
      },
      {
        status: 200,
        headers: corsHeaders,
      }
    );
  } catch (error: any) {
    console.error("[/api/generate] Error:", error);

    return NextResponse.json(
      {
        ok: false,
        error: error?.message || "Unknown error",
      },
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
