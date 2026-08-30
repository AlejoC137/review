import React from 'react';

export const SoftwareTable = ({ software, visibleColumns }) => (
  <div className="border border-[#1c1c19] overflow-hidden my-3 w-full text-left">
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#1c1c19] text-white">
            {visibleColumns.includes('software') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">SOFTWARE</th>}
            {visibleColumns.includes('version') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider text-center w-24">VERSIÓN</th>}
            {visibleColumns.includes('disciplina') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">DISCIPLINA</th>}
            {visibleColumns.includes('formato_nativo') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider text-center w-28">FORMATO NATIVO</th>}
            {visibleColumns.includes('formato_intercambio') && <th className="p-2 text-[10px] font-black uppercase tracking-wider text-center w-32">FORMATO INTERCAMBIO</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1c1c19]">
          {software.length === 0 ? (
            <tr><td colSpan="5" className="p-4 text-center text-xs text-gray-500 italic">No hay registros de software.</td></tr>
          ) : (
            software.map((s, idx) => (
              <tr key={s.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]'}>
                {visibleColumns.includes('software') && <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold text-[#0f4369]">{s.nombre || s.software || s.name || '-'}</td>}
                {visibleColumns.includes('version') && <td className="p-2 border-r border-[#1c1c19] font-mono text-[9px] text-center font-bold">{s.version || '-'}</td>}
                {visibleColumns.includes('disciplina') && <td className="p-2 border-r border-[#1c1c19] text-[9px] text-gray-700">{s.disciplina || s.discipline || '-'}</td>}
                {visibleColumns.includes('formato_nativo') && <td className="p-2 border-r border-[#1c1c19] font-mono text-[9px] text-center">{s.formato_nativo || s.native_format || '-'}</td>}
                {visibleColumns.includes('formato_intercambio') && <td className="p-2 font-mono text-[9px] text-center">{s.formato_intercambio || s.exchange_format || 'IFC 2x3 / 4'}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
export default SoftwareTable;
