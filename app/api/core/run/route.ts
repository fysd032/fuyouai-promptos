// app/api/core/run/route.ts
import { NextResponse } from "next/server";
import { runEngineStream } from "@/lib/promptos/run-engine";
import { resolveCorePromptKey } from "@/lib/promptos/core/resolve-core";
import type { CoreKey, PlanTier } from "@/lib/promptos/core/core-map";
import { withDailyLimit, requestGateTier, requestUserId } from "@/lib/billing/with-daily-limit";
import { withRouteError } from "@/lib/api/withRouteError";
import { recordCoreRun, recordFailedRun } from "@/lib/db/conversations";
import { createClient } from "@/lib/supabase/server";
import { detectLanguage } from "@/lib/lang/detectLanguage";

export const runtime = "nodejs";
export const maxDuration = 300;

// ── CORS ────────────────────────────────────────────────────────────────
import { getCorsHeaders } from "@/lib/api/cors";

// ── SSE helpers ──────────────────────────────────────────────────────────
const encoder = new TextEncoder();

function sseEvent(obj: Record<string, unknown>): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(obj)}\n\n`);
}

// ── Core handler ─────────────────────────────────────────────────────────
async function handler(req: Request): Promise<Response> {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // ── Parse body ──────────────────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
  }

  const t0 = Date.now();
  const coreKey = body?.coreKey as CoreKey;
  const conversationId: string | null =
    typeof body?.conversationId === "string" ? body.conversationId : null;

  // ── Resolve userId (middleware-injected or fallback from token) ──────
  let resolvedUserId: string | null = requestUserId.get(req) ?? null;
  if (!resolvedUserId) {
    try {
      const authHeader = req.headers.get("authorization") ?? "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
      if (token) {
        const supabase = await createClient();
        const { data } = await supabase.auth.getUser(token);
        resolvedUserId = data.user?.id ?? null;
      }
    } catch { /* best-effort */ }
  }

  // ── Tier resolution ──────────────────────────────────────────────────
  const gateTier = requestGateTier.get(req) ?? "free";
  const tierRequested = (body?.tier as PlanTier) ?? "basic";
  const effectiveTier: PlanTier =
    tierRequested === "pro" && gateTier !== "paid" ? "basic" : tierRequested;

  const userInput = String(body?.userInput ?? "").trim();
  const engineType = String(body?.engineType ?? "deepseek").trim();
  const systemOverride =
    typeof body?.systemOverride === "string" && body.systemOverride.trim()
      ? body.systemOverride.trim()
      : "";
  const language = detectLanguage(userInput);

  // ── Basic validation ─────────────────────────────────────────────────
  if (!coreKey || !userInput) {
    return NextResponse.json(
      { ok: false, error: "Missing coreKey or userInput" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (userInput.length > 4000) {
    return NextResponse.json(
      { ok: false, error: "Input must be 4000 characters or fewer" },
      { status: 400, headers: corsHeaders }
    );
  }

  // ── Prompt key resolution ────────────────────────────────────────────
  const resolved = resolveCorePromptKey(coreKey, effectiveTier);
  if (!resolved.ok) {
    return NextResponse.json(
      { ok: false, error: resolved.error, meta: { coreKey: resolved.coreKey, tierRequested: effectiveTier, tried: resolved.tried } },
      { status: 400, headers: corsHeaders }
    );
  }

  const { promptKey, tier: tierUsed, tried } = resolved;
  const degraded = tierUsed !== effectiveTier;

  console.log("[api/core/run] start", { coreKey, engineType, tier: effectiveTier, userId: resolvedUserId ?? "anon" });

  // ── Build SSE streaming response ─────────────────────────────────────
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (obj: Record<string, unknown>) => {
        try { controller.enqueue(sseEvent(obj)); } catch { /* stream already closed */ }
      };

      try {
        enqueue({ type: "start" });

        // ── [HOOK] conversation / message write — start ──────────────
        // Future: create conversation row here if needed before first chunk

        // Accumulate output for DB write + clarification detection
        let fullOutput = "";

        const engineResult = await runEngineStream(
          {
            moduleId: coreKey,
            promptKey,
            engineType,
            mode: "core",
            userInput,
            systemOverride,
            language,
          },
          (chunk) => {
            fullOutput += chunk;
            enqueue({ type: "delta", content: chunk });
          }
        );

        // ── Engine failed ────────────────────────────────────────────
        if (!engineResult.ok) {
          const errMsg = engineResult.error ?? "Engine failed";
          console.error("[api/core/run] engine failed", {
            requestId: engineResult.requestId,
            coreKey,
            engineType,
            error: errMsg,
          });

          // [HOOK] module_runs write — failed
          if (resolvedUserId) {
            recordFailedRun({
              userId: resolvedUserId,
              conversationId,
              userInput,
              coreKey,
              engineType,
              errorMessage: errMsg,
              latencyMs: Date.now() - t0,
            });
          }

          enqueue({ type: "error", message: errMsg });
          controller.close();
          return;
        }

        // ── Empty output ─────────────────────────────────────────────
        const out = fullOutput.trim();
        if (!out) {
          const errMsg = "Model returned empty output";
          if (resolvedUserId) {
            recordFailedRun({
              userId: resolvedUserId,
              conversationId,
              userInput,
              coreKey,
              engineType,
              errorMessage: errMsg,
              latencyMs: Date.now() - t0,
            });
          }
          enqueue({ type: "error", message: errMsg });
          controller.close();
          return;
        }

        // ── [HOOK] conversations + messages + module_runs write ───────
        let newConversationId: string | null = conversationId;
        if (resolvedUserId) {
          try {
            const record = await recordCoreRun({
              userId: resolvedUserId,
              conversationId,
              userInput,
              coreKey,
              engineType,
              output: out,
              latencyMs: Date.now() - t0,
              tokenUsageInput: engineResult.tokenUsage?.input,
              tokenUsageOutput: engineResult.tokenUsage?.output,
            });
            newConversationId = record.conversationId;
          } catch (e) {
            // Non-fatal — DB write failure must not break the stream
            console.error("[api/core/run] recordCoreRun failed:", e);
          }
        }

        const latencyMs = Date.now() - t0;

        // ── Try to parse structured JSON output ───────────────────────
        let parsedOutput: Record<string, unknown> | null = null;
        try {
          // Strip accidental markdown code fences the model may add
          const stripped = out.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
          const candidate = JSON.parse(stripped);
          if (candidate && typeof candidate === "object" && "mode" in candidate) {
            parsedOutput = candidate;
          }
        } catch { /* non-JSON output — plain text fallback */ }

        const effectiveMode = (parsedOutput?.mode as string) ?? engineResult.mode ?? "normal";

        console.log("[api/core/run] done", {
          coreKey,
          engineType,
          latencyMs,
          tokens: engineResult.tokenUsage,
          conversationId: newConversationId,
          structured: !!parsedOutput,
        });

        enqueue({
          type: "done",
          language,
          mode: effectiveMode,
          conversationId: newConversationId,
          parsed: parsedOutput,
          meta: {
            coreKey,
            tierRequested,
            tierUsed,
            degraded,
            promptKey,
            tried,
            requestId: engineResult.requestId,
            latencyMs,
          },
        });

      } catch (e: any) {
        console.error("[api/core/run] unexpected error:", e);
        try {
          controller.enqueue(sseEvent({ type: "error", message: e?.message ?? "Internal error" }));
        } catch { /* already closed */ }
      } finally {
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no", // Disable Nginx buffering on Vercel
      ...corsHeaders,
    },
  });
}

export const POST = withDailyLimit(withRouteError(handler), { scope: "core" });

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  return new NextResponse(null, { status: 204, headers: getCorsHeaders(origin) });
}
