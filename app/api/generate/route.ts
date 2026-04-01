// app/api/generate/route.ts  (vercel 后端 / nextjs)
// ✅ 同步直出版本：不再依赖 Railway worker / 不再依赖 Redis / 不再 jobId 轮询

import { NextResponse } from "next/server";
import { withDailyLimit, requestGateTier, requestUserId } from "@/lib/billing/with-daily-limit";
import { requireSubscription } from "@/lib/billing/guard";
import { redis } from "@/lib/billing/redis";
import { getCorsHeaders as _getCorsHeaders } from "@/lib/api/cors";

function getCorsHeaders(origin: string | null) {
  return _getCorsHeaders(origin, { methods: "POST, GET, OPTIONS" });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Guest (unauthenticated): total 20 calls per IP, never resets
const GUEST_TOTAL_LIMIT = 20;

// 如果你要支持 frontModuleId/variantId，就需要能拿到 mapping 数据：
import mapping from "@/module_mapping.v2.json";

function find_prompt_key_by_mapping(frontModuleId: string, variantId: string): string | null {
  const fm = (mapping as any[]).find((x) => x.frontModuleId === frontModuleId);
  if (!fm) return null;
  const v = (fm.variants || []).find((x: any) => x.variantId === variantId);
  if (!v) return null;
  const bm = (v.backendModules || [])[0];
  return bm?.promptKey || bm?.moduleId || null;
}

/**
 * ✅ 这里是“同步直出”的核心：直接在 Vercel 调模型
 *
 * 需要你在 Vercel 环境变量里配：
 * - DEEPSEEK_API_KEY
 * 可选：
 * - DEEPSEEK_BASE_URL（默认 https://api.deepseek.com/v1/chat/completions）
 * - DEEPSEEK_MODEL（默认 deepseek-chat）
 */
async function callDeepSeek({
  promptKey,
  userInput,
}: {
  promptKey: string;
  userInput: string;
}): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY || "";
  if (!apiKey) throw new Error("Missing DEEPSEEK_API_KEY");

  const baseUrl = (process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com/v1").replace(/\/$/, "");
  const url = `${baseUrl}/chat/completions`;

  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

  // ⚠️ 先保证链路跑通：把 promptKey 放进 system
  // 你如果后面要接“真实 prompt 模板内容”，我们再把 promptKey -> promptText 映射补上
  const system = `You are a helpful assistant. promptKey=${promptKey}`;

  const payload = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: userInput },
    ],
    temperature: 0.7,
    max_tokens: 4000,
  };

  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(payload),
  });

  const raw = await r.text().catch(() => "");
  if (!r.ok) {
    // 把上游返回透出来，方便你在 Network 里直接看到原因
    throw new Error(`DeepSeek failed: ${r.status} ${raw}`);
  }

  let json: any = {};
  try {
    json = JSON.parse(raw);
  } catch {
    json = {};
  }

  const text = json?.choices?.[0]?.message?.content ?? "";
  return String(text || "");
}

// ✅ 只改“函数名”，里面逻辑不动
async function handler(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  try {
    const body = await req.json().catch(() => ({}));

    // ✅ 兼容两种输入
    let { promptKey, userInput, engineType = "deepseek" } = body || {};

    // mapping 模式：用 frontModuleId + variantId 反查 promptKey
    if (!promptKey) {
      const { frontModuleId, variantId } = body || {};
      if (frontModuleId && variantId) {
        promptKey = find_prompt_key_by_mapping(frontModuleId, variantId);
      }
    }

    if (!promptKey || !userInput) {
      return NextResponse.json(
        { ok: false, error: "missing promptKey or (frontModuleId+variantId) or userInput" },
        { status: 400, headers: corsHeaders }
      );
    }

    // ✅ 同步直出：不再创建 jobId，不再写 Redis
    if (engineType !== "deepseek") {
      // 先简单处理：都走 deepseek（你后面要接 Gemini/OpenAI 再扩展这里）
      engineType = "deepseek";
    }

    const text = await callDeepSeek({ promptKey, userInput });

    return NextResponse.json(
  {
    ok: true,
    degraded: false,
    promptKey,
    engineType,
    output: text,          // ✅ 关键：统一字段
    text,                  // 可留可不留
    modelOutput: text,     // 可留可不留
    // raw: json,          // ✅ 可选：如果你真想前端读 raw，就把解析后的 json 放出来
  },
  { headers: corsHeaders }
);

  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500, headers: corsHeaders }
    );
  }
}

// ── Guest-aware wrapper ──────────────────────────────────────
// Logged-in users → withDailyLimit (existing billing logic)
// Guest (no session) → IP-based total limit (GUEST_TOTAL_LIMIT)
const authedHandler = withDailyLimit(handler, { scope: "generate" });

async function guestAwareHandler(req: Request): Promise<Response> {
  // Check if user is logged in
  const gate = await requireSubscription({ scope: "generate" }, req);

  // Logged-in user → delegate to normal billing flow
  if (gate.ok || gate.status !== 401) {
    return authedHandler(req);
  }

  // Guest user → IP-based total limit
  const ip =
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const key = `rl:guest:generate:${ip}`;
    const count = await redis.incr(key);
    // No expiry — permanent per-IP limit

    if (count > GUEST_TOTAL_LIMIT) {
      return NextResponse.json(
        {
          ok: false,
          code: "GUEST_LIMIT_REACHED",
          error: "You've used all 20 free tries. Sign up to keep going — it's free!",
          count,
          limit: GUEST_TOTAL_LIMIT,
        },
        { status: 403, headers: corsHeaders }
      );
    }

    // Allow through — call the actual handler
    const res = await handler(req);

    // Attach remaining count header so frontend knows
    const cloned = new Response(res.body, res);
    cloned.headers.set("X-Guest-Remaining", String(GUEST_TOTAL_LIMIT - count));
    return cloned;
  } catch (err) {
    // Redis down → fail-closed for guests (deny access to protect API quota)
    console.error("[generate] Redis unavailable for guest rate-limit, denying request:", err);
    return NextResponse.json(
      { ok: false, code: "SERVICE_UNAVAILABLE", error: "Service temporarily unavailable. Please try again later." },
      { status: 503, headers: corsHeaders }
    );
  }
}

export const POST = guestAwareHandler;

export async function GET(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  // ✅ 同步版不支持轮询
  return NextResponse.json(
    { ok: false, error: "sync mode: GET(jobId) is disabled. Use POST /api/generate to get final output." },
    { status: 400, headers: corsHeaders }
  );
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
