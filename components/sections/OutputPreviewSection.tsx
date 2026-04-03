"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

type AppendixItem = { label: string; value: string };

type PreviewCase = {
  id: string;
  label: string;
  input: string;
  outputTitle: string;
  outputTypeLabel: string;
  bodyIntro: string;
  bodyText: string;
  outputSections: string[];
  appendix: AppendixItem[];
  closing: string | string[];
};

export const OutputPreviewSection: React.FC = () => {
  const t = useTranslations("OutputPreview");

  const cases: PreviewCase[] = [
    {
      id: "followup",
      label: t("case1Label"),
      input: t("case1Input"),
      outputTitle: t("case1Title"),
      outputTypeLabel: t("structuredOutput"),
      bodyIntro: t("case1BodyIntro"),
      bodyText: t("case1BodyText"),
      outputSections: [
        t("case1Step1"),
        t("case1Step2"),
        t("case1Step3"),
      ],
      appendix: [
        { label: t("case1KeyDecision"), value: t("case1KeyDecisionVal") },
        { label: t("case1Risk"), value: t("case1RiskVal") },
        { label: t("case1Owner"), value: t("case1OwnerVal") },
      ],
      closing: [t("case1Closing1"), t("case1Closing2")],
    },
    {
      id: "business-plan",
      label: t("case2Label"),
      input: t("case2Input"),
      outputTitle: t("case2Title"),
      outputTypeLabel: t("structuredOutput"),
      bodyIntro: t("case2BodyIntro"),
      bodyText: t("case2BodyText"),
      outputSections: [
        t("case2Step1"),
        t("case2Step2"),
        t("case2Step3"),
        t("case2Step4"),
        t("case2Step5"),
      ],
      appendix: [
        { label: t("case2Assumption"), value: t("case2AssumptionVal") },
        { label: t("case2Risk"), value: t("case2RiskVal") },
        { label: t("case2NextStep"), value: t("case2NextStepVal") },
      ],
      closing: t("case2Closing"),
    },
    {
      id: "prd",
      label: t("case3Label"),
      input: t("case3Input"),
      outputTitle: t("case3Title"),
      outputTypeLabel: t("structuredOutput"),
      bodyIntro: t("case3BodyIntro"),
      bodyText: t("case3BodyText"),
      outputSections: [
        t("case3Step1"),
        t("case3Step2"),
        t("case3Step3"),
        t("case3Step4"),
      ],
      appendix: [
        { label: t("case3Risk"), value: t("case3RiskVal") },
        { label: t("case3Dependency"), value: t("case3DependencyVal") },
        { label: t("case3Priority"), value: t("case3PriorityVal") },
      ],
      closing: t("case3Closing"),
    },
    {
      id: "content",
      label: t("case4Label"),
      input: t("case4Input"),
      outputTitle: t("case4Title"),
      outputTypeLabel: t("structuredOutput"),
      bodyIntro: t("case4BodyIntro"),
      bodyText: t("case4BodyText"),
      outputSections: [
        t("case4Step1"),
        t("case4Step2"),
        t("case4Step3"),
        t("case4Step4"),
        t("case4Step5"),
      ],
      appendix: [
        { label: t("case4TitleLabel"), value: t("case4TitleVal") },
        { label: t("case4Social"), value: t("case4SocialVal") },
        { label: t("case4Distribution"), value: t("case4DistributionVal") },
      ],
      closing: t("case4Closing"),
    },
  ];

  const [activeId, setActiveId] = useState<string>(cases[0].id);
  const active = cases.find((c) => c.id === activeId) ?? cases[0];
  const closing = Array.isArray(active.closing)
    ? active.closing
    : [active.closing];

  return (
    <section className="max-w-7xl mx-auto px-6 py-32 relative z-10">
      <div className="text-center mb-16">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-500 uppercase mb-4">
          {t("sectionTag")}
        </p>
        <h2 className="text-3xl lg:text-5xl font-semibold text-white tracking-tight mb-4">
          {t("headline")}
        </h2>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          {t("subheadline")}
        </p>
      </div>

      <div className="grid lg:grid-cols-[300px_auto_1fr] gap-6 items-start">

        {/* Left: case selector + input */}
        <div className="flex flex-col gap-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            {t("tryScenarios")}
          </p>

          {/* Case list */}
          <div className="flex flex-col gap-2">
            {cases.map((c) => {
              const isActive = c.id === activeId;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActiveId(c.id)}
                  className={`text-left px-4 py-3 rounded-xl text-sm transition-all duration-200 border ${
                    isActive
                      ? "bg-[#1E9FFF]/10 border-[#1E9FFF]/40 text-white shadow-[0_0_12px_rgba(30,159,255,0.12)]"
                      : "bg-transparent border-slate-800/60 text-slate-500 hover:text-slate-300 hover:border-slate-700/60"
                  }`}
                >
                  {c.label}
                </button>
              );
            })}
          </div>

          {/* Input display */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-white/5">
            <p className="text-[10px] font-medium text-slate-600 uppercase tracking-wider mb-2">
              {t("yourInput")}
            </p>
            <p className="text-xs text-slate-400 italic leading-relaxed">
              &quot;{active.input}&quot;
            </p>
          </div>
        </div>

        {/* Arrow */}
        <div className="hidden lg:flex items-start justify-center pt-[220px] text-slate-700 px-1">
          <ArrowRight size={18} />
        </div>

        {/* Right: structured output */}
        <div className="p-8 rounded-2xl bg-slate-900/80 border border-[#1E9FFF]/25 shadow-[0_0_80px_rgba(30,159,255,0.12),0_0_0_1px_rgba(30,159,255,0.08)] transition-all duration-300">
          <p className="text-[10px] font-medium tracking-[0.2em] text-blue-400/70 uppercase mb-5">
            {active.outputTypeLabel}
          </p>

          <div className="space-y-4 text-sm">
            {/* Title */}
            <div>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">{t("subject")}</p>
              <p className="text-white font-semibold">{active.outputTitle}</p>
            </div>

            <div className="w-full h-px bg-white/5" />

            {/* Body */}
            <div className="space-y-3 text-slate-300 leading-relaxed">
              <p className="font-medium text-slate-200">{active.bodyIntro}</p>
              <p className="text-slate-400 text-xs">{active.bodyText}</p>
              <div className="space-y-1.5 pl-1">
                {active.outputSections.map((line, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <span className="text-blue-400 font-medium shrink-0 mt-px">{i + 1}.</span>
                    <span className="text-xs text-slate-300">{line}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-white/5" />

            {/* Appendix */}
            <div className="space-y-2">
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">{t("appendix")}</p>
              <div className="grid grid-cols-3 gap-2">
                {active.appendix.map((row) => (
                  <div
                    key={row.label}
                    className="p-2.5 rounded-lg bg-white/[0.03] border border-white/5"
                  >
                    <p className="text-[10px] text-slate-600 mb-1">{row.label}</p>
                    <p className="text-xs text-slate-300 font-medium">{row.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Closing */}
            <p className="text-slate-500 text-xs pt-1">
              {closing.map((line, i) => (
                <span key={i}>
                  {line}
                  {i < closing.length - 1 && <br />}
                </span>
              ))}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
};
