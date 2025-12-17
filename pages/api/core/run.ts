import type { NextApiRequest, NextApiResponse } from "next";

// 下面两个路径按你项目实际文件位置改：
// 如果你的 core-map.ts / run-engine.ts 不在 lib/prompotos 下，就对应调整 import
import { CORE_PROMPT_BANK_KEY } from "@/lib/prompotos/core/core-map";
import { runEngine } from "@/lib/prompotos/run-engine";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method Not Allowed" });

  try {
    const { coreKey, tier = "basic", input, engineType, mode } = req.body ?? {};

    if (!coreKey || !input || !String(input).trim()) {
      return res.status(400).json({ ok: false, error: "Missing coreKey/input" });
    }

    const promptKey = (CORE_PROMPT_BANK_KEY as any)?.[coreKey]?.[tier];
    if (!promptKey) {
      return res.status(400).json({ ok: false, error: `promptKey not found: ${coreKey}.${tier}` });
    }

    const result = await runEngine({
      promptKey,
      userInput: String(input),
      engineType: engineType ?? "gemini",
      mode: mode ?? "default",
    });

    return res.status(200).json({
      ok: true,
      promptKey,
      output: (result as any)?.output ?? result,
      usage: (result as any)?.usage,
      traceId: (result as any)?.traceId,
    });
  } catch (e: any) {
    console.error(e);
    return res.status(500).json({ ok: false, error: e?.message || "Internal Error" });
  }
}
