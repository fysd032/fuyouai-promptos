const {
  AlignmentType,
  Document,
  Header,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  TabStopType,
  TextRun,
} = require("docx");
const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();
const OUTPUT_DIR = "E:/商业逻辑和理论/软著申请材料/最新";
const COPYRIGHT_OWNER = "苏州浮游时代科技有限公司";
const DOC_DATE = "2026年3月13日";
const CODE_FONT = "Courier New";
const CODE_FONT_FALLBACK = "Consolas";
const CODE_FONT_SIZE_HALF_PT = 18;
const CODE_LINE_SPACING = 240;
const CODE_LINES_PER_PAGE = 50;
const COVER_TITLE_SIZE = 36;
const COVER_SUBTITLE_SIZE = 24;
const NORMAL_TEXT_SIZE = 20;
const DIRECTORY_TITLE_SIZE = 28;
const DIRECTORY_FONT_SIZE_HALF_PT = 24;
const DIRECTORY_LINE_SPACING = 280;
const DIRECTORY_TITLE_COLOR = "7FA6D9";
const DIRECTORY_TEXT_COLOR = "8FB3E0";
const SECTION_TITLE_COLOR = "8FB3E0";
const SECTION_TITLE_SIZE = 22;
const SECTION_TITLE_LINE_SPACING = 280;
const PAGE_WIDTH = 11906;
const PAGE_HEIGHT = 16838;
const MARGIN_TOP = 1440;
const MARGIN_BOTTOM = 1440;
const MARGIN_LEFT = 1701;
const MARGIN_RIGHT = 1247;
const HEADER_Y = 720;
const FOOTER_Y = 720;
const HEADER_RIGHT_TAB = 9300;
const LONG_LINE_THRESHOLD = 100;
const DANGEROUS_TEXT_PATTERNS = ["省略", "...", "truncated", "omitted", "略"];

const SYSTEMS = [
  {
    softwareName: "浮游AI内容生成系统V1.0",
    baseName: "浮游AI内容生成系统V1.0_源代码清单",
    files: [
      ["app/api/core/run/route.ts", "内容生成核心接口，负责正式用户请求的主执行入口"],
      ["app/api/core/run-guest/route.ts", "访客试用接口，负责试用模式下的生成流程控制"],
      ["app/api/handlers/coreRun.ts", "核心执行处理器，封装内容生成调用链与参数处理流程"],
      ["app/api/generate/route.ts", "生成路由，处理统一文本生成任务的服务端编排"],
      ["src/lib/coreframework-api.ts", "内容生成 API 封装层，负责前端调用与结果解析"],
      ["src/lib/api.ts", "通用 API 工具层，处理错误与返回格式"],
      ["src/components/pages/CoreFrameworkPage.tsx", "内容生成主界面，组织写作引擎、输入区和结果区"],
      ["src/components/pages/GuestTrialPage.tsx", "访客试用页，承载轻量化内容生成入口"],
      ["src/components/pages/IndustryTemplatesPage.tsx", "行业模板页，管理模板分类与选择入口"],
      ["src/components/WritingMaster.tsx", "写作主控组件，组织不同写作模式与参数配置"],
      ["src/components/ModuleRunner.tsx", "模块执行器，负责内容生成类模块的调度与展示"],
      ["src/data/universalModules.ts", "通用模块元数据，定义内容生成模块的核心配置"],
      ["src/data/ui-corekey-map.ts", "前后端核心键映射，连接界面模块与底层能力"],
      ["public/modules/A1-01-writing-generator.json", "长文写作生成模块配置"],
      ["public/modules/A1-02-copywriting-generator.json", "文案生成模块配置"],
      ["public/modules/A1-03-social-post-generator.json", "社媒短文生成模块配置"],
      ["public/modules/A1-04-blog-generator.json", "博客文章生成模块配置"],
      ["public/modules/A1-05-script-generator.json", "脚本生成模块配置"],
      ["public/modules/A2-01-Business Email Generator.json", "商务邮件生成模块配置"],
      ["public/modules/A2-02-English Email Generator.json", "英文邮件生成模块配置"],
      ["public/modules/A2-03-Email Reply Template Generator.json", "邮件回复模板模块配置"],
      ["public/modules/A3-01-title-generator.json", "标题生成模块配置"],
      ["public/modules/A3-02-short-sentence-generator.json", "短句生成模块配置"],
      ["public/modules/A3-03-cta-generator.json", "行动号召生成模块配置"],
      ["public/modules/A3-04-viral-style-template-generator.json", "爆款风格模板模块配置"],
    ],
  },
  {
    softwareName: "浮游AI任务结构化处理系统V1.0",
    baseName: "浮游AI任务结构化处理系统V1.0_源代码清单",
    files: [
      ["src/components/pages/UniversalModulesPage.tsx", "通用任务页，负责任务类模块列表、筛选与入口展示"],
      ["src/components/pages/GeneralModuleRunPage.tsx", "模块运行页，组织任务输入、运行与结果展示"],
      ["src/components/pages/GeneralModuleDetailPage.tsx", "模块详情页，展示任务模块说明、参数与示例"],
      ["src/components/pages/ModuleRunnerPage.tsx", "任务执行页，组织模块运行步骤与结果交互"],
      ["src/components/RequirePlan.tsx", "权限组件，控制任务结构化能力的订阅访问"],
      ["src/context/SubscriptionContext.tsx", "订阅上下文，管理任务功能访问状态与用户能力范围"],
      ["src/components/StatusFeedback.tsx", "状态反馈组件，展示任务执行中的状态与结果提示"],
      ["app/api/core/run/route.ts", "核心执行接口，承接复杂任务结构化请求"],
      ["app/api/core/run-guest/route.ts", "试用执行接口，承接任务试用模式的运行流程"],
      ["app/api/handlers/coreRun.ts", "核心运行处理器，封装任务执行入口与参数处理流程"],
      ["app/api/generate/route.ts", "生成路由，处理通用任务生成与结构化输出"],
      ["src/lib/coreframework-api.ts", "任务执行 API 封装层，负责前端请求与结果解析"],
      ["src/components/WritingMaster.tsx", "任务编排输入组件，组织复杂输入参数与执行模式"],
      ["public/modules/C1-01-cot-reasoning-module.json", "链式推理模块配置"],
      ["public/modules/C1-02-task-decomposition-generator.json", "任务拆解模块配置"],
      ["public/modules/C1-03-decision-matrix-generator.json", "决策矩阵模块配置"],
      ["public/modules/C1-04-market-research-insight-generator.json", "调研洞察模块配置"],
      ["public/modules/C1-05-user-insight-generator.json", "用户洞察模块配置"],
      ["public/modules/C1-06-product-diagnosis-generator.json", "产品诊断模块配置"],
      ["public/modules/E2=04-Consultant Role Agent.json", "顾问角色 Agent 配置"],
      ["public/modules/E2-03-Analyst Role Agent.json", "分析师角色 Agent 配置"],
      ["public/modules/E2-05-Editor Role Agent.json", "编辑角色 Agent 配置"],
      ["public/modules/E2-06-Strategist Role Agent.json", "策略师角色 Agent 配置"],
      ["public/modules/E2-07-Product Manager Role Agent.json", "产品经理角色 Agent 配置"],
      ["public/modules/E2-08-Coach Role Agent.json", "教练角色 Agent 配置"],
      ["public/modules/E2-9-Legal Review Role Agent.json", "法务审校角色 Agent 配置"],
      ["public/modules/B4-01-multimodal-composition-generator.json", "多模态组合模块配置"],
      ["public/modules/B4-02-knowledge-cards-generator.json", "知识卡片模块配置"],
      ["public/modules/B4-03-knowledge-base-structure-generator.json", "知识库结构模块配置"],
      ["public/modules/B4-04-knowledgecards-to-faq-botbase-generator.json", "FAQ 机器人知识库模块配置"],
      ["public/modules/B4-05-content-standardization-generator.json", "内容标准化模块配置"],
    ],
  },
  {
    softwareName: "浮游AI提示词生成与管理系统V1.0",
    baseName: "浮游AI提示词生成与管理系统V1.0_源代码清单",
    files: [
      ["module_mapping.v2.json", "模块映射配置，维护前台功能与后台提示词模块的映射关系"],
      ["lib/promptos/modules.config.json", "提示词模块总配置，定义模块分组、元信息与加载策略"],
      ["lib/promptos/prompts.generated.ts", "提示词生成结果文件，集中保存可调用的提示词模板"],
      ["lib/promptos/prompt-bank.generated.ts", "提示词库生成文件，组织提示词正文与索引内容"],
      ["lib/promptos/module-map.generated.ts", "模块映射生成文件，维护模块 ID 与配置间关系"],
      ["lib/promptos/frontendModuleIdMap.ts", "前端模块编号映射，衔接界面模块与提示词资源"],
      ["lib/promptos/moduleOrder.ts", "提示词模块排序配置，控制显示和执行顺序"],
      ["lib/promptos/registry.generated.ts", "提示词注册表生成文件，统一暴露模块注册结果"],
      ["lib/promptos/prompt-index.ts", "提示词索引层，管理 promptKey 与模块定位关系"],
      ["public/modules/B1-01-business-polish.json", "商务润色模块配置"],
      ["public/modules/B1-03-oral-to-written.json", "口语转书面语模块配置"],
      ["public/modules/B2-01-rewrite-generator.json", "改写生成模块配置"],
      ["public/modules/B2-02-expand-generator.json", "扩写生成模块配置"],
      ["public/modules/B2-03-compress-generator.json", "压缩摘要模块配置"],
      ["public/modules/B3-01-table-to-document.json", "表格转文档模块配置"],
      ["public/modules/B3-02-document-to-ppt.json", "文档转 PPT 模块配置"],
      ["public/modules/B3-03-longtext-to-keypoints.json", "长文转要点模块配置"],
      ["public/modules/B3-04-video-to-document.json", "视频转文档模块配置"],
      ["public/modules/B3-05-document-to-script.json", "文档转脚本模块配置"],
      ["public/modules/B3-06-audio-to-structure.json", "音频转结构化模块配置"],
    ],
  },
  {
    softwareName: "浮游AI智能分析决策系统V1.0",
    baseName: "浮游AI智能分析决策系统V1.0_源代码清单",
    files: [
      ["lib/promptos/run-engine.ts", "分析执行入口，串联输入、规则解析与结果生成"],
      ["lib/promptos/engine.ts", "分析引擎主体，处理模块装配、调用与执行策略"],
      ["lib/promptos/prompts.ts", "分析提示词访问层，向运行时提供提示词读取能力"],
      ["lib/promptos/modules.config.json", "分析相关模块总配置，定义分析能力分组与元信息"],
      ["lib/promptos/registry.generated.ts", "分析模块注册表，统一暴露分析能力注册结果"],
      ["lib/promptos/prompts.generated.ts", "分析与决策提示词集合，提供底层策略模板"],
      ["lib/promptos/core/bootstrap.ts", "分析引擎启动文件，负责底层组件初始化"],
      ["lib/promptos/core/core-map.ts", "分析核心映射表，定义核心能力和类型映射"],
      ["lib/promptos/core/resolve-core.ts", "核心解析器，负责解析模块依赖与调用对象"],
      ["lib/promptos/core/run-core-engine.ts", "核心运行器，负责单次分析任务的执行过程"],
      ["lib/promptos/core/validate-core.ts", "核心校验逻辑，校验分析任务输入与模块合法性"],
      ["lib/supabase/server.ts", "服务端数据访问层，用于分析结果的查询与持久化"],
      ["app/api/run/route.ts", "通用运行路由，承接分析类任务的统一入口"],
      ["app/api/intent/route.ts", "意图识别路由，为分析任务提供意图判定能力"],
      ["app/api/registry/route.ts", "模块注册查询路由，向分析模块暴露注册信息"],
      ["public/modules/C2-01-Data Understanding Module.json", "数据理解模块配置"],
      ["public/modules/C2-02-Data Insight Module.json", "数据洞察模块配置"],
      ["public/modules/C2-3-Data Meaning Module.json", "数据意义解析模块配置"],
      ["public/modules/C2-4-Data Action Module.json", "数据行动建议模块配置"],
      ["public/modules/E5-01-academic-abstract-generator.json", "学术摘要模块配置"],
      ["public/modules/E5-02-academic-model-framework-builder.json", "学术模型框架模块配置"],
      ["public/modules/E5-03-theory-explanation-module.json", "理论解释模块配置"],
      ["public/modules/E5-04-literature-review-generator.json", "文献综述模块配置"],
      ["public/modules/E6-01-meeting-minutes-generator.json", "会议纪要模块配置"],
      ["public/modules/E6-02-business-report-generator.json", "商业报告模块配置"],
      ["public/modules/E6-03-business-dialogue-generator.json", "商业对话模块配置"],
      ["public/modules/D1-01-Meeting Summary Generator.json", "会议总结模块配置"],
      ["public/modules/D1-02-Action Items Extractor.json", "行动项提取模块配置"],
      ["public/modules/D1-03-Structured Meeting Document Generator.json", "结构化会议文档模块配置"],
      ["public/modules/D3-01-In-depth Interview Question Generator.json", "深度访谈问题生成模块配置"],
      ["public/modules/D3-02-Structured Interview Outline Generator.json", "结构化访谈提纲模块配置"],
      ["public/modules/D4-01-Knowledge Graph Extraction Module.json", "知识图谱抽取模块配置"],
    ],
  },
  {
    softwareName: "浮游AI智能工作流编排系统V1.0",
    baseName: "浮游AI智能工作流编排系统V1.0_源代码清单",
    files: [
      ["app/api/webhook/creem/route.ts", "支付回调路由，负责工作流订阅状态的同步与更新"],
      ["app/api/subscription/route.ts", "订阅接口，负责工作流套餐状态读取与管理"],
      ["app/api/subscription/cancel/route.ts", "订阅取消接口，处理工作流高级能力退订流程"],
      ["app/api/invite/validate/route.ts", "邀请码校验接口，验证工作流权限开通条件"],
      ["app/api/invite/status/route.ts", "邀请码状态接口，查询工作流访问资格"],
      ["app/api/handlers/coreRun.ts", "核心运行处理器，封装任务执行入口与参数处理流程"],
      ["app/api/run/route.ts", "统一运行路由，为工作流执行提供服务端入口"],
      ["app/api/core/run/route.ts", "核心执行接口，承接工作流类请求的正式运行流程"],
      ["app/api/core/run-guest/route.ts", "试用执行接口，承接工作流试用模式的运行流程"],
      ["lib/promptos/engine.ts", "工作流引擎主体，负责模块装配与任务执行调度"],
      ["lib/promptos/run-engine.ts", "工作流运行入口，组织输入、模块与执行结果"],
      ["lib/promptos/core/run-core-engine.ts", "核心运行器，处理工作流单次执行过程"],
      ["lib/promptos/core/resolve-core.ts", "核心解析器，解析工作流模块与依赖关系"],
      ["lib/promptos/core/core-map.ts", "核心映射定义，维护工作流能力与类型映射"],
      ["lib/promptos/core/validate-core.ts", "核心校验逻辑，校验任务输入与模块合法性"],
      ["lib/supabase/server.ts", "服务端数据库访问层，处理工作流结果持久化"],
      ["src/lib/supabaseClient.ts", "客户端数据库连接层，支持工作流状态查询"],
      ["src/context/SubscriptionContext.tsx", "订阅状态上下文，管理工作流权限与套餐状态"],
      ["src/components/RequirePlan.tsx", "访问控制组件，限制高级工作流功能的使用"],
      ["src/components/InviteGate.tsx", "邀请码拦截组件，负责工作流入口权限控制"],
      ["src/components/pages/ModuleRunnerPage.tsx", "工作流执行页，组织步骤运行、结果展示与交互"],
      ["lib/promptos/modules.config.json", "工作流相关模块总配置，定义模块分组与元信息"],
      ["module_mapping.v2.json", "模块映射配置，维护前台能力与底层工作流模块关系"],
      ["public/modules/E4-01-long-task-chain-orchestrator.json", "长任务链编排模块配置"],
      ["public/modules/E4-02-multistep-auto-executor.json", "多步骤自动执行模块配置"],
      ["public/modules/E1-01-Workflow Design Module.json", "工作流设计模块配置"],
      ["public/modules/E1-02-Action Plan Generator.json", "行动计划生成模块配置"],
      ["public/modules/E3-01-self-reflection-module.json", "工作流自检模块配置"],
      ["public/modules/E3-02-error-checking-module.json", "工作流错误检查模块配置"],
      ["public/modules/E3-03-quality-scoring-module.json", "工作流质量评分模块配置"],
    ],
  },
];

function readFileContent(relPath) {
  const fullPath = path.join(ROOT, relPath);
  const content = fs.readFileSync(fullPath, "utf8").replace(/\r\n/g, "\n");
  const lines = content.split("\n");
  while (lines.length > 0 && lines[lines.length - 1] === "") {
    lines.pop();
  }
  return lines;
}

function formatCodeLine(lineNumber, lineText) {
  return `${String(lineNumber).padStart(4, " ")} ${lineText}`;
}

function buildEntries(system) {
  return system.files.map(([filePath, description], index) => ({
    fileIndex: index + 1,
    path: filePath,
    description,
    sourceLines: readFileContent(filePath),
  }));
}

function buildFullRenderableLines(entries) {
  const lines = [];
  for (const entry of entries) {
    lines.push({ text: `文件 ${entry.fileIndex}：${entry.path}`, kind: "meta" });
    lines.push({ text: `功能说明：${entry.description}`, kind: "meta" });
    entry.sourceLines.forEach((sourceLine, idx) => {
      lines.push({ text: formatCodeLine(idx + 1, sourceLine), kind: "code" });
    });
  }
  return lines;
}

function compressSubmissionSourceLines(sourceLines) {
  const result = [];
  let blankPending = false;

  for (let i = 0; i < sourceLines.length; i += 1) {
    const line = sourceLines[i];
    if (line.trim() === "") {
      blankPending = true;
      continue;
    }
    if (blankPending) {
      blankPending = false;
    }
    result.push({ originalLineNumber: i + 1, text: line });
  }

  return result;
}

function buildSubmissionCodeLines(entries) {
  const lines = [];
  for (const entry of entries) {
    const compressed = compressSubmissionSourceLines(entry.sourceLines);
    compressed.forEach((line) => {
      lines.push({
        text: formatCodeLine(line.originalLineNumber, line.text),
        kind: "code",
        rawText: line.text,
        filePath: entry.path,
        sourceLine: line.originalLineNumber,
      });
    });
  }
  return lines;
}

function paginateSubmissionEntries(entries) {
  const pages = [];
  let currentPage = [];
  let currentCodeCount = 0;

  const pushPage = () => {
    if (currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [];
      currentCodeCount = 0;
    }
  };

  for (const entry of entries) {
    const compressed = compressSubmissionSourceLines(entry.sourceLines);
    if (compressed.length === 0) {
      continue;
    }

    if (currentCodeCount >= CODE_LINES_PER_PAGE) {
      pushPage();
    }

    currentPage.push({
      text: `文件 ${entry.fileIndex}：${entry.path}`,
      kind: "meta",
      filePath: entry.path,
    });

    compressed.forEach((line) => {
      if (currentCodeCount >= CODE_LINES_PER_PAGE) {
        pushPage();
      }
      currentPage.push({
        text: formatCodeLine(line.originalLineNumber, line.text),
        kind: "code",
        rawText: line.text,
        filePath: entry.path,
        sourceLine: line.originalLineNumber,
      });
      currentCodeCount += 1;
    });
  }

  pushPage();
  return pages;
}

function paginateMixedLines(lines) {
  const pages = [];
  let currentPage = [];

  for (const line of lines) {
    const remaining = CODE_LINES_PER_PAGE - currentPage.length;
    if (line.kind === "meta" && remaining < 3) {
      pages.push(currentPage);
      currentPage = [];
    } else if (remaining === 0) {
      pages.push(currentPage);
      currentPage = [];
    }
    currentPage.push(line);
    if (currentPage.length === CODE_LINES_PER_PAGE) {
      pages.push(currentPage);
      currentPage = [];
    }
  }

  if (currentPage.length > 0) {
    pages.push(currentPage);
  }

  return pages;
}

function paginateCodeOnlyLines(codeLines) {
  const pages = [];
  for (let i = 0; i < codeLines.length; i += CODE_LINES_PER_PAGE) {
    pages.push(codeLines.slice(i, i + CODE_LINES_PER_PAGE));
  }
  return pages;
}

function detectLongLines(entries) {
  const report = [];

  for (const entry of entries) {
    entry.sourceLines.forEach((line, idx) => {
      const expanded = line.replace(/\t/g, "    ");
      if (expanded.length > LONG_LINE_THRESHOLD) {
        report.push({
          filePath: entry.path,
          lineNumber: idx + 1,
          length: expanded.length,
          preview: expanded.slice(0, 80),
        });
      }
    });
  }

  return report;
}

function isSafeEllipsisUsage(rawText) {
  return /\.\.\.\s*[$A-Za-z_\u4e00-\u9fa5({[]/.test(rawText);
}

function detectDangerousText(pages) {
  const realSyntaxSafeItems = [];
  const suspectedCopyrightRiskItems = [];

  pages.forEach((page, pageIndex) => {
    page.forEach((line) => {
      const rawText = line.rawText || line.text;
      const normalized = rawText.toLowerCase();

      DANGEROUS_TEXT_PATTERNS.forEach((pattern) => {
        const matched = pattern === "..." ? rawText.includes(pattern) : normalized.includes(pattern.toLowerCase());
        if (!matched) {
          return;
        }

        const item = {
          page: pageIndex + 1,
          pattern,
          filePath: line.filePath || null,
          sourceLine: line.sourceLine || null,
          preview: rawText.slice(0, 80),
        };

        if (pattern === "..." && isSafeEllipsisUsage(rawText)) {
          realSyntaxSafeItems.push({
            ...item,
            reason: "检测到扩展/剩余参数等真实语法中的 ... 用法",
          });
          return;
        }

        suspectedCopyrightRiskItems.push({
          ...item,
          reason:
            pattern === "..."
              ? "检测到 ...，但不像典型展开语法，建议人工复核"
              : "检测到可能被软著审查误判的文本",
        });
      });
    });
  });

  return {
    realSyntaxSafeItems,
    suspectedCopyrightRiskItems,
  };
}

function buildSubmissionPaginationValidation(pages) {
  const pageLineCounts = pages.map((page, index) => ({
    page: index + 1,
    effectiveCodeLines: page.filter((line) => line.kind === "code").length,
  }));

  const nonLastShortPages = pageLineCounts.filter(
    (item, index) => index < pageLineCounts.length - 1 && item.effectiveCodeLines < CODE_LINES_PER_PAGE,
  );

  return {
    pageLineCounts,
    hasNonLastShortPage: nonLastShortPages.length > 0,
    nonLastShortPages,
  };
}

function buildSectionPageProperties(startPageNumber) {
  const props = {
    page: {
      size: { width: PAGE_WIDTH, height: PAGE_HEIGHT },
      margin: {
        top: MARGIN_TOP,
        right: MARGIN_RIGHT,
        bottom: MARGIN_BOTTOM,
        left: MARGIN_LEFT,
        header: HEADER_Y,
        footer: FOOTER_Y,
      },
    },
  };
  if (typeof startPageNumber === "number") {
    props.page.pageNumbers = { start: startPageNumber };
  }
  return props;
}

function buildHeader(softwareName) {
  return new Header({
    children: [
      new Paragraph({
        spacing: { before: 0, after: 0 },
        tabStops: [{ type: TabStopType.RIGHT, position: HEADER_RIGHT_TAB }],
        children: [
          new TextRun({ text: softwareName, font: "宋体", size: NORMAL_TEXT_SIZE, color: "000000" }),
          new TextRun({ text: "\t", font: "宋体", size: NORMAL_TEXT_SIZE }),
          new TextRun({ children: [PageNumber.CURRENT], font: "宋体", size: NORMAL_TEXT_SIZE, color: "000000" }),
        ],
      }),
    ],
  });
}

function makeCodeParagraph(text, kind) {
  return new Paragraph({
    spacing:
      kind === "meta"
        ? { before: 80, after: 40, line: SECTION_TITLE_LINE_SPACING, lineRule: "exact" }
        : { before: 0, after: 0, line: CODE_LINE_SPACING, lineRule: "exact" },
    children: [
      new TextRun({
        text,
        font: kind === "code" ? CODE_FONT : "宋体",
        fallback: kind === "code" ? CODE_FONT_FALLBACK : "宋体",
        size: kind === "meta" ? SECTION_TITLE_SIZE : CODE_FONT_SIZE_HALF_PT,
        bold: kind === "meta",
        color: kind === "meta" ? SECTION_TITLE_COLOR : "000000",
      }),
    ],
  });
}

function buildCodeChildren(pages) {
  const children = [];
  pages.forEach((pageLines, pageIndex) => {
    pageLines.forEach((line) => {
      children.push(makeCodeParagraph(line.text, line.kind));
    });
    if (pageIndex < pages.length - 1) {
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  });
  return children;
}

function buildCoverSection(softwareName) {
  return {
    properties: buildSectionPageProperties(),
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 2800, after: 300 },
        children: [new TextRun({ text: softwareName, bold: true, font: "宋体", size: COVER_TITLE_SIZE, color: "000000" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 200, after: 1200 },
        children: [new TextRun({ text: "源代码清单", bold: true, font: "宋体", size: COVER_SUBTITLE_SIZE, color: "000000" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: `著作权人：${COPYRIGHT_OWNER}`, font: "宋体", size: NORMAL_TEXT_SIZE, color: "000000" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: "软件版本：V1.0", font: "宋体", size: NORMAL_TEXT_SIZE, color: "000000" })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 120, after: 120 },
        children: [new TextRun({ text: `文档日期：${DOC_DATE}`, font: "宋体", size: NORMAL_TEXT_SIZE, color: "000000" })],
      }),
    ],
  };
}

function buildDirectorySection(entries) {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 200 },
      children: [new TextRun({ text: "源代码文件目录", bold: true, font: "宋体", size: DIRECTORY_TITLE_SIZE, color: DIRECTORY_TITLE_COLOR })],
    }),
  ];

  entries.forEach((entry) => {
    children.push(
      new Paragraph({
        spacing: { before: 20, after: 20, line: DIRECTORY_LINE_SPACING, lineRule: "exact" },
        children: [
          new TextRun({
            text: `${String(entry.fileIndex).padStart(2, "0")}  ${entry.path}`,
            font: CODE_FONT,
            fallback: CODE_FONT_FALLBACK,
            size: DIRECTORY_FONT_SIZE_HALF_PT,
            color: DIRECTORY_TEXT_COLOR,
          }),
        ],
      }),
    );
  });

  return { properties: buildSectionPageProperties(), children };
}

function buildCodeSection(softwareName, pages) {
  return {
    properties: buildSectionPageProperties(1),
    headers: { default: buildHeader(softwareName) },
    children: buildCodeChildren(pages),
  };
}

async function writeDocx(softwareName, baseName, suffix, entries, pages) {
  const doc = new Document({
    sections: [buildCoverSection(softwareName), buildDirectorySection(entries), buildCodeSection(softwareName, pages)],
  });
  const buffer = await Packer.toBuffer(doc);
  const outputPath = path.join(OUTPUT_DIR, `${baseName}_${suffix}.docx`);
  try {
    fs.writeFileSync(outputPath, buffer);
    return outputPath;
  } catch (error) {
    if (error && error.code === "EBUSY") {
      for (let i = 1; i <= 20; i += 1) {
        const fallbackPath = path.join(OUTPUT_DIR, `${baseName}_${suffix}_更新版${i}.docx`);
        try {
          fs.writeFileSync(fallbackPath, buffer);
          return fallbackPath;
        } catch (fallbackError) {
          if (!(fallbackError && fallbackError.code === "EBUSY")) {
            throw fallbackError;
          }
        }
      }
    }
    throw error;
  }
}

function writeValidationReport(baseName, report) {
  const reportPath = path.join(OUTPUT_DIR, `${baseName}_validationReport.json`);
  try {
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    return reportPath;
  } catch (error) {
    if (error && error.code === "EBUSY") {
      for (let i = 1; i <= 20; i += 1) {
        const fallbackPath = path.join(OUTPUT_DIR, `${baseName}_validationReport_更新版${i}.json`);
        try {
          fs.writeFileSync(fallbackPath, JSON.stringify(report, null, 2));
          return fallbackPath;
        } catch (fallbackError) {
          if (!(fallbackError && fallbackError.code === "EBUSY")) {
            throw fallbackError;
          }
        }
      }
    }
    throw error;
  }
}

async function main() {
  const reports = [];

  for (const system of SYSTEMS) {
    const entries = buildEntries(system);
    const fullPages = paginateMixedLines(buildFullRenderableLines(entries));
    const submissionCodeLines = buildSubmissionCodeLines(entries);
    const submissionCodePages = paginateCodeOnlyLines(submissionCodeLines);
    const submissionPageBlocks = paginateSubmissionEntries(entries);
    const submissionPages =
      submissionPageBlocks.length > 60
        ? [...submissionPageBlocks.slice(0, 30), ...submissionPageBlocks.slice(-30)]
        : submissionPageBlocks;
    const longLines = detectLongLines(entries);
    const paginationValidation = buildSubmissionPaginationValidation(submissionPages);
    const dangerousTextClassification = detectDangerousText(submissionPages);

    const fullOutput = await writeDocx(system.softwareName, system.baseName, "完整重排版", entries, fullPages);
    const submissionOutput = await writeDocx(system.softwareName, system.baseName, "软著提交60页版", entries, submissionPages);
    const validationReportPath = writeValidationReport(system.baseName, {
      softwareName: system.softwareName,
      totalFiles: entries.length,
      totalSourceLines: entries.reduce((sum, entry) => sum + entry.sourceLines.length, 0),
      fullCodePages: fullPages.length,
      submissionCodePages: submissionCodePages.length,
      submissionOutputPages: submissionPages.length,
      longLineRisks: longLines,
      submissionPaginationValidation: paginationValidation,
      dangerousTextClassification,
    });

    reports.push({
      softwareName: system.softwareName,
      totalFiles: entries.length,
      totalSourceLines: entries.reduce((sum, entry) => sum + entry.sourceLines.length, 0),
      fullCodePages: fullPages.length,
      submissionPureCodePages: submissionCodePages.length,
      submissionOutputPages: submissionPages.length,
      longLineCount: longLines.length,
      dangerousTextSafeCount: dangerousTextClassification.realSyntaxSafeItems.length,
      dangerousTextRiskCount: dangerousTextClassification.suspectedCopyrightRiskItems.length,
      outputs: [fullOutput, submissionOutput, validationReportPath],
    });
  }

  console.log(JSON.stringify(reports, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
