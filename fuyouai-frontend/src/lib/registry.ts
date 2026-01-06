// src/lib/registry.ts

const PROMPTOS_API_BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_PROMPTOS_API_BASE) ||
  (typeof process !== "undefined" && (process as any).env?.REACT_APP_PROMPTOS_API_BASE) ||
  "https://fuyouai-promptos.vercel.app";

export async function fetchRegistry() {
  const url = `${PROMPTOS_API_BASE}/api/registry`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchRegistry failed: ${res.status}`);
  return res.json(); // { ok, version, data: [...] }
}
