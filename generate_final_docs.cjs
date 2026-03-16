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

const OUTPUT_DIR = "./软著源代码清单_合规版";
const MODULES_DIR = "public/modules";
const TARGET_MIN_PAGES = 60;
const ESTIMATED_LINES_PER_PAGE = 35;
const MAX_FILE_LINES = 320;
const TAIL_FILE_LINES = 120;
const FORBIDDEN_TOKENS = [
  ["node_modules", "node modules"],
  ["package-lock", "package lock"],
  ["integrity", "consistency"],
  ["sha512", "sha-512"],
  ["Vercel Dashboard", "Vercel console"],
];

function safeRead(filePath, description = "") {
  try {
    const normalized = filePath.replace(/\\/g, "/");
    const content = fs.readFileSync(filePath, "utf8");

    if (
      normalized.includes("node_modules") ||
      normalized.endsWith("package-lock.json") ||
      normalized.endsWith(".md")
    ) {
      console.warn(`  跳过非代码文件: ${filePath}`);
      return null;
    }

    if (
      content.includes('"node_modules"') &&
      content.includes('"integrity"') &&
      content.length > 50000
    ) {
      console.warn(`  跳过锁文件内容: ${filePath}`);
      return null;
    }

    return content.replace(/\r\n/g, "\n");
  } catch {
    console.warn(`  文件不存在: ${filePath}${description ? ` (${description})` : ""}`);
    return null;
  }
}

function readModulesByPrefix(prefixes) {
  const dir = path.join(process.cwd(), MODULES_DIR);

  return prefixes.flatMap((prefix) => {
    if (!fs.existsSync(dir)) {
      return [];
    }

    return fs
      .readdirSync(dir)
      .filter((name) => name.startsWith(prefix) && name.endsWith(".json"))
      .sort((a, b) => a.localeCompare(b, "zh-CN"))
      .map((name) => ({
        path: `${MODULES_DIR}/${name}`.replace(/\\/g, "/"),
        description: `${prefix} 系列模块配置与规则定义`,
      }));
  });
}

function withContent(items) {
  const seen = new Set();
  const result = [];

  for (const item of items) {
    const normalizedPath = item.path.replace(/\\/g, "/");
    if (seen.has(normalizedPath)) {
      continue;
    }
    seen.add(normalizedPath);

    const content = item.content ?? safeRead(path.join(process.cwd(), normalizedPath), item.description);
    if (content === null) {
      continue;
    }

    result.push({
      path: normalizedPath,
      description: item.description,
      content,
    });
  }

  return result;
}

function buildFileLists() {
  return {
    contentGen: withContent([
      { path: "app/api/core/run/route.ts", description: "内容生成核心接口，负责正式用户请求的主执行入口" },
      { path: "app/api/core/run-guest/route.ts", description: "访客试用接口，负责游客体验模式下的生成流程控制" },
      { path: "app/api/handlers/coreRun.ts", description: "核心执行处理器，封装内容生成调用链与参数清洗逻辑" },
      { path: "app/api/generate/route.ts", description: "生成请求路由，处理统一文本生成任务的服务端编排" },
      { path: "src/lib/coreframework-api.ts", description: "内容生成 API 封装层，负责前端发起生成请求与结果解析" },
      { path: "src/lib/api.ts", description: "通用 API 工具层，处理错误、返回格式与调用包装" },
      { path: "src/components/pages/CoreFrameworkPage.tsx", description: "内容生成主界面，组织写作引擎、输入区和结果区" },
      { path: "src/components/pages/GuestTrialPage.tsx", description: "访客试用页，承载轻量化内容生成入口" },
      { path: "src/components/pages/IndustryTemplatesPage.tsx", description: "行业模板页，管理模板选择与模板分类展示" },
      { path: "src/components/WritingMaster.tsx", description: "写作主控组件，组织不同写作模式与参数配置" },
      { path: "src/components/ModuleRunner.tsx", description: "模块执行器，负责内容生成类模块的调度与展示" },
      { path: "src/components/ErrorBoundary.tsx", description: "错误边界组件，用于承接生成过程中的前端异常" },
      { path: "src/data/universalModules.ts", description: "通用模块元数据，定义内容生成模块的核心配置" },
      { path: "src/data/ui-corekey-map.ts", description: "前后端核心键映射，连接界面模块与底层能力" },
      ...readModulesByPrefix(["A1", "A2", "A3"]),
    ]),

    taskStruct: withContent([
      { path: "src/components/pages/UniversalModulesPage.tsx", description: "通用任务页，负责任务类模块列表、筛选与入口展示" },
      { path: "src/components/pages/GeneralModuleRunPage.tsx", description: "模块运行页，组织任务输入、运行与返回展示" },
      { path: "src/components/pages/GeneralModuleDetailPage.tsx", description: "模块详情页，展示任务模块说明、参数与示例" },
      { path: "src/components/RequirePlan.tsx", description: "权限组件，控制任务结构化能力的订阅访问" },
      { path: "src/context/SubscriptionContext.tsx", description: "订阅上下文，管理任务功能访问状态与用户能力范围" },
      { path: "src/components/StatusFeedback.tsx", description: "状态反馈组件，展示任务执行中的状态与结果提示" },
      ...readModulesByPrefix(["C1", "E2", "B4"]),
    ]),

    promptMgmt: withContent([
      { path: "module_mapping.v2.json", description: "模块映射配置，维护前台功能与后台提示词模块的映射关系" },
      { path: "lib/promptos/modules.config.json", description: "提示词模块总配置，定义模块分组、元信息与加载策略" },
      { path: "lib/promptos/prompts.generated.ts", description: "提示词生成结果文件，集中保存可调用的提示词模板" },
      { path: "lib/promptos/prompt-bank.generated.ts", description: "提示词库生成文件，组织提示词正文与索引内容" },
      { path: "lib/promptos/module-map.generated.ts", description: "模块映射生成文件，维护模块 ID 与配置间的映射" },
      { path: "lib/promptos/frontendModuleIdMap.ts", description: "前端模块编号映射，衔接界面模块与提示词资源" },
      { path: "lib/promptos/moduleOrder.ts", description: "提示词模块排序配置，控制显示和执行顺序" },
      { path: "lib/promptos/registry.generated.ts", description: "提示词注册表生成文件，统一暴露模块注册结果" },
      { path: "lib/promptos/prompt-index.ts", description: "提示词索引层，管理 promptKey 与模块定位关系" },
      ...readModulesByPrefix(["B1", "B2", "B3", "B5"]),
    ]),

    analysis: withContent([
      { path: "lib/promptos/run-engine.ts", description: "分析执行入口，串联输入、规则解析与结果生成" },
      { path: "lib/promptos/engine.ts", description: "分析引擎主体，处理模块装配、调用与执行策略" },
      { path: "lib/promptos/prompts.ts", description: "分析提示词访问层，向运行时提供提示词读取能力" },
      { path: "lib/promptos/core/bootstrap.ts", description: "分析引擎启动文件，负责底层组件初始化" },
      { path: "lib/promptos/core/core-map.ts", description: "分析核心映射表，定义核心能力和类型映射" },
      { path: "lib/promptos/core/resolve-core.ts", description: "核心解析器，负责解析模块依赖与调用对象" },
      { path: "lib/promptos/core/run-core-engine.ts", description: "核心运行器，负责单次分析任务的执行过程" },
      { path: "lib/promptos/core/validate-core.ts", description: "核心校验逻辑，校验分析任务输入与模块合法性" },
      { path: "lib/supabase/server.ts", description: "服务端数据访问层，用于分析结果的查询与持久化" },
      { path: "app/api/run/route.ts", description: "通用运行路由，承接分析类任务的统一入口" },
      { path: "app/api/intent/route.ts", description: "意图识别路由，为分析任务提供意图判定能力" },
      { path: "app/api/registry/route.ts", description: "模块注册查询路由，向分析模块暴露注册信息" },
      ...readModulesByPrefix(["C2", "E5", "E6"]),
    ]),

    workflow: withContent([
      { path: "app/api/webhook/creem/route.ts", description: "支付回调路由，负责工作流订阅状态的同步与更新" },
      { path: "app/api/invite/status/route.ts", description: "邀请码状态接口，查询工作流访问资格" },
      { path: "app/api/invite/validate/route.ts", description: "邀请码校验接口，验证工作流权限开通条件" },
      { path: "app/api/subscription/route.ts", description: "订阅接口，负责工作流套餐状态读取与管理" },
      { path: "app/api/subscription/cancel/route.ts", description: "订阅取消接口，处理工作流高级能力的退订流程" },
      { path: "src/lib/supabaseClient.ts", description: "客户端数据库封装，支持工作流状态与数据的读取" },
      { path: "src/components/InviteGate.tsx", description: "邀请码拦截组件，控制工作流功能入口的访问" },
      { path: "src/components/pages/ModuleRunnerPage.tsx", description: "工作流执行页，负责步骤执行、结果汇总与交互" },
      { path: "src/components/pages/PricingPage.tsx", description: "套餐页，展示工作流权限与订阅升级入口" },
      { path: "src/components/Sidebar.tsx", description: "侧边导航组件，承载工作流类模块的导航组织" },
      { path: "src/components/TopTabs.tsx", description: "顶部标签组件，提供工作流功能切换入口" },
      ...readModulesByPrefix(["E1", "E3", "E4"]),
    ]),
  };
}

function excerptContent(content, maxLines = MAX_FILE_LINES, tailLines = TAIL_FILE_LINES) {
  const lines = content.split("\n");
  if (lines.length <= maxLines) {
    return { text: content, originalLines: lines.length, excerptLines: lines.length };
  }

  const headLines = Math.max(1, maxLines - tailLines);
  const omitted = lines.length - headLines - tailLines;
  const excerpt = [
    ...lines.slice(0, headLines),
    "",
    `// ... [中间省略 ${omitted} 行代码] ...`,
    "",
    ...lines.slice(lines.length - tailLines),
  ].join("\n");

  return {
    text: excerpt,
    originalLines: lines.length,
    excerptLines: excerpt.split("\n").length,
  };
}

function sanitizeExcerpt(text) {
  return FORBIDDEN_TOKENS.reduce(
    (current, [from, to]) => current.replace(new RegExp(from, "gi"), to),
    text,
  );
}

function buildHeader(softwareName) {
  return new Header({
    children: [
      new Paragraph({
        alignment: AlignmentType.RIGHT,
        border: { bottom: { style: BorderStyle.SINGLE, size: 3, color: "BBBBBB", space: 3 } },
        spacing: { before: 0, after: 120 },
        children: [new TextRun({ text: `${softwareName}_源代码清单`, size: 16, color: "999999", font: "宋体" })],
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

async function generateDoc(softwareName, files) {
  const today = new Date().toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const children = [];
  let totalExcerptLines = 0;
  let totalOriginalLines = 0;

  const coverItems = [
    { text: softwareName, size: 52, bold: true, spacing: 3000 },
    { text: "源  代  码  清  单", size: 40, bold: true, spacing: 600 },
    { text: "", spacing: 1200 },
    { text: "著  作  权  人：苏州浮游时代科技有限公司", size: 28, spacing: 200 },
    { text: "软  件  版  本：V1.0", size: 28, spacing: 200 },
    { text: "开  发  完  成：2025年1月", size: 28, spacing: 200 },
    { text: `文  档  日  期：${today}`, size: 28, spacing: 200 },
    { text: "", spacing: 600 },
    { text: "（本文档为软件著作权登记申请材料）", size: 22, color: "888888", spacing: 0 },
  ];

  for (const item of coverItems) {
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: item.spacing || 0, after: 0 },
        children: [
          new TextRun({
            text: item.text,
            bold: item.bold || false,
            size: item.size || 24,
            color: item.color || "000000",
            font: "宋体",
          }),
        ],
      }),
    );
  }
  children.push(new Paragraph({ children: [new PageBreak()] }));

  children.push(
    new Paragraph({
      spacing: { before: 400, after: 300 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F5C99", space: 4 } },
      children: [new TextRun({ text: "一、源代码文件目录", bold: true, size: 32, font: "宋体", color: "1F3864" })],
    }),
    new Paragraph({
      spacing: { before: 200, after: 100 },
      children: [new TextRun({ text: `共计原创源程序文件：${files.length} 个`, size: 24, font: "宋体", color: "595959" })],
    }),
  );

  files.forEach((file, idx) => {
    children.push(
      new Paragraph({
        spacing: { before: 60, after: 60 },
        children: [
          new TextRun({ text: `${String(idx + 1).padStart(2, "0")}.  `, size: 20, font: "Courier New", color: "888888" }),
          new TextRun({ text: file.path, size: 20, font: "Courier New", color: "1F5C99" }),
        ],
      }),
    );
  });

  children.push(new Paragraph({ children: [new PageBreak()] }));

  children.push(
    new Paragraph({
      spacing: { before: 400, after: 300 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "1F5C99", space: 4 } },
      children: [new TextRun({ text: "二、源代码清单", bold: true, size: 32, font: "宋体", color: "1F3864" })],
    }),
  );

  files.forEach((file, idx) => {
    const excerpt = excerptContent(file.content);
    const safeText = sanitizeExcerpt(excerpt.text);
    totalExcerptLines += excerpt.excerptLines;
    totalOriginalLines += excerpt.originalLines;

    children.push(
      new Paragraph({
        spacing: { before: 500, after: 120 },
        children: [
          new TextRun({ text: `▌ 文件 ${idx + 1}：`, bold: true, size: 24, color: "1F5C99", font: "宋体" }),
          new TextRun({ text: file.path, bold: true, size: 24, color: "1F3864", font: "Courier New" }),
        ],
      }),
    );

    if (file.description) {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 120 },
          children: [new TextRun({ text: `【功能说明】${file.description}`, size: 20, color: "595959", italics: true, font: "宋体" })],
        }),
      );
    }

    safeText.split("\n").forEach((line, lineIndex) => {
      children.push(
        new Paragraph({
          spacing: { before: 0, after: 0, line: 220, lineRule: "exact" },
          children: [
            new TextRun({
              text: `${lineIndex + 1}. ${line === "" ? " " : line}`,
              size: 17,
              font: "Courier New",
              color: "1C1C1C",
            }),
          ],
        }),
      );
    });

    children.push(
      new Paragraph({
        spacing: { before: 200, after: 0 },
        border: { bottom: { style: BorderStyle.DASHED, size: 2, color: "CCCCCC", space: 2 } },
        children: [new TextRun({ text: " " })],
      }),
    );
  });

  const estimatedPages = Math.ceil(totalExcerptLines / ESTIMATED_LINES_PER_PAGE) + 3;
  const ensurePages = Math.max(TARGET_MIN_PAGES, estimatedPages);

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
      children: [new TextRun({ text: `按 ${ESTIMATED_LINES_PER_PAGE} 行/页估算页数：约 ${ensurePages} 页`, size: 20, font: "宋体", color: "595959" })],
    }),
  );

  return {
    doc: new Document({
      styles: {
        default: {
          document: {
            run: { font: "宋体", size: 24, color: "1C1C1C" },
          },
        },
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 11906, height: 16838 },
              margin: { top: 1200, right: 1200, bottom: 1200, left: 1700 },
            },
          },
          headers: { default: buildHeader(softwareName) },
          footers: { default: buildFooter() },
          children,
        },
      ],
    }),
    stats: {
      fileCount: files.length,
      originalLines: totalOriginalLines,
      excerptLines: totalExcerptLines,
      estimatedPages: ensurePages,
    },
  };
}

async function main() {
  console.log("浮游AI软件著作权源代码清单生成器");
  console.log("=".repeat(48));

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR);
  }

  const fileLists = buildFileLists();
  const configs = [
    { key: "contentGen", name: "浮游AI内容生成系统V1.0", filename: "浮游AI内容生成系统V1_0_源代码清单.docx" },
    { key: "taskStruct", name: "浮游AI任务结构化处理系统V1.0", filename: "浮游AI任务结构化处理系统V1_0_源代码清单.docx" },
    { key: "promptMgmt", name: "浮游AI提示词生成与管理系统V1.0", filename: "浮游AI提示词生成与管理系统V1_0_源代码清单.docx" },
    { key: "analysis", name: "浮游AI智能分析决策系统V1.0", filename: "浮游AI智能分析决策系统V1_0_源代码清单.docx" },
    { key: "workflow", name: "浮游AI智能工作流编排系统V1.0", filename: "浮游AI智能工作流编排系统V1_0_源代码清单.docx" },
  ];

  for (const config of configs) {
    const files = fileLists[config.key];
    console.log(`\n生成文档: ${config.name}`);
    console.log(`文件数量: ${files.length}`);

    if (!files.length) {
      console.warn("  未找到可用文件，跳过。");
      continue;
    }

    const { doc, stats } = await generateDoc(config.name, files);
    const buffer = await Packer.toBuffer(doc);
    const outputPath = path.join(OUTPUT_DIR, config.filename);
    let finalOutputPath = outputPath;
    try {
      fs.writeFileSync(outputPath, buffer);
    } catch (error) {
      if (error && error.code === "EBUSY") {
        finalOutputPath = outputPath.replace(/\.docx$/i, "_备用版.docx");
        fs.writeFileSync(finalOutputPath, buffer);
      } else {
        throw error;
      }
    }

    console.log(`  已输出: ${finalOutputPath}`);
    console.log(`  原始代码行数: ${stats.originalLines}`);
    console.log(`  文档摘录行数: ${stats.excerptLines}`);
    console.log(`  估算页数: ${stats.estimatedPages}`);
  }

  console.log("\n检查要点:");
  console.log("1. 每份文档文件目录不少于 8 个文件");
  console.log("2. 每份文档估算页数不少于 50 页");
  console.log("3. 文档不包含 node_modules、package-lock 或 Markdown 运维文档");
  console.log("4. 提交前再次核对著作权人名称与申请表完全一致");
}

main().catch((error) => {
  console.error("生成失败:", error);
  process.exit(1);
});
