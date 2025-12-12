// lib/promptos/engine.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { getModuleTemplate } from "./prompts";

export type EngineType = "gemini" | "deepseek";

export type RunPromptResult = {
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
  engineType: string = "gemini"
): Promise<RunPromptResult> {
  // ✅ HARD GUARD：只允许最终 key（A1-01/E5-02）
  if (!isFinalPromptKey(promptKey)) {
    return {
      promptKey,
      engineType,
      finalPrompt: "",
      modelOutput: "",
      error:
        `[ENGINE_GUARD] Invalid promptKey: "${promptKey}". ` +
        `Engine only accepts final keys like "A1-01" / "E5-02".`,
      availableKeysHint:
        "请先通过 resolver：mX/frontModuleId -> module_mapping.v2.json -> backendModules.promptKey(A1-xx)，再调用执行器。",
    };
  }

  const baseTemplate = getModuleTemplate(promptKey);
  if (!baseTemplate) {
    return {
      promptKey,
      engineType,
      finalPrompt: "",
      modelOutput: "",
      error: `Unknown promptKey: ${promptKey}`,
      availableKeysHint: "请检查 prompts.generated.ts 中实际存在的 key",
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

  const normalized = (engineType || "gemini").toLowerCase();

  // ========== DeepSeek (OpenAI-compatible) ==========
  if (normalized === "deepseek") {
    const deepseekApiKey = process.env.DEEPSEEK_API_KEY;

    if (!deepseekApiKey) {
      return {
        promptKey,
        engineType: "deepseek",
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
        engineType: "deepseek",
        finalPrompt,
        modelOutput: text,
      };
    } catch (e: any) {
      console.error("[engine] DeepSeek 调用失败：", e);
      return {
        promptKey,
        engineType: "deepseek",
        finalPrompt,
        modelOutput: "",
        error: `[engine] DeepSeek 调用失败: ${e?.message ?? String(e)}`,
      };
    }
  }

  // ========== Gemini ==========
  const geminiApiKey = process.env.GEMINI_API_KEY;
  if (!geminiApiKey) {
    // 没 key 时返回 prompt，方便你调试链路
    return {
      promptKey,
      engineType: "gemini",
      finalPrompt,
      modelOutput: "",
      error: "[engine] Missing GEMINI_API_KEY",
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(finalPrompt);
    const text = result?.response?.text?.() ?? "";

    return {
      promptKey,
      engineType: "gemini",
      finalPrompt,
      modelOutput: text,
    };
  } catch (e: any) {
    console.error("[engine] Gemini 调用失败：", e);
    return {
      promptKey,
      engineType: "gemini",
      finalPrompt,
      modelOutput: "",
      error: `[engine] Gemini 调用失败: ${e?.message ?? String(e)}`,
    };
  }
}

// ✅ 兼容旧接口：外部如果 import runPromptModule 不用改
export const runPromptModule = runEngine;
