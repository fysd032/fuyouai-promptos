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

      // invite 未过期 → 直接放行（原逻辑不变）
      if (!expired) {
        return NextResponse.json({
          ok: true,
          verified: true,
          expired: false,
          expiresAt: expiresAt?.toISOString() ?? null,
        });
      }

      // invite 已过期 → 兜底检查 lifetime 永久权限
      const { data: lt } = await db
        .from("user_entitlements")
        .select("expires_at")
        .eq("user_id", userId)
        .eq("type", "lifetime")
        .maybeSingle();

      if (lt) {
        const ltExpires = lt.expires_at ? new Date(lt.expires_at) : null;
        if (!ltExpires || now < ltExpires) {
          return NextResponse.json({
            ok: true,
            verified: true,
            expired: false,
            expiresAt: ltExpires?.toISOString() ?? null,
          });
        }
      }

      // 无 lifetime → 返回过期（原逻辑）
      return NextResponse.json({
        ok: true,
        verified: false,
        expired: true,
        expiresAt: expiresAt?.toISOString() ?? null,
      });
    }

    // 2. Check user_entitlements: lifetime (永久权限，优先)
    const { data: lifetime } = await db
      .from("user_entitlements")
      .select("expires_at")
      .eq("user_id", userId)
      .eq("type", "lifetime")
      .maybeSingle();

    if (lifetime) {
      const expiresAt = lifetime.expires_at ? new Date(lifetime.expires_at) : null;
      const now = new Date();
      const expired = expiresAt !== null && now >= expiresAt;
      return NextResponse.json({
        ok: true,
        verified: !expired,
        expired,
        expiresAt: expiresAt?.toISOString() ?? null,
      });
    }

    // 3. Check user_entitlements: beta_trial (15-day trial)
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
