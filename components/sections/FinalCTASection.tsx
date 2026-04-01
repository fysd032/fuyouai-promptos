"use client";

import React from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export const FinalCTASection: React.FC = () => {
  const t = useTranslations("FinalCTA");

  return (
    <section className="max-w-4xl mx-auto px-6 py-24 relative z-10">
      <div className="rounded-3xl bg-gradient-to-b from-[#0d1929] to-slate-900/60 border border-[#1E9FFF]/20 shadow-[0_0_100px_rgba(30,159,255,0.10),0_0_0_1px_rgba(30,159,255,0.06)] px-12 py-20 text-center">
        <h2 className="text-4xl lg:text-5xl font-semibold text-white tracking-tight mb-5 leading-[1.1]">
          {t("headline")}
        </h2>
        <p className="text-lg text-slate-400 mb-10 max-w-sm mx-auto leading-relaxed">
          {t("subheadline")}
        </p>
        <button
          onClick={() => {
            const el = document.getElementById("hero-input");
            if (el) { el.scrollIntoView({ behavior: "smooth" }); el.focus(); }
          }}
          className="inline-flex items-center gap-2.5 bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white font-semibold px-10 py-5 rounded-xl transition-all shadow-[0_12px_50px_rgba(30,159,255,0.40)] hover:shadow-[0_12px_60px_rgba(30,159,255,0.50)] active:scale-[0.98] text-lg group"
        >
          {t("button")}
          <ArrowRight size={18} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
        <p className="text-xs text-slate-600 mt-6 tracking-wide">
          {t("note")}
        </p>
      </div>
    </section>
  );
};
