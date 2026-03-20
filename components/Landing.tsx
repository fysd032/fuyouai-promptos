"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { supabase } from "../src/lib/supabaseClient";
import { SiteFooter } from "./SiteFooter";
import { useIntentRouter, type RouterResult } from "../src/hooks/useIntentRouter";

import { HeroSection } from "./sections/HeroSection";
import { UseCasesSection } from "./sections/UseCasesSection";
import { HowItWorksSection } from "./sections/HowItWorksSection";
import { OutputPreviewSection } from "./sections/OutputPreviewSection";
import { WhyNotChatGPTSection } from "./sections/WhyNotChatGPTSection";
import { FeaturesSection } from "./sections/FeaturesSection";
import { BlogPreviewSection } from "./sections/BlogPreviewSection";
import { FinalCTASection } from "./sections/FinalCTASection";

export const Landing: React.FC = () => {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const router = useRouter();

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
      <HeroSection
        routerInput={routerInput}
        setRouterInput={setRouterInput}
        routerStage={routerStage}
        routerResult={routerResult}
        routerError={routerError}
        handleRouterSubmit={handleRouterSubmit}
        handleRouterConfirm={handleRouterConfirm}
        resetRouterError={resetRouterError}
        scrollToFeatures={scrollToFeatures}
      />

      {/* Use Cases */}
      <div className="w-full border-t border-white/[0.04]" />
      <UseCasesSection />

      {/* Output Preview — moved up, highest visual weight */}
      <div className="w-full border-t border-white/[0.04]" />
      <OutputPreviewSection />

      {/* How It Works */}
      <div className="w-full border-t border-white/[0.04]" />
      <HowItWorksSection />

      {/* Why Not ChatGPT */}
      <div className="w-full border-t border-white/[0.04]" />
      <WhyNotChatGPTSection />

      {/* Features */}
      <div className="w-full border-t border-white/[0.04]" />
      <FeaturesSection />

      {/* Blog Preview */}
      <div className="w-full border-t border-white/[0.04]" />
      <BlogPreviewSection />

      {/* Final CTA */}
      <div className="w-full border-t border-white/[0.04]" />
      <FinalCTASection />

      <SiteFooter />
    </div>
  );
};
