import React from 'react';
import { X, Search } from 'lucide-react';
import { TABLE_METADATA } from '../../../services/databaseReportService';
import GenericTable from '../tables/GenericTable';

export const PreBEPExplorerModal = ({
  selectedExplorerTable,
  setSelectedExplorerTable,
  searchQuery,
  setSearchQuery,
  dbData,
  projectId
}) => {
  if (!selectedExplorerTable) return null;

  const currentRecords = dbData[selectedExplorerTable]?.records || [];
  const currentError = dbData[selectedExplorerTable]?.error || null;
  const filteredRecords = currentRecords.filter(r => {
    if (!searchQuery) return true;
    return Object.values(r).some(val => 
      String(val).toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border-4 border-[#1c1c19] w-full max-w-5xl max-h-[90vh] flex flex-col shadow-[10px_10px_0_0_rgba(28,28,25,1)]">
        {/* Modal Header */}
        <div className="bg-[#1c1c19] text-white p-4 flex justify-between items-center">
          <div>
            <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest block">EXPLORADOR DE TABLA SUPABASE</span>
            <h2 className="text-lg font-black uppercase text-white flex items-center gap-2">
              {TABLE_METADATA[selectedExplorerTable]?.displayName || selectedExplorerTable}
              <span className="text-xs bg-[#0f4369] px-2 py-0.5 rounded font-mono font-normal">
                {currentRecords.length} registros
              </span>
            </h2>
          </div>
          <button 
            onClick={() => { setSelectedExplorerTable(''); setSearchQuery(''); }}
            className="p-1 hover:bg-white/20 rounded transition-colors text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Toolbar */}
        <div className="p-4 border-b-2 border-[#1c1c19] bg-[#f6f3ee] flex gap-4 items-center flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input 
              type="text"
              placeholder="Buscar en todos los campos..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border-2 border-[#1c1c19] text-xs font-mono focus:outline-none bg-white"
            />
          </div>
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-gray-600 hover:text-black uppercase"
            >
              Limpiar filtro
            </button>
          )}
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-auto p-4">
          <GenericTable 
            tableName={TABLE_METADATA[selectedExplorerTable]?.displayName || selectedExplorerTable}
            records={filteredRecords}
            error={currentError}
          />
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t-2 border-[#1c1c19] bg-[#f6f3ee] flex justify-between items-center text-xs">
          <span className="text-gray-500 font-mono text-[10px]">
            Mostrando {filteredRecords.length} de {currentRecords.length} registros
          </span>
          <button 
            onClick={() => { setSelectedExplorerTable(''); setSearchQuery(''); }}
            className="px-4 py-1.5 bg-[#1c1c19] text-white font-bold text-xs uppercase hover:bg-gray-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
export default PreBEPExplorerModal;
