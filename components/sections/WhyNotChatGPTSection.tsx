"use client";

import React from "react";

const comparisons = [
  {
    topic: "Output",
    chatgpt: "A chat response",
    fuyou: "A structured deliverable",
  },
  {
    topic: "Workflow",
    chatgpt: "Requires prompting skills",
    fuyou: "Auto-selects the right workflow",
  },
  {
    topic: "Reusability",
    chatgpt: "One-off answers",
    fuyou: "Reusable task system",
  },
  {
    topic: "Speed",
    chatgpt: "Trial and error",
    fuyou: "First output in under 60 seconds",
  },
];

export const WhyNotChatGPTSection: React.FC = () => {
  return (
    <section className="max-w-4xl mx-auto px-6 py-24 relative z-10">
      <div className="text-center mb-14">
        <p className="text-xs font-medium tracking-[0.25em] text-slate-500 uppercase mb-4">
          Why FuyouAI
        </p>
        <h2 className="text-3xl lg:text-4xl font-semibold text-white tracking-tight">
          ChatGPT gives answers<br />We deliver outcomes
        </h2>
      </div>

      <div className="rounded-2xl border border-slate-800/60 overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-3 bg-slate-900/60 border-b border-slate-800/60">
          <div className="px-6 py-4" />
          <div className="px-6 py-4 border-l border-slate-800/60">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">ChatGPT</p>
          </div>
          <div className="px-6 py-4 border-l border-[#1E9FFF]/20 bg-[#1E9FFF]/[0.03]">
            <p className="text-xs font-semibold text-blue-400 uppercase tracking-wider">FuyouAI</p>
          </div>
        </div>

        {/* Comparison rows */}
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
    </section>
  );
};
