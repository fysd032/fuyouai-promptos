// ─── Use Cases ───────────────────────────────────────────────────────────────

export type UseCaseItem = {
  tag: string;
  title: string;
  desc: string;
  input: string;
  output: string;
  color: "blue" | "purple" | "emerald" | "amber";
};

export const useCasesData: UseCaseItem[] = [
  {
    tag: "Founders",
    title: "From idea to plan",
    desc: "No blank page.",
    input: "Build an AI SaaS for B2B teams",
    output: "MVP scope · GTM · 30-day plan",
    color: "blue",
  },
  {
    tag: "AI Builders",
    title: "Prompt to system design",
    desc: "Structured. Reusable. Reliable.",
    input: "Make this prompt more consistent",
    output: "System prompt + edge case variants",
    color: "purple",
  },
  {
    tag: "Product Managers",
    title: "Feature brief to PRD",
    desc: "No more formatting time.",
    input: "PRD for onboarding redesign",
    output: "Requirements · edge cases · metrics",
    color: "emerald",
  },
  {
    tag: "Creators",
    title: "Draft in one session",
    desc: "Publish without the block.",
    input: "Write about AI and creativity",
    output: "Outline + intro + full draft",
    color: "amber",
  },
];

// ─── Blog Preview ─────────────────────────────────────────────────────────────

export type BlogPostPreview = {
  title: string;
  summary: string;
  href: string;
  category?: string;
  date?: string;
};

export const blogPreviewData: BlogPostPreview[] = [
  {
    title: "From ChatGPT to Structured Thinking",
    summary:
      "Why most AI users stay at the surface — and how to build a real thinking workflow that delivers.",
    href: "/blog/structured-thinking",
    category: "Methodology",
    date: "Mar 2025",
  },
  {
    title: "AI Workflow for Founders",
    summary:
      "How early-stage founders can use structured AI to move from idea to execution plan in under an hour.",
    href: "/blog/ai-workflow-founders",
    category: "Use Case",
    date: "Mar 2025",
  },
  {
    title: "How to Write Better Prompts",
    summary:
      "The three patterns that separate average prompts from ones that consistently produce professional output.",
    href: "/blog/better-prompts",
    category: "Tips",
    date: "Feb 2025",
  },
];
