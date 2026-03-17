"use client";

import { useState } from "react";

// ============================
// 类型定义
// ============================

export type RouterResult = {
  coreEngine: string;
  frontModuleId: string;
  variantId: string;
  confidence: number;
  engineReason: string;
  moduleReason: string;
  hint: string;
};

export type Stage = "idle" | "loading" | "hinting" | "confirmed" | "error";

// ============================
// Hook
// ============================

export function useIntentRouter(
  onConfirm: (result: RouterResult, input: string) => void
) {
  const [input, setInput] = useState("");
  const [showHint, setShowHint] = useState(false);
  const [stage, setStage] = useState<Stage>("idle");
  const [routerResult, setRouterResult] = useState<RouterResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  async function callIntent(text: string): Promise<RouterResult | null> {
    const res = await fetch("/api/intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await res.json();
    if (data.error) throw new Error(data.message);
    return data as RouterResult;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!input.trim()) {
      setShowHint(true);
      return;
    }
    setStage("loading");
    try {
      const data = await callIntent(input);
      if (!data) throw new Error("No response");
      setRouterResult(data);
      if (data.hint) {
        setStage("hinting");
      } else {
        setStage("confirmed");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setErrorMsg(message);
      setStage("error");
    }
  }

  async function handleConfirm() {
    let result = routerResult;

    if (stage === "hinting") {
      setStage("loading");
      try {
        result = await callIntent(input);
        if (!result) throw new Error("No response");
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Something went wrong";
        setErrorMsg(message);
        setStage("error");
        return;
      }
    }

    if (!result) return;

    setStage("confirmed");
    onConfirm(result, input);
  }

  function resetError() {
    setStage("idle");
    setErrorMsg("");
  }

  return {
    input,
    setInput,
    showHint,
    setShowHint,
    stage,
    routerResult,
    errorMsg,
    handleSubmit,
    handleConfirm,
    resetError,
  };
}
