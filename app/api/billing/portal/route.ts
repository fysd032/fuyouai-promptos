// app/api/billing/portal/route.ts
// 获取 Creem 客户门户 URL

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
    headers["Access-Control-Allow-Origin"] = origin;
  }
  return headers;
}

type SubscriptionRow = Tables<"subscriptions">;
type SubscriptionCreemRow = Pick<SubscriptionRow, "creem_customer_id">;

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    // 1) 校验用户（优先 Authorization header）
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const supabase = await createClient();

    const { data: userData, error: userErr } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();

    if (userErr || !userData?.user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in." },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = userData.user;

    // 2) 查询用户的 creem_customer_id（关键：类型“保险丝”，避免 Vercel 推断成 never）
    const supabaseAdmin = getSupabaseAdmin();

    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("creem_customer_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .returns<SubscriptionCreemRow | null>();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!sub?.creem_customer_id) {
      return NextResponse.json(
        { ok: false, error: "No billing account found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const customerId = sub.creem_customer_id;

    // 3) 调用 Creem API 获取客户门户 URL
    const { baseUrl: creemBaseUrl, apiKey } = resolveCreemEnv();

    const appBaseUrl = process.env.APP_URL || "https://fuyouai.com";
    const returnUrl = `${appBaseUrl}/#/account/subscription`;

    const creemRes = await fetch(`${creemBaseUrl}/v1/billing_portal/sessions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify({
        customer_id: customerId,
        return_url: returnUrl,
      }),
    });

    const creemData: any = await creemRes.json().catch(() => ({}));

    if (!creemRes.ok) {
      console.error("[BillingPortal] Creem API error:", creemData);
      return NextResponse.json(
        { ok: false, error: "Failed to create billing portal session." },
        { status: 500, headers: corsHeaders }
      );
    }

    const portalUrl = creemData?.url || creemData?.portal_url;
    if (!portalUrl) {
      console.error("[BillingPortal] No portal URL in response:", creemData);
      return NextResponse.json(
        { ok: false, error: "No portal URL returned." },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({ ok: true, portalUrl }, { headers: corsHeaders });
  } catch (e: any) {
    console.error("[BillingPortal] Error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
