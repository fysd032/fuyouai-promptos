// app/api/invite/validate/route.ts
// Redeems an invite code using direct table operations (no RPC dependency).
// Works with the original invite_codes + invite_code_usage schema.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { bustEntitlement } from "@/lib/billing/entitlement-cache";

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

    // ── Authenticate user ──────────────────────────────────
    const supabase = await createClient();
    let userId: string | null = null;
    let userEmail: string | null = null;

    const authHeader = req.headers.get("authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error && data?.user) {
        userId = data.user.id;
        userEmail = data.user.email ?? null;
      }
    }

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

    // Narrowed to string after guard above
    const uid: string = userId;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getSupabaseAdmin() as any;

    // ── Check if user already redeemed any code ────────────
    const { data: existingUsage } = await db
      .from("invite_code_usage")
      .select("code")
      .eq("user_id", uid)
      .limit(1)
      .maybeSingle();

    if (existingUsage) {
      // Already has beta access — just bust cache and return success
      await bustEntitlement(uid);
      return NextResponse.json({
        ok: true,
        alreadyRedeemed: true,
        channel: null,
        expiresAt: null,
        trialDays: 15,
      });
    }

    // ── Validate the invite code ───────────────────────────
    const { data: codeRow, error: codeErr } = await db
      .from("invite_codes")
      .select("active, used_count, max_uses, channel")
      .eq("code", code)
      .maybeSingle();

    if (codeErr || !codeRow) {
      return NextResponse.json(
        { ok: false, error: "Invalid invite code" },
        { status: 400 }
      );
    }

    if (!codeRow.active) {
      return NextResponse.json(
        { ok: false, error: "Invite code is disabled" },
        { status: 400 }
      );
    }

    if (codeRow.used_count >= codeRow.max_uses) {
      return NextResponse.json(
        { ok: false, error: "Invite code exhausted" },
        { status: 400 }
      );
    }

    // ── Record usage ───────────────────────────────────────
    // Only insert required columns (code + user_id) to avoid issues
    // if optional columns like email don't exist in production schema.
    const { error: insertErr } = await db
      .from("invite_code_usage")
      .insert({ code, user_id: uid });

    if (insertErr && insertErr.code !== "23505") {
      // 23505 = unique_violation (concurrent insert), safe to ignore
      console.error("[api/invite/validate] insert error", insertErr);
      return NextResponse.json(
        { ok: false, error: "Failed to record usage" },
        { status: 500 }
      );
    }

    // ── Increment used_count (optimistic to avoid overcounting) ──
    await db
      .from("invite_codes")
      .update({ used_count: codeRow.used_count + 1 })
      .eq("code", code)
      .eq("used_count", codeRow.used_count);

    // ── Bust Redis cache so guard.ts re-checks DB immediately ─
    await bustEntitlement(uid);

    return NextResponse.json({
      ok: true,
      alreadyRedeemed: false,
      channel: codeRow.channel ?? null,
      expiresAt: null,
      trialDays: 15,
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Internal error";
    console.error("[api/invite/validate]", e);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}
