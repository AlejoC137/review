import React from 'react';
import { formatDate } from '../utils/preBepHelpers';

export const EntregasTable = ({ deliverables, visibleColumns }) => (
  <div className="border border-[#1c1c19] overflow-hidden my-3 w-full text-left">
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#1c1c19] text-white">
            {visibleColumns.includes('codigo') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider w-20 text-center">HITO / CÓDIGO</th>}
            {visibleColumns.includes('fase') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider w-28">FASE</th>}
            {visibleColumns.includes('fecha_entrega') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider text-center w-28">FECHA ENTREGA</th>}
            {visibleColumns.includes('entregables_modelo') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">ENTREGABLES MODELO (BIM)</th>}
            {visibleColumns.includes('entregables_documentos') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">DOCUMENTACIÓN Y PLANOS</th>}
            {visibleColumns.includes('responsable') && <th className="p-2 text-[10px] font-black uppercase tracking-wider w-36">RESPONSABLE</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1c1c19]">
          {deliverables.length === 0 ? (
            <tr><td colSpan="6" className="p-4 text-center text-xs text-gray-500 italic">No hay entregas registradas en el cronograma.</td></tr>
          ) : (
            deliverables.map((d, idx) => (
              <tr key={d.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]'}>
                {visibleColumns.includes('codigo') && <td className="p-2 border-r border-[#1c1c19] font-mono text-[9px] font-bold text-center">{d.code || d.codigo || `ENT-${idx + 1}`}</td>}
                {visibleColumns.includes('fase') && <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold text-[#0f4369]">{d.phase || d.fase || '-'}</td>}
                {visibleColumns.includes('fecha_entrega') && <td className="p-2 border-r border-[#1c1c19] font-mono text-[9px] text-center font-bold">{formatDate(d.due_date || d.fecha_entrega || d.date)}</td>}
                {visibleColumns.includes('entregables_modelo') && <td className="p-2 border-r border-[#1c1c19] text-[9px] text-gray-700">{d.model_deliverables || d.entregables_modelo || d.name || '-'}</td>}
                {visibleColumns.includes('entregables_documentos') && <td className="p-2 border-r border-[#1c1c19] text-[9px] text-gray-700">{d.doc_deliverables || d.entregables_documentos || d.description || '-'}</td>}
                {visibleColumns.includes('responsable') && <td className="p-2 text-[9px] text-gray-700">{d.responsible || d.responsable || '-'}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
export default EntregasTable;
