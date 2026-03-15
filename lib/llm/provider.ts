// lib/llm/provider.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export type EngineType = "deepseek" | "gemini";

export type RunLLMInput = {
  engineType: EngineType;
  prompt: string;
  temperature?: number;
  systemOverride?: string;
};

export type TokenUsage = { input: number; output: number };

export type RunLLMOutput =
  | { ok: true; engineType: EngineType; text: string; tokenUsage?: TokenUsage }
  | { ok: false; engineType: EngineType; error: string; tokenUsage?: TokenUsage };

export async function runLLM(input: RunLLMInput): Promise<RunLLMOutput> {
  const engineType = (input.engineType || "deepseek").toLowerCase() as EngineType;
  const prompt = input.prompt ?? "";
  const temperature = input.temperature ?? 0.7;

  if (engineType === "deepseek") {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return { ok: false, engineType, error: "[llm] Missing DEEPSEEK_API_KEY" };

    try {
      const client = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
      const completion = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: input.systemOverride || "You are a professional AI assistant." },
          { role: "user", content: prompt },
        ],
        temperature,
      });

      const text = completion.choices?.[0]?.message?.content?.trim() ?? "";
      const usage = completion.usage;
      const tokenUsage: TokenUsage | undefined = usage
        ? { input: usage.prompt_tokens, output: usage.completion_tokens }
        : undefined;
      return { ok: true, engineType, text, tokenUsage };
    } catch (e: any) {
      return { ok: false, engineType, error: `[llm] DeepSeek failed: ${e?.message ?? String(e)}` };
    }
  }

  if (engineType === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { ok: false, engineType, error: "[llm] Missing GEMINI_API_KEY" };

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const geminiPrompt = input.systemOverride ? `${input.systemOverride}\n\n${prompt}` : prompt;
      const result = await model.generateContent(geminiPrompt);
      const text = result?.response?.text?.() ?? "";
      const meta = result?.response?.usageMetadata;
      const tokenUsage: TokenUsage | undefined = meta
        ? { input: meta.promptTokenCount ?? 0, output: meta.candidatesTokenCount ?? 0 }
        : undefined;
      return { ok: true, engineType, text, tokenUsage };
    } catch (e: any) {
      return { ok: false, engineType, error: `[llm] Gemini failed: ${e?.message ?? String(e)}` };
    }
  }

  return { ok: false, engineType, error: `[llm] Unsupported engineType: ${engineType}` };
}
