"use client";

import React, { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { suggestions } from "../config/suggestions";
import { supabase } from "@/src/lib/supabaseClient";
import { useIntentRouter, RouterResult } from "@/src/hooks/useIntentRouter";

// ============================
// 常量
// ============================

const MODULE_ENTRIES = [
  { href: "/modules/core", label: "Core", desc: "5 core methodology engines" },
  { href: "/modules/general", label: "General", desc: "Universal task modules" },
  { href: "/modules/industry", label: "Industry", desc: "Industry templates" },
];

const placeholderOptions = [
  "E.g. write a business email, run a competitor analysis, summarize a document, generate an SOP",
  "Describe your task in one sentence…",
  "Tell me what you want to accomplish…",
];

// ============================
// 组件
// ============================

const MobileEntry: React.FC = () => {
  const router = useRouter();

  const placeholder = useMemo(() => placeholderOptions[0], []);

  async function onConfirm(result: RouterResult, text: string) {
    sessionStorage.setItem(
      "mobile-run-state",
      JSON.stringify({
        text,
        planId: `plan_${Date.now()}`,
        summary: result.moduleReason,
        questions: [],
        frontModuleId: result.frontModuleId,
        variantId: result.variantId,
        coreEngine: result.coreEngine,
        answers: {},
      })
    );

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push("/m2/run");
    } else {
      router.push("/login?from=/m2/run");
    }
  }

  const {
    input,
    setInput,
    showHint,
    setShowHint,
    stage,
    routerResult,
    errorMsg,
    handleSubmit,
    handleConfirm,
    resetError,
  } = useIntentRouter(onConfirm);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const force = params.get("force") === "1";
    const isMobile = window.matchMedia("(max-width: 900px)").matches;
    if (!isMobile && !force) {
      router.replace("/modules/core");
    }
  }, [router]);

  // ============================
  // 阶段渲染
  // ============================

  // stage: loading
  if (stage === "loading") {
    return (
      <div className="min-h-[100dvh] bg-[#0A0F1C] text-[#F9FAFB] overflow-x-hidden">
        <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-[radial-gradient(1200px_700px_at_50%_-10%,rgba(59,130,246,0.2),rgba(10,15,28,0)_60%),linear-gradient(180deg,rgba(10,15,28,0.95),rgba(10,15,28,1))]">
          <p className="text-sm text-[#9CA3AF]">Understanding your request...</p>
        </div>
      </div>
    );
  }

  // stage: hinting
  if (stage === "hinting" && routerResult) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0F1C] text-[#F9FAFB] overflow-x-hidden">
        <div className="min-h-[100dvh] flex flex-col px-4 pt-10 pb-12 bg-[radial-gradient(1200px_700px_at_50%_-10%,rgba(59,130,246,0.2),rgba(10,15,28,0)_60%),linear-gradient(180deg,rgba(10,15,28,0.95),rgba(10,15,28,1))]">
          <div className="w-full max-w-xl mx-auto flex flex-col gap-6">
            <header className="space-y-3">
              <p className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">Studio</p>
              <h1 className="text-2xl sm:text-3xl font-semibold text-white">
                What do you want to do?
              </h1>
            </header>

            <div className="space-y-2">
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                rows={4}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-[#1F2937] bg-[#0F172A] p-4 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/60"
                maxLength={4000}
              />
              {routerResult.hint && (
                <p className="text-xs text-[#9CA3AF] px-1">
                  💡 {routerResult.hint}
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={handleConfirm}
              className="w-full rounded-xl bg-[#3B82F6] py-3 text-sm font-semibold text-white shadow-lg shadow-[#1D4ED8]/20 transition hover:bg-[#2563EB]"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // stage: confirmed
  if (stage === "confirmed" && routerResult) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0F1C] text-[#F9FAFB] overflow-x-hidden">
        <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-[radial-gradient(1200px_700px_at_50%_-10%,rgba(59,130,246,0.2),rgba(10,15,28,0)_60%),linear-gradient(180deg,rgba(10,15,28,0.95),rgba(10,15,28,1))]">
          <div className="w-full max-w-xl flex flex-col gap-4">
            <p className="text-sm text-[#9CA3AF]">
              Ready ·{" "}
              <span className="text-[#60A5FA] font-mono">{routerResult.frontModuleId}</span>
            </p>
            <button
              type="button"
              onClick={handleConfirm}
              className="w-full rounded-xl bg-[#3B82F6] py-3 text-sm font-semibold text-white shadow-lg shadow-[#1D4ED8]/20 transition hover:bg-[#2563EB]"
            >
              Start
            </button>
          </div>
        </div>
      </div>
    );
  }

  // stage: error
  if (stage === "error") {
    return (
      <div className="min-h-[100dvh] bg-[#0A0F1C] text-[#F9FAFB] overflow-x-hidden">
        <div className="min-h-[100dvh] flex flex-col items-center justify-center px-4 bg-[radial-gradient(1200px_700px_at_50%_-10%,rgba(59,130,246,0.2),rgba(10,15,28,0)_60%),linear-gradient(180deg,rgba(10,15,28,0.95),rgba(10,15,28,1))]">
          <div className="w-full max-w-xl flex flex-col gap-4">
            <p className="text-sm text-[#F87171]">{errorMsg}</p>
            <button
              type="button"
              onClick={resetError}
              className="w-full rounded-xl border border-[#3B82F6] py-3 text-sm font-semibold text-[#3B82F6] transition hover:bg-[#1D4ED8]/10"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // stage: idle
  return (
    <div className="min-h-[100dvh] bg-[#0A0F1C] text-[#F9FAFB] overflow-x-hidden">
      <div className="min-h-[100dvh] flex flex-col px-4 pt-10 pb-12 bg-[radial-gradient(1200px_700px_at_50%_-10%,rgba(59,130,246,0.2),rgba(10,15,28,0)_60%),linear-gradient(180deg,rgba(10,15,28,0.95),rgba(10,15,28,1))]">
        <div className="w-full max-w-xl mx-auto flex flex-col gap-8">
          <header className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">
              Studio
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">
              What do you want to do?
            </h1>
            <p className="text-sm text-[#9CA3AF]">
              Describe the outcome you want and we will plan the next steps.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <textarea
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  if (showHint) setShowHint(false);
                }}
                rows={4}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-[#1F2937] bg-[#0F172A] p-4 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/60"
              />
              {showHint && !input.trim() && (
                <p className="text-xs text-[#F87171]">Please enter your request</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setInput(item);
                    setShowHint(false);
                  }}
                  className="rounded-full border border-[#1F2937] bg-[#111827]/70 px-3 py-1.5 text-xs text-[#E5E7EB] hover:border-[#3B82F6]/50 hover:text-white transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="submit"
              className="w-full rounded-xl bg-[#3B82F6] py-3 text-sm font-semibold text-white shadow-lg shadow-[#1D4ED8]/20 transition hover:bg-[#2563EB]"
            >
              Continue
            </button>
          </form>

          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-[#6B7280]">Modules</p>
            <div className="grid grid-cols-3 gap-2">
              {MODULE_ENTRIES.map((entry) => (
                <Link
                  key={entry.href}
                  href={entry.href}
                  className="rounded-xl border border-[#1F2937] bg-[#0F172A] p-3 text-center hover:border-[#3B82F6]/50 transition-colors"
                >
                  <div className="text-sm font-medium text-white">{entry.label}</div>
                  <div className="text-[10px] text-[#6B7280] mt-1 leading-tight">{entry.desc}</div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MobileEntry;
