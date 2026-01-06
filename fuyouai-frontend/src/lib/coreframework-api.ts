// src/lib/coreframework-api.ts
// 只负责：把 coreKey / tier / userInput 传给后端 /api/core/run
// ✅ 方案B：开发环境强制同源 /api（交给 Vite proxy 转发），避免 CORS

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

  timeoutMs?: number; // 默认 60s
  withCredentials?: boolean;
  apiBase?: string; // 允许覆盖（一般用不到，方案B不推荐）
};

export type CoreFrameworkResult = {
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

// ✅ 方案B：开发环境强制走同源 /api（交给 Vite proxy）
function resolveApiBase(override?: string) {
  const fromOverride = (override || "").trim();

  const isViteDev =
    typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.DEV === true;

  if (isViteDev) return "";

  const fromVite =
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env &&
      ((import.meta as any).env.VITE_API_BASE as string)) ||
    "";

  const base = (fromOverride || fromVite).trim();
  return base.replace(/\/+$/, "");
}

export async function callCoreFramework(args: CoreFrameworkArgs): Promise<CoreFrameworkResult> {
  const {
    coreKey,
    userInput,
    tier = "basic",
    engineType = "deepseek",
    industryId = null,
    timeoutMs = 60_000,
    withCredentials = false,
    apiBase,
  } = args;

  if (!coreKey) throw new Error("coreKey 不能为空");
  if (isBlank(userInput)) throw new Error("userInput 不能为空");

  const API_BASE = resolveApiBase(apiBase);
  const url = `${API_BASE}/api/core/run`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      credentials: withCredentials ? "include" : "same-origin",
      body: JSON.stringify({
        coreKey,
        tier,
        userInput,
        engineType,
        industryId,
      }),
    });

    const data = await safeJson(res);

    if (!res.ok || data?.ok === false) {
      if (data?.error?.code === "NON_JSON_RESPONSE") {
        const text = await safeText(res);
        const extra = text ? ` | body: ${text.slice(0, 500)}` : "";
        throw new Error(`[POST /api/core/run] Non-JSON response${extra}`);
      }
      throw new Error(buildErrorMessage(res, data));
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
      throw new Error(`[POST /api/core/run] Request timeout after ${timeoutMs}ms. | url: ${url}`);
    }
    if (e instanceof Error) {
      e.message = `${e.message} | url: ${url}`;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
