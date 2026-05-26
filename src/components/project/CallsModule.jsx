import React, { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Clock, MapPin, User, ChevronRight, CheckCircle, Plus } from 'lucide-react';
import { projectService } from '../../services/projectService';

export default function CallsModule({ project }) {
  const [calls, setCalls] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchIncidents = async () => {
      if (!project?.id) return;
      try {
        setLoading(true);
        const data = await projectService.getIncidents(project.id);
        setCalls(data.map(item => ({
          id: item.id,
          title: item.title,
          priority: item.priority,
          finished: item.finished,
          time: new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          loc: item.location,
          user: item.reporter?.name || 'Desconocido'
        })) || []);
      } catch (error) {
        console.error("Error fetching incidents:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchIncidents();
  }, [project?.id]);

  const getPriorityColor = (p) => {
    if (p === 'CRÍTICA' || p === 'ALTA') return 'text-red-500 border-red-500 bg-red-50';
    if (p === 'MEDIA') return 'text-yellow-600 border-yellow-600 bg-yellow-50';
    return 'text-[#72777f] border-[#72777f] bg-gray-50';
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
      <div className="flex justify-between items-end mb-12 border-b-2 border-[#1c1c19] pb-6">
        <div>
          <h2 className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-4">
            <Bell size={32} className="text-red-500" /> Centro de Llamados
          </h2>
          <p className="text-xs font-mono uppercase text-[#72777f] mt-2 tracking-widest">Monitoreo de incidencias y coordinación en tiempo real</p>
        </div>
        <button className="flex items-center gap-2 px-6 py-3 bg-[#0f4369] text-white font-black text-[10px] uppercase shadow-[8px_8px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-4px] translate-y-[-4px] hover:translate-x-0 hover:translate-y-0 transition-all">
          <Plus size={16} /> Nuevo Reporte
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
        <div className="p-6 bg-[#f6f3ee] border-2 border-[#1c1c19]">
          <span className="text-[10px] font-black uppercase text-[#72777f] block mb-1">Total Hoy</span>
          <div className="text-4xl font-black italic">12</div>
        </div>
        <div className="p-6 bg-red-50 border-2 border-red-500 text-red-600">
          <span className="text-[10px] font-black uppercase block mb-1">Críticos</span>
          <div className="text-4xl font-black italic">02</div>
        </div>
        <div className="p-6 bg-white border-2 border-[#1c1c19]">
          <span className="text-[10px] font-black uppercase text-[#72777f] block mb-1">Pendientes</span>
          <div className="text-4xl font-black italic text-[#0f4369]">05</div>
        </div>
        <div className="p-6 bg-[#f6f3ee] border-2 border-[#1c1c19]">
          <span className="text-[10px] font-black uppercase text-[#72777f] block mb-1">Resueltos</span>
          <div className="text-4xl font-black italic opacity-30">248</div>
        </div>
      </div>

      <div className="space-y-4">
        {calls.map(call => (
          <div key={call.id} className="group relative bg-white border-2 border-[#1c1c19] p-6 hover:-translate-y-1 transition-all cursor-pointer shadow-[8px_8px_0_0_rgba(28,28,25,0.05)] flex items-center justify-between overflow-hidden">
            {call.priority === 'CRÍTICA' && (
              <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            )}

            <div className="flex gap-6 items-center">
              <div className={`w-12 h-12 flex items-center justify-center border-2 border-[#1c1c19] ${call.finished === 'RESUELTO' ? 'bg-green-500 text-white' : 'bg-white'}`}>
                {call.finished === 'RESUELTO' ? <CheckCircle size={20} /> : <AlertTriangle size={20} className={call.priority === 'CRÍTICA' ? 'text-red-500 animate-pulse' : ''} />}
              </div>

              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-[8px] font-black px-1.5 py-0.5 border-2 uppercase ${getPriorityColor(call.priority)}`}>{call.priority}</span>
                  <span className="text-[9px] font-mono font-black uppercase text-[#72777f]">{call.finished}</span>
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter">{call.title}</h3>
                <div className="flex items-center gap-4 text-[10px] font-bold text-[#72777f] uppercase tracking-widest mt-1">
                  <span className="flex items-center gap-1"><MapPin size={10} /> {call.loc}</span>
                  <span className="flex items-center gap-1"><Clock size={10} /> {call.time}</span>
                  <span className="flex items-center gap-1"><User size={10} /> {call.user}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button className="px-4 py-2 bg-[#f6f3ee] border-2 border-[#1c1c19] font-black text-[10px] uppercase hover:bg-[#1c1c19] hover:text-white transition-all">Ver Detalle</button>
              <ChevronRight size={20} className="text-[#1c1c19]/20 group-hover:text-[#1c1c19] transition-all" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
