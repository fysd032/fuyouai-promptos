// lib/llm/provider.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";

export type EngineType = "deepseek" | "gemini";

export type RunLLMInput = {
  engineType: EngineType;
  prompt: string;
  requestId?: string;
  temperature?: number;
};

export type RunLLMOutput =
  | { ok: true; engineType: EngineType; text: string }
  | { ok: false; engineType: EngineType; error: string };

export async function runLLM(input: RunLLMInput): Promise<RunLLMOutput> {
  const engineType = (input.engineType || "deepseek").toLowerCase() as EngineType;
  const prompt = input.prompt ?? "";
  const temperature = input.temperature ?? 0.7;

  // ✅ DeepSeek (OpenAI-compatible)
  if (engineType === "deepseek") {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) return { ok: false, engineType, error: "[llm] Missing DEEPSEEK_API_KEY" };

    try {
      const client = new OpenAI({ apiKey, baseURL: "https://api.deepseek.com" });
      const completion = await client.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a professional AI assistant." },
          { role: "user", content: prompt },
        ],
        temperature,
      });

      const text = completion.choices?.[0]?.message?.content?.trim() ?? "";
      return { ok: true, engineType, text };
    } catch (e: any) {
      return { ok: false, engineType, error: `[llm] DeepSeek failed: ${e?.message ?? String(e)}` };
    }
  }

  // ✅ Gemini
  if (engineType === "gemini") {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return { ok: false, engineType, error: "[llm] Missing GEMINI_API_KEY" };

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(prompt);
      const text = result?.response?.text?.() ?? "";
      return { ok: true, engineType, text };
    } catch (e: any) {
      return { ok: false, engineType, error: `[llm] Gemini failed: ${e?.message ?? String(e)}` };
    }
  }

  return { ok: false, engineType, error: `[llm] Unsupported engineType: ${engineType}` };
}
