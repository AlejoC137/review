import React from 'react';

export const MaterialesTable = ({ materials, visibleColumns }) => (
  <div className="border border-[#1c1c19] overflow-hidden my-3 w-full text-left">
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#1c1c19] text-white">
            {visibleColumns.includes('codigo') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider w-24">CÓDIGO</th>}
            {visibleColumns.includes('nombre') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">NOMBRE DEL MATERIAL</th>}
            {visibleColumns.includes('categoria') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">CATEGORÍA</th>}
            {visibleColumns.includes('marca') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">MARCA / PROVEEDOR</th>}
            {visibleColumns.includes('modelo') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">MODELO</th>}
            {visibleColumns.includes('unidad') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider text-center w-20">UNIDAD</th>}
            {visibleColumns.includes('descripcion') && <th className="p-2 text-[10px] font-black uppercase tracking-wider">ESPECIFICACIÓN / NOTAS</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1c1c19]">
          {materials.length === 0 ? (
            <tr><td colSpan="7" className="p-4 text-center text-xs text-gray-500 italic">No hay materiales registrados.</td></tr>
          ) : (
            materials.map((m, idx) => (
              <tr key={m.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]'}>
                {visibleColumns.includes('codigo') && <td className="p-2 border-r border-[#1c1c19] font-mono text-[9px] font-bold">{m.codigo || m.code || `MAT-${idx + 1}`}</td>}
                {visibleColumns.includes('nombre') && <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold text-[#0f4369]">{m.nombre || m.name || '-'}</td>}
                {visibleColumns.includes('categoria') && <td className="p-2 border-r border-[#1c1c19] text-[9px] text-gray-700">{m.categoria || m.category || '-'}</td>}
                {visibleColumns.includes('marca') && <td className="p-2 border-r border-[#1c1c19] text-[9px] text-gray-700">{m.marca || m.brand || '-'}</td>}
                {visibleColumns.includes('modelo') && <td className="p-2 border-r border-[#1c1c19] text-[9px] font-mono text-gray-600">{m.modelo || m.model || '-'}</td>}
                {visibleColumns.includes('unidad') && <td className="p-2 border-r border-[#1c1c19] text-[9px] text-center font-mono">{m.unidad || m.unit || 'm2'}</td>}
                {visibleColumns.includes('descripcion') && <td className="p-2 text-[9px] text-gray-600">{m.descripcion || m.description || '-'}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
export default MaterialesTable;
