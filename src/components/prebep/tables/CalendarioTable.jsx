import React from 'react';

export const CalendarioTable = ({ tasks, visibleColumns }) => (
  <div className="border border-[#1c1c19] overflow-hidden my-3 w-full text-left">
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#1c1c19] text-white">
            {visibleColumns.includes('mes') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider w-24">PERIODO / MES</th>}
            {visibleColumns.includes('fase') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider w-32">FASE</th>}
            {visibleColumns.includes('actividades_principales') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">ACTIVIDADES PRINCIPALES</th>}
            {visibleColumns.includes('hitos') && <th className="p-2 text-[10px] font-black uppercase tracking-wider">HITOS / ENTREGABLES</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1c1c19]">
          {tasks.length === 0 ? (
            <tr><td colSpan="4" className="p-4 text-center text-xs text-gray-500 italic">No hay actividades registradas en el calendario.</td></tr>
          ) : (
            tasks.map((t, idx) => (
              <tr key={t.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]'}>
                {visibleColumns.includes('mes') && <td className="p-2 border-r border-[#1c1c19] font-mono text-[9px] font-bold">{t.mes || t.month || t.fecha || `Mes ${idx + 1}`}</td>}
                {visibleColumns.includes('fase') && <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold text-[#0f4369]">{t.fase || t.phase || '-'}</td>}
                {visibleColumns.includes('actividades_principales') && <td className="p-2 border-r border-[#1c1c19] text-[9px] text-gray-700">{t.actividad || t.nombre || t.title || t.descripcion || '-'}</td>}
                {visibleColumns.includes('hitos') && <td className="p-2 text-[9px] text-gray-700">{t.hito || t.milestone || t.entregable || '-'}</td>}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);
export default CalendarioTable;
