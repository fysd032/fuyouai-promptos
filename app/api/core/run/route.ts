// app/api/core/run/route.ts
import { NextResponse } from "next/server";
import { runEngine } from "@/lib/promptos/run-engine";
import { resolveCorePlan, type CoreKey, type PlanTier } from "@/lib/promptos/core/core-map";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const coreKey = body?.coreKey as CoreKey;
    const tierRequested = body?.tier as PlanTier;
    const userInput = String(body?.userInput ?? "").trim();
    const engineType = String(body?.engineType ?? "deepseek").trim();

    if (!coreKey || !userInput) {
      return NextResponse.json(
        { ok: false, error: "Missing coreKey or userInput" },
        { status: 400 }
      );
    }

    // ✅ 统一入口：自动降级在这里完成
    const plan = resolveCorePlan(coreKey, tierRequested ?? "basic");

    const engineResult = await runEngine({
      moduleId: coreKey,
      promptKey: plan.promptKey,
      engineType,
      mode: "core",
      userInput,
    });

   if (!engineResult.ok) {
  console.error("[api/core/run] engine failed", {
    requestId: engineResult.requestId,
    promptKey: plan.promptKey,
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
        tierUsed: plan.tier,
        degraded: plan.degraded,
        promptKey: plan.promptKey,
        requestId: engineResult.requestId,
      },
    },
    { status: 500 }
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
            tierUsed: plan.tier,
            degraded: plan.degraded,
            promptKey: plan.promptKey,
            requestId: engineResult.requestId,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      output: out,
      text: out,
      content: out,
      modelOutput: out,
      meta: {
        coreKey,
        tierRequested,
        tierUsed: plan.tier,
        degraded: plan.degraded,
        promptKey: plan.promptKey,
        requestId: engineResult.requestId,
      },
    });
  } catch (e: any) {
    console.error("[api/core/run]", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
