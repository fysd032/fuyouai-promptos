// app/api/core/run/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type AnyObj = Record<string, any>;

function pickUserText(body: AnyObj) {
  return (
    body?.userInput ??
    body?.input ??
    body?.text ??
    body?.prompt ??
    body?.message ??
    ""
  );
}

async function tryCallRealCoreRun(body: AnyObj) {
  try {
    // route.ts 在 app/api/core/run/ 下，handlers 在 app/api/handlers/
    const mod: any = await import("../../handlers/coreRun");

    const fn =
      mod?.default ??
      mod?.coreRun ??
      mod?.run ??
      mod?.handler ??
      mod?.coreRunHandler;

    if (typeof fn === "function") {
      return await fn(body);
    }
    return null;
  } catch {
    return null;
  }
}

function normalizeOutput(engineResult: unknown, fallbackText: string) {
  if (!engineResult || typeof engineResult !== "object") {
    return { out: fallbackText, raw: engineResult };
  }
  const r = engineResult as Record<string, unknown>;

  const out =
    (typeof r.content === "string" ? r.content : undefined) ??
    (typeof r.output === "string" ? r.output : undefined) ??
    (typeof r.text === "string" ? r.text : undefined) ??
    (typeof r.aiOutput === "string" ? r.aiOutput : undefined) ??
    (typeof r.modelOutput === "string" ? r.modelOutput : undefined) ??
    fallbackText;

  return { out: String(out), raw: engineResult };
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}

export async function POST(req: Request) {
  const requestId = `core_${Date.now()}`;

  try {
    const body = (await req.json().catch(() => ({}))) as AnyObj;

    // 1) 优先调用 handlers/coreRun.ts（如果存在且可用）
    const engineResult = await tryCallRealCoreRun(body);

    // 2) 没有真实逻辑/或调用失败 -> fallback（不写死 test，拿用户输入）
    const userText = pickUserText(body);
    const fallbackText = userText
      ? `TEMP_CORE_OK: ${userText}`
      : "TEMP_CORE_OK: (empty input)";

    const { out, raw } = normalizeOutput(engineResult, fallbackText);

    return NextResponse.json({
      ok: true,
      requestId,

      // ✅ 给前端/旧代码兼容
      output: out,

      // ✅ 推荐你未来统一用 content
      content: out,

      // 调试字段（稳定后可删）
      received: body,
      engineRaw: raw,
    });
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        requestId,
        error: e?.message ?? "unknown error",
      },
      { status: 500 }
    );
  }
}
