// src/lib/core-api.ts
import { supabase } from "./supabaseClient";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE || "https://fuyouai-promptos.vercel.app";

export async function callCoreOS(payload: {
  coreKey: string;
  tier: "basic" | "pro";
  input: string;
}) {
  const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw new Error(`[auth] ${sessionErr.message}`);
  const token = sessionData.session?.access_token;
  if (!token) throw new Error("Not signed in. Please sign in again.");

  const res = await fetch(`${API_BASE}/api/core/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Core API 调用失败: ${res.status} ${text}`);
  }

  const json = await res.json();

  const output =
    json?.output ??
    json?.modelOutput ??
    json?.aiOutput ??
    json?.text ??
    "";

  return {
    ...json,
    output: String(output),
  };
}
