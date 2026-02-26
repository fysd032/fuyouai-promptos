"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  ArrowRight,
  Check,
  Terminal,
  Database,
  Activity,
} from "lucide-react";
import { supabase } from "../src/lib/supabaseClient";
import { SiteFooter } from "./SiteFooter";

export const Landing: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0B0F15_0%,#0F141C_40%,#111827_100%)] font-sans text-white selection:bg-brand-500/30 overflow-x-hidden">
      {/* Navbar (Minimalist Transparent) */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/[0.02] relative z-50">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg tracking-tight text-white/95">
            FuyouAI
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <button
            onClick={scrollToFeatures}
            className="hover:text-white transition-colors"
          >
            Features
          </button>

          <Link href="/pricing" className="hover:text-white transition-colors">
            Pricing
          </Link>

          <Link href="/modules" className="hover:text-white transition-colors">
            Modules
          </Link>

          {userEmail ? (
            <Link
              href="/modules"
              className="bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white px-5 py-2 rounded-xl transition-all shadow-[0_4px_14px_rgba(30,159,255,0.28)] flex items-center gap-2 group font-semibold"
            >
              Dashboard
              <ArrowRight
                size={14}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="hover:text-white transition-colors whitespace-nowrap"
              >
                Sign in
              </Link>

              <Link
                href="/login"
                className="bg-[#1E9FFF] hover:bg-[#4CB2FF] disabled:opacity-70 disabled:cursor-not-allowed text-white font-semibold px-5 py-2 rounded-xl transition-all shadow-[0_10px_30px_rgba(30,159,255,0.28)] active:scale-[0.98] inline-flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-0.5 transition-transform"
                />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section (50/50 Split) */}
      <header className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-16 lg:pt-24 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          {/* Left Column: Brand & Copy */}
          <div className="flex flex-col justify-center max-w-xl relative z-20">
            <div className="mb-6">
              <span className="font-semibold text-white tracking-tight text-lg">
                FuyouAI
              </span>
            </div>

            <h1 className="text-5xl lg:text-[56px] font-semibold leading-[1.1] tracking-tight mb-2 text-white">
              Your Prompt Isn't Bad — It's Unfocused
            </h1>

            <p className="text-lg lg:text-[20px] leading-[1.6] text-slate-400 font-normal mb-8 max-w-[36rem]">
              Turn messy ideas into clear, structured, executable instructions.
            </p>

            <div className="space-y-3 mb-10">
              {[
                "General Task Processor (Task GTP)",
                "Structured task decomposition and execution",
                "Reusable task template system",
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-400">
                  <Check size={16} className="text-[#6BB7FF]" />
                  <span className="text-base font-normal">{item}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-4 sm:flex-nowrap">
              <Link
                href="/login"
                className="bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white px-7 py-4 rounded-xl font-medium text-base shadow-[0_4px_14px_rgba(30,159,255,0.35)] transition-all inline-flex items-center gap-2 whitespace-nowrap"
              >
                Get Started with FuyouAI <ArrowRight size={18} />
              </Link>

              <button
                onClick={scrollToFeatures}
                className="px-7 py-4 rounded-xl font-medium text-white/85 border border-white/[0.18] hover:border-white/40 hover:bg-white/[0.02] transition-all whitespace-nowrap"
              >
                View Features
              </button>
            </div>
          </div>

          {/* Right Column: OS Card (Glassmorphism) */}
          <div className="relative z-10 w-full max-w-[600px] aspect-[4/3] mx-auto lg:mr-0">
            <div className="absolute -inset-1 bg-brand-500/20 blur-3xl opacity-20 rounded-full"></div>

            <div className="relative h-full w-full bg-white/[0.03] backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.45)] p-8 flex flex-col">
              <div className="flex items-center justify-between mb-8 border-b border-white/[0.08] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                </div>
                <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">
                  FuyouAI Task OS
                </div>
              </div>

              <div className="mb-6">
                <div className="text-xs text-slate-500 mb-1">Current Task</div>
                <div className="text-lg font-medium text-white flex items-center gap-2">
                  <Activity size={18} className="text-[#6BB7FF]" />
                  Deep Market Analysis: SaaS Industry Trends
                </div>
              </div>

              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-4 p-3 rounded-xl border border-white/[0.03] bg-white/[0.01] text-slate-500">
                  <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center text-[10px]">
                    1
                  </div>
                  <div className="flex-1 font-mono text-sm">
                    Task Understanding
                  </div>
                  <Check size={14} className="text-slate-600" />
                </div>

                <div className="relative flex items-center gap-4 p-3 rounded-xl border border-brand-400/50 bg-brand-900/20 text-white shadow-[0_0_25px_rgba(59,130,246,0.15)] overflow-hidden group">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500"></div>
                  <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-[10px] text-white font-bold animate-pulse">
                    2
                  </div>
                  <div className="flex-1 font-mono text-sm flex items-center justify-between">
                    <span>Data Gathering</span>
                    <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded">
                      RUNNING
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-xl border border-white/[0.03] bg-white/[0.01] text-slate-600 opacity-60">
                  <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center text-[10px]">
                    3
                  </div>
                  <div className="flex-1 font-mono text-sm">
                    Structured Breakdown
                  </div>
                </div>

                <div className="flex items-center gap-4 p-3 rounded-xl border border-white/[0.03] bg-white/[0.01] text-slate-600 opacity-60">
                  <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center text-[10px]">
                    4
                  </div>
                  <div className="flex-1 font-mono text-sm">
                    Execution Engine
                  </div>
                </div>
              </div>

              <div className="absolute top-8 right-8 w-2 h-2 rounded-full bg-brand-400 animate-ping"></div>
            </div>
          </div>
        </div>
      </header>

      {/* Section 2 */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-b border-white/[0.05] relative z-10">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-[0.2em] text-brand-400 uppercase mb-4">
            What is FuyouAI
          </p>

          <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-6">
            A Professional Task Automator
          </h2>

          <p className="mt-4 text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            Not a content generation model, but a professional task-oriented GTP
            system.
            <br className="hidden md:block" />
            From task understanding to structured breakdown, to executable and
            reusable workflow generation.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Task Understanding",
              desc: "Extract key objectives, constraints and boundaries from ambiguous requirements to determine task feasibility.",
            },
            {
              title: "Task Breakdown",
              desc: "Decompose complex tasks into controllable steps: data collection, analysis methods, output structure, validation rules.",
            },
            {
              title: "Execution Engine",
              desc: "Generate standardized instructions and structured prompts for each step, executed by LLM or other tools.",
            },
            {
              title: "Output Calibration",
              desc: "Compare expected vs actual output to iterate, optimize and finalize task structure and prompts.",
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-md p-6 flex flex-col gap-3 hover:bg-slate-800/50 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
              <h3 className="text-sm font-semibold text-slate-200 relative z-10">
                {item.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed relative z-10 line-clamp-3">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm h-full">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-6">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              7 Core Frameworks
            </h3>
            <p className="text-slate-400 leading-relaxed line-clamp-3">
              Built-in Chain of Thought (CoT), structured expression, and proven
              prompt engineering methodologies for quality output.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm h-full">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-6">
              <Terminal size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Prompt Optimizer
            </h3>
            <p className="text-slate-400 leading-relaxed line-clamp-3">
              Input task context and constraints through a visual interface,
              auto-generate well-structured system prompts.
            </p>
          </div>

          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm h-full">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6">
              <Database size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">
              Industry Templates
            </h3>
            <p className="text-slate-400 leading-relaxed line-clamp-3">
              Covering 10+ verticals including product, consulting, research,
              and legal. Reuse expert workflows for 10x efficiency.
            </p>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
};
