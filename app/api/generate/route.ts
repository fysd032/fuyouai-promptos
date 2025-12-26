import { NextResponse } from "next/server";
import { runPromptModule } from "@/lib/promptos/engine";

export async function POST(req: Request) {
  try {
    // 1) 读取前端传参
    const body = await req.json().catch(() => ({}));
    const { promptKey, userInput, engineType = "deepseek" } = body || {};

    if (!promptKey || !userInput) {
      return NextResponse.json(
        { ok: false, error: "Missing promptKey or userInput" },
        { status: 400 }
      );
    }

    // 2) 真正调用引擎 + 超时保护
    const TIMEOUT_MS = 55_000;

    const result = (await Promise.race([
      runPromptModule(promptKey, userInput, engineType),
      new Promise((resolve) =>
        setTimeout(() => {
          resolve({
            error: "TIMEOUT",
            promptKey,
            engineType,
            finalPrompt: "",
            modelOutput: "",
          });
        }, TIMEOUT_MS)
      ),
    ])) as any;

    // 3) 超时降级（给旧前端 text，也给新前端 modelOutput）
    if (result?.error === "TIMEOUT") {
      const msg = "正在生成，请耐心等待。";
      return NextResponse.json({
        ok: true,
        degraded: true,
        promptKey,
        engineType,
        finalPrompt: "",
        modelOutput: msg,
        text: msg, // ✅ 关键：兼容旧前端
      });
    }

    // 4) 统一输出：确保 text 永远存在（兼容旧系统）
    const payload = {
      ok: typeof result?.ok === "boolean" ? result.ok : true,
      ...result,
      // ✅ 旧系统读 text，新系统读 modelOutput
      text:
        (typeof result?.modelOutput === "string" && result.modelOutput) ||
        (typeof result?.text === "string" && result.text) ||
        "",
    };

    return NextResponse.json(payload);
  } catch (e: any) {
    console.error("[api/generate] failed:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal Server Error" },
      { status: 500 }
    );
  }
}
