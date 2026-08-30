import React from 'react';
import { Info } from 'lucide-react';

export const PreBEPCoverPage = ({ project, projectId, availableTablesCount }) => {
  return (
    <div className="w-full pb-10 pt-16 flex flex-col" style={{ boxSizing: 'border-box' }}>
      <div className="border-b-8 border-[#1c1c19] pb-8">
        <h2 className="text-[#0f4369] font-black uppercase tracking-[4px] text-xs mb-4">
          PLAN DE EJECUCIÓN BIM PRELIMINAR (PRE-BEP):
        </h2>
        <h1 className="text-5xl font-black text-[#1c1c19] mb-4 uppercase leading-none tracking-tighter break-words">
          {project?.name || 'PROYECTO BIM'}
        </h1>
        <h2 className="text-2xl font-light text-gray-500 uppercase tracking-widest">
          COMPILACIÓN INTEGRAL DE REQUISITOS Y BASE DE DATOS
        </h2>
      </div>

      <div className="flex flex-col gap-6 my-10 max-w-xl">
        <div className="bg-[#fcf9f4] border-2 border-[#1c1c19] p-6 shadow-[6px_6px_0_0_rgba(28,28,25,1)]">
          <h3 className="font-black text-xs uppercase text-[#0f4369] mb-3 flex items-center gap-2">
            <Info size={14} /> INFORMACIÓN DE ENTREGA
          </h3>
          <p className="text-[10px] leading-relaxed uppercase text-[#72777f]">
            Este documento compila el estado preliminar del Plan de Ejecución BIM. Contiene la información general del proyecto, la matriz de entregables de información, directorio, protocolos activos y el catálogo maestro de especificaciones de materiales.
          </p>
        </div>
      </div>

      <div className="mt-10 border-t-4 border-[#1c1c19] pt-8 flex justify-between items-end text-xs">
        <div>
          <p className="text-[#72777f] text-[9px] font-bold tracking-[2px] uppercase mb-1">ID DE PROYECTO (SUPABASE):</p>
          <p className="font-mono text-[10px] bg-gray-100 p-1.5 border border-gray-300 select-all">{projectId}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-[10px] uppercase tracking-widest">
            FECHA EXTRACCIÓN: {new Date().toLocaleDateString('es-CO')}
          </p>
          <p className="text-[8px] text-[#72777f] font-mono mt-1">
            TABLAS ACTIVAS EN SUPABASE: {availableTablesCount || 0}
          </p>
        </div>
      </div>
    </div>
  );
};
export default PreBEPCoverPage;
