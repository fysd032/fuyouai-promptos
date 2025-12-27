import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import mapping from "@/module_mapping.v2.json"; // ✅ 关键：用 v2 映射

export const dynamic = "force-dynamic";
export const revalidate = 0;

const redis = Redis.fromEnv();

function envOrThrow(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function findVariantPlan(frontModuleId: string, variantId: string) {
  const arr = (mapping as any); // 你的 v2 json 顶层就是数组
  const mod = arr.find((m: any) => m.frontModuleId === frontModuleId);
  const variant =
    mod?.variants?.find((v: any) => v.variantId === variantId) ?? null;

  const backendModules = variant?.backendModules ?? [];
  return { mod, variant, backendModules };
}

export async function POST(req: Request) {
  try {
    const WORKER_URL = envOrThrow("WORKER_URL");
    const WORKER_TOKEN = envOrThrow("WORKER_TOKEN");

    const body = await req.json().catch(() => ({}));
    const {
      frontModuleId,
      variantId,
      userInput,
      engineType = "deepseek",
    } = body || {};

    if (!frontModuleId || !variantId || !userInput) {
      return NextResponse.json(
        { ok: false, error: "Missing frontModuleId/variantId/userInput" },
        { status: 400 }
      );
    }

    const { backendModules } = findVariantPlan(frontModuleId, variantId);
    if (!backendModules.length) {
      return NextResponse.json(
        { ok: false, error: "No backendModules found for this variant" },
        { status: 400 }
      );
    }

    // ✅ 关键：把 plan 传给 worker
    const r = await fetch(`${WORKER_URL}/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-worker-token": WORKER_TOKEN,
      },
      body: JSON.stringify({
        plan: backendModules,
        userInput,
        engineType,
        frontModuleId,
        variantId,
      }),
      cache: "no-store",
    });

    if (!r.ok) {
      const t = await r.text();
      return NextResponse.json(
        { ok: false, error: `Worker failed: ${t}` },
        { status: 500 }
      );
    }

    const { jobId } = await r.json();
    return NextResponse.json({ ok: true, jobId, frontModuleId, variantId, engineType });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || String(e) },
      { status: 500 }
    );
  }
}

// ✅ GET 保持原样：从 redis 取 job:{jobId}
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const jobId = searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ ok: false, error: "Missing jobId" }, { status: 400 });

  const data = await redis.get(`job:${jobId}`);
  if (!data) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, ...(data as any) }, { headers: { "Cache-Control": "no-store" } });
}
