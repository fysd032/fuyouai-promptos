// lib/promptos/engine.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import { getModuleTemplate } from "./prompts";
import { runLLM, type EngineType } from "../llm/provider";

import { PROMPT_BANK } from "./prompt-bank.generated";

export type RunEngineResult = {
  promptKey: string;
  engineType: string;
  finalPrompt: string;
  modelOutput: string;
  error?: string;
};

// -------- utils --------

function normalizeKey(k: unknown): string {
  return String(k ?? "").trim();
}

function readPromptBankTemplate(promptKey: string): string {
  const v = (PROMPT_BANK as any)[promptKey];
  if (typeof v === "string") return v;

  // 你的 PROMPT_BANK value 是 object（你已验证），优先读 content
  if (v && typeof v === "object") {
    const s = v.content ?? v.template ?? v.prompt ?? "";
    return typeof s === "string" ? s : String(s ?? "");
  }
  return "";
}

function isCoreKey(promptKey: string) {
  return promptKey.startsWith("core.");
}

function resolveBaseTemplate(promptKey: string): {
  baseTemplate: string;
  source: "bank" | "legacy" | "none";
} {
  // ✅ 五大模块：只允许走 PROMPT_BANK
  if (isCoreKey(promptKey)) {
    const bank = readPromptBankTemplate(promptKey);
    if (bank && bank.trim()) return { baseTemplate: bank, source: "bank" };
    return { baseTemplate: "", source: "none" };
  }

  // ✅ 通用模块：只允许走旧系统
  const legacy = getModuleTemplate(promptKey);
  if (legacy && legacy.trim()) return { baseTemplate: legacy, source: "legacy" };
  return { baseTemplate: "", source: "none" };
}

/**
 * ✅ 拼最终 prompt：必须把模板 + 用户输入拼进去
 * 你之前 buildFinalPrompt() 只返回“说明”，会导致模型没收到模板/输入
 */
function buildFinalPrompt(baseTemplate: string, userInput: string) {
  return `
${String(baseTemplate ?? "").trim()}

---
[USER INPUT]
${String(userInput ?? "").trim()}

[INSTRUCTIONS]
Follow the module description, input requirements, execution steps, and output format above strictly. Do not deviate from the topic. Respond in the same language as the user input above.
`.trim();
}

// -------- Legacy (直连 DeepSeek/Gemini) --------

async function runPromptModuleLegacy(
  promptKeyRaw: string,
  userInput: string,
  engineType: string = "deepseek",
  systemOverride?: string
): Promise<RunEngineResult> {
  console.log(
  "[engine] using file:",
  __filename,
  "providerV2=",
  process.env.ENGINE_PROVIDER_V2
);

  const promptKey = normalizeKey(promptKeyRaw);
  const normalizedEngineType = normalizeKey(engineType).toLowerCase() || "deepseek";

  const { baseTemplate, source } = resolveBaseTemplate(promptKey);
  if (!baseTemplate) {
    return {
      promptKey,
      engineType: normalizedEngineType,
      finalPrompt: "",
      modelOutput: "",
      error: `Unknown promptKey: ${promptKey} (not found in PROMPT_BANK / legacy modules)`,
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
          { role: "system", content: systemOverride || "You are a professional AI assistant." },
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
      const geminiPrompt = systemOverride ? `${systemOverride}\n\n${finalPrompt}` : finalPrompt;
      const result = await model.generateContent(geminiPrompt);
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

// -------- V2 (走 runLLM) --------

async function runPromptModuleV2(
  promptKeyRaw: string,
  userInput: string,
  engineType: string = "deepseek",
  systemOverride?: string
): Promise<RunEngineResult> {
  const promptKey = normalizeKey(promptKeyRaw);
  const normalizedEngineType = (normalizeKey(engineType).toLowerCase() || "deepseek") as EngineType;

  const { baseTemplate } = resolveBaseTemplate(promptKey);
  if (!baseTemplate) {
    return {
      promptKey,
      engineType: normalizedEngineType,
      finalPrompt: "",
      modelOutput: "",
      error: `Unknown promptKey: ${promptKey} (not found in PROMPT_BANK / legacy modules)`,
    };
  }

  const finalPrompt = buildFinalPrompt(baseTemplate, userInput);

  const llm = await runLLM({
    engineType: normalizedEngineType,
    prompt: finalPrompt,
    temperature: 0.7,
    systemOverride,
  });

  if (!llm.ok) {
    return { promptKey, engineType: normalizedEngineType, finalPrompt, modelOutput: "", error: llm.error };
  }

  return { promptKey, engineType: llm.engineType, finalPrompt, modelOutput: llm.text };
}

/**
 * ✅ 对外导出：保持函数名不变（server/run-engine 不用改）
 * - ENGINE_PROVIDER_V2=on -> V2
 * - 否则走 Legacy
 */
export async function runPromptModule(
  promptKey: string,
  userInput: string,
  engineType: string = "deepseek",
  systemOverride?: string
): Promise<RunEngineResult> {
  const flag = (process.env.ENGINE_PROVIDER_V2 || "").toLowerCase();
  if (flag === "on") return runPromptModuleV2(promptKey, userInput, engineType, systemOverride);
  return runPromptModuleLegacy(promptKey, userInput, engineType, systemOverride);
}
