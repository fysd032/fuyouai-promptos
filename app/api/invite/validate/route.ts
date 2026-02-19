// app/api/invite/validate/route.ts
// Redeems an invite code, grants user_entitlements, and busts Redis entitlement cache.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { bustEntitlement } from "@/lib/billing/entitlement-cache";

// Shape returned by the redeem_invite_code PL/pgSQL function
type RedeemOk = {
  ok: true;
  alreadyRedeemed: boolean;
  channel: string | null;
  expires_at: string;
};
type RedeemFail = {
  ok: false;
  error: string;
};
type RedeemResult = RedeemOk | RedeemFail;

function isRedeemResult(v: unknown): v is RedeemResult {
  return (
    typeof v === "object" &&
    v !== null &&
    "ok" in v &&
    typeof (v as Record<string, unknown>).ok === "boolean"
  );
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

    // ── Call atomic RPC ────────────────────────────────────
    // getSupabaseAdmin() returns an untyped client (no Database generic), so
    // admin.rpc() resolves the args type to `undefined` for unknown functions.
    // Cast to `any` once here — same pattern used for custom table queries.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = getSupabaseAdmin() as any;

    const { data: rpcData, error: rpcError } = await db.rpc(
      "redeem_invite_code",
      {
        p_code: code,
        p_user_id: uid,
        p_email: userEmail ?? "",
        p_ttl_days: 15,
      }
    );

    if (rpcError) {
      console.error("[api/invite/validate] rpc error", rpcError);
      return NextResponse.json(
        { ok: false, error: rpcError.message ?? "Internal error" },
        { status: 500 }
      );
    }

    if (!isRedeemResult(rpcData)) {
      console.error("[api/invite/validate] unexpected rpc response", rpcData);
      return NextResponse.json(
        { ok: false, error: "Unexpected server response" },
        { status: 500 }
      );
    }

    const result = rpcData;

    if (!result.ok) {
      // RPC returned a business error (invalid / disabled / exhausted)
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: 400 }
      );
    }

    // ── Bust Redis cache so guard.ts re-checks DB immediately ─
    await bustEntitlement(uid);

    return NextResponse.json({
      ok: true,
      alreadyRedeemed: result.alreadyRedeemed,
      channel: result.channel ?? null,
      expiresAt: result.expires_at,
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
