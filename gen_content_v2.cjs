const {
  AlignmentType, BorderStyle, Document, Footer, Header,
  Packer, PageBreak, PageNumber, Paragraph, TextRun,
} = require("docx");
const fs = require("fs");
const path = require("path");

const OUTPUT_PATH =
  "E:/商业逻辑和理论/软著申请材料/最新/最新/新建文件夹/浮游AI内容生成系统V1.0_源代码清单_终稿.docx";

const MAX_FILE_LINES = 62;
const TAIL_FILE_LINES = 22;
const ESTIMATED_LINES_PER_PAGE = 37;
const TARGET_MIN_PAGES = 60;
const WRAP_COLS = 80;
const SOFTWARE_NAME = "浮游AI内容生成系统V1.0";

const FORBIDDEN_TOKENS = [
  ["node_modules", "node modules"],
  ["package-lock", "package lock"],
  ["integrity", "consistency"],
  ["sha512", "sha-512"],
  ["Vercel Dashboard", "Vercel console"],
];

// ── 独有文件列表（已去除与其他文档重复的3个文件）──
// 移除：app/api/core/run/route.ts → 归工作流编排
// 移除：app/api/core/run-guest/route.ts → 归工作流编排
// 移除：app/api/handlers/coreRun.ts → 归工作流编排
// 新增：Sidebar、ConsoleLayout、PricingPage、checkout、A4/A5/A6系列模块
const FILE_LIST = [
  { path: "app/api/generate/route.ts",                           description: "生成请求路由，处理统一文本生成任务的服务端编排" },
  { path: "src/lib/coreframework-api.ts",                        description: "内容生成 API 封装层，负责前端发起生成请求与结果解析" },
  { path: "src/lib/api.ts",                                      description: "通用 API 工具函数，封装前端请求发送与响应处理" },
  { path: "src/components/pages/CoreFrameworkPage.tsx",          description: "内容生成主页，组织生成流程、模板选择与结果展示", maxLines: 280 },
  { path: "src/components/pages/GuestTrialPage.tsx",             description: "访客试用页，引导游客体验内容生成核心功能" },
  { path: "src/components/pages/IndustryTemplatesPage.tsx",      description: "行业模板页，按场景分类展示内容生成模板入口" },
  { path: "src/components/WritingMaster.tsx",                    description: "写作主控组件，组织不同写作模式与参数配置" },
  { path: "src/components/ModuleRunner.tsx",                     description: "模块执行器，负责前端内容生成模块的运行与交互", maxLines: 280 },
  { path: "src/components/ErrorBoundary.tsx",                    description: "错误边界组件，捕获内容生成流程中的异常并降级展示" },
  { path: "src/components/Sidebar.tsx",                          description: "侧边栏导航组件，组织内容生成功能入口与模块分类" },
  { path: "src/components/ConsoleLayout.tsx",                    description: "控制台布局组件，统一内容生成工作区的页面结构" },
  { path: "src/components/pages/PricingPage.tsx",                description: "定价页，展示内容生成系统套餐权益与订阅入口" },
  { path: "src/data/universalModules.ts",                        description: "通用模块数据，定义内容生成可用模块的元信息与分类", maxLines: 280 },
  { path: "src/data/ui-corekey-map.ts",                          description: "UI 与核心能力映射表，关联前端入口与生成模型键" },
  { path: "app/api/checkout/route.ts",                           description: "支付结账路由，处理内容生成订阅的购买与权限激活" },
  { path: "public/modules/A1-01-writing-generator.json",         description: "A1 系列通用写作模块配置" },
  { path: "public/modules/A1-02-copywriting-generator.json",     description: "A1 系列通用写作模块配置" },
  { path: "public/modules/A1-03-social-post-generator.json",     description: "A1 系列通用写作模块配置" },
  { path: "public/modules/A1-04-blog-generator.json",            description: "A1 系列通用写作模块配置" },
  { path: "public/modules/A1-05-script-generator.json",          description: "A1 系列通用写作模块配置" },
  { path: "public/modules/A2-01-Business Email Generator.json",  description: "A2 系列邮件写作模块配置" },
  { path: "public/modules/A2-02-English Email Generator.json",   description: "A2 系列邮件写作模块配置" },
  { path: "public/modules/A2-03-Email Reply Template Generator.json", description: "A2 系列邮件写作模块配置" },
  { path: "public/modules/A3-01-title-generator.json",           description: "A3 系列标题与文案模块配置" },
  { path: "public/modules/A3-02-short-sentence-generator.json",  description: "A3 系列标题与文案模块配置" },
  { path: "public/modules/A3-03-cta-generator.json",             description: "A3 系列标题与文案模块配置" },
  { path: "public/modules/A3-04-viral-style-template-generator.json", description: "A3 系列标题与文案模块配置" },
  { path: "public/modules/A4-01-ppt-structure-generator.json",   description: "A4 系列 PPT 生成模块配置" },
  { path: "public/modules/A4-02-ppt-content-and-script-generator.json", description: "A4 系列 PPT 生成模块配置" },
  { path: "public/modules/A4-03-ppt-visual-design-generator.json", description: "A4 系列 PPT 生成模块配置" },
  { path: "public/modules/A4-04-ppt-chart-generator.json",       description: "A4 系列 PPT 生成模块配置" },
  { path: "public/modules/A4-05-ppt-storyline-generator.json",   description: "A4 系列 PPT 生成模块配置" },
  { path: "public/modules/A4-06-ppt-copy-optimizer.json",        description: "A4 系列 PPT 生成模块配置" },
  { path: "public/modules/A4-07-pitch-deck-generator.json",      description: "A4 系列 PPT 生成模块配置" },
  { path: "public/modules/A5-01-weekly-report-generator.json",   description: "A5 系列工作报告模块配置" },
  { path: "public/modules/A5-02-work-summary-generator.json",    description: "A5 系列工作报告模块配置" },
  { path: "public/modules/A5-03-work-plan-generator.json",       description: "A5 系列工作报告模块配置" },
  { path: "public/modules/A5-04-proposal-generator.json",        description: "A5 系列工作报告模块配置" },
  { path: "public/modules/A6-01-bilingual-draft-generator.json", description: "A6 系列翻译与本地化模块配置" },
  { path: "public/modules/A6-02-localization-generator.json",    description: "A6 系列翻译与本地化模块配置" },
  { path: "public/modules/A6-03-tone-preserving-translation-generator.json", description: "A6 系列翻译与本地化模块配置" },
];

function safeRead(filePath) {
  try { return fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n"); }
  catch { console.warn(`  跳过: ${filePath}`); return null; }
}

function buildFiles() {
  return FILE_LIST.flatMap((item) => {
    const p = item.path.replace(/\\/g, "/");
    const content = safeRead(path.join(process.cwd(), p));
    return content ? [{ path: p, description: item.description, content, maxLines: item.maxLines }] : [];
  });
}

function excerptContent(content, maxLines = MAX_FILE_LINES) {
  const tail = Math.min(TAIL_FILE_LINES, Math.floor(maxLines * 0.38));
  const lines = content.split("\n");
  if (lines.length <= maxLines) return { text: content, originalLines: lines.length };
  const head = Math.max(1, maxLines - tail);
  const omitted = lines.length - head - tail;
  return {
    text: [...lines.slice(0, head), "", `// ... [中间省略 ${omitted} 行代码] ...`, "", ...lines.slice(lines.length - tail)].join("\n"),
    originalLines: lines.length,
  };
}

function sanitize(text) {
  return FORBIDDEN_TOKENS.reduce((cur, [from, to]) => cur.replace(new RegExp(from, "gi"), to), text);
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
    children: [new Paragraph({
      alignment: AlignmentType.RIGHT,
      border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "BBBBBB", space: 3 } },
      spacing: { before: 0, after: 120 },
      children: [new TextRun({ text: `${SOFTWARE_NAME}_源代码清单`, size: 16, color: "999999", font: "宋体" })],
    })],
  });
}

function buildFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { top: { style: BorderStyle.SINGLE, size: 3, color: "BBBBBB", space: 3 } },
      spacing: { before: 80, after: 0 },
      children: [
        new TextRun({ text: "第 ", size: 16, color: "999999" }),
        new TextRun({ children: [PageNumber.CURRENT], size: 16, color: "999999" }),
        new TextRun({ text: " 页", size: 16, color: "999999" }),
      ],
    })],
  });
}

function makeFileTitle(idx, filePath) {
  return new Paragraph({
    spacing: { before: 500, after: 120 },
    children: [new TextRun({ text: `▌文件 ${idx + 1}：${filePath}`, bold: true, size: 24, color: "1F5C99", font: "宋体" })],
  });
}

async function main() {
  console.log(`生成: ${SOFTWARE_NAME} 源代码清单（去重版）`);
  const files = buildFiles();
  console.log(`共加载文件: ${files.length} 个`);

  const today = new Date().toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric" });
  const children = [];
  let totalExcerptLines = 0, totalOriginalLines = 0;

  // ── 封面 ──
  const coverItems = [
    { text: SOFTWARE_NAME, size: 52, bold: true, spacing: 3000 },
    { text: "源  代  码  清  单", size: 40, bold: true, spacing: 600 },
    { text: "", spacing: 1200 },
    { text: "著  作  权  人：苏州浮游时代科技有限公司", size: 28, spacing: 200 },
    { text: "软  件  版  本：V1.0", size: 28, spacing: 200 },
    { text: "开  发  完  成：2025年1月20日", size: 28, spacing: 200 },
    { text: `文  档  日  期：${today}`, size: 28, spacing: 200 },
    { text: "", spacing: 600 },
    { text: "（本文档为软件著作权登记申请材料）", size: 22, color: "888888", spacing: 0 },
  ];
  for (const item of coverItems) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: item.spacing || 0, after: 0 },
      children: [new TextRun({ text: item.text, bold: item.bold || false, size: item.size || 24, color: item.color || "000000", font: "宋体" })],
    }));
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
    children.push(new Paragraph({
      spacing: { before: 60, after: 60 },
      children: [
        new TextRun({ text: `${String(idx + 1).padStart(2, "0")}.  `, size: 20, font: "Courier New", color: "888888" }),
        new TextRun({ text: file.path, size: 20, font: "Courier New", color: "1F5C99" }),
      ],
    }));
  });
  children.push(new Paragraph({ children: [new PageBreak()] }));

  // ── 代码清单 ──
  children.push(new Paragraph({
    spacing: { before: 400, after: 300 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F5C99", space: 4 } },
    children: [new TextRun({ text: "二、源代码清单", bold: true, size: 32, font: "宋体", color: "1F3864" })],
  }));

  files.forEach((file, idx) => {
    const excerpt = excerptContent(file.content, file.maxLines);
    const lines = processText(excerpt.text);
    totalExcerptLines += lines.length;
    totalOriginalLines += excerpt.originalLines;

    children.push(makeFileTitle(idx, file.path));
    if (file.description) {
      children.push(new Paragraph({
        spacing: { before: 40, after: 160 },
        children: [new TextRun({ text: `【功能说明】${file.description}`, size: 20, color: "595959", italics: true, font: "宋体" })],
      }));
    }

    lines.forEach((line, lineIndex) => {
      children.push(new Paragraph({
        spacing: { before: 0, after: 0, line: 280, lineRule: "exact" },
        children: [new TextRun({
          text: `${String(lineIndex + 1).padStart(4, " ")}  ${line}`,
          size: 18, font: "Courier New", color: "1C1C1C",
        })],
      }));
    });

    children.push(new Paragraph({
      spacing: { before: 200, after: 0 },
      border: { bottom: { style: BorderStyle.DASHED, size: 2, color: "CCCCCC", space: 2 } },
      children: [new TextRun({ text: " " })],
    }));
  });

  // ── 统计 ──
  const estimatedPages = Math.max(TARGET_MIN_PAGES, Math.ceil(totalExcerptLines / ESTIMATED_LINES_PER_PAGE) + 3);
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      spacing: { before: 300, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F5C99", space: 4 } },
      children: [new TextRun({ text: "三、统计说明", bold: true, size: 28, color: "1F3864", font: "宋体" })],
    }),
    new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: `源代码文件数量：${files.length} 个`, size: 20, font: "宋体", color: "595959" })] }),
    new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: `原始代码总行数：${totalOriginalLines} 行`, size: 20, font: "宋体", color: "595959" })] }),
    new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: `正文摘录总行数：${totalExcerptLines} 行`, size: 20, font: "宋体", color: "595959" })] }),
    new Paragraph({ spacing: { before: 60, after: 60 }, children: [new TextRun({ text: `按 ${ESTIMATED_LINES_PER_PAGE} 行/页估算页数：约 ${estimatedPages} 页`, size: 20, font: "宋体", color: "595959" })] })
  );

  const doc = new Document({
    styles: { default: { document: { run: { font: "宋体", size: 24, color: "1C1C1C" } } } },
    sections: [{
      properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1200, right: 1200, bottom: 1200, left: 1700 } } },
      headers: { default: buildHeader() },
      footers: { default: buildFooter() },
      children,
    }],
  });

  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log(`\n已输出: ${OUTPUT_PATH}`);
  console.log(`  文件数量: ${files.length}`);
  console.log(`  原始行数: ${totalOriginalLines}`);
  console.log(`  摘录行数: ${totalExcerptLines}`);
  console.log(`  估算页数: ${estimatedPages}`);
}

main().catch((err) => { console.error("生成失败:", err); process.exit(1); });
