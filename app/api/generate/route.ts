import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const WORKER_URL = process.env.WORKER_URL!;
const WORKER_TOKEN = process.env.WORKER_TOKEN!;

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { promptKey, userInput, engineType = "deepseek" } = body || {};

  if (!promptKey || !userInput) {
    return NextResponse.json({ ok: false, error: "Missing promptKey or userInput" }, { status: 400 });
  }

  // 1) 向 Railway worker 创建任务（立刻返回 jobId）
  const r = await fetch(`${WORKER_URL}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-worker-token": WORKER_TOKEN,
    },
    body: JSON.stringify({ promptKey, userInput, engineType }),
  });

  if (!r.ok) {
    const t = await r.text();
    return NextResponse.json({ ok: false, error: `Worker failed: ${t}` }, { status: 500 });
  }

  const { jobId } = await r.json();

  // 2) 立刻返回给前端：告诉它“正在生成”，并给 jobId
  return NextResponse.json({
    ok: true,
    degraded: true,
    jobId,
    promptKey,
    engineType,
    text: "正在生成，请耐心等待…",
    modelOutput: "正在生成，请耐心等待…",
  });
}

// 前端轮询用：GET /api/generate?jobId=xxx
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ ok: false, error: "Missing jobId" }, { status: 400 });

  const data = await redis.get(`job:${jobId}`);
  if (!data) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, ...(data as any) });
}
