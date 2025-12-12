// lib/prompts/moduleOrder.ts
// ✅ Single human-maintained source for m1..m31 ordering.
// Do NOT put variants/promptKey here.

export const moduleOrder: Array<{
  m: string;
  frontModuleId: string;
  labelCN: string;
  labelEN?: string;
}> = [
  { m: "m1", frontModuleId: "writing_master", labelCN: "写作大师", labelEN: "Writing Master" },
  { m: "m2", frontModuleId: "deep_analysis", labelCN: "深度分析", labelEN: "Deep Analysis" },
  { m: "m3", frontModuleId: "researcher", labelCN: "研究员", labelEN: "Researcher" },
  { m: "m4", frontModuleId: "market_insights", labelCN: "市场洞察", labelEN: "Market Insights" },
  { m: "m5", frontModuleId: "paper_reader", labelCN: "文献阅读", labelEN: "Paper Reader" },
  { m: "m6", frontModuleId: "academic_study", labelCN: "学术研究", labelEN: "Academic Study" },
  { m: "m7", frontModuleId: "data_interpreter", labelCN: "数据解释", labelEN: "Data Interpreter" },
  { m: "m8", frontModuleId: "interview_gen", labelCN: "访谈生成", labelEN: "Interview Gen" },
  { m: "m9", frontModuleId: "summarizer", labelCN: "信息压缩", labelEN: "Summarizer" },
  { m: "m10", frontModuleId: "decision_maker", labelCN: "决策建议", labelEN: "Decision Maker" },

  { m: "m11", frontModuleId: "ppt_architect", labelCN: "PPT 架构师", labelEN: "PPT Architect" },
  { m: "m12", frontModuleId: "email_pro", labelCN: "邮件专家", labelEN: "Email Pro" },
  { m: "m13", frontModuleId: "copywriter", labelCN: "营销文案", labelEN: "Copywriter" },
  { m: "m14", frontModuleId: "pitch_deck", labelCN: "提案 Pitch", labelEN: "Pitch Deck" },
  { m: "m15", frontModuleId: "product_spec", labelCN: "产品说明", labelEN: "Product Spec" },
  { m: "m16", frontModuleId: "course_design", labelCN: "课程设计", labelEN: "Course Design" },
  { m: "m17", frontModuleId: "explainer", labelCN: "教学解释", labelEN: "Explainer" },
  { m: "m18", frontModuleId: "role_playing", labelCN: "角色扮演", labelEN: "Role-Playing" },
  { m: "m19", frontModuleId: "storyteller", labelCN: "故事生成", labelEN: "Storyteller" },
  { m: "m20", frontModuleId: "rewriter", labelCN: "多风格重写", labelEN: "Rewriter" },

  { m: "m21", frontModuleId: "sop_engine", labelCN: "流程优化", labelEN: "SOP Engine" },
  { m: "m22", frontModuleId: "pm_okr", labelCN: "项目规划", labelEN: "PM/OKR" },
  { m: "m23", frontModuleId: "biz_model", labelCN: "商业模型", labelEN: "Biz Model" },
  { m: "m24", frontModuleId: "tech_stack", labelCN: "技术架构", labelEN: "Tech Stack" },
  { m: "m25", frontModuleId: "debugger", labelCN: "故障诊断", labelEN: "Debugger" },
  { m: "m26", frontModuleId: "meta_prompt", labelCN: "Prompt 优化", labelEN: "Meta-Prompt" },
  { m: "m27", frontModuleId: "multi_agent", labelCN: "Agent 拆解", labelEN: "Multi-Agent" },
  { m: "m28", frontModuleId: "nocode_automation", labelCN: "No-Code 自动化" },
  { m: "m29", frontModuleId: "risk_control", labelCN: "内容审核", labelEN: "Risk Control" },
  { m: "m30", frontModuleId: "knowledge_base", labelCN: "知识库构建", labelEN: "Knowledge Base" },
  { m: "m31", frontModuleId: "writing_editor_inspector", labelCN: "智能润色与自校验" },
];
