import React from 'react';
import { ZoomIn, ZoomOut, Maximize, Minimize2, ChevronDown, EyeOff, Eye, Highlighter, Lock, Unlock, Focus, Printer, Wand2, Zap, Info, FileText } from 'lucide-react';
import { MARKER_COLORS } from './constants';

const SchemaHUD = ({ 
  zoom, 
  setZoom, 
  panOffset, 
  setPanOffset, 
  containerRef, 
  centerOnRoot,
  allBranchesExpanded,
  handleGlobalTreeToggle,
  allDataExpanded,
  handleGlobalDataToggle,
  isHighlighterActive,
  setIsHighlighterActive,
  markerColor,
  setMarkerColor,
  isLocked,
  setIsLocked,
  isCreatorMode,
  setIsCreatorMode,
  selectedNodeIds,
  handleIsolateNode,
  handleAutoOrganize,
  isAdmin,
  showJsonView,
  setShowJsonView
}) => {
  return (
    <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex items-stretch gap-6 animate-in slide-in-from-bottom-8 duration-500">
      
      {/* BLOQUE 1: NAVEGACIÓN Y ZOOM */}
      <div className="flex items-stretch bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,1)]">
        <button
          onClick={() => {
            const newZoom = Math.min(zoom + 0.1, 3);
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const cx = rect.width / 2;
              const cy = rect.height / 2;
              const canvasX = (cx - panOffset.x) / zoom;
              const canvasY = (cy - panOffset.y) / zoom;
              setPanOffset({ x: cx - canvasX * newZoom, y: cy - canvasY * newZoom });
            }
            setZoom(newZoom);
          }}
          className="w-12 h-12 flex items-center justify-center text-[#0f4369] hover:bg-[#e5e2dd] border-r-2 border-[#1c1c19]/10 transition-all font-bold"
          title="Acercar (Zoom In)"
        >
          <ZoomIn size={18} strokeWidth={3} />
        </button>
        
        <div className="flex flex-col items-center justify-center px-3 border-r-2 border-[#1c1c19]/10 min-w-[70px]">
          <span className="font-mono text-[8px] font-black text-[#72777f] uppercase tracking-[1px] leading-none mb-1">ZOOM</span>
          <span className="font-mono text-sm font-black text-[#1c1c19] leading-none">{(zoom * 100).toFixed(0)}%</span>
        </div>

        <button
          onClick={() => {
            const newZoom = Math.max(zoom - 0.1, 0.1);
            if (containerRef.current) {
              const rect = containerRef.current.getBoundingClientRect();
              const cx = rect.width / 2;
              const cy = rect.height / 2;
              const canvasX = (cx - panOffset.x) / zoom;
              const canvasY = (cy - panOffset.y) / zoom;
              setPanOffset({ x: cx - canvasX * newZoom, y: cy - canvasY * newZoom });
            }
            setZoom(newZoom);
          }}
          className="w-12 h-12 flex items-center justify-center text-[#0f4369] hover:bg-[#e5e2dd] border-r-2 border-[#1c1c19]/10 transition-all font-bold"
          title="Alejar (Zoom Out)"
        >
          <ZoomOut size={18} strokeWidth={3} />
        </button>

        <button
          onClick={() => setZoom(1)}
          className="w-12 h-12 flex items-center justify-center text-[#1c1c19] hover:bg-[#e5e2dd] border-r-2 border-[#1c1c19]/10 transition-all font-bold"
          title="Reset Zoom (100%)"
        >
          <Maximize size={16} strokeWidth={3} />
        </button>

        <button
          onClick={centerOnRoot}
          className="w-12 h-12 flex items-center justify-center bg-[#1c1c19] text-white hover:bg-[#0f4369] transition-all font-bold"
          title="Centrar en el inicio"
        >
          <Minimize2 size={16} strokeWidth={3} className="rotate-45" />
        </button>
      </div>

      {/* BLOQUE 2: GESTIÓN DE VISTA (TOGGLES) */}
      <div className="flex items-stretch bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(15,67,105,1)]">
        {/* Tree Visibility Toggle */}
        <button
          onClick={handleGlobalTreeToggle}
          className={`w-12 h-12 flex flex-col items-center justify-center border-r-2 border-[#1c1c19]/10 transition-all font-bold ${allBranchesExpanded ? 'bg-[#0f4369] text-white' : 'text-[#0f4369] hover:bg-[#e5e2dd]'}`}
          title={allBranchesExpanded ? "Contraer todas las ramas" : "Expandir todas las ramas"}
        >
          <ChevronDown size={18} strokeWidth={4} className={allBranchesExpanded ? 'rotate-180 transition-transform' : ''} />
          <span className="font-mono text-[7px] font-black mt-0.5">TREE</span>
        </button>

        {/* Data Visibility Toggle */}
        <button
          onClick={handleGlobalDataToggle}
          className={`w-12 h-12 flex flex-col items-center justify-center border-r-2 border-[#1c1c19]/10 transition-all font-bold ${allDataExpanded ? 'bg-[#1c1c19] text-white' : 'text-[#1c1c19] hover:bg-[#e5e2dd]'}`}
          title={allDataExpanded ? "Ocultar descriptiones" : "Mostrar descriptiones"}
        >
          {allDataExpanded ? <EyeOff size={16} /> : <Eye size={16} />}
          <span className="font-mono text-[7px] font-black mt-0.5">DATA</span>
        </button>

        {/* Marker Toggle */}
        <div className="flex border-r-2 border-[#1c1c19]/10">
            <button
            onClick={() => setIsHighlighterActive(!isHighlighterActive)}
            className={`w-12 h-12 flex flex-col items-center justify-center transition-all font-bold ${isHighlighterActive ? 'bg-[#1c1c19] text-white' : 'text-[#1c1c19] hover:bg-[#e5e2dd]'}`}
            title="Modo Resaltador"
            >
            <Highlighter size={16} strokeWidth={3} style={{ color: isHighlighterActive ? markerColor : 'currentColor' }} />
            <span className="font-mono text-[7px] font-black mt-0.5">MARK</span>
            </button>
            
            {isHighlighterActive && (
                <div className="flex flex-col gap-0.5 p-1 bg-[#1c1c19]/5">
                    {MARKER_COLORS.map(c => (
                        <button
                            key={c.name}
                            onClick={() => setMarkerColor(c.value)}
                            className={`w-3 flex-1 border border-[#1c1c19]/20 transition-transform ${markerColor === c.value ? 'scale-110 border-[#1c1c19] z-10 shadow-sm' : 'opacity-60 hover:opacity-100'}`}
                            style={{ backgroundColor: c.value }}
                            title={`Color ${c.name}`}
                        />
                    ))}
                </div>
            )}
        </div>

        {/* Lock Toggle */}
        <button 
          disabled={isCreatorMode}
          onClick={() => setIsLocked(!isLocked)}
          className={`w-12 h-12 flex items-center justify-center border-r-2 border-[#1c1c19]/10 transition-all font-bold ${isCreatorMode ? 'opacity-30 cursor-not-allowed' : (isLocked ? 'bg-red-50 text-red-600' : 'text-green-600 hover:bg-green-50')}`}
          title={isLocked ? "Desbloquear" : "Bloquear"}
        >
          {isLocked ? <Lock size={16} strokeWidth={3} /> : <Unlock size={16} strokeWidth={3} />}
        </button>

        {/* Isolate Toggle */}
        <button 
          disabled={selectedNodeIds.size === 0}
          onClick={handleIsolateNode}
          className={`w-12 h-12 flex flex-col items-center justify-center transition-all font-bold ${selectedNodeIds.size > 0 ? 'text-[#0f4369] hover:bg-[#e5e2dd]' : 'opacity-20 cursor-not-allowed'}`}
          title="Aislar Nodo (Solo ruta activa)"
        >
          <Focus size={16} strokeWidth={3} />
          <span className="font-mono text-[7px] font-black mt-0.5">ISO</span>
        </button>
      </div>

      {/* BLOQUE 3: ACCIONES Y MODOS */}
      <div className="flex items-stretch bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(230,32,32,0.4)]">
        <button
          onClick={() => window.print()}
          className="w-12 h-12 flex items-center justify-center text-[#1c1c19] hover:bg-[#1c1c19] hover:text-white border-r-2 border-[#1c1c19]/10 transition-all font-bold"
          title="Imprimir (Export)"
        >
          <Printer size={18} strokeWidth={3} />
        </button>

        <button
          onClick={handleAutoOrganize}
          className={`px-4 h-12 flex flex-col items-center justify-center border-r-2 border-[#1c1c19]/10 transition-all font-bold ${selectedNodeIds.size > 0 ? 'bg-green-600 text-white' : 'text-[#0f4369] hover:bg-[#e5e2dd]'}`}
          title="Auto-organizar"
        >
          <Wand2 size={16} className={selectedNodeIds.size > 0 ? 'animate-bounce' : ''} />
          <span className="font-mono text-[8px] font-black mt-0.5">LAYOUT</span>
        </button>

        <button
          onClick={() => setIsCreatorMode(!isCreatorMode)}
          className={`px-4 h-12 flex flex-col items-center justify-center transition-all font-bold ${isCreatorMode ? 'bg-[#e62020] text-white' : 'text-[#1c1c19] hover:bg-[#e5e2dd]'}`}
          title="Modo Edición AI"
        >
          {isCreatorMode ? <Zap size={16} className="animate-pulse" /> : <Info size={16} />}
          <span className="font-mono text-[8px] font-black mt-0.5">{isCreatorMode ? 'CREATOR_ON' : 'DETAIL_MODE'}</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setShowJsonView(!showJsonView)}
            className={`px-4 h-12 flex flex-col items-center justify-center border-l-2 border-[#1c1c19]/10 transition-all font-bold ${showJsonView ? 'bg-[#1c1c19] text-white' : 'text-[#1c1c19] hover:bg-[#e5e2dd]'}`}
            title="Ver Estructura JSON"
          >
            <FileText size={14} className={showJsonView ? 'text-green-400' : ''} />
            <span className="font-mono text-[8px] font-black mt-0.5">JSON_DATA</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default SchemaHUD;
