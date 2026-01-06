import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw, LogOut } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] h-full p-6 text-center bg-[#111827] rounded-2xl border border-[#1F2937] m-4">
          <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-[#F9FAFB] mb-2">
            页面遇到了一些问题
          </h2>
          <p className="text-[#9CA3AF] mb-6 max-w-md text-sm leading-relaxed">
            组件渲染失败。这可能是一个临时的网络波动或代码错误。
            <br />
            <span className="font-mono text-xs text-red-400 mt-2 block bg-[#0A0F1C] p-2 rounded border border-red-900/30 overflow-auto max-w-full">
              {this.state.error?.message || "Unknown Error"}
            </span>
          </p>
          
          <div className="flex gap-4">
            <button
              onClick={this.handleReload}
              className="flex items-center gap-2 px-4 py-2 bg-[#3B82F6] hover:bg-blue-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              <RefreshCw size={16} />
              刷新页面
            </button>
            <button
              onClick={this.handleGoHome}
              className="flex items-center gap-2 px-4 py-2 bg-[#1F2937] hover:bg-[#374151] text-[#E5E7EB] rounded-lg transition-colors text-sm font-medium border border-[#374151]"
            >
              <LogOut size={16} />
              返回官网首页
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}