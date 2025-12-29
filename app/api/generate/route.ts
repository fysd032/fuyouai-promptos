// app/api/generate/route.ts  (vercel 后端 / nextjs)

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const redis = Redis.fromEnv();

const worker_url = (process.env.WORKER_URL || "").replace(/\/$/, "");
const worker_token = process.env.WORKER_TOKEN || "";

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

export async function POST(req: Request) {
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
      { status: 400 }
    );
  }

  // ✅ 环境变量缺失直接报错（避免悄悄 500）
  if (!worker_url) {
    return NextResponse.json({ ok: false, error: "Missing WORKER_URL" }, { status: 500 });
  }
  if (!worker_token) {
    return NextResponse.json({ ok: false, error: "Missing WORKER_TOKEN" }, { status: 500 });
  }

  // 1) 向 worker 创建任务
  const r = await fetch(`${worker_url}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-worker-token": worker_token,
    },
    body: JSON.stringify({ promptKey, userInput, engineType }),
  });

  const workerText = await r.text().catch(() => "");

  if (!r.ok) {
    return NextResponse.json(
      { ok: false, error: `worker failed`, status: r.status, workerText },
      { status: 500 }
    );
  }

  let parsed: any = {};
  try {
    parsed = JSON.parse(workerText);
  } catch {
    parsed = {};
  }

  const jobId = parsed?.jobId;

  if (!jobId) {
    return NextResponse.json(
      { ok: false, error: "worker did not return jobId", workerText },
      { status: 500 }
    );
  }

  // ✅ 2) 关键：先写一条占位记录，避免 GET 立刻 not found
  // （即便 worker 没 Redis，前端也不会因为 404 崩掉）
  const ttlSec = 60 * 30;
  await redis
    .set(
      `job:${jobId}`,
      {
        status: "queued",
        ok: true,
        promptKey,
        engineType,
        createdAt: Date.now(),
        text: "正在生成，请耐心等待…",
        modelOutput: "正在生成，请耐心等待…",
      },
      { ex: ttlSec }
    )
    .catch(() => {});

  // 3) 立刻返回给前端
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

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ ok: false, error: "missing jobId" }, { status: 400 });

  const data = await redis.get(`job:${jobId}`).catch(() => null);

  // ✅ 关键改动：不要再返回 404 not found
  // 查不到就当作 still running（前端就不会报错）
  if (!data) {
    return NextResponse.json({
      ok: true,
      jobId,
      status: "running",
      text: "正在生成，请耐心等待…",
      modelOutput: "正在生成，请耐心等待…",
      hint: "No redis record yet. If it never becomes done, ensure worker writes job status to Redis.",
    });
  }

  return NextResponse.json({ ok: true, ...(data as any) });
}
