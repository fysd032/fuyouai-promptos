import { NextRequest, NextResponse } from "next/server";
import { runCoreEngine } from "@/lib/promptos/core/run-core-engine";
import { resolveCorePromptKey } from "@/lib/promptos/core/resolve-core";
import { bootstrapCore } from "@/lib/promptos/core/bootstrap";

type Tier = "basic" | "pro";
type EngineType = "deepseek" | "gemini";

function rid() {
  try {
    // @ts-ignore
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
      return crypto.randomUUID();
    }
  } catch {}
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function normalizeTier(raw: unknown): Tier {
  const t = String(raw ?? "basic").toLowerCase().trim();
  return t === "pro" ? "pro" : "basic";
}

function normalizeEngineType(raw: unknown): EngineType {
  const t = String(raw ?? "deepseek").toLowerCase().trim();
  return t === "gemini" ? "gemini" : "deepseek";
}

function json(status: number, payload: any, requestId: string) {
  return NextResponse.json(
    { ...payload, meta: { requestId, ...(payload?.meta ?? {}) } },
    { status }
  );
}

export async function POST(req: NextRequest) {
  const requestId = rid();

  try {
    const body = await req.json().catch(() => ({}));

    const coreKey = String(body?.coreKey ?? "").trim();
    const userInput = String(body?.userInput ?? "").trim();
    const tier = normalizeTier(body?.tier);
    const engineType = normalizeEngineType(body?.engineType);
    const industryId = body?.industryId ?? null;

    if (!coreKey) {
      return json(
        400,
        { ok: false, error: { message: "Missing coreKey" } },
        requestId
      );
    }

    if (!userInput) {
      return json(
        400,
        { ok: false, error: { message: "Missing userInput" } },
        requestId
      );
    }

    await bootstrapCore();

    const resolved = resolveCorePromptKey(coreKey, tier);
    if (!resolved.ok) {
      return json(
        400,
        {
          ok: false,
          error: { message: resolved.error },
          meta: { tried: resolved.tried },
        },
        requestId
      );
    }

    const result = await runCoreEngine({
      coreKey: resolved.coreKey,
      tier,
      promptKey: resolved.promptKey,
      userInput,
      engineType,
      mode: tier,
      industryId,
    });

    if (!result.ok) {
      return json(
        500,
        {
          ok: false,
          error: { message: result.error },
        },
        requestId
      );
    }

    // ✅ 正确：runCoreEngine 没有 output 字段
    const output = result.modelOutput ?? "";

    return json(
      200,
      {
        ok: true,
        output,
        finalPrompt: result.finalPrompt,
      },
      requestId
    );
  } catch (e: any) {
    return json(
      500,
      {
        ok: false,
        error: { message: e?.message ?? String(e) },
      },
      requestId
    );
  }
}
