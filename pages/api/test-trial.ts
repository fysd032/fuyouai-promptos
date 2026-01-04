import type { NextApiRequest, NextApiResponse } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const TRIAL_DAYS = 15;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const accessToken =
    req.headers.authorization?.replace("Bearer ", "") ||
    req.body?.accessToken;

  if (!accessToken) {
    return res.status(401).json({ error: "No access token" });
  }

  // 1️⃣ 用 token 换用户
  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return res.status(401).json({ error: "Invalid session" });
  }

  const userId = user.id;

  // 2️⃣ 查有没有 subscription
  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    return res.status(200).json({
      ok: true,
      message: "Subscription already exists",
      subscription: existing,
    });
  }

  // 3️⃣ 创建 15 天试用
  const now = new Date();
  const trialEnd = new Date(
    now.getTime() + TRIAL_DAYS * 24 * 60 * 60 * 1000
  );

  const { error: insertError } = await supabaseAdmin
    .from("subscriptions")
    .insert({
      user_id: userId,
      status: "trialing",
      trial_start: now.toISOString(),
      trial_end: trialEnd.toISOString(),
    });

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  return res.status(200).json({
    ok: true,
    message: "Trial created",
    trial_end: trialEnd.toISOString(),
  });
}
