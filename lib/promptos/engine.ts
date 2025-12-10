// lib/promptos/engine.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getModuleTemplate } from "./index";

const apiKey = process.env.GEMINI_API_KEY || "";

/**
 * 核心执行引擎：
 * 1) 根据 promptKey 读取模板
 * 2) 拼接 finalPrompt
 * 3) 尝试调用 Gemini（失败则降级为占位输出）
 * 4) 返回 { promptKey, finalPrompt, modelOutput }
 */
export async function runPromptModule(promptKey: string, userInput: string) {
  // 1) 读取模块模板
  const baseTemplate = getModuleTemplate(promptKey);

  if (!baseTemplate) {
    throw new Error(`❌ Unknown promptKey in engine: ${promptKey}`);
  }

  // 2) 拼接最终 Prompt
  const finalPrompt = `
${baseTemplate.trim()}

-----------------------
【用户输入】
${userInput}

【说明】
请严格按照上面的模块说明、输入要求、执行步骤与输出格式进行处理，不要偏题。
`.trim();

  // 3) 如果没有 API KEY，直接返回占位结果（链路调试用）
  if (!apiKey) {
    return {
      promptKey,
      finalPrompt,
      modelOutput:
        "（当前未配置 GEMINI_API_KEY，已跳过真实大模型调用，仅返回测试占位内容。主链路【moduleId → promptKey → finalPrompt】已跑通。）",
    };
  }

  // 4) 有 KEY 的情况：尝试调用 Gemini，如果失败也不要让接口 500
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const text = response.text();

    return {
      promptKey,
      finalPrompt,
      modelOutput: text || "（Gemini 未返回内容，请检查日志）",
    };
  } catch (error: any) {
    console.error("[engine] Gemini 调用失败：", error);

    // ⚠️ 关键：不要 throw，让路由仍然能返回 200
    return {
      promptKey,
      finalPrompt,
      modelOutput:
        "（调用 Gemini 失败，可能是网络或 Google 项目未启用 Generative Language API。但模块模板读取与 finalPrompt 生成已成功。这条内容为降级占位输出。）",
    };
  }
}
