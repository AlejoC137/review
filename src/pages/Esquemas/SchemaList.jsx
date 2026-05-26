import React from 'react';
import { Upload, Plus, Database, Trash2 } from 'lucide-react';
import MigrateMapDataButton from '../../components/admin/MigrateMapDataButton';

const SchemaList = ({
  esquemas,
  isLoading,
  openEsquema,
  handleCreateEsquema,
  handleDeleteEsquema,
  setIsImportModalOpen,
  isAdmin,
  isAdminView,
  isUnlocked,
  isBimManager,
  projectsList,
  handleAssignProject
}) => {
  return (
    <div className="flex-1 p-8 overflow-auto bg-[#fcf9f4]">
      {isAdmin && <div className="mb-6"><MigrateMapDataButton /></div>}
      
      <div className="flex justify-between items-center mb-8 border-b-4 border-[#1c1c19] pb-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tighter">BIM Schemas</h1>
          <p className="font-mono text-sm tracking-widest text-[#0f4369] mt-2">DATA STRUCTURE DASHBOARD</p>
        </div>
        <div className="flex flex-col items-end gap-3">
          {isUnlocked && isAdminView && (
            <div className="flex gap-4">
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="flex items-center gap-2 bg-[#1c1c19] text-[#fcf9f4] border-2 border-[#1c1c19] px-6 py-3 font-black tracking-widest uppercase hover:bg-transparent hover:text-[#1c1c19] transition-all"
              >
                <Upload size={20} />
                PASTE JSON
              </button>
              <button
                onClick={handleCreateEsquema}
                className="flex items-center gap-2 bg-[#e5e2dd] text-[#1c1c19] border-2 border-[#1c1c19] px-6 py-3 font-black tracking-widest uppercase shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:translate-y-1 hover:shadow-none transition-all"
              >
                <Plus size={20} />
                NEW SCHEMA
              </button>
            </div>
          )}

          {!isAdminView && isBimManager && (
            <button
              onClick={handleCreateEsquema}
              className="flex items-center gap-2 bg-white text-[#0f4369] border-2 border-[#1c1c19] px-6 py-3 font-black tracking-widest uppercase shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:translate-y-1 hover:shadow-none transition-all"
            >
              <Plus size={20} />
              ESQUEMA
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <p className="font-mono text-sm">Loading schemas...</p>
      ) : esquemas.length === 0 ? (
        <div className="text-center p-12 border-[3px] border-dashed border-[#1c1c19] opacity-50">
          <p className="font-mono font-bold tracking-widest">NO SCHEMAS CREATED</p>
          <p className="text-sm mt-2">Click on NEW SCHEMA to begin.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {esquemas.map(esq => (
            <div
              key={esq.id}
              onClick={() => openEsquema(esq)}
              className="bg-white border-[3px] border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(15,67,105,1)] hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(15,67,105,1)] cursor-pointer transition-all flex flex-col group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#1c1c19] text-[#fcf9f4] flex items-center justify-center shrink-0">
                  <Database size={20} />
                </div>
                <h3 className="font-black uppercase tracking-tighter leading-tight group-hover:text-[#0f4369] transition-colors">{esq.name}</h3>
              </div>
              <p className="font-mono text-xs text-[#72777f] line-clamp-3 mb-4 flex-1">{esq.description}</p>

              {isAdminView && projectsList && (
                <div className="mb-4" onClick={e => e.stopPropagation()}>
                  <label className="block text-[9px] font-black tracking-widest text-[#1c1c19] mb-1">PROYECTO ASOCIADO</label>
                  <select
                    value={esq.project || 'none'}
                    onChange={(e) => handleAssignProject(esq.id, e.target.value)}
                    className="w-full bg-[#f6f3ee] border-2 border-[#1c1c19] text-[#1c1c19] text-[10px] p-1 font-mono uppercase focus:outline-none focus:border-[#0f4369]"
                  >
                    <option value="none">-- SIN PROYECTO --</option>
                    {projectsList.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-auto border-t-2 border-dashed border-[#1c1c19]/20 pt-4 flex justify-between items-center text-[10px] font-black tracking-widest text-[#1c1c19]">
                <span>ID: {esq.id.substring(0, 8)}</span>
                <div className="flex items-center gap-4">
                  {((isAdmin && isAdminView) || isBimManager) && (
                    <button
                      onClick={(e) => handleDeleteEsquema(e, esq.id)}
                      className="text-[#e62020] hover:scale-125 transition-transform bg-white rounded-full p-1 border-2 border-transparent hover:border-[#1c1c19]"
                      title="Delete Schema Permanently"
                    >
                      <Trash2 size={16} strokeWidth={3} />
                    </button>
                  )}
                  <span className="text-[#0f4369]">OPEN &rarr;</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SchemaList;
