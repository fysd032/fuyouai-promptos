// ====== run-engine.ts (核心片段：直接替换你的函数体即可) ======
import { getModuleTemplate } from "./prompts";


import { GoogleGenerativeAI } from "@google/generative-ai";
// 注意：下面这两个依赖你项目原本怎么引入的，保持你原来的即可
// import { getModuleTemplate } from "./prompts";  // or "./prompts.generated"
// const geminiApiKey = process.env.GEMINI_API_KEY ?? "";

type RunEngineResult = {
  promptKey: string;
  engineType: string;
  finalPrompt: string;
  modelOutput: string;
  error?: string;
  availableKeysHint?: string;
};

const isFinalPromptKey = (k: string) => /^[A-Z]\d+-\d+$/.test((k || "").trim());

export async function runEngine(
  promptKey: string,
  userInput: string,
  geminiApiKey?: string,
  engineType: string = "gemini"
): Promise<RunEngineResult> {
  // ✅ ENGINE GUARD：只允许最终 promptKey（A1-01 / E5-02），禁止 m1 / writing_master 等中间态
  if (!isFinalPromptKey(promptKey)) {
    return {
      promptKey,
      engineType,
      finalPrompt: "",
      modelOutput: "",
      error:
        `[ENGINE_GUARD] Invalid promptKey: "${promptKey}". ` +
        `Engine only accepts final keys like "A1-01" / "E5-02". ` +
        `Do NOT pass m1/m2 or frontModuleId (writing_master/storyteller).`,
      availableKeysHint:
        "请先通过 resolver：mX/frontModuleId -> module_mapping.v2.json -> backendModules[0].promptKey (A1-xx)，再调用 runEngine。",
    };
  }

  // 你原来的模板获取逻辑（保持不变）
  const baseTemplate = getModuleTemplate(promptKey);

  if (!baseTemplate) {
    return {
      promptKey,
      engineType,
      finalPrompt: "",
      modelOutput: "",
      error: `Unknown promptKey: ${promptKey}`,
      availableKeysHint: "请检查 prompts.generated.ts / prompts.ts 里实际存在的 key",
    };
  }

  const finalPrompt = `
${baseTemplate.trim()}

-----------------------
【用户输入】
${userInput}

【说明】
请严格按照上面的模块说明、输入要求、执行步骤与输出格式进行处理，不要偏题。
`.trim();

  const normalizedEngineType = (engineType || "gemini").toLowerCase();

  switch (normalizedEngineType) {
    case "gemini":
    default: {
      // 没 key 时，按你原逻辑：只返回 prompt（方便调试）
      if (!geminiApiKey) {
        return {
          promptKey,
          engineType: normalizedEngineType,
          finalPrompt,
          modelOutput: "",
        };
      }

      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(finalPrompt);
        const text = result?.response?.text?.() ?? "";

        return {
          promptKey,
          engineType: normalizedEngineType,
          finalPrompt,
          modelOutput: text,
        };
      } catch (e: any) {
        console.error("[engine] Gemini 调用失败：", e);
        return {
          promptKey,
          engineType: normalizedEngineType,
          finalPrompt,
          modelOutput: "",
          error: `[engine] Gemini 调用失败：${e?.message ?? String(e)}`,
        };
      }
    }
  }
}
export const runPromptModule = runEngine;
