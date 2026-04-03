// app/api/conversations/route.ts
// GET  /api/conversations  — list current user's conversations (newest first)
import "server-only";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

async function getUserId(req: Request): Promise<string | null> {
  // Try Bearer token first
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (token) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser(token);
    return data.user?.id ?? null;
  }

  // Fall back to cookie session
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdmin() as any;
    const { data, error } = await admin
      .from("conversations")
      .select("id, title, source, current_module, status, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(100);

    if (error) throw error;

    return NextResponse.json({ ok: true, conversations: data ?? [] });
  } catch (e: any) {
    console.error("[api/conversations] GET error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Server error" }, { status: 500 });
  }
}
