import React from 'react';

export const HerramientasTable = ({ plans }) => (
  <div className="border border-[#1c1c19] overflow-hidden my-3 w-full text-left">
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#1c1c19] text-white">
            <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider w-32">CATEGORÍA</th>
            <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">HERRAMIENTA / RECURSO</th>
            <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">PROPÓSITO / USO</th>
            <th className="p-2 text-[10px] font-black uppercase tracking-wider w-32 text-center">ACCESO / ESTADO</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1c1c19]">
          {plans.length === 0 ? (
            <tr><td colSpan="4" className="p-4 text-center text-xs text-gray-500 italic">No hay herramientas BIM registradas.</td></tr>
          ) : (
            plans.map((p, idx) => (
              <tr key={p.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]'}>
                <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold text-[#0f4369]">{p.categoria || p.category || 'Herramienta BIM'}</td>
                <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold">{p.nombre || p.name || p.herramienta || '-'}</td>
                <td className="p-2 border-r border-[#1c1c19] text-[9px] text-gray-700">{p.descripcion || p.proposito || p.description || '-'}</td>
                <td className="p-2 text-[9px] text-center">
                  <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider border border-blue-300 font-mono">
                    {p.estado || p.acceso || 'Disponible'}
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
export default HerramientasTable;
