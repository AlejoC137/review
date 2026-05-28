import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { projectService } from '../../services/projectService';

export default function TeamTableModule({ project }) {
  const [bepRoles, setBepRoles] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [staffData, rolesData] = await Promise.all([
          projectService.getStaff(),
          projectService.getBepTeam(project?.id)
        ]);
        
        let finalRoles = rolesData || [];
        let finalStaff = staffData || [];

        setStaff(finalStaff);
        setBepRoles(finalRoles);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    if (project?.id) {
      loadData();
    }
  }, [project?.id]);

  const getStaffDetail = (id) => staff.find(s => s.id === id);

  if (loading) return <div className="flex-1 flex justify-center items-center bg-[#f6f3ee]"><Loader2 className="animate-spin text-[#0f4369]" size={40} /></div>;

  const bimTeamRows = [];
  const otherMembersRows = [];

  bepRoles.forEach(role => {
    const isOther = /geren|direc|interventor|constructor/i.test(role.role_name);
    const targetArray = isOther ? otherMembersRows : bimTeamRows;

    if (!role.staff_ids || role.staff_ids.length === 0) {
      targetArray.push({
        id: `${role.id}-empty`,
        cargo: role.role_name,
        compania: role.organization,
        contacto: '',
        correo: '',
        celular: ''
      });
    } else {
      role.staff_ids.forEach((staffId, index) => {
        const s = getStaffDetail(staffId);
        if (s) {
          const rowCargo = isOther ? (s.role_description || role.role_name) : (index === 0 ? role.role_name : '');
          const rowCompania = s.compania || (isOther ? role.organization : (index === 0 ? role.organization : ''));

          targetArray.push({
            id: `${role.id}-${s.id}`,
            cargo: rowCargo,
            compania: rowCompania,
            contacto: s.name || s.nombre || '',
            correo: s.email || '',
            celular: s.phone || ''
          });
        }
      });
    }
  });

  return (
    <div className="h-full bg-white overflow-y-auto flex flex-col p-8 relative">
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
        backgroundImage: 'radial-gradient(circle at center, rgba(28, 28, 25, 0.8) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />

      <div className="flex justify-between items-end mb-4 z-10">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter">2. ESPECIALISTAS DEL PROYECTO</h2>
        </div>
      </div>

      <div className="text-xs text-gray-700 space-y-2 mb-6 z-10 font-medium">
        <p>El equipo a cargo de la estructuración del Proyecto CLICK CLACK WELLNEST EDITION ETAPA II, Está compuesto por un equipo de Gerencia, un equipo de proyecto para la modelación de las diferentes disciplinas y un equipo de Coordinación BIM.</p>
        <p>Para la elaboración del proyecto en la metodología BIM, existirán a su vez equipos de trabajo compuestos por diferentes perfiles los cuales desarrollarán las especialidades declaradas en este documento: Arquitectura, interiorismo, Estructura, Hidrosanitario, Eléctrico (Incluye voz, datos, cctv, telecomunicaciones) Red Contra Incendio (Incluye Detección), Aire Acondicionado, Presupuesto, Programación, Interventoría y Constructora.</p>
      </div>

      <div className="mb-8 z-10 flex flex-col">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#72777f] mb-2 bg-[#f6f3ee] py-1 px-2 inline-block self-start">2.1. Datos generales Equipo BIM</h3>
        <div className="border-2 border-[#1c1c19] overflow-x-auto bg-white shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#f6f3ee] border-b-2 border-[#1c1c19]">
                <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19]">Cargo</th>
                <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19]">Compañía</th>
                <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19]">Nombre de Contacto</th>
                <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19]">Correo</th>
                <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19]">Celular</th>
              </tr>
            </thead>
            <tbody>
              {bimTeamRows.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-xs font-mono opacity-50 uppercase">No hay equipo registrado</td></tr>
              ) : bimTeamRows.map((row) => (
                <tr key={row.id} className="border-b border-[#1c1c19]/20 hover:bg-[#f6f3ee]/50 transition-colors">
                  <td className="p-3 text-xs font-bold text-[#1c1c19] border-r-2 border-[#1c1c19]/20">{row.cargo}</td>
                  <td className="p-3 text-xs font-bold text-[#72777f] border-r-2 border-[#1c1c19]/20">{row.compania}</td>
                  <td className="p-3 text-xs font-medium border-r-2 border-[#1c1c19]/20">{row.contacto}</td>
                  <td className="p-3 text-xs font-mono text-[#0f4369] border-r-2 border-[#1c1c19]/20">
                    {row.correo ? <a href={`mailto:${row.correo}`} className="hover:underline">{row.correo}</a> : ''}
                  </td>
                  <td className="p-3 text-xs font-mono text-[#72777f]">{row.celular}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-center">
          <span className="text-[10px] font-mono italic text-[#72777f]">Tabla 2 Integrantes equipo BIM</span>
        </div>
      </div>

      <div className="mb-8 z-10 flex flex-col">
        <h3 className="text-sm font-bold uppercase tracking-widest text-[#72777f] mb-2 bg-[#f6f3ee] py-1 px-2 inline-block self-start">2.2. Datos generales otros miembros del proyecto</h3>
        <div className="border-2 border-[#1c1c19] overflow-x-auto bg-white shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#f6f3ee] border-b-2 border-[#1c1c19]">
                <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19]">Rol</th>
                <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19]">Compañía</th>
                <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19]">Nombre de Contacto</th>
                <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19]">Correo</th>
                <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19]">Celular</th>
              </tr>
            </thead>
            <tbody>
              {otherMembersRows.length === 0 ? (
                <tr><td colSpan="5" className="p-4 text-center text-xs font-mono opacity-50 uppercase">No hay otros miembros registrados</td></tr>
              ) : otherMembersRows.map((row) => (
                <tr key={row.id} className="border-b border-[#1c1c19]/20 hover:bg-[#f6f3ee]/50 transition-colors">
                  <td className="p-3 text-xs font-bold text-[#1c1c19] border-r-2 border-[#1c1c19]/20">{row.cargo}</td>
                  <td className="p-3 text-xs font-bold text-[#72777f] border-r-2 border-[#1c1c19]/20">{row.compania}</td>
                  <td className="p-3 text-xs font-medium border-r-2 border-[#1c1c19]/20">{row.contacto}</td>
                  <td className="p-3 text-xs font-mono text-[#0f4369] border-r-2 border-[#1c1c19]/20">
                    {row.correo ? <a href={`mailto:${row.correo}`} className="hover:underline">{row.correo}</a> : ''}
                  </td>
                  <td className="p-3 text-xs font-mono text-[#72777f]">{row.celular}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-center">
          <span className="text-[10px] font-mono italic text-[#72777f]">Tabla 3 Integrantes generales del equipo</span>
        </div>
      </div>

    </div>
  );
}
