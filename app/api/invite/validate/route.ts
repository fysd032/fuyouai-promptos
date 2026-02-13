// app/api/invite/validate/route.ts
// Validates an invite code and records usage
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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

    const admin = getSupabaseAdmin();

    // Note: invite_codes / invite_code_usage are custom tables not in
    // the generated Supabase types, so we cast through `as any` for queries.
    const db = admin as any;

    // --- Check if user already used any invite code ---
    const { data: existingUsage } = await db
      .from("invite_code_usage")
      .select("code")
      .eq("user_id", userId)
      .limit(1)
      .single();

    if (existingUsage) {
      // Already validated — let them through
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
      .insert([{ code, user_id: userId, email: userEmail }]);

    if (insertErr) {
      // Unique constraint: user already used this code
      if (insertErr.code === "23505") {
        return NextResponse.json({ ok: true, alreadyUsed: true });
      }
      throw insertErr;
    }

    await db
      .from("invite_codes")
      .update({ used_count: invite.used_count + 1 })
      .eq("code", code);

    return NextResponse.json({ ok: true, channel: invite.channel });
  } catch (e: any) {
    console.error("[api/invite/validate]", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
