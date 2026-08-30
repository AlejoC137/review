import React from 'react';

export const ObjetivosTable = ({ objectives, bimUses, visibleColumns }) => (
  <div className="border border-[#1c1c19] overflow-hidden my-3 w-full text-left">
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#1c1c19] text-white">
            {visibleColumns.includes('codigo') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider w-20 text-center">CÓDIGO</th>}
            {visibleColumns.includes('prioridad') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider w-24 text-center">PRIORIDAD</th>}
            {visibleColumns.includes('objetivo_cliente') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">OBJETIVO DEL CLIENTE</th>}
            {visibleColumns.includes('objetivo_proyecto') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">OBJETIVO BIM DEL PROYECTO</th>}
            {visibleColumns.includes('usos_bim_asociados') && <th className="p-2 text-[10px] font-black uppercase tracking-wider">USOS BIM ASOCIADOS</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1c1c19]">
          {objectives.length === 0 ? (
            <tr><td colSpan="5" className="p-4 text-center text-xs text-gray-500 italic">No hay objetivos BIM registrados.</td></tr>
          ) : (
            objectives.map((o, idx) => {
              const uses = bimUses.filter(u => String(u.priority) === String(o.prioridad || o.priority));
              return (
                <tr key={o.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]'}>
                  {visibleColumns.includes('codigo') && <td className="p-2 border-r border-[#1c1c19] font-mono text-[9px] font-bold text-center">{o.codigo || o.code || `OBJ-${idx + 1}`}</td>}
                  {visibleColumns.includes('prioridad') && (
                    <td className="p-2 border-r border-[#1c1c19] text-[9px] text-center font-bold">
                      <span className="bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider border border-amber-300">
                        {o.prioridad || o.priority || 'Media'}
                      </span>
                    </td>
                  )}
                  {visibleColumns.includes('objetivo_cliente') && <td className="p-2 border-r border-[#1c1c19] text-[9px] text-gray-800">{o.objetivo_cliente || o.client_goal || o.descripcion || '-'}</td>}
                  {visibleColumns.includes('objetivo_proyecto') && <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold text-[#0f4369]">{o.objetivo_proyecto || o.bim_goal || o.nombre || '-'}</td>}
                  {visibleColumns.includes('usos_bim_asociados') && (
                    <td className="p-2 text-[9px] text-gray-700">
                      {o.usos_bim || (uses.length > 0 ? uses.map(u => u.name || u.nombre).join(', ') : '-')}
                    </td>
                  )}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
);
export default ObjetivosTable;
