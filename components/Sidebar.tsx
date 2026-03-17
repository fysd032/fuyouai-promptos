"use client";

import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layers, Box, Building2, ChevronRight, History, Plus, X, ArrowRight, Loader2, Check } from "lucide-react";
import { useIntentRouter, type RouterResult } from "@/src/hooks/useIntentRouter";
import { supabase } from "@/src/lib/supabaseClient";

const NAV_ITEMS = [
  {
    path: "/modules/core",
    label: "Core Frameworks",
    desc: "Methodologies",
    icon: Layers,
  },
  {
    path: "/modules/general",
    label: "General Modules",
    desc: "General Modules",
    icon: Box,
  },
  // {
  //   path: "/modules/industry",
  //   label: "Industry Templates",
  //   desc: "Industry Templates",
  //   icon: Building2,
  // },
  {
    path: "/modules/history",
    label: "Session History",
    desc: "Past sessions",
    icon: History,
  },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const [showModal, setShowModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const onConfirm = useCallback(async (result: RouterResult, text: string) => {
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
    setShowModal(false);
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push(`/modules/general/${result.frontModuleId}/${result.variantId}/run`);
    } else {
      router.push("/login?from=/modules/core");
    }
  }, [router]);

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

  return (
    <>
      <div className="flex flex-col h-full">
        {/* ====== Logo ====== */}
        <Link href="/modules" className="flex items-center gap-2.5 px-5 pt-5 pb-4 group">
          <svg
            width="26"
            height="26"
            viewBox="0 0 100 100"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="flex-shrink-0 transition-transform group-hover:scale-105"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M20 20H80C88.2843 20 95 26.7157 95 35V40C95 48.2843 88.2843 55 80 55H60L55 60H75C83.2843 60 90 66.7157 90 75V80C90 88.2843 83.2843 95 75 95H40L35 100H20L25 20Z"
              fill="url(#sidebar_logo_grad)"
            />
            <defs>
              <linearGradient
                id="sidebar_logo_grad"
                x1="20"
                y1="20"
                x2="95"
                y2="100"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#3B82F6" />
                <stop offset="1" stopColor="#6366F1" />
              </linearGradient>
            </defs>
          </svg>
          <div className="flex flex-col leading-none">
            <span className="text-[15px] font-bold text-white tracking-tight">FUYOU</span>
            <span className="text-[10px] text-[#9CA3AF] font-medium tracking-[0.08em] mt-0.5">
              PROMPT OS
            </span>
          </div>
        </Link>

        {/* ====== New Task button ====== */}
        <div className="px-3 pb-3">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-[#1E9FFF] hover:bg-[#4CB2FF] active:scale-[0.98] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-[0_2px_10px_rgba(30,159,255,0.25)]"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>

        {/* ====== Section title ====== */}
        <div className="px-5 pt-1 pb-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#9CA3AF]/50 mb-1">
            MODULE CENTER
          </div>
          <h2 className="text-base font-semibold text-[#F9FAFB] tracking-tight">
            Module Center
          </h2>
        </div>

        {/* ====== Nav ====== */}
        <nav className="flex-1 px-2.5 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.path ||
              (item.path !== "/modules" && pathname?.startsWith(item.path + "/"));
            const Icon = item.icon;

            return (
              <Link
                key={item.path}
                href={item.path}
                className={`
                  relative flex items-center gap-3 px-3.5 py-3.5 rounded-xl transition-all duration-200 group border
                  ${
                    isActive
                      ? "bg-[#111827] border-[#1F2937] shadow-sm"
                      : "bg-transparent border-transparent hover:bg-[#111827]/50"
                  }
                `}
              >
                {/* Active indicator bar */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-[3px] bg-[#3B82F6] rounded-r-full" />
                )}

                <span
                  className={`flex-shrink-0 transition-colors ${
                    isActive
                      ? "text-[#3B82F6]"
                      : "text-[#6B7280] group-hover:text-[#9CA3AF]"
                  }`}
                >
                  <Icon size={18} />
                </span>

                <div className="flex-1 min-w-0">
                  <div
                    className={`text-[14px] font-medium leading-none mb-1.5 transition-colors ${
                      isActive
                        ? "text-[#F9FAFB]"
                        : "text-[#9CA3AF] group-hover:text-[#F9FAFB]"
                    }`}
                  >
                    {item.label}
                  </div>
                  <div className="text-[11px] text-[#6B7280] leading-tight font-medium">
                    {item.desc}
                  </div>
                </div>

                {isActive && (
                  <ChevronRight size={14} className="text-[#3B82F6] flex-shrink-0" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* ====== Footer ====== */}
        <div className="p-3.5 border-t border-[#1F2937]">
          <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-medium text-emerald-400">
                System Online
              </span>
            </div>
            <p className="text-[10px] text-[#6B7280]">PromptOS v1</p>
          </div>
        </div>
      </div>

      {/* ====== New Task Modal (portal → body) ====== */}
      {mounted && showModal && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Card */}
          <div className="relative z-10 w-full max-w-xl bg-[#0F141C] border border-[#1F2937] rounded-2xl shadow-2xl p-10">
            {/* Close */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#6B7280] hover:text-white hover:bg-[#1F2937] transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <h2 className="text-xl font-semibold text-white mb-1">What do you want to do?</h2>
            <p className="text-sm text-[#6B7280] mb-6">Describe your task and we'll route it to the right module.</p>

            <form onSubmit={handleRouterSubmit} className="flex flex-col gap-4">
              <textarea
                autoFocus
                value={routerInput}
                onChange={(e) => setRouterInput(e.target.value)}
                placeholder="Describe what you want to accomplish..."
                style={{ minHeight: "120px", resize: "vertical" }}
                className="w-full rounded-xl border border-[#1F2937] bg-[#111827] px-5 py-4 text-base text-white placeholder:text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#1E9FFF]/40 focus:border-[#1E9FFF]/50 transition-all"
              />

              {/* Hint */}
              {routerStage === "hinting" && routerResult?.hint && (
                <p className="text-sm text-slate-400 pl-1">💡 {routerResult.hint}</p>
              )}

              {/* Error */}
              {routerStage === "error" && routerError && (
                <p className="text-sm text-red-400 pl-1">{routerError}</p>
              )}

              <div className="flex gap-3 mt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl text-sm font-medium border border-[#1F2937] text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] transition-colors"
                >
                  Cancel
                </button>

                {routerStage === "loading" ? (
                  <button
                    type="button"
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-[#1E9FFF]/60 text-white cursor-not-allowed"
                  >
                    <Loader2 size={15} className="animate-spin" /> Routing...
                  </button>
                ) : routerStage === "confirmed" ? (
                  <button
                    type="button"
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-emerald-500 text-white"
                  >
                    <Check size={15} /> Ready
                  </button>
                ) : routerStage === "hinting" ? (
                  <button
                    type="button"
                    onClick={handleRouterConfirm}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white transition-colors"
                  >
                    Start <ArrowRight size={15} />
                  </button>
                ) : routerStage === "error" ? (
                  <button
                    type="button"
                    onClick={resetRouterError}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white transition-colors"
                  >
                    Try again
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white transition-colors"
                  >
                    Continue <ArrowRight size={15} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default Sidebar;
