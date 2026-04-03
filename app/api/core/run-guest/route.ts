// app/api/core/run-guest/route.ts
// Unauthenticated guest access — IP-based limit: GUEST_LIMIT calls per 24h
import { NextResponse } from "next/server";
import { runEngine } from "@/lib/promptos/run-engine";
import { resolveCorePromptKey } from "@/lib/promptos/core/resolve-core";
import type { CoreKey } from "@/lib/promptos/core/core-map";
import { detectLanguage } from "@/lib/lang/detectLanguage";
import { redis } from "@/lib/billing/redis";
import { getCorsHeaders } from "@/lib/api/cors";

const GUEST_LIMIT = 2;
const GUEST_WINDOW_SECONDS = 86400; // 24h

async function consumeGuestCall(ip: string): Promise<{ ok: boolean; count: number }> {
  try {
    const key = `rl:guest:core:${ip}`;
    const count = await redis.incr(key);
    if (count === 1) redis.expire(key, GUEST_WINDOW_SECONDS).catch(() => {});
    return { ok: count <= GUEST_LIMIT, count };
  } catch (err) {
    // Redis down → fail-open with warning (blocking all guests is worse for UX)
    console.warn("[run-guest] Redis unavailable for guest rate-limit, allowing request:", err);
    return { ok: true, count: 0 };
  }
}

export async function POST(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  try {
    const ip =
      req.headers.get("x-real-ip") ??
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";

    const guestResult = await consumeGuestCall(ip);
    if (!guestResult.ok) {
      return NextResponse.json(
        {
          ok: false,
          code: "GUEST_LIMIT_REACHED",
          error: "Free preview limit reached. Sign up to continue.",
          count: guestResult.count,
          limit: GUEST_LIMIT,
        },
        { status: 402, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const coreKey = body?.coreKey as CoreKey;
    const userInput = String(body?.userInput ?? "").trim();
    const engineType = String(body?.engineType ?? "deepseek").trim();

    if (!coreKey || !userInput) {
      return NextResponse.json(
        { ok: false, error: "Missing coreKey or userInput" },
        { status: 400, headers: corsHeaders }
      );
    }

    const language = detectLanguage(userInput);
    const resolved = resolveCorePromptKey(coreKey, "basic");

    if (!resolved.ok) {
      return NextResponse.json(
        { ok: false, error: resolved.error },
        { status: 400, headers: corsHeaders }
      );
    }

    const { promptKey } = resolved;

    const engineResult = await runEngine({
      moduleId: coreKey,
      promptKey,
      engineType,
      mode: "core",
      userInput,
      language,
    });

    if (!engineResult.ok) {
      return NextResponse.json(
        { ok: false, error: engineResult.error || "Engine failed" },
        { status: 500, headers: corsHeaders }
      );
    }

    const out = String(engineResult.modelOutput ?? "").trim();
    if (!out) {
      return NextResponse.json(
        { ok: false, error: "Model returned empty output" },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        output: out,
        text: out,
        content: out,
        modelOutput: out,
        language,
        mode: engineResult.mode,
      },
      { headers: corsHeaders }
    );
  } catch (e: any) {
    console.error("[api/core/run-guest]", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "Internal error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function OPTIONS(req: Request) {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
