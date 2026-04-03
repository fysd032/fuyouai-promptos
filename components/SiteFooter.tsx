"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export const SiteFooter: React.FC = () => {
  const t = useTranslations("Footer");

  return (
    <footer className="border-t border-white/[0.06] bg-[#0B0F15]">
      <div className="max-w-7xl mx-auto px-6 py-10 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="text-sm text-slate-500">
          {t("copyright", { year: new Date().getFullYear() })}
        </div>

        <div className="flex flex-wrap items-center gap-5 text-sm text-slate-400">
          <Link href="/pricing" className="hover:text-white transition-colors">
            {t("pricing")}
          </Link>
          <Link href="/privacy" className="hover:text-white transition-colors">
            {t("privacy")}
          </Link>
          <Link href="/terms" className="hover:text-white transition-colors">
            {t("terms")}
          </Link>
          <Link href="/refund" className="hover:text-white transition-colors">
            {t("refund")}
          </Link>
          <Link href="/about" className="hover:text-white transition-colors">
            {t("about")}
          </Link>
        </div>
      </div>
    </footer>
  );
};
