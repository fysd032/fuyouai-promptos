import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const prompt = body?.prompt ?? "";

  return NextResponse.json(
    { ok: true, text: `收到prompt：${prompt}` },
    { status: 200 }
  );
}
