"use client";

import React from "react";
import { useCasesData } from "./landingData";

const colorMap = {
  blue: {
    tagBg: "bg-blue-500/10",
    tagText: "text-blue-400",
    tagBorder: "border-blue-500/20",
    cardBorder: "border-blue-500/10 hover:border-blue-500/20",
    outputText: "text-blue-400",
  },
  purple: {
    tagBg: "bg-purple-500/10",
    tagText: "text-purple-400",
    tagBorder: "border-purple-500/20",
    cardBorder: "border-purple-500/10 hover:border-purple-500/20",
    outputText: "text-purple-400",
  },
  emerald: {
    tagBg: "bg-emerald-500/10",
    tagText: "text-emerald-400",
    tagBorder: "border-emerald-500/20",
    cardBorder: "border-emerald-500/10 hover:border-emerald-500/20",
    outputText: "text-emerald-400",
  },
  amber: {
    tagBg: "bg-amber-500/10",
    tagText: "text-amber-400",
    tagBorder: "border-amber-500/20",
    cardBorder: "border-amber-500/10 hover:border-amber-500/20",
    outputText: "text-amber-400",
  },
};

export const UseCasesSection: React.FC = () => {
  return (
    <section className="max-w-7xl mx-auto px-6 py-24 relative z-10">
      <div className="text-center mb-14">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-500 uppercase mb-4">
          Who it&apos;s for
        </p>
        <h2 className="text-3xl lg:text-4xl font-semibold text-white tracking-tight mb-4">
          Built for people who ship
        </h2>
        <p className="text-base text-slate-500 max-w-md mx-auto">
          Not a chatbot. Structured output, every time.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {useCasesData.map((item, idx) => {
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
                    In
                  </span>
                  <p className="text-xs text-slate-400 italic leading-relaxed">
                    &quot;{item.input}&quot;
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wider mt-0.5 w-10 shrink-0">
                    Out
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
