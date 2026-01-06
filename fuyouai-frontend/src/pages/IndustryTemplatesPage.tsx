import React, { useState } from "react";
import { Link } from "react-router-dom";
import TopTabs, { TabItem } from "../components/TopTabs";
import { BookOpen, ArrowRight, Briefcase } from "lucide-react";
import {
  INDUSTRY_TEMPLATES_DB,
  IndustryTemplate,
} from "../data/industryTemplates";

const tabs: TabItem[] = [
  { id: "finance", label: "金融" },
  { id: "product", label: "产品" },
  { id: "real-estate", label: "房地产" },
  { id: "operation", label: "运营" },
  { id: "academic", label: "学术" },
  { id: "developer", label: "程序员" },
  { id: "business", label: "商务" },
  { id: "creator", label: "创作者" },
];

const IndustryTemplatesPage: React.FC = () => {
  const [activeId, setActiveId] = useState<string>(tabs[0].id);

  // 根据当前选中的行业 tab 过滤模板
  const templates = INDUSTRY_TEMPLATES_DB.filter(
    (t) => t.industryId === activeId
  );

  /** 行业模板统一拦截：提示建设中 */
  const handleIndustryClick = (tpl: IndustryTemplate) => {
    window.alert("该行业模板正在建设中，敬请期待 🙏");
    return; // 🚫 直接结束，不进入任何运行逻辑
  };

  return (
    <div className="flex flex-col w-full h-full pb-20">
      {/* 面包屑 */}
      <div className="flex items-center gap-2 text-sm text-[#9CA3AF] mb-6 pt-2">
        <Link
          to="/modules"
          className="hover:text-[#F9FAFB] transition-colors"
        >
          模块中心
        </Link>
        <span className="text-[#4B5563]">/</span>
        <span className="text-[#F9FAFB]">行业模板</span>
      </div>

      {/* 顶部 Hero */}
      <div className="relative pt-0 pb-10 text-center z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/20 text-[#3B82F6] text-xs font-medium mb-6">
          <Briefcase size={12} />
          <span>Industry Solutions</span>
        </div>

        <h1 className="text-[32px] font-semibold text-[#F9FAFB] tracking-tight mb-2 drop-shadow-sm">
          行业专业模板
        </h1>
        <p className="text-[#9CA3AF] text-base max-w-2xl mx-auto mb-8">
          针对不同职业与场景的高精度模板，让 AI 更像“懂你行业的同事”。
        </p>

        {/* 行业 Tabs */}
        <div className="flex justify-center px-6">
          <TopTabs tabs={tabs} activeId={activeId} onChange={setActiveId} />
        </div>
      </div>

      {/* 模板网格 */}
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {templates.length > 0 ? (
          templates.map((tpl) => (
            <div
              key={tpl.id}
              className="group relative flex flex-col justify-between rounded-2xl border border-[#1F2937] bg-[#111827] p-6 hover:bg-[#1A1D24] hover:border-[#3B82F6]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(59,130,246,0.15)] hover:-translate-y-1"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 bg-[#1F2937] rounded-xl text-[#9CA3AF] group-hover:text-[#3B82F6] group-hover:bg-[#3B82F6]/10 transition-colors border border-[#374151] group-hover:border-[#3B82F6]/20">
                    <BookOpen size={20} />
                  </div>
                  <span
                    className={`text-[10px] px-2.5 py-1 rounded-full border font-medium ${
                      tpl.level === "Pro"
                        ? "border-amber-500/30 text-amber-400 bg-amber-500/10"
                        : "border-[#374151] text-[#6B7280] bg-[#1F2937]"
                    }`}
                  >
                    {tpl.level}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-[#F9FAFB] mb-2 group-hover:text-[#3B82F6] transition-colors">
                  {tpl.title}
                </h2>
                <p className="text-sm text-[#9CA3AF] leading-relaxed group-hover:text-[#D1D5DB]">
                  {tpl.desc}
                </p>
              </div>

              {/* 👇 这里是关键改动：不再进入运行，只提示建设中 */}
              <button
                onClick={() => handleIndustryClick(tpl)}
                className="mt-8 pt-4 border-t border-[#1F2937] flex items-center justify-between w-full text-left"
              >
                <span className="text-xs font-bold text-[#6B7280] group-hover:text-white transition-colors uppercase tracking-wider">
                  Use Template
                </span>
                <ArrowRight
                  size={14}
                  className="group-hover:translate-x-1 transition-transform text-[#3B82F6]"
                />
              </button>
            </div>
          ))
        ) : (
          <div className="col-span-3 py-20 text-center text-[#6B7280]">
            暂无该分类模板
          </div>
        )}
      </div>
    </div>
  );
};

export default IndustryTemplatesPage;
