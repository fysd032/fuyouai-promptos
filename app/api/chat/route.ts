import { NextResponse } from "next/server";

export async function OPTIONS() {
  return new NextResponse(null, { status: 200 });
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const message = body?.message ?? "";

  return NextResponse.json({
    reply: `后端配置成功，你说：${message}`,
  });
}
