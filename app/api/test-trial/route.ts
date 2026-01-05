import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";


const TRIAL_DAYS = 15;

export async function GET() {
  return NextResponse.json({ ok: true, message: "test-trial api is alive" });
}

export async function POST(req: NextRequest) {
      const supabaseAdmin = getSupabaseAdmin(); // ✅ 在运行时创建
  const auth = req.headers.get("authorization") || "";
  const accessToken = auth.replace("Bearer ", "").trim();

  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "No token" }, { status: 401 });
  }

  const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
  const user = userRes?.user;

  if (userErr || !user) {
    return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
  }

  const userId = user.id;

  // 查是否已存在
  const { data: existing, error: selErr } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (selErr) return NextResponse.json({ ok: false, error: selErr.message }, { status: 500 });

  if (existing) {
    return NextResponse.json({ ok: true, message: "already", subscription: existing });
  }

  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const { error: insErr } = await supabaseAdmin.from("subscriptions").insert({
    user_id: userId,
    status: "trialing",
    trial_start: now.toISOString(),
    trial_end: trialEnd.toISOString(),
  });

  if (insErr) return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, message: "created", trial_end: trialEnd.toISOString() });
}

