// app/api/billing/portal/route.ts
// 获取 Creem 客户门户 URL

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

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

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    // 校验用户（优先 Authorization header）
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const supabase = await createClient();
    let user = null;

    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error) user = data.user;
    } else {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }

    if (!user) {
      return NextResponse.json(
        { ok: false, error: "Please sign in." },
        { status: 401, headers: corsHeaders }
      );
    }

    // 查询用户的 creem_customer_id
    type SubscriptionRow = { creem_customer_id: string | null };

    const supabaseAdmin = getSupabaseAdmin();
    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("creem_customer_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500, headers: corsHeaders });
    }

    if (sub?.creem_customer_id == null) {
      return NextResponse.json({ ok: false, error: "No billing account found" }, { status: 404, headers: corsHeaders });
    }

    const customerId = sub.creem_customer_id; // string

    // 调用 Creem API 获取客户门户 URL
    const creemApiKey = process.env.CREEM_API_KEY;
    if (!creemApiKey) {
      console.error("[BillingPortal] Missing CREEM_API_KEY");
      return NextResponse.json(
        { ok: false, error: "Server misconfigured." },
        { status: 500, headers: corsHeaders }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://fuyouai.com";
    const returnUrl = `${baseUrl}/#/account/subscription`;

    const creemRes = await fetch("https://api.creem.io/v1/billing_portal/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": creemApiKey,
      },
      body: JSON.stringify({
        customer_id: customerId,
        return_url: returnUrl,
      }),
    });

    const creemData = await creemRes.json().catch(() => ({}));

    if (!creemRes.ok) {
      console.error("[BillingPortal] Creem API error:", creemData);
      return NextResponse.json(
        { ok: false, error: "Failed to create billing portal session." },
        { status: 500, headers: corsHeaders }
      );
    }

    const portalUrl = creemData.url || creemData.portal_url;
    if (!portalUrl) {
      console.error("[BillingPortal] No portal URL in response:", creemData);
      return NextResponse.json(
        { ok: false, error: "No portal URL returned." },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { ok: true, portalUrl },
      { headers: corsHeaders }
    );
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
