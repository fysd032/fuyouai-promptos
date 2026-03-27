"use client";

import React from "react";
import { Layers, Terminal, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";

const colorMap = {
  blue: { bg: "bg-blue-500/10", text: "text-blue-400" },
  purple: { bg: "bg-purple-500/10", text: "text-purple-400" },
  emerald: { bg: "bg-emerald-500/10", text: "text-emerald-400" },
};

export const FeaturesSection: React.FC = () => {
  const t = useTranslations("Features");

  const features = [
    {
      Icon: Layers,
      title: t("feature1Title"),
      desc: t("feature1Desc"),
      color: "blue" as const,
    },
    {
      Icon: Terminal,
      title: t("feature2Title"),
      desc: t("feature2Desc"),
      color: "purple" as const,
    },
    {
      Icon: RefreshCw,
      title: t("feature3Title"),
      desc: t("feature3Desc"),
      color: "emerald" as const,
    },
  ];

  return (
    <section id="features" className="max-w-7xl mx-auto px-6 py-24 relative z-10">
      <div className="text-center mb-16">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-500 uppercase mb-4">
          {t("sectionTag")}
        </p>
        <h2 className="text-3xl lg:text-4xl font-semibold text-white tracking-tight">
          {t("headline")}
        </h2>
      </div>

      <div className="grid md:grid-cols-3 gap-8 items-stretch">
        {features.map((feature) => {
          const c = colorMap[feature.color];
          return (
            <div
              key={feature.title}
              className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm h-full"
            >
              <div
                className={`w-12 h-12 ${c.bg} rounded-xl flex items-center justify-center ${c.text} mb-6`}
              >
                <feature.Icon size={24} />
              </div>
              <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
