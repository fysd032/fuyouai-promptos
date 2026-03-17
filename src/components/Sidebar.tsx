"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Layers, Box, Briefcase, ChevronRight, X, Plus, ArrowRight, Loader2, Check } from "lucide-react";
import { useIntentRouter, type RouterResult } from "@/src/hooks/useIntentRouter";
import { supabase } from "@/src/lib/supabaseClient";

type SidebarProps = {
  forceMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ forceMobile, isOpen, onClose }) => {
  const pathname = usePathname();
  const router = useRouter();
  const drawerEnabled = typeof isOpen === "boolean";
  const drawerOpen = Boolean(isOpen);
  const [showModal, setShowModal] = useState(false);

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
    onClose?.();
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      router.push(`/modules/general/${result.frontModuleId}/${result.variantId}/run`);
    } else {
      router.push("/login?from=/modules/core");
    }
  }, [router, onClose]);

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
    if (!drawerEnabled || !drawerOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [drawerEnabled, drawerOpen, onClose]);

  const items = [
    {
      path: "/modules/core",
      label: "Core Frameworks",
      icon: <Layers size={18} />,
      desc: "Methodologies",
    },
    {
      path: "/modules/general",
      label: "General Modules",
      icon: <Box size={18} />,
      desc: "General Modules",
    },
    {
      path: "/modules/industry",
      label: "Industry Templates",
      icon: <Briefcase size={18} />,
      desc: "Industry Templates",
    },
  ];

  return (
    <>
      {drawerEnabled && (
        <div
          className={`lg:hidden fixed inset-0 z-40 ${
            drawerOpen ? "" : "pointer-events-none"
          }`}
        >
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${
              drawerOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={onClose}
          />
        </div>
      )}
      <aside
        id="app-sidebar"
        className={`${
          drawerEnabled
            ? `fixed inset-y-0 left-0 z-50 w-64 flex flex-col flex-shrink-0 bg-[#0A0F1C] border-r border-[#1F2937] transition-transform duration-200 ${
                drawerOpen ? "translate-x-0" : "-translate-x-full"
              } pointer-events-none lg:pointer-events-auto lg:translate-x-0 lg:static lg:z-20`
            : `${forceMobile ? "flex" : "hidden lg:flex"} w-64 flex flex-col flex-shrink-0 bg-[#0A0F1C] border-r border-[#1F2937] z-20`
        } ${drawerEnabled && drawerOpen ? "pointer-events-auto" : ""}`}
      >
        <div className="px-5 pt-6 pb-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF]/60 mb-2">
                Module Center
              </div>
              <h2 className="text-sm font-semibold text-[#F9FAFB]">Module Center</h2>
            </div>
            {drawerEnabled && (
              <button
                type="button"
                onClick={onClose}
                className="lg:hidden p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#111827] transition-colors"
                aria-label="Close menu"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="mt-4 w-full flex items-center justify-center gap-2 bg-[#1E9FFF] hover:bg-[#4CB2FF] active:scale-[0.98] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all shadow-[0_2px_10px_rgba(30,159,255,0.25)]"
          >
            <Plus size={16} />
            New Task
          </button>
        </div>

        <nav className="flex-1 px-3 space-y-1.5">
          {items.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => {
                  if (drawerEnabled) {
                    onClose?.();
                  }
                }}
                className={`
                  w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 group relative border
                  ${
                    isActive
                      ? "bg-[#111827] border-[#1F2937] shadow-sm"
                      : "bg-transparent border-transparent hover:bg-[#111827]/50"
                  }
                `}
              >
                <div className="flex items-center gap-3 relative z-10">
                  <span
                    className={`transition-colors ${
                      isActive
                        ? "text-[#3B82F6]"
                        : "text-[#6B7280] group-hover:text-[#9CA3AF]"
                    }`}
                  >
                    {item.icon}
                  </span>
                  <div>
                    <div
                      className={`text-sm font-medium leading-none mb-1.5 transition-colors ${
                        isActive
                          ? "text-[#F9FAFB]"
                          : "text-[#9CA3AF] group-hover:text-[#F9FAFB]"
                      }`}
                    >
                      {item.label}
                    </div>
                    <div className="text-[10px] text-[#6B7280] leading-tight font-medium">
                      {item.desc}
                    </div>
                  </div>
                </div>

                {isActive && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#3B82F6]">
                    <ChevronRight size={14} />
                  </div>
                )}

                {/* Active Indicator Bar */}
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#3B82F6] rounded-r-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-[#1F2937]">
          <div className="bg-[#111827]/50 border border-[#1F2937] rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-medium text-emerald-400">
                System Online
              </span>
            </div>
            <p className="text-[10px] text-[#6B7280]">PromptOS v1</p>
          </div>
        </div>
      </aside>

      {/* New Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          />

          {/* Card */}
          <div className="relative z-10 w-full max-w-lg bg-[#0F141C] border border-[#1F2937] rounded-2xl shadow-2xl p-6">
            {/* Close */}
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#6B7280] hover:text-white hover:bg-[#1F2937] transition-colors"
              aria-label="Close"
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-semibold text-white mb-1">What do you want to do?</h2>
            <p className="text-xs text-[#6B7280] mb-5">Describe your task and we'll route it to the right module.</p>

            <form onSubmit={handleRouterSubmit} className="flex flex-col gap-3">
              <input
                autoFocus
                type="text"
                value={routerInput}
                onChange={(e) => setRouterInput(e.target.value)}
                placeholder="e.g. Write a product launch email, Build a project plan..."
                className="w-full rounded-xl border border-[#1F2937] bg-[#111827] px-4 py-3 text-sm text-white placeholder:text-[#4B5563] focus:outline-none focus:ring-2 focus:ring-[#1E9FFF]/40 focus:border-[#1E9FFF]/50 transition-all"
              />

              {/* Hint */}
              {routerStage === "hinting" && routerResult?.hint && (
                <p className="text-xs text-slate-400 pl-1">💡 {routerResult.hint}</p>
              )}

              {/* Error */}
              {routerStage === "error" && routerError && (
                <p className="text-xs text-red-400 pl-1">{routerError}</p>
              )}

              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#1F2937] text-[#9CA3AF] hover:text-white hover:bg-[#1F2937] transition-colors"
                >
                  Cancel
                </button>

                {routerStage === "loading" ? (
                  <button
                    type="button"
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#1E9FFF]/60 text-white cursor-not-allowed"
                  >
                    <Loader2 size={14} className="animate-spin" /> Routing...
                  </button>
                ) : routerStage === "confirmed" ? (
                  <button
                    type="button"
                    disabled
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-500 text-white"
                  >
                    <Check size={14} /> Ready
                  </button>
                ) : routerStage === "hinting" ? (
                  <button
                    type="button"
                    onClick={handleRouterConfirm}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white transition-colors"
                  >
                    Start <ArrowRight size={14} />
                  </button>
                ) : routerStage === "error" ? (
                  <button
                    type="button"
                    onClick={resetRouterError}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white transition-colors"
                  >
                    Try again
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-[#1E9FFF] hover:bg-[#4CB2FF] text-white transition-colors"
                  >
                    Continue <ArrowRight size={14} />
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
