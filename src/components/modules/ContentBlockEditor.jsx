import React, { useState } from 'react';
import { Trash2, ArrowUp, ArrowDown, Image as ImageIcon, FileText, Plus, Loader2, X, LayoutTemplate, Scissors, ArrowDownUp, CheckSquare, Square, ListX, Bot, Type } from 'lucide-react';
import MarkdownEditor from '../ui/MarkdownEditor';
import { getCustomFonts, addCustomFont } from '../../utils/fontManager';
import ContentBlockEditorClassic from './ContentBlockEditorClassic';

const ContentBlockEditor = (props) => {
  const { blocks = [], onChange, onUploadImage, isEditing = false, fontSize = 12, hideGuidelines = false } = props;

  // Check if blocks contain any advanced features
  const hasAdvancedBlocks = blocks.some(b => 
    b.type === 'page-break' || 
    b.type === 'spacer' || 
    (b.width && b.width !== '1' && b.width !== '100%') || 
    b.padding || 
    b.margin || 
    (b.align && b.align !== 'justify' && b.align !== 'center') || 
    b.caption
  );

  const [localUseNewEditor, setLocalUseNewEditor] = useState(() => {
    return hasAdvancedBlocks || localStorage.getItem('global_use_new_editor') === 'true';
  });

  const useNewEditor = props.useNewEditor !== undefined ? props.useNewEditor : localUseNewEditor;
  const setUseNewEditor = props.setUseNewEditor !== undefined ? props.setUseNewEditor : setLocalUseNewEditor;

  const [uploading, setUploading] = useState(null); // index of block being uploaded
  const [localPreviews, setLocalPreviews] = useState({}); // { index: localUrl }
  const [selectedBlocks, setSelectedBlocks] = useState([]); // array of block ids
  const [showAppendModal, setShowAppendModal] = useState(false);
  const [appendJsonText, setAppendJsonText] = useState("");

  // Cleanup local URLs on unmount
  React.useEffect(() => {
    return () => {
      Object.values(localPreviews).forEach(url => {
        if (typeof url === 'string' && url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [localPreviews]);

  const handleAddBlock = (type, insertIndex = undefined, originWidth = '1') => {
    const newBlock = {
      type,
      content: type === 'text' ? '' : '',
      width: originWidth,
      id: `temp-${Date.now()}`
    };
    onChange(prev => {
      if (insertIndex !== undefined) {
        const newBlocks = [...prev];
        newBlocks.splice(insertIndex, 0, newBlock);
        return newBlocks;
      }
      return [...prev, newBlock];
    });
  };

  const handleRemoveBlock = (index) => {
    const isSelected = selectedBlocks.includes(blocks[index].id);
    if (isSelected && selectedBlocks.length > 1) {
      if (window.confirm(`¿Eliminar ${selectedBlocks.length} bloques seleccionados?`)) {
        onChange(prev => prev.filter(b => !selectedBlocks.includes(b.id)));
        setSelectedBlocks([]);
      }
    } else {
      onChange(prev => prev.filter((_, i) => i !== index));
      setSelectedBlocks(prev => prev.filter(id => id !== blocks[index].id));
    }
  };

  const handleMoveBlock = (index, direction) => {
    const isSelected = selectedBlocks.includes(blocks[index].id);
    
    if (isSelected && selectedBlocks.length > 1) {
      const selectedIndices = blocks
        .map((b, i) => selectedBlocks.includes(b.id) ? i : -1)
        .filter(i => i !== -1);
        
      if (direction === -1) {
        if (selectedIndices[0] === 0) return; // Cannot move up
        onChange(prev => {
          const newBlocks = [...prev];
          for (let i of selectedIndices) {
            const temp = newBlocks[i];
            newBlocks[i] = newBlocks[i - 1];
            newBlocks[i - 1] = temp;
          }
          return newBlocks;
        });
      } else {
        if (selectedIndices[selectedIndices.length - 1] === blocks.length - 1) return; // Cannot move down
        onChange(prev => {
          const newBlocks = [...prev];
          for (let i = selectedIndices.length - 1; i >= 0; i--) {
            const idx = selectedIndices[i];
            const temp = newBlocks[idx];
            newBlocks[idx] = newBlocks[idx + 1];
            newBlocks[idx + 1] = temp;
          }
          return newBlocks;
        });
      }
    } else {
      if (index + direction < 0 || index + direction >= blocks.length) return;
      onChange(prev => {
        const newBlocks = [...prev];
        const [movedBlock] = newBlocks.splice(index, 1);
        newBlocks.splice(index + direction, 0, movedBlock);
        return newBlocks;
      });
    }
  };

  const handleUpdateBlock = (index, updates) => {
    onChange(prev => {
      const newBlocks = [...prev];
      newBlocks[index] = { ...newBlocks[index], ...updates };
      return newBlocks;
    });

    // Limpiar previsualización local si se borra el contenido de imagen
    if (updates.content === '') {
      setLocalPreviews(prev => {
        const next = { ...prev };
        delete next[index];
        return next;
      });
    }
  };

  const handleFileChange = async (index, e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Immediate local preview (Logic from Evidence/Clogger)
    const localUrl = URL.createObjectURL(file);
    const blockId = blocks[index]?.id;
    setLocalPreviews(prev => ({ ...prev, [blockId]: localUrl }));

    setUploading(index);
    try {
      // 2. Upload to Supabase and get permanent URL
      const publicUrl = await onUploadImage(file);
      handleUpdateBlock(index, { content: publicUrl });
    } catch (error) {
      alert("Error al subir la imagen");
      handleUpdateBlock(index, { content: '' }); // Revert on error
      setLocalPreviews(prev => {
        const next = { ...prev };
        delete next[blockId];
        return next;
      });
    } finally {
      setUploading(null);
      // Wait a bit before clearing local preview to ensure DOM update
      // Now that the src prioritizes permanent URLs, this is safe
      setTimeout(() => {
        setLocalPreviews(prev => {
          const next = { ...prev };
          const urlToRemove = next[blockId];
          delete next[blockId];
          if (typeof urlToRemove === 'string' && urlToRemove.startsWith('blob:')) {
            URL.revokeObjectURL(urlToRemove);
          }
          return next;
        });
      }, 1000);
    }
  };

  const [uploadingFont, setUploadingFont] = React.useState(false);
  const handleUploadFont = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fontName = prompt("Introduce un nombre para esta fuente:");
    if (!fontName) {
      e.target.value = ''; // reset
      return;
    }

    setUploadingFont(true);
    try {
      const url = await onUploadImage(file);
      addCustomFont(fontName, url);
      alert(`Fuente "${fontName}" instalada correctamente para todo el sitio.`);
    } catch (err) {
      console.error(err);
      alert("Error al subir la fuente.");
    } finally {
      e.target.value = ''; // reset
      setUploadingFont(false);
    }
  };

  const getWidthPercent = (widthVal) => {
    if (!widthVal) return '100%';
    const val = widthVal.toString().trim();
    
    // Si ya trae el porcentaje (ej. "50%")
    if (val.includes('%')) return val;
    
    // Si es una fracción (ej. "2/3")
    if (val.includes('/')) {
      const [num, den] = val.split('/');
      const n = parseFloat(num);
      const d = parseFloat(den);
      if (!isNaN(n) && !isNaN(d) && d !== 0) {
        return `${(n / d) * 100}%`;
      }
    }
    
    // Si es un número simple (ej. "2" -> 50%, "3" -> 33.33%)
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      return `${100 / num}%`;
    }
    
    return '100%';
  };

  const STANDARD_FONTS = [
    "", "Arial", "Times New Roman", "Courier New", "Helvetica", 
    "Georgia", "Verdana", "Trebuchet MS", "Impact", "Comic Sans MS"
  ];
  const [siteFonts, setSiteFonts] = React.useState(() => getCustomFonts().map(f => f.name));
  React.useEffect(() => {
    const handleUpdate = () => setSiteFonts(getCustomFonts().map(f => f.name));
    window.addEventListener('custom-fonts-updated', handleUpdate);
    return () => window.removeEventListener('custom-fonts-updated', handleUpdate);
  }, []);
  const allFonts = [...new Set([...STANDARD_FONTS, ...siteFonts])];

  // ---------------- VIEW MODE (RENDER ALWAYS WITH RICH FEATURES) ----------------
  if (!isEditing) {
    return (
      <div className="flex flex-wrap -mx-4">
        {blocks.map((block, index) => {
          if (block.type === 'image' && !block.content) return null;
          
          if (block.type === 'page-break') {
            return (
              <div key={block.id || index} className="w-full print:block" style={{ breakAfter: 'page', pageBreakAfter: 'always', height: 0 }}></div>
            );
          }

          if (block.type === 'custom-font') {
            if (!block.content || !block.caption) return null;
            return (
              <style key={block.id || index}>
                {`@font-face { font-family: '${block.caption}'; src: url('${block.content}'); }`}
              </style>
            );
          }

          if (block.type === 'spacer') {
            return (
              <div key={block.id || index} className="w-full" style={{ height: block.content || '50px' }}></div>
            );
          }

          return (
            <div 
              key={block.id || index} 
              className="animate-in fade-in slide-in-from-bottom-4 duration-700 px-4" 
              style={{ 
                width: getWidthPercent(block.width),
                marginTop: block.margin || undefined,
                marginBottom: block.margin || '2.5rem'
              }}
            >
              <div style={{ padding: block.padding || undefined }} className={`h-full print:h-auto print:border-none ${hideGuidelines ? '' : 'border border-dotted border-[#1c1c19]/10 rounded-sm'}`}>
                {block.type === 'text' ? (
                  <MarkdownEditor value={block.content} isEditing={false} fontSize={fontSize} customFont={block.caption || ''} textAlign={block.align || 'justify'} />
                ) : (
                  <div className="relative group h-full">
                    <div className="absolute -inset-6 bg-[#0f4369]/3 opacity-0 group-hover:opacity-100 transition-opacity -z-10 border-x-2 border-[#1c1c19]/5"></div>
                    <div className={`flex flex-col h-full justify-center w-full ${block.align === 'left' ? 'items-start' : block.align === 'right' ? 'items-end' : 'items-center'}`}>
                      <img 
                        src={block.content} 
                        alt="" 
                        className="object-contain border-2 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(28,28,25,0.05)] transition-all duration-500 hover:shadow-[20px_20px_0_0_rgba(28,28,25,0.08)]" 
                        style={{ 
                          height: block.imageHeight || 'auto',
                          width: block.imageWidth || 'auto',
                          maxHeight: block.imageHeight ? 'none' : '1200px',
                          maxWidth: '100%'
                        }}
                        onError={(e) => e.target.style.display = 'none'}
                      />
                      <div className="mt-4 flex items-center gap-2">
                         <div className="h-[1px] w-8 bg-[#1c1c19]/20"></div>
                         <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1c1c19]/40">
                           {block.caption || `REF_IMG_${index + 1}`}
                         </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // ---------------- CLASSIC EDIT MODE ----------------
  if (!useNewEditor) {
    return (
      <div className="space-y-6">
        {!props.hideModeSelector && (
          <div className="p-4 bg-amber-50 border-2 border-amber-500 flex justify-between items-center shadow-[4px_4px_0_0_rgba(245,158,11,1)]">
            <div className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-widest text-amber-800">Editor de Texto Clásico</span>
              <span className="text-[9px] text-amber-700/90 uppercase font-bold mt-1">Este documento usa el editor estándar de Review. Puedes convertirlo al editor avanzado markdown WYSIWYG.</span>
            </div>
            <button
              onClick={() => {
                setUseNewEditor(true);
                localStorage.setItem('global_use_new_editor', 'true');
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-widest text-[10px] shadow-[2px_2px_0_0_rgba(0,0,0,0.2)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              ✨ Convertir a Nuevo Editor
            </button>
          </div>
        )}
        <ContentBlockEditorClassic {...props} />
      </div>
    );
  }

  // ---------------- NEW ADVANCED EDIT MODE ----------------
  return (
    <div className="space-y-6">
      {!props.hideModeSelector && (
        <div className="p-4 bg-emerald-50 border-2 border-emerald-800 flex justify-between items-center shadow-[4px_4px_0_0_rgba(6,95,70,1)] flex-wrap gap-4">
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-800">🚀 Nuevo Editor de Bloques Activo</span>
            <span className="text-[9px] text-emerald-700/80 uppercase font-bold mt-1">Dispones de Tiptap WYSIWYG, layouts por columnas, espaciados y fuentes personalizadas.</span>
          </div>
          <button
            onClick={() => {
              if (window.confirm("¿Seguro que deseas volver al editor clásico? Los espaciados, layouts de columna y bloques avanzados podrían no mostrarse correctamente en la edición.")) {
                setUseNewEditor(false);
                localStorage.setItem('global_use_new_editor', 'false');
              }
            }}
            className="px-4 py-2 bg-white text-emerald-800 border-2 border-emerald-800 hover:bg-emerald-100 font-black uppercase tracking-widest text-[10px] transition-all"
          >
            Volver a Editor Clásico
          </button>
        </div>
      )}

      <div className="flex flex-wrap -mx-4 pb-12">
        {blocks.map((block, index) => (
          <div 
            key={block.id || index} 
            className="px-4 transition-all duration-300 mb-6" 
            style={{ 
              width: getWidthPercent(block.width),
              marginTop: block.margin || undefined,
              marginBottom: block.margin || undefined
            }}
          >
            <div 
              className={`relative group/block border-2 transition-all h-full flex flex-col ${selectedBlocks.includes(block.id) ? 'border-[#0f4369] bg-[#0f4369]/5 shadow-[4px_4px_0_0_rgba(15,67,105,0.2)]' : 'border-[#1c1c19]/10 bg-white/30 hover:bg-white/60'}`}
              style={{ padding: block.padding || '1.5rem' }}
            >
              {/* Block Controls */}
              <div className="absolute right-2 bottom-2 flex flex-row items-center gap-2 opacity-0 group-hover/block:opacity-100 transition-opacity z-20">
                
                <div className="flex items-center gap-1 bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)] p-1 text-[#1c1c19]">
                  <LayoutTemplate size={12} strokeWidth={3} className="ml-1" />
                  <input
                    type="text"
                    value={block.width !== undefined ? block.width : '1'}
                    onChange={(e) => {
                      handleUpdateBlock(index, { width: e.target.value });
                    }}
                    placeholder="ej. 2/3"
                    title="Ancho: '1' (100%), '2' (50%), '2/3' (66.6%), o '80%'"
                    className="w-12 text-center bg-transparent text-xs font-black outline-none placeholder-[#1c1c19]/30"
                  />
                </div>

                <div className="flex items-center gap-1 bg-emerald-100 border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)] p-1 text-emerald-800">
                  <button 
                    onClick={() => handleAddBlock('text', index + 1, block.width)}
                    className="p-1 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-0.5 rounded-sm"
                    title="Añadir texto después"
                  >
                    <Plus size={10} strokeWidth={4} />
                    <FileText size={12} />
                  </button>
                  <div className="w-px h-3 bg-emerald-800/30" />
                  <button 
                    onClick={() => handleAddBlock('image', index + 1, block.width)}
                    className="p-1 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-0.5 rounded-sm"
                    title="Añadir imagen después"
                  >
                    <Plus size={10} strokeWidth={4} />
                    <ImageIcon size={12} />
                  </button>
                  <div className="w-px h-3 bg-emerald-800/30" />
                  <button 
                    onClick={() => handleAddBlock('page-break', index + 1, '1')}
                    className="p-1 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-0.5 rounded-sm"
                    title="Añadir salto de página después"
                  >
                    <Plus size={10} strokeWidth={4} />
                    <Scissors size={12} />
                  </button>
                  <div className="w-px h-3 bg-emerald-800/30" />
                  <button 
                    onClick={() => handleAddBlock('spacer', index + 1, '1')}
                    className="p-1 hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-0.5 rounded-sm"
                    title="Añadir espaciador después"
                  >
                    <Plus size={10} strokeWidth={4} />
                    <ArrowDownUp size={12} />
                  </button>
                </div>

                <button 
                  onClick={() => handleMoveBlock(index, -1)} 
                  disabled={index === 0}
                  className="p-1.5 bg-[#e5e2dd] border-2 border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white disabled:opacity-20 transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none"
                >
                  <ArrowUp size={12} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => handleMoveBlock(index, 1)} 
                  disabled={index === blocks.length - 1}
                  className="p-1.5 bg-[#e5e2dd] border-2 border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white disabled:opacity-20 transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none"
                >
                  <ArrowDown size={12} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => handleRemoveBlock(index)}
                  className="p-1.5 bg-red-100 border-2 border-[#1c1c19] text-red-700 hover:bg-red-600 hover:text-white transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none"
                >
                  <Trash2 size={12} strokeWidth={3} />
                </button>
              </div>

              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => {
                      setSelectedBlocks(prev => 
                        prev.includes(block.id) ? prev.filter(id => id !== block.id) : [...prev, block.id]
                      );
                    }}
                    className={`w-6 h-6 flex items-center justify-center font-black text-[10px] shrink-0 border-2 transition-all ${selectedBlocks.includes(block.id) ? 'bg-[#0f4369] text-white border-[#0f4369] shadow-[2px_2px_0_0_rgba(15,67,105,1)] translate-x-[-2px] translate-y-[-2px]' : 'bg-[#1c1c19] text-white border-[#1c1c19] hover:bg-[#e5e2dd] hover:text-[#1c1c19]'}`}
                    title={selectedBlocks.includes(block.id) ? "Deseleccionar" : "Seleccionar"}
                  >
                    {selectedBlocks.includes(block.id) ? <CheckSquare size={12} strokeWidth={3} /> : index + 1}
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">
                    {block.type === 'text' ? 'TEXT_BLOCK_MD' : block.type === 'image' ? 'IMAGE_BLOCK_URL' : block.type === 'page-break' ? 'PAGE_BREAK' : block.type === 'spacer' ? 'SPACER' : 'CUSTOM_FONT'}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 border-l border-[#1c1c19]/20 pl-4">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#72777f]" title="Espaciado interno">Pad:</span>
                    <input
                      type="text"
                      placeholder="ej. 2rem"
                      value={block.padding || ''}
                      onChange={(e) => handleUpdateBlock(index, { padding: e.target.value })}
                      className="w-16 text-[10px] p-1 border-b-2 border-[#1c1c19]/20 bg-transparent outline-none focus:border-[#1c1c19] font-mono text-center placeholder-[#1c1c19]/30"
                    />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#72777f] ml-2" title="Espaciado externo vertical">Mar:</span>
                    <input
                      type="text"
                      placeholder="ej. 10px"
                      value={block.margin || ''}
                      onChange={(e) => handleUpdateBlock(index, { margin: e.target.value })}
                      className="w-16 text-[10px] p-1 border-b-2 border-[#1c1c19]/20 bg-transparent outline-none focus:border-[#1c1c19] font-mono text-center placeholder-[#1c1c19]/30"
                    />
                    <span className="text-[9px] font-bold uppercase tracking-widest text-[#72777f] ml-2" title="Alineación">Alineación:</span>
                    <select
                      value={block.align || 'justify'}
                      onChange={(e) => handleUpdateBlock(index, { align: e.target.value })}
                      className="w-16 text-[10px] p-1 border-b-2 border-[#1c1c19]/20 bg-transparent outline-none focus:border-[#1c1c19] font-mono text-center"
                    >
                      <option value="left">Izq</option>
                      <option value="center">Centro</option>
                      <option value="right">Der</option>
                      <option value="justify">Justif</option>
                    </select>
                  </div>

                  {block.type === 'image' && (
                    <div className="flex items-center gap-2 border-l border-[#1c1c19]/20 pl-4">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#72777f]">Ancho:</span>
                      <input
                        type="text"
                        placeholder="auto, 100%"
                        value={block.imageWidth || ''}
                        onChange={(e) => handleUpdateBlock(index, { imageWidth: e.target.value })}
                        className="w-16 text-[10px] p-1 border-b-2 border-[#1c1c19]/20 bg-transparent outline-none focus:border-[#1c1c19] font-mono text-center placeholder-[#1c1c19]/30"
                      />
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#72777f] ml-2">Alto:</span>
                      <input
                        type="text"
                        placeholder="auto, 500px"
                        value={block.imageHeight || ''}
                        onChange={(e) => handleUpdateBlock(index, { imageHeight: e.target.value })}
                        className="w-16 text-[10px] p-1 border-b-2 border-[#1c1c19]/20 bg-transparent outline-none focus:border-[#1c1c19] font-mono text-center placeholder-[#1c1c19]/30"
                      />
                    </div>
                  )}
                </div>
              </div>

              {block.type === 'text' ? (
                <div className="flex-1 flex flex-col gap-4">
                  <div className="flex items-center gap-2 border-b-2 border-dashed border-[#1c1c19]/10 pb-4">
                    <span className="text-[9px] font-black uppercase tracking-widest text-[#72777f]">FUENTE:</span>
                    <select
                      value={block.caption || ''}
                      onChange={(e) => handleUpdateBlock(index, { caption: e.target.value })}
                      className="flex-1 text-sm p-2 border-2 border-[#1c1c19]/20 bg-white outline-none focus:border-[#1c1c19] font-sans"
                      title="Selecciona una fuente"
                    >
                      {allFonts.map(f => (
                        <option key={f} value={f}>{f || "Por defecto"}</option>
                      ))}
                    </select>
                    <label
                      className={`bg-[#1c1c19] text-white px-3 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-[#0f4369] transition-all whitespace-nowrap flex items-center gap-1 shadow-[2px_2px_0_0_rgba(28,28,25,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none ${uploadingFont ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                      title="Cargar archivo de fuente"
                    >
                      {uploadingFont ? <Loader2 size={14} className="animate-spin" /> : <Type size={14} />}
                      <span className="hidden sm:inline">{uploadingFont ? 'SUBIENDO...' : 'SUBIR FUENTE'}</span>
                      <input type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleUploadFont} disabled={uploadingFont} />
                    </label>
                  </div>
                  <MarkdownEditor 
                    value={block.content} 
                    onChange={(val) => handleUpdateBlock(index, { content: val })} 
                    isEditing={true} 
                    height="300px"
                    customFont={block.caption || ''}
                    textAlign={block.align || 'justify'}
                  />
                </div>
              ) : block.type === 'page-break' ? (
                <div className="flex-1 flex items-center justify-center py-8 opacity-50 select-none">
                  <div className="h-0 border-t-2 border-dashed border-[#1c1c19] w-full relative flex items-center justify-center">
                    <div className="bg-[#fcf9f4] px-4 flex items-center gap-2 text-[#1c1c19] font-black uppercase tracking-widest text-[10px]">
                      <Scissors size={14} />
                      <span>SALTO DE PÁGINA (PAGE BREAK)</span>
                    </div>
                  </div>
                </div>
              ) : block.type === 'spacer' ? (
                <div className="flex-1 flex flex-col items-center justify-center py-4 gap-2">
                  <div className="flex items-center justify-center w-full min-h-[50px] border-2 border-dashed border-[#1c1c19]/30 bg-[#1c1c19]/5 transition-all" style={{ height: block.content || '50px' }}>
                    <div className="bg-white border-2 border-[#1c1c19] p-2 flex items-center gap-2 shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                      <ArrowDownUp size={14} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#1c1c19]">ALTURA:</span>
                      <input
                        type="text"
                        value={block.content || '50px'}
                        onChange={(e) => handleUpdateBlock(index, { content: e.target.value })}
                        placeholder="ej. 50px, 2rem"
                        className="w-20 text-[10px] p-1 border-b-2 border-[#1c1c19]/20 bg-transparent outline-none focus:border-[#1c1c19] font-mono text-center"
                      />
                    </div>
                  </div>
                </div>
              ) : block.type === 'custom-font' ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-[#72777f] border-4 border-dashed border-[#1c1c19]/10 bg-[#f6f3ee]/30 text-xs text-center font-bold">
                   ESTE BLOQUE DE FUENTE QUEDÓ OBSOLETO. LA FUENTE SE ADMINISTRA AHORA DESDE EL SELECTOR DE FUENTES. PUEDES ELIMINAR ESTE BLOQUE CON EL BOTÓN ROJO DE LA DERECHA.
                </div>
              ) : (
                <div className="flex flex-col gap-6 flex-1 min-h-[300px] justify-center">
                  {block.content || localPreviews[block.id] ? (
                    <div className="relative group/img-preview h-full flex flex-col justify-center">
                      <div className="absolute inset-0 bg-[#0f4369]/5 opacity-0 group-hover/img-preview:opacity-100 transition-opacity pointer-events-none -z-10"></div>
                      <div className={`flex w-full overflow-hidden items-center ${block.align === 'left' ? 'justify-start' : block.align === 'right' ? 'justify-end' : 'justify-center'}`}>
                        <img 
                          src={(typeof block.content === 'string' && !block.content.startsWith('blob:')) ? block.content : (localPreviews[block.id] || '')} 
                          alt="" 
                          className="object-contain border-2 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,0.05)] transition-all duration-300" 
                          style={{ 
                            height: block.imageHeight || 'auto',
                            width: block.imageWidth || 'auto',
                            maxHeight: block.imageHeight ? 'none' : '500px',
                            maxWidth: '100%'
                          }}
                        />
                      </div>
                      <button 
                        onClick={() => handleUpdateBlock(index, { content: '' })}
                        className="absolute top-4 right-4 p-2 bg-white border-2 border-[#1c1c19] text-[#1c1c19] hover:bg-red-600 hover:text-white transition-all shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none"
                        title="Remove Image"
                      >
                        <X size={16} strokeWidth={3} />
                      </button>
                    </div>
                  ) : (
                    <label className="relative border-4 border-dashed border-[#1c1c19]/10 p-8 md:p-16 flex flex-col items-center justify-center h-full gap-6 cursor-pointer hover:bg-[#f6f3ee] hover:border-[#1c1c19]/30 transition-all group overflow-hidden bg-white/50">
                      {uploading === index ? (
                        <div className="flex flex-col items-center gap-4">
                          <Loader2 size={48} className="animate-spin text-[#0f4369]" />
                          <div className="text-center">
                            <p className="text-xs font-black uppercase tracking-[0.3em] text-[#0f4369] animate-pulse">UPLOADING_TO_SUPABASE...</p>
                            <p className="text-[9px] font-bold text-[#72777f] mt-1 italic">ENCRYPTING_DATA_STREAM</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-dashed border-[#1c1c19]/20 flex items-center justify-center bg-white group-hover:scale-110 group-hover:border-[#1c1c19] transition-all duration-500">
                            <ImageIcon size={24} className="text-[#1c1c19]/20 group-hover:text-[#1c1c19] transition-colors" />
                          </div>
                          <div className="flex flex-col items-center text-center">
                            <span className="text-xs md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[#1c1c19]">SELECT_IMAGE</span>
                            <span className="text-[8px] md:text-[9px] font-bold text-[#72777f] uppercase mt-2 tracking-widest border-t border-[#1c1c19]/10 pt-2 px-2 text-center break-words max-w-[200px]">
                              PNG, JPG, WEBP // MAX_10MB
                            </span>
                          </div>
                        </>
                      )}
                      <input 
                        type="file" 
                        className="hidden" 
                        accept="image/*" 
                        onChange={(e) => handleFileChange(index, e)} 
                        disabled={uploading !== null}
                      />
                    </label>
                  )}
                  
                  {/* Caption input field */}
                  <div className="mt-4 flex flex-col gap-1 border-t-2 border-dashed border-[#1c1c19]/10 pt-4">
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#72777f]">PIE DE PÁGINA (CAPTION)</label>
                    <input
                      type="text"
                      value={block.caption || ''}
                      onChange={(e) => handleUpdateBlock(index, { caption: e.target.value })}
                      placeholder={`ej. REF_IMG_${index + 1}`}
                      className="w-full text-sm p-2 border-2 border-[#1c1c19]/20 bg-white outline-none focus:border-[#1c1c19] font-sans"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Add Block Buttons - Full Width */}
        <div className="w-full flex justify-center gap-4 md:gap-6 pt-8 mt-12 border-t-2 border-dashed border-[#1c1c19]/10 mx-4 flex-wrap">
          <button
            onClick={() => handleAddBlock('text')}
            className="px-6 md:px-8 py-3 md:py-4 bg-white border-2 border-[#1c1c19] flex items-center gap-3 hover:bg-[#e5e2dd] transition-all shadow-[6px_6px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 group"
          >
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-[#1c1c19] flex items-center justify-center bg-[#fcf9f4] group-hover:bg-[#1c1c19] group-hover:text-white transition-all">
              <FileText size={12} md:size={14} />
            </div>
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">ADD_TEXT_BLOCK</span>
          </button>

          <button
            onClick={() => handleAddBlock('image')}
            className="px-6 md:px-8 py-3 md:py-4 bg-white border-2 border-[#1c1c19] flex items-center gap-3 hover:bg-[#e5e2dd] transition-all shadow-[6px_6px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 group"
          >
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-[#1c1c19] flex items-center justify-center bg-[#fcf9f4] group-hover:bg-[#1c1c19] group-hover:text-white transition-all">
              <ImageIcon size={12} md:size={14} />
            </div>
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">ADD_IMAGE_BLOCK</span>
          </button>

          <button
            onClick={() => handleAddBlock('page-break')}
            className="px-6 md:px-8 py-3 md:py-4 bg-white border-2 border-[#1c1c19] flex items-center gap-3 hover:bg-[#e5e2dd] transition-all shadow-[6px_6px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 group"
          >
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-[#1c1c19] flex items-center justify-center bg-[#fcf9f4] group-hover:bg-[#1c1c19] group-hover:text-white transition-all">
              <Scissors size={12} md:size={14} />
            </div>
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">ADD_PAGE_BREAK</span>
          </button>

          <button
            onClick={() => handleAddBlock('spacer')}
            className="px-6 md:px-8 py-3 md:py-4 bg-white border-2 border-[#1c1c19] flex items-center gap-3 hover:bg-[#e5e2dd] transition-all shadow-[6px_6px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 group"
          >
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-[#1c1c19] flex items-center justify-center bg-[#fcf9f4] group-hover:bg-[#1c1c19] group-hover:text-white transition-all">
              <ArrowDownUp size={12} md:size={14} />
            </div>
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">ADD_SPACER</span>
          </button>

          <button
            onClick={() => handleAddBlock('custom-font')}
            className="px-6 md:px-8 py-3 md:py-4 bg-white border-2 border-[#1c1c19] flex items-center gap-3 hover:bg-[#e5e2dd] transition-all shadow-[6px_6px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 group"
          >
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-[#1c1c19] flex items-center justify-center bg-[#fcf9f4] group-hover:bg-[#1c1c19] group-hover:text-white transition-all">
              <Type size={12} md:size={14} />
            </div>
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest">ADD_FONT</span>
          </button>

          <button
            onClick={() => setShowAppendModal(true)}
            className="px-6 md:px-8 py-3 md:py-4 bg-purple-50 border-2 border-purple-900 text-purple-900 flex items-center gap-3 hover:bg-purple-100 transition-all shadow-[6px_6px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 group"
          >
            <div className="w-6 h-6 md:w-8 md:h-8 rounded-full border-2 border-purple-900 flex items-center justify-center bg-white group-hover:bg-purple-900 group-hover:text-white transition-all">
              <Bot size={12} md:size={14} />
            </div>
            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-purple-900">BLOQUES DESDE JSON</span>
          </button>
        </div>
        
        {/* Floating Selection Bar */}
        {selectedBlocks.length > 0 && isEditing && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom-8">
            <div className="bg-[#1c1c19] text-white border-2 border-[#1c1c19] p-3 flex items-center gap-4 shadow-[8px_8px_0_0_rgba(28,28,25,1)]">
              <div className="flex items-center gap-2">
                <CheckSquare size={16} className="text-[#ffe8a1]" />
                <span className="text-xs font-black uppercase tracking-widest">{selectedBlocks.length} BLOQUES SELECCIONADOS</span>
              </div>
              <div className="w-px h-6 bg-white/20 mx-1"></div>
              <button 
                onClick={() => setSelectedBlocks([])}
                className="bg-white hover:bg-[#e5e2dd] text-[#1c1c19] border-2 border-white hover:border-[#1c1c19] font-black uppercase text-[10px] tracking-widest px-3 py-1.5 transition-all flex items-center gap-1.5"
              >
                <ListX size={14} strokeWidth={3} />
                LIMPIAR
              </button>
            </div>
          </div>
        )}

        {showAppendModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white border-2 border-purple-900 p-8 shadow-[16px_16px_0_0_rgba(88,28,135,1)] max-w-2xl w-full mx-4">
              <div className="flex justify-between items-center mb-6 border-b-2 border-purple-900 pb-4">
                <h3 className="font-black text-xl uppercase italic flex items-center gap-2 text-purple-900">
                  <Bot size={20} />
                  <span>AÑADIR BLOQUES DESDE IA</span>
                </h3>
                <button onClick={() => setShowAppendModal(false)} className="text-gray-500 hover:text-black">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-purple-900/70 tracking-widest mb-2 block">
                    Pega el JSON devuelto por la IA para añadir al final
                  </label>
                  <textarea
                    value={appendJsonText}
                    onChange={(e) => setAppendJsonText(e.target.value)}
                    placeholder='[ { "type": "text", "content": "..." } ]'
                    className="border-2 border-purple-900 font-mono text-xs bg-purple-50 w-full p-3 shadow-[4px_4px_0_0_rgba(88,28,135,1)] outline-none min-h-[200px]"
                  />
                </div>
                <div className="pt-4 flex gap-4 justify-end">
                  <button 
                    onClick={() => setShowAppendModal(false)} 
                    className="bg-white hover:bg-purple-100 text-purple-900 border-2 border-purple-900 font-black uppercase tracking-widest text-[10px] px-6 py-3 shadow-[4px_4px_0_0_rgba(88,28,135,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={() => {
                      if (!appendJsonText.trim()) return;
                      try {
                        let jsonString = appendJsonText.trim();
                        if (jsonString.startsWith("\`\`\`json")) {
                          jsonString = jsonString.replace(/^\`\`\`json/m, "");
                          if (jsonString.endsWith("\`\`\`")) jsonString = jsonString.slice(0, -3);
                        } else if (jsonString.startsWith("\`\`\`")) {
                          jsonString = jsonString.replace(/^\`\`\`/m, "");
                          if (jsonString.endsWith("\`\`\`")) jsonString = jsonString.slice(0, -3);
                        }
                        
                        const parsedBlocks = JSON.parse(jsonString.trim());
                        if (Array.isArray(parsedBlocks)) {
                          const newBlocks = parsedBlocks.map(b => {
                            let type = b.type || 'text';
                            let content = b.content || '';
                            if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(type)) {
                              const prefix = '#'.repeat(parseInt(type[1])) + ' ';
                              content = prefix + content;
                              type = 'text';
                            } else if (['paragraph', 'title', 'subtitle', 'header'].includes(type)) {
                              type = 'text';
                            } else if (type === 'divider') {
                              type = 'spacer';
                            } else if (!['text', 'image', 'page-break', 'spacer', 'custom-font'].includes(type)) {
                              type = 'text';
                            }
                            return {
                              ...b,
                              type,
                              content,
                              id: b.id || `block-${Date.now()}-${Math.random()}`
                            };
                          });
                          onChange(prev => [...prev, ...newBlocks]);
                          setShowAppendModal(false);
                          setAppendJsonText("");
                        } else {
                          alert("El JSON no es un array válido de bloques.");
                        }
                      } catch (e) {
                        alert("Error parseando JSON.");
                      }
                    }} 
                    className="bg-purple-600 hover:bg-purple-700 text-white border-2 border-purple-900 font-black uppercase tracking-widest text-[10px] px-6 py-3 shadow-[4px_4px_0_0_rgba(88,28,135,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                  >
                    Añadir Bloques
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContentBlockEditor;
