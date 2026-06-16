import React, { useState } from 'react';
import { Folder, File, FileText, ChevronRight, ChevronDown, ExternalLink, HardDrive, Copy } from 'lucide-react';
import { PROMPTS } from '../../config/aiPrompts';

const FolderNode = ({ node, level = 0, currentPath = [], isStatic = false }) => {
  const [isOpen, setIsOpen] = useState(isStatic ? true : level < 2);
  const [isCopied, setIsCopied] = useState(false);
  const newPath = [...currentPath, node.name];
  const children = node.children || [];
  const isFolder = node.type?.toLowerCase() === 'folder' || children.length > 0;

  const handleCopyPrompt = (e) => {
    e.stopPropagation();
    const promptPath = newPath.join(' > ');
    const cleanNode = { ...node };
    delete cleanNode.children;

    const fullPrompt = PROMPTS.bimFolderExplorer(node.name, promptPath, cleanNode);

    navigator.clipboard.writeText(fullPrompt);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };
  
  const getIcon = () => {
    if (isFolder) return isOpen ? <ChevronDown size={14} className="text-gray-400" /> : <ChevronRight size={14} className="text-gray-400" />;
    if (node.type?.includes('.md')) return <FileText size={14} className="text-blue-400" />;
    if (node.type?.includes('.rvt')) return <HardDrive size={14} className="text-orange-500" />;
    return <File size={14} className="text-gray-300" />;
  };

  return (
    <div className="font-mono">
      <div 
        className="flex items-center gap-3 py-2 px-3 hover:bg-[#1c1c19]/5 cursor-pointer border-b border-transparent hover:border-[#1c1c19]/10 transition-all rounded-sm group" 
        onClick={() => !isStatic && setIsOpen(!isOpen)}
        style={{ paddingLeft: `${level * 20}px` }}
      >
        <span>{getIcon()}</span>
        <div className="flex items-center gap-2 overflow-hidden">
          {isFolder && <Folder size={18} className={`${isOpen ? 'text-[#0f4369]' : 'text-gray-400'} fill-current opacity-20`} />}
          <span className={`text-[11px] uppercase tracking-tight truncate ${isFolder ? 'font-black text-[#1c1c19]' : 'text-gray-600'}`}>
            {node.name}
          </span>
        </div>

        {/* AI COMMAND BUTTON */}
        {!isStatic && (
          <button
              onClick={handleCopyPrompt}
              className={`ml-2 px-1.5 py-0.5 rounded-[2px] text-[7px] font-black uppercase tracking-tighter transition-all border border-[#1c1c19]/10 shadow-[2px_2px_0_0_rgba(28,28,25,0.1)] ${isCopied ? 'bg-green-600 text-white translate-y-[1px] shadow-none' : 'bg-amber-400 text-[#1c1c19] hover:bg-amber-500 active:translate-y-[1px] active:shadow-none'}`}
              title="Copiar AI Command"
          >
              {isCopied ? 'COPIADO' : 'AI COMMAND'}
          </button>
        )}
        
        {node.url && (
            <a href={node.url} target="_blank" rel="noreferrer" className="ml-auto opacity-0 group-hover:opacity-100 p-1 hover:bg-[#0f4369] hover:text-white rounded transition-all">
                <ExternalLink size={12} />
            </a>
        )}
      </div>
      
      {isOpen && children.length > 0 && (
        <div className="border-l-[1px] border-[#1c1c19]/10 ml-5 my-1">
          {children.map((child, idx) => (
            <FolderNode key={child.id || idx} node={child} level={level + 1} currentPath={newPath} isStatic={isStatic} />
          ))}
        </div>
      )}
    </div>
  );
};

export default function BimFolderExplorer({ mapData, title, isStatic = false }) {
  if (!mapData) return (
    <div className="p-20 text-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <HardDrive size={48} className="text-gray-200" />
        <span className="font-mono text-[10px] uppercase text-gray-400 tracking-[5px]">Empty Structure</span>
      </div>
    </div>
  );

  return (
    <div className="bg-[#fcf9f4] border-2 border-[#1c1c19] h-full flex flex-col shadow-[12px_12px_0_0_rgba(28,28,25,1)]">
      <div className="bg-[#1c1c19] p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.6)]" />
            <h3 className="text-[#e5e2dd] font-black text-xs uppercase tracking-[3px]">{title || 'CDE STRUCTURE'}</h3>
        </div>
        <div className="flex items-center gap-4">
            <span className="text-[10px] font-mono text-white/40 hidden md:block">ISO 19650 SYNC: ACTIVE</span>
            <div className="px-2 py-1 bg-white/10 text-white text-[9px] font-mono uppercase tracking-tighter">Estructura Visual</div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white/30 backdrop-blur-sm">
        <FolderNode node={mapData} isStatic={isStatic} />
      </div>
      <div className="p-3 border-t border-[#1c1c19]/10 bg-white/50 text-[9px] font-mono text-gray-400 uppercase tracking-widest flex justify-between items-center">
        <span>© ARK DIGITAL TWIN ENGINE</span>
        <span>Latent Node Synchronization</span>
      </div>
    </div>
  );
}
