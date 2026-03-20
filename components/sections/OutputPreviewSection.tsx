"use client";

import React, { useState } from "react";
import { ArrowRight } from "lucide-react";

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

const cases: PreviewCase[] = [
  {
    id: "followup",
    label: "Follow up with a client",
    input: "I need to follow up with a client about next steps after our meeting",
    outputTitle: "Next Steps After Our Meeting",
    outputTypeLabel: "Structured Output",
    bodyIntro: "Hi [Name],",
    bodyText: "Great speaking with you. Here's a quick summary of our agreed next steps:",
    outputSections: [
      "Proposal submitted — by Friday",
      "Client feedback — early next week",
      "Final alignment call — to be scheduled",
    ],
    appendix: [
      { label: "Key Decision", value: "Proposal scope" },
      { label: "Risk", value: "Timeline slippage" },
      { label: "Owner", value: "[Your Name]" },
    ],
    closing: ["Best,", "[Your Name]"],
  },
  {
    id: "business-plan",
    label: "Write a business plan",
    input: "I want to build an AI SaaS for marketing",
    outputTitle: "Business Plan Summary",
    outputTypeLabel: "Structured Output",
    bodyIntro: "Draft overview",
    bodyText: "Here is a structured first-pass plan for the business:",
    outputSections: [
      "Target users: SMB marketing teams",
      "Core value: Automate campaign planning",
      "Product: AI workflow builder",
      "Revenue: Subscription ($29–$99/mo)",
      "GTM: Content + founder-led sales",
    ],
    appendix: [
      { label: "Key Assumption", value: "Demand for automation" },
      { label: "Risk", value: "Competition from existing tools" },
      { label: "Next Step", value: "Build MVP landing page" },
    ],
    closing: "Ready for refinement",
  },
  {
    id: "prd",
    label: "Create a PRD",
    input: "Write a PRD for a new feature",
    outputTitle: "Product Requirement",
    outputTypeLabel: "Structured Output",
    bodyIntro: "Feature: Smart Task Routing",
    bodyText: "This draft organizes the feature into a clear product requirement structure:",
    outputSections: [
      "Goal: Improve task completion rate",
      "User: Knowledge workers",
      "Flow: Input task → Auto route → Generate output",
      "Success metric: +30% task completion",
    ],
    appendix: [
      { label: "Risk", value: "Misclassification" },
      { label: "Dependency", value: "AI routing model" },
      { label: "Priority", value: "High" },
    ],
    closing: "Ready for review",
  },
  {
    id: "content",
    label: "Write social content",
    input: "Write about AI trends",
    outputTitle: "Article Outline",
    outputTypeLabel: "Structured Output",
    bodyIntro: "Content draft",
    bodyText: "Here is a structured outline that can be turned into an article or social post:",
    outputSections: [
      "Introduction: Why AI is shifting work",
      "Trend 1: Workflow automation",
      "Trend 2: AI as collaborator",
      "Trend 3: Structured outputs",
      "Conclusion: From tools to systems",
    ],
    appendix: [
      { label: "Title", value: "AI Is Becoming a Work System" },
      { label: "Social version", value: "3 key bullet points" },
      { label: "Distribution", value: "Twitter / LinkedIn" },
    ],
    closing: "Ready to publish",
  },
];

export const OutputPreviewSection: React.FC = () => {
  const [activeId, setActiveId] = useState<string>(cases[0].id);
  const active = cases.find((c) => c.id === activeId) ?? cases[0];
  const closing = Array.isArray(active.closing)
    ? active.closing
    : [active.closing];

  return (
    <section className="max-w-7xl mx-auto px-6 py-32 relative z-10">
      <div className="text-center mb-16">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-500 uppercase mb-4">
          Output Preview
        </p>
        <h2 className="text-3xl lg:text-5xl font-semibold text-white tracking-tight mb-4">
          See the exact output you&apos;ll get
        </h2>
        <p className="text-sm text-slate-500 max-w-xs mx-auto">
          Not a chat reply. A structured deliverable, ready to use.
        </p>
      </div>

      <div className="grid lg:grid-cols-[300px_auto_1fr] gap-6 items-start">

        {/* Left: case selector + input */}
        <div className="flex flex-col gap-5">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Try real work scenarios
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
              Your Input
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
              <p className="text-[10px] text-slate-600 uppercase tracking-wider mb-1.5">Subject</p>
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
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">Appendix</p>
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
