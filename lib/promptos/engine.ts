// lib/promptos/engine.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { getModuleTemplate } from "./prompts";
import { runLLM, type EngineType } from "../llm/provider";

export type RunEngineResult = {
  promptKey: string;
  engineType: string;
  finalPrompt: string;
  modelOutput: string;
  error?: string;
};

import { PROMPT_BANK } from "./prompt-bank.generated"; // 路径按你项目实际调整

const isFinalPromptKey = (k: string) => {
  const key = (k || "").trim();
  // ✅ 1) 老体系：A1-01 / A1-01.xxx
  const legacyOk =
    /^[A-Z]\d-\d{2}$/.test(key) || /^[A-Z]\d-\d{2}(\.\w+)?$/.test(key);

  // ✅ 2) 新体系：只要 PROMPT_BANK 里存在，就放行（包括 core.xxx）
  const bankOk = Boolean((PROMPT_BANK as any)[key]);

  return legacyOk || bankOk;
};

function buildFinalPrompt(baseTemplate: string, userInput: string) {
  return `
${(baseTemplate ?? "").trim()}

【用户输入】
${(userInput ?? "").trim()}

【说明】
请严格按照上面的模块说明、输入要求、执行步骤与输出格式进行处理，不要偏题。
`.trim();
}

/**
 * ✅ 旧实现（当前通用模块在用）：直连 DeepSeek/Gemini
 * - 保留用于兜底
 * - 只有当 ENGINE_PROVIDER_V2 != "on" 时才会走这里
 */
async  function runPromptModuleLegacy(
  promptKey: string,
  userInput: string,
  engineType: string = "deepseek"
): Promise<RunEngineResult> {
  const normalizedEngineType = (engineType || "deepseek").toLowerCase();

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

  const finalPrompt = buildFinalPrompt(baseTemplate, userInput);

  // DeepSeek（OpenAI兼容）
  if (normalizedEngineType === "deepseek") {
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;
    if (!deepseekApiKey) {
      return { promptKey, engineType: normalizedEngineType, finalPrompt, modelOutput: "", error: "[engine] Missing DEEPSEEK_API_KEY" };
    }

    try {
      const client = new OpenAI({ apiKey: deepseekApiKey, baseURL: "https://api.deepseek.com" });
      const completion = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a professional AI assistant." },
          { role: "user", content: finalPrompt },
        ],
        temperature: 0.7,
      });

      const text = completion.choices?.[0]?.message?.content?.trim() ?? "";
      return { promptKey, engineType: normalizedEngineType, finalPrompt, modelOutput: text };
    } catch (e: any) {
      return { promptKey, engineType: normalizedEngineType, finalPrompt, modelOutput: "", error: `[engine] DeepSeek failed: ${e?.message ?? String(e)}` };
    }
  }

  // Gemini
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

/**
 * ✅ 新实现（公共厨师）：走 runLLM()
 * - 只有当 ENGINE_PROVIDER_V2 === "on" 时启用
 */
async function runPromptModuleV2(
  promptKey: string,
  userInput: string,
  engineType: string = "deepseek"
): Promise<RunEngineResult> {
  const normalizedEngineType = (engineType || "deepseek").toLowerCase() as EngineType;

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

  const finalPrompt = buildFinalPrompt(baseTemplate, userInput);

  const llm = await runLLM({
    engineType: normalizedEngineType,
    prompt: finalPrompt,
    temperature: 0.7,
  });

  if (!llm.ok) {
    return { promptKey, engineType: normalizedEngineType, finalPrompt, modelOutput: "", error: llm.error };
  }

  return { promptKey, engineType: llm.engineType, finalPrompt, modelOutput: llm.text };
}

/**
 * ✅ 对外导出：保持函数名不变（通用模块不需要改任何调用）
 * - 默认走 Legacy（不影响通用模块）
 * - 开关打开后走 V2
 */
export async function runPromptModule(
  promptKey: string,
  userInput: string,
  engineType: string = "deepseek"
): Promise<RunEngineResult> {
  const flag = (process.env.ENGINE_PROVIDER_V2 || "").toLowerCase();
  if (flag === "on") {
    return runPromptModuleV2(promptKey, userInput, engineType);
  }
  return runPromptModuleLegacy(promptKey, userInput, engineType);
}
