// app/api/core/run/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = {
  coreKey?: string;
  tier?: "basic" | "pro";
  input?: string;
  userInput?: string;
  text?: string;
  prompt?: string;

  // 这些即使传来也不会用（避免“历史内容”影响）
  history?: unknown;
  messages?: unknown;
  [k: string]: unknown;
};

function noStoreJson(data: any, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function pickUserText(body: Body) {
  return String(
    body.userInput ?? body.input ?? body.text ?? body.prompt ?? ""
  ).trim();
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return noStoreJson(
        { ok: false, error: "服务未配置 GEMINI_API_KEY" },
        500
      );
    }

    const body: Body = await req.json().catch(() => ({} as Body));
    const userText = pickUserText(body);

    if (!userText) {
      return noStoreJson(
        { ok: false, error: "缺少输入：请传 userInput / input / text / prompt" },
        400
      );
    }

    // 可选：根据 tier 选不同模型（你也可以先固定一个）
    const model =
      body.tier === "pro" ? "gemini-1.5-pro" : "gemini-1.5-flash";

    // 你可以在这里放“系统提示词”（不包含历史内容）
    const systemHint =
      "你是一个严格按用户当前输入回答的助手。不要复述用户之前的问题，不要输出历史对话，只输出最终答案。";

    const upstreamUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
      encodeURIComponent(apiKey);

    const upstreamBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: `${systemHint}\n\n用户输入：${userText}` }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1024,
      },
    };

    const r = await fetch(upstreamUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(upstreamBody),
    });

    const rawText = await r.text().catch(() => "");
    let data: any = {};
    try {
      data = rawText ? JSON.parse(rawText) : {};
    } catch {
      data = { raw: rawText };
    }

    if (!r.ok) {
      return noStoreJson(
        {
          ok: false,
          error:
            data?.error?.message ||
            data?.error ||
            `Gemini 上游错误: ${r.status}`,
        },
        502
      );
    }

    // 解析 Gemini 返回文本
    const output =
      data?.candidates?.[0]?.content?.parts?.map((p: any) => p?.text || "").join("") ||
      "";

    if (!output.trim()) {
      return noStoreJson(
        { ok: false, error: "Gemini 未返回可用内容" },
        502
      );
    }

    return noStoreJson({
      ok: true,
      requestId: `core-${Date.now()}`,
      output: output.trim(),
    });
  } catch (e: any) {
    return noStoreJson(
      { ok: false, error: e?.message ?? "unknown error" },
      500
    );
  }
}
