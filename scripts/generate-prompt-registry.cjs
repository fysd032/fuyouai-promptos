// scripts/generate-prompt-registry.cjs
// 用法：node scripts/generate-prompt-registry.cjs

const fs = require("fs");
const path = require("path");

// 相对项目根目录的路径配置
const MODULES_DIR = path.join(__dirname, "..", "public", "modules");
const OUTPUT_FILE = path.join(
  __dirname,
  "..",
  "lib",
  "promptos",
  "registry.generated.ts"
);

function toImportVarName(fileName) {
  // 例：A1-01-writing-generator.json -> m_A1_01_writing_generator
  return (
    "m_" +
    fileName
      .replace(/\.json$/i, "")
      .replace(/[^a-zA-Z0-9]+/g, "_")
  );
}

function main() {
  if (!fs.existsSync(MODULES_DIR)) {
    console.error("❌ modules 目录不存在：", MODULES_DIR);
    process.exit(1);
  }

  const files = fs
    .readdirSync(MODULES_DIR)
    .filter((f) => f.toLowerCase().endsWith(".json"));

  if (files.length === 0) {
    console.error("❌ modules 目录下没有 .json 文件：", MODULES_DIR);
    process.exit(1);
  }

  const imports = [];
  const entries = [];

  for (const file of files) {
    const fullPath = path.join(MODULES_DIR, file);
    const raw = fs.readFileSync(fullPath, "utf8");

    let json;
    try {
      json = JSON.parse(raw);
    } catch (e) {
      console.error("❌ 解析 JSON 失败：", fullPath, e.message);
      process.exit(1);
    }

    const moduleId = json.module_id;
    if (!moduleId) {
      console.error("❌ JSON 缺少 module_id 字段：", fullPath);
      process.exit(1);
    }

    const importVar = toImportVarName(file);
    const relImportPath = "../../public/modules/" + file;

    imports.push(`import ${importVar} from "${relImportPath}";`);
    entries.push(`  "${moduleId}": ${importVar},`);
  }

  const content = `// ⚠️ 本文件由 scripts/generate-prompt-registry.cjs 自动生成，请勿手动修改。
import type { PromptModule } from "./prompts";

${imports.join("\n")}

export const modulesRegistry: Record<string, PromptModule> = {
${entries.join("\n")}
};
`;

  fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, content, "utf8");

  console.log("✅ 已生成：", OUTPUT_FILE);
  console.log("✅ 共注册模块数：", files.length);
}

main();
