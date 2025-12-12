import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { getModuleTemplate } from "./prompts";

export type RunEngineResult = {
  promptKey: string;
  engineType: string;
  finalPrompt: string;
  modelOutput: string;
  error?: string;
};

const isFinalPromptKey = (k: string) => /^[A-Z]\d+-\d+$/.test((k || "").trim());

export async function runPromptModule(
  promptKey: string,
  userInput: string,
  engineType: string = "deepseek"
): Promise<RunEngineResult> {
  const normalizedEngineType = (engineType || "deepseek").toLowerCase();

  // ✅ 只允许最终 key（防止 m1 / writing_master 这种中间态进入执行器）
  if (!isFinalPromptKey(promptKey)) {
    return {
      promptKey,
      engineType: normalizedEngineType,
      finalPrompt: "",
      modelOutput: "",
      error: `[ENGINE_GUARD] Invalid promptKey: ${promptKey}. Expect like "A1-01".`,
    };
  }

  const baseTemplate = getModuleTemplate(promptKey);
  if (!baseTemplate) {
    return {
      promptKey,
      engineType: normalizedEngineType,
      finalPrompt: "",
      modelOutput: "",
      error: `Unknown promptKey: ${promptKey}`,
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

  // ✅ DeepSeek 分支（当作 OpenAI 兼容）
  if (normalizedEngineType === "deepseek") {
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekApiKey) {
      return {
        promptKey,
        engineType: normalizedEngineType,
        finalPrompt,
        modelOutput: "",
        error: "[engine] Missing DEEPSEEK_API_KEY",
      };
    }

    try {
      const client = new OpenAI({
        apiKey: deepseekApiKey,
        baseURL: "https://api.deepseek.com",
      });

      const completion = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a professional AI assistant." },
          { role: "user", content: finalPrompt },
        ],
        temperature: 0.7,
      });

      const text = completion.choices?.[0]?.message?.content?.trim() ?? "";
      return {
        promptKey,
        engineType: normalizedEngineType,
        finalPrompt,
        modelOutput: text,
      };
    } catch (e: any) {
      return {
        promptKey,
        engineType: normalizedEngineType,
        finalPrompt,
        modelOutput: "",
        error: `[engine] DeepSeek failed: ${e?.message ?? String(e)}`,
      };
    }
  }

  // ✅ Gemini 分支（保留）
  if (normalizedEngineType === "gemini") {
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (!geminiApiKey) {
      return { promptKey, engineType: normalizedEngineType, finalPrompt, modelOutput: "", error: "[engine] Missing GEMINI_API_KEY" };
    }

    try {
      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(finalPrompt);
      const text = result?.response?.text?.() ?? "";
      return { promptKey, engineType: normalizedEngineType, finalPrompt, modelOutput: text };
    } catch (e: any) {
      return { promptKey, engineType: normalizedEngineType, finalPrompt, modelOutput: "", error: `[engine] Gemini failed: ${e?.message ?? String(e)}` };
    }
  }

  return {
    promptKey,
    engineType: normalizedEngineType,
    finalPrompt,
    modelOutput: "",
    error: `[engine] Unsupported engineType: ${normalizedEngineType}`,
  };
}

