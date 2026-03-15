"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Box, Building2, ChevronRight, History } from "lucide-react";

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
  {
    path: "/modules/industry",
    label: "Industry Templates",
    desc: "Industry Templates",
    icon: Building2,
  },
  {
    path: "/modules/history",
    label: "Session History",
    desc: "Past sessions",
    icon: History,
  },
];

const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
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

      {/* ====== Section title ====== */}
      <div className="px-5 pt-3 pb-3">
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
  );
};

export default Sidebar;
