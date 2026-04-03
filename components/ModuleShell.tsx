"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useLocale } from "next-intl";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { ErrorBoundary } from "@/src/components/ErrorBoundary";

const ModuleShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const locale = useLocale();
  const isZh = locale === "zh";
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (!drawerOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawerOpen]);

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-[#0B0F15] text-[#F9FAFB]">
      {/* ============ Desktop Sidebar ============ */}
      <aside className="hidden lg:flex w-[280px] flex-shrink-0 flex-col border-r border-white/[0.06] bg-[#0A0E18]/80 backdrop-blur-xl">
        <Sidebar />
      </aside>

      {/* ============ Mobile Drawer ============ */}
      <div
        className={`lg:hidden fixed inset-0 z-[80] ${
          drawerOpen ? "" : "pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
            drawerOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setDrawerOpen(false)}
        />
        {/* Panel */}
        <div
          className={`absolute left-0 top-0 h-full w-[280px] max-w-[85vw] bg-[#0A0E18] border-r border-[#1F2937] flex flex-col transition-transform duration-200 ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#1F2937] flex-shrink-0">
            <span className="text-sm font-semibold text-[#F9FAFB]">{isZh ? "菜单" : "Menu"}</span>
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#111827] transition-colors"
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </div>
      </div>

      {/* ============ Right: Topbar + Content ============ */}
      <div className="flex-1 min-w-0 flex flex-col relative lg:zoom-110">
        {/* Background layers */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          {/* Base gradient */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#0B0F15_0%,#0F141C_40%,#111827_100%)]" />
          {/* Radial glow top-right */}
          <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-[#3B82F6]/[0.06] rounded-full blur-[120px]" />
          {/* Radial glow bottom-left */}
          <div className="absolute bottom-[-10%] left-[10%] w-[400px] h-[400px] bg-[#06B6D4]/[0.04] rounded-full blur-[100px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 modules-grid-bg opacity-[0.035]" />
        </div>

        {/* Mobile hamburger + Topbar */}
        <div className="relative z-30 flex items-center">
          <button
            className="lg:hidden p-3 ml-2 text-[#9CA3AF] hover:text-white transition-colors"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <Topbar />
          </div>
        </div>

        {/* Main scrollable content */}
        <main className="relative z-10 flex-1 min-h-0 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="w-full px-3 sm:px-6 lg:px-8 2xl:px-10 py-3 sm:py-6">
            <ErrorBoundary>
              {children}
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ModuleShell;
