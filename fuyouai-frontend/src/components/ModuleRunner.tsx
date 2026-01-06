import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Play, Copy, Check, Upload, X, Trash2, Mic } from "lucide-react";
import { callPromptOS } from "../lib/promptos";
import type { FeedbackStatus } from "./StatusFeedback";

type Attachment = {
  id: string;
  name: string;
  text: string;
  size: number;
};

interface ModuleRunnerProps {
  moduleType: "general" | "industry";
  moduleKey: string;
  moduleData: {
    title: string;
    desc: string;
    promptPreview: string;
    variant: {
      label?: string;
      description?: string;
    };
  };
  onBack?: () => void;
}

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
const MAX_FILE_BYTES = 500 * 1024; // 单文件 500KB
const MAX_TOTAL_CHARS = 8000;      // 总字符上限（MVP 建议 8000）

export const ModuleRunner: React.FC<ModuleRunnerProps> = ({
  moduleKey,
  moduleData,
  onBack,
}) => {
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState<FeedbackStatus>("idle");
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);

  // ✅ 附件：列表 + 当前预览
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [activeAttachmentId, setActiveAttachmentId] = useState<string | null>(null);

  // ✅ 文件选择 input
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ 语音输入（Web Speech API）
  const recognitionRef = useRef<any>(null);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechInterim, setSpeechInterim] = useState("");

  // 运行条件
  const canRun = !!moduleKey && !!userInput.trim() && status !== "loading";

  // 当前预览的附件
  const activeAttachment = useMemo(() => {
    if (!activeAttachmentId) return null;
    return attachments.find((a) => a.id === activeAttachmentId) ?? null;
  }, [attachments, activeAttachmentId]);

  // 拼接最终输入：用户输入 + 附件内容（全部）
  const finalInput = useMemo(() => {
    const base = userInput.trim();
    if (attachments.length === 0) return base;

    const appendix = attachments
      .map((a) => `\n\n---\n【附件：${a.name}】\n${a.text}`)
      .join("");

    return base ? `${base}${appendix}` : `【附件内容】${appendix}`;
  }, [userInput, attachments]);

  // 切换模块时重置
  useEffect(() => {
    setResult("");
    setStatus("idle");
    setUserInput("");
    setAttachments([]);
    setActiveAttachmentId(null);

    // 切换模块时停止语音
    try {
      recognitionRef.current?.stop?.();
    } catch {}
    setIsListening(false);
    setSpeechInterim("");
  }, [moduleKey]);

  // ✅ 初始化 Web Speech API（仅前端）
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

      // ✅ 只追加“最终结果”，避免 interim 重复叠加
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

  const startListening = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.start(); // 必须用户点击触发
      setIsListening(true);
      setSpeechInterim("");
    } catch {
      // 重复 start 可能抛错，忽略
    }
  };

  const stopListening = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    try {
      rec.stop();
    } catch {}
    setIsListening(false);
    setSpeechInterim("");
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 允许重复选择同一个文件
    e.target.value = "";
const text = await file.text();

const att: Attachment = {
  id: makeId(),
  name: file.name,
  text,
  size: file.size,
};

// ✅ 总字符上限（用户输入 + 现有附件 + 新文件）
const currentTotalChars =
  userInput.length + attachments.reduce((sum, a) => sum + a.text.length, 0);

const nextTotalChars = currentTotalChars + text.length;

if (nextTotalChars > MAX_TOTAL_CHARS) {
  alert(
    `附件内容过多（约 ${nextTotalChars} 字符），已超过上限 ${MAX_TOTAL_CHARS}。\n` +
      `建议删除部分附件或只保留关键片段。`
  );
  return;
}

setAttachments((prev) => [att, ...prev]);
setActiveAttachmentId(att.id);

    const lower = file.name.toLowerCase();
    const isTxt = file.type === "text/plain" || lower.endsWith(".txt");
    const isMd = lower.endsWith(".md");

    if (!isTxt && !isMd) {
      alert("目前仅支持 .txt / .md 文件");
      return;
    }

    // ✅ 轻量保护：单文件限制（可调）
    const MAX_BYTES = 500 * 1024; // 500KB
    if (file.size > MAX_BYTES) {
      alert(`文件过大：${formatBytes(file.size)}，当前限制 ${formatBytes(MAX_BYTES)}（可后续放开）`);
      return;
    }

    try {
      const text = await file.text();
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
      alert("读取文件失败，请重试");
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    setActiveAttachmentId((curr) => {
      if (curr !== id) return curr;
      const remaining = attachments.filter((a) => a.id !== id);
      return remaining.length ? remaining[0].id : null;
    });
  };

  const clearAttachments = () => {
    setAttachments([]);
    setActiveAttachmentId(null);
  };

  const handleRun = async () => {
    if (!canRun) return;

    setStatus("loading");
    setResult("");

    // 运行时建议停止语音（避免边跑边写导致输入变化）
    if (isListening) stopListening();

    try {
      const res = await callPromptOS({
        promptKey: moduleKey,
        userInput: finalInput,
      });

      const output = (res?.modelOutput ?? "").toString();
      setResult(output.trim() ? output : "AI returned empty response.");
      setStatus("success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "执行失败";
      setResult(msg);
      setStatus("error");
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 可选：提示用户手动复制
    }
  };

  return (
    <div className="h-full bg-[#111827] border border-[#1F2937] rounded-xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#1F2937] flex justify-between items-center">
        <div className="flex items-center gap-3">
          {onBack && (
            <button onClick={onBack} className="text-gray-400 hover:text-white">
              <ArrowLeft size={18} />
            </button>
          )}
          <div>
            <div className="text-white font-semibold">{moduleData.title}</div>
            <div className="text-xs text-blue-400">
              子功能：{moduleData.variant.label ?? "默认"}
            </div>
            <div className="text-[10px] text-gray-500 font-mono">promptKey: {moduleKey}</div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 flex flex-col gap-4 flex-1 min-h-0">
        {/* 顶部工具栏：附件 + 语音 */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="text-xs text-gray-400">
            附件：{attachments.length ? `${attachments.length} 个` : "无"}{" "}
            {attachments.length ? <span className="ml-2 text-gray-500">（运行时会自动附带）</span> : null}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* 语音按钮 */}
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
              title={speechSupported ? "语音输入（Chrome/Edge 推荐）" : "当前浏览器不支持语音输入"}
            >
              <Mic size={14} />
              {isListening ? "停止语音" : "语音输入"}
            </button>

            {/* 附件输入 */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,text/plain"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              type="button"
              onClick={handlePickFile}
              className="px-3 py-1.5 rounded-lg text-xs border border-[#374151] bg-[#0A0F1C] text-gray-200 hover:bg-[#1F2937] flex items-center gap-2"
              title="上传 .txt/.md 文件"
            >
              <Upload size={14} />
              上传附件
            </button>

            <button
              type="button"
              onClick={clearAttachments}
              disabled={attachments.length === 0}
              className={`px-3 py-1.5 rounded-lg text-xs border bg-[#0A0F1C] flex items-center gap-2 ${
                attachments.length
                  ? "border-[#374151] text-gray-200 hover:bg-[#1F2937]"
                  : "border-[#1F2937] text-gray-500 cursor-not-allowed"
              }`}
              title="清空所有附件"
            >
              <Trash2 size={14} />
              清空
            </button>
          </div>
        </div>

        {/* 语音临时识别提示（可选显示，体验更好） */}
        {isListening && speechInterim && (
          <div className="text-xs text-gray-400 bg-[#0A0F1C] border border-[#1F2937] rounded-lg p-2">
            正在识别：<span className="text-gray-200">{speechInterim}</span>
          </div>
        )}

        {/* 附件列表（chips） */}
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2">
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
                    title="点击预览"
                  >
                    {a.name}
                    <span className="ml-2 text-[10px] text-gray-400">{formatBytes(a.size)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => removeAttachment(a.id)}
                    className="ml-1 text-gray-400 hover:text-white"
                    title="移除附件"
                    aria-label="Remove attachment"
                  >
                    <X size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* 附件预览 */}
        {activeAttachment && (
          <div className="bg-[#0A0F1C] border border-[#1F2937] rounded-lg p-3 text-gray-200">
            <div className="flex items-center justify-between mb-2">
              <div className="text-xs text-gray-300">
                预览：<span className="text-emerald-400">{activeAttachment.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveAttachmentId(null)}
                className="text-xs text-gray-400 hover:text-white"
              >
                关闭预览
              </button>
            </div>

            <pre className="text-xs whitespace-pre-wrap max-h-[160px] overflow-auto text-gray-300">
              {activeAttachment.text.length > 4000
                ? activeAttachment.text.slice(0, 4000) + "\n\n...(已截断预览)"
                : activeAttachment.text}
            </pre>
          </div>
        )}

        {/* 输入框（只写需求，不会被附件撑爆） */}
        <textarea
          className="w-full min-h-[160px] bg-[#0A0F1C] border border-[#1F2937] rounded-lg p-3 text-white"
          placeholder="请输入你的任务需求…（可用语音输入；附件内容会在运行时自动附带）"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
        />

        {/* Run */}
        <button
          disabled={!canRun}
          onClick={handleRun}
          className={`px-5 py-2 rounded-lg flex items-center gap-2 text-sm ${
            canRun
              ? "bg-blue-500 hover:bg-blue-600 text-white"
              : "bg-gray-700 text-gray-400 cursor-not-allowed"
          }`}
        >
          <Play size={16} /> {status === "loading" ? "运行中…" : "运行"}
        </button>

        {/* Output */}
        {result && (
          <div className="relative bg-[#0A0F1C] border border-[#1F2937] rounded-lg p-4 text-gray-200 whitespace-pre-wrap">
            <button
              onClick={handleCopy}
              className="absolute top-2 right-2 text-xs text-gray-400 hover:text-white"
              aria-label="Copy result"
              title="Copy"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
            </button>
            {result}
          </div>
        )}
      </div>
    </div>
  );
};
