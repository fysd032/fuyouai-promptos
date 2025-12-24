import { NextRequest, NextResponse } from "next/server";
import { runEngine } from "@/lib/promptos/run-engine";

function parseAllowedOrigins(): string[] {
  // 兼容：ALLOWED_ORIGINS / ALLOWED_ORIGIN
  const raw =
    process.env.ALLOWED_ORIGINS?.trim() ||
    process.env.ALLOWED_ORIGIN?.trim();

  if (!raw) return ["http://localhost:3000"];

  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowed = parseAllowedOrigins();

  const allowOrigin =
    origin && allowed.includes(origin)
      ? origin
      : allowed[0] ?? "http://localhost:3000";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "x-api-impl": "app/api/run/route.ts:runEngine-only",
  };
}

function safeString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

function makeRequestId(): string {
  // Vercel/Node 环境通常可用
  try {
    // @ts-ignore
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  } catch {}
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export async function POST(req: NextRequest) {
  const headers = getCorsHeaders(req);
  const requestId = makeRequestId();

  let bodyUnknown: unknown;
  try {
    bodyUnknown = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: { message: "Invalid JSON body" }, meta: { requestId } },
      { status: 400, headers }
    );
  }

  const body =
    typeof bodyUnknown === "object" && bodyUnknown !== null
      ? (bodyUnknown as Record<string, unknown>)
      : {};

  const moduleId = safeString(body.moduleId);
  const promptKey = safeString(body.promptKey);
  const engineType = safeString(body.engineType);
  const mode = safeString(body.mode);
  const industryId = safeString(body.industryId) ?? null;
  const userInput = (safeString(body.userInput) ?? "").trim();

  if (!userInput) {
    return NextResponse.json(
      { ok: false, error: { message: "Missing userInput" }, meta: { requestId } },
      { status: 400, headers }
    );
  }

  const result = await runEngine({
    moduleId,
    promptKey,
    engineType: (engineType ?? "deepseek").toString(),
    mode: (mode ?? "default").toString(),
    industryId,
    userInput,
  } as any);

  return NextResponse.json(
    { ...result, meta: { ...(result as any)?.meta, requestId } },
    { status: result?.ok ? 200 : 400, headers }
  );
}
