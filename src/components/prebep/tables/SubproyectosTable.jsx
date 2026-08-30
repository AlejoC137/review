import React from 'react';

export const SubproyectosTable = ({ spaces, visibleColumns }) => (
  <div className="border border-[#1c1c19] overflow-hidden my-3 w-full text-left">
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#1c1c19] text-white">
            {visibleColumns.includes('codigo') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider w-24">CÓDIGO</th>}
            {visibleColumns.includes('nombre') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">NOMBRE / ESPACIO</th>}
            {visibleColumns.includes('descripcion') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">DESCRIPCIÓN</th>}
            {visibleColumns.includes('estado') && <th className="p-2 text-[10px] font-black uppercase tracking-wider w-24 text-center">ESTADO</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1c1c19]">
          {spaces.length === 0 ? (
            <tr><td colSpan="4" className="p-4 text-center text-xs text-gray-500 italic">No hay subproyectos o espacios registrados.</td></tr>
          ) : (
            spaces.map((s, idx) => (
              <tr key={s.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]'}>
                {visibleColumns.includes('codigo') && <td className="p-2 border-r border-[#1c1c19] font-mono text-[9px] font-bold">{s.codigo || s.code || `SP-${idx + 1}`}</td>}
                {visibleColumns.includes('nombre') && <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold text-[#0f4369]">{s.nombre || s.name || '-'}</td>}
                {visibleColumns.includes('descripcion') && <td className="p-2 border-r border-[#1c1c19] text-[9px] text-gray-700">{s.descripcion || s.description || '-'}</td>}
                {visibleColumns.includes('estado') && (
                  <td className="p-2 text-[9px] text-center font-bold">
                    <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider border border-emerald-300">
                      {s.estado || 'Activo'}
                    </span>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
export default SubproyectosTable;
