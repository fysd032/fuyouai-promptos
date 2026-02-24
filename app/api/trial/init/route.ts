// app/api/trial/init/route.ts
// Called after login to auto-grant a 15-day free trial to every new user.
// Idempotent — safe to call multiple times (won't overwrite an existing trial).
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const TRIAL_DAYS = 15;

export async function POST(req: Request) {
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
      const { data } = await supabase.auth.getUser();
      if (data?.user) userId = data.user.id;
    }
    if (!userId) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const admin = getSupabaseAdmin() as any;

    // Check if trial already exists — don't overwrite
    const { data: existing } = await admin
      .from("user_entitlements")
      .select("id, expires_at")
      .eq("user_id", userId)
      .eq("type", "beta_trial")
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, created: false, expires_at: existing.expires_at });
    }

    // Grant new 15-day trial
    const expiresAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
    const { error: insertError } = await admin
      .from("user_entitlements")
      .insert({
        user_id: userId,
        type: "beta_trial",
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      console.error("[api/trial/init] insert error", insertError);
      return NextResponse.json({ ok: false, error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, created: true, expires_at: expiresAt.toISOString() });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("[api/trial/init]", e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
