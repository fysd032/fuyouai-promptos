import React, { useState, useEffect } from 'react';
import { Copy, RefreshCw, Wand2, Layers, MessageSquare, ShieldAlert, FileText } from 'lucide-react';

export const PromptOptimizer: React.FC = () => {
  const [formData, setFormData] = useState({
    role: '',
    context: '',
    task: '',
    constraints: '',
    format: '',
    examples: ''
  });

  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // Real-time construction of the prompt
  useEffect(() => {
    const parts = [];
    
    if (formData.role) parts.push(`# ROLE (角色)\n${formData.role}`);
    if (formData.context) parts.push(`# CONTEXT (背景)\n${formData.context}`);
    if (formData.task) parts.push(`# TASK (任务)\n${formData.task}`);
    if (formData.constraints) parts.push(`# CONSTRAINTS (限制)\n${formData.constraints}`);
    if (formData.examples) parts.push(`# EXAMPLES (示例)\n${formData.examples}`);
    if (formData.format) parts.push(`# OUTPUT FORMAT (输出格式)\n${formData.format}`);

    setGeneratedPrompt(parts.join('\n\n'));
  }, [formData]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="mb-6 flex-shrink-0">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
            <Wand2 size={24} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Prompt 优化器</h1>
        </div>
        <p className="text-slate-500">使用模块化框架构建结构清晰、高质量的提示词。</p>
      </header>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        {/* Input Column */}
        <div className="flex-1 overflow-y-auto pr-2 pb-20 lg:pb-0">
          <div className="space-y-6">
            
            {/* Role */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-slate-800 font-semibold">
                <Layers size={18} className="text-blue-500" />
                <label>角色与人设 (Role & Persona)</label>
              </div>
              <input
                type="text"
                name="role"
                value={formData.role}
                onChange={handleChange}
                placeholder="例如：资深 Python 工程师、世界级文案大师..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
              />
            </div>

            {/* Context & Task */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-slate-800 font-semibold">
                <MessageSquare size={18} className="text-green-500" />
                <label>背景与任务 (Context & Task)</label>
              </div>
              <textarea
                name="context"
                value={formData.context}
                onChange={handleChange}
                placeholder="请提供与任务相关的背景信息..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all mb-3 h-24 resize-none"
              />
              <textarea
                name="task"
                value={formData.task}
                onChange={handleChange}
                placeholder="具体的指令（动作 + 对象 + 结果）..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-none transition-all h-24 resize-none"
              />
            </div>

            {/* Constraints */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-slate-800 font-semibold">
                <ShieldAlert size={18} className="text-red-500" />
                <label>限制条件与负向提示 (Constraints)</label>
              </div>
              <textarea
                name="constraints"
                value={formData.constraints}
                onChange={handleChange}
                placeholder="AI 绝对不能做什么？字数限制？格式限制？"
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:outline-none transition-all h-20 resize-none"
              />
            </div>

             {/* Output Format */}
             <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3 text-slate-800 font-semibold">
                <FileText size={18} className="text-purple-500" />
                <label>输出格式 (Output Format)</label>
              </div>
              <textarea
                name="format"
                value={formData.format}
                onChange={handleChange}
                placeholder="Markdown 表格, JSON, 列表, 特定语气..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all h-20 resize-none"
              />
            </div>

          </div>
        </div>

        {/* Preview Column */}
        <div className="flex-1 flex flex-col bg-slate-900 rounded-xl overflow-hidden shadow-lg border border-slate-700">
          <div className="flex items-center justify-between p-4 bg-slate-800 border-b border-slate-700">
            <span className="text-slate-200 font-mono text-sm flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              生成的 PROMPT
            </span>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                isCopied 
                  ? 'bg-green-600 text-white' 
                  : 'bg-slate-700 text-slate-200 hover:bg-slate-600'
              }`}
            >
              {isCopied ? <span className="flex items-center gap-1">已复制!</span> : <span className="flex items-center gap-1"><Copy size={14} /> 复制</span>}
            </button>
          </div>
          <div className="flex-1 p-6 overflow-y-auto">
             {generatedPrompt ? (
               <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                 {generatedPrompt}
               </pre>
             ) : (
               <div className="h-full flex flex-col items-center justify-center text-slate-500">
                 <RefreshCw size={48} className="mb-4 opacity-20" />
                 <p>请填写左侧表单以生成结构化 Prompt。</p>
               </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};