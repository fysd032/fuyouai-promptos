// app/api/subscription/cancel/route.ts
// Schedule cancel at period end for the current user's subscription.

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { resolveCreemEnv } from "@/lib/creem/env";
import type { Tables } from "@/types/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const allowedOrigins = new Set([
  "https://fuyouai-promptos.vercel.app",
  "https://fuyouai.com",
  "https://www.fuyouai.com",
]);

function isAllowedOrigin(origin: string | null) {
  if (!origin) return false;
  if (allowedOrigins.has(origin)) return true;
  return /^https:\/\/fuyouai-promptos.*\.vercel\.app$/i.test(origin);
}

function getCorsHeaders(origin: string | null) {
  const headers: Record<string, string> = {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin as string;
  }
  return headers;
}

type SubscriptionRow = Tables<"subscriptions">;
type SubscriptionLookupRow = Pick<
  SubscriptionRow,
  "creem_subscription_id" | "cancel_at_period_end" | "current_period_end"
>;

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (origin && !isAllowedOrigin(origin)) {
    return NextResponse.json(
      { ok: false, error: "forbidden" },
      { status: 403, headers: corsHeaders }
    );
  }

  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  const supabase = await createClient();
  const { data: userData, error: userErr } = token
    ? await supabase.auth.getUser(token)
    : await supabase.auth.getUser();

  if (userErr || !userData?.user) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401, headers: corsHeaders }
    );
  }

  const user = userData.user;
  const supabaseAdmin = getSupabaseAdmin();

  const { data: sub, error } = await supabaseAdmin
    .from("subscriptions")
    .select("creem_subscription_id, cancel_at_period_end, current_period_end")
    .eq("user_id", user.id)
    .maybeSingle()
    .returns<SubscriptionLookupRow | null>();

  if (error) {
    console.error("[Cancel] DB error:", error);
    return NextResponse.json(
      { ok: false, error: "db_error" },
      { status: 500, headers: corsHeaders }
    );
  }

  if (!sub?.creem_subscription_id) {
    return NextResponse.json(
      { ok: false, error: "no_subscription_id" },
      { status: 400, headers: corsHeaders }
    );
  }

  if (sub.cancel_at_period_end) {
    return NextResponse.json(
      {
        ok: true,
        message: "already_scheduled",
        current_period_end: sub.current_period_end || null,
      },
      { headers: corsHeaders }
    );
  }

  const { baseUrl: creemBaseUrl, apiKey } = resolveCreemEnv();
  if (!creemBaseUrl || !apiKey) {
    console.error("[Cancel] missing creem env");
    return NextResponse.json(
      { ok: false, error: "env_missing" },
      { status: 500, headers: corsHeaders }
    );
  }

  const cancelRes = await fetch(
    `${creemBaseUrl}/v1/subscriptions/${encodeURIComponent(sub.creem_subscription_id)}/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({}),
    }
  );

  const cancelText = await cancelRes.text().catch(() => "");
  let cancelData: any = {};
  try {
    cancelData = cancelText ? JSON.parse(cancelText) : {};
  } catch {
    cancelData = {};
  }

  if (!cancelRes.ok) {
    console.error("[Cancel] creem status:", cancelRes.status);
    console.error("[Cancel] creem body:", cancelText);
    return NextResponse.json(
      { ok: false, error: "cancel_failed" },
      { status: 502, headers: corsHeaders }
    );
  }

  const currentPeriodEnd =
    cancelData?.current_period_end ??
    cancelData?.current_period_end_date ??
    cancelData?.period_end ??
    cancelData?.current_period_end_at ??
    null;

  const { error: updateErr } = await supabaseAdmin
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      current_period_end: currentPeriodEnd,
    })
    .eq("user_id", user.id);

  if (updateErr) {
    console.error("[Cancel] DB update error:", updateErr);
    return NextResponse.json(
      { ok: false, error: "db_update_failed" },
      { status: 500, headers: corsHeaders }
    );
  }

  return NextResponse.json(
    { ok: true, current_period_end: currentPeriodEnd },
    { headers: corsHeaders }
  );
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
