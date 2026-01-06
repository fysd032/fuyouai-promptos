import React from "react";

export interface TabItem {
  id: string;
  label: string;
}

interface TopTabsProps {
  tabs: TabItem[];
  activeId: string;
  onChange: (id: string) => void;
}

const TopTabs: React.FC<TopTabsProps> = ({ tabs, activeId, onChange }) => {
  return (
    <div className="flex items-center gap-1 border-b border-slate-800 mb-6 overflow-x-auto custom-scrollbar pb-1">
      {tabs.map((tab) => {
        const isActive = tab.id === activeId;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`
              relative px-4 py-3 text-sm font-medium transition-all whitespace-nowrap
              ${isActive ? "text-white" : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/30 rounded-t-lg"}
            `}
          >
            {tab.label}
            {isActive && (
              <span className="absolute left-0 right-0 bottom-0 h-0.5 bg-emerald-500 shadow-[0_-2px_6px_rgba(16,185,129,0.3)]" />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default TopTabs;