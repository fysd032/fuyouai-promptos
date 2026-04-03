type ModuleMapping = {
  frontModuleId: string;
  variantId: string;
};

const defaultMapping: ModuleMapping = {
  frontModuleId: "writing_master",
  variantId: "blog_post_standard",
};

const keywordMappings: Array<{ keywords: string[]; mapping: ModuleMapping }> = [
  {
    keywords: ["email", "mail", "inbox", "follow-up", "follow up"],
    mapping: { frontModuleId: "email_pro", variantId: "email_draft" },
  },
  {
    keywords: ["summary", "summarize", "summarise", "tldr", "tl;dr", "recap"],
    mapping: { frontModuleId: "summarizer", variantId: "brief_summary" },
  },
  {
    keywords: ["sop", "process", "workflow", "checklist", "standard operating"],
    mapping: { frontModuleId: "sop_engine", variantId: "sop_design" },
  },
  {
    keywords: ["competitor", "competition", "market", "analysis", "research"],
    mapping: { frontModuleId: "deep_analysis", variantId: "business_analysis" },
  },
];

export const pickModuleMapping = (input: string): ModuleMapping => {
  const normalized = input.toLowerCase();
  for (const entry of keywordMappings) {
    if (entry.keywords.some((keyword) => normalized.includes(keyword))) {
      return entry.mapping;
    }
  }
  return defaultMapping;
};

export type { ModuleMapping };
