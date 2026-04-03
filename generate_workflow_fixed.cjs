const {
  AlignmentType, BorderStyle, Document, Footer, Header,
  Packer, PageBreak, PageNumber, Paragraph, TextRun,
} = require("docx");
const fs = require("fs");
const path = require("path");

const OUTPUT_PATH =
  "E:/商业逻辑和理论/软著申请材料/最新/最新/新建文件夹/浮游AI智能工作流编排系统V1.0_源代码清单_终稿.docx";

const MAX_FILE_LINES = 100;   // 全局默认（去重版：移除2个文件，提升上限补回页数）
const TAIL_FILE_LINES = 38;
const ESTIMATED_LINES_PER_PAGE = 28;
const TARGET_MIN_PAGES = 60;
const WRAP_COLS = 80;
const SOFTWARE_NAME = "浮游AI智能工作流编排系统V1.0";

const FORBIDDEN_TOKENS = [
  ["node_modules", "node modules"],
  ["package-lock", "package lock"],
  ["integrity", "consistency"],
  ["sha512", "sha-512"],
  ["Vercel Dashboard", "Vercel console"],
];

// ── 去重版文件列表（29个文件）──
// 严格移除（3文档重叠）：
//   lib/promptos/modules.config.json → 归属提示词生成与管理系统
// 移除（UI归属任务结构化）：
//   src/components/pages/ModuleRunnerPage.tsx → 归属任务结构化处理系统
// 新增（独有）：
//   app/api/billing/portal/route.ts（工作流专属支付门户）
// 保留（2文档重叠，工作流为运行时执行层，合理持有）：
//   engine.ts、run-engine.ts、lib/promptos/core/*、lib/supabase/server.ts、app/api/run
const FILE_LIST = [
  { path: "app/api/webhook/creem/route.ts",              description: "支付回调路由，负责工作流订阅状态的同步与更新" },
  { path: "app/api/subscription/route.ts",               description: "订阅接口，负责工作流套餐状态读取与管理" },
  { path: "app/api/subscription/cancel/route.ts",        description: "订阅取消接口，处理工作流高级能力的退订流程" },
  { path: "app/api/invite/validate/route.ts",            description: "邀请码校验接口，验证工作流权限开通条件" },
  { path: "app/api/invite/status/route.ts",              description: "邀请码状态接口，查询工作流访问资格" },
  { path: "app/api/handlers/coreRun.ts",                 description: "核心执行处理器，封装工作流调用链与参数清洗逻辑" },
  { path: "app/api/run/route.ts",                        description: "工作流通用运行路由，承接编排任务的统一入口" },
  { path: "app/api/core/run/route.ts",                   description: "内容生成核心接口，工作流正式用户请求主执行入口" },
  { path: "app/api/core/run-guest/route.ts",             description: "访客试用接口，工作流游客体验模式生成流程控制" },
  { path: "app/api/billing/portal/route.ts",             description: "支付门户路由，处理工作流订阅的账单与管理跳转" },
  { path: "lib/promptos/engine.ts",                      description: "工作流引擎主体，处理模块装配、调用与执行策略" },
  { path: "lib/promptos/run-engine.ts",                  description: "工作流执行入口，串联输入、规则解析与结果生成" },
  { path: "lib/promptos/core/run-core-engine.ts",        description: "核心运行器，负责单次工作流任务的执行过程" },
  { path: "lib/promptos/core/resolve-core.ts",           description: "核心解析器，负责解析工作流模块依赖与调用对象" },
  { path: "lib/promptos/core/core-map.ts",               description: "工作流核心映射表，定义核心能力和类型映射" },
  { path: "lib/promptos/core/validate-core.ts",          description: "核心校验逻辑，校验工作流任务输入与模块合法性" },
  { path: "lib/supabase/server.ts",                      description: "服务端数据访问层，用于工作流状态的查询与持久化" },
  { path: "src/lib/supabaseClient.ts",                   description: "客户端数据库封装，支持工作流状态与数据的读取" },
  { path: "src/context/SubscriptionContext.tsx",         description: "订阅上下文，管理工作流功能访问状态与用户能力范围" },
  { path: "src/components/RequirePlan.tsx",              description: "权限组件，控制工作流高级能力的订阅访问" },
  { path: "src/components/InviteGate.tsx",               description: "邀请码拦截组件，控制工作流功能入口的访问" },
  { path: "module_mapping.v2.json",                      description: "模块映射配置，维护工作流前台功能与后台模块的映射关系", maxLines: 300 },
  { path: "public/modules/E4-01-long-task-chain-orchestrator.json", description: "E4 系列工作流模块配置" },
  { path: "public/modules/E4-02-multistep-auto-executor.json",      description: "E4 系列工作流模块配置" },
  { path: "public/modules/E1-01-Workflow Design Module.json",        description: "E1 系列工作流模块配置" },
  { path: "public/modules/E1-02-Action Plan Generator.json",         description: "E1 系列工作流模块配置" },
  { path: "public/modules/E3-01-self-reflection-module.json",        description: "E3 系列工作流模块配置" },
  { path: "public/modules/E3-02-error-checking-module.json",         description: "E3 系列工作流模块配置" },
  { path: "public/modules/E3-03-quality-scoring-module.json",        description: "E3 系列工作流模块配置" },
  { path: "components/AccountPages.tsx",                             description: "账户管理页，展示工作流订阅状态、用量记录与账单信息" },
  { path: "components/Pricing.tsx",                                  description: "定价组件，展示工作流各套餐功能权益与订阅引导" },
  { path: "components/CheckoutSuccess.tsx",                          description: "支付成功页，确认工作流权限激活并引导用户进入系统" },
  { path: "components/Topbar.tsx",                                   description: "顶部导航栏，集成工作流状态入口与用户账户快捷操作" },
  { path: "scripts/server.ts",                                       description: "服务器启动脚本，承载工作流系统的本地开发与运行环境" },
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
  const tail = Math.min(TAIL_FILE_LINES, Math.floor(maxLines * 0.4));
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
    { text: "开  发  完  成：2025年2月28日", size: 28, spacing: 200 },
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
  console.log(`\n已输出: ${OUTPUT_PATH}`);
  console.log(`  文件数量: ${files.length}`);
  console.log(`  原始行数: ${totalOriginalLines}`);
  console.log(`  摘录行数: ${totalExcerptLines}`);
  console.log(`  估算页数: ${estimatedPages}`);
}

main().catch((err) => { console.error("生成失败:", err); process.exit(1); });
