import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { ArrowLeft, Play, Sparkles, Terminal, Copy, Check } from "lucide-react";
import { StatusFeedback, FeedbackStatus } from "../components/StatusFeedback";
import { MODULES_DB } from "../data/universalModules";
import { INDUSTRY_TEMPLATES_DB } from "../data/industryTemplates";
import { callPromptOS } from "@/lib/promptos";
// ⭐ 统一调用 PromptOS API

type AnyObj = Record<string, any>;

function safeStringify(x: any) {
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

function pickFirst<T = any>(obj: AnyObj, paths: string[]): T | undefined {
  for (const p of paths) {
    const segs = p.split(".");
    let cur: any = obj;
    let ok = true;
    for (const s of segs) {
      if (cur && typeof cur === "object" && s in cur) cur = cur[s];
      else {
        ok = false;
        break;
      }
    }
    if (ok && cur !== undefined && cur !== null) return cur as T;
  }
  return undefined;
}

const ModuleRunnerPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const moduleKey = searchParams.get("module") || "";

  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState<FeedbackStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [result, setResult] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  // 统一在通用模块 + 行业模板里查找 module 信息
  const moduleInfo =
    MODULES_DB.find((m) => m.id === moduleKey) ||
    INDUSTRY_TEMPLATES_DB.find((m) => m.id === moduleKey) || {
      title: "Unknown Module",
      desc: "Module not found",
      promptPreview: "",
    };

  useEffect(() => {
    // 每次切换 module 时重置状态
    setResult("");
    setGeneratedPrompt("");
    setStatus("idle");
    setUserInput("");
    setErrorMsg("");
    setCopied(false);
  }, [moduleKey]);

  const handleRun = async () => {
    try {
      const input = userInput.trim();
      if (!input) return;

      setStatus("loading");
      setErrorMsg("");

      /**
       * ✅ ModuleRunner 的正确语义：
       * - moduleKey 就是 promptKey（例如 A1-01 / industry-xxx / general-xxx）
       * - 直接走 callPromptOS（它内部会根据 VITE_PROMPTOS_API_BASE 去请求后端）
       */
      const resp: AnyObj = await callPromptOS({
        promptKey: moduleKey,
        userInput: input,
        mode: "default",
      });

      // 兼容不同返回结构（你后端/云端可能字段名不一样）
      const ok = Boolean(resp?.ok ?? resp?.success ?? resp?.raw?.ok);
      if (!ok) {
        const err =
          resp?.error ??
          resp?.message ??
          resp?.raw?.error ??
          "调用失败（返回 ok=false）";
        throw new Error(typeof err === "string" ? err : safeStringify(err));
      }

      const out =
        pickFirst<string>(resp, [
          "modelOutput",
          "output",
          "text",
          "data.output",
          "raw.modelOutput",
          "raw.output",
        ]) ?? safeStringify(resp);

      const fp =
        pickFirst<string>(resp, [
          "finalPrompt",
          "prompt",
          "data.prompt",
          "raw.finalPrompt",
          "raw.prompt",
        ]) ?? "";

      setResult(out);
      setGeneratedPrompt(fp);
      setStatus("success");
    } catch (err: any) {
      console.error(err);
      setStatus("error");
      setErrorMsg(err?.message ? String(err.message) : String(err));
      setResult("");
      setGeneratedPrompt("");
    }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto pb-10">
      {/* --- Breadcrumb & Header --- */}
      <div className="flex items-center justify-between mb-6 pt-2">
        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
          <Link to="/modules" className="hover:text-[#F9FAFB] transition-colors">
            模块中心
          </Link>
          <span className="text-[#4B5563]">/</span>
          <span className="text-[#F9FAFB]">运行控制台</span>
        </div>
        <Link
          to="/modules/general"
          className="flex items-center gap-2 text-sm text-[#9CA3AF] hover:text-[#3B82F6] transition-colors group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span>返回列表</span>
        </Link>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 mb-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-[#3B82F6]/10 rounded-xl text-[#3B82F6]">
            <Terminal size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F9FAFB] mb-1">
              {moduleInfo.title}
            </h1>
            <p className="text-[#9CA3AF] text-sm max-w-2xl">
              {moduleInfo.desc}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 bg-[#1F2937] border border-[#374151] rounded text-[10px] text-[#9CA3AF] font-mono">
              Key: {moduleKey}
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 h-full min-h-[500px]">
        {/* Left: Input Area */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-1 flex-1 flex flex-col shadow-lg">
            <div className="px-5 py-4 border-b border-[#1F2937] flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#3B82F6]" />
              <span className="text-sm font-medium text-[#F9FAFB]">
                任务输入 (Input)
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col">
              <textarea
                className="flex-1 w-full bg-[#0A0F1C] border border-[#1F2937] rounded-xl p-4 text-[#F9FAFB] text-[15px] resize-none focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/20 transition-all placeholder:text-[#4B5563] leading-relaxed"
                placeholder="在此输入您的具体任务要求..."
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
              />

              <div className="mt-5 flex justify-end">
                <button
                  onClick={handleRun}
                  disabled={status === "loading" || !userInput.trim()}
                  className="bg-[#3B82F6] hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-medium flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 hover:-translate-y-0.5"
                >
                  {status === "loading" ? (
                    "生成中..."
                  ) : (
                    <>
                      <Play size={18} fill="currentColor" /> 开始运行
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Output Area */}
        <div className="flex flex-col gap-4">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl flex-1 flex flex-col shadow-lg relative overflow-hidden h-full">
            <div className="px-5 py-4 border-b border-[#1F2937] flex items-center justify-between bg-[#1F2937]/30">
              <div className="flex items-center gap-2 text-sm font-medium text-[#F9FAFB]">
                <Sparkles size={16} className="text-emerald-400" /> AI 输出结果
              </div>
              {result && (
                <button
                  onClick={handleCopy}
                  className="text-[#9CA3AF] hover:text-white transition-colors flex items-center gap-1.5 text-xs bg-[#1F2937] px-2 py-1 rounded border border-[#374151]"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "已复制" : "复制结果"}
                </button>
              )}
            </div>

            {/* Status Bar */}
            {status !== "idle" && status !== "success" && (
              <div className="px-4 pt-4">
                <StatusFeedback
                  status={status}
                  message={errorMsg}
                  onRetry={handleRun}
                />
              </div>
            )}

            <div className="flex-1 p-0 overflow-y-auto custom-scrollbar relative bg-[#0A0F1C]/50">
              {result ? (
                <div className="p-6">
                  {/* 可选：调试查看最终 Prompt */}
                  {generatedPrompt && (
                    <details className="mb-6 group">
                      <summary className="text-[10px] uppercase tracking-widest text-[#6B7280] cursor-pointer hover:text-[#3B82F6] list-none flex items-center gap-2 mb-2">
                        <Terminal size={10} /> 查看实际使用的 Prompt
                      </summary>
                      <div className="bg-[#0A0F1C] border border-[#1F2937] rounded-lg p-4 overflow-x-auto">
                        <pre className="text-xs font-mono text-[#4B5563] whitespace-pre-wrap">
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
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-[#6B7280] opacity-40">
                  {status === "loading" ? (
                    <div className="w-16 h-16 rounded-full bg-[#3B82F6]/10 animate-pulse" />
                  ) : (
                    <>
                      <Terminal size={48} className="mb-4 stroke-[1]" />
                      <p className="text-sm">等待任务执行...</p>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleRunnerPage;
