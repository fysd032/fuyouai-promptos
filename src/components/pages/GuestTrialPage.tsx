"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Play, Loader2, Copy, Check, Sparkles, ArrowRight } from "lucide-react";

const GUEST_CALL_LIMIT = 1;
const STORAGE_KEY = "fuyou_guest_calls";

type RunState = {
  text: string;
  frontModuleId: string;
  variantId: string;
  summary?: string;
};

export default function GuestTrialPage() {
  const [userInput, setUserInput] = useState("");
  const [frontModuleId, setFrontModuleId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [output, setOutput] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [copied, setCopied] = useState(false);
  const [guestCallCount, setGuestCallCount] = useState(0);
  const [autoTriggered, setAutoTriggered] = useState(false);

  // Read intent router state from sessionStorage
  useEffect(() => {
    const stored = parseInt(localStorage.getItem(STORAGE_KEY) ?? "0", 10);
    setGuestCallCount(isNaN(stored) ? 0 : stored);

    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("mobile-run-state");
    if (!raw) return;
    try {
      const parsed: RunState = JSON.parse(raw);
      if (parsed.text) setUserInput(parsed.text);
      if (parsed.frontModuleId) setFrontModuleId(parsed.frontModuleId);
      if (parsed.variantId) setVariantId(parsed.variantId);
      if (parsed.summary) setSummary(parsed.summary);
    } catch {}
  }, []);

  const limitReached = guestCallCount >= GUEST_CALL_LIMIT;

  const handleRun = useCallback(async () => {
    if (!userInput.trim() || !frontModuleId || !variantId) return;

    setStatus("loading");
    setErrorMsg("");
    setOutput("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontModuleId,
          variantId,
          userInput: userInput.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || "Generation failed");
      }

      setOutput(data.output ?? "");
      setStatus("success");

      const newCount = guestCallCount + 1;
      localStorage.setItem(STORAGE_KEY, String(newCount));
      setGuestCallCount(newCount);
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err?.message ?? "Something went wrong. Please try again.");
    }
  }, [userInput, frontModuleId, variantId, guestCallCount]);

  // Auto-run when coming from homepage with intent router data
  useEffect(() => {
    if (
      autoTriggered ||
      limitReached ||
      !userInput.trim() ||
      !frontModuleId ||
      !variantId
    ) return;
    setAutoTriggered(true);
    handleRun();
  }, [userInput, frontModuleId, variantId, autoTriggered, limitReached, handleRun]);

  const handleCopy = useCallback(() => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [output]);

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
          {summary && (
            <p className="text-sm text-blue-400">{summary}</p>
          )}
          <p className="text-sm text-slate-400">
            {status === "loading"
              ? "Generating your result..."
              : status === "success"
                ? "Here's your result. Sign up to save it and keep using FuyouAI."
                : "Enter your task and see the full output — no sign-up required."}
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
            maxLength={4000}
          />

          {!limitReached && (
            <div className="flex justify-end">
              <button
                onClick={handleRun}
                disabled={status === "loading" || !userInput.trim() || !frontModuleId}
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
          )}
        </div>

        {/* Loading indicator */}
        {status === "loading" && (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={28} className="animate-spin text-blue-500" />
          </div>
        )}

        {/* Error */}
        {status === "error" && errorMsg && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400">
            {errorMsg}
          </div>
        )}

        {/* Output */}
        {output && (
          <>
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

            {/* Login CTA after output */}
            <div className="bg-[#111827] border border-blue-500/20 rounded-2xl p-6 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
                <Sparkles size={18} className="text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium text-base">
                  Like what you see?
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Sign up to save your results, access all 31 modules, and keep generating.
                </p>
              </div>
              <Link
                href="/login?from=/modules/core"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-900/30 hover:-translate-y-0.5"
              >
                Sign Up Free <ArrowRight size={15} />
              </Link>
            </div>
          </>
        )}

        {/* Limit reached without output */}
        {limitReached && !output && (
          <div className="bg-[#111827] border border-blue-500/20 rounded-2xl p-6 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto">
              <Sparkles size={18} className="text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium text-base">You've used your free trial</p>
              <p className="text-slate-400 text-sm mt-1">
                Sign up free to keep going — no credit card required.
              </p>
            </div>
            <Link
              href="/login?from=/modules/core"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#3B82F6] hover:bg-blue-600 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-blue-900/30 hover:-translate-y-0.5"
            >
              Sign Up Free <ArrowRight size={15} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
