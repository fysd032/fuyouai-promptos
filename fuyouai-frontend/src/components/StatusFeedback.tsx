
import React from "react";
import { Loader2, AlertCircle, CheckCircle2, XCircle } from "lucide-react";

export type FeedbackStatus = "idle" | "loading" | "success" | "error";

interface Props {
  status: FeedbackStatus;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

export const StatusFeedback: React.FC<Props> = ({ status, message, onRetry, className }) => {
  if (status === "idle") return null;

  const config = {
    loading: {
      bg: "bg-[#3B82F6]/10",
      border: "border-[#3B82F6]/20",
      text: "text-[#3B82F6]",
      icon: <Loader2 size={18} className="animate-spin" />,
      defaultMsg: "正在生成中..."
    },
    success: {
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      icon: <CheckCircle2 size={18} />,
      defaultMsg: "执行成功"
    },
    error: {
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      text: "text-red-400",
      icon: <XCircle size={18} />,
      defaultMsg: "执行失败"
    }
  };

  const current = config[status];

  return (
    <div className={`flex items-center justify-between p-4 rounded-xl border ${current.bg} ${current.border} ${current.text} ${className || ""} animate-in fade-in slide-in-from-top-2 duration-300`}>
      <div className="flex items-center gap-3">
        {current.icon}
        <span className="text-sm font-medium">{message || current.defaultMsg}</span>
      </div>
      {status === "error" && onRetry && (
        <button 
          onClick={onRetry}
          className="text-xs px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 transition-colors"
        >
          重试
        </button>
      )}
    </div>
  );
};
