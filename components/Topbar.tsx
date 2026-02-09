"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, LayoutDashboard } from "lucide-react";
import { supabase } from "../src/lib/supabaseClient";

const Topbar: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch user email from Supabase auth
  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setEmail(data.user.email);
      }
    };
    getUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setEmail(session?.user?.email ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  const initials = email
    ? email.substring(0, 2).toUpperCase()
    : "?";

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-end px-6 border-b border-white/[0.06] bg-transparent relative z-30">
      {/* Right: actions */}
      <div className="flex items-center gap-1">
        <Link
          href="/modules"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium text-[#9CA3AF] hover:text-white transition-colors"
        >
          <LayoutDashboard size={14} />
          Studio
        </Link>

        <span className="text-[#4B5563] text-xs select-none">&middot;</span>

        <Link
          href="/"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[13px] font-medium text-[#9CA3AF] hover:text-white transition-colors"
        >
          <Home size={14} />
          Home
        </Link>

        <span className="text-[#4B5563] text-xs select-none">&middot;</span>

        {email && (
          <span className="text-[13px] text-[#9CA3AF] px-2 truncate max-w-[200px] hidden sm:inline">
            {email}
          </span>
        )}

        {/* Avatar + Dropdown */}
        <div className="relative" ref={menuRef}>
          <div
            onClick={() => setMenuOpen((prev) => !prev)}
            className="ml-2 h-8 w-8 rounded-full bg-gradient-to-br from-[#3B82F6] to-[#6366F1] flex items-center justify-center text-[11px] font-bold text-white ring-2 ring-[#1F2937] cursor-pointer hover:ring-[#3B82F6]/50 transition-all flex-shrink-0"
          >
            {initials}
          </div>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-lg border border-white/[0.08] bg-[#111827] shadow-xl py-1 z-50">
              {email && (
                <div className="px-4 py-2.5 text-[13px] text-[#9CA3AF] border-b border-white/[0.06] truncate">
                  {email}
                </div>
              )}
              <Link
                href="/account/subscription"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-[14px] font-medium text-white hover:bg-white/[0.04] transition-colors"
              >
                Subscription
              </Link>
              <Link
                href="/account/billing"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-[14px] font-medium text-white hover:bg-white/[0.04] transition-colors"
              >
                Billing
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="block w-full text-left px-4 py-2.5 text-[14px] font-medium text-white hover:bg-white/[0.04] transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
