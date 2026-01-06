import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, ArrowRight, Check, Terminal, Cpu, Layout, Database, Activity, Play, BrainCircuit, Split, Zap, ShieldCheck } from 'lucide-react';

export const Landing: React.FC = () => {
  const scrollToFeatures = () => {
    const element = document.getElementById('features');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#0B0F15_0%,#0F141C_40%,#111827_100%)] font-sans text-white selection:bg-brand-500/30 overflow-x-hidden">
      
      {/* Navbar (Minimalist Transparent) */}
      <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between border-b border-white/[0.02] relative z-50">
        <div className="flex items-center gap-2">
           <span className="font-semibold text-lg tracking-tight text-white/95">FuyouAI</span>
        </div>
        
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
          <button onClick={scrollToFeatures} className="hover:text-white transition-colors">功能</button>
          <a href="#" className="hover:text-white transition-colors">文档</a>
          <Link to="/app/modules" className="hover:text-white transition-colors">模块中心</Link>
          <Link to="/login" className="hover:text-white transition-colors">登录</Link>
          <Link to="/login" className="bg-brand-600 hover:bg-brand-500 text-white px-5 py-2 rounded-lg transition-all shadow-[0_2px_10px_rgba(59,130,246,0.3)] flex items-center gap-2 group font-semibold">
            开始使用 <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform"/>
          </Link>
        </div>
      </nav>

      {/* Hero Section (50/50 Split) */}
      <header className="max-w-[1440px] mx-auto px-6 lg:px-12 pt-16 lg:pt-24 pb-20 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-20 items-center">
          
          {/* Left Column: Brand & Copy */}
          <div className="flex flex-col justify-center max-w-xl relative z-20">
            {/* Logo Text */}
            <div className="mb-6">
              <span className="font-semibold text-white tracking-tight text-lg">FuyouAI</span>
            </div>

            {/* H1 English */}
            <h1 className="text-5xl lg:text-[56px] font-semibold leading-[1.1] tracking-tight mb-2 text-white">
              From Complex Demands<br />
              to Executable Workflows
            </h1>

            {/* H1 Chinese (Secondary) */}
            <div className="text-2xl lg:text-3xl font-medium text-white/90 mb-6 tracking-tight">
              从复杂需求，到可执行的工作流
            </div>

            {/* Subheading */}
            <p className="text-lg lg:text-[20px] leading-[1.6] text-slate-400 font-normal mb-8 max-w-[36rem]">
              FuyouAI 以专业级任务理解、结构化拆解与执行引擎，<br className="hidden md:block"/>
              将模糊需求转化为可稳定运行的自动化流程。
            </p>

            {/* Value Bullets */}
            <div className="space-y-3 mb-10">
              {[
                'General Task Processor (Task GTP)',
                '结构化任务拆解与执行',
                '可复用的任务模板体系'
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-slate-400">
                  <Check size={16} className="text-slate-500" />
                  <span className="text-base font-normal">{item}</span>
                </div>
              ))}
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-wrap gap-6">
              <Link
                to="/login" 
                className="bg-brand-600 hover:bg-brand-500 text-white px-7 py-4 rounded-xl font-medium text-base shadow-[0_4px_14px_rgba(59,130,246,0.35)] transition-all flex items-center gap-2"
              >
                立即开始使用 FuyouAI <ArrowRight size={18} />
              </Link>
              <button 
                onClick={scrollToFeatures}
                className="px-7 py-4 rounded-xl font-medium text-white/85 border border-white/[0.18] hover:border-white/40 hover:bg-white/[0.02] transition-all"
              >
                查看功能
              </button>
            </div>
          </div>

          {/* Right Column: OS Card (Glassmorphism) */}
          <div className="relative z-10 w-full max-w-[600px] aspect-[4/3] mx-auto lg:mr-0">
             {/* Background Glow */}
             <div className="absolute -inset-1 bg-brand-500/20 blur-3xl opacity-20 rounded-full"></div>
             
             {/* Card Container */}
             <div className="relative h-full w-full bg-white/[0.03] backdrop-blur-2xl border border-white/[0.12] rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.45)] p-8 flex flex-col">
                
                {/* Card Header */}
                <div className="flex items-center justify-between mb-8 border-b border-white/[0.08] pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
                  </div>
                  <div className="text-xs font-mono text-slate-500 uppercase tracking-widest">FuyouAI Task OS</div>
                </div>

                {/* Task Context */}
                <div className="mb-6">
                  <div className="text-xs text-slate-500 mb-1">当前任务 (Current Task)</div>
                  <div className="text-lg font-medium text-white flex items-center gap-2">
                    <Activity size={18} className="text-brand-400" />
                    深度市场分析任务：SaaS 行业趋势
                  </div>
                </div>

                {/* Steps */}
                <div className="flex-1 space-y-3">
                   {/* Step 1: Done */}
                   <div className="flex items-center gap-4 p-3 rounded-xl border border-white/[0.03] bg-white/[0.01] text-slate-500">
                      <div className="w-6 h-6 rounded-full border border-slate-700 flex items-center justify-center text-[10px]">1</div>
                      <div className="flex-1 font-mono text-sm">Task Understanding</div>
                      <Check size={14} className="text-slate-600" />
                   </div>

                   {/* Step 2: Active */}
                   <div className="relative flex items-center gap-4 p-3 rounded-xl border border-brand-400/50 bg-brand-900/20 text-white shadow-[0_0_25px_rgba(59,130,246,0.15)] overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-500"></div>
                      <div className="w-6 h-6 rounded-full bg-brand-500 flex items-center justify-center text-[10px] text-white font-bold animate-pulse">2</div>
                      <div className="flex-1 font-mono text-sm flex items-center justify-between">
                        <span>Data Gathering</span>
                        <span className="text-[10px] bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded">RUNNING</span>
                      </div>
                   </div>

                   {/* Step 3: Pending */}
                   <div className="flex items-center gap-4 p-3 rounded-xl border border-white/[0.03] bg-white/[0.01] text-slate-600 opacity-60">
                      <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center text-[10px]">3</div>
                      <div className="flex-1 font-mono text-sm">Structured Breakdown</div>
                   </div>

                   {/* Step 4: Pending */}
                   <div className="flex items-center gap-4 p-3 rounded-xl border border-white/[0.03] bg-white/[0.01] text-slate-600 opacity-60">
                      <div className="w-6 h-6 rounded-full border border-slate-800 flex items-center justify-center text-[10px]">4</div>
                      <div className="flex-1 font-mono text-sm">Execution Engine</div>
                   </div>
                </div>

                {/* Status Dot */}
                <div className="absolute top-8 right-8 w-2 h-2 rounded-full bg-brand-400 animate-ping"></div>
             </div>
          </div>
        </div>
      </header>

      {/* Section 2: What is FuyouAI (Professional Task Automator) */}
      <section className="max-w-7xl mx-auto px-6 py-24 border-b border-white/[0.05] relative z-10">
        <div className="text-center mb-16">
          <p className="text-xs font-semibold tracking-[0.2em] text-brand-400 uppercase mb-4">
            What is FuyouAI
          </p>

          <h2 className="text-3xl lg:text-4xl font-semibold text-white mb-6">
            FuyouAI 是一个 Professional Task Automator
          </h2>

          <p className="mt-4 text-lg text-slate-400 max-w-3xl mx-auto leading-relaxed">
            它不是内容生成模型，而是一套面向专业任务的 GTP（<a href="#" className="text-brand-400 underline decoration-brand-400/30 underline-offset-4 hover:text-brand-300 whitespace-nowrap">Generative Pre-trained Transformer</a>）<br className="hidden md:block" />
            从任务理解到结构化拆解，再到可执行、可复用的工作流生成，全流程自动完成
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "任务理解 (Task Understanding)",
              desc: "从一句模糊需求中抽取关键目标、约束与边界条件，判断是否为可执行任务。"
            },
            {
              title: "结构化拆解 (Task Breakdown)",
              desc: "将复杂任务拆解为信息收集、分析方法、产出结构、校验规则等可控步骤。"
            },
            {
              title: "执行引擎 (Execution Engine)",
              desc: "为每一步生成标准化指令与结构化 Prompt，交给 LLM 或其他工具稳定执行。"
            },
            {
              title: "质量校准 (Output Calibration)",
              desc: "通过对比预期与真实输出，对任务结构和 Prompt 进行迭代、优化和固定。"
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="group relative rounded-2xl border border-slate-700/50 bg-slate-900/40 backdrop-blur-md p-6 flex flex-col gap-3 hover:bg-slate-800/50 transition-colors"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
              <h3 className="text-sm font-semibold text-slate-200 relative z-10">
                {item.title}
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed relative z-10 line-clamp-3">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="max-w-7xl mx-auto px-6 py-24 relative z-10">
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {/* Feature 1 */}
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm h-full">
            <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 mb-6">
              <Layers size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">7 大核心框架</h3>
            <p className="text-slate-400 leading-relaxed line-clamp-3">
              内置思维链 (CoT)、技术链 (TMO)、结构化表达等经过验证的 Prompt 工程方法论，确保输出质量。
            </p>
          </div>

          {/* Feature 2 */}
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm h-full">
            <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 mb-6">
              <Terminal size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">Prompt 优化器</h3>
            <p className="text-slate-400 leading-relaxed line-clamp-3">
              通过可视化界面输入任务背景与限制，自动生成结构严谨、逻辑清晰的系统级 Prompt。
            </p>
          </div>

          {/* Feature 3 */}
          <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm h-full">
            <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 mb-6">
              <Database size={24} />
            </div>
            <h3 className="text-xl font-semibold text-white mb-3">行业落地模板</h3>
            <p className="text-slate-400 leading-relaxed line-clamp-3">
              覆盖产品、咨询、科研、法律等 10+ 垂直领域，直接复用专家级工作流，提升 10 倍效率。
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] bg-[#0B0F15] py-12 text-center text-slate-500 text-sm relative z-10">
        <p>&copy; 2025 FuyouAI. All rights reserved.</p>
      </footer>

    </div>
  );
};
