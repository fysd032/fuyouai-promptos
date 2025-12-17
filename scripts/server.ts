import express from "express";
import cors from "cors";
import type { Request, Response } from "express";

// ✅ 你贴出来的 Core 映射文件里有 CORE_PROMPT_BANK_KEY
// 路径按你项目实际调整：如果 server.ts 在 scripts/ 里，通常是 ../lib/...
import { CORE_PROMPT_BANK_KEY } from "../lib/promptos/core/core-map";

// ✅ 引擎入口：你刚贴的 run-engine.ts
// 路径按你项目实际调整：如果 run-engine.ts 在 lib/promptos/，通常是 ../lib/promptos/run-engine
import { runEngine } from "../lib/promptos/run-engine";

type CoreRunBody = {
  coreKey?: keyof typeof CORE_PROMPT_BANK_KEY;
  tier?: "basic" | "pro";
  input?: string;

  // 可选：你以后想开放选择引擎/模式就传
  engineType?: string;
  mode?: string;
};

const app = express();
app.use(cors({ origin: true }));
app.use(express.json());

app.post("/api/core/run", async (req: Request, res: Response) => {
  try {
    const { coreKey, tier, input, engineType, mode } = (req.body ?? {}) as CoreRunBody;

    if (!coreKey || !tier || !input || !input.trim()) {
      return res.status(400).json({
        error: "Missing required fields: coreKey, tier, input",
        received: { coreKey, tier, input },
      });
    }

    const promptKey = CORE_PROMPT_BANK_KEY[coreKey]?.[tier];
    if (!promptKey) {
      return res.status(400).json({
        error: "Invalid coreKey/tier mapping",
        received: { coreKey, tier },
      });
    }

    // ✅ 关键：调用你的引擎
    // 注意：runEngine 目前 userInput: any（后续可改类型），我们这里传 string
    const result = await runEngine({
      promptKey,                 // 直接用 core prompt key
      userInput: input,          // 用户输入
      engineType: engineType ?? "deepseek", // 保持你引擎的默认值
      mode: mode ?? "default",
      // moduleId 不传：我们是 Core 专用，不走通用 moduleId 体系
    });

    if (!result.ok) {
      return res.status(400).json({
        error: result.error ?? "runEngine failed",
        requestId: result.requestId,
        promptKeyResolved: result.promptKey,
      });
    }

    // ✅ 返回给前端：保持你前端现在用的字段名
    return res.status(200).json({
      output: result.modelOutput ?? "（模型未返回内容）",
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
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

app.listen(3001, () => {
  console.log("✅ Core API running at http://localhost:3001");
});
