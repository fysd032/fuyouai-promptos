// app/api/generate/route.ts  (vercel 后端 / nextjs)

import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

const worker_url = process.env.WORKER_URL!;
const worker_token = process.env.WORKER_TOKEN!;

// 如果你要支持 frontModuleId/variantId，就需要能拿到 mapping 数据：
// 方式1：直接 import 你的 module_mapping.v2.json（你 registry route 也是这么 import 的）
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

  // 1) 向 worker 创建任务
  const r = await fetch(`${worker_url}/run`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-worker-token": worker_token,
    },
    body: JSON.stringify({ promptKey, userInput, engineType }),
  });

  if (!r.ok) {
    const t = await r.text();
    return NextResponse.json({ ok: false, error: `worker failed: ${t}` }, { status: 500 });
  }

  const { jobId } = await r.json();

  // 2) 立刻返回给前端
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

  const data = await redis.get(`job:${jobId}`);
  if (!data) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  return NextResponse.json({ ok: true, ...(data as any) });
}