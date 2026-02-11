"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { suggestions } from "../config/suggestions";

const placeholderOptions = [
  "E.g. write a business email, run a competitor analysis, summarize a document, generate an SOP",
  "Describe your task in one sentence…",
  "Tell me what you want to accomplish…",
];

const MobileEntry: React.FC = () => {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [status, setStatus] = useState("");

  const placeholder = useMemo(() => placeholderOptions[0], []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const force = params.get("force") === "1";
    const isMobile = window.matchMedia("(max-width: 900px)").matches;
    if (!isMobile && !force) {
      router.replace("/modules/core");
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) {
      setShowHint(true);
      return;
    }

    setLoading(true);
    setStatus("Connecting to the planner...");

    try {
      const response = await fetch("/api/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Request failed");
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "mobile-run-state",
          JSON.stringify({
            text,
            planId: data.plan_id,
            summary: data.summary,
            questions: data.questions ?? [],
          })
        );
      }
      router.push("/m2/run");
    } catch (error) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "mobile-run-state",
          JSON.stringify({
            text,
            planId: "plan_local",
            summary: "We are setting up your plan.",
            questions: [],
          })
        );
      }
      router.push("/m2/run");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#0A0F1C] text-[#F9FAFB] overflow-x-hidden">
      <div className="min-h-[100dvh] flex flex-col px-4 pt-10 pb-12 bg-[radial-gradient(1200px_700px_at_50%_-10%,rgba(59,130,246,0.2),rgba(10,15,28,0)_60%),linear-gradient(180deg,rgba(10,15,28,0.95),rgba(10,15,28,1))]">
        <div className="w-full max-w-xl mx-auto flex flex-col gap-8">
          <header className="space-y-3">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">
              Studio
            </p>
            <h1 className="text-2xl sm:text-3xl font-semibold text-white">
              What do you want to do?
            </h1>
            <p className="text-sm text-[#9CA3AF]">
              Describe the outcome you want and we will plan the next steps.
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <textarea
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  if (showHint) setShowHint(false);
                }}
                rows={4}
                placeholder={placeholder}
                className="w-full rounded-2xl border border-[#1F2937] bg-[#0F172A] p-4 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/60"
              />
              {showHint && !input.trim() && (
                <p className="text-xs text-[#F87171]">Please enter your request</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {suggestions.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setInput(item);
                    setShowHint(false);
                  }}
                  className="rounded-full border border-[#1F2937] bg-[#111827]/70 px-3 py-1.5 text-xs text-[#E5E7EB] hover:border-[#3B82F6]/50 hover:text-white transition-colors"
                >
                  {item}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#3B82F6] py-3 text-sm font-semibold text-white shadow-lg shadow-[#1D4ED8]/20 transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? "Preparing..." : "Continue"}
            </button>
          </form>

          {status && (
            <div className="text-xs text-[#6B7280] text-center">{status}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MobileEntry;
