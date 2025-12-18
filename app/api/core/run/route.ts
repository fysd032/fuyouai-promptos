import { NextResponse } from "next/server";
// ⚠️ 先别真的引入 runEngine，等你理解了再接
// import { runEngine } from "@/lib/promptos/run-engine";

export async function POST(req: Request) {
  const requestId = crypto.randomUUID();

  try {
    const body = await req.json().catch(() => ({}));

    const coreKey = String(body?.coreKey ?? "");
    const tier = String(body?.tier ?? "basic");
    const userInput = String(body?.userInput ?? "");

    // ✅ 最小校验
    if (!coreKey) {
      return NextResponse.json(
        {
          ok: false,
          error: { code: "INVALID_INPUT", message: "Missing coreKey" },
          meta: { requestId },
        },
        { status: 400 }
      );
    }

    /**
     * ✅ 核心开关：是否走真实 core 执行器
     * - 不设置 / 非 on → 走 MOCK（当前安全状态）
     * - 设置 CORE_RUN_REAL=on → 将来才会走真逻辑
     */
    const useRealCore = (process.env.CORE_RUN_REAL || "").toLowerCase() === "on";

    if (!useRealCore) {
      // 🟢 当前阶段：MOCK 返回（你现在就在这里）
      return NextResponse.json({
        ok: true,
        output: `TEMP_CORE_OK: ${userInput}`,
        meta: { requestId },
      });
    }

    // 🔵 未来阶段：真实 core 执行器（现在先不启用）
    // const result = await runEngine({
    //   moduleId: coreKey,
    //   mode: tier,
    //   userInput,
    // });

    // return NextResponse.json({
    //   ok: result.ok,
    //   output: result.modelOutput,
    //   meta: { requestId },
    // });

    // ⚠️ 防御性兜底（防止你误开开关）
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "CORE_RUN_NOT_ENABLED",
          message: "CORE_RUN_REAL is on, but real core logic is not wired yet.",
        },
        meta: { requestId },
      },
      { status: 500 }
    );
  } catch (e: any) {
    return NextResponse.json(
      {
        ok: false,
        error: { code: "INTERNAL", message: e?.message ?? String(e) },
        meta: { requestId },
      },
      { status: 500 }
    );
  }
}
