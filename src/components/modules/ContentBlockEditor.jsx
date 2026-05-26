import React, { useState } from 'react';
import { Trash2, ArrowUp, ArrowDown, Image as ImageIcon, FileText, Plus, Loader2, X } from 'lucide-react';
import MarkdownEditor from '../ui/MarkdownEditor';

const ContentBlockEditor = ({ blocks = [], onChange, onUploadImage, isEditing = false, fontSize = 12 }) => {
  const [uploading, setUploading] = useState(null); // index of block being uploaded
  const [localPreviews, setLocalPreviews] = useState({}); // { index: localUrl }

  // Cleanup local URLs on unmount
  React.useEffect(() => {
    return () => {
      Object.values(localPreviews).forEach(url => {
        if (url.startsWith('blob:')) URL.revokeObjectURL(url);
      });
    };
  }, [localPreviews]);

  const handleAddBlock = (type) => {
    const newBlock = {
      type,
      content: type === 'text' ? '' : '',
      id: `temp-${Date.now()}`
    };
    onChange(prev => [...prev, newBlock]);
  };

  const handleRemoveBlock = (index) => {
    onChange(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveBlock = (index, direction) => {
    if (index + direction < 0 || index + direction >= blocks.length) return;
    onChange(prev => {
      const newBlocks = [...prev];
      const [movedBlock] = newBlocks.splice(index, 1);
      newBlocks.splice(index + direction, 0, movedBlock);
      return newBlocks;
    });
  };

  const handleUpdateBlock = (index, content) => {
    onChange(prev => {
      const newBlocks = [...prev];
      newBlocks[index] = { ...newBlocks[index], content };
      return newBlocks;
    });

    // Limpiar previsualización local si se borra el contenido
    if (!content) {
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
    handleUpdateBlock(index, localUrl);

    setUploading(index);
    try {
      // 2. Upload to Supabase and get permanent URL
      const publicUrl = await onUploadImage(file);
      handleUpdateBlock(index, publicUrl);
    } catch (error) {
      alert("Error al subir la imagen");
      handleUpdateBlock(index, ''); // Revert on error
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
          if (urlToRemove && urlToRemove.startsWith('blob:')) {
            URL.revokeObjectURL(urlToRemove);
          }
          return next;
        });
      }, 1000);
    }
  };

  if (!isEditing) {
    return (
      <div className="space-y-12">
        {blocks.map((block, index) => {
          if (block.type === 'image' && !block.content) return null;
          
          return (
            <div key={block.id || index} className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {block.type === 'text' ? (
                <MarkdownEditor value={block.content} isEditing={false} fontSize={fontSize} />
              ) : (
                <div className="relative group">
                  <div className="absolute -inset-6 bg-[#0f4369]/3 opacity-0 group-hover:opacity-100 transition-opacity -z-10 border-x-2 border-[#1c1c19]/5"></div>
                  <div className="flex flex-col items-center">
                    <img 
                      src={block.content} 
                      alt="" 
                      className="w-full max-h-[1200px] object-contain border-2 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(28,28,25,0.05)] transition-all duration-500 hover:shadow-[20px_20px_0_0_rgba(28,28,25,0.08)]" 
                      onError={(e) => e.target.style.display = 'none'}
                    />
                    <div className="mt-4 self-end flex items-center gap-2">
                       <div className="h-[1px] w-8 bg-[#1c1c19]/20"></div>
                       <span className="text-[9px] font-black uppercase tracking-[0.4em] text-[#1c1c19]/40">
                         REF_IMG_{index + 1}
                       </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {blocks.map((block, index) => (
        <div key={block.id || index} className="relative group/block border-2 border-[#1c1c19]/10 p-6 bg-white/30 hover:bg-white/60 transition-all">
          {/* Block Controls */}
          <div className="absolute -right-3 -top-3 flex flex-col gap-1 opacity-0 group-hover/block:opacity-100 transition-opacity z-20">
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

          <div className="flex items-center gap-3 mb-4">
            <div className="w-6 h-6 bg-[#1c1c19] text-white flex items-center justify-center font-black text-[10px]">
              {index + 1}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">
              {block.type === 'text' ? 'TEXT_BLOCK_MD' : 'IMAGE_BLOCK_URL'}
            </span>
          </div>

          {block.type === 'text' ? (
            <MarkdownEditor 
              value={block.content} 
              onChange={(val) => handleUpdateBlock(index, val)} 
              isEditing={true} 
              height="300px"
            />
          ) : (
            <div className="flex flex-col gap-6">
              {block.content || localPreviews[block.id] ? (
                <div className="relative group/img-preview">
                  <div className="absolute inset-0 bg-[#0f4369]/5 opacity-0 group-hover/img-preview:opacity-100 transition-opacity pointer-events-none -z-10"></div>
                  <img 
                    src={(block.content && !block.content.startsWith('blob:')) ? block.content : (localPreviews[block.id] || block.content)} 
                    alt="" 
                    className="w-full max-h-[500px] object-contain border-2 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,0.05)]" 
                  />
                  <button 
                    onClick={() => handleUpdateBlock(index, '')}
                    className="absolute top-4 right-4 p-2 bg-white border-2 border-[#1c1c19] text-[#1c1c19] hover:bg-red-600 hover:text-white transition-all shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none"
                    title="Remove Image"
                  >
                    <X size={16} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <label className="relative border-4 border-dashed border-[#1c1c19]/10 p-16 flex flex-col items-center gap-6 cursor-pointer hover:bg-[#f6f3ee] hover:border-[#1c1c19]/30 transition-all group overflow-hidden bg-white/50">
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
                      <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#1c1c19]/20 flex items-center justify-center bg-white group-hover:scale-110 group-hover:border-[#1c1c19] transition-all duration-500">
                        <ImageIcon size={32} className="text-[#1c1c19]/20 group-hover:text-[#1c1c19] transition-colors" />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-black uppercase tracking-[0.4em] text-[#1c1c19]">SELECT_IMAGE_FILE</span>
                        <span className="text-[9px] font-bold text-[#72777f] uppercase mt-2 tracking-widest border-t border-[#1c1c19]/10 pt-2 px-4 text-center">
                          PNG, JPG, WEBP // MIN_WIDTH_1200PX // MAX_10MB
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
            </div>
          )}
        </div>
      ))}

      {/* Add Block Buttons */}
      <div className="flex justify-center gap-6 py-12 border-t-2 border-dashed border-[#1c1c19]/10">
        <button
          onClick={() => handleAddBlock('text')}
          className="px-8 py-4 bg-white border-2 border-[#1c1c19] flex items-center gap-3 hover:bg-[#e5e2dd] transition-all shadow-[6px_6px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 group"
        >
          <div className="w-8 h-8 rounded-full border-2 border-[#1c1c19] flex items-center justify-center bg-[#fcf9f4] group-hover:bg-[#1c1c19] group-hover:text-white transition-all">
            <FileText size={14} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest">ADD_TEXT_BLOCK</span>
        </button>

        <button
          onClick={() => handleAddBlock('image')}
          className="px-8 py-4 bg-white border-2 border-[#1c1c19] flex items-center gap-3 hover:bg-[#e5e2dd] transition-all shadow-[6px_6px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 group"
        >
          <div className="w-8 h-8 rounded-full border-2 border-[#1c1c19] flex items-center justify-center bg-[#fcf9f4] group-hover:bg-[#1c1c19] group-hover:text-white transition-all">
            <ImageIcon size={14} />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest">ADD_IMAGE_BLOCK</span>
        </button>
      </div>
    </div>
  );
};

export default ContentBlockEditor;
