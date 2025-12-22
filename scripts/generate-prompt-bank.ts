import fs from "fs";
import path from "path";

/**
 * 配置
 */
const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, "prompt-bank-src");
const OUT_FILE = path.join(ROOT, "lib/promptos/prompt-bank.generated.ts");

const TIERS = ["basic", "pro"] as const;
type Tier = typeof TIERS[number];

function filenameToPromptKey(filename: string, tier: Tier): string {
  const base = filename
    .replace(/\.txt$/i, "")
    .replace(/·/g, "")
    .replace(/V\d+(\.\d+)?/gi, "")
    .replace(/BASIC|PRO/gi, "")
    .trim()
    .toLowerCase();

  const slug = base
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return `core.${slug}.${tier}`;
}

/**
 * 读取某一层（basic / pro）
 */
function readTier(tier: Tier) {
  const dir = path.join(SRC_DIR, tier);
  if (!fs.existsSync(dir)) return [];

  return fs.readdirSync(dir)
    .filter((f) => f.endsWith(".txt"))
    .map((filename) => {
      const fullPath = path.join(dir, filename);
      const content = fs.readFileSync(fullPath, "utf-8").trim();

      return {
        key: filenameToPromptKey(filename, tier),
        tier,
        sourceFile: filename,
        content,
      };
    });
}

/**
 * 主流程
 */
function generate() {
  const records = TIERS.flatMap(readTier);

  const lines: string[] = [];

  lines.push(`/* AUTO-GENERATED FILE — DO NOT EDIT */`);
  lines.push(`/* Generated at: ${new Date().toISOString()} */`);
  lines.push("");
  lines.push(`export type PromptTier = "basic" | "pro";`);
  lines.push("");
  lines.push(`export interface PromptRecord {`);
  lines.push(`  key: string;`);
  lines.push(`  tier: PromptTier;`);
  lines.push(`  content: string;`);
  lines.push(`  sourceFile: string;`);
  lines.push(`}`);
  lines.push("");
  lines.push(`export const PROMPT_BANK: Record<string, PromptRecord> = {`);

  for (const r of records) {
    lines.push(`  "${r.key}": {`);
    lines.push(`    key: "${r.key}",`);
    lines.push(`    tier: "${r.tier}",`);
    lines.push(`    sourceFile: "${r.sourceFile}",`);
    lines.push(`    content: ${JSON.stringify(r.content)},`);
    lines.push(`  },`);
  }

  lines.push(`};`);
  lines.push("");
  lines.push(`export function getPrompt(key: string): PromptRecord | null {`);
  lines.push(`  return PROMPT_BANK[key] ?? null;`);
  lines.push(`}`);

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, lines.join("\n"), "utf-8");

  console.log(`✅ Prompt bank generated: ${OUT_FILE}`);
  console.log(`   Total prompts: ${records.length}`);
}

generate();
