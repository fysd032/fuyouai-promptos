// app/api/invite/validate/route.ts
// Validates an invite code and records usage
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const TRIAL_DAYS = 15;

/**
 * Create a 15-day basic trial for the user if they don't have a subscription yet.
 * `uid` is explicitly typed as string — callers must guard against null before calling.
 */
async function ensureTrial(uid: string): Promise<void> {
  // Cast to any once so we can insert trial_start/trial_end columns that are
  // not yet reflected in the generated Supabase types.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = getSupabaseAdmin() as any;

  const { data: existingSub } = await db
    .from("subscriptions")
    .select("user_id")
    .eq("user_id", uid)
    .maybeSingle();

  if (!existingSub) {
    const now = new Date();
    const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

    await db.from("subscriptions").insert([
      {
        user_id: uid,
        status: "trialing",
        plan: "basic",
        trial_start: now.toISOString(),
        trial_end: trialEnd.toISOString(),
      },
    ]);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const code = (body?.code ?? "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Invite code is required" },
        { status: 400 }
      );
    }

    // --- Authenticate user ---
    const supabase = await createClient();
    let userId: string | null = null;
    let userEmail: string | null = null;

    // Try Bearer token first
    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
      }
    }

    // Fallback: cookie session
    if (!userId) {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
      }
    }

    if (!userId) {
      return NextResponse.json(
        { ok: false, error: "Not authenticated" },
        { status: 401 }
      );
    }

    // After the guard above, userId is narrowed to string.
    // Capture in a const so the narrowing is preserved across all subsequent calls.
    const uid: string = userId;

    const admin = getSupabaseAdmin();

    // invite_codes / invite_code_usage are custom tables not in the generated
    // Supabase types — cast the client reference once here.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = admin as any;

    // --- Check if user already used any invite code ---
    const { data: existingUsage } = await db
      .from("invite_code_usage")
      .select("code")
      .eq("user_id", uid)
      .limit(1)
      .single();

    if (existingUsage) {
      // Already validated — ensure trial exists (handles users who validated before trial feature)
      await ensureTrial(uid);
      return NextResponse.json({ ok: true, alreadyUsed: true });
    }

    // --- Validate invite code ---
    const { data: invite, error: inviteErr } = await db
      .from("invite_codes")
      .select("code, max_uses, used_count, active, channel")
      .eq("code", code)
      .single();

    if (inviteErr || !invite) {
      return NextResponse.json(
        { ok: false, error: "Invalid invite code" },
        { status: 400 }
      );
    }

    if (!invite.active) {
      return NextResponse.json(
        { ok: false, error: "This invite code has been disabled" },
        { status: 400 }
      );
    }

    if (invite.used_count >= invite.max_uses) {
      return NextResponse.json(
        { ok: false, error: "This invite code has reached its usage limit" },
        { status: 400 }
      );
    }

    // --- Record usage + increment count ---
    const { error: insertErr } = await db
      .from("invite_code_usage")
      .insert([{ code, user_id: uid, email: userEmail }]);

    if (insertErr) {
      // Unique constraint: user already used this code
      if (insertErr.code === "23505") {
        await ensureTrial(uid);
        return NextResponse.json({ ok: true, alreadyUsed: true });
      }
      throw insertErr;
    }

    await db
      .from("invite_codes")
      .update({ used_count: invite.used_count + 1 })
      .eq("code", code);

    // --- Auto-create 15-day trial subscription ---
    await ensureTrial(uid);

    return NextResponse.json({ ok: true, channel: invite.channel, trialDays: TRIAL_DAYS });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("[api/invite/validate]", e);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
