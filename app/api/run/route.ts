import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runEngine } from "@/lib/promptos/run-engine";
import { getBackendModules } from "@/src/config/moduleMapping";
import { detectLanguage } from "@/lib/lang/detectLanguage";
import { recordCoreRun } from "@/lib/db/conversations";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: Request) {
  // ── Auth ──────────────────────────────────────────────────────────────
  const authHeader = req.headers.get("Authorization");
  const token = authHeader?.replace("Bearer ", "").trim();
  if (!token) {
    return NextResponse.json(
      { error: "unauthorized", message: "Login required" },
      { status: 401 }
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) {
    return NextResponse.json(
      { error: "unauthorized", message: "Login required" },
      { status: 401 }
    );
  }

  // ── Parse body ────────────────────────────────────────────────────────
  const body = await req.json().catch(() => ({}));
  const {
    text,
    answers = {},
    frontModuleId,
    variantId,
    routerAnswers = {},
    conversationId = null,
  } = body || {};

  if (!text || !frontModuleId || !variantId) {
    return NextResponse.json(
      { error: "missing_fields", message: "text, frontModuleId and variantId are required" },
      { status: 400 }
    );
  }

  // ── Resolve promptKey ─────────────────────────────────────────────────
  const modules = getBackendModules(frontModuleId, variantId);
  const promptKey = modules[0]?.promptKey;

  if (!promptKey) {
    return NextResponse.json(
      { error: "invalid_module", message: "Module not found" },
      { status: 400 }
    );
  }

  // ── Build userInput ───────────────────────────────────────────────────
  const combinedContext = { ...answers, ...routerAnswers };
  const hasContext = Object.values(combinedContext).some(Boolean);
  const userInput = hasContext
    ? `${text}\n\nAdditional context:\n${JSON.stringify(combinedContext)}`
    : text;

  // ── Run engine ────────────────────────────────────────────────────────
  const language = detectLanguage(text);

  let result;
  try {
    result = await runEngine({
      promptKey,
      userInput,
      engineType: "deepseek",
      language,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Engine error";
    return NextResponse.json(
      { error: "engine_failed", message },
      { status: 500 }
    );
  }

  if (!result.ok) {
    return NextResponse.json(
      { error: "engine_failed", message: result.error ?? "Engine failed" },
      { status: 500 }
    );
  }

  // ── Save to history (non-fatal) ───────────────────────────────────────
  let savedConversationId: string | null = null;
  try {
    const record = await recordCoreRun({
      userId: user.id,
      conversationId: typeof conversationId === "string" ? conversationId : null,
      userInput,
      coreKey: `${frontModuleId}::${variantId}`,
      engineType: result.engineTypeUsed ?? "deepseek",
      output: String(result.modelOutput ?? ""),
      latencyMs: 0,
      tokenUsageInput: result.tokenUsage?.input,
      tokenUsageOutput: result.tokenUsage?.output,
      source: "general",
    });
    savedConversationId = record.conversationId;
  } catch (e) {
    console.error("[api/run] recordCoreRun failed (non-fatal):", e);
  }

  // ── Return ────────────────────────────────────────────────────────────
  return NextResponse.json({
    output: result.modelOutput,
    promptKey,
    frontModuleId,
    conversationId: savedConversationId,
  });
}
