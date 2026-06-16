import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Network, Link as LinkIcon, Calendar } from 'lucide-react';

export default function PreBEPEsquemaDetails({ plan }) {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadNodes = async () => {
      setLoading(true);
      try {
        let fetchedNodes = [];
        if (plan.schema_id) {
          const { data } = await supabase
            .from('esquema_nodes')
            .select('*')
            .eq('esquema_id', plan.schema_id);
          if (data) {
            fetchedNodes = data;
          }
        }
        setNodes(fetchedNodes);
      } catch (e) {
        console.error("Error loading nodes for esquema", e);
      } finally {
        setLoading(false);
      }
    };
    loadNodes();
  }, [plan]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 border border-dashed border-gray-300 text-[10px] text-gray-500 font-mono flex items-center gap-2">
        <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
        Cargando detalles del esquema...
      </div>
    );
  }

  const planData = plan.plan_data || {};

  // Combina la información del nodo con plan_data
  const combinedData = nodes.map(node => {
    const data = planData[node.id] || {};
    return {
      ...node,
      plan_details: data
    };
  });

  if (combinedData.length === 0) {
    return (
      <div className="p-4 bg-[#fcf9f4] border border-gray-300 text-[10px] uppercase text-gray-500 italic">
        Este esquema no tiene nodos o tareas configuradas.
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="overflow-x-auto border border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)] bg-white max-w-full">
        <table className="w-full text-[10px] border-collapse font-sans">
          <thead>
            <tr className="bg-[#1c1c19] text-white border-b-2 border-[#1c1c19]">
              <th className="p-2.5 text-left font-mono font-bold uppercase tracking-wider border-r border-gray-700">Nodo / Tarea</th>
              <th className="p-2.5 text-left font-mono font-bold uppercase tracking-wider border-r border-gray-700">Tipo</th>
              <th className="p-2.5 text-left font-mono font-bold uppercase tracking-wider border-r border-gray-700">Roles Asignados</th>
              <th className="p-2.5 text-left font-mono font-bold uppercase tracking-wider border-r border-gray-700">Estado</th>
              <th className="p-2.5 text-left font-mono font-bold uppercase tracking-wider">Enlaces / Fecha</th>
            </tr>
          </thead>
          <tbody>
            {combinedData.map((node, idx) => {
              const details = node.plan_details;
              const roles = details.roles || [];
              const status = details.status || 'Pendiente';
              const isOptional = details.isOptional;

              return (
                <tr key={node.id || idx} className="border-b border-gray-200 hover:bg-[#fcf9f4] transition-colors">
                  <td className="p-2.5 border-r border-gray-200 align-top max-w-[200px]">
                    <div className="flex items-start gap-2">
                      <Network size={12} className="text-[#0f4369] mt-0.5 shrink-0" />
                      <div>
                        <span className="font-bold text-[#1c1c19] uppercase break-words">{node.name || node.label || 'Nodo Sin Nombre'}</span>
                        {isOptional && <span className="ml-1 text-[8px] bg-gray-200 text-gray-600 px-1 py-0.5 rounded">OPCIONAL</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-2.5 border-r border-gray-200 align-top uppercase text-gray-600 font-mono">
                    {node.type || 'Standard'}
                  </td>
                  <td className="p-2.5 border-r border-gray-200 align-top">
                    {roles.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {roles.map((r, i) => (
                          <span key={i} className="text-[8px] bg-[#0f4369]/10 text-[#0f4369] px-1.5 py-0.5 rounded font-bold uppercase border border-[#0f4369]/20">
                            {r}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[9px] text-gray-400 italic">No asignado</span>
                    )}
                  </td>
                  <td className="p-2.5 border-r border-gray-200 align-top">
                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${status.toLowerCase() === 'completado' || status.toLowerCase() === 'done' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-amber-100 text-amber-800 border border-amber-300'}`}>
                      {status}
                    </span>
                  </td>
                  <td className="p-2.5 align-top">
                    <div className="flex flex-col gap-1.5">
                      {details.url && (
                        <a href={details.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-600 hover:underline flex items-center gap-1 break-all">
                          <LinkIcon size={10} /> Enlace adjunto
                        </a>
                      )}
                      {(details.startDate || details.endDate) && (
                        <div className="text-[9px] text-gray-600 flex items-center gap-1 font-mono">
                          <Calendar size={10} /> {details.startDate || '-'} al {details.endDate || '-'}
                        </div>
                      )}
                      {!details.url && !details.startDate && !details.endDate && (
                        <span className="text-[9px] text-gray-400 italic">-</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
