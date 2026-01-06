
export interface IndustryTemplate {
  id: string;
  title: string;
  desc: string;
  level: "基础" | "进阶" | "Pro";
  industryId: string;
  promptPreview: string; // Added for the runner
}

export const INDUSTRY_TEMPLATES_DB: IndustryTemplate[] = [
  // Finance
  { 
    id: "f1", 
    industryId: "finance",
    title: "行业研究报告提纲", 
    desc: "根据给定主题自动生成券商/咨询风格的研究报告结构。", 
    level: "进阶",
    promptPreview: "# Role\nInvestment Analyst\n\n# Task\nGenerate a structured research report outline for [Topic].\n\n# Structure\n1. Executive Summary\n2. Industry Overview\n3. Competitive Landscape\n4. Investment Risks"
  },
  { 
    id: "f2", 
    industryId: "finance",
    title: "财报快速解读", 
    desc: "输入财报要点，输出结构化的解读与投资视角点评。", 
    level: "Pro",
    promptPreview: "# Role\nFinancial Analyst\n\n# Task\nAnalyze the provided financial report highlights.\n\n# Output\n- Key Metrics Analysis\n- YoY/QoQ Growth\n- Management Guidance Interpretation"
  },
  
  // Product
  { 
    id: "p1", 
    industryId: "product",
    title: "PRD 需求文档生成", 
    desc: "根据一句话想法，生成规范的 PRD 结构与功能描述。", 
    level: "进阶",
    promptPreview: "# Role\nSenior Product Manager\n\n# Task\nDraft a PRD based on the user's idea.\n\n# Sections\n1. Background & Goals\n2. User Stories\n3. Functional Requirements\n4. Success Metrics"
  },
  { 
    id: "p2", 
    industryId: "product",
    title: "竞品分析对比表", 
    desc: "一键生成多维度竞品对比表和差异总结。", 
    level: "基础",
    promptPreview: "# Role\nProduct Strategist\n\n# Task\nCompare [Product A] vs [Product B].\n\n# Output\nMarkdown Table comparing:\n- Core Features\n- Pricing Strategy\n- UX/UI\n- Target Audience"
  },

  // Real Estate (Mock for demo)
  { id: "re1", industryId: "real-estate", title: "项目推介话术", desc: "针对不同客群生成话术。", level: "基础", promptPreview: "# Role\nReal Estate Agent\n\n# Task\nGenerate sales scripts for a new property." },
  
  // Operation
  { id: "op1", industryId: "operation", title: "活动策划案 SOP", desc: "从目标到执行细节的完整SOP。", level: "基础", promptPreview: "# Role\nOperations Manager\n\n# Task\nCreate an event planning SOP." },
  
  // Academic
  { id: "ac1", industryId: "academic", title: "论文摘要重写", desc: "符合期刊投稿风格的摘要优化。", level: "进阶", promptPreview: "# Role\nAcademic Editor\n\n# Task\nRewrite the abstract for clarity and impact." },
  
  // Developer
  { id: "dev1", industryId: "developer", title: "Code Review 助手", desc: "查找 Bug 并生成优化建议。", level: "进阶", promptPreview: "# Role\nSenior Engineer\n\n# Task\nReview the code for bugs, performance, and readability." },
  
  // Business
  { id: "bus1", industryId: "business", title: "商务谈判邮件", desc: "高情商商务沟通话术。", level: "基础", promptPreview: "# Role\nNegotiation Expert\n\n# Task\nDraft a negotiation email." },
  
  // Creator
  { id: "cr1", industryId: "creator", title: "小红书爆款文案", desc: "生成标题党标题与 Emoji 正文。", level: "基础", promptPreview: "# Role\nSocial Media Manager\n\n# Task\nWrite a viral post for XiaoHongShu (Red Note)." }
];
