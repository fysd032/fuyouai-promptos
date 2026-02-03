// scripts/server.ts
import express from "express";
import cors from "cors";
import type { Request, Response, NextFunction } from "express";
import { resolveCorePromptKey } from "../lib/promptos/core/resolve-core"; // ← 按项目调整
import { runEngine } from "../lib/promptos/run-engine"; // ← 按项目调整
import { CORE_PROMPT_BANK_KEY, resolveCorePlan } from "../lib/promptos/core/core-map";
import { assertCorePromptMapping } from "../lib/promptos/core/core-map";
import { detectLanguage } from "../lib/lang/detectLanguage";
import "dotenv/config";

 // ← 按项目调整

type CoreRunBody = {
  coreKey?: keyof typeof CORE_PROMPT_BANK_KEY;
  tier?: "basic" | "pro";
  input?: string;

  // 可选参数
  engineType?: string;
  mode?: string;
};

// ============ App Setup ============
const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));

// 简单 request log（可按需删）
app.use((req: Request, _res: Response, next: NextFunction) => {
  // 避免日志爆炸：只打关键字段
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ============ Health ============
app.get("/healthz", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true });
});

// ============ Core Run API ============
app.post("/api/core/run", async (req: Request, res: Response) => {
  try {
    const { coreKey, tier, input, engineType, mode } = (req.body ?? {}) as CoreRunBody;

    // 1) 参数校验
    if (!coreKey || !tier || !input || !input.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Missing required fields: coreKey, tier, input",
        received: { coreKey, tier, input },
      });
    }

    // 2) 映射解析：coreKey + tier -> promptKey
const resolved = resolveCorePromptKey(coreKey, tier);
const promptKey = (resolved as any)?.promptKey;


// debug（临时用）
console.log("[debug] typeof promptKey =", typeof promptKey);
console.log("[debug] promptKey value =", promptKey);

if (!promptKey) {
  return res.status(400).json({
    ok: false,
    error: "Invalid coreKey/tier mapping (promptKey not found)",
    received: { coreKey, tier },
  });
}

    const language = detectLanguage(input);

    // 3) 调引擎
    const result = await runEngine({
      promptKey,
      userInput: input,
      engineType: engineType ?? "deepseek",
      mode: mode ?? "default",
      language,
      // moduleId: undefined // Core 专用，不走 moduleId
    });

    // 4) 引擎失败
    if (!result.ok) {
      return res.status(400).json({
        ok: false,
        error: result.error ?? "runEngine failed",
        requestId: result.requestId,
        promptKeyResolved: result.promptKey,
      });
    }

    // 5) 成功返回
    const outputText = String(result.modelOutput ?? "");
    const outputMode = result.mode;

    return res.status(200).json({
      ok: true,
      output: outputText || "（模型未返回内容）",
      text: outputText || "（模型未返回内容）",
      mode: outputMode,
      language,
      prompt: result.finalPrompt ?? "",
      meta: {
        requestId: result.requestId,
        coreKey,
        tier,
        promptKey: result.promptKey,
        engineTypeUsed: result.engineTypeUsed,
      },
    });
} catch (err: unknown) {
  console.error("[Core API Error]", err);
  if (err instanceof Error) {
    console.error("[Core API Error message]", err.message);
    console.error("[Core API Error stack]", err.stack);
  }
  return res.status(500).json({ ok: false, error: "Internal Server Error" });
}

});
// ✅ 启动期校验开关：CORE_VERIFY=0 时跳过
// 先打印出来，方便确认环境变量有没有生效
console.log(
  "[core] CORE_VERIFY=",
  process.env.CORE_VERIFY,
  "NODE_ENV=",
  process.env.NODE_ENV
);

// 如果你 core-map.ts 里有 assertCorePromptMapping，就在这里调用
// 没有的话先不要加这行（否则会报未定义）
if (process.env.CORE_VERIFY !== "0" && process.env.NODE_ENV !== "production") {
  // assertCorePromptMapping();
}

// ============ Start ============
const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`✅ Core API running at http://localhost:${port}`);
});
