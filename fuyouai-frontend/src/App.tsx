import React, { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Play, Sparkles, Terminal, Copy, Check } from "lucide-react";
import type { FeedbackStatus } from "./components/StatusFeedback";
import { StatusFeedback } from "./components/StatusFeedback";
import { callPromptOS } from "../lib/gemini";

type ModuleVariantMeta = {
  promptKey?: string; // 真正要调用后端的 promptKey（如 A1-01）
  variantId?: string; // 选中的子功能 id（如 longform_article）
};

interface ModuleRunnerProps {
  moduleType: "general" | "industry";
  moduleKey: string; // 兜底 key（一般是 frontModuleId）
  moduleData: {
    title: string;
    desc: string;
    promptPreview: string;
  } & ModuleVariantMeta & Record<string, unknown>;
  onBack?: () => void;
}

type CallPromptOSResult = {
  modelOutput?: string;
  aiOutput?: string;
  output?: string;
  text?: string;
  finalPrompt?: string;
};

export const ModuleRunner: React.FC<ModuleRunnerProps> = ({
  moduleType,
  moduleKey,
  moduleData,
  onBack,
}) => {
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState<FeedbackStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  // ✅ 最终要调用后端的 promptKey：优先用 moduleData.promptKey（A1-01），否则回退 moduleKey
  const resolvedPromptKey = useMemo(() => {
    return (moduleData?.promptKey || "").trim() || (moduleKey || "").trim();
  }, [moduleData?.promptKey, moduleKey]);

  // ✅ 是否允许运行：把原因拆开，便于你在 Console 一眼定位
  const canRun = useMemo(() => {
    const hasInput = !!userInput.trim();
    const hasKey = !!resolvedPromptKey.trim();
    const notLoading = status !== "loading";
    return hasInput && hasKey && notLoading;
  }, [userInput, resolvedPromptKey, status]);

  // Reset state when the active module changes（promptKey 或模块变化都清空）
  useEffect(() => {
    setResult("");
    setGeneratedPrompt("");
    setStatus("idle");
    setUserInput("");
    setErrorMsg("");
  }, [moduleKey, moduleData?.promptKey, moduleData?.variantId]);

  const pickOutput = (data: CallPromptOSResult): string => {
    return (
      data.modelOutput ||
      data.aiOutput ||
      data.output ||
      data.text ||
      "AI returned empty response."
    );
  };

  const handleRun = async () => {
    // ✅ 操作码日志：你看到这行，说明按钮点击确实进来了
    console.log("[ModuleRunner] RUN_CLICK", {
      moduleType,
      moduleKey,
      resolvedPromptKey,
      variantId: moduleData?.variantId,
      status,
      userInputLen: userInput.length,
      canRun,
    });

    if (!userInput.trim()) {
      setStatus("error");
      setErrorMsg("请输入任务内容后再运行。");
      console.warn("[ModuleRunner] BLOCKED: empty userInput");
      return;
    }

    if (!resolvedPromptKey.trim()) {
      setStatus("error");
      setErrorMsg("未找到可用的 promptKey，请先选择子功能（variant）后再运行。");
      console.warn("[ModuleRunner] BLOCKED: empty promptKey", {
        moduleKey,
        promptKeyFromData: moduleData?.promptKey,
      });
      return;
    }

    if (status === "loading") {
      console.warn("[ModuleRunner] BLOCKED: already loading");
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    setResult("");
    setGeneratedPrompt("");

    try {
      // ✅ 操作码日志：你看到这行，说明即将发请求
      console.log("[ModuleRunner] CALL_API_START", {
       promptKey: corePromptKey
        userInputPreview: userInput.slice(0, 80),
      });

      const data = (await callPromptOS({
        promptKey: resolvedPromptKey,
        userInput,
      })) as CallPromptOSResult;

      // ✅ 操作码日志：你看到这行，说明请求回来了（不管成功还是空）
      console.log("[ModuleRunner] CALL_API_OK", data);

      setResult(pickOutput(data));
      setGeneratedPrompt(data.finalPrompt || moduleData.promptPreview || "");
      setStatus("success");
    } catch (err: unknown) {
      console.error("[ModuleRunner] CALL_API_ERROR", err);
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "网络请求失败");
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(moduleData.promptPreview || "");
      alert("Prompt 模板已复制");
    } catch {
      alert("复制失败，请手动复制");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#111827] rounded-2xl overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2937] bg-[#111827] z-10">
        <div className="flex items-center gap-4">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
          )}

          <div>
            <h2 className="text-lg font-bold text-[#F9FAFB] tracking-tight">
              {moduleData.title}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="text-[10px] text-[#6B7280] font-mono bg-[#1F2937] px-1.5 rounded border border-[#374151]">
                Running
              </span>
              <span className="text-xs text-[#9CA3AF] truncate max-w-[240px]">
                {moduleData.desc}
              </span>

              {/* ✅ 让你一眼看到：当前跑的是哪个 promptKey / variantId */}
              <span className="text-[10px] text-[#10B981] bg-[#064E3B]/30 px-2 py-0.5 rounded border border-[#065F46] font-mono">
                promptKey: {resolvedPromptKey || "(empty)"}
              </span>
              {moduleData.variantId ? (
                <span className="text-[10px] text-[#93C5FD] bg-[#1E3A8A]/20 px-2 py-0.5 rounded border border-[#1D4ED8] font-mono">
                  variant: {moduleData.variantId}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <button
          onClick={handleCopyPrompt}
          className="text-xs text-[#9CA3AF] hover:text-[#3B82F6] flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#374151] hover:border-[#3B82F6]/50 transition-all"
        >
          <Copy size={12} /> 仅复制 Prompt
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="flex flex-col gap-6 h-full">
          {/* Input */}
          <div className="flex flex-col gap-3">
            <label className="text-sm font-medium text-[#F9FAFB] flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
              任务输入 (Input)
            </label>

            <div className="bg-[#0A0F1C] border border-[#1F2937] rounded-xl p-4 shadow-inner">
              <textarea
                className="w-full bg-transparent border-none text-[#F9FAFB] text-[15px] resize-none focus:outline-none focus:ring-0 placeholder:text-[#4B5563] leading-relaxed min-h-[120px]"
                placeholder="在此输入您的具体任务要求..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
              />

              <div className="mt-3 flex justify-end border-t border-[#1F2937/50] pt-3">
                <button
                  onClick={handleRun}
                  disabled={!canRun}
                  className="bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 hover:-translate-y-0.5 text-sm"
                >
                  {status === "loading" ? (
                    "生成中..."
                  ) : (
                    <>
                      <Play size={16} fill="currentColor" /> 运行 Module
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Status */}
          <StatusFeedback status={status} message={errorMsg} onRetry={handleRun} />

          {/* Output */}
          {result ? (
            <div className="flex flex-col gap-3 flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-[#F9FAFB] flex items-center gap-2">
                  <Sparkles size={16} className="text-emerald-400" />
                  AI 输出结果
                </label>

                <button
                  onClick={handleCopy}
                  className="text-[#9CA3AF] hover:text-white transition-colors flex items-center gap-1.5 text-xs bg-[#1F2937] px-2 py-1 rounded border border-[#374151]"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "已复制" : "复制结果"}
                </button>
              </div>

              <div className="bg-[#0A0F1C]/50 border border-[#1F2937] rounded-xl p-0 flex-1 overflow-hidden flex flex-col shadow-lg">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
                  {generatedPrompt && (
                    <details className="mb-6 group">
                      <summary className="text-[10px] uppercase tracking-widest text-[#6B7280] cursor-pointer hover:text-[#3B82F6] list-none flex items-center gap-2 mb-2 select-none">
                        <Terminal size={10} /> Debug System Prompt
                      </summary>
                      <div className="bg-[#0A0F1C] border border-[#1F2937] rounded-lg p-3 overflow-x-auto">
                        <pre className="text-[10px] font-mono text-[#4B5563] whitespace-pre-wrap">
                          {generatedPrompt}
                        </pre>
                      </div>
                    </details>
                  )}

                  <div className="prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-[15px] text-[#E5E7EB] leading-[1.8]">
                      {result}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          ) : status !== "loading" ? (
            <div className="flex-1 flex flex-col items-center justify-center text-[#6B7280] opacity-30 min-h-[200px] border-2 border-dashed border-[#1F2937] rounded-xl">
              <Terminal size={40} className="mb-3 stroke-[1]" />
              <p className="text-sm">Ready to execute</p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
