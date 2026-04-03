"use client";

import React from "react";
import { useTranslations } from "next-intl";

export const WhyNotChatGPTSection: React.FC = () => {
  const t = useTranslations("WhyNotChatGPT");

  const comparisons = [
    {
      topic: t("topicOutput"),
      chatgpt: t("chatgptOutput"),
      fuyou: t("fuyouOutput"),
    },
    {
      topic: t("topicWorkflow"),
      chatgpt: t("chatgptWorkflow"),
      fuyou: t("fuyouWorkflow"),
    },
    {
      topic: t("topicReusability"),
      chatgpt: t("chatgptReusability"),
      fuyou: t("fuyouReusability"),
    },
    {
      topic: t("topicSpeed"),
      chatgpt: t("chatgptSpeed"),
      fuyou: t("fuyouSpeed"),
    },
  ];

  return (
    <section className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 relative z-10">
      <div className="text-center mb-8 sm:mb-10">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-500 uppercase mb-4">
          {t("sectionTag")}
        </p>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-semibold text-white tracking-tight">
          {t("headline1")}<br />{t("headline2")}
        </h2>
      </div>

      {/* Desktop: table layout */}
      <div className="hidden sm:block rounded-2xl border border-slate-800/60 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-3 bg-slate-900/60 border-b border-slate-800/60">
          <div className="px-6 py-4" />
          <div className="px-6 py-4 border-l border-slate-800/60">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{t("colChatGPT")}</p>
          </div>
          <div className="px-6 py-4 border-l border-[#1E9FFF]/20 bg-[#1E9FFF]/[0.03]">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">{t("colFuyouAI")}</p>
          </div>
        </div>

        {comparisons.map((row, idx) => (
          <div
            key={row.topic}
            className={`grid grid-cols-3 ${idx < comparisons.length - 1 ? "border-b border-slate-800/40" : ""}`}
          >
            <div className="px-6 py-5 flex items-center">
              <p className="text-xs font-medium text-slate-600 uppercase tracking-wider">{row.topic}</p>
            </div>
            <div className="px-6 py-5 border-l border-slate-800/40 flex items-center">
              <p className="text-sm text-slate-500">{row.chatgpt}</p>
            </div>
            <div className="px-6 py-5 border-l border-[#1E9FFF]/15 bg-[#1E9FFF]/[0.02] flex items-center gap-2">
              <span className="text-blue-400 text-xs shrink-0">✓</span>
              <p className="text-sm text-slate-200 font-medium">{row.fuyou}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Mobile: stacked cards */}
      <div className="sm:hidden space-y-3">
        {comparisons.map((row) => (
          <div key={row.topic} className="rounded-xl border border-slate-800/60 overflow-hidden">
            <div className="px-4 py-2 bg-slate-900/60 border-b border-slate-800/40">
              <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">{row.topic}</p>
            </div>
            <div className="px-4 py-3 border-b border-slate-800/40">
              <p className="text-[10px] text-slate-600 mb-1">{t("colChatGPT")}</p>
              <p className="text-sm text-slate-500">{row.chatgpt}</p>
            </div>
            <div className="px-4 py-3 bg-[#1E9FFF]/[0.02]">
              <p className="text-[10px] text-blue-400 font-medium mb-1">{t("colFuyouAI")}</p>
              <p className="text-sm text-slate-200 font-medium flex items-center gap-1.5">
                <span className="text-blue-400 text-xs">✓</span>
                {row.fuyou}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
