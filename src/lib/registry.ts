// src/lib/registry.ts

const PROMPTOS_API_BASE = "";

export async function fetchRegistry() {
  const url = `${PROMPTOS_API_BASE}/api/registry`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetchRegistry failed: ${res.status}`);
  return res.json(); // { ok, version, data: [...] }
}
