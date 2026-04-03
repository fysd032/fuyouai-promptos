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
  "E:/商业逻辑和理论/软著申请材料/最新/最新/新建文件夹/浮游AI提示词生成与管理系统V1.0_源代码清单_终稿.docx";

const MAX_FILE_LINES = 480;            // 增加以展示更多原始内容（补偿去除空行后的页数）
const TAIL_FILE_LINES = 150;
const ESTIMATED_LINES_PER_PAGE = 28;
const TARGET_MIN_PAGES = 60;
const WRAP_COLS = 80;                  // 超过此宽度的行自动折行
const SOFTWARE_NAME = "浮游AI提示词生成与管理系统V1.0";

const FORBIDDEN_TOKENS = [
  ["node_modules", "node modules"],
  ["package-lock", "package lock"],
  ["integrity", "consistency"],
  ["sha512", "sha-512"],
  ["Vercel Dashboard", "Vercel console"],
];

// ── 去重版文件列表（19个文件）──
// 移除：module_mapping.v2.json → 归属工作流编排系统（运行时路由映射）
// 本系统为以下文件独有持有者：modules.config.json、prompts.generated.ts、registry.generated.ts
const FILE_LIST = [
  { path: "lib/promptos/modules.config.json",          description: "提示词模块总配置，定义模块分组、元信息与加载策略" },
  { path: "lib/promptos/prompts.generated.ts",         description: "提示词生成结果文件，集中保存可调用的提示词模板" },
  { path: "lib/promptos/prompt-bank.generated.ts",     description: "提示词库生成文件，组织提示词正文与索引内容", wrappedHead: 350, wrappedTail: 150 },
  { path: "lib/promptos/module-map.generated.ts",      description: "模块映射生成文件，维护模块 ID 与配置间的映射" },
  { path: "lib/promptos/frontendModuleIdMap.ts",       description: "前端模块编号映射，衔接界面模块与提示词资源" },
  { path: "lib/promptos/moduleOrder.ts",               description: "提示词模块排序配置，控制显示和执行顺序" },
  { path: "lib/promptos/registry.generated.ts",        description: "提示词注册表生成文件，统一暴露模块注册结果" },
  { path: "lib/promptos/prompt-index.ts",              description: "提示词索引层，管理 promptKey 与模块定位关系" },
  { path: "public/modules/B1-01-business-polish.json", description: "B1 系列模块配置与规则定义" },
  { path: "public/modules/B1-03-oral-to-written.json", description: "B1 系列模块配置与规则定义" },
  { path: "public/modules/B2-01-rewrite-generator.json",         description: "B2 系列模块配置与规则定义" },
  { path: "public/modules/B2-02-expand-generator.json",          description: "B2 系列模块配置与规则定义" },
  { path: "public/modules/B2-03-compress-generator.json",        description: "B2 系列模块配置与规则定义" },
  { path: "public/modules/B3-01-table-to-document.json",         description: "B3 系列模块配置与规则定义" },
  { path: "public/modules/B3-02-document-to-ppt.json",           description: "B3 系列模块配置与规则定义" },
  { path: "public/modules/B3-03-longtext-to-keypoints.json",     description: "B3 系列模块配置与规则定义" },
  { path: "public/modules/B3-04-video-to-document.json",         description: "B3 系列模块配置与规则定义" },
  { path: "public/modules/B3-05-document-to-script.json",        description: "B3 系列模块配置与规则定义" },
  { path: "public/modules/B3-06-audio-to-structure.json",        description: "B3 系列模块配置与规则定义" },
];

function safeRead(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return content.replace(/\r\n/g, "\n");
  } catch {
    console.warn(`  文件不存在，跳过: ${filePath}`);
    return null;
  }
}

function buildFiles() {
  const result = [];
  for (const item of FILE_LIST) {
    const p = item.path.replace(/\\/g, "/");
    const content = safeRead(path.join(process.cwd(), p));
    if (content === null) continue;
    result.push({
      path: p,
      description: item.description,
      content,
      wrappedHead: item.wrappedHead,
      wrappedTail: item.wrappedTail,
    });
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

// 超长行按 WRAP_COLS 折行，保留原始缩进
function wrapLine(line) {
  if (line.length <= WRAP_COLS) return [line];
  const indent = line.match(/^(\s*)/)[1];
  const continuation = indent + "  "; // 折行缩进多两格
  const result = [];
  let remaining = line;
  while (remaining.length > WRAP_COLS) {
    // 尽量在空格/标点处断开
    let breakAt = WRAP_COLS;
    const breakChars = [" ", ",", ";", "{", "}", "[", "]", "(", ")"];
    for (let i = WRAP_COLS; i > WRAP_COLS - 20 && i > 0; i--) {
      if (breakChars.includes(remaining[i])) { breakAt = i + 1; break; }
    }
    result.push(remaining.slice(0, breakAt));
    remaining = continuation + remaining.slice(breakAt).trimStart();
  }
  if (remaining.length > 0) result.push(remaining);
  return result;
}

// 将代码文本中所有超长行展开为多行
function expandLongLines(text) {
  return text
    .split("\n")
    .flatMap((line) => wrapLine(line))
    .join("\n");
}

// 去除连续空行（最多保留1个空行）
function removeExcessBlanks(text) {
  return text.replace(/\n{3,}/g, "\n\n");
}

// 将连续的纯关闭括号行（}  ],  },  );  }; 等）合并为一行
function collapseClosingBrackets(text) {
  const lines = text.split("\n");
  const result = [];
  let buf = [];
  const isClosing = (l) => /^\s*[}\])\s,;]+\s*$/.test(l) && l.trim().length > 0 && l.trim().length <= 6;

  for (const line of lines) {
    if (isClosing(line)) {
      buf.push(line.trim());
    } else {
      if (buf.length > 2) {
        // 超过2个连续关闭括号才合并，避免破坏正常排版
        result.push(buf.join(" "));
      } else {
        result.push(...buf);
      }
      buf = [];
      result.push(line);
    }
  }
  if (buf.length > 2) result.push(buf.join(" "));
  else result.push(...buf);
  return result.join("\n");
}

// 对折行后的文本再做一次行数截取（头+省略+尾）
function capWrappedLines(text, headLines, tailLines) {
  const lines = text.split("\n");
  if (lines.length <= headLines + tailLines) return text;
  const omitted = lines.length - headLines - tailLines;
  return [
    ...lines.slice(0, headLines),
    "",
    `// ... [中间省略 ${omitted} 行（已折行）] ...`,
    "",
    ...lines.slice(lines.length - tailLines),
  ].join("\n");
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

// 统一标题：▌文件 X：path，单段Run，宋体，1F5C99，加粗
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
    { text: "开  发  完  成：2025年1月31日", size: 28, spacing: 200 },
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
    let safeText = expandLongLines(
      collapseClosingBrackets(
        removeExcessBlanks(sanitize(excerpt.text))
      )
    );
    // 对有专属折行上限的文件再做二次截取
    if (file.wrappedHead && file.wrappedTail) {
      safeText = capWrappedLines(safeText, file.wrappedHead, file.wrappedTail);
    }
    totalExcerptLines += safeText.split("\n").filter((l) => l.trim() !== "").length;
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

    // 过滤空行，只对有内容的行编号（全文统一处理）
    const nonEmptyLines = safeText.split("\n").filter((l) => l.trim() !== "");
    nonEmptyLines.forEach((line, lineIndex) => {
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
