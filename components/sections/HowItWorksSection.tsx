"use client";

import React from "react";
import { MessageSquare, GitBranch, FileText, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

export const HowItWorksSection: React.FC = () => {
  const t = useTranslations("HowItWorks");

  const steps = [
    {
      number: "01",
      Icon: MessageSquare,
      title: t("step1Title"),
      desc: t("step1Desc"),
      iconBg: "bg-blue-500/10",
      iconText: "text-blue-400",
      numText: "text-blue-400/30",
    },
    {
      number: "02",
      Icon: GitBranch,
      title: t("step2Title"),
      desc: t("step2Desc"),
      iconBg: "bg-purple-500/10",
      iconText: "text-purple-400",
      numText: "text-purple-400/30",
    },
    {
      number: "03",
      Icon: FileText,
      title: t("step3Title"),
      desc: t("step3Desc"),
      iconBg: "bg-emerald-500/10",
      iconText: "text-emerald-400",
      numText: "text-emerald-400/30",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto px-6 py-24 relative z-10">
      <div className="text-center mb-16">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-500 uppercase mb-4">
          {t("sectionTag")}
        </p>
        <h2 className="text-3xl lg:text-4xl font-semibold text-white tracking-tight">
          {t("headline")}
        </h2>
      </div>

      <div className="flex flex-col md:flex-row items-start gap-4 md:gap-0">
        {steps.map((step, idx) => (
          <React.Fragment key={step.number}>
            <div className="flex-1 flex flex-col items-center text-center px-6 lg:px-10">
              <p className={`text-6xl font-bold mb-5 leading-none ${step.numText}`}>
                {step.number}
              </p>
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${step.iconBg} ${step.iconText}`}
              >
                <step.Icon size={26} />
              </div>
              <h3 className="text-lg font-semibold text-white mb-3">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-xs">{step.desc}</p>
            </div>

            {idx < steps.length - 1 && (
              <div className="hidden md:flex items-center self-start mt-[88px] text-slate-700 shrink-0">
                <ArrowRight size={18} />
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  );
};
