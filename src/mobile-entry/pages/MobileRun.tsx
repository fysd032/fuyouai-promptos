"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { supabase } from "@/src/lib/supabaseClient";

type PlanQuestion = {
  id: string;
  label: string;
  type: "text" | "select";
  options?: string[];
};

type MobileRunState = {
  text: string;
  planId: string;
  summary: string;
  questions: PlanQuestion[];
};

const FALLBACK_NOTICE = (
  <div className="rounded-xl border border-[#1F2937] bg-[#0F172A] p-4 space-y-2">
    <p className="text-sm text-[#E5E7EB] font-medium">About this request</p>
    <p className="text-sm text-[#9CA3AF]">
      We may be able to help with this request, but the result depends on how
      specific and complete the information is.
    </p>
    <p className="text-sm text-[#9CA3AF]">
      If this turns out to be outside our current scope, here’s what we can help
      with:
    </p>
    <ul className="text-sm text-[#9CA3AF] list-disc pl-5">
      <li>A simplified version of this request</li>
      <li>A closely related scenario</li>
    </ul>
    <p className="text-xs text-[#6B7280]">
      This is not a limitation — it’s how we ensure professional and reliable
      results.
    </p>
  </div>
);

const MobileRun: React.FC = () => {
  const locale = useLocale();
  const router = useRouter();
  const [runState, setRunState] = useState<MobileRunState | null>(null);

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");

  const questions = useMemo(
    () => runState?.questions ?? [],
    [runState?.questions]
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = sessionStorage.getItem("mobile-run-state");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as MobileRunState;
      setRunState(parsed);
    } catch {
      setRunState(null);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.replace(`/${locale}/login?from=/m2/run`);
      }
    });
  }, [router]);

  if (!runState?.text) {
    return (
      <div className="min-h-[100dvh] bg-[#0A0F1C] text-[#F9FAFB] flex items-center justify-center px-4">
        <div className="w-full max-w-md rounded-2xl border border-[#1F2937] bg-[#0F172A] p-6 text-center space-y-3">
          <h2 className="text-lg font-semibold">Request not found</h2>
          <p className="text-sm text-[#9CA3AF]">
            Please start from the entry page.
          </p>
          <button
            type="button"
            onClick={() => router.push("/m2")}
            className="mt-2 w-full rounded-xl bg-[#3B82F6] py-2.5 text-sm font-semibold text-white"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const { text, planId, summary } = runState;
  const showFallback =
    questions.length > 0 && summary?.toLowerCase().includes("you want to");

  const handleAnswerChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const runRequest = async (payload: Record<string, unknown>) => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const response = await fetch("/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || "Request failed");
      }
      setOutput(data?.output ?? "");
    } catch (error) {
      setOutput("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = () => {
    const stored = sessionStorage.getItem("mobile-run-state");
    const routerData = stored ? JSON.parse(stored) : {};
    const {
      frontModuleId = null,
      variantId = null,
      coreEngine = null,
      answers: routerAnswers = {},
    } = routerData;

    runRequest({
      plan_id: planId,
      text,
      answers,
      frontModuleId,
      variantId,
      coreEngine,
      routerAnswers,
    });
  };

  const handleRefine = () => {
    if (!refineInstruction.trim()) return;

    const stored = sessionStorage.getItem("mobile-run-state");
    const routerData = stored ? JSON.parse(stored) : {};
    const {
      frontModuleId = null,
      variantId = null,
      coreEngine = null,
    } = routerData;

    runRequest({
      plan_id: planId,
      text,
      answers,
      refineInstruction: refineInstruction.trim(),
      previousOutput: output,
      frontModuleId,
      variantId,
      coreEngine,
    });
  };

  return (
    <div className="min-h-[100dvh] bg-[#0A0F1C] text-[#F9FAFB] overflow-x-hidden">
      <div className="min-h-[100dvh] px-4 pt-8 pb-12 bg-[radial-gradient(1200px_700px_at_50%_-10%,rgba(59,130,246,0.2),rgba(10,15,28,0)_60%),linear-gradient(180deg,rgba(10,15,28,0.95),rgba(10,15,28,1))]">
        <div className="w-full max-w-xl mx-auto space-y-6">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-[#6B7280]">
              Studio
            </p>
            <h1 className="text-xl sm:text-2xl font-semibold text-white">
              Your plan
            </h1>
          </header>

          <section className="space-y-4">
            <div className="rounded-2xl border border-[#1F2937] bg-[#0F172A] p-4 space-y-2">
              <p className="text-xs text-[#6B7280] uppercase tracking-[0.2em]">
                Summary
              </p>
              <p className="text-sm text-[#E5E7EB]">{summary}</p>
            </div>
            {showFallback && FALLBACK_NOTICE}
          </section>

          {questions.length > 0 && (
            <section className="rounded-2xl border border-[#1F2937] bg-[#0F172A] p-4 space-y-4">
              <p className="text-xs text-[#6B7280] uppercase tracking-[0.2em]">
                Clarifying questions
              </p>
              <div className="space-y-3">
                {questions.map((question) => (
                  <div key={question.id} className="space-y-2">
                    <label className="text-sm text-[#E5E7EB]">
                      {question.label}
                    </label>
                    {question.type === "select" ? (
                      <select
                        value={answers[question.id] ?? ""}
                        onChange={(event) =>
                          handleAnswerChange(question.id, event.target.value)
                        }
                        className="w-full rounded-xl border border-[#1F2937] bg-[#0B1220] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/60"
                      >
                        <option value="">Select an option</option>
                        {(question.options ?? []).map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={answers[question.id] ?? ""}
                        onChange={(event) =>
                          handleAnswerChange(question.id, event.target.value)
                        }
                        placeholder="Type your answer"
                        className="w-full rounded-xl border border-[#1F2937] bg-[#0B1220] px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/60"
                      />
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={loading}
            className="w-full rounded-xl bg-[#3B82F6] py-3 text-sm font-semibold text-white shadow-lg shadow-[#1D4ED8]/20 transition hover:bg-[#2563EB] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? "Preparing..." : "Generate"}
          </button>

          <section className="rounded-2xl border border-[#1F2937] bg-[#0F172A] p-4 space-y-3">
            <p className="text-xs text-[#6B7280] uppercase tracking-[0.2em]">
              Output
            </p>
            {output ? (
              <div className="text-sm text-[#E5E7EB] whitespace-pre-wrap">
                {output}
              </div>
            ) : (
              <p className="text-sm text-[#6B7280]">
                No output yet. Generate to see results.
              </p>
            )}
          </section>

          <section className="rounded-2xl border border-[#1F2937] bg-[#0F172A] p-4 space-y-3">
            <p className="text-xs text-[#6B7280] uppercase tracking-[0.2em]">
              Not satisfied? Add one more line.
            </p>
            <input
              type="text"
              value={refineInstruction}
              onChange={(event) => setRefineInstruction(event.target.value)}
              placeholder="Add a refinement request"
              className="w-full rounded-xl border border-[#1F2937] bg-[#0B1220] px-3 py-2 text-sm text-white placeholder:text-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#3B82F6]/60"
            />
            <button
              type="button"
              onClick={handleRefine}
              disabled={loading || !refineInstruction.trim()}
              className="w-full rounded-xl border border-[#3B82F6] py-2.5 text-sm font-semibold text-[#3B82F6] transition hover:bg-[#1D4ED8]/10 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Preparing..." : "Generate again"}
            </button>
          </section>
        </div>
      </div>
    </div>
  );
};

export default MobileRun;
