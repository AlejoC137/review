import React from 'react';

export const DirectorioTable = ({ dataArray, tableId, visibleColumns }) => (
  <div className="border border-[#1c1c19] overflow-hidden my-3 w-full text-left">
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#1c1c19] text-white">
            {visibleColumns.includes('nombre') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">NOMBRE COMPLETO</th>}
            {visibleColumns.includes('empresa') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">EMPRESA / ORGANIZACIÓN</th>}
            {visibleColumns.includes('disciplina') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">DISCIPLINA / ROL</th>}
            {visibleColumns.includes('email') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">CORREO ELECTRÓNICO</th>}
            {visibleColumns.includes('telefono') && <th className="p-2 text-[10px] font-black uppercase tracking-wider">TELÉFONO DE CONTACTO</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1c1c19]">
          {dataArray.length === 0 ? (
            <tr><td colSpan="5" className="p-4 text-center text-xs text-gray-500 italic">No hay contactos registrados.</td></tr>
          ) : (
            dataArray.map((c, idx) => (
              <tr key={c.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]'}>
                {visibleColumns.includes('nombre') && <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold text-[#0f4369]">{c.nombre || c.name || '-'}</td>}
                {visibleColumns.includes('empresa') && <td className="p-2 border-r border-[#1c1c19] text-[9px] text-gray-800">{c.empresa || c.company || '-'}</td>}
                {visibleColumns.includes('disciplina') && <td className="p-2 border-r border-[#1c1c19] text-[9px] text-gray-700">{c.disciplina || c.rol || c.role || c.cargo || '-'}</td>}
                {visibleColumns.includes('email') && <td className="p-2 border-r border-[#1c1c19] text-[9px] font-mono text-gray-600">{c.email || '-'}</td>}
                {visibleColumns.includes('telefono') && <td className="p-2 text-[9px] font-mono text-gray-600">{c.telefono || c.phone || '-'}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
export default DirectorioTable;
