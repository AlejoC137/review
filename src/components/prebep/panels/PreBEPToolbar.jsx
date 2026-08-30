import React from 'react';
import { RefreshCw, LayoutGrid, FileText, Printer, Save, CheckCircle2, CloudOff } from 'lucide-react';

export const PreBEPToolbar = ({
  project,
  refreshing,
  loadData,
  activeView,
  setActiveView,
  pageHeights,
  addPage,
  deletePage,
  resetPages,
  configSaveStatus
}) => {
  return (
    <div className="no-print bg-white border-b-2 border-[#1c1c19] p-4 flex justify-between items-center z-10 shadow-sm flex-wrap gap-4">
      <div className="flex items-center gap-4">
        <button
          onClick={() => loadData(true)}
          className="p-2 border-2 border-[#1c1c19] hover:bg-black hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)]"
          title="Recargar datos del proyecto"
          disabled={refreshing}
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          <span className="hidden sm:inline">Recargar</span>
        </button>
        <div className="border-l-2 border-[#1c1c19]/10 pl-4 flex flex-col">
          <span className="text-[10px] text-[#72777f] font-bold tracking-widest uppercase">PROYECTO ACTIVO</span>
          <span className="text-xs font-black uppercase text-[#0f4369]">{project?.name || 'PRE-BEP COMPILACIÓN'}</span>
        </div>
      </div>

      {/* Selector de Vistas */}
      <div className="flex bg-[#f6f3ee] border-2 border-[#1c1c19] p-1 gap-1">
        <button
          onClick={() => setActiveView('document')}
          className={`px-3 py-1.5 text-xs font-black uppercase flex items-center gap-2 transition-all ${
            activeView === 'document' 
              ? 'bg-[#1c1c19] text-white shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]' 
              : 'text-[#1c1c19] hover:bg-gray-200'
          }`}
        >
          <FileText size={14} /> Documento
        </button>
        <button
          onClick={() => setActiveView('control_panel')}
          className={`px-3 py-1.5 text-xs font-black uppercase flex items-center gap-2 transition-all ${
            activeView === 'control_panel' 
              ? 'bg-[#1c1c19] text-white shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]' 
              : 'text-[#1c1c19] hover:bg-gray-200'
          }`}
        >
          <LayoutGrid size={14} /> Panel de Control
        </button>
      </div>

      {/* Acciones principales */}
      <div className="flex items-center gap-3">
        {activeView === 'document' && (
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-[#1c1c19] text-white border-2 border-[#1c1c19] px-4 py-2 text-xs font-black uppercase tracking-wider hover:bg-[#0f4369] transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5"
          >
            <Printer size={16} /> Imprimir / PDF
          </button>
        )}
      </div>
    </div>
  );
};
export default PreBEPToolbar;
