// app/api/core/run/route.ts
import { NextResponse } from "next/server";
import { runEngine } from "@/lib/promptos/run-engine";
import { resolveCorePromptKey } from "@/lib/promptos/core/resolve-core";
import type { CoreKey, PlanTier } from "@/lib/promptos/core/core-map";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const coreKey = body?.coreKey as CoreKey;
    const tierRequested = (body?.tier as PlanTier) ?? "basic";
    const userInput = String(body?.userInput ?? "").trim();
    const engineType = String(body?.engineType ?? "deepseek").trim();

    // 基础参数校验
    if (!coreKey || !userInput) {
      return NextResponse.json(
        { ok: false, error: "Missing coreKey or userInput" },
        { status: 400 }
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
        { status: 400 }
      );
    }

    const { promptKey, tier: tierUsed, tried } = resolved;
    const degraded = tierUsed !== tierRequested;

    // ✅ 调用引擎
    const engineResult = await runEngine({
      moduleId: coreKey,
      promptKey,
      engineType,
      mode: "core",
      userInput,
    });

    // 引擎失败
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
        { status: 500 }
      );
    }

    // 输出空
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
        { status: 500 }
      );
    }

    // 成功
    return NextResponse.json({
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
    });
  } catch (e: any) {
    console.error("[api/core/run]", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
