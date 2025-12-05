// lib/prompts.ts

// 1) 全局 SYSTEM 模板 —— 这里先用占位内容，之后你可以从 PromptOS_v3_master 里替换
export const SYSTEM_LAYER = `
【Prompt OS v3.0 · System Layer】

你是一个遵循 FuyouAI Prompt OS v3.0 的高级 AI 助手。你必须：
- 严格遵守给定的 Role / Task / Instructions / Output 结构
- 遇到信息不足时主动提出澄清问题
- 优先给出结构化、可执行的输出
- 不编造明显不存在的事实，如有不确定需标注“假设”
`;

// 2) 五大 v3 框架 —— 现在先用简单占位，后面再用你自己的内容替换
export type FrameworkKey =
  | "task-decomposition-v3"
  | "reasoning-engine-v3"
  | "content-builder-v3"
  | "analytical-engine-v3"
  | "task-tree-tot-v3";

type FrameworkMap = Record<FrameworkKey, string>;

export const FRAMEWORKS: FrameworkMap = {
  "task-decomposition-v3": `
【任务拆解框架 v3.0】
这里以后换成你在文档里写的“任务拆解 v3.0 模板”。
目前只是占位内容。
`,

  "reasoning-engine-v3": `
【推理引擎框架 v3.0】
这里以后换成“推理引擎 v3.0 模板”。
`,

  "content-builder-v3": `
【内容生成框架 v3.0】
这里以后换成“内容生成框架 v3.0 模板”。
`,

  "analytical-engine-v3": `
【分析引擎框架 v3.0】
这里以后换成“分析引擎 v3.0 模板”。
`,

  "task-tree-tot-v3": `
【任务树 + ToT 框架 v3.0】
这里以后换成“任务树 + ToT v3.0 模板”。
`
};

// 3) 拼接最终要给大模型的 Prompt（现在我们只用来展示，不调模型）
export function buildFinalPrompt(
  frameworkKey: FrameworkKey,
  userInput: string
): string {
  const framework = FRAMEWORKS[frameworkKey];

  if (!framework) {
    return `
${SYSTEM_LAYER}

【错误】
未找到对应的框架：${frameworkKey}

【用户需求】
${userInput}
`;
  }

  return `
${SYSTEM_LAYER}

${framework}

【用户需求】
${userInput}
`;
}
