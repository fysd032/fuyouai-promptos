// lib/api/cors.ts
// Shared CORS configuration — single source of truth for allowed origins

const allowedOrigins = new Set([
  "https://fuyouai-promptos.vercel.app",
  "https://fuyouai.com",
  "https://www.fuyouai.com",
]);

const previewPattern = /^https:\/\/fuyouai-promptos.*\.vercel\.app$/i;

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (allowedOrigins.has(origin)) return true;
  return previewPattern.test(origin);
}

export function getCorsHeaders(
  origin: string | null,
  opts?: { methods?: string; credentials?: boolean }
): Record<string, string> {
  const methods = opts?.methods ?? "POST, OPTIONS";
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    Vary: "Origin",
  };
  if (opts?.credentials) {
    headers["Access-Control-Allow-Credentials"] = "true";
  }
  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin as string;
  }
  return headers;
}
