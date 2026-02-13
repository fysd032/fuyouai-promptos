// app/api/invite/status/route.ts
// Check if current user has already validated an invite code
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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
      return NextResponse.json({ ok: false, verified: false }, { status: 401 });
    }

    const db = getSupabaseAdmin() as any;
    const { data: usage } = await db
      .from("invite_code_usage")
      .select("code")
      .eq("user_id", userId)
      .limit(1)
      .single();

    return NextResponse.json({ ok: true, verified: !!usage });
  } catch (e: any) {
    console.error("[api/invite/status]", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal error" },
      { status: 500 }
    );
  }
}
