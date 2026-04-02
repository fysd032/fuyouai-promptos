"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchRegistry } from "@/src/lib/registry";
import { ModuleRunner } from "@/src/components/ModuleRunner";
import { ArrowRight, ArrowLeft } from "lucide-react";
import { useLocale } from "next-intl";

/** Category definitions (analysis / creation / ...) */
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

const CATEGORY_TABS_EN: Array<{ key: ModuleCategory; label: string }> = [
  { key: "all", label: "All" },
  { key: "analysis", label: "Analysis" },
  { key: "creation", label: "Creation" },
  { key: "business", label: "Business" },
  { key: "academic", label: "Academic" },
  { key: "tech", label: "Tech" },
  { key: "role", label: "Role Play" },
  { key: "tool", label: "Tools" },
  { key: "other", label: "Other" },
];

const CATEGORY_TABS_ZH: Array<{ key: ModuleCategory; label: string }> = [
  { key: "all", label: "全部" },
  { key: "analysis", label: "帮我分析" },
  { key: "creation", label: "帮我写" },
  { key: "business", label: "帮我做计划" },
  { key: "academic", label: "帮我做研究" },
  { key: "tech", label: "技术相关" },
  { key: "role", label: "模拟对话" },
  { key: "tool", label: "小工具" },
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

  /** Recommended: backend registry returns category directly */
  category?: ModuleCategory;

  /** Compat: fallback to group if backend doesn't provide category */
  group?: string;

  variants?: RegistryVariant[];
};

const FRONT_ID_TO_CATEGORY: Record<string, ModuleCategory> = {
  // Creation
  writing_master: "creation",
  summarizer: "creation",
  copywriter: "creation",
  storyteller: "creation",
  rewriter: "creation",
  writing_editor_inspector: "creation",
  writing_polish: "creation",

  // Analysis
  deep_analysis: "analysis",
  researcher: "analysis",
  market_insights: "analysis",
  data_interpreter: "analysis",
  interview_gen: "analysis",
  decision_maker: "analysis",

  // Academic
  paper_reader: "academic",
  academic_study: "academic",
  course_design: "academic",
  explainer: "academic",

  // Business
  ppt_architect: "business",
  email_pro: "business",
  pitch_deck: "business",
  product_spec: "business",
  pm_okr: "business",
  biz_model: "business",

  // Role
  role_playing: "role",

  // Tech
  sop_engine: "tech",
  tech_stack: "tech",
  debugger: "tech",
  meta_prompt: "tool", // this is more of a tool
  multi_agent: "tech",
  no_code: "tech",

  // Tool
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
  // 1) Use backend category if available
  if (m.category && m.category !== "all") return m.category;

  // 2) Frontend mapping fallback
  const mapped = FRONT_ID_TO_CATEGORY[m.frontModuleId];
  if (mapped) return mapped;

  // 3) Compat: use old group field
  if (m.group) return normalizeCategory(m.group);

  return "other";
}

const SYSTEM_TOOL_IDS = new Set(["meta_prompt", "risk_control", "knowledge_base"]);

type LayerKey = "work" | "system";

const LAYER_TABS_EN: Array<{ key: LayerKey; label: string }> = [
  { key: "work", label: "General Modules" },
  { key: "system", label: "System Tools" },
];

const LAYER_TABS_ZH: Array<{ key: LayerKey; label: string }> = [
  { key: "work", label: "通用模板" },
  { key: "system", label: "系统工具" },
];

export default function UniversalModulesPage() {
  const locale = useLocale();
  const isZh = locale === "zh";
  const CATEGORY_TABS = isZh ? CATEGORY_TABS_ZH : CATEGORY_TABS_EN;
  const LAYER_TABS = isZh ? LAYER_TABS_ZH : LAYER_TABS_EN;
  const [modules, setModules] = useState<RegistryModule[]>([]);
  const [selectedModuleId, setSelectedModuleId] = useState<string>("");
  const [selectedVariant, setSelectedVariant] = useState<RegistryVariant | null>(null);
  const [viewMode, setViewMode] = useState<"detail" | "run">("detail");

  // Layer switcher
  const [activeLayer, setActiveLayer] = useState<LayerKey>("work");

  // Category filter + search
  const [activeCategory, setActiveCategory] = useState<ModuleCategory>("all");
  const [keyword, setKeyword] = useState<string>("");

  // Mobile: show detail panel when a module is selected
  const [mobileShowDetail, setMobileShowDetail] = useState(false);

  /** 1. Fetch registry */
  useEffect(() => {
    fetchRegistry().then((r: { data?: RegistryModule[] }) => {
      const list = r.data ?? [];
      setModules(list);
      if (list.length) setSelectedModuleId(list[0].frontModuleId);
    });
  }, []);

  /** 2. Filtered modules (layer + category + search) */
  const filteredModules = useMemo(() => {
    const kw = keyword.trim().toLowerCase();

    return modules.filter((m) => {
      // Layer filter
      const isSystemTool = SYSTEM_TOOL_IDS.has(m.frontModuleId);
      if (activeLayer === "system" && !isSystemTool) return false;
      if (activeLayer === "work" && isSystemTool) return false;

      const cat = getModuleCategory(m);
      const matchCategory = activeCategory === "all" || activeLayer === "system" ? true : cat === activeCategory;

      const label = (m.frontModuleLabel ?? "").toLowerCase();
      const id = (m.frontModuleId ?? "").toLowerCase();
      const matchKeyword = !kw ? true : label.includes(kw) || id.includes(kw);

      return matchCategory && matchKeyword;
    });
  }, [modules, activeLayer, activeCategory, keyword]);

  /** 3. Current module */
  const activeModule = useMemo(
    () => modules.find((m) => m.frontModuleId === selectedModuleId),
    [modules, selectedModuleId]
  );

  /** 4. Resolved promptKey (only from variant) */
  const resolvedPromptKey = useMemo(() => {
    return selectedVariant?.backendModules?.[0]?.promptKey || "";
  }, [selectedVariant]);

  // Auto-select first module when layer/category filter changes and current selection is not in filtered list
  useEffect(() => {
    if (!filteredModules.length) return;

    const stillExists = filteredModules.some((m) => m.frontModuleId === selectedModuleId);
    if (!stillExists) {
      setSelectedModuleId(filteredModules[0].frontModuleId);
      setSelectedVariant(null);
      setViewMode("detail");
      setMobileShowDetail(false);
    }
  }, [filteredModules, selectedModuleId]);

  /** Left panel: module list */
  const listPanel = (
    <div className="w-full lg:w-[340px] flex-shrink-0 min-h-0 border border-[#1F2937] rounded-xl bg-[#111827] p-3 flex flex-col">
      {/* Layer Tabs */}
      <div className="flex gap-1.5 mb-3">
        {LAYER_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => {
              setActiveLayer(t.key);
              setActiveCategory("all");
              setSelectedVariant(null);
              setViewMode("detail");
            }}
            className={`flex-1 py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-colors ${
              activeLayer === t.key
                ? "bg-blue-500/20 border-blue-500 text-white"
                : "bg-[#0A0F1C] border-[#374151] text-gray-400 hover:bg-[#1F2937]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Category Tabs (work layer only) */}
      {activeLayer === "work" && (
        <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
          {CATEGORY_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => {
                setActiveCategory(t.key);
                setSelectedVariant(null);
                setViewMode("detail");
              }}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs sm:text-sm border transition-colors ${
                activeCategory === t.key
                  ? "bg-blue-500/20 border-blue-500 text-white"
                  : "bg-[#0A0F1C] border-[#374151] text-gray-300 hover:bg-[#1F2937]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* Search box */}
      <div className="mb-3">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder={isZh ? "搜索模板名称..." : "Search module name or ID..."}
          className="w-full px-3 py-2 rounded-lg text-sm sm:text-base bg-[#0A0F1C] border border-[#374151] text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Module list (filtered by category) */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
        {filteredModules.map((m) => (
          <button
            key={m.frontModuleId}
            onClick={() => {
              setSelectedModuleId(m.frontModuleId);
              setSelectedVariant(null);
              setViewMode("detail");
              setMobileShowDetail(true);
            }}
            className={`w-full text-left p-3 rounded-lg mb-1 border transition-colors ${
              m.frontModuleId === selectedModuleId
                ? "bg-blue-500/10 border-blue-500/30"
                : "border-transparent hover:bg-[#1F2937]"
            }`}
          >
            <div className="text-white font-medium text-sm sm:text-base">{m.frontModuleLabel ?? m.frontModuleId}</div>
            <div className="text-xs sm:text-sm text-gray-400 flex items-center justify-between mt-1">
              <span>{isZh ? "变体" : "Variants"}: {m.variants?.length || 0}</span>
              <span className="text-xs text-emerald-400 font-mono">
                {getModuleCategory(m)}
              </span>
            </div>
          </button>
        ))}

        {!filteredModules.length && (
          <div className="text-sm sm:text-base text-gray-400 p-3">
            {isZh ? "没有找到匹配的模板，试试其他分类或清除搜索" : "No matching modules found (try another category or clear search)"}
          </div>
        )}
      </div>
    </div>
  );

  /** Right panel: detail / run */
  const detailPanel = (
    <div className="flex-1 min-h-0">
      {viewMode === "run" ? (
        <ModuleRunner
          moduleType="general"
          moduleKey={resolvedPromptKey}
          frontModuleId={activeModule?.frontModuleId}
          variantId={selectedVariant?.variantId}
          moduleData={{
            title: activeModule?.frontModuleLabel || "",
            desc: selectedVariant?.label || "",
            promptPreview: "",
            variant: selectedVariant!,
            promptKey: resolvedPromptKey,
            variantId: selectedVariant?.variantId,
          }}
          onBack={() => setViewMode("detail")}
        />
      ) : (
        <div className="h-full border border-[#1F2937] rounded-xl bg-[#111827] p-4 sm:p-6">
          {/* Mobile back button */}
          <button
            onClick={() => setMobileShowDetail(false)}
            className="lg:hidden flex items-center gap-1.5 text-sm text-gray-400 hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft size={16} />
            {isZh ? "返回列表" : "Back to modules"}
          </button>

          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">
            {activeModule?.frontModuleLabel ?? (isZh ? "请选择一个模板" : "No module selected")}
          </h2>

          <div className="text-sm sm:text-base text-gray-400 mb-4">{isZh ? "选择一个使用场景" : "Please select a variant"}</div>

          <div className="flex flex-wrap gap-2 mb-6">
            {activeModule?.variants?.map((v) => (
              <button
                key={v.variantId}
                onClick={() => setSelectedVariant(v)}
                className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base border ${
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
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm sm:text-base font-medium ${
              selectedVariant
                ? "bg-blue-500 hover:bg-blue-600 text-white"
                : "bg-gray-700 text-gray-400 cursor-not-allowed"
            }`}
          >
            {isZh ? "开始使用" : "Use Template"} <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col gap-4 sm:gap-6 h-full min-w-0">
      {/* Mobile hint */}
      <div className="lg:hidden text-center py-1.5 px-3 bg-[#1F2937]/60 border border-[#374151]/50 rounded-lg">
        <span className="text-xs text-gray-400">{isZh ? "建议在电脑或平板上使用，体验更好" : "For the best experience, visit on PC / tablet"}</span>
      </div>

      <div className="flex gap-4 sm:gap-6 flex-1 min-h-0">
        {/* Desktop: show both panels side by side */}
        <div className="hidden lg:contents">
          {listPanel}
          {detailPanel}
        </div>

        {/* Mobile: show one panel at a time */}
        <div className="lg:hidden w-full min-h-0 flex flex-col">
          {mobileShowDetail ? detailPanel : listPanel}
        </div>
      </div>
    </div>
  );
}
