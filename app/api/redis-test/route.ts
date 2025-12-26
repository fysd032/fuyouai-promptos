import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

export async function GET() {
  await redis.set("ping", { ok: true, t: Date.now() });
  const v = await redis.get("ping");
  return NextResponse.json({ ok: true, v });
}
