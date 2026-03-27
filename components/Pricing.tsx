"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { SiteFooter } from "./SiteFooter";
import { supabase } from "../src/lib/supabaseClient";
import {
  useSubscription,
  formatExpiryDate,
} from "../src/context/SubscriptionContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "";

export const Pricing: React.FC = () => {
  const t = useTranslations("Pricing");
  const router = useRouter();
  const [loading, setLoading] = useState<"basic" | "pro" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { subscription, loading: subLoading, isAuthenticated } =
    useSubscription();

  // ✅ 改进的状态判断逻辑
  const currentPlan = subscription?.plan || "free";
  const status = subscription?.status || "inactive";
  const isCanceling = status === "canceling";
  const isActive = status === "active" || status === "canceling"; // canceling 也算 active

  const isBasicActive = isActive && currentPlan === "basic";
  const isProActive = isActive && currentPlan === "pro";

  const handleCheckout = async (plan: "basic" | "pro") => {
    setLoading(plan);
    setError(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const base = API_BASE; // 可以为空：同域 /api/checkout
      const url = `${base}/api/checkout`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
        body: JSON.stringify({ plan }),
      });

      const data = await res.json().catch(() => ({} as any));

      if (res.status === 401) {
        // 未登录，跳转登录页（Next 方式：用 query 带回跳地址）
        router.push(`/login?from=${encodeURIComponent("/pricing")}`);
        return;
      }

      if (!res.ok || !data.ok) {
        setError(data.error || "Failed to start checkout.");
        return;
      }

      // Redirect to Creem checkout.
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (e: any) {
      setError(e?.message || "Network error.");
    } finally {
      setLoading(null);
    }
  };

  // ✅ 格式化状态显示文本
  const getStatusText = () => {
    if (!subscription) return null;

    if (isCanceling && subscription.current_period_end) {
      return t("activeUntil", { date: formatExpiryDate(subscription.current_period_end) });
    }

    if (isActive) return t("statusActive");
    return t("statusInactive");
  };

  // ✅ 获取状态颜色
  const getStatusColor = () => {
    if (isCanceling) return "text-yellow-400"; // 取消中用黄色
    if (isActive) return "text-green-400";
    return "text-slate-400";
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0B0F15_0%,#0F141C_40%,#111827_100%)] text-white font-sans">
      <main className="max-w-5xl mx-auto px-6 py-20">
        <div className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-semibold text-white">
            {t("title")}
          </h1>
          <p className="mt-3 text-slate-400">
            {t("subtitle")}
          </p>
        </div>

        {/* ✅ 当前订阅状态显示 */}
        {!subLoading && isAuthenticated && subscription && (
          <div className="mb-6 rounded-lg bg-slate-800/50 border border-slate-700/50 px-4 py-3 text-sm text-slate-300">
            <div className="flex items-center gap-2 flex-wrap">
              <span>{t("currentPlan")}</span>
              <span
                className={`font-medium ${
                  isActive ? "text-green-400" : "text-slate-400"
                }`}
              >
                {currentPlan === "basic"
                  ? t("planBasic")
                  : currentPlan === "pro"
                  ? t("planPro")
                  : t("planFree")}
              </span>
              <span className="text-slate-500">|</span>
              <span className={getStatusColor()}>{getStatusText()}</span>

              {isCanceling && (
                <>
                  <span className="text-slate-500">|</span>
                  <span className="text-yellow-400 text-xs">
                    {t("renewalCanceled")}
                  </span>
                </>
              )}
            </div>

            {isCanceling && subscription.current_period_end && (
              <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-400">
                {t("accessUntilNote", { date: formatExpiryDate(subscription.current_period_end) })}
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg bg-red-900/30 border border-red-500/50 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
            <div className="inline-flex items-center rounded-full border border-brand-500/40 bg-brand-900/30 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-brand-200">
              {t("basicBadge")}
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">{t("basicName")}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {t("basicDesc")}
            </p>

            <div className="mt-6 flex items-end gap-2">
              <span className="text-5xl font-semibold text-white">{t("basicPrice")}</span>
              <span className="text-sm text-slate-400 mb-1">{t("basicPeriod")}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {t("basicNote")}
            </p>

            <ul className="mt-6 space-y-2 text-sm text-slate-300">
              <li>{t("basicFeature1")}</li>
              <li>{t("basicFeature2")}</li>
              <li>{t("basicFeature3")}</li>
              <li>{t("basicFeature4")}</li>
            </ul>

            <button
              type="button"
              onClick={() => handleCheckout("basic")}
              disabled={loading === "basic" || isBasicActive || isProActive}
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#1E9FFF] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#4CB2FF] shadow-[0_4px_14px_rgba(30,159,255,0.28)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "basic"
                ? t("basicBtnProcessing")
                : isBasicActive
                ? isCanceling
                  ? t("basicBtnActiveUntil")
                  : t("basicBtnCurrent")
                : isProActive
                ? t("basicBtnIncluded")
                : t("basicBtnGet")}
            </button>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-slate-700/70 bg-slate-900/40 p-6 ring-1 ring-brand-500/30">
            <div className="inline-flex items-center rounded-full border border-brand-500/40 bg-brand-900/30 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-brand-200">
              {t("proBadge")}
            </div>
            <h2 className="mt-4 text-2xl font-semibold text-white">{t("proName")}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {t("proDesc")}
            </p>

            <div className="mt-6 flex items-end gap-2">
              <span className="text-5xl font-semibold text-white">{t("proPrice")}</span>
              <span className="text-sm text-slate-400 mb-1">{t("proPeriod")}</span>
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {t("proNote")}
            </p>

            <ul className="mt-6 space-y-2 text-sm text-slate-300">
              <li>{t("proFeature1")}</li>
              <li>{t("proFeature2")}</li>
              <li>{t("proFeature3")}</li>
              <li>{t("proFeature4")}</li>
            </ul>

            <button
              type="button"
              onClick={() => handleCheckout("pro")}
              disabled={loading === "pro" || isProActive}
              className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#1E9FFF] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#4CB2FF] shadow-[0_4px_14px_rgba(30,159,255,0.28)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading === "pro"
                ? t("proBtnProcessing")
                : isProActive
                ? isCanceling
                  ? t("proBtnActiveUntil")
                  : t("proBtnCurrent")
                : isBasicActive
                ? t("proBtnUpgrade")
                : t("proBtnGet")}
            </button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-800/60 bg-slate-900/40 p-5 text-xs text-slate-500 space-y-2">
          <ul className="space-y-1">
            <li>{t("footerLine1")}</li>
            <li>{t("footerLine2")}</li>
            <li>{t("footerLine3")}</li>
          </ul>
          <p className="pt-2 border-t border-slate-800/60">
            {t("footerDisclaimer")}
          </p>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};
