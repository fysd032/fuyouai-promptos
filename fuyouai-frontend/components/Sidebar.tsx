import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { menuItems, searchIndex } from '../data';
import { 
  X,
  Search,
  Zap,
  Grid
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isPro: boolean;
  onTogglePro: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, isPro, onTogglePro }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredIndex = searchTerm 
    ? searchIndex.filter(item => 
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        item.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : [];

  const groups = ["任务框架", "通用模块", "行业模板", "工具", "帮助"];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 z-50 h-screen w-64 bg-slate-950/95 border-r border-slate-800 flex flex-col transition-transform duration-300 ease-in-out
        lg:translate-x-0 lg:static backdrop-blur-xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="text-sm font-semibold text-white tracking-wide">FuyouAI · Prompt OS</div>
          <button onClick={onClose} className="lg:hidden text-slate-400">
            <X size={20} />
          </button>
        </div>

        {/* Search (Mobile Only - Desktop is in Header) */}
        <div className="lg:hidden p-4 pb-0">
           <div className="relative">
             <Search className="absolute left-3 top-2.5 text-slate-500" size={14} />
             <input 
               type="text" 
               placeholder="搜索..."
               className="w-full bg-slate-900 border border-slate-700 rounded-lg py-2 pl-9 pr-3 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
             />
           </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {groups.map((group) => (
            <div key={group}>
              <div className="px-2 mb-2 text-[10px] uppercase tracking-[0.18em] text-slate-500 font-bold">
                {group}
              </div>
              <div className="space-y-0.5">
                {/* Specific Menu Items */}
                {menuItems
                  .filter((item) => item.group === group)
                  .map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <Link
                        key={item.id}
                        to={item.path}
                        onClick={onClose}
                        className={`
                          block px-2 py-1.5 rounded-md text-xs font-medium transition-colors truncate
                          ${isActive 
                            ? 'bg-brand-600 text-white' 
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}
                        `}
                      >
                        {item.title}
                      </Link>
                    );
                  })}
                  
                  {/* Special Button for Modules Group */}
                  {group === "通用模块" && (
                    <button 
                      onClick={() => {
                        navigate("/app/modules");
                        onClose();
                      }}
                      className="w-full text-left px-2 py-1.5 rounded-md text-xs font-medium text-brand-400 hover:bg-slate-800 hover:text-brand-300 transition-colors flex items-center gap-2 mt-2 group border border-dashed border-slate-800 hover:border-brand-500/30"
                    >
                      <Grid size={12} className="group-hover:text-brand-300" />
                      工作模块中心 (全部)
                    </button>
                  )}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer / User State */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-medium text-slate-300">
              {isPro ? 'Pro Member' : 'Free Trial'}
            </div>
            <button 
              onClick={onTogglePro}
              className="text-[10px] text-sky-400 hover:text-sky-300 underline"
            >
              Switch
            </button>
          </div>
          
          {!isPro && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-md p-2">
              <div className="flex items-center gap-1.5 text-amber-500 font-semibold text-[10px] mb-1">
                <Zap size={10} fill="currentColor" />
                Trial Active
              </div>
              <div className="w-full bg-amber-900/40 h-1 rounded-full overflow-hidden">
                <div className="bg-amber-500 h-full w-3/4"></div>
              </div>
              <div className="text-[10px] text-amber-500/80 mt-1 text-right">30 Days Left</div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
