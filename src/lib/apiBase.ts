export function resolveApiBase(override?: string) {
  const fromOverride = (override || "").trim();
  if (fromOverride) return fromOverride.replace(/\/+$/, "");

  const fromEnv = (process.env.NEXT_PUBLIC_API_BASE || "").trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, "");

  return "";
}
