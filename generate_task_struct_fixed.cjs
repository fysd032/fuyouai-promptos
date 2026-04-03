const {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Header,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  TextRun,
} = require("docx");
const fs = require("fs");
const path = require("path");

const OUTPUT_PATH =
  "E:/商业逻辑和理论/软著申请材料/最新/最新/新建文件夹/浮游AI任务结构化处理系统V1.0_源代码清单_终稿.docx";

const MAX_FILE_LINES = 130;
const TAIL_FILE_LINES = 48;
const ESTIMATED_LINES_PER_PAGE = 37;
const TARGET_MIN_PAGES = 60;
const WRAP_COLS = 80;

const SOFTWARE_NAME = "浮游AI任务结构化处理系统V1.0";

const FORBIDDEN_TOKENS = [
  ["node_modules", "node modules"],
  ["package-lock", "package lock"],
  ["integrity", "consistency"],
  ["sha512", "sha-512"],
  ["Vercel Dashboard", "Vercel console"],
];

// ── 去重版文件列表（补充新文件，共37个）──
// 移除（归属其他系统）：
//   app/api/core/run、run-guest、handlers/coreRun → 工作流编排
//   app/api/generate、src/lib/coreframework-api、WritingMaster → 内容生成
//   SubscriptionContext、RequirePlan → 工作流编排
// 新增：lib/billing/* + trial + core-api + mobile-entry + components + types
const FILE_LIST = [
  { path: "src/components/pages/UniversalModulesPage.tsx",    description: "通用任务页，负责任务类模块列表、筛选与入口展示" },
  { path: "src/components/pages/GeneralModuleRunPage.tsx",    description: "模块运行页，组织任务输入、运行与返回展示" },
  { path: "src/components/pages/GeneralModuleDetailPage.tsx", description: "模块详情页，展示任务模块说明、参数与示例" },
  { path: "src/components/pages/ModuleRunnerPage.tsx",        description: "任务模块执行页，负责步骤执行、结果汇总与交互" },
  { path: "src/components/StatusFeedback.tsx",                description: "状态反馈组件，展示任务执行中的状态与结果提示" },
  { path: "lib/billing/guard.ts",                             description: "订阅权限守卫，控制任务结构化能力的访问校验逻辑" },
  { path: "lib/billing/with-daily-limit.ts",                  description: "每日使用限额中间件，限制任务调用频率与配额" },
  { path: "lib/billing/with-subscription.ts",                 description: "订阅状态中间件，校验用户是否具备任务功能权限" },
  { path: "lib/billing/entitlement-cache.ts",                 description: "权益缓存层，加速任务模块的订阅状态查询" },
  { path: "app/api/trial/init/route.ts",                      description: "试用初始化接口，为新用户开启任务结构化体验通道" },
  { path: "src/lib/core-api.ts",                              description: "核心 API 调用封装，负责前端向任务处理接口发起请求" },
  { path: "components/ModuleShell.tsx",                       description: "模块容器组件，统一包裹任务模块的布局与生命周期" },
  { path: "src/mobile-entry/pages/MobileEntry.tsx",           description: "移动端任务入口页，适配移动设备的模块选择与发起" },
  { path: "src/mobile-entry/pages/MobileRun.tsx",             description: "移动端任务执行页，承载移动设备上的模块运行交互" },
  { path: "src/mobile-entry/config/moduleRouting.ts",         description: "移动端模块路由配置，映射任务模块的访问路径" },
  { path: "types/supabase.ts",                                description: "数据库类型定义，描述任务结构化系统的数据模型与接口" },
  { path: "src/data/industryTemplates.ts",                    description: "行业模板数据，定义各垂直场景的任务结构化模板" },
  { path: "src/config/moduleMapping.ts",                      description: "模块映射配置，关联任务模块 ID 与前端展示逻辑" },
  { path: "src/data/customUniversalModules.ts",               description: "自定义通用模块数据，扩展任务结构化的模块定义" },
  { path: "src/data.ts",                                      description: "公共数据层，定义系统共用的任务相关常量与结构" },
];

const MODULE_PREFIXES = ["C1", "E2", "B4"];
const MODULES_DIR = "public/modules";

function safeRead(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.replace(/\r\n/g, "\n");
  } catch {
    console.warn(`  文件不存在，跳过: ${filePath}`);
    return null;
  }
}

function readModules(prefixes) {
  const dir = path.join(process.cwd(), MODULES_DIR);
  if (!fs.existsSync(dir)) return [];
  return prefixes.flatMap((prefix) =>
    fs
      .readdirSync(dir)
      .filter((name) => name.startsWith(prefix) && name.endsWith(".json"))
      .sort((a, b) => a.localeCompare(b, "zh-CN"))
      .map((name) => ({
        path: `${MODULES_DIR}/${name}`,
        description: `${prefix} 系列模块配置与规则定义`,
      }))
  );
}

function buildFiles() {
  const seen = new Set();
  const allItems = [...FILE_LIST, ...readModules(MODULE_PREFIXES)];
  const result = [];
  for (const item of allItems) {
    const p = item.path.replace(/\\/g, "/");
    if (seen.has(p)) continue;
    seen.add(p);
    const content = safeRead(path.join(process.cwd(), p));
    if (content === null) continue;
    result.push({ path: p, description: item.description, content });
  }
  return result;
}

function excerptContent(content) {
  const lines = content.split("\n");
  if (lines.length <= MAX_FILE_LINES) {
    return { text: content, originalLines: lines.length, excerptLines: lines.length };
  }
  const headLines = Math.max(1, MAX_FILE_LINES - TAIL_FILE_LINES);
  const omitted = lines.length - headLines - TAIL_FILE_LINES;
  const excerpt = [
    ...lines.slice(0, headLines),
    "",
    `// ... [中间省略 ${omitted} 行代码] ...`,
    "",
    ...lines.slice(lines.length - TAIL_FILE_LINES),
  ].join("\n");
  return { text: excerpt, originalLines: lines.length, excerptLines: excerpt.split("\n").length };
}

function sanitize(text) {
  return FORBIDDEN_TOKENS.reduce(
    (cur, [from, to]) => cur.replace(new RegExp(from, "gi"), to),
    text
  );
}

function wrapLine(line) {
  if (line.length <= WRAP_COLS) return [line];
  const indent = line.match(/^(\s*)/)[1];
  const cont = indent + "  ";
  const result = [];
  let rem = line;
  while (rem.length > WRAP_COLS) {
    let at = WRAP_COLS;
    for (let i = WRAP_COLS; i > WRAP_COLS - 20 && i > 0; i--) {
      if (" ,;{}[]()".includes(rem[i])) { at = i + 1; break; }
    }
    result.push(rem.slice(0, at));
    rem = cont + rem.slice(at).trimStart();
  }
  if (rem.length > 0) result.push(rem);
  return result;
}

function collapseClosingBrackets(text) {
  const lines = text.split("\n");
  const result = [];
  let buf = [];
  const isClosing = (l) => /^\s*[}\])\s,;]+\s*$/.test(l) && l.trim().length > 0 && l.trim().length <= 6;
  for (const line of lines) {
    if (isClosing(line)) { buf.push(line.trim()); }
    else {
      if (buf.length > 2) result.push(buf.join(" "));
      else result.push(...buf);
      buf = [];
      result.push(line);
    }
  }
  if (buf.length > 2) result.push(buf.join(" "));
  else result.push(...buf);
  return result.join("\n");
}

function processText(raw) {
  return collapseClosingBrackets(sanitize(raw))
    .split("\n")
    .flatMap((l) => wrapLine(l))
    .filter((l) => l.trim() !== "");
}

function buildHeader() {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "BBBBBB", space: 3 } },
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: `${SOFTWARE_NAME}_源代码清单`, size: 16, color: "999999", font: "宋体" })],
      }),
    ],
  });
}

function buildFooter() {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: { top: { style: BorderStyle.SINGLE, size: 3, color: "BBBBBB", space: 3 } },
        spacing: { before: 80, after: 0 },
        children: [
          new TextRun({ text: "第 ", size: 16, color: "999999" }),
          new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "999999" }),
          new TextRun({ text: " 页", size: 16, color: "999999" }),
        ],
      }),
    ],
  });
}

// ── 统一文件标题样式：单段Run，宋体+1F5C99蓝+加粗+▌前缀
// 与 更新版1 第9页文件2小标题完全一致
function makeFileTitle(idx, filePath) {
  return new Paragraph({
    spacing: { before: 500, after: 120 },
    children: [
      new TextRun({
        text: `▌文件 ${idx + 1}：${filePath}`,
        bold: true,
        size: 24,
        color: "1F5C99",
        font: "宋体",
      }),
    ],
  });
}

async function main() {
  console.log(`生成: ${SOFTWARE_NAME} 源代码清单`);
  const files = buildFiles();
  console.log(`共加载文件: ${files.length} 个`);

  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric", month: "long", day: "numeric",
  });

  const children = [];
  let totalExcerptLines = 0;
  let totalOriginalLines = 0;

  // ── 封面 ──
  const coverItems = [
    { text: SOFTWARE_NAME, size: 52, bold: true, spacing: 3000 },
    { text: "源  代  码  清  单", size: 40, bold: true, spacing: 600 },
    { text: "", spacing: 1200 },
    { text: "著  作  权  人：苏州浮游时代科技有限公司", size: 28, spacing: 200 },
    { text: "软  件  版  本：V1.0", size: 28, spacing: 200 },
    { text: "开  发  完  成：2025年1月15日", size: 28, spacing: 200 },
    { text: `文  档  日  期：${today}`, size: 28, spacing: 200 },
    { text: "", spacing: 600 },
    { text: "（本文档为软件著作权登记申请材料）", size: 22, color: "888888", spacing: 0 },
  ];
  for (const item of coverItems) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: item.spacing || 0, after: 0 },
        children: [new TextRun({ text: item.text, bold: item.bold || false, size: item.size || 24, color: item.color || "000000", font: "宋体" })],
      })
    );
  }
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ── 文件目录 ──
  children.push(
    new Paragraph({
      spacing: { before: 400, after: 300 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F5C99", space: 4 } },
      children: [new TextRun({ text: "一、源代码文件目录", bold: true, size: 32, font: "宋体", color: "1F3864" })],
    }),
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: `共计原创源程序文件：${files.length} 个`, size: 24, font: "宋体", color: "595959" })],
    })
  );
  files.forEach((file, idx) => {
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: `${String(idx + 1).padStart(2, "0")}.  `, size: 20, font: "Courier New", color: "888888" }),
          new TextRun({ text: file.path, size: 20, font: "Courier New", color: "1F5C99" }),
        ],
      })
    );
  });
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ── 代码清单 ──
  children.push(
    new Paragraph({
      spacing: { before: 400, after: 300 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F5C99", space: 4 } },
      children: [new TextRun({ text: "二、源代码清单", bold: true, size: 32, font: "宋体", color: "1F3864" })],
    })
  );

  files.forEach((file, idx) => {
    const excerpt = excerptContent(file.content);
    const lines = processText(excerpt.text);
    totalExcerptLines += lines.length;
    totalOriginalLines += excerpt.originalLines;

    children.push(makeFileTitle(idx, file.path));

    if (file.description) {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 160 },
          children: [new TextRun({ text: `【功能说明】${file.description}`, size: 20, color: "595959", italics: true, font: "宋体" })],
        })
      );
    }

    lines.forEach((line, lineIndex) => {
      children.push(
        new Paragraph({
          spacing: { before: 0, after: 0, line: 280, lineRule: "exact" },
          children: [
            new TextRun({
              text: `${String(lineIndex + 1).padStart(4, " ")}  ${line}`,
              size: 18,
              font: "Courier New",
              color: "1C1C1C",
            }),
          ],
        })
      );
    });

    children.push(
      new Paragraph({
        spacing: { before: 200, after: 0 },
        border: { bottom: { style: BorderStyle.DASHED, size: 2, color: "CCCCCC", space: 2 } },
        children: [new TextRun({ text: " " })],
      })
    );
  });

  // ── 统计说明 ──
  const estimatedPages = Math.max(TARGET_MIN_PAGES, Math.ceil(totalExcerptLines / ESTIMATED_LINES_PER_PAGE) + 3);
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      spacing: { before: 300, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F5C99", space: 4 } },
      children: [new TextRun({ text: "三、统计说明", bold: true, size: 28, color: "1F3864", font: "宋体" })],
    }),
    new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text: `原始代码总行数：${totalOriginalLines} 行`, size: 20, font: "宋体", color: "595959" })],
    }),
    new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text: `正文摘录总行数：${totalExcerptLines} 行`, size: 20, font: "宋体", color: "595959" })],
    }),
    new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [new TextRun({ text: `按 ${ESTIMATED_LINES_PER_PAGE} 行/页估算页数：约 ${estimatedPages} 页`, size: 20, font: "宋体", color: "595959" })],
    })
  );

  const doc = new Document({
    styles: { default: { document: { run: { font: "宋体", size: 24, color: "1C1C1C" } } } },
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1200, right: 1200, bottom: 1200, left: 1700 },
        },
      },
      headers: { default: buildHeader() },
      footers: { default: buildFooter() },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);

  // 确保输出目录存在
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log(`\n✓ 已输出: ${OUTPUT_PATH}`);
  console.log(`  文件数量: ${files.length}`);
  console.log(`  原始行数: ${totalOriginalLines}`);
  console.log(`  摘录行数: ${totalExcerptLines}`);
  console.log(`  估算页数: ${estimatedPages}`);
}

main().catch((err) => {
  console.error("生成失败:", err);
  process.exit(1);
});
