import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Search, Database, FileText, Plus, Trash2, Zap, ExternalLink, Users, Minimize2, Maximize, Wrench, Folder, Box, Copy, RefreshCw, Cloud, HardDrive, Layers, Link as LinkIcon, Book, Download, BookOpen, Tag } from 'lucide-react';

const MindMapNode = ({
  node,
  toggleTextExpand,
  toggleBranchExpand,
  onInspect,
  onAddSubNode,
  onImportSubNodes,
  onDeepToggleBranch,
  onToggleHighlight,
  onDeleteNode,
  onDragStart,
  isAdmin,
  isAdminView,
  dragHappened,
  links,
  navigate,
  isDragging,
  isSelected,
  isLocked,
  isEditing,
  onNameSave,
  onStartEdit,
  isCreatorMode,
  isHighlighterMode,
  onSetType,
  onSetCategory,
  onSetStorageMode,
  projectId
}) => {
  const [editName, setEditName] = useState(node.name);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [showStorageSelector, setShowStorageSelector] = useState(false);
  const [showCategorySelector, setShowCategorySelector] = useState(false);



  useEffect(() => {
    if (isEditing) setEditName(node.name);
  }, [isEditing, node.name]);

  const transitionClass = isDragging ? "duration-0" : "duration-500 ease-out";
  const selectionStyle = isSelected ? "ring-[4px] ring-[#0f4369] ring-offset-2 z-30" : "";
  let containerClasses = `absolute flex flex-col p-4 transition-all hover:z-20 border-[3px] shadow-[4px_4px_0_0_rgba(28,28,25,1)] select-none group/node ${transitionClass} ${selectionStyle} `;
  let titleClasses = "font-black tracking-tighter uppercase leading-tight pr-4 ";
  let descClasses = "font-mono leading-relaxed text-left overflow-hidden transition-all duration-300 pr-4 [display:-webkit-box] [-webkit-box-orient:vertical] ";

  if (node.isRoot) {
    containerClasses += "bg-[#0f4369] border-[#1c1c19] text-white shadow-[8px_8px_0_0_rgba(28,28,25,0.2)] p-5";
    titleClasses += "text-lg md:text-xl";
    descClasses += "text-[11px] text-white/80 uppercase tracking-widest";
  } else if (node.depth === 1) {
    containerClasses += "bg-[#1c1c19] border-[#1c1c19] text-[#fcf9f4] shadow-[6px_6px_0_0_rgba(15,67,105,1)] p-4";
    titleClasses += "text-sm";
    descClasses += "text-xs text-[#fcf9f4]/80";
  } else if (node.depth === 2) {
    containerClasses += "bg-[#f6f3ee] border-[#1c1c19] text-[#1c1c19] hover:bg-[#e5e2dd] p-3";
    titleClasses += "text-sm text-[#0f4369]";
    descClasses += "text-[11px] text-[#493f36]";
  } else {
    containerClasses += "bg-white border-dashed border-[#1c1c19]/60 text-[#1c1c19] hover:border-solid hover:border-[#0f4369] hover:bg-[#f6f3ee] p-3 shadow-sm";
    titleClasses += "text-xs text-[#1c1c19]";
    descClasses += "text-[10px] text-[#72777f]";
  }

  let highlightStyle = {};
  if (node.isHighlighted) {
    const hColor = node.highlightColor || '#fef08a';
    highlightStyle = {
      backgroundColor: hColor + '66', // 40% opacity approx
      borderColor: hColor,
      boxShadow: `0 0 15px ${hColor}4d`
    };
  }

  // Type Theme Coloring
  let typeIndicator = "";
  if (node.type === 'FOLDER') typeIndicator = "border-l-[6px] border-l-yellow-500";
  else if (node.type === 'TOOL') typeIndicator = "border-l-[6px] border-l-blue-500";
  else if (node.type === '.RVT') typeIndicator = "border-l-[6px] border-l-blue-600";
  else if (node.type === '.RTE') typeIndicator = "border-l-[6px] border-l-teal-600";
  else if (node.type === '.RFA') typeIndicator = "border-l-[6px] border-l-purple-600";
  else if (node.type === '.DWG') typeIndicator = "border-l-[6px] border-l-orange-500";
  else if (node.type === 'DOC') typeIndicator = "border-l-[6px] border-l-slate-700";
  else if (node.type === '.PDF') typeIndicator = "border-l-[6px] border-l-red-500";
  else if (node.type === '.DOC') typeIndicator = "border-l-[6px] border-l-blue-300";
  else if (node.type === '.MD') typeIndicator = "border-l-[6px] border-l-yellow-900";

  const isClickable = node.hasDescription;

  const allResourceIds = Array.from(new Set([
    ...(links?.resources || []),
    ...(node.recurso_id ? [node.recurso_id] : [])
  ]));

  return (
    <div
      className={`${containerClasses} ${isClickable ? 'cursor-pointer' : ''} ${typeIndicator}`}
      style={{
        left: node.x,
        top: node.y,
        width: node.width,
        minHeight: node.height,
        ...highlightStyle
      }}
      onMouseDown={(e) => onDragStart(e, node.id)}
      onClick={(e) => {
        if (dragHappened.current) return;
        if (isHighlighterMode) {
          e.stopPropagation();
          onToggleHighlight(node.id);
          return;
        }
        if (isClickable && !isLocked && !isCreatorMode) toggleTextExpand(node.id);
      }}
    >
      <div className="flex items-start justify-between gap-1 w-full relative">
        <div className="flex items-start gap-3 pt-0.5 flex-1">
          {/* LEFT COLUMN: TYPE AND STORAGE ICONS */}
          <div className="flex flex-col items-center gap-1.5 shrink-0 w-6">
            {/* TYPE SELECTOR */}
            <div className="relative w-6 h-6" onClick={e => e.stopPropagation()}>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAdmin) return;
                  setShowTypeSelector(!showTypeSelector);
                  setShowCategorySelector(false);
                  setShowStorageSelector(false);
                }}
                className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-black/5 rounded-[2px] transition-all"
                title={`Tipo: ${node.type || 'DOC'}`}
              >
                {node.type === 'FOLDER' && <Folder size={16} className="text-yellow-600 fill-yellow-600/10" />}
                {(!node.type || node.type === 'DOC') && <FileText size={16} className="text-[#0f4369]" />}
                {node.type === 'TOOL' && <Wrench size={16} className="text-blue-600" />}
                {node.type === '.RVT' && <div className="w-5 h-5 bg-blue-600 text-white flex items-center justify-center rounded-[2px] font-black text-[7px]">RVT</div>}
                {node.type === '.RTE' && <div className="w-5 h-5 bg-teal-600 text-white flex items-center justify-center rounded-[2px] font-black text-[7px]">RTE</div>}
                {node.type === '.RFA' && <div className="w-5 h-5 bg-purple-600 text-white flex items-center justify-center rounded-[2px] font-black text-[7px]">RFA</div>}
                {node.type === '.DWG' && <div className="w-5 h-5 bg-orange-500 text-white flex items-center justify-center rounded-[2px] font-black text-[7px]">DWG</div>}
                {node.type === '.PDF' && <div className="w-5 h-5 bg-red-500 text-white flex items-center justify-center rounded-[2px] font-black text-[7px]">PDF</div>}
                {node.type === '.DOC' && <div className="w-5 h-5 bg-blue-300 text-white flex items-center justify-center rounded-[2px] font-black text-[7px]">DOC</div>}
                {node.type === '.MD' && <div className="w-5 h-5 bg-yellow-800 text-white flex items-center justify-center rounded-[2px] font-black text-[7px]">MD</div>}
              </div>

              {showTypeSelector && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowTypeSelector(false)} />
                  <div className="absolute left-7 top-0 flex items-center gap-1 bg-[#1c1c19] p-1 shadow-[4px_4px_0_0_rgba(28,28,25,1)] z-[100] animate-in slide-in-from-left-2 duration-200">
                    {[
                      { id: 'DOC', icon: FileText, color: 'text-white' },
                      { id: 'FOLDER', icon: Folder, color: 'text-yellow-400' },
                      { id: 'TOOL', icon: Wrench, color: 'text-blue-400' },
                      { id: '.RVT', label: 'RVT', color: 'bg-blue-600' },
                      { id: '.RTE', label: 'RTE', color: 'bg-teal-600' },
                      { id: '.RFA', label: 'RFA', color: 'bg-purple-600' },
                      { id: '.DWG', label: 'DWG', color: 'bg-orange-500' },
                      { id: '.PDF', label: 'PDF', color: 'bg-red-500' },
                      { id: '.DOC', label: 'DOC', color: 'bg-blue-300' },
                      { id: '.MD', label: 'MD', color: 'bg-yellow-800' }
                    ].map(t => (
                      <button
                        key={t.id}
                        onClick={(e) => { e.stopPropagation(); onSetType(node.id, t.id); setShowTypeSelector(false); }}
                        className={`p-1.5 hover:bg-white/10 rounded-sm transition-all hover:scale-110 flex items-center justify-center ${node.type === t.id ? 'bg-white/20' : ''}`}
                      >
                        {t.icon ? <t.icon size={14} className={t.color} /> : <div className={`w-[14px] h-[14px] ${t.color} text-white flex items-center justify-center rounded-[1px] font-black text-[5px]`}>{t.label}</div>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* STORAGE SELECTOR */}
            <div className="relative w-6 h-6" onClick={e => e.stopPropagation()}>
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowStorageSelector(!showStorageSelector); 
                  setShowTypeSelector(false);
                  setShowCategorySelector(false);
                }}
                className="w-full h-full flex items-center justify-center bg-white border border-[#1c1c19]/10 rounded-[2px] shadow-sm hover:border-[#1c1c19]/30 transition-all"
                title="Ubicación"
              >
                {(() => {
                  const m = [
                    { id: 'INHERIT', icon: LinkIcon, color: 'text-gray-400' },
                    { id: 'LOCAL', icon: HardDrive, color: 'text-amber-600' },
                    { id: 'CLOUD', icon: Cloud, color: 'text-blue-600' },
                    { id: 'BOTH', icon: Layers, color: 'text-green-600' }
                  ].find(x => x.id === (node.storage_mode || 'INHERIT'));
                  return <m.icon size={12} className={m.color} />;
                })()}
              </button>

              {showStorageSelector && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowStorageSelector(false)} />
                  <div className="absolute left-7 top-0 flex flex-col gap-1 bg-[#1c1c19] p-1 shadow-[4px_4px_0_0_rgba(28,28,25,1)] z-[100] animate-in slide-in-from-left-2 duration-200">
                    {[
                      { id: 'INHERIT', icon: LinkIcon, color: 'text-gray-400', label: 'Heredar' },
                      { id: 'LOCAL', icon: HardDrive, color: 'text-amber-600', label: 'Local' },
                      { id: 'CLOUD', icon: Cloud, color: 'text-blue-600', label: 'Nube' },
                      { id: 'BOTH', icon: Layers, color: 'text-green-600', label: 'Ambos' }
                    ].map(m => (
                      <button
                        key={m.id}
                        onClick={(e) => { e.stopPropagation(); onSetStorageMode(node.id, m.id); setShowStorageSelector(false); }}
                        className={`p-1.5 hover:bg-white/10 rounded-sm transition-all hover:scale-110 flex items-center justify-center ${node.storage_mode === m.id || (!node.storage_mode && m.id === 'INHERIT') ? 'bg-white/20' : ''}`}
                      >
                        <m.icon size={14} className={m.color} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* CATEGORY SELECTOR */}
            <div className="relative w-6 h-6" onClick={e => e.stopPropagation()}>
              <button
                onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowCategorySelector(!showCategorySelector);
                  setShowTypeSelector(false);
                  setShowStorageSelector(false);
                }}
                className="w-full h-full flex items-center justify-center bg-white border border-[#1c1c19]/10 rounded-[2px] shadow-sm hover:border-[#1c1c19]/30 transition-all"
                title={`Categoría: ${node.category || 'Ninguna'}`}
              >
                {(() => {
                  if (node.category === 'Protocolo') return <Layers size={12} className="text-[#0f4369]" />;
                  if (node.category === 'Manual') return <Book size={12} className="text-[#1c1c19]" />;
                  if (node.category === 'Plantilla') return <Download size={12} className="text-amber-600" />;
                  if (node.category === 'Requisito') return <FileText size={12} className="text-emerald-600" />;
                  return <Tag size={12} className="text-gray-400" />;
                })()}
              </button>

              {showCategorySelector && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowCategorySelector(false)} />
                  <div className="absolute left-7 top-0 flex flex-col gap-1 bg-[#1c1c19] p-1 shadow-[4px_4px_0_0_rgba(28,28,25,1)] z-[100] animate-in slide-in-from-left-2 duration-200">
                    {[
                      { id: '', icon: Tag, color: 'text-gray-400', label: 'Sin Categoría' },
                      { id: 'Protocolo', icon: Layers, color: 'text-[#0f4369]', label: 'Protocolo' },
                      { id: 'Manual', icon: Book, color: 'text-white', label: 'Manual' },
                      { id: 'Plantilla', icon: Download, color: 'text-amber-500', label: 'Plantilla' },
                      { id: 'Requisito', icon: FileText, color: 'text-emerald-500', label: 'Requisito' }
                    ].map(c => (
                      <button
                        key={c.id}
                        onClick={(e) => { e.stopPropagation(); onSetCategory(node.id, c.id); setShowCategorySelector(false); }}
                        className={`p-1.5 hover:bg-white/10 rounded-sm transition-all hover:scale-110 flex items-center justify-center ${node.category === c.id || (!node.category && c.id === '') ? 'bg-white/20' : ''}`}
                        title={c.label}
                      >
                        <c.icon size={14} className={c.color} />
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            {isEditing ? (
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onNameSave(node.id, editName);
                  if (e.key === 'Escape') onNameSave(node.id, node.name);
                }}
                onBlur={() => onNameSave(node.id, editName)}
                onClick={(e) => e.stopPropagation()}
                className={`${titleClasses} bg-[#fcf9f4] border-2 border-[#0f4369] p-1 w-full outline-none text-[#1c1c19]`}
              />
            ) : (
              <h3
                className={titleClasses}
                onDoubleClick={(e) => {
                  if (isCreatorMode && isAdmin) {
                    e.stopPropagation();
                    onStartEdit(node.id);
                  }
                }}
              >
                {node.name}
              </h3>
            )}
          </div>
        </div>
      </div>

      <div className={`${descClasses} ${node.isTextExpanded ? 'opacity-100 mt-1 pt-1 border-t border-current/10 line-clamp-5 [-webkit-line-clamp:5]' : 'opacity-0 h-0 m-0 p-0 border-none'}`}>
        {node.description}
      </div>

      {/* Linked Data Buttons (Black Boxes) */}
      {(links?.modules?.length > 0 || allResourceIds.length > 0 || node.externalLinks?.length > 0 || node.externalResources?.length > 0) && (
        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-current/5" onClick={e => e.stopPropagation()}>
          {links?.modules?.map(modId => (
            <button
              key={modId}
              onClick={(e) => { e.stopPropagation(); navigate(`/module/${modId}`); }}
              className="px-2 py-1 bg-[#1c1c19] text-[#fcf9f4] text-[8px] font-black uppercase tracking-widest rounded shadow-[2px_2px_0_0_rgba(28,28,25,0.3)] hover:translate-y-1 hover:shadow-[3px_3px_0_0_rgba(28,28,25,0.5)] transition-all flex items-center gap-1.5"
              title="Ir al Módulo"
            >
              <Database size={10} /> MOD
            </button>
          ))}
          {allResourceIds.map(resId => (
            <button
              key={resId}
              onClick={(e) => { 
                e.stopPropagation(); 
                if (projectId) {
                  navigate(`/project/${projectId}?tab=protocolos&resourceId=${resId}`);
                } else {
                  navigate(`/resource/${resId}`);
                }
              }}
              className="px-2 py-1 bg-[#0f4369] text-[#fcf9f4] text-[8px] font-black uppercase tracking-widest rounded shadow-[2px_2px_0_0_rgba(28,28,25,0.3)] hover:translate-y-1 hover:shadow-[3px_3px_0_0_rgba(28,28,25,0.5)] transition-all flex items-center gap-1.5"
              title="Ir al Recurso"
            >
              <FileText size={10} /> RES
            </button>
          ))}
          {node.externalLinks?.map((exLink, idx) => (
            <a
              key={`ex-l-${idx}`}
              href={exLink.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-1 bg-white border border-[#1c1c19] text-[#1c1c19] text-[8px] font-black uppercase tracking-widest rounded shadow-[2px_2px_0_0_rgba(28,28,25,0.1)] hover:translate-y-1 hover:shadow-[3px_3px_0_0_rgba(28,28,25,0.2)] transition-all flex items-center gap-1.5"
              title={exLink.title || "Abrir Link Externo"}
            >
              <ExternalLink size={10} /> {exLink.title || 'LINK'}
            </a>
          ))}
          {node.externalResources?.map((exRes, idx) => (
            <a
              key={`ex-r-${idx}`}
              href={exRes.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="px-2 py-1 bg-[#f6f3ee] border border-[#1c1c19]/50 text-[#1c1c19] text-[8px] font-black uppercase tracking-widest rounded shadow-[2px_2px_0_0_rgba(28,28,25,0.1)] hover:translate-y-1 hover:shadow-[3px_3px_0_0_rgba(28,28,25,0.2)] transition-all flex items-center gap-1.5"
              title={exRes.title || "Abrir Recurso Externo"}
            >
              <FileText size={10} /> {exRes.title || 'RES'}
            </a>
          ))}
        </div>
      )}

      {/* Metadata Badges (Roles & Category) */}
      {(node.roles || node.category) && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {node.category && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#1c1c19] rounded-sm w-fit shadow-[2px_2px_0_0_rgba(15,67,105,0.3)]">
              <span className="text-[8px] font-black text-white uppercase tracking-wider">{node.category}</span>
            </div>
          )}
          {node.roles && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-[#0f4369]/10 rounded-full w-fit">
              <Users size={10} className="text-[#0f4369]" />
              <span className="text-[8px] font-black text-[#0f4369] uppercase tracking-wider">{node.roles}</span>
            </div>
          )}
        </div>
      )}

      {/* Controles del Nodo */}
      <div
        className="absolute -bottom-3 right-2 flex items-center gap-1 bg-[#1c1c19] p-0.5 shadow-[4px_4px_0_0_rgba(28,28,25,1)] z-40 opacity-0 group-hover/node:opacity-100 transition-all translate-y-2 group-hover/node:translate-y-0"
        onClick={e => e.stopPropagation()}
      >
        {isAdmin && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onAddSubNode(node.id); }}
            className="p-1.5 text-green-400 hover:bg-white/10 rounded-sm transition-all hover:scale-110 flex items-center justify-center"
            title="Añadir Rama/Módulo"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        )}
        {isAdmin && !node.isRoot && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(node.id);
            }}
            className="p-1.5 text-red-500 hover:bg-white/10 rounded-sm transition-all hover:scale-110 flex items-center justify-center"
            title="Eliminar Estructura"
          >
            <Trash2 size={14} strokeWidth={3} />
          </button>
        )}
        <button
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onInspect(node);
          }}
          className="p-1.5 text-[#e5e2dd] hover:bg-white/10 rounded-sm transition-all hover:scale-110 flex items-center justify-center"
          title="Inspeccionar / Editar Nodo"
        >
          <Search size={14} strokeWidth={3} />
        </button>
        {node.hasDescription && (
          <button
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); if (!isLocked && !isCreatorMode) toggleTextExpand(node.id); }}
            className={`p-1.5 text-white hover:bg-white/10 rounded-sm transition-all flex items-center justify-center ${(isLocked || isCreatorMode) ? 'opacity-30 cursor-not-allowed' : ''}`}
            title={(isLocked || isCreatorMode) ? "Expansión bloqueada" : "Expandir/Contraer descripción"}
          >
            {node.isTextExpanded ? <ChevronDown size={14} strokeWidth={3} /> : <ChevronRight size={14} strokeWidth={3} />}
          </button>
        )}
      </div>

      {/* Branch Expand Buttons */}
      {node.hasChildren && (
        <div className="absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 z-30">
          <button
            onMouseDown={(e) => e.stopPropagation()}
            className={`w-6 h-6 flex items-center justify-center bg-white border-[3px] border-[#1c1c19] rounded shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:bg-[#e62020] hover:text-white transition-all group ${isLocked ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isLocked) toggleBranchExpand(node.id);
            }}
            title={isLocked ? "Estructura Bloqueada" : (node.isBranchExpanded ? "Contraer nivel" : "Expandir nivel")}
          >
            {node.isBranchExpanded ? <ChevronDown size={14} strokeWidth={4} /> : <ChevronRight size={14} strokeWidth={4} className="text-[#e62020] group-hover:text-white" />}
          </button>

          <button
            onMouseDown={(e) => e.stopPropagation()}
            className={`w-6 h-6 flex items-center justify-center bg-[#1c1c19] text-white border-[3px] border-[#1c1c19] rounded shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:bg-[#0f4369] transition-all group ${isLocked ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              if (!isLocked) onDeepToggleBranch(node.id, !node.isBranchExpanded);
            }}
            title={isLocked ? "Estructura Bloqueada" : (node.isBranchExpanded ? "COMPRIMIR TODO" : "EXPANDIR TODO RECURSIVO")}
          >
            {node.isBranchExpanded ? <Minimize2 size={11} strokeWidth={4} /> : <Maximize size={11} strokeWidth={4} />}
          </button>

          {/* SYNC AI BUTTON (NEW POSITION) */}
          {isAdmin && (
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onImportSubNodes(node); }}
              className="w-6 h-6 flex items-center justify-center bg-white border-[3px] border-[#1c1c19] rounded shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:bg-[#0f4369] group transition-all mt-1"
              title="Sincronizar Datos (JSON/AI)"
            >
              <RefreshCw size={12} className="text-amber-400 group-hover:rotate-180 transition-transform duration-500" strokeWidth={4} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MindMapNode;
