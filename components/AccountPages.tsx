"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { SiteFooter } from "./SiteFooter";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useLocale } from "next-intl";
import { supabase } from "../src/lib/supabaseClient";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ||
  (typeof window !== "undefined" ? window.location.origin : "");

const PageWrapper: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="min-h-screen bg-[linear-gradient(180deg,#0B0F15_0%,#0F141C_40%,#111827_100%)] text-white font-sans">
    <main className="max-w-2xl mx-auto px-6 py-20">
      <Link
        href="/modules/core"
        className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8"
      >
        <ArrowLeft size={16} />
        Back to Modules
      </Link>
      <h1 className="text-3xl font-semibold text-white mb-6">{title}</h1>
      {children}
    </main>
    <SiteFooter />
  </div>
);

// Manage Billing - 自动跳转到 Creem 客户门户
export const ManageBilling: React.FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchPortalUrl = async () => {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        const res = await fetch(`${API_BASE}/api/portal`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        if (cancelled) return;

        // 401 → 跳登录页
        if (res.status === 401) {
          const from = pathname || "/";
          router.push(`/${locale}/login?from=${encodeURIComponent(from)}`);
          return;
        }

        const rawText = await res.text();
        const data = (() => {
          try {
            return rawText ? JSON.parse(rawText) : {};
          } catch {
            return {};
          }
        })();

        if (!res.ok || !data.ok) {
          setErrorCode(data?.error || `http_${res.status}`);
          setError("Failed to load billing portal.");
          setLoading(false);
          return;
        }

        if (res.ok && data.url) {
          window.location.assign(data.url);
          return;
        }

        setErrorCode("no_portal_url");
        setError("No portal URL returned.");
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setErrorCode("network_error");
          setError(e?.message || "Network error.");
          setLoading(false);
        }
      }
    };

    fetchPortalUrl();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  if (loading) {
    return (
      <PageWrapper title="Manage Billing">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          <span className="text-slate-400">Redirecting to billing portal...</span>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper title="Manage Billing">
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
        {error && (
          <div className="text-red-400 mb-4">{error}</div>
        )}
        <p className="text-slate-400 mb-4">
          Unable to load billing portal. Please try again later.
        </p>
        <Link
          href="/pricing"
          className="text-sm text-brand-400 hover:text-brand-300"
        >
          View pricing plans
        </Link>
        <div className="mt-3">
          <Link
            href="/account/subscription"
            className="text-sm text-brand-400 hover:text-brand-300"
          >
            Back to Subscription
          </Link>
        </div>
      </div>
    </PageWrapper>
  );
};

// Subscription - 展示当前订阅状态
export const Subscription: React.FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const [portalErrorCode, setPortalErrorCode] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<{
    plan: string;
    status: string;
    trialEnd?: string;
    cancelAtPeriodEnd?: boolean;
    currentPeriodEnd?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSubscription = async () => {
      try {
        const session = await supabase.auth.getSession();
        const token = session.data.session?.access_token;

        const res = await fetch(`${API_BASE}/api/subscription`, {
          method: "GET",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          credentials: "include",
        });

        if (cancelled) return;

        // 401 → 跳登录页
        if (res.status === 401) {
          const from = pathname || "/";
          router.push(`/${locale}/login?from=${encodeURIComponent(from)}`);
          return;
        }

        const data = await res.json().catch(() => ({}));

        if (!res.ok || !data.ok) {
          setError(data.error || "Failed to load subscription.");
          setLoading(false);
          return;
        }

        setSubscription(data.subscription);
        setLoading(false);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Network error.");
          setLoading(false);
        }
      }
    };

    fetchSubscription();

    return () => {
      cancelled = true;
    };
  }, [router, pathname]);

  const openBillingPortal = async () => {
    setPortalLoading(true);
    setPortalError(null);
    setPortalErrorCode(null);

    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;

      const res = await fetch(`${API_BASE}/api/portal`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: "include",
      });

      if (res.status === 401) {
        setPortalLoading(false);
        const from = pathname || "/";
        router.push(`/${locale}/login?from=${encodeURIComponent(from)}`);
        return;
      }

      const rawText = await res.text();
      const data = (() => {
        try {
          return rawText ? JSON.parse(rawText) : {};
        } catch {
          return {};
        }
      })();

      if (!res.ok) {
        const code = data?.error || `http_${res.status}`;
        setPortalErrorCode(code);
        setPortalError(
          code === "no_customer"
            ? "You do not have a billing account to manage."
            : "Unable to open billing portal. Please try again."
        );
        return;
      }

      if (res.ok && data.url) {
        window.location.assign(data.url);
        return;
      }

      setPortalErrorCode("no_portal_url");
      setPortalError("Unable to open billing portal. Please try again.");
    } catch {
      setPortalErrorCode("network_error");
      setPortalError("Unable to open billing portal. Please try again.");
    } finally {
      setPortalLoading(false);
    }
  };

  const formatStatus = (status: string) => {
    const map: Record<string, { label: string; color: string }> = {
      active: { label: "Active", color: "text-green-400" },
      canceling: { label: "Canceling", color: "text-yellow-400" },
      trialing: { label: "Trial", color: "text-blue-400" },
      canceled: { label: "Canceled", color: "text-red-400" },
      expired: { label: "Expired", color: "text-slate-400" },
      free: { label: "Free", color: "text-slate-400" },
    };
    return map[status] || { label: status, color: "text-slate-400" };
  };

  const formatPlan = (plan: string) => {
    const map: Record<string, string> = {
      starter: "Basic ($29/mo)",
      basic: "Basic ($29/mo)",
      pro: "Pro ($69/mo)",
      free: "Free",
    };
    return map[plan] || plan;
  };

  const formatNumericDate = (dateString?: string | null) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  if (loading) {
    return (
      <PageWrapper title="Subscription">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          <span className="text-slate-400">Loading subscription...</span>
        </div>
      </PageWrapper>
    );
  }

  if (error) {
    return (
      <PageWrapper title="Subscription">
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
          <div className="text-red-400 mb-4">{error}</div>
            <Link
              href="/pricing"
              className="text-sm text-brand-400 hover:text-brand-300"
            >
              View pricing plans
            </Link>
        </div>
      </PageWrapper>
    );
  }

  const plan = subscription?.plan || "free";
  const status = subscription?.status || "free";
  const statusInfo = formatStatus(status);
  const showUpgrade = plan === "free" || status === "canceled" || status === "expired";

  return (
    <PageWrapper title="Subscription">
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/40 p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-400">Current Plan</span>
          <span className="text-white font-medium">{formatPlan(plan)}</span>
        </div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-slate-400">Status</span>
          <span className={`font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
        </div>
        {(status === "active" || status === "canceling") &&
          subscription?.currentPeriodEnd &&
          new Date(subscription.currentPeriodEnd).getTime() > Date.now() && (
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">Current period ends</span>
              <span className={`font-medium ${status === "canceling" ? "text-yellow-400" : "text-white"}`}>
                {formatNumericDate(subscription.currentPeriodEnd)}
              </span>
            </div>
          )}
        {subscription?.trialEnd && subscription.status === "trialing" && (() => {
          const end = new Date(subscription.trialEnd);
          const daysLeft = Math.max(0, Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
          return (
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400">Trial ends</span>
              <span className="text-blue-400 font-medium">
                {formatNumericDate(subscription.trialEnd)}
                <span className="ml-2 text-sm text-slate-400">({daysLeft} day{daysLeft !== 1 ? "s" : ""} left)</span>
              </span>
            </div>
          );
        })()}
        {status === "canceled" && (
          <div className="mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <p className="text-sm text-yellow-400">
              Your subscription has been canceled. You can continue using your current plan until the end of the billing period.
            </p>
          </div>
        )}
        <p className="text-sm text-slate-500 mt-4 pt-4 border-t border-slate-800">
          You can manage your subscription in the billing portal.
        </p>

        <div className="pt-4 flex items-center gap-4">
          {subscription && status === "active" && (
            <button
              type="button"
              onClick={openBillingPortal}
              disabled={portalLoading}
              className="inline-flex items-center justify-center rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {portalLoading ? "Opening..." : "Manage billing"}
            </button>
          )}
          {showUpgrade && (
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
            >
              Upgrade
            </Link>
          )}
        </div>
        {portalError && (
          <div className="mt-4 rounded-lg border border-slate-800/60 bg-slate-900/40 p-3 text-sm text-slate-300">
            <div className="text-red-400 mb-2">{portalError}</div>
            {portalErrorCode === "no_customer" && (
              <Link href="/pricing" className="text-brand-400 hover:text-brand-300">
                View pricing
              </Link>
            )}
          </div>
        )}
      </div>
    </PageWrapper>
  );
};
