"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { callCoreFramework } from "@/src/lib/coreframework-api";
import { CORE_TAB_TO_COREKEY } from "@/src/data/ui-corekey-map";
import Link from "next/link";
import { Sparkles, Copy, Check, Play, Loader2, Cpu, Terminal, Info, Upload, X, Trash2, Mic } from "lucide-react";
import { StatusFeedback } from "@/src/components/StatusFeedback";
import { useSubscription } from "@/src/context/SubscriptionContext";

// --- Attachment & Helper Types ---
type Attachment = {
  id: string;
  name: string;
  text: string;
  size: number;
};

function makeId(): string {
  if (
    typeof crypto !== "undefined" &&
    "randomUUID" in crypto &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

const MAX_FILE_BYTES = 500 * 1024; // 500KB per file
const MAX_TOTAL_CHARS = 8000; // Total character limit

// --- Guidance hint below output box (multilingual) ---
const CONTINUE_HINTS: Record<string, string> = {
  zh: "请在同一个输入框中继续补充信息，不要删除已有内容。",
  en: "Continue typing in the same input box. Do not delete any content.",
  ja: "同じ入力ボックスに入力を続けてください。既存の内容は削除しないでください。",
  ko: "같은 입력란에 계속 입력하세요. 기존 내용을 삭제하지 마세요.",
  ru: "Продолжайте вводить текст в том же поле. Не удаляйте существующее содержимое.",
  ar: "يرجى الاستمرار في الكتابة داخل نفس مربع الإدخال. لا تحذف أي محتوى موجود.",
  de: "Tippen Sie im selben Eingabefeld weiter. Löschen Sie keine Inhalte.",
  fr: "Continuez à saisir dans la même zone de texte. Ne supprimez aucun contenu.",
  es: "Siga escribiendo en el mismo cuadro de entrada. No elimine ningún contenido.",
  pt: "Continue digitando na mesma caixa de entrada. Não apague nenhum conteúdo.",
  it: "Continua a digitare nello stesso campo di input. Non eliminare alcun contenuto.",
};

function detectLanguage(text: string): string {
  if (!text) return "en";
  if (/[\u4e00-\u9fff]/.test(text)) return "zh";
  if (/[\u3040-\u30ff]/.test(text)) return "ja";
  if (/[\uac00-\ud7af]/.test(text)) return "ko";
  if (/[\u0400-\u04ff]/.test(text)) return "ru";
  if (/[\u0600-\u06ff]/.test(text)) return "ar";
  const lower = text.toLowerCase();
  if (/\b(il|lo|la|i|gli|le|un|una|è|sono|per|con|non)\b/.test(lower)) return "it";
  if (/\b(le|la|les|des|une?|est|sont|dans|pour|avec|cette)\b/.test(lower)) return "fr";
  if (/\b(der|die|das|ein|eine|ist|und|für|mit|nicht)\b/.test(lower)) return "de";
  if (/\b(el|la|los|las|un|una|está|son|para|con)\b/.test(lower)) return "es";
  if (/\b(o|a|os|as|um|uma|está|são|para|com|não)\b/.test(lower)) return "pt";
  return "en";
}

// --- Data Configuration ---
const CORE_FRAMEWORKS = [
  {
    key: "task-decomposition-v3",
    title: "Task Decomposition",
    fullTitle: "Task Decomposition",
    desc: "Break down complex, dynamic requirements into clear execution steps, constraints, and delivery standards.",
    bullets: ["Flexible core configuration and tag classification", "Cumulative step-by-step execution flow", "Support for nested loops and staged output"],
    prompt: `(Generating...)`,
  },
  {
    key: "reasoning-engine-v3",
    title: "CoT Reasoning",
    fullTitle: "CoT Deep Reasoning Framework (Chain of Thought)",
    desc: "Force the model to reason step-by-step, avoiding intuitive errors, suitable for complex logical analysis.",
    bullets: ["Problem restatement and key info extraction", "Multi-path logical reasoning", "Converge conclusions and verify"],
    prompt: `(Generating...)`,
  },
  {
    key: "content-builder-v3",
    title: "Content Generation",
    fullTitle: "Structured Content Generation Framework (Content Builder)",
    desc: "Define target audience and outline first, then fill in content, ensuring logical consistency and unified style for long-form writing.",
    bullets: ["Identify audience and core pain points", "Build pyramid-structured outline", "Fill content module by module"],
    prompt: `(Generating...)`,
  },
  {
    key: "analytical-engine-v3",
    title: "Deep Analysis",
    fullTitle: "Analytical Reasoning Framework (Analytical Engine)",
    desc: "From a consultant's perspective, analyze business or social issues from multiple dimensions, providing evidence-based decision recommendations.",
    bullets: ["Define problem boundaries", "MECE analysis across 3-5 dimensions", "Evidence-based action recommendations"],
    prompt: `(Generating...)`,
  },
  {
    key: "task-tree-v3",
    title: "Complex Task Tree",
    fullTitle: "Complex Task Structure Tree (Task Tree / ToT)",
    desc: "For large-scale projects, build hierarchical task trees, marking dependencies and risk points.",
    bullets: ["Level 0-2 task hierarchy division", "Identify inter-task dependencies", "Develop execution roadmap"],
    prompt: `(Generating...)`,
  },
] as const;

type CoreFrameworkUIKey = (typeof CORE_FRAMEWORKS)[number]["key"];

const IS_DEV = process.env.NEXT_PUBLIC_DEV_MODE === "true";

const CoreFrameworkPage: React.FC = () => {
  const { subscription } = useSubscription();

  const [activeKey, setActiveKey] = useState<CoreFrameworkUIKey>(CORE_FRAMEWORKS[0].key);
  const [activeTab, setActiveTab] = useState<"preview" | "output">("preview");
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [tier, setTier] = useState<"basic" | "pro">("basic");
  const [engineType, setEngineType] = useState<"deepseek" | "gemini">("deepseek");

  // Auto-sync tier from subscription (dev mode allows manual override)
  useEffect(() => {
    if (IS_DEV) return; // dev mode: keep manual selection
    if (subscription?.plan === "pro") {
      setTier("pro");
    } else {
      setTier("basic");
    }
  }, [subscription?.plan]);



  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [aiOutput, setAiOutput] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [copied, setCopied] = useState(false);

  // File attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activeAttachmentId, setActiveAttachmentId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Voice input (Web Speech API)
  const recognitionRef = useRef<any>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechInterim, setSpeechInterim] = useState("");

  const lang = useMemo(() => detectLanguage(userInput || ""), [userInput]);
  const continueHint = CONTINUE_HINTS[lang] ?? CONTINUE_HINTS.en;

  const activeItem = useMemo(
    () => CORE_FRAMEWORKS.find((item) => item.key === activeKey) || CORE_FRAMEWORKS[0],
    [activeKey]
  );

  // Current active attachment
  const activeAttachment = useMemo(() => {
    if (!activeAttachmentId) return null;
    return attachments.find((a) => a.id === activeAttachmentId) ?? null;
  }, [attachments, activeAttachmentId]);

  // Final input: user input + all attachments
  const finalInput = useMemo(() => {
    const base = userInput.trim();
    if (attachments.length === 0) return base;

    const appendix = attachments
      .map((a) => `\n\n---\n[Attachment: ${a.name}]\n${a.text}`)
      .join("");

    return base ? `${base}${appendix}` : `[Attachment Content]${appendix}`;
  }, [userInput, attachments]);

  // Initialize Web Speech API
  useEffect(() => {
    const w = window as any;
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setSpeechSupported(false);
      return;
    }

    setSpeechSupported(true);

    const recognition = new SR();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let interim = "";
      let finalText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const text = res?.[0]?.transcript ?? "";
        if (res.isFinal) finalText += text;
        else interim += text;
      }

      // Only append final results to avoid duplicate interim text
      if (finalText.trim()) {
        setUserInput((prev) => (prev.trim() ? prev + "\n" : "") + finalText.trim());
      }
      setSpeechInterim(interim);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setSpeechInterim("");
    };

    recognition.onend = () => {
      setIsListening(false);
      setSpeechInterim("");
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch {}
      recognitionRef.current = null;
    };
  }, []);

  // Reset state when switching frameworks
  useEffect(() => {
    setUserInput("");
    setStatus("idle");
    setErrorMsg("");
    setAiOutput("");
    setGeneratedPrompt("");
    setCopied(false);
    setAttachments([]);
    setActiveAttachmentId(null);

    // Stop voice input when switching
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    setIsListening(false);
    setSpeechInterim("");
  }, [activeKey]);

  const handleRun = useCallback(async () => {
    if (!userInput.trim() && attachments.length === 0) {
      alert("Please enter your requirement description or upload a file");
      return;
    }

    setStatus("loading");
    setErrorMsg("");
    setActiveTab("output");
    setCurrentStep(2);
    setAiOutput("");
    setCopied(false);

    // Stop voice input when running
    if (isListening) {
      try {
        recognitionRef.current?.stop?.();
      } catch {}
      setIsListening(false);
      setSpeechInterim("");
    }

    // Clear preview first (actual prompt will be based on finalPrompt returned from server)
    setGeneratedPrompt("");

    try {
      // UI key -> coreKey
      const tabKey = activeKey;
      const coreKey = CORE_TAB_TO_COREKEY[tabKey as keyof typeof CORE_TAB_TO_COREKEY];

      if (!coreKey) {
        throw new Error(
          `core-map.ts missing mapping: tabKey="${tabKey}". Please add mapping to backend coreKey (e.g. task_tree) in src/data/core-map.ts.`
        );
      }

      // Safety check: coreKey must be snake_case (backend whitelist), should not contain "-"
      if (coreKey.includes("-")) {
        throw new Error(
          `Mapping error: coreKey="${coreKey}" contains "-", looks like a tabKey.\n` +
            `Please check src/data/core-map.ts: map "${tabKey}" to one of task_tree/task_breakdown/cot_reasoning/content_builder/analytical_engine.`
        );
      }

      // Observability: screenshot console for quick debugging if issues occur
      console.log("[CoreRun]", { tabKey, coreKey, tier, engineType, len: finalInput.length, attachments: attachments.length });

      // Single execution entry point: /api/core/run (use finalInput which includes attachments)
      const data = await callCoreFramework({
        coreKey,
        tier,
        userInput: finalInput,
        engineType,
      });

      setAiOutput(data.output ?? "");
      setStatus("success");

      // If server provides finalPrompt, use it for "Prompt Preview"
      if (data.finalPrompt) {
        setGeneratedPrompt(data.finalPrompt);
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message ?? String(err));
    }
  }, [activeKey, finalInput, tier, engineType, attachments.length, isListening]);

  const startListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.start();
      setIsListening(true);
      setSpeechInterim("");
    } catch {
      // Repeated start may throw error, ignore
    }
  }, []);

  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {}
    setIsListening(false);
    setSpeechInterim("");
  }, []);

  const handlePickFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Allow re-selecting the same file
    e.target.value = "";

    const lower = file.name.toLowerCase();
    const isTxt = file.type === "text/plain" || lower.endsWith(".txt");
    const isMd = lower.endsWith(".md");

    if (!isTxt && !isMd) {
      alert("Only .txt / .md files are supported");
      return;
    }

    // File size limit
    if (file.size > MAX_FILE_BYTES) {
      alert(`File too large: ${formatBytes(file.size)}, current limit is ${formatBytes(MAX_FILE_BYTES)}`);
      return;
    }

    try {
      const text = await file.text();

      // Total character limit (user input + existing attachments + new file)
      const currentTotalChars =
        userInput.length + attachments.reduce((sum, a) => sum + a.text.length, 0);
      const nextTotalChars = currentTotalChars + text.length;

      if (nextTotalChars > MAX_TOTAL_CHARS) {
        alert(
          `Attachment content too large (~${nextTotalChars} chars), exceeds limit of ${MAX_TOTAL_CHARS}.\n` +
            `Please remove some attachments or keep only key sections.`
        );
        return;
      }

      const att: Attachment = {
        id: makeId(),
        name: file.name,
        text,
        size: file.size,
      };

      setAttachments((prev) => [att, ...prev]);
      setActiveAttachmentId(att.id);
    } catch (err) {
      console.error(err);
      alert("Failed to read file, please try again");
    }
  }, [userInput, attachments]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    setActiveAttachmentId((curr) => {
      if (curr !== id) return curr;
      const remaining = attachments.filter((a) => a.id !== id);
      return remaining.length ? remaining[0].id : null;
    });
  }, [attachments]);

  const clearAttachments = useCallback(() => {
    setAttachments([]);
    setActiveAttachmentId(null);
  }, []);

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
      <div className="flex items-center gap-2 text-xs sm:text-sm text-[#9CA3AF] mb-1 sm:mb-2 pt-1 sm:pt-2">
        <Link href="/modules" className="hover:text-[#F9FAFB] transition-colors">
          Module Center
        </Link>
        <span className="text-[#4B5563]">/</span>
        <span className="text-[#F9FAFB]">Core Methodologies</span>
      </div>

      {/* Dev mode control panel — only visible when NEXT_PUBLIC_DEV_MODE=true (local dev) */}
      {IS_DEV && (
        <div className="flex items-center gap-3 px-3 py-2 mb-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs">
          <span className="text-amber-400 font-semibold">DEV</span>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Tier:</span>
            {(["basic", "pro"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTier(t)}
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  tier === t
                    ? "bg-blue-500 text-white"
                    : "bg-[#1F2937] text-gray-400 hover:text-white"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-400">Engine:</span>
            {(["deepseek", "gemini"] as const).map((e) => (
              <button
                key={e}
                onClick={() => setEngineType(e)}
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  engineType === e
                    ? "bg-blue-500 text-white"
                    : "bg-[#1F2937] text-gray-400 hover:text-white"
                }`}
              >
                {e}
              </button>
            ))}
          </div>
          <span className="text-gray-500 ml-auto">
            sub: {subscription?.plan ?? "none"} / {subscription?.status ?? "n/a"}
          </span>
        </div>
      )}

      <div className="relative pt-2 sm:pt-4 pb-4 sm:pb-10 text-center z-10">
        <h1 className="text-xl sm:text-[32px] font-semibold text-[#F9FAFB] tracking-tight mb-1 sm:mb-2 drop-shadow-sm">
          Core Methodologies
        </h1>
        <p className="text-[#9CA3AF] text-xs sm:text-base max-w-2xl mx-auto mb-3 sm:mb-8">
          5 core engines based on Chain of Thought (CoT) and structured engineering, enabling ultimate AI output control.
        </p>

        <div className="flex flex-row flex-nowrap overflow-x-auto sm:inline-flex sm:flex-wrap p-1 bg-[#111827] border border-[#1F2937] rounded-xl shadow-lg no-scrollbar gap-0.5 sm:gap-0">
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
                  whitespace-nowrap px-2.5 sm:px-5 py-1.5 sm:py-2 rounded-lg text-[11px] sm:text-sm font-medium transition-all duration-200 flex-shrink-0
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

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_480px] gap-4 sm:gap-8 items-start pb-10 sm:pb-20">
        <div className="flex flex-col gap-3 sm:gap-6 min-w-0">
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-3 sm:p-6 shadow-sm">
            <div className="flex items-start justify-between mb-2 sm:mb-4">
              <div>
                <h2 className="text-base sm:text-xl font-medium text-[#F9FAFB] mb-1 sm:mb-2">{activeItem.fullTitle}</h2>
                <p className="text-[#9CA3AF] text-xs sm:text-sm leading-relaxed max-w-xl">{activeItem.desc}</p>
              </div>
              <div className="p-1.5 sm:p-2 bg-[#3B82F6]/10 rounded-lg text-[#3B82F6]">
                <Info size={18} />
              </div>
            </div>

            <div className="flex overflow-x-auto gap-2 no-scrollbar md:grid md:grid-cols-3 md:gap-3">
              {activeItem.bullets.map((bullet, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-[11px] sm:text-xs text-[#9CA3AF] bg-[#1F2937]/50 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-[#1F2937] whitespace-nowrap md:whitespace-normal flex-shrink-0 md:flex-shrink"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] flex-shrink-0" />
                  {bullet}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden shadow-xl shadow-black/20">
            <div className="px-4 sm:px-6 py-2.5 sm:py-4 border-b border-[#1F2937] flex items-center gap-2 sm:gap-3 bg-[#1F2937]/30">
              <div
                className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold border ${
                  currentStep === 1
                    ? "border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/10"
                    : "border-emerald-500 text-emerald-400 bg-emerald-500/10"
                }`}
              >
                {currentStep === 1 ? "1" : <Check size={14} />}
              </div>
              <span className="text-xs sm:text-sm font-medium text-[#F9FAFB]">
                {currentStep === 1 ? "Input Context" : "Execution Done"}
              </span>
            </div>

            <div className="p-3 sm:p-6">
              {/* Toolbar: Attachments + Voice */}
              <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
                <div className="text-xs text-[#6B7280]">
                  Attachments: {attachments.length ? `${attachments.length} file(s)` : "None"}{" "}
                  {attachments.length ? <span className="ml-2 text-[#4B5563]">(will be included when running)</span> : null}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Voice Input Button */}
                  <button
                    type="button"
                    disabled={!speechSupported}
                    onClick={() => (isListening ? stopListening() : startListening())}
                    className={`px-3 py-1.5 rounded-lg text-xs border bg-[#0A0F1C] flex items-center gap-2 ${
                      !speechSupported
                        ? "border-[#1F2937] text-gray-500 cursor-not-allowed"
                        : isListening
                          ? "border-red-500 text-red-300 hover:bg-red-500/10"
                          : "border-[#374151] text-gray-200 hover:bg-[#1F2937]"
                    }`}
                    title={speechSupported ? "Voice Input (Chrome/Edge recommended)" : "Voice input not supported in this browser"}
                  >
                    <Mic size={14} />
                    {isListening ? "Stop" : "Voice Input"}
                  </button>

                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".txt,.md,text/plain"
                    className="hidden"
                    onChange={handleFileChange}
                  />

                  {/* Upload Button */}
                  <button
                    type="button"
                    onClick={handlePickFile}
                    className="px-3 py-1.5 rounded-lg text-xs border border-[#374151] bg-[#0A0F1C] text-gray-200 hover:bg-[#1F2937] flex items-center gap-2"
                    title="Upload .txt/.md file"
                  >
                    <Upload size={14} />
                    Upload
                  </button>

                  {/* Clear Attachments Button */}
                  <button
                    type="button"
                    onClick={clearAttachments}
                    disabled={attachments.length === 0}
                    className={`px-3 py-1.5 rounded-lg text-xs border bg-[#0A0F1C] flex items-center gap-2 ${
                      attachments.length
                        ? "border-[#374151] text-gray-200 hover:bg-[#1F2937]"
                        : "border-[#1F2937] text-gray-500 cursor-not-allowed"
                    }`}
                    title="Clear all attachments"
                  >
                    <Trash2 size={14} />
                    Clear
                  </button>
                </div>
              </div>

              {/* Voice interim recognition display */}
              {isListening && speechInterim && (
                <div className="text-xs text-gray-400 bg-[#0A0F1C] border border-[#1F2937] rounded-lg p-2 mb-3">
                  Recognizing: <span className="text-gray-200">{speechInterim}</span>
                </div>
              )}

              {/* Attachment chips list */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {attachments.map((a) => {
                    const active = a.id === activeAttachmentId;
                    return (
                      <div
                        key={a.id}
                        className={`flex items-center gap-1 rounded-lg border px-2 py-1 ${
                          active
                            ? "bg-blue-500/20 border-blue-500 text-white"
                            : "bg-[#0A0F1C] border-[#374151] text-gray-300"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => setActiveAttachmentId(a.id)}
                          className="text-xs"
                          title="Click to preview"
                        >
                          {a.name}
                          <span className="ml-2 text-[10px] text-gray-400">{formatBytes(a.size)}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => removeAttachment(a.id)}
                          className="ml-1 text-gray-400 hover:text-white"
                          title="Remove attachment"
                          aria-label="Remove attachment"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Attachment preview panel */}
              {activeAttachment && (
                <div className="bg-[#0A0F1C] border border-[#1F2937] rounded-lg p-3 text-gray-200 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-xs text-gray-300">
                      Preview: <span className="text-emerald-400">{activeAttachment.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveAttachmentId(null)}
                      className="text-xs text-gray-400 hover:text-white"
                    >
                      Close Preview
                    </button>
                  </div>

                  <pre className="text-xs whitespace-pre-wrap max-h-[160px] overflow-auto text-gray-300">
                    {activeAttachment.text.length > 4000
                      ? activeAttachment.text.slice(0, 4000) + "\n\n...(preview truncated)"
                      : activeAttachment.text}
                  </pre>
                </div>
              )}

              <textarea
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={`Describe your requirements...\n(Voice input available; attachments will be included automatically)\n\nExample: "Help me break down the annual growth targets for a SaaS product, including market expansion and sales conversion dimensions."`}
                className="w-full h-[140px] sm:h-[240px] bg-[#0A0F1C] border border-[#1F2937] rounded-xl p-3 sm:p-5 text-sm sm:text-[15px] text-[#F9FAFB] placeholder:text-[#6B7280] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/20 transition-all resize-none leading-relaxed"
              />

              <div className="mt-3 sm:mt-6 flex justify-end">
                <button
                  onClick={handleRun}
                  disabled={status === "loading" || !userInput.trim()}
                  className="flex items-center gap-2 px-5 sm:px-8 py-2 sm:py-3 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm sm:text-base font-medium rounded-xl transition-all shadow-lg shadow-blue-900/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {status === "loading" ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Play size={16} fill="currentColor" />
                  )}
                  {status === "loading" ? "Generating..." : "Generate Prompt and Run"}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky top-6 flex flex-col h-[400px] sm:h-[640px] min-w-0 bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden shadow-xl shadow-black/40">
          <div className="flex items-center border-b border-[#1F2937] bg-[#1F2937]/30">
            <button
              onClick={() => setActiveTab("preview")}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors relative ${
                activeTab === "preview" ? "text-[#3B82F6]" : "text-[#9CA3AF] hover:text-[#F9FAFB]"
              }`}
            >
              <Terminal size={16} />
              Prompt Template
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
              AI Output Results
              {activeTab === "output" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500" />}
            </button>
          </div>

          {status !== "idle" && status !== "success" && (
            <div className="px-4 pt-4">
              <StatusFeedback status={status} message={errorMsg} onRetry={handleRun} />
            </div>
          )}

          <div className="flex-1 min-h-0 overflow-hidden relative bg-[#0A0F1C]/50">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={handleCopy}
                className="p-2 rounded-lg bg-[#1F2937] border border-[#374151] text-[#9CA3AF] hover:text-white transition-colors"
                title="Copy content"
              >
                {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
              </button>
            </div>

            {activeTab === "preview" && (
              <div className="h-full overflow-y-auto p-6 custom-scrollbar">
                <pre className="font-mono text-xs md:text-sm text-[#D1D5DB] whitespace-pre-wrap leading-relaxed">
                  {generatedPrompt || activeItem.prompt || "// Waiting for finalPrompt from backend after execution..."}
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
                        <span className="text-sm">Thinking...</span>
                      </>
                    ) : (
                      <>
                        <Cpu size={32} className="opacity-20" />
                        <span className="text-sm opacity-50">Results will appear here after execution</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Guidance hint below output box */}
          <div className="flex-shrink-0 px-4 py-2 border-t border-[#1F2937] bg-[#111827]/80 text-center">
            <p className="text-xs text-[#6B7280] leading-relaxed">{continueHint}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Access control is handled by InviteGate in the modules layout.
// API-level protection is enforced by withSubscription in /api/core/run.
export default CoreFrameworkPage;
