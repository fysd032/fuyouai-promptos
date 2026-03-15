// src/lib/coreframework-api.ts
// Calls /api/core/run and /api/core/run-guest (Next API Routes; same-origin by default).

import { resolveApiBase } from "./apiBase";
import { supabase } from "./supabaseClient";

export type PlanTier = "basic" | "pro";
export type EngineType = "deepseek" | "gemini";

export type CoreKey =
  | "task_breakdown"
  | "cot_reasoning"
  | "content_builder"
  | "analytical_engine"
  | "task_tree";

export type CoreFrameworkArgs = {
  coreKey: CoreKey;
  userInput: string;
  tier?: PlanTier;
  engineType?: EngineType;
  industryId?: string | null;
  systemOverride?: string;
  conversationId?: string | null; // pass to continue an existing conversation
  onChunk?: (chunk: string) => void; // called for each streamed delta

  timeoutMs?: number; // default 60s
  withCredentials?: boolean;
  apiBase?: string; // allows override (rarely used, not recommended)
};

export type CoreParsedOutput = {
  mode: "normal" | "clarification";
  quick_direction?: {
    task_type: string;
    core_difficulty: string;
    current_direction: string;
  } | null;
  clarification?: string[] | null;
  context?: string | null;
  core?: string | null;
};

export type CoreFrameworkResult = {
  ok: true;
  output: string;
  parsed?: CoreParsedOutput | null;
  finalPrompt?: string;
  mode?: "clarification" | "normal";
  language?: string;
  conversationId?: string | null;
  meta?: any;
  raw: any;
};

function isBlank(s: unknown) {
  return typeof s !== "string" || s.trim().length === 0;
}

function normalizeOutput(data: any): string {
  const v =
    data?.output ??
    data?.modelOutput ??
    data?.aiOutput ??
    data?.result ??
    data?.data?.output ??
    "";
  return typeof v === "string" ? v : JSON.stringify(v ?? "", null, 2);
}

async function safeJson(res: Response) {
  try {
    return await res.json();
  } catch {
    return {
      ok: false,
      error: {
        code: "NON_JSON_RESPONSE",
        message: `Non-JSON response (HTTP ${res.status})`,
      },
    };
  }
}

async function safeText(res: Response) {
  try {
    return await res.text();
  } catch {
    return "";
  }
}

function buildErrorMessage(res: Response, data: any) {
  const msg =
    data?.error?.message ||
    data?.message ||
    data?.error ||
    `Core run failed (HTTP ${res.status})`;

  const hint = data?.error?.hint ? ` | hint: ${data.error.hint}` : "";
  const requestId =
    data?.meta?.requestId || data?.requestId
      ? ` | requestId: ${data?.meta?.requestId ?? data?.requestId}`
      : "";

  return `[POST /api/core/run] ${msg}${hint}${requestId}`;
}

// Dev environment uses same-origin /api (handled by Next API Routes) to avoid CORS
export async function callCoreFramework(args: CoreFrameworkArgs): Promise<CoreFrameworkResult> {
  const {
    coreKey,
    userInput,
    tier = "basic",
    engineType = "deepseek",
    industryId = null,
    systemOverride,
    conversationId = null,
    onChunk,
    timeoutMs = 120_000,
    withCredentials = false,
    apiBase,
  } = args;

  if (!coreKey) throw new Error("coreKey cannot be empty");
  if (isBlank(userInput)) throw new Error("userInput cannot be empty");

  const API_BASE = resolveApiBase(apiBase);
  const url = `${API_BASE}/api/core/run`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    // Get access_token from Supabase session
    const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
    if (sessionErr) throw new Error(`[auth] ${sessionErr.message}`);
    const token = sessionData.session?.access_token;
    if (!token) throw new Error("Not signed in. Please sign in again.");

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      signal: controller.signal,
      credentials: withCredentials ? "include" : "same-origin",
      body: JSON.stringify({
        coreKey,
        tier,
        userInput,
        engineType,
        industryId,
        systemOverride,
        conversationId,
      }),
    });

    // Non-2xx: try to parse error JSON
    if (!res.ok) {
      const data = await safeJson(res);
      throw new Error(buildErrorMessage(res, data));
    }

    // Parse SSE stream
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/event-stream")) {
      // Fallback: non-streaming JSON response
      const data = await safeJson(res);
      if (data?.ok === false) throw new Error(buildErrorMessage(res, data));
      return {
        ok: true,
        output: normalizeOutput(data),
        finalPrompt: data?.finalPrompt,
        mode: data?.mode,
        language: data?.language,
        conversationId: data?.conversationId ?? null,
        meta: data?.meta,
        raw: data,
      };
    }

    // SSE streaming path
    const reader = res.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let fullOutput = "";
    let doneEvent: any = null;

    outer: while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop()!; // keep incomplete last line

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        let event: any;
        try { event = JSON.parse(line.slice(6)); } catch { continue; }

        if (event.type === "delta" && event.content) {
          fullOutput += event.content;
          onChunk?.(event.content);
        } else if (event.type === "done") {
          doneEvent = event;
          break outer;
        } else if (event.type === "error") {
          throw new Error(`[POST /api/core/run] ${event.message ?? "Stream error"} | url: ${url}`);
        }
      }
    }

    if (!doneEvent) {
      throw new Error(`[POST /api/core/run] Stream ended without done event | url: ${url}`);
    }

    return {
      ok: true,
      output: fullOutput,
      parsed: (doneEvent.parsed as CoreParsedOutput) ?? null,
      mode: doneEvent.mode,
      language: doneEvent.language,
      conversationId: doneEvent.conversationId ?? null,
      meta: doneEvent.meta,
      raw: doneEvent,
    };
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error(`[POST /api/core/run] Request timeout after ${timeoutMs}ms. | url: ${url}`);
    }
    if (e instanceof Error && !e.message.includes("| url:")) {
      e.message = `${e.message} | url: ${url}`;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}

// ── Guest (unauthenticated) call → /api/core/run-guest ────────────────────────
export async function callCoreFrameworkGuest(args: {
  coreKey: CoreKey;
  userInput: string;
  engineType?: EngineType;
  timeoutMs?: number;
}): Promise<CoreFrameworkResult> {
  const { coreKey, userInput, engineType = "deepseek", timeoutMs = 60_000 } = args;

  if (!coreKey) throw new Error("coreKey cannot be empty");
  if (isBlank(userInput)) throw new Error("userInput cannot be empty");

  const API_BASE = resolveApiBase();
  const url = `${API_BASE}/api/core/run-guest`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      credentials: "same-origin",
      body: JSON.stringify({ coreKey, userInput, engineType }),
    });

    const data = await safeJson(res);

    if (data?.code === "GUEST_LIMIT_REACHED") {
      const err = new Error("GUEST_LIMIT_REACHED") as any;
      err.code = "GUEST_LIMIT_REACHED";
      throw err;
    }

    if (!res.ok || data?.ok === false) {
      throw new Error(buildErrorMessage(res, data));
    }

    return {
      ok: true,
      output: normalizeOutput(data),
      finalPrompt: data?.finalPrompt,
      mode: data?.mode,
      language: data?.language,
      meta: data?.meta,
      raw: data,
    };
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error(`[POST /api/core/run-guest] Request timeout after ${timeoutMs}ms.`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
