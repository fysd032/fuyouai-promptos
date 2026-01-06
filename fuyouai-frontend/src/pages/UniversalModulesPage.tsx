import { useEffect, useMemo, useState } from "react";
import { fetchRegistry } from "../lib/registry";
import { ModuleRunner } from "../components/ModuleRunner";
import { ArrowRight } from "lucide-react";

/** ===== 分类定义（你要的“分析认知/内容创作/...”）===== */
type ModuleCategory =
  | "all"
  | "analysis"
  | "creation"
  | "business"
  | "academic"
  | "tech"
  | "role"
  | "tool"
  | "other";

const CATEGORY_TABS: Array<{ key: ModuleCategory; label: string }> = [
  { key: "all", label: "全部" },
  { key: "analysis", label: "分析认知" },
  { key: "creation", label: "内容创作" },
  { key: "business", label: "商业与职场" },
  { key: "academic", label: "学术研究" },
  { key: "tech", label: "技术开发" },
  { key: "role", label: "角色模拟" },
  { key: "tool", label: "系统工具" },
  { key: "other", label: "其他" },
];

type RegistryVariant = {
  variantId: string;
  label?: string;
  description?: string;
  backendModules?: Array<{
    moduleId?: string;
    promptKey?: string;
    weight?: number;
  }>;
};

type RegistryModule = {
  frontModuleId: string;
  frontModuleLabel?: string;

  /**
   * ✅ 推荐：后端 registry 直接返回 category
   * 例如：analysis / creation / business ...
   */
  category?: ModuleCategory;

  /**
   * ✅ 兼容：你原先就有 group
   * 如果后端没给 category，就用 group 来兜底分类（比如 group=analysis）
   */
  group?: string;

  variants?: RegistryVariant[];
};
const FRONT_ID_TO_CATEGORY: Record<string, ModuleCategory> = {
  // 内容创作 creation
  writing_master: "creation",
  summarizer: "creation",
  copywriter: "creation",
  storyteller: "creation",
  rewriter: "creation",
  writing_editor_inspector: "creation",
  writing_polish: "creation",

  // 分析认知 analysis
  deep_analysis: "analysis",
  researcher: "analysis",
  market_insights: "analysis",
  data_interpreter: "analysis",
  interview_gen: "analysis",
  decision_maker: "analysis",

  // 学术 academic
  paper_reader: "academic",
  academic_study: "academic",
  course_design: "academic",
  explainer: "academic",

  // 商业 business
  ppt_architect: "business",
  email_pro: "business",
  pitch_deck: "business",
  product_spec: "business",
  pm_okr: "business",
  biz_model: "business",

  // 角色 role
  role_playing: "role",

  // 技术 tech
  sop_engine: "tech",
  tech_stack: "tech",
  debugger: "tech",
  meta_prompt: "tool", // 这个更像工具
  multi_agent: "tech",
  no_code: "tech",

  // 工具 tool
  risk_control: "tool",
  knowledge_base: "tool",
};

function normalizeCategory(input?: string): ModuleCategory {
  const v = (input ?? "").trim().toLowerCase();
  if (
    v === "analysis" ||
    v === "creation" ||
    v === "business" ||
    v === "academic" ||
    v === "tech" ||
    v === "role" ||
    v === "tool" ||
    v === "other"
  ) {
    return v;
  }
  return "other";
}

function getModuleCategory(m: RegistryModule): ModuleCategory {
  // 1) 后端有 category 就直接用
  if (m.category && m.category !== "all") return m.category;

  // 2) 前端映射兜底
  const mapped = FRONT_ID_TO_CATEGORY[m.frontModuleId];
  if (mapped) return mapped;

  // 3) 兼容旧 group
  if (m.group) return normalizeCategory(m.group);

  return "other";
}

export default function UniversalModulesPage() {
  const [modules, setModules] = useState<RegistryModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<RegistryVariant | null>(null);
  const [viewMode, setViewMode] = useState<"detail" | "run">("detail");

  // ✅ 新增：分类 + 搜索
  const [activeCategory, setActiveCategory] = useState<ModuleCategory>("all");
  const [keyword, setKeyword] = useState<string>("");

  /** 1️⃣ 拉 registry */
  useEffect(() => {
    fetchRegistry().then((r: { data?: RegistryModule[] }) => {
      const list = r.data ?? [];
      setModules(list);
      if (list.length) setSelectedModuleId(list[0].frontModuleId);
    });
  }, []);

  /** 2️⃣ 过滤后的模块（分类 + 搜索） */
  const filteredModules = useMemo(() => {
    const kw = keyword.trim().toLowerCase();

    return modules.filter((m) => {
      const cat = getModuleCategory(m);
      const matchCategory = activeCategory === "all" ? true : cat === activeCategory;

      const label = (m.frontModuleLabel ?? "").toLowerCase();
      const id = (m.frontModuleId ?? "").toLowerCase();
      const matchKeyword = !kw ? true : label.includes(kw) || id.includes(kw);

      return matchCategory && matchKeyword;
    });
  }, [modules, activeCategory, keyword]);

  /** 3️⃣ 当前模块 */
  const activeModule = useMemo(
    () => modules.find((m) => m.frontModuleId === selectedModuleId),
    [modules, selectedModuleId]
  );

  /** 4️⃣ 当前真正可执行的 promptKey（只来自 variant） */
  const resolvedPromptKey = useMemo(() => {
    return selectedVariant?.backendModules?.[0]?.promptKey || "";
  }, [selectedVariant]);

  // ✅ 当切换分类导致当前选中模块不在过滤列表里时，自动选中第一个
  useEffect(() => {
    if (!filteredModules.length) return;

    const stillExists = filteredModules.some((m) => m.frontModuleId === selectedModuleId);
    if (!stillExists) {
      setSelectedModuleId(filteredModules[0].frontModuleId);
      setSelectedVariant(null);
      setViewMode("detail");
    }
  }, [filteredModules, selectedModuleId]);

  return (
    <div className="flex gap-6 h-full">
      {/* 左侧：模块列表 */}
      <div className="w-[340px] min-h-0 border border-[#1F2937] rounded-xl bg-[#111827] p-3 flex flex-col">
        {/* 顶部分类 Tab（你要的导航栏） */}
        <div className="flex flex-wrap gap-2 mb-3">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActiveCategory(t.key);
                setSelectedVariant(null);
                setViewMode("detail");
              }}
              className={`px-3 py-1.5 rounded-lg text-xs border transition-colors ${
                activeCategory === t.key
                  ? "bg-blue-500/20 border-blue-500 text-white"
                  : "bg-[#0A0F1C] border-[#374151] text-gray-300 hover:bg-[#1F2937]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* 搜索框 */}
        <div className="mb-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索模块名称或 ID..."
            className="w-full px-3 py-2 rounded-lg text-sm bg-[#0A0F1C] border border-[#374151] text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* 模块列表（按分类过滤后） */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
          {filteredModules.map((m) => (
            <button
              key={m.frontModuleId}
              onClick={() => {
                setSelectedModuleId(m.frontModuleId);
                setSelectedVariant(null);
                setViewMode("detail");
              }}
              className={`w-full text-left p-3 rounded-lg mb-1 border transition-colors ${
                m.frontModuleId === selectedModuleId
                  ? "bg-blue-500/10 border-blue-500/30"
                  : "border-transparent hover:bg-[#1F2937]"
              }`}
            >
              <div className="text-white font-medium">{m.frontModuleLabel ?? m.frontModuleId}</div>
              <div className="text-xs text-gray-400 flex items-center justify-between mt-1">
                <span>子功能：{m.variants?.length || 0}</span>
                <span className="text-[10px] text-emerald-400 font-mono">
                  {getModuleCategory(m)}
                </span>
              </div>
            </button>
          ))}

          {!filteredModules.length && (
            <div className="text-sm text-gray-400 p-3">
              没有找到匹配的模块（换个分类或清空搜索试试）
            </div>
          )}
        </div>
      </div>

      {/* 右侧：详情 / 运行 */}
      <div className="flex-1 min-h-0">
        {viewMode === "run" ? (
          <ModuleRunner
            moduleType="general"
            moduleKey={resolvedPromptKey}
            moduleData={{
              title: activeModule?.frontModuleLabel || "",
              desc: selectedVariant?.label || "",
              promptPreview: "",
              variant: selectedVariant!,
              // ✅ 额外给 runner 用（如果你 runner 里有 promptKey/variantId 的展示）
              promptKey: resolvedPromptKey,
              variantId: selectedVariant?.variantId,
            }}
            onBack={() => setViewMode("detail")}
          />
        ) : (
          <div className="h-full border border-[#1F2937] rounded-xl bg-[#111827] p-6">
            <h2 className="text-xl font-bold text-white mb-2">
              {activeModule?.frontModuleLabel ?? "未选择模块"}
            </h2>

            <div className="text-sm text-gray-400 mb-4">请选择一个子功能（variant）</div>

            <div className="flex flex-wrap gap-2 mb-6">
              {activeModule?.variants?.map((v) => (
                <button
                  key={v.variantId}
                  onClick={() => setSelectedVariant(v)}
                  className={`px-3 py-1.5 rounded-lg text-sm border ${
                    selectedVariant?.variantId === v.variantId
                      ? "bg-blue-500/20 border-blue-500 text-white"
                      : "bg-[#0A0F1C] border-[#374151] text-gray-300"
                  }`}
                  title={v.description}
                >
                  {v.label || v.variantId}
                </button>
              ))}
            </div>

            <button
              disabled={!selectedVariant}
              onClick={() => setViewMode("run")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium ${
                selectedVariant
                  ? "bg-blue-500 hover:bg-blue-600 text-white"
                  : "bg-gray-700 text-gray-400 cursor-not-allowed"
              }`}
            >
              使用模板 <ArrowRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
