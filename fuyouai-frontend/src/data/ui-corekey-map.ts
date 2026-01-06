// src/data/ui-corekey-map.ts
export const CORE_TAB_TO_COREKEY = {
  "task-decomposition-v3": "task_breakdown",
  "reasoning-engine-v3": "cot_reasoning",
  "content-builder-v3": "content_builder",
  "analytical-engine-v3": "analytical_engine",
  "task-tree-v3": "task_tree",
} as const;

export type UITabKey = keyof typeof CORE_TAB_TO_COREKEY;
export type CoreKey = typeof CORE_TAB_TO_COREKEY[UITabKey];
