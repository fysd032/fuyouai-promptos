// src/components/InviteGate.tsx
// Gate component: requires a valid invite code before accessing content
"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Ticket, Loader2, CheckCircle, ArrowRight, LogIn } from "lucide-react";
import { supabase } from "@/src/lib/supabaseClient";
import Link from "next/link";

const IS_DEV = process.env.NEXT_PUBLIC_DEV_MODE === "true";
const INVITE_ENABLED = process.env.NEXT_PUBLIC_INVITE_ENABLED !== "false"; // enabled by default

interface InviteGateProps {
  children: React.ReactNode;
}

export const InviteGate: React.FC<InviteGateProps> = ({ children }) => {
  const [status, setStatus] = useState<"loading" | "verified" | "needs_code" | "no_auth">("loading");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill from URL ?invite=CODE, persist to localStorage so it survives login redirect
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const inviteParam = params.get("invite") || params.get("inviteCode") || "";
    if (inviteParam) {
      const upper = inviteParam.toUpperCase();
      setCode(upper);
      localStorage.setItem("fuyou_invite_code", upper);
    } else {
      // Restore from localStorage if no URL param
      const saved = localStorage.getItem("fuyou_invite_code");
      if (saved) setCode(saved);
    }
  }, []);

  const checkStatus = useCallback(async () => {
    // Dev mode or invite disabled: skip gate
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

  // Listen for auth state changes
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setError("Please sign in first");
        setSubmitting(false);
        return;
      }

      const res = await fetch("/api/invite/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      const data = await res.json();

      if (data.ok) {
        setStatus("verified");
        localStorage.removeItem("fuyou_invite_code");
      } else {
        setError(data.error || "Invalid invite code");
      }
    } catch {
      setError("Network error, please try again");
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-full min-h-[300px]">
        <Loader2 size={28} className="animate-spin text-blue-500" />
      </div>
    );
  }

  // Verified: show content
  if (status === "verified") {
    return <>{children}</>;
  }

  // Not authenticated: show login prompt
  if (status === "no_auth") {
    const currentPath = typeof window !== "undefined" ? window.location.pathname + window.location.search : "/modules";
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-2xl p-8 text-center">
          <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
            <LogIn className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Sign In Required
          </h2>
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

  // Needs invite code
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-md bg-[#111827] border border-[#1F2937] rounded-2xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-5">
          <Ticket className="w-6 h-6 text-blue-400" />
        </div>

        <h2 className="text-xl font-semibold text-white mb-2">
          Beta Access Required
        </h2>
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
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
            Twitter
          </a>{" "}
          for updates.
        </p>
      </div>
    </div>
  );
};
