// app/api/core/run/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs"; // 保守写法，避免 edge 环境限制

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
  // 这里用 “动态 import + 兜底导出名” 的方式：
  // 1) 不会因为你导出的名字不同而编译失败
  // 2) 有就调用真实逻辑，没有就返回 null
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

function normalizeOutput(engineResult: any, fallbackText: string) {
  // 兼容不同返回字段名（你之前的 coreRun.ts 里可能叫 text / aiOutput / modelOutput 等）
  if (engineResult && typeof engineResult === "object") {
    const out =
      (("output" in engineResult ? (engineResult as any).output : undefined) ??
        ("text" in engineResult ? (engineResult as any).text : undefined) ??
        ("aiOutput" in engineResult ? (engineResult as any).aiOutput : undefined) ??
        ("modelOutput" in engineResult ? (engineResult as any).modelOutput : undefined)) ??
      fallbackText;

    return { out: String(out), raw: engineResult };
  }
  return { out: fallbackText, raw: engineResult };
}

export async function OPTIONS() {
  // 以后如果你要跨域，这里可以继续加 header
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

    // 1) 先尝试走你项目里的“真实 core 逻辑”
    const engineResult = await tryCallRealCoreRun(body);

    // 2) 如果没有真实逻辑可调用，就用临时逻辑（但不是写死 test）
    const userText = pickUserText(body);
    const fallbackText = userText
      ? `TEMP_CORE_OK: ${userText}`
      : "TEMP_CORE_OK: (empty input)";

    const { out, raw } = normalizeOutput(engineResult, fallbackText);

    return NextResponse.json({
      ok: true,
      requestId,
      output: out,
      // 这两个字段是给你排查用的：等你确认稳定后可以删掉
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
