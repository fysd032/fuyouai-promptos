"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SiteFooter } from "./SiteFooter";
import { CheckCircle, RefreshCw, ArrowRight } from "lucide-react";

export const CheckoutSuccess: React.FC = () => {
  const searchParams = useSearchParams();
  const sessionId = searchParams?.get("session_id") ?? null;
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    // 刷新页面以检查订阅状态
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0B0F15_0%,#0F141C_40%,#111827_100%)] text-white font-sans">
      <main className="max-w-2xl mx-auto px-6 py-20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-6">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-semibold text-white">
            Payment Successful
          </h1>

          <p className="mt-4 text-slate-400 leading-relaxed">
            Thank you for your purchase. Your subscription is being activated.
          </p>

          <p className="mt-3 text-sm text-slate-500">
            You can manage your subscription anytime via <strong className="text-slate-300">Manage billing</strong> in your account menu.
          </p>

          <div className="mt-8 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
            <div className="flex items-center justify-center gap-3 text-slate-300">
              <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse" />
              <span>Activating your subscription...</span>
            </div>

            <p className="mt-4 text-sm text-slate-500">
              This usually takes a few seconds. If your subscription is not active yet,
              please click the refresh button below.
            </p>

            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Refreshing..." : "Refresh Status"}
            </button>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/modules/core"
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/"
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Back to Home
            </Link>
          </div>

          {sessionId && (
            <p className="mt-8 text-xs text-slate-600">
              Session: {sessionId}
            </p>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};
