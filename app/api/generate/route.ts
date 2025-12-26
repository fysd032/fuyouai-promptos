import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = Redis.fromEnv();

function uid() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { promptKey, userInput, engineType = "deepseek" } = body || {};

  if (!promptKey || !userInput) {
    return NextResponse.json(
      { ok: false, error: "Missing promptKey or userInput" },
      { status: 400 }
    );
  }

  const id = uid();
  const key = `job:${id}`;

  // 1️⃣ 写入 Redis：queued
  await redis.set(
    key,
    {
      id,
      status: "queued",
      promptKey,
      engineType,
      text: "",
      modelOutput: "",
      createdAt: Date.now(),
    },
    { ex: 60 * 60 }
  );

  // 2️⃣ 触发 Worker（不等待）
  fetch(process.env.WORKER_RUN_URL!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.WORKER_TOKEN}`,
    },
    body: JSON.stringify({ id, promptKey, userInput, engineType }),
  }).catch(() => {});

  // 3️⃣ 立刻返回
  return NextResponse.json({
    ok: true,
    id,
    status: "queued",
  });
}
