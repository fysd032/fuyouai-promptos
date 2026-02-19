// src/components/InviteGate.tsx
// Gate component: requires a valid invite code before accessing content.
// • If ?invite=CODE is in the URL and user is already logged in → auto-submit once
// • On success: clears invite params from URL, clears localStorage, refreshes subscription
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Ticket, Loader2, ArrowRight, LogIn, Clock, Sparkles } from "lucide-react";
import { supabase } from "@/src/lib/supabaseClient";
import { useSubscription } from "@/src/context/SubscriptionContext";
import Link from "next/link";

const IS_DEV = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const INVITE_ENABLED = process.env.NEXT_PUBLIC_INVITE_ENABLED !== "false";

interface InviteGateProps {
  children: React.ReactNode;
}

export const InviteGate: React.FC<InviteGateProps> = ({ children }) => {
  const [status, setStatus] = useState<"loading" | "verified" | "needs_code" | "no_auth" | "expired">("loading");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
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

  // ── Core: check whether this user already has invite access ─
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
      const res = await fetch("/api/invite/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.verified) {
        setStatus("verified");
        localStorage.removeItem("fuyou_invite_code");
      } else if (data.expired) {
        setStatus("expired");
        localStorage.removeItem("fuyou_invite_code");
      } else {
        setStatus("needs_code");
      }
    } catch {
      setStatus("needs_code");
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

  // ── Submit invite code (shared by form + auto-submit) ───
  const submitCode = useCallback(async (codeToSubmit: string) => {
    if (!codeToSubmit.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Please sign in first");
        return;
      }

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
        // Remove invite params from URL without navigation
        if (typeof window !== "undefined") {
          const url = new URL(window.location.href);
          url.searchParams.delete("invite");
          url.searchParams.delete("inviteCode");
          window.history.replaceState({}, "", url.toString());
        }
        localStorage.removeItem("fuyou_invite_code");
        // Refresh subscription state so RequirePlan sees the new entitlement
        await refreshSubscription();
        setStatus("verified");
      } else {
        setError(data.error ?? "Invalid invite code");
      }
    } catch {
      setError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  }, [refreshSubscription]);

  // ── Auto-submit when code came from URL and user is ready ─
  useEffect(() => {
    if (
      status === "needs_code" &&
      codeFromUrl.current &&
      !autoSubmitted.current &&
      code.trim()
    ) {
      autoSubmitted.current = true;
      submitCode(code);
    }
  }, [status, code, submitCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitCode(code);
  };

  // ── Render ───────────────────────────────────────────────

  if (status === "loading") {
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

  // needs_code
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
          <Ticket className="w-6 h-6 text-blue-400" />
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">Beta Access Required</h2>
        <p className="text-sm text-gray-400 mb-6">
          FuyouAI is currently in closed beta. Enter your invite code to get started.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            placeholder="e.g. FUYOU-BETA01"
            className="w-full px-4 py-3 bg-[#0A0F1C] border border-[#374151] rounded-xl text-white text-center text-lg font-mono tracking-widest placeholder:text-gray-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20"
            maxLength={20}
            autoFocus
          />
          <button
            type="submit"
            disabled={submitting || !code.trim()}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-all"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Validating...
              </>
            ) : (
              <>
                Enter Beta <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-6">
          Don&apos;t have an invite code? Follow us on{" "}
          <a
            href="https://twitter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Twitter
          </a>{" "}
          for updates.
        </p>
      </div>
    </div>
  );
};
