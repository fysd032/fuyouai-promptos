import React, { useCallback, useMemo, useState } from "react";
import { callCoreFramework } from "../lib/coreframework-api";
import { CORE_TAB_TO_COREKEY } from "../data/ui-corekey-map";
import { Link } from "react-router-dom";
import { Sparkles, Copy, Check, Play, Loader2, Cpu, Terminal, Info } from "lucide-react";
import { StatusFeedback } from "../components/StatusFeedback";

// --- 数据配置 ---
const CORE_FRAMEWORKS = [
  {
    key: "task-decomposition-v3",
    title: "任务拆解",
    fullTitle: "任务拆解框架 (Task Decomposition)",
    desc: "将模糊的一句话需求，拆解为清晰的执行步骤、约束条件与交付标准。",
    bullets: ["识别核心目标与隐性约束", "拆解为 Step-by-Step 执行流", "定义明确的交付物格式"],
    prompt: `(等待生成...)`,
  },
  {
    key: "reasoning-engine-v3",
    title: "CoT 推理",
    fullTitle: "CoT 深度推理框架 (Chain of Thought)",
    desc: "强制模型进行逐步推理（Step-by-Step），避免直觉性错误，适用于复杂逻辑分析。",
    bullets: ["问题重述与关键信息提取", "多路径逻辑推演", "收敛结论并验证"],
    prompt: `(等待生成...)`,
  },
  {
    key: "content-builder-v3",
    title: "内容生成",
    fullTitle: "内容生成结构化框架 (Content Builder)",
    desc: "先定义目标受众与大纲，再填充正文，确保长文写作逻辑严密、风格统一。",
    bullets: ["明确受众与核心痛点", "构建金字塔结构大纲", "分模块填充内容"],
    prompt: `(等待生成...)`,
  },
  {
    key: "analytical-engine-v3",
    title: "深度分析",
    fullTitle: "分析类推理框架 (Analytical Engine)",
    desc: "以咨询顾问视角，多维度拆解商业或社会问题，提供有证据支持的决策建议。",
    bullets: ["定义问题边界", "3-5 个维度的 MECE 分析", "基于证据的行动建议"],
    prompt: `(等待生成...)`,
  },
  {
    key: "task-tree-v3",
    title: "复杂任务树",
    fullTitle: "复杂任务结构树 (Task Tree / ToT)",
    desc: "针对超大型项目，构建层级化的任务树，标注依赖关系与风险点。",
    bullets: ["Level 0-2 任务层级划分", "识别任务间依赖关系", "制定执行路线图"],
    prompt: `(等待生成...)`,
  },
] as const;

type CoreFrameworkUIKey = (typeof CORE_FRAMEWORKS)[number]["key"];

const CoreFrameworkPage: React.FC = () => {
  const [activeKey, setActiveKey] = useState<CoreFrameworkUIKey>(CORE_FRAMEWORKS[0].key);
  const [activeTab, setActiveTab] = useState<"preview" | "output">("preview");
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [tier, setTier] = useState<"basic" | "pro">("basic");
  const [engineType, setEngineType] = useState<"deepseek" | "gemini">("deepseek");

  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  const activeItem = useMemo(
    () => CORE_FRAMEWORKS.find((item) => item.key === activeKey) || CORE_FRAMEWORKS[0],
    [activeKey]
  );

  const handleRun = useCallback(async () => {
    if (!userInput.trim()) {
      alert("请输入您的需求描述");
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    setActiveTab("output");
    setCurrentStep(2);
    setAiOutput("");
    setCopied(false);

    // 先清空预览（真正的 prompt 以服务端返回 finalPrompt 为准）
    setGeneratedPrompt("");

    try {
      // UI key → coreKey
      // UI key → coreKey
const tabKey = activeKey;
const coreKey = CORE_TAB_TO_COREKEY[tabKey as keyof typeof CORE_TAB_TO_COREKEY];

if (!coreKey) {
  throw new Error(
    `❌ core-map.ts 未配置映射：tabKey="${tabKey}"。请去 src/data/core-map.ts 补上映射到后端 coreKey（如 task_tree）。`
  );
}

// 硬防呆：coreKey 必须是 snake_case（后端白名单），不应包含 "-"
if (coreKey.includes("-")) {
  throw new Error(
    `❌ 映射错误：你得到的 coreKey="${coreKey}" 含有 "-"，看起来像 tabKey。\n` +
      `请检查 src/data/core-map.ts：把 "${tabKey}" 映射成 task_tree/task_breakdown/cot_reasoning/content_builder/analytical_engine 之一。`
  );
}

// 可观测：出了问题你截图 console 我就能秒定位
console.log("[CoreRun]", { tabKey, coreKey, tier, engineType, len: userInput.length });

// 唯一执行入口：/api/core/run
const data = await callCoreFramework({
  coreKey,
  tier,
  userInput,
  engineType,
});


      setAiOutput(data.output ?? "");
      setStatus("success");

      // 服务端如果给 finalPrompt，就用它做“Prompt 预览”
      if (data.finalPrompt) {
        setGeneratedPrompt(data.finalPrompt);
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message ?? String(err));
    }
  }, [activeKey, userInput, tier, engineType]);

  const handleCopy = useCallback(async () => {
    const textToCopy =
      activeTab === "preview"
        ? generatedPrompt || activeItem.prompt || ""
        : aiOutput || "";

    if (!textToCopy.trim()) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      try {
        const textarea = document.createElement("textarea");
        textarea.value = textToCopy;
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "-9999px";
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1200);
      } catch (err) {
        console.error("Copy failed", err);
      }
    }
  }, [activeTab, generatedPrompt, aiOutput, activeItem.prompt]);

  return (
    <div className="flex flex-col w-full h-full">
      <div className="flex items-center gap-2 text-sm text-[#9CA3AF] mb-2 pt-2">
        <Link to="/modules" className="hover:text-[#F9FAFB] transition-colors">
          模块中心
        </Link>
        <span className="text-[#4B5563]">/</span>
        <span className="text-[#F9FAFB]">核心框架</span>
      </div>

      <div className="relative pt-4 pb-10 text-center z-10">
        <h1 className="text-[32px] font-semibold text-[#F9FAFB] tracking-tight mb-2 drop-shadow-sm">
          核心框架 (Core Methodologies)
        </h1>
        <p className="text-[#9CA3AF] text-base max-w-2xl mx-auto mb-8">
          基于思维链 (CoT) 与结构化工程的 5 大核心引擎，让 AI 输出稳定可控。
        </p>

        <div className="inline-flex p-1 bg-[#111827] border border-[#1F2937] rounded-xl shadow-lg">
          {CORE_FRAMEWORKS.map((fw) => {
            const isActive = activeKey === fw.key;
            return (
              <button
                key={fw.key}
                onClick={() => {
                  setActiveKey(fw.key);
                  setCurrentStep(1);
                  setStatus("idle");
                  setErrorMsg("");
                  setAiOutput("");
                  setGeneratedPrompt("");
                  setCopied(false);
                }}
                className={`
                  px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? "bg-[#3B82F6] text-white shadow-md shadow-blue-900/20"
                      : "text-[#9CA3AF] hover:text-[#F9FAFB] hover:bg-[#1F2937]"
                  }
                `}
              >
                {fw.title}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_480px] gap-8 items-start pb-20">
        <div className="flex flex-col gap-6">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-6 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-xl font-medium text-[#F9FAFB] mb-2">{activeItem.fullTitle}</h2>
                <p className="text-[#9CA3AF] text-sm leading-relaxed max-w-xl">{activeItem.desc}</p>
              </div>
              <div className="p-2 bg-[#3B82F6]/10 rounded-lg text-[#3B82F6]">
                <Info size={20} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {activeItem.bullets.map((bullet, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs text-[#9CA3AF] bg-[#1F2937]/50 px-3 py-2 rounded-lg border border-[#1F2937]"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] flex-shrink-0" />
                  {bullet}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden shadow-xl shadow-black/20">
            <div className="px-6 py-4 border-b border-[#1F2937] flex items-center gap-3 bg-[#1F2937]/30">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border ${
                  currentStep === 1
                    ? "border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/10"
                    : "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                }`}
              >
                {currentStep === 1 ? "1" : <Check size={16} />}
              </div>
              <span className="text-sm font-medium text-[#F9FAFB]">
                {currentStep === 1 ? "输入需求描述 (Input Context)" : "执行完成 (Execution Done)"}
              </span>
            </div>

            <div className="p-6">
              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={`在此输入您的任务...\n例如："帮我拆解一个 SaaS 产品的年度增长目标，包含市场投放和销售转化两个维度。"`}
                className="w-full h-[240px] bg-[#0A0F1C] border border-[#1F2937] rounded-xl p-5 text-[15px] text-[#F9FAFB] placeholder:text-[#6B7280] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/20 transition-all resize-none leading-relaxed"
              />

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleRun}
                  disabled={status === "loading" || !userInput.trim()}
                  className="flex items-center gap-2 px-8 py-3 bg-[#3B82F6] hover:bg-blue-600 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-900/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {status === "loading" ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <Play size={18} fill="currentColor" />
                  )}
                  {status === "loading" ? "正在生成..." : "生成 Prompt 并运行"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-6 flex flex-col h-[640px] bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden shadow-xl shadow-black/40">
          <div className="flex items-center border-b border-[#1F2937] bg-[#1F2937]/30">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${
                activeTab === "preview" ? "text-[#3B82F6]" : "text-[#9CA3AF] hover:text-[#F9FAFB]"
              }`}
            >
              <Terminal size={16} />
              Prompt 预览
              {activeTab === "preview" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#3B82F6]" />}
            </button>
            <div className="w-[1px] h-6 bg-[#1F2937]" />
            <button
              onClick={() => setActiveTab("output")}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${
                activeTab === "output" ? "text-emerald-400" : "text-[#9CA3AF] hover:text-[#F9FAFB]"
              }`}
            >
              <Sparkles size={16} />
              AI 输出结果
              {activeTab === "output" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
            </button>
          </div>

          {status !== "idle" && status !== "success" && (
            <div className="px-4 pt-4">
              <StatusFeedback status={status} message={errorMsg} onRetry={handleRun} />
            </div>
          )}

          <div className="flex-1 overflow-hidden relative bg-[#0A0F1C]/50">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-[#1F2937] border border-[#374151] text-[#9CA3AF] hover:text-white transition-colors"
                title="复制内容"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>

            {activeTab === "preview" && (
              <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                <pre className="font-mono text-xs md:text-sm text-[#D1D5DB] whitespace-pre-wrap leading-relaxed">
                  {generatedPrompt || activeItem.prompt || "// 等待运行后由后端返回 finalPrompt..."}
                </pre>
              </div>
            )}

            {activeTab === "output" && (
              <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                {aiOutput ? (
                  <div className="prose prose-invert prose-sm max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-[15px] text-[#E5E7EB] leading-[1.7]">
                      {aiOutput}
                    </pre>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-[#6B7280] space-y-3">
                    {status === "loading" ? (
                      <>
                        <Loader2 size={32} className="animate-spin text-[#3B82F6]" />
                        <span className="text-sm">正在思考中...</span>
                      </>
                    ) : (
                      <>
                        <Cpu size={32} className="opacity-20" />
                        <span className="text-sm opacity-50">运行后在此查看结果</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoreFrameworkPage;
