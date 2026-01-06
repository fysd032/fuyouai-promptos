// src/lib/gemini.ts
// 统一：通用模块 / PromptOS 调用（方案B：本地UI永远打同源 /api，由 Vite proxy 转发到云端）
//
// ✅ 规则：
// - 开发环境（Vite dev）：强制走同源 "/api"，避免 CORS
// - 生产环境（build 后部署）：优先用 VITE_API_BASE（如果你是“前后端同域同项目”也可不配，继续走 /api）
//
// 你在页面里调用：callPromptOS({ promptKey, userInput, engineType?, mode?, options? })

export type EngineType = "deepseek" | "gemini" | "openai" | "claude" | "auto";

export type PromptOSArgs = {
  promptKey: string;
  userInput: string;

  engineType?: EngineType; // 可选
  mode?: string; // 可选
  options?: Record<string, any>; // 可选

  timeoutMs?: number; // 默认 60s
  withCredentials?: boolean; // 默认 false（同源下无所谓）
  apiBase?: string; // 允许你临时覆盖（一般用不到，方案B不推荐）
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

// ✅ 方案B：开发环境强制走同源 /api（交给 Vite proxy），避免 CORS
function resolveApiBase(override?: string) {
  const fromOverride = (override || "").trim();

  const isViteDev =
    typeof import.meta !== "undefined" &&
    (import.meta as any).env &&
    (import.meta as any).env.DEV === true;

  if (isViteDev) return ""; // => url 会变成 "/api/..."

  const fromVite =
    (typeof import.meta !== "undefined" &&
      (import.meta as any).env &&
      ((import.meta as any).env.VITE_API_BASE as string)) ||
    "";

  const base = (fromOverride || fromVite).trim();
  return base.replace(/\/+$/, "");
}

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

  if (isBlank(promptKey)) throw new Error("promptKey 不能为空");
  if (isBlank(userInput)) throw new Error("userInput 不能为空");

  const API_BASE = resolveApiBase(apiBase);

  // ✅ 通用模块走 PromptOS：这里统一用 /api/run
  // - 开发环境：API_BASE="" => "/api/run"（Vite proxy 转发到云端）
  // - 生产环境：API_BASE="https://xxx.vercel.app" => "https://xxx.vercel.app/api/run"
  const url = `${API_BASE}/api/generate`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const body: any = {
      promptKey: String(promptKey).trim(),
      userInput: String(userInput),
    };

    // ✅ 可选字段：只有传了才带给后端（不让后端猜）
    if (engineType && engineType !== "auto") body.engineType = engineType;
    if (mode) body.mode = mode;
    if (options && typeof options === "object") body.options = options;

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      credentials: withCredentials ? "include" : "same-origin",
      body: JSON.stringify(body),
    });

    const data = await safeJson(res);

    if (!res.ok || data?.ok === false) {
      if (data?.error?.code === "NON_JSON_RESPONSE") {
        const text = await safeText(res);
        const extra = text ? ` | body: ${text.slice(0, 500)}` : "";
        throw new Error(`[POST /api/run] Non-JSON response${extra}`);
      }
      throw new Error(buildErrorMessage("[POST /api/run]", res, data));
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
      throw new Error(`[POST /api/run] Request timeout after ${timeoutMs}ms. | url: ${url}`);
    }
    if (e instanceof Error) {
      e.message = `${e.message} | url: ${url}`;
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
}
