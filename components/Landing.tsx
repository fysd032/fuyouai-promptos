"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  Check,
  Terminal,
  Database,
  Loader2,
  Zap,
  GitBranch,
  FileText,
} from "lucide-react";
import { supabase } from "../src/lib/supabaseClient";
import { SiteFooter } from "./SiteFooter";
import { useIntentRouter, type RouterResult } from "../src/hooks/useIntentRouter";

const PLACEHOLDERS = [
  "Write a follow-up email to a client about next steps",
  "Build a business plan for an AI startup",
  "Analyze our competitors' market strategy",
];

export const Landing: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [placeholderIdx, setPlaceholderIdx] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState(PLACEHOLDERS[0]);
  const [cardIdx, setCardIdx] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Placeholder rotation
  useEffect(() => {
    const id = setInterval(() => {
      setPlaceholderIdx((i) => {
        const next = (i + 1) % PLACEHOLDERS.length;
        setDisplayedPlaceholder(PLACEHOLDERS[next]);
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, []);

  // Card carousel — auto-advance every 4s
  useEffect(() => {
    const id = setInterval(() => setCardIdx((i) => (i + 1) % 3), 8000);
    return () => clearInterval(id);
  }, []);

  const onConfirm = async (result: RouterResult, text: string) => {
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
      router.push(`/modules/general/${result.frontModuleId}/${result.variantId}/run`);
    } else {
      router.push("/login?from=/modules/core");
    }
  };

  const {
    input: routerInput,
    setInput: setRouterInput,
    stage: routerStage,
    routerResult,
    errorMsg: routerError,
    handleSubmit: handleRouterSubmit,
    handleConfirm: handleRouterConfirm,
    resetError: resetRouterError,
  } = useIntentRouter(onConfirm);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUserEmail(data.user?.email ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUserEmail(session?.user?.email ?? null);
    });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const scrollToFeatures = () => {
    const element = document.getElementById("features");
    if (element) element.scrollIntoView({ behavior: "smooth" });
  };

  const isLoading = routerStage === "loading";
  const isHinting = routerStage === "hinting";
  const isConfirmed = routerStage === "confirmed";
  const isError = routerStage === "error";

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0B0F15_0%,#0F141C_40%,#111827_100%)] font-sans text-white selection:bg-blue-500/30 overflow-x-hidden">

      {/* Navbar */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/[0.02] relative z-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg tracking-tight text-white/95">FuyouAI</span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <button onClick={scrollToFeatures} className="hover:text-white transition-colors">
            Features
          </button>
          <Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/modules" className="hover:text-white transition-colors">Modules</Link>

          {userEmail ? (
            <Link
              href="/modules"
              className="bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white px-5 py-2 rounded-xl transition-all shadow-[0_4px_14px_rgba(30,159,255,0.28)] flex items-center gap-2 group font-semibold"
            >
              Dashboard
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:text-white transition-colors whitespace-nowrap">
                Sign in
              </Link>
              <Link
                href="/login"
                className="bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white font-semibold px-5 py-2 rounded-xl transition-all shadow-[0_10px_30px_rgba(30,159,255,0.28)] active:scale-[0.98] inline-flex items-center gap-2"
              >
                Get Started
                <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero */}
      <header className="max-w-4xl mx-auto px-6 pt-32 pb-8 text-center relative z-10">
        {/* Eyebrow */}
        <p className="text-xs font-medium tracking-[0.3em] text-slate-500 uppercase mb-8">
          FuyouAI · Prompt OS
        </p>

        {/* Main headline */}
        <h1 className="text-5xl lg:text-[60px] font-semibold leading-[1.1] tracking-tight text-white mb-8">
          A Thinking Tool for Real Work
        </h1>

        {/* Sub headline */}
        <p className="text-lg lg:text-xl leading-[1.7] text-slate-400 font-normal max-w-xl mx-auto mb-16">
          Not just content generation — it understands your need,
          breaks down the problem, routes to the right tool,
          and delivers output you can actually use.
        </p>

        {/* Input area */}
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <p className="text-xs text-slate-500 text-left pl-1">Tell me what you want to accomplish</p>

          <form onSubmit={handleRouterSubmit} className="flex flex-col gap-2">
            {/* Input row */}
            <div className="relative flex items-center">
              <input
                ref={inputRef}
                type="text"
                value={routerInput}
                onChange={(e) => setRouterInput(e.target.value)}
                placeholder={displayedPlaceholder}
                style={{ height: "72px" }}
                className="w-full rounded-xl border border-white/40 bg-white/[0.04] pl-6 pr-48 text-xl text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#1E9FFF]/40 focus:border-[#1E9FFF]/50 transition-all"
              />

              {/* Inset button */}
              <div className="absolute right-2 flex items-center gap-2">
                {isLoading ? (
                  <span className="flex items-center gap-2 bg-[#1E9FFF]/70 text-white text-sm font-medium px-7 py-3 rounded-lg cursor-not-allowed">
                    <Loader2 size={15} className="animate-spin" /> Routing...
                  </span>
                ) : isConfirmed ? (
                  <span className="flex items-center gap-2 bg-emerald-500 text-white text-sm font-medium px-7 py-3 rounded-lg">
                    <Check size={15} /> {routerResult?.frontModuleId ?? "Ready"}
                  </span>
                ) : isError ? (
                  <button
                    type="button"
                    onClick={resetRouterError}
                    className="flex items-center gap-2 bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white text-sm font-medium px-7 py-3 rounded-lg transition-colors"
                  >
                    Try again
                  </button>
                ) : isHinting ? (
                  <button
                    type="button"
                    onClick={handleRouterConfirm}
                    className="flex items-center gap-2 bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white text-sm font-medium px-7 py-3 rounded-lg transition-colors"
                  >
                    Start <ArrowRight size={15} />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex items-center gap-2 bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white text-sm font-medium px-7 py-3 rounded-lg transition-colors shadow-[0_2px_10px_rgba(30,159,255,0.3)]"
                  >
                    Start <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </div>

            {/* Hint */}
            {isHinting && routerResult?.hint && (
              <p className="text-sm text-slate-400 text-left pl-1">💡 {routerResult.hint}</p>
            )}

            {/* Error */}
            {isError && (
              <p className="text-sm text-red-400 text-left pl-1">{routerError}</p>
            )}
          </form>

          {/* Meta line */}
          <p className="text-xs text-slate-600 text-center mt-4">
            31 professional modules · Auto intent routing · Structured output
          </p>

          {/* Secondary action */}
          <div className="flex items-center justify-center gap-6 mt-4">
            <span className="text-xs text-slate-600">Preview first step free</span>
            <button
              type="button"
              onClick={scrollToFeatures}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors underline underline-offset-4"
            >
              View Features
            </button>
          </div>
        </div>
      </header>

      {/* Feature card carousel — full-width slide */}
      <section className="w-full pt-24 pb-24 relative z-10 overflow-hidden">
        {/* Sliding track: 3 cards side by side, translate by cardIdx */}
        <div
          className="flex"
          style={{
            width: "300%",
            transform: `translateX(-${cardIdx * 33.3333}%)`,
            transition: "transform 600ms ease",
          }}
        >
          {/* Card 1 */}
          <div className="flex items-center justify-center" style={{ width: "33.3333%" }}>
            <div className="flex flex-col items-center text-center gap-5 px-6 py-12" style={{ height: "320px", maxWidth: "640px", width: "100%" }}>
              <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                <Zap size={28} />
              </div>
              <p className="text-[11px] font-medium tracking-[0.2em] text-slate-500 uppercase">
                Intent Recognition
              </p>
              <h3 className="text-xl font-semibold text-white leading-snug">
                Understands what you actually mean
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                Not just what you typed — the system identifies your real goal before choosing how to respond.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="flex items-center justify-center" style={{ width: "33.3333%" }}>
            <div className="flex flex-col items-center text-center gap-5 px-6 py-12" style={{ height: "320px", maxWidth: "640px", width: "100%" }}>
              <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                <GitBranch size={28} />
              </div>
              <p className="text-[11px] font-medium tracking-[0.2em] text-slate-500 uppercase">
                Precision Routing
              </p>
              <h3 className="text-xl font-semibold text-white leading-snug">
                31 modules. Always the right one.
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                Every request is matched to the most suitable professional module automatically — no manual selection needed.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex items-center justify-center" style={{ width: "33.3333%" }}>
            <div className="flex flex-col items-center text-center gap-5 px-6 py-12" style={{ height: "320px", maxWidth: "640px", width: "100%" }}>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <FileText size={28} />
              </div>
              <p className="text-[11px] font-medium tracking-[0.2em] text-slate-500 uppercase">
                Structured Output
              </p>
              <h3 className="text-xl font-semibold text-white leading-snug">
                Not a reply. A deliverable.
              </h3>
              <p className="text-sm text-slate-500 leading-relaxed max-w-md">
                Every output is formatted, professional, and ready to use — not a chat response.
              </p>
            </div>
          </div>
        </div>

        {/* Dot indicators */}
        <div className="flex items-center justify-center gap-4 mt-2">
          {[0, 1, 2].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCardIdx(i)}
              aria-label={`Go to card ${i + 1}`}
              className={`rounded-full transition-all duration-300 ${
                i === cardIdx
                  ? "w-6 h-2 bg-white/60"
                  : "w-2 h-2 bg-white/20 hover:bg-white/35"
              }`}
            />
          ))}
        </div>
      </section>

      <div className="w-full border-t border-white/10 my-16" />

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm h-full">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-6">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">7 Core Frameworks</h3>
            <p className="text-slate-400 leading-relaxed line-clamp-3">
              Built-in Chain of Thought (CoT), structured expression, and proven prompt engineering methodologies for quality output.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm h-full">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-6">
              <Terminal size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Prompt Optimizer</h3>
            <p className="text-slate-400 leading-relaxed line-clamp-3">
              Input task context and constraints through a visual interface, auto-generate well-structured system prompts.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm h-full">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6">
              <Database size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Industry Templates</h3>
            <p className="text-slate-400 leading-relaxed line-clamp-3">
              Covering 10+ verticals including product, consulting, research, and legal. Reuse expert workflows for 10x efficiency.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};
