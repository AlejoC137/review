import React, { useState, useEffect } from 'react';
import { 
  Target, Layers, Plus, Trash2, Edit2, Save, X, Loader2, ShieldAlert,
  Table, LayoutGrid, CheckCircle2, FileText
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';

// Seed Data
const seedObjectives = [
  { prioridad: 1, descripcion: 'Incrementar eficacia en el diseño', usos_potenciales: 'Desarrollo de diseños y Generación de Documentación.' },
  { prioridad: 1, descripcion: 'Revisar el progreso del diseño', usos_potenciales: 'Revisión de diseños y Coordinación 3D' },
  { prioridad: 1, descripcion: 'Evaluación de las cantidades asociadas a cambios en diseño y sus efectos en la cadena de valor', usos_potenciales: 'Cuantificación de Cantidades de obra 5D' },
  { prioridad: 1, descripcion: 'Optimización del proceso constructivo y manejo de Obra', usos_potenciales: 'Generación de documentación.' }
];

const seedBimUses = [
  { valor: 'ALTO', uso: 'Desarrollo de diseños (3D)', descripcion: 'Creación de los modelos BIM de las distintas disciplinas del proyecto para incorporar la información a una base de datos inteligente de la cual se pueden extraer diferentes tipos de data.' },
  { valor: 'MEDIO', uso: 'Documentación para la construcción', descripcion: 'A partir de los modelos BIM en el desarrollo de diseños, se genera la información planimétrica necesaria para la construcción, de tal manera que sea coherente entre la documentación y las revisiones.' },
  { valor: 'ALTO', uso: 'Coordinación 3D', descripcion: 'Proceso de planificación entre las distintas disciplinas previo y durante las fases de diseño para evitar posibles interferencias. Comprende la detección de interferencias entre varios modelos.' },
  { valor: 'MEDIO', uso: 'Cuantificación de Cantidades de obra 5D', descripcion: 'Proceso de utilización de la información de uno o más modelos BIM para extraer cantidades de componentes y materiales del proyecto' }
];

export default function ProjectObjectivesModule({ project }) {
  const { isAdmin, isBimManager } = useAuth();
  const canEdit = isAdmin || isBimManager;

  const [viewMode, setViewMode] = useState('table'); // 'table' or 'cards'
  const [loading, setLoading] = useState(true);
  const [isFallbackActive, setIsFallbackActive] = useState(false);

  const [objectives, setObjectives] = useState([]);
  const [bimUses, setBimUses] = useState([]);

  // Edit States for Objectives
  const [editingObjId, setEditingObjId] = useState(null); // 'new' for adding
  const [objForm, setObjForm] = useState({ id: null, prioridad: 1, descripcion: '', usos_potenciales: '' });

  // Edit States for BIM Uses
  const [editingUseId, setEditingUseId] = useState(null); // 'new' for adding
  const [useForm, setUseForm] = useState({ id: null, valor: 'ALTO', uso: '', descripcion: '' });

  useEffect(() => {
    if (project?.id) {
      fetchData();
    }
  }, [project?.id]);

  const fetchData = async () => {
    setLoading(true);
    const objLocalKey = `project_objectives_${project.id}`;
    const usesLocalKey = `project_bim_uses_${project.id}`;
    
    try {
      const [objRes, usesRes] = await Promise.all([
        supabase.from('project_objectives').select('*').eq('project_id', project.id).order('prioridad', { ascending: true }),
        supabase.from('project_bim_uses').select('*').eq('project_id', project.id).order('created_at', { ascending: true })
      ]);

      if (objRes.error || usesRes.error) {
        throw new Error("Tables might not exist yet.");
      }

      let loadedObjs = objRes.data;
      let loadedUses = usesRes.data;

      if (loadedObjs.length === 0) {
        // Init with seed data if empty
        const seeded = seedObjectives.map((o, i) => ({ id: `seed-obj-${i}`, project_id: project.id, ...o }));
        loadedObjs = seeded;
      }
      
      if (loadedUses.length === 0) {
        const seeded = seedBimUses.map((u, i) => ({ id: `seed-use-${i}`, project_id: project.id, ...u }));
        loadedUses = seeded;
      }

      setObjectives(loadedObjs);
      setBimUses(loadedUses);
      setIsFallbackActive(false);

    } catch (err) {
      console.warn("Using local fallback for objectives & BIM uses:", err);
      setIsFallbackActive(true);
      
      const localObjs = localStorage.getItem(objLocalKey);
      const localUses = localStorage.getItem(usesLocalKey);

      if (localObjs) {
        setObjectives(JSON.parse(localObjs));
      } else {
        const seeded = seedObjectives.map((o, i) => ({ id: `local-obj-${Date.now()}-${i}`, project_id: project.id, ...o }));
        setObjectives(seeded);
        localStorage.setItem(objLocalKey, JSON.stringify(seeded));
      }

      if (localUses) {
        setBimUses(JSON.parse(localUses));
      } else {
        const seeded = seedBimUses.map((u, i) => ({ id: `local-use-${Date.now()}-${i}`, project_id: project.id, ...u }));
        setBimUses(seeded);
        localStorage.setItem(usesLocalKey, JSON.stringify(seeded));
      }
    } finally {
      setLoading(false);
    }
  };

  // --- OBJECTIVES CRUD ---
  const saveObjective = async () => {
    if (!objForm.descripcion.trim() || !objForm.usos_potenciales.trim()) {
      alert("Descripción y Usos Potenciales son requeridos.");
      return;
    }
    setLoading(true);
    const isNew = editingObjId === 'new';
    const newId = isNew ? crypto.randomUUID() : editingObjId;
    
    const entry = {
      id: newId,
      project_id: project.id,
      prioridad: parseInt(objForm.prioridad) || 1,
      descripcion: objForm.descripcion,
      usos_potenciales: objForm.usos_potenciales
    };

    let updated = isNew ? [...objectives, entry] : objectives.map(o => o.id === editingObjId ? entry : o);
    updated.sort((a,b) => a.prioridad - b.prioridad);
    
    setObjectives(updated);
    setEditingObjId(null);

    if (isFallbackActive) {
      localStorage.setItem(`project_objectives_${project.id}`, JSON.stringify(updated));
    } else {
      try {
        await supabase.from('project_objectives').upsert({ ...entry, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      } catch (e) {
        console.warn("Upsert failed, falling back to local.");
      }
    }
    setLoading(false);
  };

  const deleteObjective = async (id) => {
    if (!window.confirm("¿Eliminar este objetivo?")) return;
    const updated = objectives.filter(o => o.id !== id);
    setObjectives(updated);
    
    if (isFallbackActive) {
      localStorage.setItem(`project_objectives_${project.id}`, JSON.stringify(updated));
    } else {
      await supabase.from('project_objectives').delete().eq('id', id);
    }
  };

  // --- BIM USES CRUD ---
  const saveUse = async () => {
    if (!useForm.uso.trim() || !useForm.descripcion.trim()) {
      alert("Uso y Descripción son requeridos.");
      return;
    }
    setLoading(true);
    const isNew = editingUseId === 'new';
    const newId = isNew ? crypto.randomUUID() : editingUseId;
    
    const entry = {
      id: newId,
      project_id: project.id,
      valor: useForm.valor,
      uso: useForm.uso,
      descripcion: useForm.descripcion
    };

    const updated = isNew ? [...bimUses, entry] : bimUses.map(u => u.id === editingUseId ? entry : u);
    
    setBimUses(updated);
    setEditingUseId(null);

    if (isFallbackActive) {
      localStorage.setItem(`project_bim_uses_${project.id}`, JSON.stringify(updated));
    } else {
      try {
        await supabase.from('project_bim_uses').upsert({ ...entry, updated_at: new Date().toISOString() }, { onConflict: 'id' });
      } catch (e) {
        console.warn("Upsert failed, falling back to local.");
      }
    }
    setLoading(false);
  };

  const deleteUse = async (id) => {
    if (!window.confirm("¿Eliminar este uso BIM?")) return;
    const updated = bimUses.filter(u => u.id !== id);
    setBimUses(updated);
    
    if (isFallbackActive) {
      localStorage.setItem(`project_bim_uses_${project.id}`, JSON.stringify(updated));
    } else {
      await supabase.from('project_bim_uses').delete().eq('id', id);
    }
  };

  const renderObjTable = () => (
    <div className="border-2 border-[#1c1c19] bg-white shadow-[4px_4px_0_0_rgba(28,28,25,1)] z-10 relative mb-8">
      <div className="bg-[#f6f3ee] border-b-2 border-[#1c1c19] p-4 flex justify-between items-center">
        <h4 className="font-black italic uppercase tracking-tighter">Tabla 4: Definición Objetivos del Proyecto</h4>
        {canEdit && (
          <button 
            onClick={() => { setObjForm({ id: null, prioridad: 1, descripcion: '', usos_potenciales: '' }); setEditingObjId('new'); }}
            className="p-1.5 bg-[#0f4369] text-white border-2 border-[#1c1c19] hover:bg-[#0a2e49] transition-all"
            title="Añadir Objetivo"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        )}
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-[#1c1c19] bg-[#fcf9f4]">
            <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19] text-center w-24">Prioridad [1-3]</th>
            <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19]">Descripción del Objetivo</th>
            <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19]">Usos BIM Potenciales</th>
            {canEdit && <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-l-2 border-[#1c1c19] w-20">Acción</th>}
          </tr>
        </thead>
        <tbody>
          {objectives.length === 0 ? (
            <tr><td colSpan={canEdit ? "4" : "3"} className="p-4 text-center text-xs font-mono opacity-50 uppercase">No hay objetivos registrados</td></tr>
          ) : objectives.map((obj) => (
            editingObjId === obj.id ? (
              <tr key={obj.id} className="border-b border-[#1c1c19]/20 bg-[#fcf9f4]">
                <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center">
                  <input type="number" min="1" max="3" value={objForm.prioridad} onChange={e => setObjForm({...objForm, prioridad: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-xs font-bold text-center" />
                </td>
                <td className="p-2 border-r-2 border-[#1c1c19]/20">
                  <textarea value={objForm.descripcion} onChange={e => setObjForm({...objForm, descripcion: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-xs resize-none" rows={2} />
                </td>
                <td className="p-2">
                  <textarea value={objForm.usos_potenciales} onChange={e => setObjForm({...objForm, usos_potenciales: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-xs resize-none" rows={2} />
                </td>
                <td className="p-2 border-l-2 border-[#1c1c19]/20 flex flex-col gap-1">
                  <button onClick={saveObjective} className="p-1 bg-[#0f4369] text-white border-2 border-[#1c1c19] flex justify-center"><Save size={12}/></button>
                  <button onClick={() => setEditingObjId(null)} className="p-1 bg-white border-2 border-[#1c1c19] flex justify-center"><X size={12}/></button>
                </td>
              </tr>
            ) : (
              <tr key={obj.id} className="border-b border-[#1c1c19]/20 hover:bg-[#f6f3ee]/50 transition-colors group">
                <td className="p-3 text-sm font-black text-center border-r-2 border-[#1c1c19]/20">{obj.prioridad}</td>
                <td className="p-3 text-xs font-medium text-gray-700 whitespace-pre-wrap border-r-2 border-[#1c1c19]/20">{obj.descripcion}</td>
                <td className="p-3 text-xs font-medium text-gray-700 whitespace-pre-wrap">{obj.usos_potenciales}</td>
                {canEdit && (
                  <td className="p-3 border-l-2 border-[#1c1c19]/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => { setObjForm(obj); setEditingObjId(obj.id); }} className="p-1.5 bg-[#1c1c19] text-white hover:bg-[#0f4369] transition-colors"><Edit2 size={12}/></button>
                      <button onClick={() => deleteObjective(obj.id)} className="p-1.5 bg-white text-red-600 border border-red-600 hover:bg-red-50 transition-colors"><Trash2 size={12}/></button>
                    </div>
                  </td>
                )}
              </tr>
            )
          ))}
          {editingObjId === 'new' && (
            <tr className="border-b border-[#1c1c19]/20 bg-[#fcf9f4]">
              <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center">
                <input type="number" min="1" max="3" value={objForm.prioridad} onChange={e => setObjForm({...objForm, prioridad: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-xs font-bold text-center" />
              </td>
              <td className="p-2 border-r-2 border-[#1c1c19]/20">
                <textarea value={objForm.descripcion} onChange={e => setObjForm({...objForm, descripcion: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-xs resize-none" rows={2} placeholder="Descripción..." />
              </td>
              <td className="p-2">
                <textarea value={objForm.usos_potenciales} onChange={e => setObjForm({...objForm, usos_potenciales: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-xs resize-none" rows={2} placeholder="Usos..." />
              </td>
              <td className="p-2 border-l-2 border-[#1c1c19]/20 flex flex-col gap-1">
                <button onClick={saveObjective} className="p-1 bg-[#0f4369] text-white border-2 border-[#1c1c19] flex justify-center"><Save size={12}/></button>
                <button onClick={() => setEditingObjId(null)} className="p-1 bg-white border-2 border-[#1c1c19] flex justify-center"><X size={12}/></button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderUsesTable = () => (
    <div className="border-2 border-[#1c1c19] bg-white shadow-[4px_4px_0_0_rgba(28,28,25,1)] z-10 relative mb-8">
      <div className="bg-[#f6f3ee] border-b-2 border-[#1c1c19] p-4 flex justify-between items-center">
        <h4 className="font-black italic uppercase tracking-tighter">Tabla 5: Usos BIM</h4>
        {canEdit && (
          <button 
            onClick={() => { setUseForm({ id: null, valor: 'ALTO', uso: '', descripcion: '' }); setEditingUseId('new'); }}
            className="p-1.5 bg-[#0f4369] text-white border-2 border-[#1c1c19] hover:bg-[#0a2e49] transition-all"
            title="Añadir Uso BIM"
          >
            <Plus size={14} strokeWidth={3} />
          </button>
        )}
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b-2 border-[#1c1c19] bg-[#fcf9f4]">
            <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19] text-center w-24">Valor</th>
            <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19] w-1/4">Usos</th>
            <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19]">Descripción</th>
            {canEdit && <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-l-2 border-[#1c1c19] w-20">Acción</th>}
          </tr>
        </thead>
        <tbody>
          {bimUses.length === 0 ? (
            <tr><td colSpan={canEdit ? "4" : "3"} className="p-4 text-center text-xs font-mono opacity-50 uppercase">No hay usos BIM registrados</td></tr>
          ) : bimUses.map((u) => (
            editingUseId === u.id ? (
              <tr key={u.id} className="border-b border-[#1c1c19]/20 bg-[#fcf9f4]">
                <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center">
                  <select value={useForm.valor} onChange={e => setUseForm({...useForm, valor: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-[10px] font-black uppercase">
                    <option value="ALTO">ALTO</option>
                    <option value="MEDIO">MEDIO</option>
                    <option value="BAJO">BAJO</option>
                  </select>
                </td>
                <td className="p-2 border-r-2 border-[#1c1c19]/20">
                  <textarea value={useForm.uso} onChange={e => setUseForm({...useForm, uso: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-xs resize-none" rows={3} />
                </td>
                <td className="p-2">
                  <textarea value={useForm.descripcion} onChange={e => setUseForm({...useForm, descripcion: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-xs resize-none" rows={3} />
                </td>
                <td className="p-2 border-l-2 border-[#1c1c19]/20 flex flex-col gap-1">
                  <button onClick={saveUse} className="p-1 bg-[#0f4369] text-white border-2 border-[#1c1c19] flex justify-center"><Save size={12}/></button>
                  <button onClick={() => setEditingUseId(null)} className="p-1 bg-white border-2 border-[#1c1c19] flex justify-center"><X size={12}/></button>
                </td>
              </tr>
            ) : (
              <tr key={u.id} className="border-b border-[#1c1c19]/20 hover:bg-[#f6f3ee]/50 transition-colors group">
                <td className="p-3 text-[10px] font-black text-center border-r-2 border-[#1c1c19]/20 text-[#0f4369]">{u.valor}</td>
                <td className="p-3 text-xs font-bold text-[#1c1c19] whitespace-pre-wrap border-r-2 border-[#1c1c19]/20">{u.uso}</td>
                <td className="p-3 text-xs font-medium text-gray-700 whitespace-pre-wrap">{u.descripcion}</td>
                {canEdit && (
                  <td className="p-3 border-l-2 border-[#1c1c19]/20 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex gap-1 justify-center">
                      <button onClick={() => { setUseForm(u); setEditingUseId(u.id); }} className="p-1.5 bg-[#1c1c19] text-white hover:bg-[#0f4369] transition-colors"><Edit2 size={12}/></button>
                      <button onClick={() => deleteUse(u.id)} className="p-1.5 bg-white text-red-600 border border-red-600 hover:bg-red-50 transition-colors"><Trash2 size={12}/></button>
                    </div>
                  </td>
                )}
              </tr>
            )
          ))}
          {editingUseId === 'new' && (
             <tr className="border-b border-[#1c1c19]/20 bg-[#fcf9f4]">
              <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center">
                <select value={useForm.valor} onChange={e => setUseForm({...useForm, valor: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-[10px] font-black uppercase">
                  <option value="ALTO">ALTO</option>
                  <option value="MEDIO">MEDIO</option>
                  <option value="BAJO">BAJO</option>
                </select>
              </td>
              <td className="p-2 border-r-2 border-[#1c1c19]/20">
                <textarea value={useForm.uso} onChange={e => setUseForm({...useForm, uso: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-xs resize-none" rows={3} placeholder="Nombre del uso..." />
              </td>
              <td className="p-2">
                <textarea value={useForm.descripcion} onChange={e => setUseForm({...useForm, descripcion: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-xs resize-none" rows={3} placeholder="Descripción..." />
              </td>
              <td className="p-2 border-l-2 border-[#1c1c19]/20 flex flex-col gap-1">
                <button onClick={saveUse} className="p-1 bg-[#0f4369] text-white border-2 border-[#1c1c19] flex justify-center"><Save size={12}/></button>
                <button onClick={() => setEditingUseId(null)} className="p-1 bg-white border-2 border-[#1c1c19] flex justify-center"><X size={12}/></button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );

  const renderCards = () => (
    <div className="space-y-12">
      {/* Objetivos */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#1c1c19] text-white border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(28,28,25,0.2)]">
            <Target size={20} />
          </div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#1c1c19]">Objetivos del Proyecto</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {objectives.map((obj) => (
            <div key={obj.id} className="bg-white border-2 border-[#1c1c19] p-6 shadow-[5px_5px_0_0_rgba(28,28,25,1)] hover:-translate-y-1 transition-transform relative group">
              <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-[#f6f3ee] border-2 border-[#1c1c19] flex items-center justify-center font-black text-[#1c1c19] shadow-sm">
                {obj.prioridad}
              </div>
              <h4 className="text-sm font-black uppercase tracking-tight mb-3 text-[#0f4369] pr-4">{obj.descripcion}</h4>
              <div className="text-[10px] font-black text-[#72777f] uppercase tracking-wider mb-1 flex items-center gap-1"><Layers size={10}/> Usos Potenciales</div>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">{obj.usos_potenciales}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t-2 border-[#1c1c19]/10 pt-12"></div>

      {/* Usos BIM */}
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(28,28,25,0.2)]">
            <Layers size={20} />
          </div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-[#1c1c19]">Usos BIM Definidos</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {bimUses.map((u) => (
            <div key={u.id} className="bg-[#fcf9f4] border-2 border-[#1c1c19] flex flex-col shadow-[4px_4px_0_0_rgba(28,28,25,1)] h-full group transition-all hover:bg-white">
              <div className="p-4 border-b-2 border-[#1c1c19] bg-white flex items-center justify-between">
                <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border border-[#1c1c19] ${u.valor === 'ALTO' ? 'bg-[#0f4369] text-white' : u.valor === 'MEDIO' ? 'bg-amber-400 text-black' : 'bg-slate-200 text-black'}`}>
                  Valor: {u.valor}
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col gap-3">
                <h4 className="text-sm font-black uppercase leading-tight text-[#1c1c19]">{u.uso}</h4>
                <p className="text-[11px] text-slate-600 leading-relaxed">{u.descripcion}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full relative">
      {/* Persistent Top Bar for View Toggle */}
      <div className="p-3 border-b-2 border-[#1c1c19] bg-[#fcf9f4] flex justify-between items-center shrink-0 shadow-[0_2px_10px_rgba(28,28,25,0.05)] z-20 relative">
        <h3 className="text-sm font-black italic uppercase tracking-tighter text-[#1c1c19] flex items-center gap-2">
          <Target size={16} className="text-[#0f4369]" /> Objetivos y Usos BIM
        </h3>
        <div className="flex gap-1 bg-white border-2 border-[#1c1c19] p-1 shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1.5 flex items-center gap-2 text-[10px] font-black uppercase transition-all ${viewMode === 'cards' ? 'bg-[#0f4369] text-white shadow-inner' : 'text-[#72777f] hover:text-[#1c1c19] hover:bg-[#f6f3ee]'}`}
            title="Vista de Tarjetas"
          >
            <LayoutGrid size={14} strokeWidth={3} /> Tarjetas
          </button>
          <div className="w-[2px] bg-[#1c1c19]/10"></div>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 flex items-center gap-2 text-[10px] font-black uppercase transition-all ${viewMode === 'table' ? 'bg-[#0f4369] text-white shadow-inner' : 'text-[#72777f] hover:text-[#1c1c19] hover:bg-[#f6f3ee]'}`}
            title="Ver Tabla General"
          >
            <Table size={14} strokeWidth={3} /> Tablas Editables
          </button>
        </div>
      </div>

      {isFallbackActive && (
        <div className="px-4 py-3 bg-amber-50 border-b-2 border-[#1c1c19] flex gap-2 items-start text-[#493f36] shrink-0">
          <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
          <div className="text-[8px] font-mono uppercase leading-tight">
            <span className="font-bold text-amber-700 block mb-0.5">MODO LOCAL (SQL PENDIENTE)</span>
            Los cambios se guardan localmente en el navegador. Ejecuta <code className="bg-amber-100 px-0.5 text-amber-900 font-bold">supabase_project_objectives.sql</code> para persistir en la nube.
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-8 relative bg-white">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(28, 28, 25, 0.8) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />

        {loading && objectives.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center z-50 bg-white/50">
            <Loader2 className="animate-spin text-[#0f4369]" size={32} />
          </div>
        ) : viewMode === 'table' ? (
          <div className="max-w-5xl mx-auto pb-12">
            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4 text-[#1c1c19]">3. Objetivos del Proyecto</h2>
            <p className="text-xs text-slate-600 mb-6 font-medium">A continuación, se determinan los objetivos generales a alcanzar en el proyecto y se alinean con los usos BIM que soportan dichos objetivos.</p>
            {renderObjTable()}
            
            <h2 className="text-2xl font-black uppercase italic tracking-tighter mt-12 mb-4 text-[#1c1c19]">3.1 Usos BIM</h2>
            {renderUsesTable()}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto pb-12">
            {renderCards()}
          </div>
        )}
      </div>
    </div>
  );
}
