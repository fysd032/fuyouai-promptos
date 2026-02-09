"use client";

import React from "react";
import Link from "next/link";

export const SiteFooter: React.FC = () => {
  return (
    <footer className="border-t border-white/[0.06] bg-[#0B0F15]">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-500">
          © {new Date().getFullYear()} FuyouAI. All rights reserved.
        </div>

        <div className="flex flex-wrap items-center gap-5 text-sm text-slate-400">
          <Link href="/pricing" className="hover:text-white transition-colors">
            Pricing
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            Terms
          </Link>
          <Link href="/refund" className="hover:text-white transition-colors">
            Refund
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            About
          </Link>
        </div>
      </div>
    </footer>
  );
};
