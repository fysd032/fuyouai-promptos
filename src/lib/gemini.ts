// src/lib/gemini.ts
// PromptOS client for /api/generate (Next API Routes; same-origin by default).
// Optional: set NEXT_PUBLIC_API_BASE or pass apiBase for cross-origin.

import { resolveApiBase } from "./apiBase";
import { supabase } from "./supabaseClient";

export type EngineType = "deepseek" | "gemini" | "openai" | "claude" | "auto";

export type PromptOSArgs = {
  promptKey: string;
  userInput: string;

  engineType?: EngineType; // optional
  mode?: string; // optional
  options?: Record<string, any>; // optional

  timeoutMs?: number; // default 60s
  withCredentials?: boolean; // default false (not needed for same-origin)
  apiBase?: string; // allows temporary override (rarely used, not recommended)
};

export type PromptOSResult = {
  ok: true;
  output: string;
  finalPrompt?: string;
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

function buildErrorMessage(tag: string, res: Response, data: any) {
  const msg =
    data?.error?.message ||
    data?.message ||
    data?.error ||
    `${tag} failed (HTTP ${res.status})`;

  const hint = data?.error?.hint ? ` | hint: ${data.error.hint}` : "";
  const requestId =
    data?.meta?.requestId || data?.requestId
      ? ` | requestId: ${data?.meta?.requestId ?? data?.requestId}`
      : "";

  return `${tag} ${msg}${hint}${requestId}`;
}

// Dev environment uses same-origin /api (handled by Next API Routes) to avoid CORS
export async function callPromptOS(args: PromptOSArgs): Promise<PromptOSResult> {
  const {
    promptKey,
    userInput,
    engineType,
    mode,
    options,
    timeoutMs = 60_000,
    withCredentials = false,
    apiBase,
  } = args;

  if (isBlank(promptKey)) throw new Error("promptKey cannot be empty");
  if (isBlank(userInput)) throw new Error("userInput cannot be empty");

  const API_BASE = resolveApiBase(apiBase);

  // Universal modules use PromptOS: unified via /api/generate
  // Default: API_BASE="" => "/api/generate" (same-origin, handled by Next API Routes)
  // Optional: API_BASE="https://xxx.vercel.app" => "https://xxx.vercel.app/api/generate"
  const url = `${API_BASE}/api/generate`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body: any = {
      promptKey: String(promptKey).trim(),
      userInput: String(userInput),
    };

    // Optional fields: only send if provided (don't let backend guess)
    if (engineType && engineType !== "auto") body.engineType = engineType;
    if (mode) body.mode = mode;
    if (options && typeof options === "object") body.options = options;

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
      body: JSON.stringify(body),
    });

    const data = await safeJson(res);

    if (!res.ok || data?.ok === false) {
      if (data?.error?.code === "NON_JSON_RESPONSE") {
        const text = await safeText(res);
        const extra = text ? ` | body: ${text.slice(0, 500)}` : "";
        throw new Error(`[POST /api/generate] Non-JSON response${extra}`);
      }
      throw new Error(buildErrorMessage("[POST /api/generate]", res, data));
    }

    return {
      ok: true,
      output: normalizeOutput(data),
      finalPrompt: data?.finalPrompt,
      meta: data?.meta,
      raw: data,
    };
  } catch (e: any) {
    if (e?.name === "AbortError") {
      throw new Error(
        `[POST /api/generate] Request timeout after ${timeoutMs}ms. | url: ${url}`
      );
    }
    if (e instanceof Error) {
      e.message = `${e.message} | url: ${url}`;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
