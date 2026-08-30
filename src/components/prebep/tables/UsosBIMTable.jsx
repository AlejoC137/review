import React from 'react';

export const UsosBIMTable = ({ bimUses }) => (
  <div className="border border-[#1c1c19] overflow-hidden my-3 w-full text-left">
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#1c1c19] text-white">
            <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider w-24 text-center">FASE</th>
            <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">USO BIM</th>
            <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">DESCRIPCIÓN / ALCANCE</th>
            <th className="p-2 text-[10px] font-black uppercase tracking-wider w-24 text-center">PRIORIDAD</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1c1c19]">
          {bimUses.length === 0 ? (
            <tr><td colSpan="4" className="p-4 text-center text-xs text-gray-500 italic">No hay usos BIM registrados.</td></tr>
          ) : (
            bimUses.map((u, idx) => (
              <tr key={u.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]'}>
                <td className="p-2 border-r border-[#1c1c19] font-mono text-[9px] font-bold text-center">{u.phase || u.fase || 'Diseño'}</td>
                <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold text-[#0f4369]">{u.name || u.nombre || '-'}</td>
                <td className="p-2 border-r border-[#1c1c19] text-[9px] text-gray-700">{u.description || u.descripcion || '-'}</td>
                <td className="p-2 text-[9px] text-center font-bold">
                  <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider border border-emerald-300">
                    {u.priority || u.prioridad || 'Alta'}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
export default UsosBIMTable;
