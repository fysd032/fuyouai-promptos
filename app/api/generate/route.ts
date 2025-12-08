// app/api/generate/route.ts
// Next.js App Router 风格的 API 路由

import { NextRequest, NextResponse } from 'next/server';

// 允许的前端来源：从环境变量 ALLOWED_ORIGIN 读，
// 没配的话就退回到线上站点本身
const allowedOrigin =
  process.env.ALLOWED_ORIGIN || 'https://fyouai-promptos.vercel.app';

// 小工具：统一加上 CORS 头
function withCors(body: any, status = 200) {
  const res = NextResponse.json(body, { status });
  res.headers.set('Access-Control-Allow-Origin', allowedOrigin);
  res.headers.set('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.headers.set('Access-Control-Allow-Headers', 'Content-Type');
  return res;
}

// 处理浏览器的预检请求（OPTIONS）
export async function OPTIONS() {
  return withCors(null, 200);
}

// 处理真正的业务请求（POST）
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // 🔴 这里先做一个“假数据”回显，方便我们确认前后端都打通了
  return withCors({
    ok: true,
    echo: body, // 把前端传来的东西原样返回，方便调试
    finalPrompt: '测试：这是从后端返回的 finalPrompt',
    modelOutput: '测试：这是从后端返回的 modelOutput 文本',
  });
}
