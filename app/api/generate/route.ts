import { NextRequest, NextResponse } from "next/server";
import { runEngine } from "@/lib/promptos/run-engine";

type EngineType = "deepseek" | "gemini";
type ModeType = "default" | string;

type GenerateRequestBody = {
  moduleId?: string;
  promptKey?: string;
  engineType?: EngineType;
  mode?: ModeType;
  industryId?: string;
  userInput?: string;
};

type RunEngineInput = {
  moduleId?: string;
  promptKey?: string;
  engineType: EngineType;
  mode: string;
  industryId?: string;
  userInput: string;
  requestId: string;
};

function parseAllowedOrigins(): string[] {
  // 推荐你在 Vercel 后端配置：ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.vercel.app
  const raw = process.env.ALLOWED_ORIGINS?.trim();
  if (!raw) return ["http://localhost:3000"];
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowed = parseAllowedOrigins();

  // 如果 origin 在白名单 -> 允许该 origin
  // 否则：不给跨域（但仍返回默认第一个，便于本地调试；你也可以改成直接不给）
  const allowOrigin =
    origin && allowed.includes(origin) ? origin : allowed[0] ?? "http://localhost:3000";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };
}

function isEngineType(v: unknown): v is EngineType {
  return v === "deepseek" || v === "gemini";
}

function safeString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function extractModelOutput(result: unknown): string {
  // 兼容 runEngine 返回多种字段名
  if (typeof result !== "object" || result === null) return "";
  const r = result as Record<string, unknown>;

  const candidates: Array<unknown> = [
    r.modelOutput,
    r.output,
    r.text,
    r.content,
    r.result,
  ];

  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c;
  }

  // 有些返回可能是 { data: { ... } }
  const data = r.data;
  if (typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    const innerCandidates: Array<unknown> = [d.modelOutput, d.output, d.text, d.content, d.result];
    for (const c of innerCandidates) {
      if (typeof c === "string" && c.trim()) return c;
    }
  }

  return "";
}

function pickEngineType(reqEngine: unknown, lock: string): EngineType {
  const normalizedLock = lock.toLowerCase();
  if (normalizedLock === "deepseek") return "deepseek";
  if (normalizedLock === "gemini") return "gemini";

  // 未锁死：优先请求值，否则 deepseek
  if (isEngineType(reqEngine)) return reqEngine;
  return "deepseek";
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: getCorsHeaders(req),
  });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);

  try {
    const ENGINE_LOCK = process.env.ENGINE_LOCK ?? "off"; // off | deepseek | gemini
    const ROLLOUT_GEMINI_PERCENT = process.env.ROLLOUT_GEMINI_PERCENT ?? "";
    const FALLBACK_TO_DEEPSEEK = process.env.FALLBACK_TO_DEEPSEEK ?? "";

    const requestId =
      typeof crypto !== "undefined" && "randomUUID" in crypto && typeof crypto.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

    let bodyUnknown: unknown;
    try {
      bodyUnknown = await req.json();
    } catch {
      return NextResponse.json(
        { ok: false, error: "Invalid JSON body", requestId },
        { status: 400, headers: corsHeaders }
      );
    }

    const body = (typeof bodyUnknown === "object" && bodyUnknown !== null
      ? (bodyUnknown as Record<string, unknown>)
      : {}) as Record<string, unknown>;

    const moduleId = safeString(body.moduleId);
    const promptKey = safeString(body.promptKey);
    const engineTypeRaw = body.engineType;
    const modeRaw = body.mode;
    const industryId = safeString(body.industryId);
    const userInput = safeString(body.userInput) ?? "";

    // userInput 必填，否则直接 400（避免跑空请求）
    if (!userInput.trim()) {
      return NextResponse.json(
        { ok: false, error: "userInput is required", requestId },
        { status: 400, headers: corsHeaders }
      );
    }

    const finalEngineType = pickEngineType(engineTypeRaw, ENGINE_LOCK);
    const finalMode = (typeof modeRaw === "string" && modeRaw.trim()) ? modeRaw : "default";

    // 日志：便于 Vercel logs 追查
    console.log("[/api/generate][ENV CHECK]", {
      ENGINE_LOCK,
      ROLLOUT_GEMINI_PERCENT,
      FALLBACK_TO_DEEPSEEK,
    });

    console.log("[/api/generate][API IN]", {
      requestId,
      moduleId,
      promptKey,
      engineTypeRequested: isEngineType(engineTypeRaw) ? engineTypeRaw : null,
      mode: finalMode,
      industryId,
      userInputPreview: userInput.slice(0, 80),
    });

    console.log("[/api/generate][API ENGINE]", {
      requestId,
      engineLock: ENGINE_LOCK,
      engineTypeUsed: finalEngineType,
      modeUsed: finalMode,
    });

    const runInput: RunEngineInput = {
      moduleId,
      promptKey,
      engineType: finalEngineType,
      mode: finalMode,
      industryId,
      userInput,
      requestId,
    };

    const result = await runEngine(runInput);

    // ✅ 给前端一个稳定字段：modelOutput
    const modelOutput = extractModelOutput(result);

    return NextResponse.json(
      {
        ok: true,
        requestId,

        // ✅ 统一给前端读
        modelOutput,

        // ✅ 保留原始结果，便于你调试（不想暴露可删）
        raw: result,

        // ✅ 追加调试字段
        moduleIdRequested: moduleId ?? null,
        promptKeyRequested: promptKey ?? null,
        engineTypeRequested: isEngineType(engineTypeRaw) ? engineTypeRaw : null,
        engineLock: (ENGINE_LOCK ?? "off").toLowerCase(),
        engineTypeUsed: finalEngineType,
        modeUsed: finalMode,
      },
      { status: 200, headers: corsHeaders }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[/api/generate] Error:", err);

    return NextResponse.json(
      { ok: false, error: message },
      { status: 500, headers: corsHeaders }
    );
  }
}
