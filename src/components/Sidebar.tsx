"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Layers, Box, Briefcase, ChevronRight, X } from "lucide-react";

type SidebarProps = {
  forceMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
};

const Sidebar: React.FC<SidebarProps> = ({ forceMobile, isOpen, onClose }) => {
  const pathname = usePathname();
  const drawerEnabled = typeof isOpen === "boolean";
  const drawerOpen = Boolean(isOpen);

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
    </>
  );
};

export default Sidebar;
