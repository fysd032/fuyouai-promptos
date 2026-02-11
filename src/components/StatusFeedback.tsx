import React from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export type FeedbackStatus = "idle" | "loading" | "success" | "error";

interface Props {
  status: FeedbackStatus;
  message?: string;
  onRetry?: () => void;
  className?: string;

  /** 可选：覆盖默认提示文案（不传则用组件内默认英文） */
  defaultMsg?: Partial<Record<Exclude<FeedbackStatus, "idle">, string>>;

  /** 可选：覆盖重试按钮文案（不传则用 Retry） */
  retryText?: string;
}

export const StatusFeedback: React.FC<Props> = ({
  status,
  message,
  onRetry,
  className,
  defaultMsg,
  retryText,
}) => {
  if (status === "idle") return null;

  const config: Record<
    Exclude<FeedbackStatus, "idle">,
    {
      bg: string;
      border: string;
      text: string;
      icon: React.ReactNode;
      defaultMsg: string;
    }
  > = {
    loading: {
      bg: "bg-[#3B82F6]/10",
      border: "border-[#3B82F6]/20",
      text: "text-[#3B82F6]",
      icon: <Loader2 size={18} className="animate-spin" />,
      defaultMsg: "Generating...",
    },
    success: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      icon: <CheckCircle2 size={18} />,
      defaultMsg: "Success",
    },
    error: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-400",
      icon: <XCircle size={18} />,
      defaultMsg: "Failed",
    },
  };

  const current = config[status];

  // 优先级：message（外部明确传入） > defaultMsg 覆盖（按状态） > 组件内默认
  const finalMsg =
    message ||
    (defaultMsg?.[status as Exclude<FeedbackStatus, "idle">] ?? current.defaultMsg);

  return (
    <div
      className={`flex items-center justify-between p-4 rounded-xl border ${current.bg} ${current.border} ${current.text} ${
        className || ""
      } animate-in fade-in slide-in-from-top-2 duration-300`}
    >
      <div className="flex items-center gap-3">
        {current.icon}
        <span className="text-sm font-medium">{finalMsg}</span>
      </div>

      {status === "error" && onRetry && (
        <button
          onClick={onRetry}
          className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
        >
          {retryText || "Retry"}
        </button>
      )}
    </div>
  );
};
