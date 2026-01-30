// app/api/webhook/creem/route.ts
// M2: Creem Webhook - 自动升级/降级用户订阅

import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { getSupabaseAdmin } from "@/lib/supabaseAdmin";
import { bustEntitlement } from "@/lib/billing/entitlement-cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// 从多种可能的路径提取 productId
function extractProductId(data: any): string | null {
  return (
    data?.product?.id ||
    data?.subscription?.product?.id ||
    data?.object?.product_id ||
    data?.object?.product?.id ||
    data?.product_id ||
    data?.productId ||
    null
  );
}

// Extract Creem customer id from multiple possible paths.
function extractCreemCustomerId(data: any): string | null {
  const directCustomer = data?.customer;
  const objectCustomer = data?.object?.customer;
  const dataCustomer = data?.data?.customer;
  const dataObjectCustomer = data?.data?.object?.customer;

  return (
    data?.data?.object?.customer_id ??
    data?.data?.object?.customerId ??
    data?.data?.object?.customer?.id ??
    (typeof dataObjectCustomer === "string" ? dataObjectCustomer : null) ??
    data?.data?.customer_id ??
    data?.data?.customer?.id ??
    (typeof dataCustomer === "string" ? dataCustomer : null) ??
    data?.customer_id ??
    data?.customerId ??
    data?.customer?.id ??
    (typeof directCustomer === "string" ? directCustomer : null) ??
    data?.object?.customer_id ??
    data?.object?.customerId ??
    data?.object?.customer?.id ??
    (typeof objectCustomer === "string" ? objectCustomer : null) ??
    data?.creem_customer_id ??
    null
  );
}
// Plan 映射：productId → plan name
function getPlanFromProductId(productId: string | null): "starter" | "pro" | null {
  if (!productId) return null;

  const starterProductId = process.env.CREEM_PRODUCT_ID_STARTER;
  const proProductId = process.env.CREEM_PRODUCT_ID_PRO;

  if (productId === starterProductId) return "starter";
  if (productId === proProductId) return "pro";
  return null;
}

// 验签：HMAC-SHA256 + timing-safe compare（防侧信道攻击）
function verifySignature(payload: string, signature: string, secret: string): boolean {
  try {
    const expectedSignature = createHmac("sha256", secret).update(payload).digest("hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    // Handle comma-separated signatures (split on comma, trim each)
    const candidates = signature.split(",").map((s) => s.trim());

    for (const candidate of candidates) {
      // Support "sha256=" prefix
     const sigRaw = candidate.startsWith("sha256=") ? candidate.slice(7) : candidate;

// ✅ 去掉所有空白（空格/换行/制表符），否则 Creem 示例那种会验签失败
const sig = sigRaw.toLowerCase().replace(/\s+/g, "");


      // Basic hex validation
      if (!/^[0-9a-f]+$/.test(sig) || sig.length % 2 !== 0) continue;

      const sigBuffer = Buffer.from(sig, "hex");

      // Compare buffer lengths (not string lengths)
      if (sigBuffer.length !== expectedBuffer.length) continue;

      if (timingSafeEqual(sigBuffer, expectedBuffer)) return true;
    }

    return false;
  } catch {
    return false;
  }
}

// 幂等：先插入 event_id，利用 primary key 唯一性
// 返回 "claimed" | "duplicate" | "error"
async function tryClaimEvent(
  supabase: any,
  eventId: string,
  eventType: string
): Promise<"claimed" | "duplicate" | "error"> {
  const { error } = await supabase.from("creem_webhook_events").insert({
    id: eventId,
    event_type: eventType,
    created_at: new Date().toISOString(),
  });

  // 插入成功 → 首次处理
  if (!error) return "claimed";

  // duplicate key error → 已处理过
  if (error.code === "23505" || error.message?.includes("duplicate")) {
    return "duplicate";
  }

  // 其他错误（数据库抖动等）→ 返回 error，让调用方返回 500 触发重试
  console.error("[Webhook][ERROR] Event claim failed:", error);
  return "error";
}

// 删除已 claim 的 event（用于 handleEvent 失败时回滚，让重试能再次处理）
async function releaseEvent(supabase: any, eventId: string): Promise<void> {
  const { error } = await supabase
    .from("creem_webhook_events")
    .delete()
    .eq("id", eventId);

  if (error) {
    console.error(`[Webhook][ERROR] Failed to release event ${eventId}:`, error);
  } else {
    console.log(`[Webhook] Released event ${eventId} for retry`);
  }
}

// GET 自检端点
export async function GET() {
  return NextResponse.json({ ok: true, message: "creem webhook endpoint alive" }, { status: 200 });
}

export async function POST(req: Request) {
  const supabaseAdmin = getSupabaseAdmin();

  try {
    // 1. 读取原始 payload
    const rawBody = await req.text();
    const signature =
      req.headers.get("creem-signature") ||
      req.headers.get("x-creem-signature") ||
      req.headers.get("signature") ||
      "";

    const headerKeys = Array.from(req.headers.keys());
    console.log("[Webhook] header keys:", headerKeys);
    console.log("[Webhook] signature present:", Boolean(signature));

    // 2. 验签（区分 test/live 环境）
    const creemEnv = (process.env.CREEM_ENV || "test").toLowerCase();
    const isLive = ["live", "prod", "production"].includes(creemEnv);

    const webhookSecret = isLive
      ? process.env.CREEM_WEBHOOK_SECRET_LIVE
      : process.env.CREEM_WEBHOOK_SECRET_TEST;

    // 环境日志（上线后可删除）
    console.log("[Webhook] env =", creemEnv);
    console.log("[Webhook] using live secret =", isLive);

    if (!webhookSecret) {
      console.error("[Webhook] Missing CREEM_WEBHOOK_SECRET_" + (isLive ? "LIVE" : "TEST"));
      return NextResponse.json({ ok: false, error: "Server misconfigured" }, { status: 500 });
    }

    if (!verifySignature(rawBody, signature, webhookSecret)) {
      console.error("[Webhook] Signature verification failed");
      return NextResponse.json({ ok: false, error: "Invalid signature" }, { status: 401 });
    }

    // 3. 解析 payload
    let payload: any;
    try {
      payload = JSON.parse(rawBody);
    } catch {
      console.error("[Webhook] Invalid JSON payload");
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    // 提取 eventId（必须存在，否则拒绝）
    const eventId = payload.id || payload.event_id || payload.eventId;
    if (!eventId) {
      console.error("[Webhook] Missing event ID in payload");
      return NextResponse.json({ ok: false, error: "Missing event ID" }, { status: 400 });
    }

    // 提取 eventType（兼容多种命名）
    const eventType = payload.eventType || payload.event_type || payload.type || "unknown";

    console.log(`[Webhook] Received event: ${eventType}, id: ${eventId}`);

    // 4. 幂等：先插入 event_id，插入失败说明已处理过
    const claimResult = await tryClaimEvent(supabaseAdmin, eventId, eventType);
    if (claimResult === "duplicate") {
      // ✅ 重复事件返回 200，防止 Creem 重试
      console.log(`[Webhook] Event ${eventId} already processed, skipping (deduped)`);
      return NextResponse.json({ ok: true, message: "deduped" });
    }
    if (claimResult === "error") {
      // 数据库错误，返回 500 让 Creem 重试
      console.error(`[Webhook][ERROR] Failed to claim event ${eventId}, returning 500 for retry`);
      return NextResponse.json({ ok: false, error: "Database error" }, { status: 500 });
    }

    // 5. 根据事件类型处理
    let result: any;
    try {
      result = await handleEvent(supabaseAdmin, eventType, payload, eventId);
    } catch (handleErr: any) {
      // handleEvent 失败 → 释放 claim，让 Creem 重试时能再次处理
      console.error(`[Webhook][ERROR] handleEvent failed for ${eventId}:`, handleErr);
      await releaseEvent(supabaseAdmin, eventId);
      return NextResponse.json({ ok: false, error: handleErr?.message || "Processing failed" }, { status: 500 });
    }

    // ✅ 所有成功处理的事件（包括 skip 场景如 missing_user_id / unknown_product）都返回 200
    // 目的：防止 Creem 因 4xx/5xx 重试，导致重复事件或用户状态抖动
    console.log(`[Webhook] Event ${eventId} processed:`, result);
    return NextResponse.json(
      { ok: true, received: true, ...result, eventId, eventType },
      { status: 200 }
    );

  } catch (e: any) {
    console.error("[Webhook][ERROR] Unexpected error:", e);
    return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
  }
}

// 升级事件类型
const UPGRADE_EVENTS = new Set([
  "checkout.completed",
  "subscription.created",
  "subscription.active",
  "subscription.paid",
  "subscription.update",
]);

// 降级事件类型（真正到期/退款后才降级）
const DOWNGRADE_EVENTS = new Set([
  "subscription.canceled",
  "subscription.expired",
  "charge.refunded",
  "refund.created",
]);

// 预约取消事件（到期末取消，保持 active，仅标记 cancel_at_period_end）
const SCHEDULED_CANCEL_EVENTS = new Set([
  "subscription.scheduled_cancel",
]);

// 事件处理逻辑
async function handleEvent(supabase: any, eventType: string, payload: any, eventId?: string) {
  if (SCHEDULED_CANCEL_EVENTS.has(eventType)) {
    return await handleScheduledCancel(supabase, payload);
  }

  if (UPGRADE_EVENTS.has(eventType)) {
    return await handleSubscriptionActive(supabase, payload, eventType, eventId);
  }

  if (DOWNGRADE_EVENTS.has(eventType)) {
    return await handleSubscriptionCanceled(supabase, payload);
  }

  console.log(`[Webhook] Unhandled event type: ${eventType}`);
  return { message: "ignored", eventType };
}

// 处理订阅激活（升级）
async function handleSubscriptionActive(supabase: any, payload: any, eventType: string, eventId?: string) {
  // 从 payload 中提取信息（兼容多种嵌套结构）
  const data = payload.data?.object || payload.object || payload.data || payload;
  const metadata = data.metadata || payload.metadata || {};

 const userId =
  metadata.user_id ||
  metadata.userId ||
  metadata.referenceId ||      // ✅ 兼容官方示例
  metadata.reference_id;

  if (!userId) {
    console.error("[Webhook][SKIP] missing_user_id - payload:", JSON.stringify(payload));
    return { message: "missing_user_id", skipped: true };
  }

  // 提取 productId（鲁棒解析）
  const productId = extractProductId(data) || extractProductId(payload);

  // 从 productId 获取 plan，或从 metadata 获取
  const plan = metadata.plan || getPlanFromProductId(productId);

  // 未知 plan 不能默认升级，必须跳过
  if (!plan) {
    console.error(`[Webhook][SKIP] unknown_product - productId: ${productId}, user_id: ${userId}`);
    return { message: "unknown_product", skipped: true, productId, userId };
  }

  const extractedCustomerId = extractCreemCustomerId(data);
  // 注意：checkout.completed 事件可能没有 subscription_id，这是正常情况。
  // 当前代码通过 fallback 到 data.id 安全处理此场景。
  const subscriptionId = data.subscription_id || data.subscriptionId || data.subscription?.id || data.id;

  let existingCustomerId: string | null = null;
  if (!extractedCustomerId) {
    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("creem_customer_id")
      .eq("user_id", userId)
      .maybeSingle();
    existingCustomerId = existingSub?.creem_customer_id ?? null;
  }

  const finalCustomerId = extractedCustomerId ?? existingCustomerId ?? undefined;

  // 更新 subscriptions 表
  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        status: "active",
        plan: plan,
        creem_customer_id: finalCustomerId ?? undefined,
        creem_subscription_id: subscriptionId || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.log("[Webhook] event:", {
      eventType,
      eventId: eventId ?? null,
      userId,
      extractedCustomerId: extractedCustomerId ?? null,
      db_write_ok: false,
      metadata_user_id:
        metadata?.user_id ??
        metadata?.userId ??
        metadata?.referenceId ??
        metadata?.reference_id ??
        null,
      final_user_id: userId || null,
      upsert_ok: false,
    });
    console.error("[Webhook] Failed to update subscription:", error);
    return { message: "db_update_failed", userId, plan, error: error.message };
  }

  console.log("[Webhook] event:", {
    eventType,
    eventId: eventId ?? null,
    userId,
    extractedCustomerId: extractedCustomerId ?? null,
    db_write_ok: true,
    metadata_user_id:
      metadata?.user_id ??
      metadata?.userId ??
      metadata?.referenceId ??
      metadata?.reference_id ??
      null,
    final_user_id: userId || null,
    upsert_ok: true,
  });
  await bustEntitlement(userId);
  console.log(`[Webhook] User ${userId} upgraded to plan: ${plan}`);
  return { message: "upgraded", userId, plan };
}

// 规范化 period_end：兼容 ISO 字符串、Unix 秒、Unix 毫秒
function normalizePeriodEnd(v: any): string | null {
  if (!v) return null;
  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v;
    return new Date(ms).toISOString();
  }
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

// 处理预约取消（到期末取消）：仅标记 cancel_at_period_end，不改 status/plan
async function handleScheduledCancel(supabase: any, payload: any) {
  const data = payload.data?.object || payload.object || payload.data || payload;
  const metadata = data.metadata || payload.metadata || {};

  const userId =
    metadata.user_id ||
    metadata.userId ||
    metadata.referenceId ||
    metadata.reference_id;

  if (!userId) {
    console.error("[Webhook][SKIP] missing_user_id_scheduled_cancel - payload:", JSON.stringify(payload));
    return { message: "missing_user_id", skipped: true };
  }

  const currentPeriodEndRaw =
    data.current_period_end_date || data.current_period_end || null;
  const currentPeriodEnd = normalizePeriodEnd(currentPeriodEndRaw);

  const { error } = await supabase
    .from("subscriptions")
    .update({
      cancel_at_period_end: true,
      current_period_end: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("[Webhook] Failed to mark scheduled cancel:", error);
    throw new Error(`DB update failed: ${error.message}`);
  }

  await bustEntitlement(userId);
  console.log(`[Webhook] User ${userId} subscription scheduled for cancellation at ${currentPeriodEnd}`);
  return { message: "scheduled_cancel", userId, current_period_end: currentPeriodEnd };
}

// 处理订阅取消/过期（降级）
async function handleSubscriptionCanceled(supabase: any, payload: any) {
  const data = payload.data?.object || payload.object || payload.data || payload;
  const metadata = data.metadata || payload.metadata || {};

  // 兼容多种 userId 字段（与升级逻辑一致）
  const userId =
    metadata.user_id ||
    metadata.userId ||
    metadata.referenceId ||
    metadata.reference_id;

  if (!userId) {
    console.error("[Webhook][SKIP] missing_user_id_cancel - payload:", JSON.stringify(payload));
    return { message: "missing_user_id", skipped: true };
  }

  // 更新 subscriptions 表：降级为 free / canceled
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "canceled",
      plan: "free",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  if (error) {
    console.error("[Webhook] Failed to cancel subscription:", error);
    throw new Error(`DB update failed: ${error.message}`);
  }

  await bustEntitlement(userId);
  console.log(`[Webhook] User ${userId} subscription canceled`);
  return { message: "canceled", userId };
}
