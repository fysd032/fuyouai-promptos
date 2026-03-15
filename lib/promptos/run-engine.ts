import { frontendModuleIdMap } from "./frontendModuleIdMap";
import { runPromptModule, buildEngineContext } from "./engine";
import { resolvePromptKey } from "./module-map.generated";
import { runLLMStream, type EngineType, type TokenUsage } from "../llm/provider";

export async function runEngine({
  moduleId,
  promptKey,
  engineType,
  mode,
  industryId,
  userInput,
  systemOverride,
  language,
}: {
  moduleId?: string;
  promptKey?: string;
  engineType?: string;
  mode?: string;
  industryId?: string | null;
  userInput: any;
  systemOverride?: string;
  language?: string;
}) {
  const requestId = crypto.randomUUID();

  const finalEngineType = (engineType ?? "deepseek").toString(); // ✅ 先跑稳，默认 deepseek
  const finalMode = (mode ?? "default").toString();

  const normalizedModuleId =
    moduleId && (frontendModuleIdMap as any)[moduleId]
      ? (frontendModuleIdMap as any)[moduleId]
      : moduleId;

  const realKey = resolvePromptKey({
    moduleId: normalizedModuleId,
    promptKey,
    engineType: finalEngineType,
    mode: finalMode,
  });

  if (!realKey) {
    return {
      ok: false,
      requestId,
      engineTypeRequested: finalEngineType,
      promptKeyResolved: null,
      error: `无法解析 promptKey，请检查：moduleId=${normalizedModuleId}, promptKey=${promptKey}`,
    };
  }

  const userInputStr =
    typeof userInput === "string"
      ? userInput
      : JSON.stringify(userInput ?? {}, null, 2);

  const langGuard = buildLanguageGuard(language);
  const result = await runPromptModule(
    realKey,
    userInputStr,
    finalEngineType,
    langGuard || systemOverride
  );

  const out = String(result.modelOutput ?? "").trim();
  const ok = !result.error && out.length > 0;
  const outputMode = isClarificationOnly(out) ? "clarification" : "normal";

  return {
    ok,
    requestId,
    moduleId: normalizedModuleId,
    promptKey: realKey,
    engineTypeRequested: finalEngineType,
    engineTypeUsed: result.engineType,
    mode: outputMode,
    industryId: industryId ?? null,
    finalPrompt: result.finalPrompt,
    modelOutput: result.modelOutput,
    language,
    error: result.error ?? null,
    tokenUsage: result.tokenUsage ?? null,
  };

}

export type RunEngineStreamResult = {
  ok: boolean;
  requestId: string;
  tokenUsage?: TokenUsage | null;
  error?: string | null;
  mode?: "clarification" | "normal";
  finalPrompt?: string;
};

/**
 * Streaming variant of runEngine.
 * Calls onChunk for every text delta received from the AI provider.
 * Returns metadata (tokenUsage, mode, etc.) after the stream finishes.
 * Does NOT call the LLM non-streaming path — always uses provider streaming.
 */
export async function runEngineStream(
  args: {
    moduleId?: string;
    promptKey?: string;
    engineType?: string;
    mode?: string;
    industryId?: string | null;
    userInput: any;
    systemOverride?: string;
    language?: string;
  },
  onChunk: (chunk: string) => void
): Promise<RunEngineStreamResult> {
  const requestId = crypto.randomUUID();
  const finalEngineType = (args.engineType ?? "deepseek").toString();

  const normalizedModuleId =
    args.moduleId && (frontendModuleIdMap as any)[args.moduleId]
      ? (frontendModuleIdMap as any)[args.moduleId]
      : args.moduleId;

  const realKey = resolvePromptKey({
    moduleId: normalizedModuleId,
    promptKey: args.promptKey,
    engineType: finalEngineType,
    mode: (args.mode ?? "default").toString(),
  });

  if (!realKey) {
    return {
      ok: false,
      requestId,
      error: `无法解析 promptKey，请检查：moduleId=${normalizedModuleId}, promptKey=${args.promptKey}`,
    };
  }

  const userInputStr =
    typeof args.userInput === "string"
      ? args.userInput
      : JSON.stringify(args.userInput ?? {}, null, 2);

  const langGuard = buildLanguageGuard(args.language);
  const effectiveOverride = langGuard || args.systemOverride;

  // Build the prompt without calling the LLM
  const ctx = buildEngineContext(realKey, userInputStr, effectiveOverride);
  if (!ctx.ok) {
    return { ok: false, requestId, error: ctx.error };
  }

  // Stream from provider
  const streamResult = await runLLMStream(
    {
      engineType: finalEngineType as EngineType,
      prompt: ctx.finalPrompt,
      temperature: 0.7,
      systemOverride: effectiveOverride,
    },
    onChunk
  );

  if (streamResult.error) {
    return { ok: false, requestId, error: streamResult.error };
  }

  return {
    ok: true,
    requestId,
    tokenUsage: streamResult.tokenUsage ?? null,
    mode: "normal", // clarification detection requires full output — done in route
    finalPrompt: ctx.finalPrompt,
  };
}

function normalizeLanguageName(lang: string) {
  switch (lang.toLowerCase()) {
    case "en":
      return "English";
    case "zh":
      return "Chinese (Simplified)";
    case "ja":
      return "Japanese";
    case "ko":
      return "Korean";
    case "fr":
      return "French";
    case "de":
      return "German";
    case "es":
      return "Spanish";
    case "pt":
      return "Portuguese";
    case "ru":
      return "Russian";
    case "ar":
      return "Arabic";
    case "it":
      return "Italian";
    default:
      return lang;
  }
}

function buildLanguageGuard(language?: string) {
  const raw = (language ?? "").trim();
  if (!raw) return "";

  const lang = normalizeLanguageName(raw);

  return `LANGUAGE GUARD:
You MUST respond ONLY in ${lang}.
Do NOT mix other languages.
All headings, labels, and fixed phrases must be in ${lang}.
If any template or system text is in another language, translate it into ${lang} before responding.
If the user input is insufficient, ask clarifying questions ONLY in ${lang}.`;
}

function isClarificationOnly(output: string) {
  const lines = output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0 || lines.length > 3) return false;

  const marker = /^(\d+[\.\)]|[-*•])\s*/;
  for (const line of lines) {
    const text = line.replace(marker, "").trim();
    if (!text) return false;
    if (text.length > 200) return false;
    if (/[:：]/.test(text)) return false;
    if (/```|---|===|\||\{|\}|\[|\]/.test(text)) return false;
  }

  return true;
}
