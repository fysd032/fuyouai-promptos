import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));

  // ✅ 兼容多种字段来源
  const prompt =
    body?.prompt ??
    body?.userInput ??
    body?.input?.text ??
    "";

  return NextResponse.json(
    { ok: true, text: `收到prompt：${prompt}` },
    { status: 200 }
  );
}
