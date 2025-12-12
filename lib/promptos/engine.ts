// lib/promptos/engine.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getModuleTemplate } from "./index";

const geminiApiKey = process.env.GEMINI_API_KEY || "";

/**
 * 核心执行引擎：
 * 1) 根据 promptKey 读取模板
 * 2) 拼接 finalPrompt
 * 3) 根据 engineType 调用不同模型（当前只实现 gemini）
 * 4) 任意失败都降级，不阻断主链路
 */
export async function runPromptModule(
  promptKey: string,
  userInput: string,
  engineType: string = "gemini"
) {
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

  /**
   * 3) 根据 engineType 选择模型执行
   * ⚠️ 当前阶段：只保证主链路跑通
   */
  switch (engineType) {
    case "gemini":
    default: {
      // 3.1 如果没有 Gemini Key，直接返回占位结果
      if (!geminiApiKey) {
        return {
          promptKey,
          engineType,
          finalPrompt,
          modelOutput:
            "（当前未配置 GEMINI_API_KEY，已跳过真实大模型调用，仅返回测试占位内容。主链路【moduleId → promptKey → finalPrompt】已跑通。）",
        };
      }

      // 3.2 有 Key：尝试调用 Gemini
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
        });

        const result = await model.generateContent(finalPrompt);
        const response = await result.response;
        const text = response.text();

        return {
          promptKey,
          engineType,
          finalPrompt,
          modelOutput: text || "（Gemini 未返回内容，请检查日志）",
        };
      } catch (error: any) {
        console.error("[engine] Gemini 调用失败：", error);

        // ⚠️ 关键原则：不 throw，保证接口可返回
        return {
          promptKey,
          engineType,
          finalPrompt,
          modelOutput:
            "（调用 Gemini 失败，可能是网络或 Google 项目未启用 Generative Language API。但模块模板读取与 finalPrompt 生成已成功。这条内容为降级占位输出。）",
        };
      }
    }
  }
}
