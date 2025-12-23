import { NextRequest, NextResponse } from "next/server";
import { runEngine } from "@/lib/promptos/run-engine";

function parseAllowedOrigins(): string[] {
  // 你可以在 Vercel 设置：ALLOWED_ORIGINS=http://localhost:3000,https://xxx.vercel.app
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

  const allowOrigin =
    origin && allowed.includes(origin) ? origin : allowed[0] ?? "http://localhost:3000";

  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Vary": "Origin",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    // ✅ 指纹：用来确认命中的是这份文件（Network 里能看到）
    "x-api-impl": "app/api/run/route.ts:runEngine-only",
  };
}

function safeString(v: unknown): string | undefined {
  return typeof v === "string" ? v : undefined;
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export async function POST(req: NextRequest) {
  const headers = getCorsHeaders(req);

  // ✅ 生成 requestId，便于你对 log
  const requestId =
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

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

  // ✅ 通用模块只认这些字段：promptKey + userInput（coreKey/tier 一律不需要）
  const moduleId = safeString(body.moduleId);
  const promptKey = safeString(body.promptKey);
  const engineType = safeString(body.engineType);
  const mode = safeString(body.mode);
  const industryId = safeString(body.industryId) ?? null;
  const userInput = (safeString(body.userInput) ?? "").trim();

  // ✅ userInput 必填：避免空请求
  if (!userInput) {
    return NextResponse.json(
      { ok: false, error: { message: "Missing userInput" }, meta: { requestId } },
      { status: 400, headers }
    );
  }

  // ✅ 不强制 promptKey（你有些模块可能靠 moduleId+mode 解析），但建议前端都传
  // 如果你想强制 promptKey，就把下面注释打开：
  // if (!promptKey) {
  //   return NextResponse.json(
  //     { ok: false, error: { message: "Missing promptKey" }, meta: { requestId } },
  //     { status: 400, headers }
  //   );
  // }

  const result = await runEngine({
    moduleId,
    promptKey,
    engineType: (engineType ?? "deepseek").toString(),
    mode: (mode ?? "default").toString(),
    industryId,
    userInput,
  } as any);

  // ✅ 直接把 runEngine 的结果返回给前端（前端不用改）
  // 关键：这里不会再出现 Missing coreKey（因为我们完全不读取 coreKey）
  return NextResponse.json(
    { ...result, meta: { ...(result as any)?.meta, requestId } },
    { status: result?.ok ? 200 : 400, headers }
  );
}
