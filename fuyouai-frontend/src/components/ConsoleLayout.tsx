import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import { ErrorBoundary } from "./ErrorBoundary";
import { Search, LogOut, Layout, Box, Briefcase, Menu, X } from "lucide-react";

export const ConsoleLayout: React.FC = () => {
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 路由切换自动关闭抽屉（手机体验更好）
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Map current path to tab highlight for top mobile/tablet nav
  const getActiveTab = () => {
    if (location.pathname.includes("core")) return "core";
    if (location.pathname.includes("general")) return "general";
    if (location.pathname.includes("industry")) return "industry";
    if (location.pathname.includes("run")) return "run";
    return "core";
  };

  const activeTab = getActiveTab();

  return (
    <div className="h-screen flex flex-col bg-[#0A0F1C] text-[#F9FAFB] font-sans selection:bg-[#3B82F6]/30 overflow-hidden">
      {/* --- 1. Top Navigation Bar --- */}
      <header className="h-[64px] bg-[#0A0F1C]/90 backdrop-blur-md border-b border-[#1F2937] flex items-center justify-between px-6 flex-shrink-0 z-50">
        {/* Left: Mobile menu button + Brand / Logo */}
        <div className="flex items-center gap-3 w-auto md:w-[240px]">
          {/* Mobile: open drawer */}
          <button
            className="md:hidden p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#111827] transition-colors"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
            title="Menu"
          >
            <Menu size={18} />
          </button>

          {/* Brand / Logo */}
          <Link to="/modules" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center text-slate-100 transition-transform group-hover:scale-105">
              <svg
                width="28"
                height="28"
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M20 20H80C88.2843 20 95 26.7157 95 35V40C95 48.2843 88.2843 55 80 55H60L55 60H75C83.2843 60 90 66.7157 90 75V80C90 88.2843 83.2843 95 75 95H40L35 100H20L25 20Z"
                  fill="url(#logo_gradient)"
                />
                <defs>
                  <linearGradient
                    id="logo_gradient"
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
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-sm font-bold text-[#F9FAFB] tracking-tight">
                FUYOU
              </span>
              <span className="text-[10px] text-[#9CA3AF] font-medium tracking-wider mt-0.5">
                PROMPT OS
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Mobile/Tablet Nav */}
        <nav className="flex items-center bg-[#111827] rounded-full p-1 border border-[#1F2937] overflow-x-auto whitespace-nowrap max-w-[55vw] md:max-w-none">
          <Link
            to="/modules/core"
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === "core"
                ? "bg-[#1F2937] text-white shadow-sm"
                : "text-[#9CA3AF] hover:text-white"
            }`}
          >
            <Layout size={12} /> 核心框架
          </Link>
          <Link
            to="/modules/general"
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === "general"
                ? "bg-[#1F2937] text-white shadow-sm"
                : "text-[#9CA3AF] hover:text-white"
            }`}
          >
            <Box size={12} /> 通用模块
          </Link>
          <Link
            to="/modules/industry"
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-2 ${
              activeTab === "industry"
                ? "bg-[#1F2937] text-white shadow-sm"
                : "text-[#9CA3AF] hover:text-white"
            }`}
          >
            <Briefcase size={12} /> 行业模板
          </Link>
        </nav>

        {/* Right: User & Exit */}
        <div className="flex items-center gap-3 md:gap-4 w-auto md:w-[240px] justify-end">
          <button
            className="text-[#9CA3AF] hover:text-white transition-colors"
            title="Search"
          >
            <Search size={18} />
          </button>

          <div className="h-4 w-[1px] bg-[#1F2937] mx-2"></div>

          {/* Explicit Exit to Landing Page */}
          <Link
            to="/"
            className="text-[#9CA3AF] hover:text-[#3B82F6] flex items-center gap-1.5 text-xs font-medium transition-colors mr-2"
            title="Return to Website"
          >
            <LogOut size={14} />
            <span className="hidden lg:inline">返回官网</span>
          </Link>

          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#1F2937] to-[#374151] border border-[#374151] flex items-center justify-center text-xs font-medium text-white ring-2 ring-transparent hover:ring-[#3B82F6]/50 transition-all cursor-pointer">
            JD
          </div>
        </div>
      </header>

      {/* --- 2. Main Workspace --- */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Mobile Sidebar Drawer */}
        <div
          className={`md:hidden fixed inset-0 z-[70] ${
            sidebarOpen ? "" : "pointer-events-none"
          }`}
        >
          {/* Backdrop */}
          <div
            className={`absolute inset-0 bg-black/60 transition-opacity duration-200 ${
              sidebarOpen ? "opacity-100" : "opacity-0"
            }`}
            onClick={() => setSidebarOpen(false)}
          />

          {/* Drawer Panel */}
          <div
            className={`absolute left-0 top-0 h-full w-[300px] max-w-[85vw] bg-[#0A0F1C] border-r border-[#1F2937]
            transition-transform duration-200 ${
              sidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="h-[64px] px-4 flex items-center justify-between border-b border-[#1F2937]">
              <div className="text-sm font-semibold text-[#F9FAFB]">菜单</div>
              <button
                className="p-2 rounded-lg text-[#9CA3AF] hover:text-white hover:bg-[#111827] transition-colors"
                onClick={() => setSidebarOpen(false)}
                aria-label="Close sidebar"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="h-[calc(100%-64px)] overflow-y-auto">
              <Sidebar forceMobile />
            </div>
          </div>
        </div>

        {/* Desktop Sidebar */}
        <div className="hidden md:block flex-shrink-0">
          <Sidebar />
        </div>

        {/* Right Content Area */}
        <main className="flex-1 min-w-0 bg-[#0A0F1C] relative overflow-y-auto custom-scrollbar">
          {/* Background Ambient Effects */}
          <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10 pointer-events-none z-0"></div>
          <div className="fixed top-[-10%] right-[-5%] w-[500px] h-[500px] bg-[#3B82F6]/5 rounded-full blur-[100px] pointer-events-none z-0"></div>

          <div className="relative z-10 p-6 md:p-8 max-w-[1600px] mx-auto min-h-full flex flex-col">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
};
