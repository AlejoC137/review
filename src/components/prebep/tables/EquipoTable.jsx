import React from 'react';

export const EquipoTable = ({ bepTeam, staff, visibleColumns }) => (
  <div className="border border-[#1c1c19] overflow-hidden my-3 w-full text-left">
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#1c1c19] text-white">
            {visibleColumns.includes('rol_bep') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">ROL EN EL PROYECTO (BEP)</th>}
            {visibleColumns.includes('nombre') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">NOMBRE</th>}
            {visibleColumns.includes('empresa') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">EMPRESA</th>}
            {visibleColumns.includes('email') && <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">EMAIL</th>}
            {visibleColumns.includes('telefono') && <th className="p-2 text-[10px] font-black uppercase tracking-wider">TELÉFONO</th>}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#1c1c19]">
          {bepTeam.length === 0 ? (
            <tr><td colSpan="5" className="p-4 text-center text-xs text-gray-500 italic">No hay miembros del equipo BEP registrados.</td></tr>
          ) : (
            bepTeam.map((member, idx) => {
              const s = staff.find(st => st.id === (member.staff_id || member.id)) || member;
              return (
                <tr key={member.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]'}>
                  {visibleColumns.includes('rol_bep') && <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold text-[#0f4369]">{member.bep_role || member.rol_bep || member.role || '-'}</td>}
                  {visibleColumns.includes('nombre') && <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold">{s.nombre || s.name || '-'}</td>}
                  {visibleColumns.includes('empresa') && <td className="p-2 border-r border-[#1c1c19] text-[9px] text-gray-700">{s.empresa || s.company || 'Interno'}</td>}
                  {visibleColumns.includes('email') && <td className="p-2 border-r border-[#1c1c19] text-[9px] font-mono text-gray-600">{s.email || '-'}</td>}
                  {visibleColumns.includes('telefono') && <td className="p-2 text-[9px] font-mono text-gray-600">{s.telefono || s.phone || '-'}</td>}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  </div>
);
export default EquipoTable;
