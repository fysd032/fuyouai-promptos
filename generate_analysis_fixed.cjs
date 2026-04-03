const {
  AlignmentType, BorderStyle, Document, Footer, Header,
  Packer, PageBreak, PageNumber, Paragraph, TextRun,
} = require("docx");
const fs = require("fs");
const path = require("path");

const OUTPUT_PATH =
  "E:/商业逻辑和理论/软著申请材料/最新/最新/新建文件夹/浮游AI智能分析决策系统V1.0_源代码清单_终稿.docx";

const MAX_FILE_LINES = 220;
const TAIL_FILE_LINES = 82;
const ESTIMATED_LINES_PER_PAGE = 37;
const TARGET_MIN_PAGES = 60;
const WRAP_COLS = 80;
const SOFTWARE_NAME = "浮游AI智能分析决策系统V1.0";

const FORBIDDEN_TOKENS = [
  ["node_modules", "node modules"],
  ["package-lock", "package lock"],
  ["integrity", "consistency"],
  ["sha512", "sha-512"],
  ["Vercel Dashboard", "Vercel console"],
];

// ── 去重版文件列表（37个文件）──
// 严格移除（3文档重叠，归属提示词管理系统）：
//   lib/promptos/modules.config.json、registry.generated.ts、prompts.generated.ts
// 保留（2文档重叠，智能分析作为核心消费方，与工作流编排共享引擎层）：
//   engine.ts、run-engine.ts、lib/promptos/core/* 全部、lib/supabase/server.ts、app/api/run
// 新增（独有）：
//   lib/lang/detectLanguage.ts、lib/llm/provider.ts、src/lib/gemini.ts、lib/creem/env.ts
//   lib/api/withRouteError.ts、lib/supabaseAdmin.ts、app/api/portal/route.ts、app/api/test-trial/route.ts
const FILE_LIST = [
  { path: "lib/promptos/run-engine.ts",           description: "分析执行入口，串联输入、规则解析与结果生成" },
  { path: "lib/promptos/engine.ts",               description: "分析引擎主体，处理模块装配、调用与执行策略" },
  { path: "lib/promptos/prompts.ts",              description: "分析提示词访问层，向运行时提供提示词读取能力" },
  { path: "lib/promptos/core/bootstrap.ts",       description: "分析引擎启动文件，负责底层组件初始化" },
  { path: "lib/promptos/core/core-map.ts",        description: "分析核心映射表，定义核心能力和类型映射" },
  { path: "lib/promptos/core/resolve-core.ts",    description: "核心解析器，负责解析模块依赖与调用对象" },
  { path: "lib/promptos/core/run-core-engine.ts", description: "核心运行器，负责单次分析任务的执行过程" },
  { path: "lib/promptos/core/validate-core.ts",   description: "核心校验逻辑，校验分析任务输入与模块合法性" },
  { path: "lib/supabase/server.ts",               description: "服务端数据访问层，用于分析结果的查询与持久化" },
  { path: "app/api/run/route.ts",                 description: "通用运行路由，承接分析类任务的统一入口" },
  { path: "app/api/intent/route.ts",              description: "意图识别路由，为分析任务提供意图判定能力" },
  { path: "app/api/registry/route.ts",            description: "模块注册查询路由，向分析模块暴露注册信息" },
  { path: "lib/lang/detectLanguage.ts",           description: "语言检测模块，识别分析输入内容的语言类型" },
  { path: "lib/llm/provider.ts",                  description: "大模型提供者封装，统一管理分析任务的模型调用接口" },
  { path: "src/lib/gemini.ts",                    description: "Gemini AI 集成层，为分析决策提供多模态推理能力" },
  { path: "lib/creem/env.ts",                     description: "支付环境配置，管理分析系统的订阅与授权环境变量" },
  { path: "lib/api/withRouteError.ts",            description: "路由错误处理中间件，统一捕获分析接口的异常响应" },
  { path: "lib/supabaseAdmin.ts",                 description: "数据库管理端封装，支持分析结果的写入与权限操作" },
  { path: "app/api/portal/route.ts",              description: "用户门户路由，处理分析系统的会员管理与账户操作" },
  { path: "app/api/test-trial/route.ts",          description: "试用测试接口，验证分析系统的访客体验流程" },
  { path: "public/modules/C2-01-Data Understanding Module.json",        description: "C2 系列数据分析模块配置" },
  { path: "public/modules/C2-02-Data Insight Module.json",              description: "C2 系列数据分析模块配置" },
  { path: "public/modules/C2-3-Data Meaning Module.json",               description: "C2 系列数据分析模块配置" },
  { path: "public/modules/C2-4-Data Action Module.json",                description: "C2 系列数据分析模块配置" },
  { path: "public/modules/E5-01-academic-abstract-generator.json",      description: "E5 系列学术模块配置" },
  { path: "public/modules/E5-02-academic-model-framework-builder.json", description: "E5 系列学术模块配置" },
  { path: "public/modules/E5-03-theory-explanation-module.json",        description: "E5 系列学术模块配置" },
  { path: "public/modules/E5-04-literature-review-generator.json",      description: "E5 系列学术模块配置" },
  { path: "public/modules/E6-01-meeting-minutes-generator.json",        description: "E6 系列商务模块配置" },
  { path: "public/modules/E6-02-business-report-generator.json",        description: "E6 系列商务模块配置" },
  { path: "public/modules/E6-03-business-dialogue-generator.json",      description: "E6 系列商务模块配置" },
  { path: "public/modules/D1-01-Meeting Summary Generator.json",        description: "D1 系列会议模块配置" },
  { path: "public/modules/D1-02-Action Items Extractor.json",           description: "D1 系列会议模块配置" },
  { path: "public/modules/D1-03-Structured Meeting Document Generator.json", description: "D1 系列会议模块配置" },
  { path: "public/modules/D3-01-In-depth Interview Question Generator.json", description: "D3 系列访谈模块配置" },
  { path: "public/modules/D3-02-Structured Interview Outline Generator.json", description: "D3 系列访谈模块配置" },
  { path: "public/modules/D4-01-Knowledge Graph Extraction Module.json", description: "D4 系列知识图谱模块配置" },
];

function safeRead(filePath) {
  try { return fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n"); }
  catch { console.warn(`  跳过: ${filePath}`); return null; }
}

function buildFiles() {
  return FILE_LIST.flatMap((item) => {
    const p = item.path.replace(/\\/g, "/");
    const content = safeRead(path.join(process.cwd(), p));
    return content ? [{ path: p, description: item.description, content }] : [];
  });
}

function excerptContent(content) {
  const lines = content.split("\n");
  if (lines.length <= MAX_FILE_LINES) return { text: content, originalLines: lines.length };
  const head = Math.max(1, MAX_FILE_LINES - TAIL_FILE_LINES);
  const omitted = lines.length - head - TAIL_FILE_LINES;
  return {
    text: [...lines.slice(0, head), "", `// ... [中间省略 ${omitted} 行代码] ...`, "", ...lines.slice(lines.length - TAIL_FILE_LINES)].join("\n"),
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
    .filter((l) => l.trim() !== ""); // 过滤空行
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
  console.log(`生成: ${SOFTWARE_NAME} 源代码清单`);
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
    { text: "开  发  完  成：2025年1月10日", size: 28, spacing: 200 },
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
    const excerpt = excerptContent(file.content);
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

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT_PATH, buffer);
  console.log(`\n✓ 已输出: ${OUTPUT_PATH}`);
  console.log(`  文件数量: ${files.length}`);
  console.log(`  原始行数: ${totalOriginalLines}`);
  console.log(`  摘录行数: ${totalExcerptLines}`);
  console.log(`  估算页数: ${estimatedPages}`);
}

main().catch((err) => { console.error("生成失败:", err); process.exit(1); });
