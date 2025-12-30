// app/api/core/run/route.ts

import { NextResponse } from "next/server";
import { runEngine } from "@/lib/promptos/run-engine";
import {
  resolveCorePlan,
  type CoreKey,
  type PlanTier,
} from "@/lib/promptos/core/core-map";

/** ===== 校验 ===== */
function isCoreKey(v: any): v is CoreKey {
  return [
    "task_breakdown",
    "cot_reasoning",
    "content_builder",
    "analytical_engine",
    "task_tree",
  ].includes(v);
}

function isTier(v: any): v is PlanTier {
  return v === "basic" || v === "pro";
}

/** ===== 安全提取模型输出 ===== */
function pickOutput(engineResult: unknown): string {
  if (!engineResult || typeof engineResult !== "object") return "";

  const r = engineResult as Record<string, any>;

  return (
    r.text ??
    r.output ??
    r.content ??
    r.result ??
    r.aiOutput ??
    r.modelOutput ??
    ""
  );
}

/** ===== POST /api/core/run ===== */
export async function POST(req: Request) {
  try {
    const body = await req.json();

    const coreKey = body?.coreKey;
    const tier = body?.tier;
    const userInput = String(body?.userInput ?? "").trim();
    const engineType = body?.engineType ?? "deepseek";

    if (!isCoreKey(coreKey)) {
      return NextResponse.json(
        { ok: false, error: "Invalid coreKey" },
        { status: 400 }
      );
    }

    if (!isTier(tier)) {
      return NextResponse.json(
        { ok: false, error: "Invalid tier" },
        { status: 400 }
      );
    }

    if (!userInput) {
      return NextResponse.json(
        { ok: false, error: "userInput required" },
        { status: 400 }
      );
    }

    // ✅ 自动降级逻辑在 resolveCorePlan 内部完成
    const tierKey: PlanTier = tier === "pro" ? "pro" : "basic";
    const plan = resolveCorePlan(coreKey, tierKey);

    if (!plan?.promptKey) {
      return NextResponse.json(
        {
          ok: false,
          error: "Prompt mapping not found",
          meta: { coreKey, tier: tierKey },
        },
        { status: 500 }
      );
    }

    const engineResult = await runEngine({
      promptKey: plan.promptKey,
      userInput,
      engineType,
      mode: "core",
      moduleId: coreKey,
    } as any);

    const output = pickOutput(engineResult);

    return NextResponse.json({
      ok: true,
      text: output,
      modelOutput: output,
      meta: {
        coreKey,
        tier: tierKey,
        promptKey: plan.promptKey,
      },
    });
  } catch (e: any) {
    console.error("[core/run]", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
