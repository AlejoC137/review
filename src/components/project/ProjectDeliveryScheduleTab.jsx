import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { projectService } from '../../services/projectService';
import { Save, Edit2, Loader2, Plus, Trash2, Wand2, X, Sparkles, Check, Copy, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PROMPTS } from '../../config/aiPrompts';

// --- SUB-COMPONENT: AI IMPORT MODAL ---
const AiDeliveryImportModal = ({ isOpen, onClose, onImport }) => {
  const [userInput, setUserInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    if (!userInput) {
      alert("Por favor, ingresa primero qué entregables necesitas.");
      return;
    }
    const masterPrompt = PROMPTS.deliverySchedule;
    // Insert user input implicitly or tell user to paste it together with the prompt.
    // The prompt is already set up to receive instructions.
    const fullPrompt = `${masterPrompt}\n\nInstrucción del usuario:\n${userInput}`;

    navigator.clipboard.writeText(fullPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleValidate = () => {
    setError(null);
    setPreviewData(null);
    try {
      let cleanJson = jsonInput.trim();
      if (cleanJson.startsWith('\`\`\`json')) cleanJson = cleanJson.replace(/\`\`\`json/g, '').trim();
      if (cleanJson.endsWith('\`\`\`')) cleanJson = cleanJson.replace(/\`\`\`/g, '').trim();
      
      const parsed = JSON.parse(cleanJson);
      
      if (!Array.isArray(parsed)) {
        throw new Error("El JSON debe ser un arreglo de objetos (Array).");
      }
      if (parsed.length > 0 && !parsed[0].entregable_bim) {
        throw new Error("El JSON no tiene el formato correcto (falta 'entregable_bim').");
      }
      
      setPreviewData(parsed);
    } catch (err) {
      setError("Error al parsear JSON. Asegúrate de copiar solo el formato JSON válido. Detalles: " + err.message);
    }
  };

  const handleCreate = async () => {
    setIsImporting(true);
    try {
      onImport(previewData);
      onClose();
    } catch (err) {
      setError("Error al importar en base de datos: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#fcf9f4]/95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border-4 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(28,28,25,0.2)] w-full max-w-3xl my-8 flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b-2 border-[#1c1c19] bg-[#0f4369] text-white flex justify-between items-center flex-none">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-yellow-400" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">IMPORTADOR_CRONOGRAMA_IA</h3>
          </div>
          <button onClick={onClose} className="text-white hover:rotate-90 transition-transform"><X size={24} /></button>
        </div>
        
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
          {/* PASO 1 */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-2">
                <span className="bg-[#1c1c19] text-white font-black text-xs px-2 py-1">PASO 1</span>
                <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">Configurar y Copiar Prompt</h4>
             </div>
             
             <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#72777f]">¿Qué entregables necesitas generar?</label>
                <textarea 
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="Ej: Necesito los modelos arquitectónicos y estructurales para la fase de Anteproyecto (AP)..."
                  className="w-full bg-[#f6f3ee] border-2 border-[#1c1c19]  p-3 text-sm focus:outline-none min-h-[80px]"
                />
             </div>
             
             <button 
                onClick={handleCopyPrompt}
                className={`w-full py-3 border-2 font-display font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${copied ? 'bg-green-600 text-white border-green-800' : 'bg-[#1c1c19] text-white border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'}`}
             >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'PROMPT COPIADO AL PORTAPAPELES' : 'COPIAR PROMPT MAESTRO A IA'}
             </button>
          </div>

          {/* PASO 2 */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-2">
                <span className="bg-[#1c1c19] text-white font-black text-xs px-2 py-1">PASO 2</span>
                <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">Pegar y Validar Resultado</h4>
             </div>
             
             <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#72777f]">Pega el JSON generado por la IA aquí:</label>
                <textarea 
                  value={jsonInput}
                  onChange={e => { setJsonInput(e.target.value); setPreviewData(null); setError(null); }}
                  placeholder="[ { ... } ]"
                  className="w-full bg-[#1c1c19] text-green-400 font-mono border-2 border-[#1c1c19] p-4 text-[10px] focus:outline-none min-h-[150px] custom-scrollbar"
                />
             </div>

             {error && <div className="p-3 bg-red-100 text-red-700 text-xs font-bold uppercase border-l-4 border-red-500">{error}</div>}

             {!previewData ? (
                <button 
                  onClick={handleValidate}
                  disabled={!jsonInput.trim()}
                  className="w-full py-3 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] font-display font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#e5e2dd] disabled:opacity-50"
                >
                  <Check size={16} /> VALIDAR JSON
                </button>
             ) : (
                <div className="bg-[#f6f3ee] border-2 border-[#1c1c19] p-4 space-y-3">
                   <h5 className="text-[10px] font-black uppercase bg-[#1c1c19] text-white px-2 py-1 inline-block mb-2">VISTA_PREVIA</h5>
                   
                   <div className="border border-[#1c1c19]/20 p-2 bg-white">
                      <div className="text-[9px] font-black uppercase mb-1">{previewData.length} ENTREGABLES ENCONTRADOS</div>
                      <ul className="text-[9px] list-disc pl-4 opacity-70">
                        {previewData.slice(0,5).map((item, i) => (
                           <li key={i}>{item.entregable_bim} ({item.fase}) - {item.responsable}</li>
                        ))}
                        {(previewData.length > 5) && <li>... y {previewData.length - 5} más</li>}
                      </ul>
                   </div>

                   <button 
                     onClick={handleCreate}
                     disabled={isImporting}
                     className="w-full mt-4 py-3 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-display font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#1c1c19] transition-colors disabled:opacity-50"
                   >
                     {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                     {isImporting ? 'IMPORTANDO...' : 'CONFIRMAR E IMPORTAR ENTREGAS'}
                   </button>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProjectDeliveryScheduleTab({ project }) {
  const { isAdmin, isBimManager } = useAuth();
  const canEdit = isAdmin || isBimManager;

  const [schedule, setSchedule] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deletedIds, setDeletedIds] = useState([]);

  // AI Importer state
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [aiJsonInput, setAiJsonInput] = useState('');

  // Data for dropdowns
  const [teamMembers, setTeamMembers] = useState([]);
  const [subProjects, setSubProjects] = useState([]);
  const [bimDeliverables, setBimDeliverables] = useState([]);

  useEffect(() => {
    fetchData();
  }, [project?.id]);

  const fetchData = async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      // 1. Fetch Schedule
      const { data: scheduleData, error: scheduleError } = await supabase
        .from('project_delivery_schedule')
        .select('*')
        .eq('project_id', project.id)
        .order('created_at', { ascending: true });

      if (scheduleError && scheduleError.code !== '42703') { // Ignore missing column error initially if they haven't altered yet
        console.warn("Schedule fetch error:", scheduleError);
      }
      setSchedule(scheduleData || []);

      // 2. Fetch BEP Team for 'Responsable'
      try {
        const teamData = await projectService.getBepTeam(project.id);
        if (teamData) setTeamMembers(teamData);
      } catch (err) {
        console.warn("Could not fetch team members:", err);
      }

      // 3. Fetch Subprojects
      try {
        const spacesData = await projectService.getSpaces();
        if (spacesData) setSubProjects(spacesData);
      } catch (err) {
        console.warn("Could not fetch subprojects:", err);
      }

      // 4. Fetch Schema Nodes where type is .RVT
      try {
        const { data: nodesData, error: nodesError } = await supabase
          .from('esquema_nodes')
          .select('id, name, type')
          .eq('type', '.RVT')
          .order('name', { ascending: true });
        
        if (nodesError) {
          console.warn("Could not fetch esquema nodes:", nodesError);
        } else if (nodesData) {
          // If the project has a specific schema, we could filter by it, but for now we bring all .RVT nodes 
          // or we can rely on the user picking the correct one.
          setBimDeliverables(nodesData);
        }
      } catch (err) {
        console.warn("Error fetching nodes:", err);
      }

    } catch (err) {
      console.warn("Error in fetchData:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project?.id) return;
    setLoading(true);
    
    try {
      // Handle deletions
      if (deletedIds.length > 0) {
        await supabase
          .from('project_delivery_schedule')
          .delete()
          .in('id', deletedIds);
      }

      // Handle upserts
      const upserts = schedule.map(item => {
        // Find format from selected deliverable
        let formato = item.formato;
        if (item.entregable_bim) {
          const matchedNode = bimDeliverables.find(n => n.name === item.entregable_bim);
          if (matchedNode && matchedNode.type) {
            formato = matchedNode.type; // e.g. '.RVT'
          }
        }

        return {
          ...item,
          project_id: project.id,
          formato: formato, // auto-assign format
          updated_at: new Date().toISOString()
        };
      });

      const cleanUpserts = upserts.map(item => {
        const payload = { ...item };
        if (payload.id && payload.id.toString().startsWith('temp-')) {
          delete payload.id;
        }
        if (!payload.fecha || payload.fecha.trim() === '') {
          payload.fecha = null;
        }
        if (!payload.subproject_id || payload.subproject_id.trim() === '') {
          payload.subproject_id = null;
        }
        return payload;
      });

      if (cleanUpserts.length > 0) {
        const { error } = await supabase
          .from('project_delivery_schedule')
          .upsert(cleanUpserts);
        
        if (error) {
          if (error.message.includes('subproject_id')) {
            alert("Error: Falta la columna 'subproject_id'. Por favor ejecuta el comando SQL proporcionado en el chat.");
          }
          throw error;
        }
      }

      alert("Cronograma guardado exitosamente.");
      setIsEditing(false);
      setDeletedIds([]);
      fetchData(); 
    } catch (err) {
      console.error("Error saving schedule:", err);
      alert("Error al guardar en Supabase.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (index, field, value) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], [field]: value };
    setSchedule(newSchedule);
  };

  const handleAddRow = () => {
    setSchedule([...schedule, {
      id: `temp-${Date.now()}`,
      subproject_id: '',
      entregable_bim: '',
      responsable: '',
      fase: 'EB',
      fecha: '',
      observaciones: '',
      formato: ''
    }]);
  };

  const handleDeleteRow = (index) => {
    const item = schedule[index];
    if (item.id && !item.id.toString().startsWith('temp-')) {
      setDeletedIds([...deletedIds, item.id]);
    }
    const newSchedule = [...schedule];
    newSchedule.splice(index, 1);
    setSchedule(newSchedule);
  };

  const handleSyncNodes = () => {
    if (!bimDeliverables || bimDeliverables.length === 0) {
      alert("No se encontraron nodos .RVT en el proyecto.");
      return;
    }
    
    if (!window.confirm("¿Estás seguro de autogenerar entregables para todos los nodos .RVT encontrados? Esto añadirá 3 filas (EB, AP, PR) por cada nodo a la tabla actual (sin guardar aún).")) return;
    
    const newItems = [];
    bimDeliverables.forEach(node => {
      ['EB', 'AP', 'PR'].forEach(fase => {
        newItems.push({
          id: `temp-${Date.now()}-${Math.random()}`,
          subproject_id: '',
          entregable_bim: node.name,
          responsable: '',
          fase: fase,
          fecha: null,
          observaciones: '',
          formato: node.type || '.RVT'
        });
      });
    });
    
    setSchedule(prev => [...prev, ...newItems]);
    setIsEditing(true);
  };

  const handleClearAll = async () => {
    if (!window.confirm("⚠️ PELIGRO: ¿Estás COMPLETAMENTE SEGURO de que quieres borrar TODOS los entregables del cronograma de este proyecto? Esta acción eliminará los datos de la base de datos inmediatamente y no se puede deshacer.")) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('project_delivery_schedule')
        .delete()
        .eq('project_id', project.id);
        
      if (error) throw error;
      
      setSchedule([]);
      setDeletedIds([]);
      setIsEditing(false);
      alert("Todos los entregables han sido borrados exitosamente.");
    } catch (err) {
      console.error("Error clearing schedule:", err);
      alert("Error al borrar el cronograma en Supabase.");
    } finally {
      setLoading(false);
    }
  };

  const handleAiImport = (parsedData) => {
    try {
      const newItems = parsedData.map(item => ({
        id: `temp-${Date.now()}-${Math.random()}`,
        subproject_id: item.subproject_id || '',
        entregable_bim: item.entregable_bim || '',
        responsable: item.responsable || '',
        fase: item.fase || 'EB',
        fecha: item.fecha || '',
        observaciones: item.observaciones || '',
        formato: item.formato || ''
      }));

      setSchedule(prev => [...prev, ...newItems]);
      setIsEditing(true);
      alert("Entregables importados correctamente. Revisa la tabla y presiona 'Guardar' para confirmar.");
    } catch (err) {
      alert("Error al procesar JSON: " + err.message);
    }
  };

  if (loading && schedule.length === 0) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-[#0f4369]" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-[#1c1c19] p-8 shadow-[6px_6px_0_0_rgba(28,28,25,1)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-[#1c1c19]/10 pb-4 mb-6 gap-4">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-[#1c1c19]">Cronograma de Entregas</h3>
          <p className="text-[10px] uppercase text-[#72777f] font-bold tracking-widest mt-1">
            Gestión de entregables BIM y responsables
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isBimManager && (
            <>
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white border-2 border-[#1c1c19] font-black text-[9px] uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                title="Borrar todos los entregables"
              >
                <Trash2 size={12} /> BORRADOR
              </button>
              <button
                onClick={handleSyncNodes}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-black text-[9px] uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                title="Sincronizar con nodos .RVT"
              >
                <RefreshCw size={12} /> SINCRONIZACIÓN
              </button>
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-black text-[9px] uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                title="Importador IA para BIM Managers"
              >
                <Sparkles size={12} className="text-yellow-500" fill="currentColor" /> IMPORTADOR AI
              </button>
            </>
          )}

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-black text-[9px] uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
            >
              <Edit2 size={12} /> Editar
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-black text-[9px] uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
            >
              {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
            </button>
          )}
        </div>
      </div>

      <div className="overflow-x-auto border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,1)] mb-6">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-[#fcf9f4] border-b-2 border-[#1c1c19]">
              <th className="p-3 text-[10px] font-black uppercase text-[#72777f] border-r-2 border-[#1c1c19]/20 w-32">Subproyecto</th>
              <th className="p-3 text-[10px] font-black uppercase text-[#72777f] border-r-2 border-[#1c1c19]/20 w-1/5">Entregable BIM</th>
              <th className="p-3 text-[10px] font-black uppercase text-[#72777f] border-r-2 border-[#1c1c19]/20">Responsable</th>
              <th className="p-3 text-[10px] font-black uppercase text-[#72777f] border-r-2 border-[#1c1c19]/20 w-16 text-center">Fase</th>
              <th className="p-3 text-[10px] font-black uppercase text-[#72777f] border-r-2 border-[#1c1c19]/20 w-32">Fecha</th>
              <th className="p-3 text-[10px] font-black uppercase text-[#72777f] border-r-2 border-[#1c1c19]/20">Observaciones</th>
              <th className="p-3 text-[10px] font-black uppercase text-[#72777f] border-r-2 border-[#1c1c19]/20 w-16">Formato</th>
              {isEditing && (
                <th className="p-3 text-[10px] font-black uppercase text-[#72777f] w-12 text-center">Del</th>
              )}
            </tr>
          </thead>
          <tbody>
            {schedule.length === 0 ? (
              <tr>
                <td colSpan={isEditing ? 8 : 7} className="p-8 text-center text-sm font-semibold text-slate-500">
                  No hay entregas registradas. {isEditing && "Haz clic en 'Añadir Entrega' para comenzar."}
                </td>
              </tr>
            ) : (
              schedule.map((item, idx) => (
                <tr key={item.id} className={`border-b border-[#1c1c19]/10 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]/50'} hover:bg-[#f6f3ee] transition-colors`}>
                  
                  {/* SUBPROYECTO */}
                  <td className="p-2 border-r border-[#1c1c19]/10">
                    {isEditing ? (
                      <select
                        value={item.subproject_id || ''}
                        onChange={(e) => handleChange(idx, 'subproject_id', e.target.value)}
                        className="w-full p-1.5 bg-white border border-[#1c1c19] text-xs font-bold focus:outline-none"
                      >
                        <option value="">-- Ninguno --</option>
                        {subProjects.map(sp => (
                          <option key={sp.id} value={sp.id}>{sp.name || sp.nombre}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-black text-[#1c1c19]">
                        {subProjects.find(sp => sp.id === item.subproject_id)?.name || 
                         subProjects.find(sp => sp.id === item.subproject_id)?.nombre || 
                         '-'}
                      </span>
                    )}
                  </td>

                  {/* ENTREGABLE BIM (Nodos) */}
                  <td className="p-2 border-r border-[#1c1c19]/10">
                    {isEditing ? (
                      <div className="flex flex-col gap-1">
                        <select
                          value={item.entregable_bim || ''}
                          onChange={(e) => {
                            handleChange(idx, 'entregable_bim', e.target.value);
                          }}
                          className="w-full p-1.5 bg-white border border-[#1c1c19] text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#0f4369]"
                        >
                          <option value="">-- Seleccionar Nodo --</option>
                          {bimDeliverables.map(n => (
                            <option key={n.id} value={n.name}>{n.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          value={item.entregable_bim || ''}
                          onChange={(e) => handleChange(idx, 'entregable_bim', e.target.value)}
                          placeholder="O escribir manualmente..."
                          className="w-full p-1 bg-white border border-[#1c1c19]/20 text-[10px] font-medium"
                        />
                      </div>
                    ) : (
                      <span className="text-xs font-black text-[#1c1c19]">{item.entregable_bim}</span>
                    )}
                  </td>

                  {/* RESPONSABLE (Equipo BEP) */}
                  <td className="p-2 border-r border-[#1c1c19]/10">
                    {isEditing ? (
                      <select
                        value={item.responsable || ''}
                        onChange={(e) => handleChange(idx, 'responsable', e.target.value)}
                        className="w-full p-1.5 bg-white border border-[#1c1c19] text-xs font-medium focus:outline-none"
                      >
                        <option value="">-- Seleccionar Responsable --</option>
                        {teamMembers.map(member => (
                          <option key={member.id} value={member.role_name || member.name}>
                            {member.role_name || member.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-xs font-semibold text-slate-700">{item.responsable}</span>
                    )}
                  </td>

                  {/* FASE */}
                  <td className="p-2 border-r border-[#1c1c19]/10 text-center">
                    {isEditing ? (
                      <select
                        value={item.fase || 'EB'}
                        onChange={(e) => handleChange(idx, 'fase', e.target.value)}
                        className="w-full p-1.5 bg-white border border-[#1c1c19] text-xs font-bold focus:outline-none"
                      >
                        <option value="EB">EB</option>
                        <option value="AP">AP</option>
                        <option value="PR">PR</option>
                      </select>
                    ) : (
                      <span className="inline-block px-2 py-0.5 bg-[#1c1c19] text-white text-[10px] font-black uppercase rounded">{item.fase}</span>
                    )}
                  </td>

                  {/* FECHA */}
                  <td className="p-2 border-r border-[#1c1c19]/10">
                    {isEditing ? (
                      <input
                        type="date"
                        value={item.fecha || ''}
                        onChange={(e) => handleChange(idx, 'fecha', e.target.value)}
                        className="w-full p-1.5 bg-white border border-[#1c1c19] text-xs font-medium focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs font-semibold text-slate-700">{item.fecha ? new Date(item.fecha).toLocaleDateString() : ''}</span>
                    )}
                  </td>

                  {/* OBSERVACIONES */}
                  <td className="p-2 border-r border-[#1c1c19]/10">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.observaciones || ''}
                        onChange={(e) => handleChange(idx, 'observaciones', e.target.value)}
                        className="w-full p-1.5 bg-white border border-[#1c1c19] text-xs font-medium focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs text-slate-600">{item.observaciones}</span>
                    )}
                  </td>

                  {/* FORMATO (Auto-rellenado o Manual) */}
                  <td className="p-2 border-r border-[#1c1c19]/10">
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.formato || ''}
                        onChange={(e) => handleChange(idx, 'formato', e.target.value)}
                        placeholder="Ej. .RVT"
                        className="w-full p-1.5 bg-white border border-[#1c1c19] text-xs font-medium focus:outline-none"
                      />
                    ) : (
                      <span className="text-xs font-black text-blue-800">{item.formato}</span>
                    )}
                  </td>

                  {/* ACTIONS */}
                  {isEditing && (
                    <td className="p-2 text-center">
                      <button
                        onClick={() => handleDeleteRow(idx)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Eliminar fila"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isEditing && (
        <button
          onClick={handleAddRow}
          className="flex items-center gap-1.5 px-4 py-2 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-black text-[10px] uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
        >
          <Plus size={14} /> Añadir Entrega
        </button>
      )}

      {/* Tabla Explicativa de Fases */}
      <div className="mt-8 border-t-2 border-[#1c1c19]/10 pt-6">
        <h4 className="text-xs font-black uppercase text-[#1c1c19] mb-3">Definición de Fases (Nomenclatura)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-[#fcf9f4] border border-[#1c1c19]/20 flex items-start gap-3">
            <div className="px-2 py-1 bg-[#1c1c19] text-white text-[10px] font-black uppercase rounded">EB</div>
            <div>
              <div className="text-xs font-black text-[#1c1c19] uppercase">Esquema Básico</div>
              <p className="text-[10px] text-slate-600 mt-1">Fase inicial de diseño, modelos conceptuales y volumetría general.</p>
            </div>
          </div>
          <div className="p-3 bg-[#fcf9f4] border border-[#1c1c19]/20 flex items-start gap-3">
            <div className="px-2 py-1 bg-[#1c1c19] text-white text-[10px] font-black uppercase rounded">AP</div>
            <div>
              <div className="text-xs font-black text-[#1c1c19] uppercase">Anteproyecto</div>
              <p className="text-[10px] text-slate-600 mt-1">Definición espacial, coordinación básica e integración preliminar de especialidades.</p>
            </div>
          </div>
          <div className="p-3 bg-[#fcf9f4] border border-[#1c1c19]/20 flex items-start gap-3">
            <div className="px-2 py-1 bg-[#1c1c19] text-white text-[10px] font-black uppercase rounded">PR</div>
            <div>
              <div className="text-xs font-black text-[#1c1c19] uppercase">Proyecto</div>
              <p className="text-[10px] text-slate-600 mt-1">Documentación detallada, especificaciones para construcción (Proyecto Ejecutivo).</p>
            </div>
          </div>
        </div>
      </div>

      <AiDeliveryImportModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        onImport={handleAiImport} 
      />

    </div>
  );
}
