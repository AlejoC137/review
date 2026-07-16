import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { 
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, Heading4, 
  List, ListOrdered, Quote, Link as LinkIcon, Eye, Code, Terminal,
  AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextAlign from '@tiptap/extension-text-align';
import { Markdown } from 'tiptap-markdown';

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

const createMarkdownComponents = (fontSizePx = 12, customFont = '', textAlign = 'justify') => ({
  h1: ({ node, children, ...props }) => {
    const id = getHeadingId(children);
    return <h1 id={id} style={{ fontSize: `${fontSizePx * 2}px`, fontFamily: customFont || undefined, textAlign }} className="font-display font-bold text-[#1c1c19] mt-6 mb-8 uppercase tracking-widest leading-tight scroll-mt-24 first:mt-0 last:mb-0" {...props}>{children}</h1>;
  },
  h2: ({ node, children, ...props }) => {
    const id = getHeadingId(children);
    return <h2 id={id} style={{ fontSize: `${fontSizePx * 1.4}px`, fontFamily: customFont || undefined, textAlign }} className="font-display font-bold text-[#1c1c19] mt-10 mb-4 uppercase tracking-wide leading-tight border-b-2 border-[#1c1c19]/10 pb-2 scroll-mt-24 first:mt-0 last:mb-0" {...props}>{children}</h2>;
  },
  h3: ({ node, children, ...props }) => {
    const id = getHeadingId(children);
    return <h3 id={id} style={{ fontSize: `${fontSizePx * 1.2}px`, fontFamily: customFont || undefined, textAlign }} className="font-display font-bold text-[#1c1c19] mt-8 mb-3 uppercase tracking-wide scroll-mt-24 first:mt-0 last:mb-0" {...props}>{children}</h3>;
  },
  h4: ({ node, children, ...props }) => {
    const id = getHeadingId(children);
    return <h4 id={id} style={{ fontSize: `${fontSizePx * 1.1}px`, fontFamily: customFont || undefined, textAlign }} className="font-display font-bold text-[#1c1c19] mt-6 mb-2 uppercase scroll-mt-24 first:mt-0 last:mb-0" {...props}>{children}</h4>;
  },
  p: ({ node, ...props }) => <div style={{ fontSize: `${fontSizePx}px`, fontFamily: customFont || undefined, textAlign }} className="font-sans text-[#1c1c19]/90 leading-relaxed mb-6 break-words hyphens-auto last:mb-0" {...props} />,
  ul: ({ node, ...props }) => <ul style={{ fontSize: `${fontSizePx}px`, fontFamily: customFont || undefined, textAlign }} className="list-disc ml-6 mb-6 space-y-2 text-[#1c1c19]/90 break-words last:mb-0" {...props} />,
  ol: ({ node, ...props }) => <ol style={{ fontSize: `${fontSizePx}px`, fontFamily: customFont || undefined, textAlign }} className="list-decimal ml-6 mb-6 space-y-2 text-[#1c1c19]/90 break-words last:mb-0" {...props} />,
  li: ({ node, ...props }) => <li style={{ fontSize: `${fontSizePx}px`, fontFamily: customFont || undefined, textAlign }} className="font-sans leading-relaxed break-words mb-1 last:mb-0" {...props} />,
  strong: ({ node, ...props }) => <strong className="font-black text-black" {...props} />,
  em: ({ node, ...props }) => <em className="italic text-[#1c1c19]/80" {...props} />,
  code: ({ node, inline, ...props }) => inline
    ? <code style={{ fontSize: `${fontSizePx * 0.9}px` }} className="bg-[#f6f3ee] px-1.5 py-0.5 border border-[#1c1c19]/10 text-[#0f4369] font-mono rounded-sm break-all" {...props} />
    : <pre className="bg-white border-2 border-[#1c1c19] p-6 mb-6 overflow-x-auto print:overflow-visible print:whitespace-pre-wrap print:break-words last:mb-0"><code style={{ fontSize: `${fontSizePx * 0.9}px` }} className="text-[#1c1c19] font-mono leading-relaxed" {...props} /></pre>,
  blockquote: ({ node, ...props }) => <blockquote style={{ fontSize: `${fontSizePx}px`, fontFamily: customFont || undefined }} className="border-l-4 border-[#0f4369] pl-6 py-3 mb-6 italic text-[#1c1c19]/80 bg-[#f6f3ee]/30 break-words last:mb-0" {...props} />,
  a: ({ node, ...props }) => <a className="text-[#0f4369] font-semibold underline decoration-1 underline-offset-4 hover:text-[#ba1a1a] hover:decoration-2 transition-all break-all" {...props} />,
  hr: () => <hr className="border-t border-[#1c1c19]/10 my-8" />,
  table: ({ node, ...props }) => (
    <div className="w-full overflow-x-auto mb-8 print:overflow-visible last:mb-0">
      <table style={{ fontSize: `${fontSizePx * 0.9}px`, fontFamily: customFont || undefined }} className="w-full border-collapse border border-[#1c1c19] table-fixed print:table-auto" {...props} />
    </div>
  ),
  thead: ({ node, ...props }) => <thead className="bg-[#f6f3ee]" {...props} />,
  th: ({ node, ...props }) => <th className="border border-[#1c1c19] px-4 py-3 font-display font-black uppercase tracking-tight text-left" style={{ fontFamily: customFont || undefined }} {...props} />,
  td: ({ node, ...props }) => <td className="border border-[#1c1c19] px-4 py-2 font-mono leading-relaxed" style={{ fontFamily: customFont || undefined }} {...props} />,
  tr: ({ node, ...props }) => <tr className="hover:bg-[#f6f3ee]/50 transition-colors" {...props} />,
});

const formatContent = (content) => {
  if (!content) return '';
  return content.replace(/\\n/g, '\n');
};

const editorTailwindStyles = `
  [&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none
  [&_.ProseMirror_h1]:font-display [&_.ProseMirror_h1]:font-bold [&_.ProseMirror_h1]:text-[#1c1c19] [&_.ProseMirror_h1]:mt-6 [&_.ProseMirror_h1]:mb-8 [&_.ProseMirror_h1]:uppercase [&_.ProseMirror_h1]:tracking-widest [&_.ProseMirror_h1]:leading-tight [&_.ProseMirror_h1]:first:mt-0 [&_.ProseMirror_h1]:last:mb-0
  [&_.ProseMirror_h2]:font-display [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h2]:text-[#1c1c19] [&_.ProseMirror_h2]:mt-10 [&_.ProseMirror_h2]:mb-4 [&_.ProseMirror_h2]:uppercase [&_.ProseMirror_h2]:tracking-wide [&_.ProseMirror_h2]:leading-tight [&_.ProseMirror_h2]:border-b-2 [&_.ProseMirror_h2]:border-[#1c1c19]/10 [&_.ProseMirror_h2]:pb-2 [&_.ProseMirror_h2]:first:mt-0 [&_.ProseMirror_h2]:last:mb-0
  [&_.ProseMirror_h3]:font-display [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_h3]:text-[#1c1c19] [&_.ProseMirror_h3]:mt-8 [&_.ProseMirror_h3]:mb-3 [&_.ProseMirror_h3]:uppercase [&_.ProseMirror_h3]:tracking-wide [&_.ProseMirror_h3]:first:mt-0 [&_.ProseMirror_h3]:last:mb-0
  [&_.ProseMirror_h4]:font-display [&_.ProseMirror_h4]:font-bold [&_.ProseMirror_h4]:text-[#1c1c19] [&_.ProseMirror_h4]:mt-6 [&_.ProseMirror_h4]:mb-2 [&_.ProseMirror_h4]:uppercase [&_.ProseMirror_h4]:first:mt-0 [&_.ProseMirror_h4]:last:mb-0
  [&_.ProseMirror_p]:font-sans [&_.ProseMirror_p]:text-[#1c1c19]/90 [&_.ProseMirror_p]:leading-relaxed [&_.ProseMirror_p]:mb-6 [&_.ProseMirror_p]:break-words [&_.ProseMirror_p]:hyphens-auto [&_.ProseMirror_p]:last:mb-0
  [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:ml-6 [&_.ProseMirror_ul]:mb-6 [&_.ProseMirror_ul]:space-y-2 [&_.ProseMirror_ul]:text-[#1c1c19]/90 [&_.ProseMirror_ul]:break-words [&_.ProseMirror_ul]:last:mb-0
  [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:ml-6 [&_.ProseMirror_ol]:mb-6 [&_.ProseMirror_ol]:space-y-2 [&_.ProseMirror_ol]:text-[#1c1c19]/90 [&_.ProseMirror_ol]:break-words [&_.ProseMirror_ol]:last:mb-0
  [&_.ProseMirror_li]:font-sans [&_.ProseMirror_li]:leading-relaxed [&_.ProseMirror_li]:break-words [&_.ProseMirror_li]:mb-1 [&_.ProseMirror_li]:last:mb-0
  [&_.ProseMirror_strong]:font-black [&_.ProseMirror_strong]:text-black
  [&_.ProseMirror_em]:italic [&_.ProseMirror_em]:text-[#1c1c19]/80
  [&_.ProseMirror_code]:bg-[#f6f3ee] [&_.ProseMirror_code]:px-1.5 [&_.ProseMirror_code]:py-0.5 [&_.ProseMirror_code]:border [&_.ProseMirror_code]:border-[#1c1c19]/10 [&_.ProseMirror_code]:text-[#0f4369] [&_.ProseMirror_code]:font-mono [&_.ProseMirror_code]:rounded-sm [&_.ProseMirror_code]:break-all
  [&_.ProseMirror_pre]:bg-white [&_.ProseMirror_pre]:border-2 [&_.ProseMirror_pre]:border-[#1c1c19] [&_.ProseMirror_pre]:p-6 [&_.ProseMirror_pre]:mb-6 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:last:mb-0
  [&_.ProseMirror_pre_code]:bg-transparent [&_.ProseMirror_pre_code]:p-0 [&_.ProseMirror_pre_code]:border-0 [&_.ProseMirror_pre_code]:text-[#1c1c19]
  [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-[#0f4369] [&_.ProseMirror_blockquote]:pl-6 [&_.ProseMirror_blockquote]:py-3 [&_.ProseMirror_blockquote]:mb-6 [&_.ProseMirror_blockquote]:italic [&_.ProseMirror_blockquote]:text-[#1c1c19]/80 [&_.ProseMirror_blockquote]:bg-[#f6f3ee]/30 [&_.ProseMirror_blockquote]:break-words [&_.ProseMirror_blockquote]:last:mb-0
  [&_.ProseMirror_a]:text-[#0f4369] [&_.ProseMirror_a]:font-semibold [&_.ProseMirror_a]:underline [&_.ProseMirror_a]:decoration-1 [&_.ProseMirror_a]:underline-offset-4 hover:[&_.ProseMirror_a]:text-[#ba1a1a] hover:[&_.ProseMirror_a]:decoration-2 [&_.ProseMirror_a]:transition-all [&_.ProseMirror_a]:break-all
  [&_.ProseMirror_hr]:border-t [&_.ProseMirror_hr]:border-[#1c1c19]/10 [&_.ProseMirror_hr]:my-8
`;

const MarkdownEditor = ({ value, onChange, isEditing = false, className = "", height = "500px", fontSize = 12, customFont = "", textAlign = "justify" }) => {
  const [viewMode, setViewMode] = useState('visual'); // visual is now Tiptap WYSIWYG
  const textareaRef = useRef(null);

  // Parse fontSize safely to handle both numbers and Tailwind style classes (e.g. "text-[12px]")
  let parsedFontSize = 12;
  if (typeof fontSize === 'number') {
    parsedFontSize = fontSize;
  } else if (typeof fontSize === 'string') {
    const match = fontSize.match(/\d+/);
    if (match) {
      parsedFontSize = parseInt(match[0], 10);
    }
  }

  const MarkdownComponents = createMarkdownComponents(parsedFontSize, customFont, textAlign);

  const lastValueRef = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Markdown.configure({
        link: {
          openOnClick: false,
        }
      }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown.getMarkdown();
      lastValueRef.current = markdown;
      if (onChange) onChange(markdown);
    },
  });

  // Sync value to editor if it changes externally
  useEffect(() => {
    if (editor && value !== lastValueRef.current && value !== editor.storage.markdown.getMarkdown()) {
      const currentSelection = editor.state.selection;
      editor.commands.setContent(value || '', false);
      try {
        editor.commands.setTextSelection(currentSelection);
      } catch (e) {
        // Safe fallback if selection is out of range
      }
    }
    lastValueRef.current = value;
  }, [value, editor]);

  // Adjust raw textarea height
  useEffect(() => {
    if (textareaRef.current && viewMode === 'code') {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value, viewMode, fontSize, customFont]);

  const insertRawMarkdown = (prefix, suffix = '') => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = value || '';
    const selection = text.substring(start, end);
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + prefix + selection + suffix + after;
    if (onChange) onChange(newText);
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selection.length + suffix.length;
      textarea.setSelectionRange(
        selection.length > 0 ? start + prefix.length : newCursorPos,
        newCursorPos
      );
    }, 0);
  };

  const handleAction = (action, prefix, suffix) => {
    if (viewMode === 'code') {
      insertRawMarkdown(prefix, suffix);
    } else if (editor) {
      action(editor);
    }
  };

  if (!isEditing) {
    return (
      <div className={`w-full ${className}`}>
        <ReactMarkdown 
          components={MarkdownComponents}
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeRaw]}
        >
          {formatContent(value || '*No content available*')}
        </ReactMarkdown>
      </div>
    );
  }

  return (
    <div className={`flex flex-col border-2 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,0.1)] bg-white print:border-none print:shadow-none ${className}`} style={{ minHeight: height }}>
      {/* Dynamic styles for Tiptap */}
      <style>{`
        .ProseMirror {
          font-family: ${customFont || 'inherit'};
          font-size: ${parsedFontSize}px;
          text-align: ${textAlign};
        }
        .ProseMirror h1 { font-size: ${parsedFontSize * 2}px; }
        .ProseMirror h2 { font-size: ${parsedFontSize * 1.4}px; }
        .ProseMirror h3 { font-size: ${parsedFontSize * 1.2}px; }
        .ProseMirror h4 { font-size: ${parsedFontSize * 1.1}px; }
        .ProseMirror code { font-size: ${parsedFontSize * 0.9}px; }
        .ProseMirror pre code { font-size: ${parsedFontSize * 0.9}px; }
      `}</style>

      {/* Editor Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-[#e5e2dd] border-b-2 border-[#1c1c19] gap-3 print:hidden overflow-x-auto">
        <div className="flex flex-nowrap items-center gap-1 min-w-max">
          <button type="button" onClick={() => handleAction(e => e.chain().focus().toggleBold().run(), '**', '**')} title="Negrita" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <Bold size={16} />
          </button>
          <button type="button" onClick={() => handleAction(e => e.chain().focus().toggleItalic().run(), '_', '_')} title="Cursiva" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <Italic size={16} />
          </button>
          <button type="button" onClick={() => handleAction(e => e.chain().focus().toggleStrike().run(), '~~', '~~')} title="Tachado" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <Strikethrough size={16} />
          </button>
          
          <div className="w-px h-6 bg-[#1c1c19]/20 mx-1" />
          
          <button type="button" onClick={() => handleAction(e => e.chain().focus().toggleHeading({ level: 1 }).run(), '# ')} title="Título 1" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <Heading1 size={16} />
          </button>
          <button type="button" onClick={() => handleAction(e => e.chain().focus().toggleHeading({ level: 2 }).run(), '## ')} title="Título 2" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <Heading2 size={16} />
          </button>
          <button type="button" onClick={() => handleAction(e => e.chain().focus().toggleHeading({ level: 3 }).run(), '### ')} title="Título 3" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <Heading3 size={16} />
          </button>
          <button type="button" onClick={() => handleAction(e => e.chain().focus().toggleHeading({ level: 4 }).run(), '#### ')} title="Título 4" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <Heading4 size={16} />
          </button>

          <div className="w-px h-6 bg-[#1c1c19]/20 mx-1" />

          <button type="button" onClick={() => handleAction(e => e.chain().focus().setTextAlign('left').run(), '<div align="left">\n\n', '\n\n</div>')} title="Alinear Izquierda" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <AlignLeft size={16} />
          </button>
          <button type="button" onClick={() => handleAction(e => e.chain().focus().setTextAlign('center').run(), '<div align="center">\n\n', '\n\n</div>')} title="Centrar" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <AlignCenter size={16} />
          </button>
          <button type="button" onClick={() => handleAction(e => e.chain().focus().setTextAlign('right').run(), '<div align="right">\n\n', '\n\n</div>')} title="Alinear Derecha" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <AlignRight size={16} />
          </button>
          <button type="button" onClick={() => handleAction(e => e.chain().focus().setTextAlign('justify').run(), '<div align="justify">\n\n', '\n\n</div>')} title="Justificar" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <AlignJustify size={16} />
          </button>

          <div className="w-px h-6 bg-[#1c1c19]/20 mx-1" />

          <button type="button" onClick={() => handleAction(e => e.chain().focus().toggleBulletList().run(), '- ')} title="Lista" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <List size={16} />
          </button>
          <button type="button" onClick={() => handleAction(e => e.chain().focus().toggleOrderedList().run(), '1. ')} title="Lista Numerada" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <ListOrdered size={16} />
          </button>
          <button type="button" onClick={() => handleAction(e => e.chain().focus().toggleBlockquote().run(), '> ')} title="Cita" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <Quote size={16} />
          </button>

          <div className="w-px h-6 bg-[#1c1c19]/20 mx-1" />

          <button type="button" onClick={() => handleAction(e => e.chain().focus().toggleCode().run(), '`', '`')} title="Código Integrado" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <Code size={16} />
          </button>
          <button type="button" onClick={() => handleAction(e => e.chain().focus().toggleCodeBlock().run(), '```\n', '\n```')} title="Bloque de Código" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <Terminal size={16} />
          </button>
          <button type="button" onClick={() => handleAction(e => {
            const url = window.prompt('URL:');
            if (url) e.chain().focus().setLink({ href: url }).run();
          }, '[', '](url)')} title="Enlace" className="p-2 hover:bg-[#fcf9f4] hover:shadow-sm text-[#1c1c19] transition-all border border-transparent hover:border-[#1c1c19]">
            <LinkIcon size={16} />
          </button>
        </div>

        <div className="flex bg-[#1c1c19] p-0.5 border-2 border-[#1c1c19] self-start md:self-auto shrink-0 mt-2 md:mt-0">
          <button type="button" onClick={() => setViewMode('code')} className={`flex items-center gap-2 px-3 md:px-4 py-1.5 text-[10px] md:text-[11px] font-display font-bold tracking-widest uppercase transition-all ${viewMode === 'code' ? 'bg-[#fcf9f4] text-[#1c1c19]' : 'text-[#f6f3ee] hover:text-[#e5e2dd]'}`}>
            <Code size={14} /> <span className="hidden xs:inline">CÓDIGO CRUDO</span>
          </button>
          <button type="button" onClick={() => setViewMode('visual')} className={`flex items-center gap-2 px-3 md:px-4 py-1.5 text-[10px] md:text-[11px] font-display font-bold tracking-widest uppercase transition-all ${viewMode === 'visual' ? 'bg-[#fcf9f4] text-[#1c1c19]' : 'text-[#f6f3ee] hover:text-[#e5e2dd]'}`}>
            <Eye size={14} /> <span className="hidden xs:inline">WYSIWYG</span>
          </button>
        </div>
      </div>

      <div className="relative flex-1 bg-white min-h-0 flex flex-col">
        {viewMode === 'code' ? (
          <div className="flex-1 w-full h-full min-h-[400px] p-6 md:p-12 overflow-y-auto bg-white custom-scrollbar print:hidden">
            <textarea
              ref={textareaRef}
              value={value || ''}
              onChange={e => onChange && onChange(e.target.value)}
              style={{ 
                fontFamily: customFont || 'inherit',
                fontSize: `${fontSize}px`,
                textAlign: textAlign
              }}
              className="w-full h-auto min-h-full focus:outline-none resize-none bg-transparent text-[#1c1c19] leading-relaxed overflow-hidden"
              placeholder="# Markdown Content..."
              spellCheck="false"
            />
          </div>
        ) : (
          <div className={`flex-1 w-full h-full min-h-[400px] p-6 md:p-12 overflow-y-auto bg-white custom-scrollbar print:overflow-visible print:h-auto print:p-0 ${editorTailwindStyles}`}>
            <EditorContent editor={editor} className="min-h-full" />
          </div>
        )}
      </div>
    </div>
  );
};

export default MarkdownEditor;
