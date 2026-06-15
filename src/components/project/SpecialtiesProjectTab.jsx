import React, { useState, useEffect } from 'react';
import { 
  Database, Plus, Trash2, Edit2, Check, Loader2, Bot, 
  X, Save 
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { PROMPTS } from '../../config/aiPrompts';

const translateToEnglish = (spanishName) => {
  const dictionary = {
    'arquitectura': 'architecture',
    'diseño arquitectónico': 'architecture',
    'estructura': 'structure',
    'hidrosanitario': 'plumbing',
    'eléctrico': 'electrical',
    'red contra incendio': 'fire protection',
    'aire acondicionado': 'hvac',
    'presupuesto': 'budget',
    'programación': 'scheduling',
    'interventoría': 'supervision',
    'constructora': 'construction',
    'topografía': 'surveying',
    'geotecnia': 'geotechnical',
    'paisajismo': 'landscape',
    'acústica': 'acoustics',
    'iluminación': 'lighting'
  };
  const lowerName = spanishName.toLowerCase().trim();
  return dictionary[lowerName] || lowerName;
};

const generateAbbreviation = (name) => {
  if (!name) return '';
  const englishName = translateToEnglish(name);
  return englishName.substring(0, 3).toUpperCase();
};

export default function SpecialtiesProjectTab({ project }) {
  const { isAdmin } = useAuth();
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAiInput, setShowAiInput] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  
  const [form, setForm] = useState({ name: '', abbreviation: '', description: '', responsible_name: '' });

  useEffect(() => {
    if (project?.id) {
      fetchSpecialties();
    }
  }, [project?.id]);

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const [specData, staffData, dirData] = await Promise.all([
        projectService.getSpecialties(project.id),
        projectService.getStaff(),
        projectService.getDirectoryContacts(project.id)
      ]);
      setSpecialties(specData || []);
      
      const combinedTeam = [
        ...(staffData || []).map(s => ({ id: s.id, name: s.name || s.nombre, type: 'Staff' })),
        ...(dirData || []).map(d => ({ id: d.id, name: d.name, type: 'Directorio' }))
      ];
      setTeamMembers(combinedTeam);
    } catch (error) {
      console.error("Error fetching specialties:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setForm(prev => {
      const updated = { ...prev, name: newName };
      if (!prev.abbreviation || prev.abbreviation === generateAbbreviation(prev.name)) {
          updated.abbreviation = generateAbbreviation(newName);
      }
      return updated;
    });
  };

  const handleJsonChange = (e) => {
    const text = e.target.value;
    setJsonInput(text);
    setJsonError(null);
    setParsedData(null);
    if (!text.trim()) return;
    try {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) throw new Error('El JSON debe ser un Array [...]');
        setParsedData(parsed);
    } catch (err) {
        setJsonError(err.message);
    }
  };

  const handleProcessJson = async () => {
    if (!parsedData || !Array.isArray(parsedData)) return;
    try {
        setLoading(true);
        for (const spec of parsedData) {
            if (spec.name) {
                const abbreviation = spec.abbreviation || generateAbbreviation(spec.name);
                await projectService.createSpecialty({ 
                  name: spec.name, 
                  abbreviation, 
                  description: spec.description || '',
                  project_id: project.id
                });
            }
        }
        setJsonInput('');
        setParsedData(null);
        setShowAiInput(false);
        fetchSpecialties();
        alert("Especialidades importadas correctamente.");
    } catch (err) {
        console.error("Error importando JSON:", err);
        alert("Error al importar Especialidades: " + err.message);
    } finally {
        setLoading(false);
    }
  };

  const handleLoadStandardDisciplines = async () => {
    if (!window.confirm("¿Cargar las disciplinas estándar de la Matriz LOD como especialidades?")) return;
    try {
      setLoading(true);
      const standardDisciplines = [
        'Espacial', 'Sitio', 'Cimentación', 'Estructura', 'Envolvente', 
        'Interiorismo', 'Plomería', 'Eléctrica y Comunicación', 'Seguridad y Control', 'HVAC'
      ];
      for (const d of standardDisciplines) {
        if (!specialties.find(s => s.name.toLowerCase() === d.toLowerCase())) {
          await projectService.createSpecialty({
             name: d,
             abbreviation: generateAbbreviation(d),
             description: `Especialidad estándar: ${d}`,
             project_id: project.id
          });
        }
      }
      await fetchSpecialties();
      alert("Disciplinas estándar cargadas correctamente como especialidades.");
    } catch (err) {
      console.error(err);
      alert("Error al cargar disciplinas: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      const specialtyData = { 
        name: form.name,
        abbreviation: form.abbreviation || null,
        description: form.description || null,
        responsible_name: form.responsible_name || null,
        project_id: project.id 
      };
      if (editingId) {
        await projectService.updateSpecialty(editingId, specialtyData);
      } else {
        await projectService.createSpecialty(specialtyData);
      }
      setForm({ name: '', abbreviation: '', description: '', responsible_name: '' });
      setIsAdding(false);
      setEditingId(null);
      fetchSpecialties();
    } catch (error) {
      console.error("Error saving specialty:", error);
      alert("Error al guardar la Especialidad: " + error.message);
    }
  };

  const startEdit = (spec) => {
    setForm({ 
      name: spec.name, 
      abbreviation: spec.abbreviation || generateAbbreviation(spec.name),
      description: spec.description || '',
      responsible_name: spec.responsible_name || ''
    });
    setEditingId(spec.id);
    setIsAdding(false); // we edit inline
    setShowAiInput(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar esta Especialidad?")) return;
    try {
      await projectService.deleteSpecialty(id);
      fetchSpecialties();
    } catch (error) {
      console.error("Error deleting Specialty:", error);
    }
  };

  return (
    <div className="bg-white border-2 border-[#1c1c19] w-full flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b-2 border-[#1c1c19] flex justify-between items-center bg-[#f6f3ee]">
        <h2 className="text-xl font-black uppercase italic tracking-tighter">Catálogo de Especialidades</h2>
      </div>

      {/* Content */}
      <div className="p-6 flex-1 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs font-mono uppercase text-[#72777f]">Selecciona o administra las especialidades</p>
          <div className="flex gap-2">
            {isAdmin && !isAdding && (
              <button 
                onClick={() => setShowAiInput(!showAiInput)}
                className="flex items-center gap-2 bg-[#f6f3ee] text-[#1c1c19] px-3 py-1.5 text-xs font-bold border-2 border-[#1c1c19] hover:bg-white shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                <Bot size={14} /> {showAiInput ? 'OCULTAR IA' : 'ASISTENTE IA'}
              </button>
            )}
            {!isAdding && specialties.length === 0 && (
              <button 
                onClick={handleLoadStandardDisciplines}
                className="flex items-center gap-2 bg-[#bfd4e7] text-[#1c1c19] px-3 py-1.5 text-xs font-bold border-2 border-[#1c1c19] hover:bg-blue-100 shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                title="Cargar las disciplinas estándar de la matriz LOD (Sitio, Estructura, etc.)"
              >
                <Database size={14} /> CARGAR DISCIPLINAS LOD
              </button>
            )}
            {!isAdding && (
              <button 
                onClick={() => { setForm({ name: '', abbreviation: '', description: '' }); setEditingId(null); setIsAdding(true); setShowAiInput(false); }}
                className="flex items-center gap-2 bg-[#0f4369] text-white px-3 py-1.5 text-xs font-bold border-2 border-[#1c1c19] hover:bg-[#0a2e49] shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                <Plus size={14} /> NUEVA Especialidad
              </button>
            )}
          </div>
        </div>

        {showAiInput && !isAdding && (
          <div className="mb-6 p-4 border-2 border-dashed border-[#1c1c19] bg-[#fcf9f4]">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-sm font-black uppercase text-[#0f4369] flex items-center gap-2">
                <Bot size={16} /> Pegar JSON de Especialidades
              </h3>
            </div>
            <textarea
              className="w-full h-32 p-3 font-mono text-xs border-2 border-[#1c1c19] focus:outline-none mb-2"
              placeholder={'[\n  { "name": "Arquitectura BIM", "description": "Modelado BIM Arquitectura" }\n]'}
              value={jsonInput}
              onChange={handleJsonChange}
            />
            {jsonError && (
              <div className="text-red-500 text-xs font-bold mb-2 flex items-center gap-1">
                <AlertCircle size={12} /> {jsonError}
              </div>
            )}
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAiInput(false)} className="px-3 py-1 border-2 border-[#1c1c19] text-xs font-bold hover:bg-white">Cancelar</button>
              <button 
                onClick={handleProcessJson} 
                disabled={!parsedData || loading}
                className="px-3 py-1 bg-[#0f4369] text-white border-2 border-[#1c1c19] text-xs font-bold hover:bg-[#0a2e49] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                PROCESAR {parsedData ? `(${parsedData.length})` : ''}
              </button>
            </div>
          </div>
        )}

        {isAdding && !editingId && (
          <div className="mb-6 p-4 border-2 border-[#1c1c19] bg-[#f6f3ee] shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
            <h3 className="text-sm font-black uppercase">Nueva Especialidad</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Nombre *</label>
                <input 
                  type="text" 
                  value={form.name} 
                  onChange={handleNameChange} 
                  className="w-full p-2 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none" 
                  placeholder="Ej. Diseño Arquitectónico"
                />
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Diminutivo</label>
                <input 
                  type="text" 
                  value={form.abbreviation} 
                  onChange={e => setForm({...form, abbreviation: e.target.value.toUpperCase()})} 
                  maxLength={10}
                  className="w-full p-2 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none uppercase" 
                  placeholder="Ej. ARC"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Descripción</label>
                <input 
                  type="text" 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  className="w-full p-2 border-2 border-[#1c1c19] text-sm focus:outline-none" 
                  placeholder="Opcional..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Responsable</label>
                <select 
                  value={form.responsible_name} 
                  onChange={e => setForm({...form, responsible_name: e.target.value})} 
                  className="w-full p-2 border-2 border-[#1c1c19] text-sm focus:outline-none bg-white"
                >
                  <option value="">Sin asignar</option>
                  {teamMembers.map(member => (
                    <option key={member.id} value={member.name}>{member.name} ({member.type})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 border-2 border-[#1c1c19] text-xs font-bold hover:bg-white transition-all">
                CANCELAR
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] text-xs font-bold hover:bg-[#0a2e49] transition-all">
                GUARDAR
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 size={32} className="animate-spin text-[#0f4369]" />
          </div>
        ) : (
          <div className="border-2 border-[#1c1c19]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f6f3ee] border-b-2 border-[#1c1c19] text-[10px] uppercase font-black tracking-widest text-[#72777f]">
                  <th className="p-3 border-r-2 border-[#1c1c19]">Nombre</th>
                  <th className="p-3 border-r-2 border-[#1c1c19] w-24">Diminutivo</th>
                  <th className="p-3 border-r-2 border-[#1c1c19]">Responsable</th>
                  <th className="p-3 border-r-2 border-[#1c1c19]">Descripción</th>
                  <th className="p-3 w-24 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {specialties.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-xs font-mono uppercase text-[#72777f]">
                      No hay Especialidades registradas
                    </td>
                  </tr>
                ) : (
                  specialties.map((specialty) => (
                    <tr key={specialty.id} className={`border-b-2 border-[#1c1c19] last:border-0 transition-colors ${editingId === specialty.id ? 'bg-[#f6f3ee]' : 'hover:bg-[#f6f3ee]/50'}`}>
                      {editingId === specialty.id ? (
                        <>
                          <td className="p-3 border-r-2 border-[#1c1c19]">
                            <input 
                              type="text" 
                              value={form.name} 
                              onChange={handleNameChange} 
                              className="w-full p-1.5 border-2 border-[#1c1c19] text-xs font-bold focus:outline-none" 
                              placeholder="Nombre"
                            />
                          </td>
                          <td className="p-3 border-r-2 border-[#1c1c19]">
                            <input 
                              type="text" 
                              value={form.abbreviation} 
                              onChange={e => setForm({...form, abbreviation: e.target.value.toUpperCase()})} 
                              maxLength={10}
                              className="w-full p-1.5 border-2 border-[#1c1c19] text-xs font-bold focus:outline-none uppercase text-center" 
                              placeholder="Diminutivo"
                            />
                          </td>
                          <td className="p-3 border-r-2 border-[#1c1c19]">
                            <select 
                              value={form.responsible_name} 
                              onChange={e => setForm({...form, responsible_name: e.target.value})} 
                              className="w-full p-1.5 border-2 border-[#1c1c19] text-xs focus:outline-none bg-white"
                            >
                              <option value="">Sin asignar</option>
                              {teamMembers.map(member => (
                                <option key={member.id} value={member.name}>{member.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-3 border-r-2 border-[#1c1c19]">
                            <input 
                              type="text" 
                              value={form.description} 
                              onChange={e => setForm({...form, description: e.target.value})} 
                              className="w-full p-1.5 border-2 border-[#1c1c19] text-xs focus:outline-none" 
                              placeholder="Descripción"
                            />
                          </td>
                          <td className="p-3 flex justify-center gap-2">
                            <button onClick={handleSave} className="p-1 text-[#0f4369] hover:bg-white border-2 border-transparent hover:border-[#1c1c19] transition-all bg-white" title="Guardar">
                              <Save size={14} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1 text-[#1c1c19] hover:bg-white border-2 border-transparent hover:border-[#1c1c19] transition-all bg-white" title="Cancelar">
                              <X size={14} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="p-3 border-r-2 border-[#1c1c19] font-bold text-sm flex items-center gap-2">
                            <span className="text-[#0f4369] flex items-center gap-2">
                              <Check size={14} className="opacity-50" /> {specialty.name}
                            </span>
                            {!specialty.project_id && (
                              <span className="bg-gray-200 text-gray-600 px-1.5 py-0.5 text-[8px] font-black tracking-widest uppercase border border-gray-400 rounded-sm">Global</span>
                            )}
                          </td>
                          <td className="p-3 border-r-2 border-[#1c1c19] font-bold text-xs uppercase text-center bg-[#e8e4df]">
                            {specialty.abbreviation || '-'}
                          </td>
                          <td className="p-3 border-r-2 border-[#1c1c19] text-xs text-[#72777f]">
                            {specialty.responsible_name ? (
                              <span className="bg-[#e8e4df] px-2 py-1 text-black font-bold border border-[#1c1c19]">
                                {specialty.responsible_name}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-3 border-r-2 border-[#1c1c19] text-xs text-[#72777f]">
                            {specialty.description || '-'}
                          </td>
                          <td className="p-3 flex justify-center gap-2">
                            <button onClick={() => startEdit(specialty)} className="p-1 text-[#0f4369] hover:bg-white border-2 border-transparent hover:border-[#1c1c19] transition-all" title="Editar">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDelete(specialty.id)} className="p-1 text-red-600 hover:bg-white border-2 border-transparent hover:border-[#1c1c19] transition-all" title="Eliminar">
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
