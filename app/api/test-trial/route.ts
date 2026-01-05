import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TRIAL_DAYS = 15;

export async function GET() {
  return NextResponse.json({ ok: true, message: "test-trial api is alive" });
}

export async function POST(req: NextRequest) {
  // ✅ 运行时创建（不会在 build 阶段炸）
  const supabaseAdmin = getSupabaseAdmin();

  // 1) 读 token
  const auth = req.headers.get("authorization") || "";
  const accessToken = auth.replace("Bearer ", "").trim();
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "No token" }, { status: 401 });
  }

  // 2) 用 service role 验证 user
  const { data: userRes, error: userErr } = await supabaseAdmin.auth.getUser(accessToken);
  const user = userRes?.user;

  if (userErr || !user) {
    return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
  }

  const userId = user.id;

  // 3) 查 subscriptions 是否已有
  const { data: existing, error: selErr } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (selErr) {
    return NextResponse.json({ ok: false, error: selErr.message }, { status: 500 });
  }

  if (existing) {
    return NextResponse.json({ ok: true, message: "already", subscription: existing });
  }

  // 4) 没有就创建 trial
  const now = new Date();
  const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000);

  const { error: insErr } = await supabaseAdmin.from("subscriptions").insert({
    user_id: userId,
    status: "trialing",
    trial_start: now.toISOString(),
    trial_end: trialEnd.toISOString(),
  });

  if (insErr) {
    return NextResponse.json({ ok: false, error: insErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    message: "created",
    trial_days: TRIAL_DAYS,
    trial_end: trialEnd.toISOString(),
  });
}
