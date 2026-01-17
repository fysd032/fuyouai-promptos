// tools/gen-i18n-from-mapping.mjs
import fs from "fs";
import path from "path";

/**
 * Usage:
 *   node tools/gen-i18n-from-mapping.mjs
 *   node tools/gen-i18n-from-mapping.mjs ./module_mapping.v2.json
 *
 * Output:
 *   public/locales/zh-CN.json
 *   public/locales/en-US.json
 */

// ---------- 0) Paths ----------
const root = process.cwd();
const mappingPath = path.resolve(root, process.argv[2] || "module_mapping.v2.json");
const outDir = path.join(root, "public", "locales");

// ---------- 1) Read mapping ----------
if (!fs.existsSync(mappingPath)) {
  console.error(`[gen-i18n] mapping not found: ${mappingPath}`);
  process.exit(1);
}

let data;
try {
  const raw = fs.readFileSync(mappingPath, "utf-8");
  data = JSON.parse(raw);
} catch (e) {
  console.error(`[gen-i18n] failed to parse JSON: ${mappingPath}`);
  console.error(e);
  process.exit(1);
}

if (!Array.isArray(data)) {
  console.error(`[gen-i18n] mapping root must be an array. got: ${typeof data}`);
  process.exit(1);
}
// 1) group 名 -> 稳定 groupKey（中英都覆盖，避免“中英混用”导致 key 漂移）
const groupKeyOverride = {
  // ===== 英文 group（你 mapping 里已出现）=====
  "Content Creation": "content_creation",
  "Analysis & Reasoning": "analysis_and_reasoning",
  "Business & Workplace": "business_and_workplace",
  "Strategy & Execution": "strategy_and_execution",

  // ===== 中文 group（你 mapping 里已出现）=====
  "产品设计": "product_design",
  "学术研究": "academic_research",
  "技术开发": "technical_development",

  // ===== 你 UI 上的常见中文分类（给未来/回滚兜底）=====
  "内容创作": "content_creation",
  "分析": "analysis_and_reasoning",
  "分析认知": "analysis_and_reasoning",
  "商业": "business_and_workplace",
  "商业职场": "business_and_workplace",
  "策略执行": "strategy_and_execution",

  // 你提到的“工具/角色/其他”也一起兜底（即便这版 mapping 里没出现）
  "工具": "prompt_engineering",
  "角色": "scenario_simulation",
  "其他": "miscellaneous",
};

// 3) 英文默认展示名（UI 英文界面显示用）
// 你说要“更高级一些”，我这里按你语境做了更专业的命名：
// - 技术：Technical Development（偏工程/开发）
// - 工具：Prompt Engineering（你提到 Meta-Prompt/工具类）
// - 角色：Scenario Simulation（你说本质是销售演练/对话演练）

// groupKey 生成器（兜底：确保永远生成稳定 key）
function toGroupKey(groupLabel) {
  if (!groupLabel) return "miscellaneous";
  if (groupKeyOverride[groupLabel]) return groupKeyOverride[groupLabel];

  // 英文/数字：转 snake_case
  const ascii = String(groupLabel)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  // 如果是纯中文等导致 ascii 为空：给稳定 hash key（避免每次变）
  return ascii || "group_" + Buffer.from(String(groupLabel)).toString("hex").slice(0, 8);
}

// ---------- 3) English default titles (UI display) ----------
/**
 * ⚠️ 必须和 groupKeyOverride 的值严格一致
 */
const
 groupEnDefault = {
  content_creation: "Content Creation",
  analysis_and_reasoning: "Analysis & Reasoning",
  business_and_workplace: "Business & Workplace",
  strategy_and_execution: "Strategy & Execution",

  product_design: "Product Design",
  academic_research: "Academic Research",
  technical_development: "Technical Development",

  // 兜底（即使暂时没用到）
  prompt_engineering: "Prompt Engineering",
  scenario_simulation: "Scenario Simulation",
  miscellaneous: "Other",
};

// ---------- 4) i18n skeleton ----------
const zh = {
  locale: "zh-CN",
  groups: {},
  modules: {},
};
const en = {
  locale: "en-US",
  groups: {},
  modules: {},
};

// ---------- 5) Collect groups from mapping ----------
const groupSet = new Set();
for (const m of data) {
  if (m && m.group) groupSet.add(m.group);
}

// Write groups (never miss)
for (const groupLabel of groupSet) {
  const gKey = toGroupKey(groupLabel);
  // zh：优先写中文 label；如果你 mapping 已经全英文，zh 里也先用它（后续再翻译）
  zh.groups[gKey] = { title: groupLabel };
  en.groups[gKey] = { title: groupEnDefault[gKey] || groupLabel || "" };
}

// ---------- 6) Helper: safe string ----------
function s(v) {
  if (v === null || v === undefined) return "";
  return String(v);
}

// ---------- 7) Modules + variants ----------
for (const m of data) {
  if (!m || !m.frontModuleId) continue;

  const moduleId = s(m.frontModuleId);
  const groupLabel = s(m.group);
  const gKey = toGroupKey(groupLabel);

  // module title: mapping里可能是 “写作大师 (Writing Master)” 或已经纯英文
  const moduleTitle = s(m.frontModuleLabel);
  const variants = Array.isArray(m.variants) ? m.variants : [];

  // modules.<moduleId>
  // 注意：这里 en/zh 先同源；你英文完善后，zh 再逐步翻译即可
  zh.modules[moduleId] = zh.modules[moduleId] || { groupKey: gKey, title: "", description: "", variants: {} };
  en.modules[moduleId] = en.modules[moduleId] || { groupKey: gKey, title: "", description: "", variants: {} };

  zh.modules[moduleId].groupKey = gKey;
  en.modules[moduleId].groupKey = gKey;

  zh.modules[moduleId].title = moduleTitle;
  en.modules[moduleId].title = moduleTitle; // 你现在先完成英文版，后续可再分离

  // 如果你 mapping 将来有 module description 可加；现在默认空
  if (!zh.modules[moduleId].description) zh.modules[moduleId].description = s(m.frontModuleDescription || "");
  if (!en.modules[moduleId].description) en.modules[moduleId].description = s(m.frontModuleDescription || "");

  // variants
  for (const v of variants) {
    if (!v || !v.variantId) continue;
    const vid = s(v.variantId);

    const vLabel = s(v.label);
    const vDesc = s(v.description);

    zh.modules[moduleId].variants[vid] = {
      title: vLabel,
      description: vDesc,
    };
    en.modules[moduleId].variants[vid] = {
      title: vLabel,
      description: vDesc,
    };
  }
}

// ---------- 8) Ensure output directory ----------
fs.mkdirSync(outDir, { recursive: true });

// ---------- 9) Write files ----------
const zhPath = path.join(outDir, "zh-CN.json");
const enPath = path.join(outDir, "en-US.json");

fs.writeFileSync(zhPath, JSON.stringify(zh, null, 2), "utf-8");
fs.writeFileSync(enPath, JSON.stringify(en, null, 2), "utf-8");

console.log(`✅ Done: ${path.relative(root, zhPath)}`);
console.log(`✅ Done: ${path.relative(root, enPath)}`);
console.log(`ℹ️ Mapping: ${path.relative(root, mappingPath)}`);
