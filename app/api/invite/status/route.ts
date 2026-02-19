// app/api/invite/status/route.ts
// Check if current user has a valid (non-expired) invite code.
// Returns: { ok, verified, expired, expiresAt }
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const TRIAL_DAYS = 15;

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    let userId: string | null = null;

    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) userId = data.user.id;
    }
    if (!userId) {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) userId = data.user.id;
    }

    if (!userId) {
      return NextResponse.json({ ok: false, verified: false, expired: false }, { status: 401 });
    }

    const db = getSupabaseAdmin() as any;
    const { data: usage } = await db
      .from("invite_code_usage")
      .select("used_at")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    // No invite code record at all
    if (!usage) {
      return NextResponse.json({ ok: true, verified: false, expired: false, expiresAt: null });
    }

    // Calculate expiry: used_at + 15 days
    const usedAt = usage.used_at ? new Date(usage.used_at) : null;
    const expiresAt = usedAt
      ? new Date(usedAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
      : null;

    const now = new Date();
    const expired = expiresAt !== null && now >= expiresAt;
    const verified = !expired;

    return NextResponse.json({
      ok: true,
      verified,
      expired,
      expiresAt: expiresAt?.toISOString() ?? null,
    });
  } catch (e: any) {
    console.error("[api/invite/status]", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
