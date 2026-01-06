// 引用同目录下的 prompts.js
import { buildFinalPrompt } from './prompts.js';
// 引用刚才安装的谷歌工具包
import { GoogleGenerativeAI } from '@google/generative-ai';

// ---------------------------------------------------------
// 1. 这里是“厨师”部分（负责连接 Google Gemini）
// ---------------------------------------------------------
// 从环境变量获取 Key，如果本地没有配置，请确保在 Vercel 后台配置了
const apiKey = process.env.GEMINI_API_KEY; 

const genAI = new GoogleGenerativeAI(apiKey);

async function callGemini(promptText) {
  if (!apiKey) {
    throw new Error("没有找到 GEMINI_API_KEY，请检查 Vercel 环境变量设置");
  }
  
  // 使用 Gemini 1.5 Flash 模型（速度快，免费额度高）
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  
  try {
    const result = await model.generateContent(promptText);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("调用 Gemini 失败:", error);
    throw new Error("模型调用失败，请检查 API Key 或网络连接");
  }
}

// ---------------------------------------------------------
// 2. 这里是“服务员”部分（处理前端发来的请求）
// ---------------------------------------------------------
export default async function handler(req, res) {
  // 设置允许跨域（CORS），解决前端报错的关键
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // 允许任何网址访问，为了调试方便
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // 如果是浏览器先发个 OPTIONS 探路，直接放行
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许 POST 请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '只接受 POST 请求' });
  }

  try {
    // 1. 拿到前端传来的数据
    const { frameworkKey, userInput } = req.body;

    if (!userInput) {
      return res.status(400).json({ error: '请填写用户需求 (userInput)' });
    }

    // 2. 组装最终提示词（用 prompts.js 里的逻辑）
    // 如果前端忘了传 key，默认用 'task-decomposition-v3'
    const finalPrompt = buildFinalPrompt(frameworkKey || 'task-decomposition-v3', userInput);

    // 3. 呼叫厨师（调用 Gemini）
    const modelOutput = await callGemini(finalPrompt);

    // 4. 把结果打包返回给前端
    return res.status(200).json({ 
      finalPrompt: finalPrompt, 
      modelOutput: modelOutput 
    });

  } catch (error) {
    console.error("API 内部错误:", error);
    return res.status(500).json({ 
      error: error.message || '服务器内部错误' 
    });
  }
}