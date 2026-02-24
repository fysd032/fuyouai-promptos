// app/api/invite/status/route.ts
// Check if current user has valid access:
//   1. Active invite code (invite_code_usage within 15 days)
//   2. Active beta trial (user_entitlements, type=beta_trial)
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getSupabaseAdmin() as any;

    // 1. Check invite_code_usage (invite link users)
    const { data: usage } = await db
      .from("invite_code_usage")
      .select("used_at")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (usage) {
      const usedAt = usage.used_at ? new Date(usage.used_at) : null;
      const expiresAt = usedAt
        ? new Date(usedAt.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000)
        : null;
      const now = new Date();
      const expired = expiresAt !== null && now >= expiresAt;
      return NextResponse.json({
        ok: true,
        verified: !expired,
        expired,
        expiresAt: expiresAt?.toISOString() ?? null,
      });
    }

    // 2. Check user_entitlements (all registered users' 15-day trial)
    const { data: entitlement } = await db
      .from("user_entitlements")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("type", "beta_trial")
      .maybeSingle();

    if (entitlement) {
      const expiresAt = entitlement.expires_at ? new Date(entitlement.expires_at) : null;
      const now = new Date();
      const expired = expiresAt !== null && now >= expiresAt;
      return NextResponse.json({
        ok: true,
        verified: !expired,
        expired,
        expiresAt: expiresAt?.toISOString() ?? null,
      });
    }

    // No trial record found at all
    return NextResponse.json({ ok: true, verified: false, expired: false, expiresAt: null });
  } catch (e: unknown) {
    console.error("[api/invite/status]", e);
    return NextResponse.json(
      { ok: false, error: (e instanceof Error ? e.message : "Internal error") },
      { status: 500 }
    );
  }
}
