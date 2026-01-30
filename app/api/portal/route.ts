// app/api/portal/route.ts
// Create Creem customer portal link for the current user.

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
type SubscriptionCreemRow = Pick<SubscriptionRow, "creem_customer_id">;

function logPortalResult(params: {
  user_id: string | null;
  has_creem_customer_id: boolean;
  ok: boolean;
  error_code?: string;
}) {
  console.log("[Portal]", params);
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  if (origin && !isAllowedOrigin(origin)) {
    logPortalResult({
      user_id: null,
      has_creem_customer_id: false,
      ok: false,
      error_code: "origin_not_allowed",
    });
    return NextResponse.json(
      { error: "forbidden" },
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    const supabase = await createClient();
    const { data: userData, error: userErr } = token
      ? await supabase.auth.getUser(token)
      : await supabase.auth.getUser();

    if (userErr || !userData?.user) {
      logPortalResult({
        user_id: null,
        has_creem_customer_id: false,
        ok: false,
        error_code: "unauthorized",
      });
      return NextResponse.json(
        { error: "unauthorized" },
        { status: 401, headers: corsHeaders }
      );
    }

    const user = userData.user;
    const supabaseAdmin = getSupabaseAdmin();

    const { data: sub, error } = await supabaseAdmin
      .from("subscriptions")
      .select("creem_customer_id")
      .eq("user_id", user.id)
      .maybeSingle()
      .returns<SubscriptionCreemRow | null>();

    if (error) {
      logPortalResult({
        user_id: user.id,
        has_creem_customer_id: false,
        ok: false,
        error_code: "db_error",
      });
      return NextResponse.json(
        { error: "portal_create_failed" },
        { status: 500, headers: corsHeaders }
      );
    }

    if (!sub?.creem_customer_id) {
      logPortalResult({
        user_id: user.id,
        has_creem_customer_id: false,
        ok: false,
        error_code: "no_customer",
      });
      return NextResponse.json(
        { error: "no_customer" },
        { status: 400, headers: corsHeaders }
      );
    }

    const customerId = sub.creem_customer_id;
    const { baseUrl: creemBaseUrl, apiKey } = resolveCreemEnv();

    if (!creemBaseUrl || !apiKey) {
      console.log("[Portal] missing creem env", {
        creemBaseUrl,
        hasApiKey: Boolean(apiKey),
      });
      return NextResponse.json(
        { error: "env_missing" },
        { status: 500, headers: corsHeaders }
      );
    }

    const appBaseUrl = process.env.APP_URL || "https://fuyouai.com";
    const returnUrl = `${appBaseUrl}/account/subscription`;

    const creemRes = await fetch(`${creemBaseUrl}/v1/portal/sessions`, {
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

    const creemText = await creemRes.text().catch(() => "");
    let creemData: any = {};
    try {
      creemData = creemText ? JSON.parse(creemText) : {};
    } catch {
      creemData = {};
    }

    console.log("[Portal] creem status:", creemRes.status);
    console.log("[Portal] creem body:", creemText);
    const portalUrl = creemData?.url || creemData?.portal_url;

    if (!creemRes.ok || !portalUrl) {
      logPortalResult({
        user_id: user.id,
        has_creem_customer_id: true,
        ok: false,
        error_code: "portal_create_failed",
      });
      return NextResponse.json(
        { error: "portal_create_failed" },
        { status: 500, headers: corsHeaders }
      );
    }

    logPortalResult({
      user_id: user.id,
      has_creem_customer_id: true,
      ok: true,
    });

    return NextResponse.json({ url: portalUrl }, { headers: corsHeaders });
  } catch (e: any) {
    logPortalResult({
      user_id: null,
      has_creem_customer_id: false,
      ok: false,
      error_code: "portal_create_failed",
    });
    return NextResponse.json(
      { error: "portal_create_failed" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
