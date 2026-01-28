// app/api/subscription/route.ts
// 获取当前用户的订阅状态
// 统一返回结构：{ ok, subscription: { plan, status, creem_customer_id, creem_subscription_id, updated_at } | null }

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

const DEBUG = process.env.DEBUG_SUBSCRIPTION === "true";

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
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
  if (isAllowedOrigin(origin)) {
    headers["Access-Control-Allow-Origin"] = origin as string;
  }
  return headers;
}

// 规范化 plan 字段：只允许 "basic" | "pro" | "free"
// 数据库里的 "starter" 映射为 "basic"
function normalizePlan(plan: string | null | undefined): "basic" | "pro" | "free" {
  if (!plan) return "free";
  const p = plan.toLowerCase();
  if (p === "starter" || p === "basic") return "basic";
  if (p === "pro") return "pro";
  return "free";
}

// 规范化 status 字段：只允许 "active" | "inactive"
function normalizeStatus(status: string | null | undefined): "active" | "inactive" {
  if (!status) return "inactive";
  if (["active", "trialing"].includes(status)) return "active";
  return "inactive";
}

export async function GET(req: Request) {
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
        { ok: false, error: "Please sign in" },
        { status: 401, headers: corsHeaders }
      );
    }

    // 使用 admin client 绕过 RLS（用户已通过 token 验证）
    const supabaseAdmin = getSupabaseAdmin();
    const supabaseUrl = process.env.SUPABASE_URL || "";

    // 查询 subscriptions 表
    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("plan, status, trial_end, updated_at, creem_customer_id, creem_subscription_id")
      .eq("user_id", user.id)
      .maybeSingle();

    // Debug 日志
    console.log("[Subscription] user_id:", user.id);
    console.log("[Subscription] origin:", origin);
    console.log("[Subscription] found:", Boolean(sub));
    if (sub) {
      console.log("[Subscription] plan:", sub?.plan, "status:", sub?.status);
    }
    if (error) {
      console.log("[Subscription] error:", error?.code, error?.message);
    }

    // 构建 debug 信息（仅 DEBUG=true 时返回）
    const debugInfo = DEBUG ? {
      user_id: user.id,
      supabase_url_host: supabaseUrl ? new URL(supabaseUrl).host : null,
      query_error: error ? { code: error.code, message: error.message } : null,
      found: Boolean(sub),
    } : undefined;

    if (error) {
      console.error("[Subscription] DB error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to fetch subscription.", ...(debugInfo ? { debug: debugInfo } : {}) },
        { status: 500, headers: corsHeaders }
      );
    }

    // 没有订阅记录 → 返回 subscription: null（前端据此判断为 free）
    if (!sub) {
      console.log("[Subscription] No record found, returning null");
      return NextResponse.json(
        { ok: true, subscription: null, ...(debugInfo ? { debug: debugInfo } : {}) },
        { headers: corsHeaders }
      );
    }

    // 返回订阅信息（统一结构）
    const normalizedPlan = normalizePlan(sub.plan);
    const normalizedStatus = normalizeStatus(sub.status);
    return NextResponse.json(
      {
        ok: true,
        subscription: {
          plan: normalizedPlan,
          status: normalizedStatus,
          trialEnd: sub.status === "trialing" ? sub.trial_end : null,
          creem_customer_id: sub.creem_customer_id || null,
          creem_subscription_id: sub.creem_subscription_id || null,
          updated_at: sub.updated_at || null,
        },
        ...(debugInfo ? { debug: debugInfo } : {}),
      },
      { headers: corsHeaders }
    );
  } catch (e: any) {
    console.error("[Subscription] Error:", e);
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
