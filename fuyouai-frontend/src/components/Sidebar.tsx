import React from "react";
import { NavLink } from "react-router-dom";
import { Layers, Box, Briefcase, ChevronRight } from "lucide-react";

type SidebarProps = {
  forceMobile?: boolean; // 手机抽屉里强制显示
};

const Sidebar: React.FC<SidebarProps> = ({ forceMobile }) => {
  const items = [
    {
      path: "/modules/core",
      label: "核心框架",
      icon: <Layers size={18} />,
      desc: "Methodologies",
    },
    {
      path: "/modules/general",
      label: "通用模块",
      icon: <Box size={18} />,
      desc: "General Modules",
    },
    {
      path: "/modules/industry",
      label: "行业模板",
      icon: <Briefcase size={18} />,
      desc: "Industry Templates",
    },
  ];

  return (
    <aside
      className={`${
        forceMobile ? "flex" : "hidden md:flex"
      } w-64 flex-shrink-0 bg-[#0A0F1C] border-r border-[#1F2937] flex-col z-20`}
    >
      <div className="px-5 pt-8 pb-4">
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9CA3AF]/60 mb-2">
          Module Center
        </div>
        <h2 className="text-sm font-semibold text-[#F9FAFB]">模块中心</h2>
      </div>

      <nav className="flex-1 px-3 space-y-1.5">
        {items.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `
              w-full text-left px-4 py-3.5 rounded-xl transition-all duration-200 group relative border
              ${
                isActive
                  ? "bg-[#111827] border-[#1F2937] shadow-sm"
                  : "bg-transparent border-transparent hover:bg-[#111827]/50"
              }
            `}
          >
            {({ isActive }) => (
              <>
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
              </>
            )}
          </NavLink>
        ))}
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
          <p className="text-[10px] text-[#6B7280]">PromptOS v3.1</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
