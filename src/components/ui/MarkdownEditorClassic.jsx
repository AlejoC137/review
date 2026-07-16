import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Bold, Italic, Type, List, Link as LinkIcon, Eye, Code } from 'lucide-react';

const getHeadingId = (children) => {
  if (!children) return '';
  const text = React.Children.toArray(children)
    .map(child => {
      if (typeof child === 'string') return child;
      if (child.props && child.props.children) return getHeadingId(child.props.children);
      return '';
    })
    .join('');
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove accents
    .replace(/[^a-z0-9]+/g, '-')     // Convert to kebab-case
    .replace(/(^-|-$)/g, '');        // Remove trailing hyphens
};

const createMarkdownComponents = (fontSizePx = 12) => ({
  h1: ({ node, children, ...props }) => {
    const id = getHeadingId(children);
    return <h1 id={id} style={{ fontSize: `${fontSizePx * 2}px` }} className="font-display font-bold text-[#1c1c19] mt-6 mb-8 uppercase tracking-widest leading-tight text-center scroll-mt-24" {...props}>{children}</h1>;
  },
  h2: ({ node, children, ...props }) => {
    const id = getHeadingId(children);
    return <h2 id={id} style={{ fontSize: `${fontSizePx * 1.4}px` }} className="font-display font-bold text-[#1c1c19] mt-10 mb-4 uppercase tracking-wide leading-tight border-b-2 border-[#1c1c19]/10 pb-2 scroll-mt-24" {...props}>{children}</h2>;
  },
  h3: ({ node, children, ...props }) => {
    const id = getHeadingId(children);
    return <h3 id={id} style={{ fontSize: `${fontSizePx * 1.2}px` }} className="font-display font-bold text-[#1c1c19] mt-8 mb-3 uppercase tracking-wide scroll-mt-24" {...props}>{children}</h3>;
  },
  h4: ({ node, children, ...props }) => {
    const id = getHeadingId(children);
    return <h4 id={id} style={{ fontSize: `${fontSizePx * 1.1}px` }} className="font-display font-bold text-[#1c1c19] mt-6 mb-2 uppercase scroll-mt-24" {...props}>{children}</h4>;
  },
  p: ({ node, ...props }) => <div style={{ fontSize: `${fontSizePx}px` }} className="font-sans text-[#1c1c19]/90 leading-relaxed mb-6 text-justify break-words hyphens-auto" {...props} />,
  ul: ({ node, ...props }) => <ul style={{ fontSize: `${fontSizePx}px` }} className="list-disc ml-6 mb-6 space-y-2 text-[#1c1c19]/90 break-words" {...props} />,
  ol: ({ node, ...props }) => <ol style={{ fontSize: `${fontSizePx}px` }} className="list-decimal ml-6 mb-6 space-y-2 text-[#1c1c19]/90 break-words" {...props} />,
  li: ({ node, ...props }) => <li style={{ fontSize: `${fontSizePx}px` }} className="font-sans leading-relaxed break-words mb-1" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-black text-black" {...props} />,
  em: ({ node, ...props }) => <em className="italic text-[#1c1c19]/80" {...props} />,
  code: ({ node, inline, ...props }) => inline
    ? <code style={{ fontSize: `${fontSizePx * 0.9}px` }} className="bg-[#f6f3ee] px-1.5 py-0.5 border border-[#1c1c19]/10 text-[#0f4369] font-mono rounded-sm break-all" {...props} />
    : <pre className="bg-white border-2 border-[#1c1c19] p-6 mb-6 overflow-x-auto print:overflow-visible print:whitespace-pre-wrap print:break-words"><code style={{ fontSize: `${fontSizePx * 0.9}px` }} className="text-[#1c1c19] font-mono leading-relaxed" {...props} /></pre>,
  blockquote: ({ node, ...props }) => <blockquote style={{ fontSize: `${fontSizePx}px` }} className="border-l-4 border-[#0f4369] pl-6 py-3 mb-6 italic text-[#1c1c19]/80 bg-[#f6f3ee]/30 break-words" {...props} />,
  a: ({ node, ...props }) => <a className="text-[#0f4369] font-semibold underline decoration-1 underline-offset-4 hover:text-[#ba1a1a] hover:decoration-2 transition-all break-all" {...props} />,
  hr: () => <hr className="border-t border-[#1c1c19]/10 my-8" />,
  table: ({ node, ...props }) => (
    <div className="w-full overflow-x-auto mb-8 print:overflow-visible">
      <table style={{ fontSize: `${fontSizePx * 0.9}px` }} className="w-full border-collapse border border-[#1c1c19] table-fixed print:table-auto" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="bg-[#f6f3ee]" {...props} />,
  th: ({ node, ...props }) => <th className="border border-[#1c1c19] px-4 py-3 font-display font-black uppercase tracking-tight text-left" {...props} />,
  td: ({ node, ...props }) => <td className="border border-[#1c1c19] px-4 py-2 font-mono leading-relaxed" {...props} />,
  tr: ({ node, ...props }) => <tr className="hover:bg-[#f6f3ee]/50 transition-colors" {...props} />,
});

const formatContent = (content) => {
  if (!content) return '';
  return content.replace(/\\n/g, '\n');
};

const MarkdownEditorClassic = ({ value, onChange, isEditing = false, className = "", height = "500px", fontSize = 12 }) => {
  const [viewMode, setViewMode] = useState('code'); // 'code' or 'visual'
  const textareaRef = useRef(null);
  const MarkdownComponents = createMarkdownComponents(fontSize);

  const insertMarkdown = (prefix, suffix = '') => {
    if (!textareaRef.current) return;

    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value || '';
    const selection = text.substring(start, end);

    const before = text.substring(0, start);
    const after = text.substring(end);

    const newText = before + prefix + selection + suffix + after;

    onChange(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selection.length + suffix.length;
      textarea.setSelectionRange(
        selection.length > 0 ? start + prefix.length : newCursorPos,
        newCursorPos
      );
    }, 0);
  };

  if (!isEditing) {
    return (
      <div className={`w-full ${className}`}>
        <ReactMarkdown 
          components={MarkdownComponents}
          remarkPlugins={[remarkGfm]}
        >
          {formatContent(value || '*No content available*')}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className={`flex flex-col border-2 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,0.1)] bg-white print:border-none print:shadow-none ${className}`} style={{ minHeight: height }}>
      {/* Editor Toolbar - Hidden on Print */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-[#e5e2dd] border-b-2 border-[#1c1c19] gap-3 print:hidden">
        <div className="flex flex-wrap items-center gap-1">
          <button type="button" onClick={() => insertMarkdown('**', '**')} disabled={viewMode === 'visual'} className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all disabled:opacity-30 border border-transparent hover:border-[#1c1c19]">
            <Bold size={16} />
          </button>
          <button type="button" onClick={() => insertMarkdown('_', '_')} disabled={viewMode === 'visual'} className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all disabled:opacity-30 border border-transparent hover:border-[#1c1c19]">
            <Italic size={16} />
          </button>
          <div className="w-px h-6 bg-[#1c1c19]/20 mx-1 md:mx-2" />
          <button type="button" onClick={() => insertMarkdown('### ')} disabled={viewMode === 'visual'} className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all disabled:opacity-30 border border-transparent hover:border-[#1c1c19] flex items-center gap-0.5">
            <Type size={16} /><span className="text-[10px] font-bold">1</span>
          </button>
          <button type="button" onClick={() => insertMarkdown('#### ')} disabled={viewMode === 'visual'} className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all disabled:opacity-30 border border-transparent hover:border-[#1c1c19] flex items-center gap-0.5">
            <Type size={16} /><span className="text-[10px] font-bold">2</span>
          </button>
          <div className="w-px h-6 bg-[#1c1c19]/20 mx-1 md:mx-2" />
          <button type="button" onClick={() => insertMarkdown('- ')} disabled={viewMode === 'visual'} className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all disabled:opacity-30 border border-transparent hover:border-[#1c1c19]">
            <List size={16} />
          </button>
          <button type="button" onClick={() => insertMarkdown('[', '](url)')} disabled={viewMode === 'visual'} className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all disabled:opacity-30 border border-transparent hover:border-[#1c1c19]">
            <LinkIcon size={16} />
          </button>
        </div>

        <div className="flex bg-[#1c1c19] p-0.5 border-2 border-[#1c1c19] self-start md:self-auto">
          <button type="button" onClick={() => setViewMode('code')} className={`flex items-center gap-2 px-3 md:px-4 py-1.5 text-[10px] md:text-[11px] font-display font-bold tracking-widest uppercase transition-all ${viewMode === 'code' ? 'bg-[#fcf9f4] text-[#1c1c19]' : 'text-[#f6f3ee] hover:text-[#e5e2dd]'}`}>
            <Code size={14} /> <span className="hidden xs:inline">CÓDIGO</span>
          </button>
          <button type="button" onClick={() => setViewMode('visual')} className={`flex items-center gap-2 px-3 md:px-4 py-1.5 text-[10px] md:text-[11px] font-display font-bold tracking-widest uppercase transition-all ${viewMode === 'visual' ? 'bg-[#fcf9f4] text-[#1c1c19]' : 'text-[#f6f3ee] hover:text-[#e5e2dd]'}`}>
            <Eye size={14} /> <span className="hidden xs:inline">VISUAL</span>
          </button>
        </div>
      </div>

      <div className="relative flex-1 bg-white min-h-0 flex flex-col">
        {viewMode === 'code' ? (
          <textarea
            ref={textareaRef}
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            className="flex-1 w-full h-full min-h-[400px] p-6 md:p-10 focus:outline-none font-mono text-sm md:text-base resize-y bg-white text-[#1c1c19] leading-relaxed shadow-inner print:hidden overflow-y-auto custom-scrollbar"
            placeholder="# Markdown Content..."
            spellCheck="false"
          />
        ) : (
          <div className="flex-1 w-full h-full min-h-[400px] p-6 md:p-12 overflow-y-auto bg-white custom-scrollbar print:overflow-visible print:h-auto print:p-0">
            <ReactMarkdown 
              components={MarkdownComponents}
              remarkPlugins={[remarkGfm]}
            >
              {formatContent(value || '*No content documentado para renderizar*')}
            </ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditorClassic;
