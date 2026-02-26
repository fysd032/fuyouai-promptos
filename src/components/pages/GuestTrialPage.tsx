"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Play, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { callCoreFrameworkGuest } from "@/src/lib/coreframework-api";

const GUEST_CALL_LIMIT = 2;
const STORAGE_KEY = "fuyou_guest_calls";

export default function GuestTrialPage() {
  const [userInput, setUserInput] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [guestCallCount, setGuestCallCount] = useState(0);

  useEffect(() => {
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    setGuestCallCount(isNaN(stored) ? 0 : stored);
  }, []);

  const limitReached = guestCallCount >= GUEST_CALL_LIMIT;

  const handleRun = useCallback(async () => {
    if (!userInput.trim()) return;

    setStatus("loading");
    setErrorMsg("");
    setOutput("");

    try {
      const data = await callCoreFrameworkGuest({
        coreKey: "task_breakdown",
        userInput: userInput.trim(),
        engineType: "deepseek",
      });

      setOutput(data.output ?? "");
      setStatus("success");

      const newCount = guestCallCount + 1;
      localStorage.setItem(STORAGE_KEY, String(newCount));
      setGuestCallCount(newCount);
    } catch (err: any) {
      if (err?.code === "GUEST_LIMIT_REACHED") {
        localStorage.setItem(STORAGE_KEY, String(GUEST_CALL_LIMIT));
        setGuestCallCount(GUEST_CALL_LIMIT);
      }
      setStatus("error");
      setErrorMsg(err?.message ?? "Something went wrong. Please try again.");
    }
  }, [userInput, guestCallCount]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [output]);

  const runsLeft = Math.max(0, GUEST_CALL_LIMIT - guestCallCount);

  return (
    <div className="min-h-screen bg-[#0B0F15] text-white font-sans">
      {/* Navbar */}
      <nav className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between border-b border-white/[0.06]">
        <Link href="/" className="font-semibold text-base text-white/90 tracking-tight">
          FuyouAI
        </Link>
        <Link
          href="/login"
          className="text-sm text-slate-400 hover:text-white transition-colors"
        >
          Sign In
        </Link>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Try FuyouAI Free</h1>
          <p className="text-sm text-slate-400">
            Turn your messy idea into a structured, executable prompt.{" "}
            <span className="text-slate-500">
              {runsLeft > 0
                ? `${runsLeft} free run${runsLeft > 1 ? "s" : ""} remaining.`
                : "Free runs used."}
            </span>
          </p>
        </div>

        {/* Input */}
        <div className="space-y-3">
          <textarea
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={limitReached || status === "loading"}
            placeholder={`Describe what you want to accomplish...\n\nExample: "Help me plan a product launch for a new SaaS tool targeting small businesses."`}
            className="w-full h-[180px] bg-[#111827] border border-[#1F2937] rounded-xl p-4 text-sm text-[#F9FAFB] placeholder:text-[#4B5563] focus:outline-none focus:border-[#3B82F6]/50 focus:ring-1 focus:ring-[#3B82F6]/20 transition-all resize-none leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <div className="flex justify-end">
            <button
              onClick={handleRun}
              disabled={limitReached || status === "loading" || !userInput.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-900/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {status === "loading" ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Play size={15} fill="currentColor" />
              )}
              {status === "loading" ? "Generating..." : "Generate Now"}
            </button>
          </div>
        </div>

        {/* Sign-up card — shown when limit reached */}
        {limitReached && (
          <div className="bg-[#111827] border border-blue-500/20 rounded-2xl p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
              <Sparkles size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium text-base">You've used your 2 free runs</p>
              <p className="text-slate-400 text-sm mt-1">
                Sign up free to keep going — no credit card required.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-900/30 hover:-translate-y-0.5"
            >
              Sign Up Free →
            </Link>
          </div>
        )}

        {/* Error */}
        {status === "error" && errorMsg && !errorMsg.includes("GUEST_LIMIT_REACHED") && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Output */}
        {output && (
          <div className="bg-[#111827] border border-[#1F2937] rounded-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#1F2937]">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-widest">Output</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <div className="p-5 text-sm text-[#E5E7EB] leading-relaxed whitespace-pre-wrap">
              {output}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
