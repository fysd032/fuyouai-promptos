import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const body = await req.json().catch(() => ({}));

    const coreKey = String(body?.coreKey ?? "");
    const tier = String(body?.tier ?? "basic");
    const userInput = String(body?.userInput ?? "");

    // ✅ 最小校验（先别复杂化）
    if (!coreKey) {
      return NextResponse.json(
        { ok: false, error: { code: "INVALID_INPUT", message: "Missing coreKey" }, meta: { requestId } },
        { status: 400 }
      );
    }

    // ✅ mock 输出：证明链路通了
    return NextResponse.json({
      ok: true,
      data: {
        text: `[MOCK core/run] coreKey=${coreKey}, tier=${tier}\nuserInput=${userInput}`,
      },
      meta: { requestId },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "INTERNAL", message: e?.message ?? String(e) }, meta: { requestId } },
      { status: 500 }
    );
  }
}
