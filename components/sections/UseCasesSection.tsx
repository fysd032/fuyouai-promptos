"use client";

import React, { useState } from "react";
import { useTranslations, useLocale } from "next-intl";

const colorMap = {
  blue: {
    tagBg: "bg-blue-500/10",
    tagText: "text-blue-400",
    tagBorder: "border-blue-500/20",
    cardBorder: "border-blue-500/10 hover:border-blue-500/20",
    outputText: "text-blue-400",
    dot: "bg-blue-400",
    arrow: "text-blue-400",
  },
  purple: {
    tagBg: "bg-purple-500/10",
    tagText: "text-purple-400",
    tagBorder: "border-purple-500/20",
    cardBorder: "border-purple-500/10 hover:border-purple-500/20",
    outputText: "text-purple-400",
    dot: "bg-purple-400",
    arrow: "text-purple-400",
  },
  emerald: {
    tagBg: "bg-emerald-500/10",
    tagText: "text-emerald-400",
    tagBorder: "border-emerald-500/20",
    cardBorder: "border-emerald-500/10 hover:border-emerald-500/20",
    outputText: "text-emerald-400",
    dot: "bg-emerald-400",
    arrow: "text-emerald-400",
  },
  amber: {
    tagBg: "bg-amber-500/10",
    tagText: "text-amber-400",
    tagBorder: "border-amber-500/20",
    cardBorder: "border-amber-500/10 hover:border-amber-500/20",
    outputText: "text-amber-400",
    dot: "bg-amber-400",
    arrow: "text-amber-400",
  },
};

export const UseCasesSection: React.FC = () => {
  const t = useTranslations("UseCases");
  const locale = useLocale();
  const isZh = locale === "zh";

  const useCasesData = [
    {
      tag: t("foundersTag"),
      title: t("foundersTitle"),
      desc: t("foundersDesc"),
      input: t("foundersInput"),
      output: t("foundersOutput"),
      color: "blue" as const,
    },
    {
      tag: t("aiBuildersTag"),
      title: t("aiBuildersTitle"),
      desc: t("aiBuildersDesc"),
      input: t("aiBuildersInput"),
      output: t("aiBuildersOutput"),
      color: "emerald" as const,
    },
    {
      tag: t("pmTag"),
      title: t("pmTitle"),
      desc: t("pmDesc"),
      input: t("pmInput"),
      output: t("pmOutput"),
      color: "amber" as const,
    },
  ];

  // English: keep the original 4-column card grid (add creators back)
  const useCasesDataEn = [
    ...useCasesData,
    ...(t("creatorsTag")
      ? [
          {
            tag: t("creatorsTag"),
            title: t("creatorsTitle"),
            desc: t("creatorsDesc"),
            input: t("creatorsInput"),
            output: t("creatorsOutput"),
            color: "purple" as const,
          },
        ]
      : []),
  ];

  const [activeIdx, setActiveIdx] = useState(0);

  // ── Chinese: left list + right detail ──────────────────────────
  if (isZh) {
    const activeItem = useCasesData[activeIdx];
    const c = colorMap[activeItem.color];

    return (
      <section className="max-w-5xl mx-auto px-6 py-16 relative z-10">
        <div className="text-center mb-14">
          <p className="text-xs font-medium tracking-[0.25em] text-slate-500 uppercase mb-4">
            {t("sectionTag")}
          </p>
          <h2 className="text-3xl lg:text-4xl font-semibold text-white tracking-tight mb-4">
            {t("headline")}
          </h2>
          <p className="text-base text-slate-500 max-w-md mx-auto">
            {t("subheadline")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left: scenario list */}
          <div className="md:col-span-2 space-y-2">
            {useCasesData.map((item, idx) => {
              const ic = colorMap[item.color];
              const isActive = idx === activeIdx;
              return (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-200 ${
                    isActive
                      ? `bg-[#111827] border-blue-500/30 shadow-lg shadow-blue-900/10`
                      : "bg-transparent border-[#1E293B] hover:border-[#374151]"
                  }`}
                >
                  <div className="flex items-center gap-3 mb-1.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isActive ? ic.dot : "bg-[#374151]"}`} />
                    <span className={`text-xs font-medium ${isActive ? ic.tagText : "text-slate-500"}`}>
                      {item.tag}
                    </span>
                  </div>
                  <p className={`text-sm font-medium ml-5 ${isActive ? "text-white" : "text-slate-400"}`}>
                    {item.title}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right: detail card */}
          <div className="md:col-span-3 bg-[#111827] border border-[#1E293B] rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <span className={`text-xs font-medium px-3 py-1 rounded-full border ${c.tagBg} ${c.tagText} ${c.tagBorder}`}>
                {activeItem.tag}
              </span>
              <span className="text-xs text-[#475569]">{activeItem.title}</span>
            </div>

            {/* Quote */}
            <blockquote className="text-[#CBD5E1] text-base md:text-lg leading-relaxed mb-6 border-l-2 border-[#1E293B] pl-5">
              「{activeItem.input}」
            </blockquote>

            {/* Insight */}
            <div className="flex items-start gap-3">
              <span className={`mt-1 flex-shrink-0 ${c.arrow}`}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
              <p className="text-[#94A3B8] leading-relaxed">
                {activeItem.desc}，
                <span className="text-[#E2E8F0] font-medium">{activeItem.output}</span>
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── English: original 4-column card grid ──────────────────────
  return (
    <section className="max-w-7xl mx-auto px-6 py-16 relative z-10">
      <div className="text-center mb-14">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-500 uppercase mb-4">
          {t("sectionTag")}
        </p>
        <h2 className="text-3xl lg:text-4xl font-semibold text-white tracking-tight mb-4">
          {t("headline")}
        </h2>
        <p className="text-base text-slate-500 max-w-md mx-auto">
          {t("subheadline")}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {useCasesDataEn.map((item, idx) => {
          const c = colorMap[item.color];
          const isFeatured = idx === 0;
          return (
            <div
              key={item.tag}
              className={`p-6 rounded-2xl backdrop-blur-sm transition-all duration-300 flex flex-col gap-4 ${
                isFeatured
                  ? "bg-blue-500/[0.04] border border-blue-500/30 shadow-[0_0_32px_rgba(30,159,255,0.08)] lg:scale-[1.03] lg:origin-left"
                  : `bg-slate-900/50 border ${c.cardBorder}`
              }`}
            >
              <span
                className={`self-start text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 rounded-full border ${c.tagBg} ${c.tagText} ${c.tagBorder}`}
              >
                {item.tag}
              </span>

              <div>
                <h3 className="text-base font-semibold text-white mb-2 leading-snug">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
              </div>

              <div className="mt-auto flex flex-col gap-2.5 pt-4 border-t border-white/5">
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider mt-0.5 w-10 shrink-0">
                    {t("inputLabel")}
                  </span>
                  <p className="text-xs text-slate-400 italic leading-relaxed">
                    &quot;{item.input}&quot;
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider mt-0.5 w-10 shrink-0">
                    {t("outputLabel")}
                  </span>
                  <p className={`text-xs font-semibold ${c.outputText}`}>{item.output}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
