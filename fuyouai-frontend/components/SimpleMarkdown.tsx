import React from 'react';

// A lightweight component to render our structured markdown without heavy deps
// In a real production app, use 'react-markdown' or 'remark'
export const SimpleMarkdown: React.FC<{ content: string }> = ({ content }) => {
  const lines = content.split('\n');
  
  return (
    <div className="space-y-4 text-slate-700 leading-relaxed">
      {lines.map((line, index) => {
        // Headers
        if (line.startsWith('# ')) return <h1 key={index} className="text-3xl font-bold text-slate-900 mt-8 mb-4 border-b pb-2">{line.replace('# ', '')}</h1>;
        if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-semibold text-slate-800 mt-6 mb-3">{line.replace('## ', '')}</h2>;
        if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-semibold text-slate-800 mt-4 mb-2">{line.replace('### ', '')}</h3>;
        
        // Code Blocks (Basic detection)
        if (line.startsWith('```')) return null; // Skip fence lines for simplicity in this parser
        
        // Lists
        if (line.trim().startsWith('- ')) {
          return (
            <div key={index} className="flex items-start ml-4">
              <span className="mr-2 text-brand-500">•</span>
              <span>{line.replace('- ', '')}</span>
            </div>
          );
        }

        // Numeric Lists
        if (/^\d+\./.test(line.trim())) {
           return (
            <div key={index} className="flex items-start ml-4">
              <span className="mr-2 font-mono text-brand-600 text-sm font-bold">{line.split(' ')[0]}</span>
              <span>{line.replace(/^\d+\.\s/, '')}</span>
            </div>
           )
        }

        // Empty lines
        if (!line.trim()) return <div key={index} className="h-2"></div>;

        // Paragraphs with Bold support
        const parts = line.split(/(\*\*.*?\*\*)/g);
        return (
          <p key={index}>
            {parts.map((part, i) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
              }
              return part;
            })}
          </p>
        );
      })}
    </div>
  );
};

// Specialized component for Code Blocks to ensure they look good
export const CodeBlockViewer: React.FC<{ code: string; language?: string }> = ({ code }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-6 rounded-lg overflow-hidden border border-slate-200 bg-slate-900 text-slate-50 shadow-sm">
      <div className="flex justify-between items-center px-4 py-2 bg-slate-800 border-b border-slate-700">
        <span className="text-xs font-mono text-slate-400">PROMPT 模板</span>
        <button 
          onClick={handleCopy}
          className="text-xs bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded transition-colors text-white"
        >
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <div className="p-4 font-mono text-sm overflow-x-auto">
        <pre>{code}</pre>
      </div>
    </div>
  );
};