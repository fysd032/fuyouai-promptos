"use client";

import React from "react";
import { useTranslations } from "next-intl";

const testimonialKeys = ["t1", "t2", "t3"] as const;

export const TestimonialsSection: React.FC = () => {
  const t = useTranslations("Testimonials");

  return (
    <section className="max-w-7xl mx-auto px-6 py-24 relative z-10">
      <div className="text-center mb-14">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-500 uppercase mb-4">
          {t("sectionTag")}
        </p>
        <h2 className="text-3xl lg:text-4xl font-semibold text-white tracking-tight">
          {t("headline")}
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {testimonialKeys.map((key) => (
          <div
            key={key}
            className="relative p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm flex flex-col gap-4"
          >
            {/* Quote mark */}
            <span className="text-3xl leading-none text-blue-500/20 font-serif select-none">
              &ldquo;
            </span>

            {/* Text */}
            <p className="text-sm text-slate-300 leading-relaxed flex-1">
              {t(`${key}text`)}
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 pt-4 border-t border-white/5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-[11px] font-bold text-slate-400">
                {t(`${key}name`).charAt(0)}
              </div>
              <p className="text-xs text-slate-500">{t(`${key}role`)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
