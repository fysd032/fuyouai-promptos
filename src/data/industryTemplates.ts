
export interface IndustryTemplate {
  id: string;
  title: string;
  desc: string;
  level: "Basic" | "Advanced" | "Pro";
  industryId: string;
  promptPreview: string; // Added for the runner
}

export const INDUSTRY_TEMPLATES_DB: IndustryTemplate[] = [
  // Finance
  { 
    id: "f1", 
    industryId: "finance",
    title: "Industry Research Report Outline", 
    desc: "Generate a broker/consulting-style research report structure from the given topic.", 
    level: "Advanced",
    promptPreview: "# Role\nInvestment Analyst\n\n# Task\nGenerate a structured research report outline for [Topic].\n\n# Structure\n1. Executive Summary\n2. Industry Overview\n3. Competitive Landscape\n4. Investment Risks"
  },
  { 
    id: "f2", 
    industryId: "finance",
    title: "Rapid Earnings Report Review", 
    desc: "Input key points and output structured analysis and investment-angle commentary.", 
    level: "Pro",
    promptPreview: "# Role\nFinancial Analyst\n\n# Task\nAnalyze the provided financial report highlights.\n\n# Output\n- Key Metrics Analysis\n- YoY/QoQ Growth\n- Management Guidance Interpretation"
  },
  
  // Product
  { 
    id: "p1", 
    industryId: "product",
    title: "PRD Requirements Doc Generator", 
    desc: "Generate a standard PRD structure and feature description from a one-line idea.", 
    level: "Advanced",
    promptPreview: "# Role\nSenior Product Manager\n\n# Task\nDraft a PRD based on the user's idea.\n\n# Sections\n1. Background & Goals\n2. User Stories\n3. Functional Requirements\n4. Success Metrics"
  },
  { 
    id: "p2", 
    industryId: "product",
    title: "Competitive Analysis Comparison Table", 
    desc: "Generate a multi-dimension comparison table and differences summary.", 
    level: "Basic",
    promptPreview: "# Role\nProduct Strategist\n\n# Task\nCompare [Product A] vs [Product B].\n\n# Output\nMarkdown Table comparing:\n- Core Features\n- Pricing Strategy\n- UX/UI\n- Target Audience"
  },

  // Real Estate (Mock for demo)
  { id: "re1", industryId: "real-estate", title: "Project Pitch Script", desc: "Generate scripts for different customer segments.", level: "Basic", promptPreview: "# Role\nReal Estate Agent\n\n# Task\nGenerate sales scripts for a new property." },
  
  // Operation
  { id: "op1", industryId: "operation", title: "Event Planning SOP", desc: "End-to-end SOP from goals to execution details.", level: "Basic", promptPreview: "# Role\nOperations Manager\n\n# Task\nCreate an event planning SOP." },
  
  // Academic
  { id: "ac1", industryId: "academic", title: "Abstract Rewrite", desc: "Optimize the abstract to match journal submission style.", level: "Advanced", promptPreview: "# Role\nAcademic Editor\n\n# Task\nRewrite the abstract for clarity and impact." },
  
  // Developer
  { id: "dev1", industryId: "developer", title: "Code Review Assistant", desc: "Find bugs and produce optimization suggestions.", level: "Advanced", promptPreview: "# Role\nSenior Engineer\n\n# Task\nReview the code for bugs, performance, and readability." },
  
  // Business
  { id: "bus1", industryId: "business", title: "Business Negotiation Email", desc: "High-EQ negotiation messaging.", level: "Basic", promptPreview: "# Role\nNegotiation Expert\n\n# Task\nDraft a negotiation email." },
  
  // Creator
  { id: "cr1", industryId: "creator", title: "Viral Post Copy", desc: "Generate clicky titles and emoji-rich body text.", level: "Basic", promptPreview: "# Role\nSocial Media Manager\n\n# Task\nWrite a viral post for XiaoHongShu (Red Note)." }
];
