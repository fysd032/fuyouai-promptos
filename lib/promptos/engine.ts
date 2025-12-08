// lib/promptos/engine.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getModuleTemplate } from "./index";

// 初始化 Gemini 客户端
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function runPromptModule(promptKey: string, userInput: string) {
  // 1) 从模块库读取模板
  const baseTemplate = getModuleTemplate(promptKey);

  if (!baseTemplate) {
    throw new Error(`❌ Unknown promptKey: ${promptKey}`);
  }

  // 2) 拼接最终 Prompt
  const finalPrompt = `
${baseTemplate.trim()}

-----------------------
【用户输入】
${userInput}

【说明】
请严格遵循模块说明、输入要求、执行步骤与输出格式进行处理，不要偏题。
`.trim();

  // 3) 若无 API KEY，则返回占位文本
  if (!process.env.GEMINI_API_KEY) {
    return {
      promptKey,
      finalPrompt,
      modelOutput:
        "（当前未配置 GEMINI_API_KEY，返回占位文本。主链路已跑通。）",
    };
  }

  // 4) 调用 Gemini（你可使用 gemini-1.5-flash / gemini-1.5-pro）
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash", // ← 换成你需要的 Gemini 3 模型
  });

  const result = await model.generateContent(finalPrompt);
  const response = result.response;
  const modelOutput = response.text() ?? "（模型未返回内容）";

  return {
    promptKey,
    finalPrompt,
    modelOutput,
  };
}
