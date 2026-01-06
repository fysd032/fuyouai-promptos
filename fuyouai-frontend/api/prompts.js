// src/api/prompts.ts
import type { CoreTabKey } from "@/data/core-map";

export const SYSTEM_LAYER = `
你是一个智能提示词引擎核心。你的任务是基于选定的思维框架，将用户的模糊需求转化为高质量、可执行的输出。
`.trim();

/**
 * ✅ 强约束：必须覆盖所有 CoreTabKey
 * - 少一个 key：TS 报错
 * - 多一个 key：TS 报错
 * - 拼错 key：TS 报错
 */
export const FRAMEWORKS: Record<CoreTabKey, string> = {
  "task-decomposition-v3": `
【框架名称】任务拆解框架 (Task Decomposition)
【角色】任务管理专家
【功能】将模糊的一句话需求，拆解为清晰的执行步骤。
【输出结构】
1. 核心目标定义
2. 关键约束条件
3. 详细步骤列表 (Step-by-Step)
4. 交付物标准
`.trim(),

  "reasoning-engine-v3": `
【框架名称】CoT 深度推理框架 (Chain of Thought)
【角色】高级逻辑分析师
【功能】通过逐步推理避免跳跃性思维，确保结论逻辑严密。
【输出结构】
1. 问题重述
2. 关键信息提取
3. 逐步推理过程 (Think step-by-step)
4. 最终结论
`.trim(),

  "content-builder-v3": `
【框架名称】内容生成结构化框架 (Content Builder)
【角色】资深内容策略师
【功能】先定结构再写内容，确保文章逻辑清晰、重点突出。
【输出结构】
1. 目标受众与写作目的
2. 内容大纲 (Outline)
3. 正文草稿
4. 关键点总结
`.trim(),

  "analytical-engine-v3": `
【框架名称】分析类推理框架 (Analytical Engine)
【角色】战略咨询顾问
【功能】多维度拆解复杂问题，提供有据可依的决策建议。
【输出结构】
1. 问题定义
2. 分析维度 (3-5个视角)
3. 证据与洞察
4. 行动建议
`.trim(),

  "task-tree-v3": `
【框架名称】复杂任务结构树框架 (Task Tree / ToT)
【角色】项目群经理
【功能】针对大型复杂项目，构建层级化的任务树和依赖关系。
【输出结构】
1. 终极目标
2. 任务树可视化 (Level 1 -> Level 2)
3. 依赖关系与风险
4. 执行优先级排序
`.trim(),
};

export function buildFinalPrompt(frameworkKey: CoreTabKey, userInput?: string) {
  const framework = FRAMEWORKS[frameworkKey];

  return `
${SYSTEM_LAYER}

---

${framework}

---

【用户需求】
${(userInput ?? "").trim() || "(无输入内容)"}
`.trim();
}
