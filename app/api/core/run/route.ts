import { NextResponse } from "next/server";
import { runEngine } from "@/lib/promptos/run-engine";
import { resolveCorePlan, type CoreKey, type PlanTier } from "@/lib/promptos/core/core-map";

function pickOutput(engineResult: any) {
  const out =
    (typeof engineResult?.modelOutput === "string" && engineResult.modelOutput) ||
    (typeof engineResult?.output === "string" && engineResult.output) ||
    (typeof engineResult?.text === "string" && engineResult.text) ||
    (typeof engineResult?.content === "string" && engineResult.content) ||
    "";
  return out.trim();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));

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

    const plan = resolveCorePlan(coreKey, tierRequested ?? "basic");

    const engineResult: any = await runEngine({
      moduleId: coreKey,
      promptKey: plan.promptKey,
      engineType,
      mode: "core",
      userInput,
    });

    const output = pickOutput(engineResult);
    const engineError =
      (typeof engineResult?.error === "string" && engineResult.error.trim()) ? engineResult.error.trim() : "";

    if (engineResult?.ok === false || engineError || !output) {
      return NextResponse.json(
        {
          ok: false,
          error: engineError || "Model returned empty output",
          meta: {
            coreKey,
            tierRequested: tierRequested ?? "basic",
            tierUsed: plan.tier,
            degraded: !!plan.degraded,
            promptKey: plan.promptKey,
            engineTypeRequested: engineType,
            // ✅ 关键：让你不再盲查
            debug: {
              engineOk: engineResult?.ok,
              engineError: engineResult?.error ?? null,
              engineTypeUsed: engineResult?.engineTypeUsed ?? null,
              promptKeyResolved: engineResult?.promptKey ?? engineResult?.promptKeyResolved ?? null,
              requestId: engineResult?.requestId ?? null,
              buildSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
              vercelEnv: process.env.VERCEL_ENV ?? null,
            },
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      output,
      text: output,
      content: output,
      modelOutput: output,
      meta: {
        coreKey,
        tierRequested: tierRequested ?? "basic",
        tierUsed: plan.tier,
        degraded: !!plan.degraded,
        promptKey: plan.promptKey,
        engineType,
        requestId: engineResult?.requestId ?? null,
        buildSha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
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
