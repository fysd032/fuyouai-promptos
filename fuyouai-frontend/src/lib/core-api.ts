// src/lib/core-api.ts
const API_BASE =
  import.meta.env.VITE_API_BASE || "https://fuyouai-promptos.vercel.app";

export async function callCoreOS(payload: {
  coreKey: string;
  tier: "basic" | "pro";
  input: string;
}) {
  const res = await fetch(`${API_BASE}/api/core/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
