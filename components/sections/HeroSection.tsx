"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { type RouterResult, type Stage } from "../../src/hooks/useIntentRouter";

const PLACEHOLDERS = [
  "Write a follow-up email to a client about next steps",
  "Build a business plan for an AI startup",
  "Analyze our competitors' market strategy",
];

interface HeroSectionProps {
  routerInput: string;
  setRouterInput: (v: string) => void;
  routerStage: Stage;
  routerResult: RouterResult | null;
  routerError: string;
  handleRouterSubmit: (e: React.FormEvent) => void;
  handleRouterConfirm: () => void;
  resetRouterError: () => void;
  scrollToFeatures: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  routerInput,
  setRouterInput,
  routerStage,
  routerResult,
  routerError,
  handleRouterSubmit,
  handleRouterConfirm,
  resetRouterError,
  scrollToFeatures,
}) => {
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS.length);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  const isLoading = routerStage === "loading";
  const isHinting = routerStage === "hinting";
  const isConfirmed = routerStage === "confirmed";
  const isError = routerStage === "error";

  return (
    <header className="max-w-4xl mx-auto px-6 pt-32 pb-8 text-center relative z-10">
      <p className="text-xs font-medium tracking-[0.3em] text-slate-500 uppercase mb-8">
        FuyouAI · Prompt OS
      </p>

      <h1 className="text-5xl lg:text-[60px] font-semibold leading-[1.1] tracking-tight text-white mb-8">
        AI tool to turn ideas into actionable plans
      </h1>

      <p className="text-lg lg:text-xl leading-[1.7] text-slate-400 font-normal max-w-xl mx-auto mb-16">
        Auto-route tasks to the right workflow.<br />
        Get structured output — not just chat.
      </p>

      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <p className="text-xs text-slate-500 text-left pl-1">Tell me what you want to accomplish</p>

        <form onSubmit={handleRouterSubmit} className="flex flex-col gap-2">
          <div className="relative flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={routerInput}
              onChange={(e) => setRouterInput(e.target.value)}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              style={{ height: "72px" }}
              className="w-full rounded-xl border border-white/40 bg-white/[0.04] pl-6 pr-48 text-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1E9FFF]/50 focus:border-[#1E9FFF]/60 focus:shadow-[0_0_24px_rgba(30,159,255,0.08)] transition-all"
            />
            <div className="absolute right-2 flex items-center gap-2">
              {isLoading ? (
                <span className="flex items-center gap-2 bg-[#1E9FFF]/70 text-white text-sm font-medium px-7 py-3 rounded-lg cursor-not-allowed">
                  <Loader2 size={15} className="animate-spin" /> Routing...
                </span>
              ) : isConfirmed ? (
                <span className="flex items-center gap-2 bg-emerald-500 text-white text-sm font-medium px-7 py-3 rounded-lg">
                  <Check size={15} /> {routerResult?.frontModuleId ?? "Ready"}
                </span>
              ) : isError ? (
                <button
                  type="button"
                  onClick={resetRouterError}
                  className="flex items-center gap-2 bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white text-sm font-medium px-7 py-3 rounded-lg transition-colors"
                >
                  Try again
                </button>
              ) : isHinting ? (
                <button
                  type="button"
                  onClick={handleRouterConfirm}
                  className="flex items-center gap-2 bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white text-sm font-medium px-7 py-3 rounded-lg transition-colors"
                >
                  Start <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white text-sm font-medium px-7 py-3 rounded-lg transition-colors shadow-[0_2px_10px_rgba(30,159,255,0.3)]"
                >
                  Start <ArrowRight size={15} />
                </button>
              )}
            </div>
          </div>

          {isHinting && routerResult?.hint && (
            <p className="text-sm text-slate-400 text-left pl-1">💡 {routerResult.hint}</p>
          )}
          {isError && (
            <p className="text-sm text-red-400 text-left pl-1">{routerError}</p>
          )}
        </form>

        <p className="text-xs text-slate-600 text-center mt-4">
          31 professional modules · Auto intent routing · Structured output
        </p>

        {/* Trust line */}
        <div className="flex items-center justify-center gap-2 flex-wrap mt-5">
          <span className="text-[11px] text-slate-600">Used by</span>
          {["Founders", "Product Managers", "AI Builders", "Creators"].map((role) => (
            <span
              key={role}
              className="text-[11px] text-slate-500 bg-white/[0.04] border border-white/[0.06] px-2.5 py-1 rounded-full"
            >
              {role}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-center gap-6 mt-4">
          <span className="text-xs text-slate-600">Preview first step free</span>
          <button
            type="button"
            onClick={scrollToFeatures}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-4"
          >
            View Features
          </button>
        </div>
      </div>
    </header>
  );
};
