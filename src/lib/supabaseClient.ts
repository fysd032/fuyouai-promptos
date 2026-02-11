import { createClient } from "@supabase/supabase-js";

/**
 * Next.js ONLY:
 * - 客户端可用的环境变量必须以 NEXT_PUBLIC_ 开头
 * - 不要再用 import.meta.env（那是 Vite 的）
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * 开发期直接 fail fast
 * 避免你在 UI 里看到各种莫名其妙的 undefined 报错
 */
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    [
      "❌ Missing Supabase environment variables.",
      "",
      "Please check your .env.local and make sure you have:",
      "NEXT_PUBLIC_SUPABASE_URL=...",
      "NEXT_PUBLIC_SUPABASE_ANON_KEY=...",
      "",
      "⚠️  These must be NEXT_PUBLIC_ prefixed in Next.js.",
    ].join("\n")
  );
}

/**
 * Supabase client (browser-safe)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
