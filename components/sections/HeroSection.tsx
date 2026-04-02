"use client";

import React, { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { type RouterResult, type Stage } from "../../src/hooks/useIntentRouter";

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
  const t = useTranslations("Hero");

  const PLACEHOLDERS = [
    t("placeholder1"),
    t("placeholder2"),
    t("placeholder3"),
  ];

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
    <header className="max-w-4xl mx-auto px-4 sm:px-6 pt-20 sm:pt-24 pb-4 sm:pb-6 text-center relative z-10">
      <p className="text-xs font-medium tracking-[0.3em] text-slate-500 uppercase mb-5">
        {t("badge")}
      </p>

      <h1 className="text-2xl sm:text-4xl lg:text-[56px] font-semibold leading-[1.15] tracking-tight text-white mb-4 sm:mb-5">
        {t("headline")}
      </h1>

      <p className="text-sm sm:text-lg lg:text-xl leading-[1.7] text-slate-400 font-normal max-w-xl mx-auto mb-6 sm:mb-10">
        {t("subheadline1")}<br />
        {t("subheadline2")}
      </p>

      <div className="max-w-4xl mx-auto flex flex-col gap-3 sm:gap-4">
        <p className="text-xs text-slate-500 text-left pl-1">{t("inputLabel")}</p>

        <form onSubmit={handleRouterSubmit} className="flex flex-col gap-2">
          <div className="relative flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-0">
            <input
              id="hero-input"
              ref={inputRef}
              type="text"
              value={routerInput}
              onChange={(e) => setRouterInput(e.target.value)}
              placeholder={PLACEHOLDERS[placeholderIdx]}
              className="w-full h-12 sm:h-[72px] rounded-xl border border-white/40 bg-white/[0.04] pl-4 sm:pl-6 pr-4 sm:pr-48 text-sm sm:text-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1E9FFF]/50 focus:border-[#1E9FFF]/60 focus:shadow-[0_0_24px_rgba(30,159,255,0.08)] transition-all"
            />
            <div className="sm:absolute sm:right-2 flex items-center gap-2 justify-end">
              {isLoading ? (
                <span className="flex items-center gap-2 bg-[#1E9FFF]/70 text-white text-sm font-medium px-7 py-3 rounded-lg cursor-not-allowed">
                  <Loader2 size={15} className="animate-spin" /> {t("routing")}
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
                  {t("tryAgain")}
                </button>
              ) : isHinting ? (
                <button
                  type="button"
                  onClick={handleRouterConfirm}
                  className="flex items-center gap-2 bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white text-sm font-medium px-7 py-3 rounded-lg transition-colors"
                >
                  {t("start")} <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  type="submit"
                  className="flex items-center gap-2 bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white text-sm font-medium px-7 py-3 rounded-lg transition-colors shadow-[0_2px_10px_rgba(30,159,255,0.3)]"
                >
                  {t("start")} <ArrowRight size={15} />
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

        <p className="text-xs text-slate-600 text-center mt-3">
          {t("moduleInfo")}
        </p>

        <div className="flex items-center justify-center gap-6 mt-3">
          <span className="text-xs text-slate-600">{t("previewFree")}</span>
          <button
            type="button"
            onClick={scrollToFeatures}
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-4"
          >
            {t("viewFeatures")}
          </button>
        </div>
      </div>
    </header>
  );
};
