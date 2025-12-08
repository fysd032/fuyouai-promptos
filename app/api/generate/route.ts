// app/api/generate/route.ts
// Next.js App Router 风格的 API 路由
// 先做一个“打通链路”的版本：把前端传来的内容组合一下再返回，
// 确认前端 ⇄ Vercel 后端 ⇄ CORS 都是 OK 的。

import { NextRequest, NextResponse } from 'next/server';

// 统一的 CORS 头（目前不带 cookie，所以用 * 是没问题的）
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
} as const;

// 小工具：带 CORS 的 JSON 返回
function corsJson(data: unknown, status = 200) {
  const res = NextResponse.json(data, { status });
  Object.entries(CORS_HEADERS).forEach(([k, v]) => {
    res.headers.set(k, v);
  });
  return res;
}

/**
 * 处理浏览器的预检请求（OPTIONS）
 * 只要返回 200+上面的 CORS 头就可以
 */
export async function OPTIONS() {
  return corsJson(null, 200);
}

// 前端约定的请求体结构
interface GenerateRequestBody {
  promptKey?: string;
  userInput?: string;
  options?: Record<string, unknown>;
}

/**
 * 处理真正的业务请求（POST）
 * 现在先返回“假的 AI 结果”，确认链路打通；
 * 之后你要接入真模型时，只需要在这里把 fake 部分换掉即可。
 */
export async function POST(req: NextRequest) {
  let body: GenerateRequestBody = {};

  try {
    body = (await req.json()) as GenerateRequestBody;
  } catch {
    // 如果不是合法的 JSON，就保持默认 {}
  }

  const promptKey = body.promptKey ?? 'UNKNOWN_MODULE';
  const userInput = body.userInput ?? '';

  // 模拟一个最终 Prompt，方便你在前端调试查看
  const finalPrompt = [
    `# 模块：${promptKey}`,
    '',
    '## 用户输入',
    userInput || '（没有输入内容）',
    '',
    '—— 以上为调试版本的 finalPrompt（来自 /api/generate）',
  ].join('\n');

  // 模拟一个“AI 输出结果”
  const modelOutput =
    '这是后端 /api/generate 返回的测试内容（假数据）。当前说明：\n' +
    '1）前端已经成功请求到 Vercel 后端；\n' +
    '2）CORS 设置已通过，浏览器不再报跨域错误；\n' +
    '3）接下来只需要把这里的假数据替换为真实的大模型调用即可。';

  return corsJson(
    {
      ok: true,
      promptKey,
      finalPrompt,
      modelOutput,
      echo: body, // 把原始 body 一并返回，方便前端调试
    },
    200,
  );
}
