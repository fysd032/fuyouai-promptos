import { 
  Zap,
  PenTool, 
  Search,
  Briefcase,
  ShoppingBag,
  BookOpen,
  Code,
  Layout,
  Shield,
  Cpu
} from "lucide-react";

export type ModuleCategory = "All" | "Writing" | "Analysis" | "Business" | "Strategy" | "Product" | "Academic" | "Development";

export interface CategoryItem {
  id: ModuleCategory;
  label: string;
  icon: any; 
}

export const CATEGORIES: CategoryItem[] = [
  { id: "All", label: "全部", icon: Zap },
  { id: "Analysis", label: "分析认知", icon: Search },
  { id: "Writing", label: "内容创作", icon: PenTool },
  { id: "Business", label: "商业职场", icon: Briefcase },
  { id: "Strategy", label: "策略执行", icon: Layout },
  { id: "Product", label: "产品设计", icon: ShoppingBag },
  { id: "Academic", label: "学术研究", icon: BookOpen },
  { id: "Development", label: "技术开发", icon: Code },
];

export interface ModuleItem {
  id: string;
  title: string;
  desc: string;
  category: ModuleCategory;
  promptPreview: string;
}

export const MODULES_DB: ModuleItem[] = [
  // --- A 类：知识 / 理解 / 分析 (m1-m10) ---
  {
    id: "m1",
    title: "写作大师 (Writing Master)",
    desc: "结构化、分层、多风格文本输出引擎。",
    category: "Writing",
    promptPreview: `# Role
Master Writer & Editor

# Task
Generate structured, multi-layered text based on the user's topic.

# Guidelines
1. Adapt tone to the request (Professional, Casual, Academic, etc.).
2. Use clear hierarchy (H1, H2, Bullet points).
3. Ensure logical flow and coherence.`
  },
  {
    id: "m2",
    title: "深度分析 (Deep Analysis)",
    desc: "拆解问题、找关键因子、做推断、做决策树。",
    category: "Analysis",
    promptPreview: `# Role
Senior Strategic Analyst

# Task
Deconstruct the problem, identify key factors, and provide logical inferences.

# Steps
1. Break down the core issue.
2. Analyze 3-5 key drivers.
3. Construct a decision tree or logical flow.
4. Provide a final synthesis.`
  },
  {
    id: "m3",
    title: "研究员 (Researcher)",
    desc: "像研究员一样做 Literature Review 和构建研究框架。",
    category: "Analysis",
    promptPreview: `# Role
Academic Researcher

# Task
Conduct a comprehensive review and build a research framework.

# Output Structure
1. Background & Context
2. Key Theories/Models
3. Methodology Framework
4. Research Gaps & Opportunities`
  },
  {
    id: "m4",
    title: "市场洞察 (Market Insights)",
    desc: "行业分析、竞争格局、用户洞察、趋势预测。",
    category: "Business",
    promptPreview: `# Role
Market Intelligence Consultant

# Task
Analyze the industry landscape and competition.

# Framework (PESTEL/Porter's 5 Forces)
- Industry Trends (Macro)
- Competitive Landscape (Micro)
- Consumer Insights
- Future Predictions`
  },
  {
    id: "m5",
    title: "文献阅读 (Paper Reader)",
    desc: "读论文、提炼要点、转换成通俗语言。",
    category: "Academic",
    promptPreview: `# Role
Scientific Communicator

# Task
Summarize academic papers into clear, accessible insights.

# Output
1. Core Hypothesis
2. Methodology (Simplified)
3. Key Findings
4. Practical Implications (TL;DR)`
  },
  {
    id: "m6",
    title: "学术研究 (Academic Study)",
    desc: "理论框架构建、模型解释、实验设计、引用格式。",
    category: "Academic",
    promptPreview: `# Role
PhD Supervisor

# Task
Assist in constructing theoretical frameworks and experimental designs.

# Steps
1. Define the research question.
2. Propose a theoretical model.
3. Design the experiment (Variables, Controls).
4. Format citations (APA/MLA).`
  },
  {
    id: "m7",
    title: "数据解释 (Data Interpreter)",
    desc: "读取表格/报表/数据集 -> 解释、分析、可视化建议。",
    category: "Analysis",
    promptPreview: `# Role
Data Scientist

# Task
Interpret the provided data/tables and derive actionable insights.

# Output
1. Key Trends & Anomalies
2. Statistical Significance
3. Correlation Analysis
4. Visualization Recommendations`
  },
  {
    id: "m8",
    title: "访谈生成 (Interview Gen)",
    desc: "根据场景自动生成深入访谈问题。",
    category: "Business",
    promptPreview: `# Role
Senior User Researcher

# Task
Generate deep interview questions for [Target Audience].

# Structure
1. Warm-up Questions
2. Core Behavioral Questions (STAR Method)
3. Deep Dive/Probing Questions
4. Closing Questions`
  },
  {
    id: "m9",
    title: "信息压缩 (Summarizer)",
    desc: "长文浓缩、分层摘要、多角度摘要。",
    category: "Writing",
    promptPreview: `# Role
Executive Summarizer

# Task
Compress the provided text into a high-density summary.

# Levels
- Level 1: One-sentence "Elevator Pitch"
- Level 2: 3 Key Takeaways
- Level 3: Structured Executive Summary`
  },
  {
    id: "m10",
    title: "决策建议 (Decision Maker)",
    desc: "权衡利弊、列出方案、给出优先级与推荐理由。",
    category: "Strategy",
    promptPreview: `# Role
Strategic Advisor

# Task
Evaluate options and provide a decision matrix.

# Output
1. Option Analysis (Pros/Cons)
2. Trade-off Matrix
3. Recommended Course of Action
4. Reasoning & Risk Mitigation`
  },

  // --- B 类：内容 / 传播 / 表达 (m11-m20) ---
  {
    id: "m11",
    title: "PPT 架构师 (PPT Architect)",
    desc: "自动生成提纲、内容结构、视觉建议。",
    category: "Product",
    promptPreview: `# Role
Presentation Designer

# Task
Create a PPT outline and visual guide.

# Slide Structure
- Slide Title
- Key Talking Points (Bullets)
- Visual Concept (Chart/Image/Icon)
- Speaker Notes`
  },
  {
    id: "m12",
    title: "邮件专家 (Email Pro)",
    desc: "专业邮件、商务邮件、客户沟通、冷启动邮件。",
    category: "Business",
    promptPreview: `# Role
Business Communication Expert

# Task
Draft a professional email based on the context.

# Requirements
- Clear Subject Line
- Professional Tone (Polite & Direct)
- Clear Call to Action (CTA)`
  },
  {
    id: "m13",
    title: "营销文案 (Copywriter)",
    desc: "海报文案、短视频脚本、社媒内容、Slogan。",
    category: "Writing",
    promptPreview: `# Role
Creative Copywriter

# Task
Generate engaging marketing copy.

# Formats
1. Headline/Hook (Grab attention)
2. Body/Story (Build interest)
3. CTA (Drive action)
4. Viral Slogan Variations`
  },
  {
    id: "m14",
    title: "提案 Pitch (Pitch Deck)",
    desc: "BP 提案、融资材料、路演大纲、价值链。",
    category: "Business",
    promptPreview: `# Role
Venture Capital Consultant

# Task
Structure a winning Pitch Deck/BP.

# Sections
1. Problem & Pain Point
2. Solution & Value Prop
3. Market Size (TAM/SAM/SOM)
4. Business Model & Traction`
  },
  {
    id: "m15",
    title: "产品说明 (Product Spec)",
    desc: "PRD、产品卖点、功能拆解、用户故事。",
    category: "Product",
    promptPreview: `# Role
Product Manager

# Task
Draft a PRD or Feature Specification.

# Structure
1. User Story (As a... I want to... So that...)
2. Acceptance Criteria
3. Functional Requirements
4. Edge Cases`
  },
  {
    id: "m16",
    title: "课程设计 (Course Design)",
    desc: "设计课程大纲、分章节内容、讲义示例。",
    category: "Academic",
    promptPreview: `# Role
Instructional Designer

# Task
Design a comprehensive course syllabus.

# Output
1. Learning Objectives (Bloom's Taxonomy)
2. Module Breakdown
3. Key Concepts per Module
4. Assessment Methods`
  },
  {
    id: "m17",
    title: "教学解释 (Explainer)",
    desc: "用比喻、例子、类比方式让复杂知识简单化。",
    category: "Academic",
    promptPreview: `# Role
Master Teacher (Feynman Technique)

# Task
Explain [Complex Topic] simply.

# Method
1. Use a clear Analogy.
2. Avoid Jargon (or explain it).
3. Provide a Concrete Example.
4. Check for Understanding.`
  },
  {
    id: "m18",
    title: "角色扮演 (Role-Playing)",
    desc: "模拟用户、专家、投资人、学生、老板。",
    category: "Writing",
    promptPreview: `# Role
Simulator

# Task
Act as [Specific Persona] to simulate a conversation.

# Persona Traits
- Knowledge Base: [Specific Domain]
- Tone: [Specific Tone]
- Goal: Challenge/Validate/Question the user.`
  },
  {
    id: "m19",
    title: "故事生成 (Storyteller)",
    desc: "小说、儿童故事、寓言、教育性故事。",
    category: "Writing",
    promptPreview: `# Role
Creative Storyteller

# Task
Write a story based on the prompt.

# Elements
1. Character Arch
2. Plot (Inciting Incident -> Climax -> Resolution)
3. Setting & Atmosphere
4. Theme/Moral`
  },
  {
    id: "m20",
    title: "多风格重写 (Rewriter)",
    desc: "专业版 / 轻松版 / 梗图版 / 科普版 / 学术版。",
    category: "Writing",
    promptPreview: `# Role
Style Transfer Engine

# Task
Rewrite the provided text into the following styles:

1. Professional/Corporate
2. Casual/Gen Z
3. Academic/Formal
4. ELI5 (Explain Like I'm 5)`
  },

  // --- C 类：解决方案 / 自动化 / 项目执行 (m21-m30) ---
  {
    id: "m21",
    title: "流程优化 (SOP Engine)",
    desc: "SOP、流程图、角色分工、优化建议。",
    category: "Strategy",
    promptPreview: `# Role
Operations Manager

# Task
Create a Standard Operating Procedure (SOP).

# Format
1. Objective
2. Stakeholders & Roles
3. Step-by-Step Process Flow
4. Exception Handling`
  },
  {
    id: "m22",
    title: "项目规划 (PM/OKR)",
    desc: "拆任务、排时间、里程碑、优先级矩阵。",
    category: "Strategy",
    promptPreview: `# Role
Project Manager (PMP)

# Task
Create a project execution plan.

# Output
1. WBS (Work Breakdown Structure)
2. Timeline & Milestones (Gantt style)
3. RACI Matrix
4. Risk Management`
  },
  {
    id: "m23",
    title: "商业模型 (Biz Model)",
    desc: "收入模型、成本结构、用户增长路径。",
    category: "Strategy",
    promptPreview: `# Role
Business Strategist

# Task
Design a Business Model Canvas.

# Components
1. Value Proposition
2. Customer Segments
3. Revenue Streams
4. Cost Structure & Key Resources`
  },
  {
    id: "m24",
    title: "技术架构 (Tech Stack)",
    desc: "产品结构、前后端架构、数据流、API 设计。",
    category: "Development",
    promptPreview: `# Role
Solution Architect

# Task
Design the technical architecture for the system.

# Output
1. Tech Stack Selection (Frontend/Backend/DB)
2. System Diagram Description
3. Data Flow
4. API Design Principles`
  },
  {
    id: "m25",
    title: "故障诊断 (Debugger)",
    desc: "前端报错、API 报错、逻辑错误诊断 + 修复方案。",
    category: "Development",
    promptPreview: `# Role
Senior DevOps Engineer

# Task
Analyze the error log/symptom and provide a fix.

# Steps
1. Identify the Root Cause.
2. Explain *Why* it happened.
3. Provide a Code Fix.
4. Suggest Prevention Measures.`
  },
  {
    id: "m26",
    title: "Prompt 优化 (Meta-Prompt)",
    desc: "根据用户提供的 prompt 优化、升级、重写。",
    category: "Strategy",
    promptPreview: `# Role
Prompt Engineer

# Task
Optimize the user's prompt for LLMs.

# Optimization Goals
1. Clarity & Specificity
2. Structural Integrity (Role-Task-Constraint)
3. Reducing Hallucinations
4. Adding Few-Shot Examples`
  },
  {
    id: "m27",
    title: "Agent 拆解 (Multi-Agent)",
    desc: "把复杂任务拆成多个 Agent 节点 + 协作流程。",
    category: "Strategy",
    promptPreview: `# Role
AI Systems Architect

# Task
Design a Multi-Agent System (MAS) workflow.

# Nodes
1. Agent A (Role & Goal)
2. Agent B (Role & Goal)
3. Hand-off Protocol (A -> B)
4. Supervisor/Reviewer Node`
  },
  {
    id: "m28",
    title: "No-Code 自动化",
    desc: "n8n / Zapier 流程设计、Webhook、触发器规划。",
    category: "Strategy",
    promptPreview: `# Role
Automation Specialist

# Task
Design a No-Code workflow automation.

# Flow
1. Trigger Event (Webhook/Time)
2. Logic/Filter
3. Action A (e.g., Update DB)
4. Action B (e.g., Send Notification)`
  },
  {
    id: "m29",
    title: "内容审核 (Risk Control)",
    desc: "检查敏感内容、政策风险、错误信息。",
    category: "Strategy",
    promptPreview: `# Role
Trust & Safety Specialist

# Task
Audit the content for risks.

# Checklist
- [ ] Hate Speech/Harassment
- [ ] Misinformation
- [ ] PII (Personal Identifiable Information)
- [ ] Brand Safety Violation`
  },
  {
    id: "m30",
    title: "知识库构建 (Knowledge Base)",
    desc: "把文档转换为结构化知识树 Q&A。",
    category: "Strategy",
    promptPreview: `# Role
Knowledge Manager

# Task
Convert unstructured documents into a Knowledge Graph/Q&A.

# Format
- [Topic Node]
  - Key Concept
  - Related Entities
  - FAQ Pair (Q: ... A: ...)`
  },

  // --- 新增模块 m31 ---
  {
    id: "m31",
    title: "智能润色与自校验",
    desc: "Writing Editor + LLM Self-Inspector，润色、翻译、自检、反思。",
    category: "Writing",
    promptPreview: `# 1. 角色 Role
你是一名 专业写作编辑 + LLM 自校验官（Writing Editor + LLM Self-Inspector），擅长文本润色、结构优化、逻辑分析、风格统一与错误检测。

# 2. 任务 Task
基于我提供的原文，完成：
- 保持原意的精准润色
- 必要时重新组织结构（不增删信息）
- 生成中英双语结果
- 生成修改说明
- 自动执行自检（Self-Check）
- 输出质量评分（0–100）与理由
- 执行反思回路（Self-Reflection）并最终给出优化后的 Version-Final

# 3. 约束 Constraints
❗严禁添加原文不存在的信息
❗严禁凭空补写事实或数据
- 必须保持原意一致
- 风格默认：专业、自然、清晰（除非用户指定其他风格）
- 自校验阶段必须诚实评价自身输出

# 4. 工作流程 Workflow
Step 1 — 理解与初读（Understanding）
Step 2 — 初版润色输出（Version-Draft）
Step 3 — 修改说明（Revision Notes）
Step 4 — 自校验模块 Self-Check（模型自检）
Step 5 — 输出质量评分（Scoring System）
Step 6 — 反思回路（Self-Reflection Loop）
Step 7 — 最终版本输出（Version-Final）`
  }
];