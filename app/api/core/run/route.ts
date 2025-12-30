import { NextResponse } from "next/server";
import { runEngine } from "@/lib/promptos/run-engine";
import {
  resolveCorePlan,
  type CoreKey,
  type PlanTier,
} from "@/lib/promptos/core/core-map";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const coreKey = body?.coreKey as CoreKey;
    const tierRequested = body?.tier as PlanTier;
    const userInput = String(body?.userInput ?? "").trim();
    const engineType = body?.engineType ?? "deepseek";

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

// 🚨 核心：runEngine 只保证 modelOutput
if (!engineResult.ok) {
  return NextResponse.json(
    {
      ok: false,
      error: engineResult.error || "Engine failed",
      meta: {
        coreKey,
        tierRequested,
        tierUsed: plan.tier,
        promptKey: plan.promptKey,
      },
    },
    { status: 500 }
  );
}

if (!engineResult.modelOutput || engineResult.modelOutput.trim() === "") {
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
      },
    },
    { status: 500 }
  );
}

// ✅ 成功返回：统一字段
return NextResponse.json({
  ok: true,
  output: engineResult.modelOutput,
  text: engineResult.modelOutput,
  content: engineResult.modelOutput,
  modelOutput: engineResult.modelOutput,
  meta: {
    coreKey,
    tierRequested,
    tierUsed: plan.tier,
    degraded: plan.degraded,
    promptKey: plan.promptKey,
  },
});


    return NextResponse.json({
      ok: true,
      output: engineResult.modelOutput,
      text: engineResult.modelOutput,
      content: engineResult.modelOutput,
      modelOutput: engineResult.modelOutput,
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
