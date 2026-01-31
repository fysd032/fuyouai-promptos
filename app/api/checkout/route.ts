// app/api/checkout/route.ts
// Checkout API - 创建 Creem 支付会话（支持重新订阅）
// ✅ basic 使用 CREEM_PRODUCT_ID_BASIC
// ✅ pro 使用 CREEM_PRODUCT_ID_PRO
// ✅ starter 兼容旧前端（等同 basic）
// ✅ active（含 cancel_at_period_end=true 但仍有效）不创建 checkout，返回 alreadySubscribed=true
// ✅ inactive/canceled/expired 允许重新 checkout
// 🔧 FIX: 移除 cancel_url 以解决 "property cancel_url should not exist" 错误

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

type PlanKey = "basic" | "starter" | "pro";

const PLAN_CONFIG: Record<PlanKey, { productIdEnvKey: string; price: number }> = {
  basic: { productIdEnvKey: "CREEM_PRODUCT_ID_BASIC", price: 29 },
  starter: { productIdEnvKey: "CREEM_PRODUCT_ID_BASIC", price: 29 }, // 兼容旧版前端
  pro: { productIdEnvKey: "CREEM_PRODUCT_ID_PRO", price: 69 },
};

type SubscriptionRow = {
  plan: string | null;
  status: string | null; // active/inactive/canceled/past_due/expired...
  cancel_at_period_end: boolean | null;
  current_period_end: string | number | null; // 可能是 ISO 字符串或秒级时间戳
  trial_end: string | number | null;
  creem_customer_id: string | null;
  creem_subscription_id: string | null;
  updated_at: string | null;
};

function toMillis(ts: string | number | null): number | null {
  if (ts == null) return null;
  if (typeof ts === "number") {
    // 兼容秒/毫秒
    return ts > 10_000_000_000 ? ts : ts * 1000;
  }
  // ISO string
  const d = Date.parse(ts);
  return Number.isNaN(d) ? null : d;
}

function isSubscriptionCurrentlyActive(sub: SubscriptionRow | null): boolean {
  if (!sub) return false;
  const status = (sub.status || "").toLowerCase();
  if (status !== "active" && status !== "trialing") return false;

  const endMs = toMillis(sub.current_period_end);
  if (endMs == null) return true; // 没有 end 也先视为有效（保守）
  return endMs > Date.now();
}

async function handler(req: Request) {
  console.log("[checkout-route] VERSION=2026-01-31-003-FIXED");

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    // 可选：全局开关（防止线上误触发）
    // 默认启用；如果你希望严格控制：把 BILLING_ENABLED=1 才允许
    const billingEnabled = process.env.BILLING_ENABLED;
    if (billingEnabled === "0") {
      return NextResponse.json(
        { ok: false, error: "Billing is disabled." },
        { status: 503, headers: corsHeaders }
      );
    }

    // 1) 校验用户 session（优先 Authorization header）
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    console.log("[checkout] auth header", authHeader ? "PRESENT" : "MISSING");
    if (token) console.log("[checkout] token prefix", token.slice(0, 16));

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
        { ok: false, code: "UNAUTHORIZED", error: "Please sign in." },
        { status: 401, headers: corsHeaders }
      );
    }

    const userId = user.id;
    const email = user.email || "";

    // 2) 解析 plan
    const body = await req.json().catch(() => ({}));
    const rawPlan = (body?.plan || "").toString().trim().toLowerCase();

    const plan = (rawPlan || "basic") as PlanKey;

    if (!PLAN_CONFIG[plan]) {
      return NextResponse.json(
        { ok: false, error: "Invalid plan. Use 'basic' or 'pro'." },
        { status: 400, headers: corsHeaders }
      );
    }

    // 3) 读取当前订阅（用于：active 不创建 checkout；inactive 允许重新订阅）
    const { data: subRow, error: subErr } = await supabase
      .from("subscriptions")
      .select(
        "plan,status,cancel_at_period_end,current_period_end,trial_end,creem_customer_id,creem_subscription_id,updated_at"
      )
      .eq("user_id", userId)
      .maybeSingle();

    if (subErr) {
      console.warn("[checkout] subscription query error", subErr);
    }

    const subscription = (subRow &&
      typeof subRow === "object" &&
      subRow.creem_subscription_id
    )
      ? (subRow as SubscriptionRow)
      : null;

    // ✅ 如果当前仍有效（包括 cancel_at_period_end=true 但仍在周期内），不应该再创建新 checkout
    if (isSubscriptionCurrentlyActive(subscription)) {
      return NextResponse.json(
        {
          ok: true,
          alreadySubscribed: true,
          subscription,
          message:
            subscription?.cancel_at_period_end
              ? "Subscription is active until period end (renewal canceled)."
              : "Subscription is active.",
        },
        { headers: corsHeaders }
      );
    }

    // 4) 选择产品 ID（从 env）
    const { productIdEnvKey, price } = PLAN_CONFIG[plan];
    const productId = (process.env[productIdEnvKey] || "").trim();

    console.log("[checkout env-check]", {
      plan,
      productIdEnvKey,
      hasProductId: !!productId,
      productIdLen: productId.length,
      hasBasic: !!process.env.CREEM_PRODUCT_ID_BASIC,
      hasPro: !!process.env.CREEM_PRODUCT_ID_PRO,
    });

    if (!productId) {
      return NextResponse.json(
        { ok: false, error: `Missing ${productIdEnvKey} env var.` },
        { status: 500, headers: corsHeaders }
      );
    }

    // 5) 调用 Creem API 创建 checkout
    const { baseUrl: creemBaseUrl, apiKey } = resolveCreemEnv();
    const environment = creemBaseUrl.includes("/test") ? "test" : "live";

    console.log("[checkout] creem config", {
      baseUrl: creemBaseUrl,
      apiKeyPrefix: apiKey ? apiKey.slice(0, 8) : "MISSING",
      productId,
      price,
      environment,
    });

    const appBaseUrl = (process.env.APP_URL || "https://fuyouai.com").replace(/\/$/, "");
    const successUrl = `${appBaseUrl}/#/checkout/success?session_id={CHECKOUT_SESSION_ID}`;

    // 🔧 FIX: 移除 cancel_url，只保留 success_url
    const creemPayload: any = {
      product_id: productId,
      success_url: successUrl,
      // cancel_url: cancelUrl, // ❌ 移除此行以解决 "property cancel_url should not exist" 错误
      request_id: `${userId}-${Date.now()}`,
      metadata: {
        user_id: userId,
        email,
        plan, // basic/pro
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
      hasCheckoutUrl: !!creemData?.checkout_url,
    });

    if (!creemRes.ok) {
      console.error("[checkout] Creem API error:", creemData);
      return NextResponse.json(
        { ok: false, error: "Failed to create checkout session.", details: creemData },
        { status: 500, headers: corsHeaders }
      );
    }

    const checkoutUrl = creemData?.checkout_url;

    if (!checkoutUrl) {
      return NextResponse.json(
        { ok: false, error: "No checkout_url in Creem response.", details: creemData },
        { status: 500, headers: corsHeaders }
      );
    }

    // ✅ 正常返回 checkoutUrl；前端拿到后 window.location.href = checkoutUrl
    return NextResponse.json(
      {
        ok: true,
        checkoutUrl,
        subscription: subscription || { plan: "free", status: "inactive" },
      },
      { headers: corsHeaders }
    );
  } catch (e: any) {
    console.error("[checkout] error:", e);
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