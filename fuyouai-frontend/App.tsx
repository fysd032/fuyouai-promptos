import React from "react";
import { HashRouter as Router, Routes, Route, Navigate, Outlet, Link } from "react-router-dom";
import Sidebar from "./src/components/Sidebar";
import CoreFrameworkPage from "./src/pages/CoreFrameworkPage";
import UniversalModulesPage from "./src/pages/UniversalModulesPage";
import IndustryTemplatesPage from "./src/pages/IndustryTemplatesPage";
import { LogOut } from 'lucide-react';
import { Landing } from './components/Landing';
import { Login } from './components/Login';

const DashboardLayout: React.FC = () => {
  return (
    <div className="h-screen flex flex-col bg-[#0A0F1C] text-[#F9FAFB] font-sans selection:bg-[#3B82F6]/30">
      
      <header className="h-[64px] border-b border-[#1F2937] bg-[#0A0F1C]/90 backdrop-blur flex items-center justify-between px-6 flex-shrink-0 z-50">
        <div className="flex items-center gap-3">
          <Link to="/modules" className="flex items-center justify-center text-slate-100">
             <svg width="28" height="28" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M20 20H80C88.2843 20 95 26.7157 95 35V40C95 48.2843 88.2843 55 80 55H60L55 60H75C83.2843 60 90 66.7157 90 75V80C90 88.2843 83.2843 95 75 95H40L35 100H20L25 20Z" fill="url(#logo_gradient)"/>
                <defs>
                   <linearGradient id="logo_gradient" x1="20" y1="20" x2="95" y2="100" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#3B82F6"/>
                      <stop offset="1" stopColor="#6366F1"/>
                   </linearGradient>
                </defs>
             </svg>
          </Link>
          <div className="flex flex-col leading-none">
            <span className="text-sm font-bold text-[#F9FAFB] tracking-wide">FUYOU</span>
            <span className="text-[9px] text-[#9CA3AF] font-bold tracking-wider">PROMPT OS</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/" className="text-[#9CA3AF] hover:text-[#3B82F6] flex items-center gap-1.5 text-xs font-medium transition-colors">
             <LogOut size={14} />
             <span className="hidden lg:inline">返回官网</span>
          </Link>
          <div className="h-8 w-8 rounded-full bg-[#1F2937] border border-[#374151] flex items-center justify-center text-xs font-medium text-white hover:border-[#6B7280] cursor-pointer transition-colors">
            JD
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Sidebar />
        <main className="flex-1 min-w-0 bg-[#0A0F1C] relative overflow-y-auto custom-scrollbar">
          <div className="p-6 md:p-8 max-w-[1600px] mx-auto h-full flex flex-col">
             <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/modules" element={<DashboardLayout />}>
           <Route index element={<Navigate to="core" replace />} />
           <Route path="core" element={<CoreFrameworkPage />} />
           <Route path="general" element={<UniversalModulesPage />} />
           <Route path="industry" element={<IndustryTemplatesPage />} />
        </Route>
        
        <Route path="/app/*" element={<Navigate to="/modules" replace />} />
        
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}