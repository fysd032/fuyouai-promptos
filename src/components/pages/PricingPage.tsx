// File: src/components/pages/PricingPage.tsx
import React from "react";
import { SiteFooter } from "@/components/SiteFooter";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0B0F15] text-slate-200">
      <main className="max-w-5xl mx-auto px-6 py-14">
        <header className="mb-10">
          <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
            Pricing
          </h1>
          <p className="mt-4 text-slate-400 max-w-2xl leading-relaxed">
            Subscription plans based on system depth and access level.
          </p>
          <p className="mt-3 text-slate-400 max-w-3xl leading-relaxed">
            <span className="">Fuyou AI</span> is offered through a subscription-based model that provides ongoing access to the platform
            and its available modules during the active billing period. Billing
            is monthly only, and annual plans are not offered.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl font-semibold text-white">Basic</h2>
              <div className="text-right">
                <div className="text-white text-xl font-semibold">$29</div>
                <div className="text-xs text-slate-400">per month</div>
              </div>
            </div>

            <p className="mt-3 text-slate-400 leading-relaxed">
              For users working with standard system capabilities.
            </p>

            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              <li className="flex gap-2">
                <span className="text-slate-500">&bull;</span>
                <span>Access to all general modules</span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-500">&bull;</span>
                <span>Access to standard versions of core frameworks</span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-500">&bull;</span>
                <span>Designed for individual professionals</span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-500">&bull;</span>
                <span>Monthly billing only</span>
              </li>
            </ul>
          </div>

          {/* Pro */}
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-2xl font-semibold text-white">Pro</h2>
              <div className="text-right">
                <div className="text-white text-xl font-semibold">$69</div>
                <div className="text-xs text-slate-400">per month</div>
              </div>
            </div>

            <p className="mt-3 text-slate-400 leading-relaxed">
              For users requiring deeper system-level control.
            </p>

            <ul className="mt-5 space-y-2 text-sm text-slate-300">
              <li className="flex gap-2">
                <span className="text-slate-500">&bull;</span>
                <span>Access to all general modules</span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-500">&bull;</span>
                <span>Access to professional versions of core frameworks</span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-500">&bull;</span>
                <span>Deeper task decomposition and structured reasoning</span>
              </li>
              <li className="flex gap-2">
                <span className="text-slate-500">&bull;</span>
                <span>Monthly billing only</span>
              </li>
            </ul>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="mt-10 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-7">
          <h3 className="text-lg font-semibold text-white">Disclaimer</h3>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Access depth, module versions, and system capabilities may change over time and are defined by the
            active subscription at the time of billing.
          </p>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
