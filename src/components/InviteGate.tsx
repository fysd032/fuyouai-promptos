// src/components/InviteGate.tsx
// Access gate: allows users with a valid invite code (URL auto-submit only)
// or an active paid subscription. No manual invite code entry.
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, LogIn, Clock, Sparkles, Lock } from "lucide-react";
import { supabase } from "@/src/lib/supabaseClient";
import { useSubscription } from "@/src/context/SubscriptionContext";
import Link from "next/link";
import { useRouter } from "next/navigation";

const IS_DEV = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const INVITE_ENABLED = process.env.NEXT_PUBLIC_INVITE_ENABLED !== "false";

interface InviteGateProps {
  children: React.ReactNode;
}

export const InviteGate: React.FC<InviteGateProps> = ({ children }) => {
  const router = useRouter();
  const [status, setStatus] = useState<"loading" | "verified" | "needs_sub" | "no_auth" | "expired">("loading");
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { refreshSubscription } = useSubscription();

  // Tracks whether the code came from the URL (triggers auto-submit)
  const codeFromUrl = useRef(false);
  // Prevents auto-submit from firing more than once
  const autoSubmitted = useRef(false);

  // ── Read invite code from URL or localStorage ───────────
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get("invite") ?? params.get("inviteCode") ?? "";
    if (inviteParam) {
      const upper = inviteParam.toUpperCase();
      codeFromUrl.current = true;
      setCode(upper);
      localStorage.setItem("fuyou_invite_code", upper);
    } else {
      const saved = localStorage.getItem("fuyou_invite_code");
      if (saved) setCode(saved);
    }
  }, []);

  // ── Core: check invite code OR paid subscription ─────────
  const checkStatus = useCallback(async () => {
    if (IS_DEV || !INVITE_ENABLED) {
      setStatus("verified");
      return;
    }
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setStatus("no_auth");
        return;
      }

      // 1. Check invite code status
      const inviteRes = await fetch("/api/invite/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const inviteData = await inviteRes.json();

      if (inviteData.verified) {
        setStatus("verified");
        localStorage.removeItem("fuyou_invite_code");
        return;
      }

      // 2. Not verified via invite → check paid subscription
      const subRes = await fetch("/api/subscription", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (subRes.ok) {
        const subData = await subRes.json();
        const sub = subData.subscription;
        if (
          sub &&
          (sub.status === "active" || sub.status === "canceling") &&
          sub.plan &&
          sub.plan !== "free"
        ) {
          setStatus("verified");
          return;
        }
      }

      // 3. Neither invite nor paid subscription
      if (inviteData.expired) {
        setStatus("expired");
        localStorage.removeItem("fuyou_invite_code");
      } else {
        setStatus("needs_sub");
      }
    } catch {
      setStatus("needs_sub");
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        checkStatus();
      } else {
        setStatus("no_auth");
      }
    });
    return () => { data.subscription.unsubscribe(); };
  }, [checkStatus]);

  // ── Auto-submit invite code from URL only ────────────────
  const submitCode = useCallback(async (codeToSubmit: string) => {
    if (!codeToSubmit.trim()) return;

    setSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const res = await fetch("/api/invite/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: codeToSubmit.trim() }),
      });

      const data = await res.json();

      if (data.ok) {
        localStorage.removeItem("fuyou_invite_code");
        await refreshSubscription();
        router.replace("/modules/core");
      } else {
        // Invalid invite code from URL → show subscribe page
        setStatus("needs_sub");
      }
    } catch {
      setStatus("needs_sub");
    } finally {
      setSubmitting(false);
    }
  }, [refreshSubscription, router]);

  // ── Auto-submit when code came from URL and user is ready ─
  useEffect(() => {
    if (
      status === "needs_sub" &&
      codeFromUrl.current &&
      !autoSubmitted.current &&
      code.trim()
    ) {
      autoSubmitted.current = true;
      submitCode(code);
    }
  }, [status, code, submitCode]);

  // ── Render ───────────────────────────────────────────────

  if (status === "loading" || submitting) {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  if (status === "verified") {
    return <>{children}</>;
  }

  if (status === "no_auth") {
    const currentPath =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/modules";
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
            <LogIn className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Sign In Required</h2>
          <p className="text-sm text-gray-400 mb-6">
            Please sign in to access FuyouAI modules.
          </p>
          <Link
            href={`/login?from=${encodeURIComponent(currentPath)}`}
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-all"
          >
            <LogIn size={18} />
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-5">
            <Clock className="w-6 h-6 text-amber-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Trial Expired</h2>
          <p className="text-sm text-gray-400 mb-6">
            Your 15-day beta trial has ended. Upgrade to a paid plan to continue using FuyouAI.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-medium rounded-xl transition-all"
          >
            <Sparkles size={18} />
            Upgrade Now
          </Link>
        </div>
      </div>
    );
  }

  // needs_sub: logged in but no invite code and no paid subscription
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
          <Lock className="w-6 h-6 text-blue-400" />
        </div>
        <h2 className="text-xl font-semibold text-white mb-2">Subscription Required</h2>
        <p className="text-sm text-gray-400 mb-6">
          Subscribe to access FuyouAI, or use an invite link to start a 15-day free trial.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center justify-center gap-2 w-full px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-400 hover:to-indigo-400 text-white font-medium rounded-xl transition-all"
        >
          <Sparkles size={18} />
          View Pricing
        </Link>
      </div>
    </div>
  );
};
