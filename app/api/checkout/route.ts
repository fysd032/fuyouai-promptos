// app/api/checkout/route.ts
// M1: Checkout API - 创建 Creem 支付会话

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveCreemEnv } from "@/lib/creem/env";

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

// Plan 映射：$29 → basic/starter, $69 → pro
const PLAN_CONFIG: Record<string, { productId: string; price: number }> = {
  basic: {
    productId: process.env.CREEM_PRODUCT_ID_STARTER || "",
    price: 29,
  },
  starter: {
    // 兼容旧版前端
    productId: process.env.CREEM_PRODUCT_ID_STARTER || "",
    price: 29,
  },
  pro: {
    productId: process.env.CREEM_PRODUCT_ID_PRO || "",
    price: 69,
  },
};

async function handler(req: Request) {
  console.log("[checkout-route] VERSION = 2026-01-31-001"
);

  // 👇 你原来的代码继续
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    // 1. 校验用户 session（优先从 Authorization header 取 token）
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    const cookieHeader = req.headers.get("cookie") || "";
    console.log("[checkout] auth header", authHeader ? "PRESENT" : "MISSING");
    console.log("[checkout] cookie header", cookieHeader ? "PRESENT" : "MISSING");
    if (!authHeader.trim()) {
      console.log("[checkout] NO AUTH HEADER");
    } else if (token) {
      console.log("[checkout] token prefix", token.slice(0, 20));
    }

    const supabase = await createClient();
    let user = null;

    if (token) {
      const { data, error } = await supabase.auth.getUser(token);
      if (!error) user = data.user;
    } else {
      // cookie 方式兜底
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }

    if (!user) {
      return NextResponse.json(
        { ok: false, code: "UNAUTHORIZED", error: "Please sign in." },
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = user.id;
    const email = user.email || "";

    // 2. 解析请求体，获取 plan
    const body = await req.json().catch(() => ({}));
    const { plan } = body; // "starter" | "pro"

    if (!plan || !PLAN_CONFIG[plan]) {
      return NextResponse.json(
        { ok: false, error: "Invalid plan. Use 'starter' or 'pro'." },
        { status: 400, headers: corsHeaders }
      );
    }

    const { productId, price } = PLAN_CONFIG[plan];

    if (!productId) {
      return NextResponse.json(
        { ok: false, error: `Missing CREEM_PRODUCT_ID_${plan.toUpperCase()} env var.` },
        { status: 500, headers: corsHeaders }
      );
    }

    // 3. 调用 Creem API 创建 checkout session
    const { baseUrl: creemBaseUrl, apiKey } = resolveCreemEnv();
    const environment = creemBaseUrl.includes("/test") ? "test" : "live";
    console.log("[checkout] creem config", {
      baseUrl: creemBaseUrl,
      apiKeyPrefix: apiKey ? apiKey.slice(0, 8) : "MISSING",
      productId,
      environment,
    });

    const appBaseUrl = process.env.APP_URL || "https://fuyouai.com";
    const successUrl = `${appBaseUrl}/#/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${appBaseUrl}/#/pricing`;

    const creemPayload = {
      product_id: productId,
      success_url: successUrl,
      request_id: `${userId}-${Date.now()}`,
      metadata: {
        user_id: userId,
        email: email,
        plan: plan,
      },
    };

    const creemRes = await fetch(`${creemBaseUrl}/v1/checkouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
      },
      body: JSON.stringify(creemPayload),
    });

    const creemData = await creemRes.json().catch(() => ({}));
    console.log("[checkout] creem response", {
      status: creemRes.status,
      body: creemData,
    });

    if (!creemRes.ok) {
      console.error("Creem API error:", creemData);
      return NextResponse.json(
        { ok: false, error: "Failed to create checkout session.", details: creemData },
        { status: 500, headers: corsHeaders }
      );
    }

    // 4. 返回 checkoutUrl
    const checkoutUrl = creemData.checkout_url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { ok: false, error: "No checkout_url in Creem response.", details: creemData },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      { ok: true, checkoutUrl },
      { headers: corsHeaders }
    );
  } catch (e: any) {
    console.error("Checkout error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: Request) {
  return handler(req);
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
