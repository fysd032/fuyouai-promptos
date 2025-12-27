// app/api/generate/route.ts  (Vercel 上的 Next 后端)

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const dynamic = "force-dynamic"; // 防止被缓存影响轮询
export const revalidate = 0;

const redis = Redis.fromEnv();

function envOrThrow(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export async function POST(req: Request) {
  try {
    const WORKER_URL = envOrThrow("WORKER_URL");
    const WORKER_TOKEN = envOrThrow("WORKER_TOKEN");

    const body = await req.json().catch(() => ({}));
    const { promptKey, userInput, engineType = "deepseek" } = body || {};

    if (!promptKey || !userInput) {
      return NextResponse.json(
        { ok: false, error: "Missing promptKey or userInput" },
        { status: 400 }
      );
    }

    const r = await fetch(`${WORKER_URL}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-token": WORKER_TOKEN,
      },
      body: JSON.stringify({ promptKey, userInput, engineType }),
      cache: "no-store",
    });

    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json({ ok: false, error: `Worker failed: ${t}` }, { status: 500 });
    }

    const { jobId } = await r.json();

    return NextResponse.json({
      ok: true,
      degraded: true,
      jobId,
      promptKey,
      engineType,
      text: "正在生成，请耐心等待…",
      modelOutput: "正在生成，请耐心等待…",
    });
  } catch (e: any) {
    // ✅ 这里会把“缺 env”明确返回给你
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get("jobId");
    if (!jobId) {
      return NextResponse.json({ ok: false, error: "Missing jobId" }, { status: 400 });
    }

    const data = await redis.get(`job:${jobId}`);
    if (!data) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, ...(data as any) }, { headers: { "Cache-Control": "no-store" } });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}
