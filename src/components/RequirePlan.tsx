// src/components/RequirePlan.tsx
// Permission gate component: shows upgrade prompt when plan requirement is not met
"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Sparkles, LogIn } from "lucide-react";
import { useLocale } from "next-intl";
import { useSubscription, isActivePlan } from "../context/SubscriptionContext";

interface RequirePlanProps {
  plan: "basic" | "pro";
  children: React.ReactNode;
  // Optional: custom prompt text
  title?: string;
  description?: string;
}

export const RequirePlan: React.FC<RequirePlanProps> = ({
  plan,
  children,
  title,
  description,
}) => {
  const pathname = usePathname();
  const locale = useLocale();
  const { subscription, loading, isAuthenticated } = useSubscription();
  const resolveRedirectPath = () => {
    const current = pathname || "/";
    if (current !== "/") return current;
    const hash = window.location.hash || "";
    if (hash.startsWith("#/")) {
      return hash.slice(1);
    }
    return current;
  };

  // Show placeholder while loading
  if (loading) {
    return (
      <div className="animate-pulse bg-slate-800/50 rounded-xl p-6">
        <div className="h-4 bg-slate-700 rounded w-1/3 mb-2"></div>
        <div className="h-3 bg-slate-700 rounded w-2/3"></div>
      </div>
    );
  }

  // Render children directly when user has permission
  if (isActivePlan(subscription, plan)) {
    return <>{children}</>;
  }

  // No permission: distinguish "not logged in" vs "logged in but insufficient plan"
  const planLabel = plan === "pro" ? "Pro" : "Basic";
  const currentPlanLabel = subscription?.plan === "basic" ? "Basic" : subscription?.plan === "pro" ? "Pro" : "Free";

  // Not logged in
  if (!isAuthenticated) {
    return (
      <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 backdrop-blur">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900/60 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center py-4">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4">
            <LogIn className="w-5 h-5 text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {title || "Please sign in"}
          </h3>
          <p className="text-sm text-slate-400 mb-6 max-w-sm">
            {description || "Sign in to view and upgrade your subscription"}
          </p>
          <Link
            href={`/${locale}/login?from=${encodeURIComponent(resolveRedirectPath())}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-900/30 hover:-translate-y-0.5"
          >
            <LogIn size={16} />
            Sign in
          </Link>
        </div>
        <div className="mt-4 opacity-50 pointer-events-none select-none overflow-hidden max-h-32">
          {children}
        </div>
      </div>
    );
  }

  // Logged in but insufficient plan
  const upgradeDescription = subscription?.plan && subscription.plan !== "free"
    ? `Currently on ${currentPlanLabel} plan, upgrade to ${planLabel} to use this feature`
    : `This feature requires ${planLabel} plan`;

  return (
    <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/60 p-6 backdrop-blur">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-b from-transparent via-slate-900/20 to-slate-900/60 pointer-events-none" />
      <div className="relative z-10 flex flex-col items-center text-center py-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
          <Lock className="w-5 h-5 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          {title || `${planLabel} Plan Required`}
        </h3>
        <p className="text-sm text-slate-400 mb-6 max-w-sm">
          {description || upgradeDescription}
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium rounded-xl transition-all shadow-lg shadow-amber-900/30 hover:-translate-y-0.5"
        >
          <Sparkles size={16} />
          {plan === "pro" ? "Upgrade to Pro" : "Upgrade to Basic"}
        </Link>
      </div>
      <div className="mt-4 opacity-50 pointer-events-none select-none overflow-hidden max-h-32">
        {children}
      </div>
    </div>
  );
};

export default RequirePlan;
