// api/core/run.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS（本地 dev 也不挡）
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: { code: "METHOD_NOT_ALLOWED" } });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body ?? {});
    const coreKey = String(body.coreKey || "").trim();
    const tier = String(body.tier || "basic").trim();
    const userInput = String(body.userInput || "").trim();
    const engineType = String(body.engineType || "deepseek").trim();

    if (!coreKey) return res.status(400).json({ ok: false, error: { code: "INVALID_INPUT", message: "Missing coreKey" } });
    if (!userInput) return res.status(400).json({ ok: false, error: { code: "INVALID_INPUT", message: "Missing userInput" } });

    // ✅ 假输出：先把 UI/链路跑通
    const output =
`【任务拆解结果（MOCK）】
目标：${userInput}

1) 明确交付物
2) 列出关键模块
3) 拆分步骤（Step-by-step）
4) 标注依赖/风险
5) 给出验收标准

coreKey=${coreKey}, tier=${tier}, engineType=${engineType}
`;

    return res.status(200).json({
      ok: true,
      output,
      meta: {
        requestId: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        coreKey,
        tier,
        engineType,
        useRealCore: false,
      },
    });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: { code: "INTERNAL", message: e?.message || String(e) } });
  }
}
