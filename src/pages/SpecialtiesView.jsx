import React, { useState, useEffect } from 'react';
import { 
  Database, Plus, Trash2, Edit2, Check, Loader2, Bot, 
  X, AlertCircle, Save 
} from 'lucide-react';
import { projectService } from '../services/projectService';
import { useAuth } from '../context/AuthContext';
import { PROMPTS } from '../config/aiPrompts';

// Simple dictionary to translate common Spanish specialties to English to get the 3-letter abbreviation
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
  return dictionary[lowerName] || lowerName; // fallback to lowercase original if not found
};

const generateAbbreviation = (name) => {
  if (!name) return '';
  const englishName = translateToEnglish(name);
  
  // Return first 3 letters capitalized
  return englishName.substring(0, 3).toUpperCase();
};

export default function SpecialtiesView({ projectId = null }) {
  const { isAdmin, isBimManager } = useAuth();
  const canEdit = isAdmin || (projectId && isBimManager);
  const [specialties, setSpecialties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [form, setForm] = useState({ name: '', abbreviation: '', description: '' });

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const fetchSpecialties = async () => {
    try {
      setLoading(true);
      const data = await projectService.getSpecialties(projectId);
      setSpecialties(data || []);
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
      // Only auto-generate if user hasn't manually changed the abbreviation yet
      // Or if it's empty, we auto fill it
      if (!prev.abbreviation || prev.abbreviation === generateAbbreviation(prev.name)) {
          updated.abbreviation = generateAbbreviation(newName);
      }
      return updated;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingId) {
        await projectService.updateSpecialty(editingId, form);
      } else {
        await projectService.createSpecialty({ ...form, project_id: projectId });
      }
      setForm({ name: '', abbreviation: '', description: '' });
      setIsAdding(false);
      setEditingId(null);
      fetchSpecialties();
    } catch (error) {
      console.error("Error saving specialty:", error);
      alert("Error al guardar la Especialidad. Asegúrese de haber ejecutado el script SQL para actualizar la tabla.");
    }
  };

  const handleEdit = (specialty) => {
    setForm({ 
      name: specialty.name, 
      abbreviation: specialty.abbreviation || generateAbbreviation(specialty.name),
      description: specialty.description || '' 
    });
    setEditingId(specialty.id);
    setIsAdding(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Está seguro de eliminar esta Especialidad?')) return;
    try {
      // Assuming you have deleteSpecialty or just direct supabase call in projectService
      // if not, we can call it here, but let's assume it exists or use supabase directly:
      // await projectService.deleteSpecialty(id);
      
      const { supabase } = await import('../services/supabaseClient');
      const { error } = await supabase.from('specialties').delete().eq('id', id);
      if (error) throw error;
      
      fetchSpecialties();
    } catch (error) {
      console.error("Error deleting specialty:", error);
      alert("Error al eliminar la especialidad.");
    }
  };

  const renderForm = () => (
    <div className="bg-white border-2 border-[#1c1c19] p-4 mb-6 shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-black uppercase italic tracking-tight text-[#0f4369]">
          {editingId ? 'Editar Especialidad' : 'Nueva Especialidad'}
        </h3>
        <button onClick={() => { setIsAdding(false); setEditingId(null); setForm({ name: '', abbreviation: '', description: '' }); }} className="text-gray-500 hover:text-[#1c1c19]">
          <X size={16} />
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
        <div className="md:col-span-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Nombre</label>
          <input
            type="text"
            className="w-full text-xs p-2 border-2 border-[#1c1c19] focus:outline-none focus:ring-0"
            placeholder="Ej. Arquitectura"
            value={form.name}
            onChange={handleNameChange}
          />
        </div>
        <div className="md:col-span-1">
          <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Diminutivo</label>
          <input
            type="text"
            className="w-full text-xs p-2 border-2 border-[#1c1c19] focus:outline-none focus:ring-0 uppercase"
            placeholder="Ej. ARC"
            maxLength={10}
            value={form.abbreviation}
            onChange={(e) => setForm({ ...form, abbreviation: e.target.value.toUpperCase() })}
          />
        </div>
        <div className="md:col-span-4">
          <label className="text-[10px] font-black uppercase tracking-wider text-gray-500 block mb-1">Descripción</label>
          <textarea
            className="w-full text-xs p-2 border-2 border-[#1c1c19] focus:outline-none focus:ring-0 min-h-[60px]"
            placeholder="Descripción opcional..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={() => { setIsAdding(false); setEditingId(null); setForm({ name: '', abbreviation: '', description: '' }); }} className="px-4 py-2 text-xs font-bold uppercase border-2 border-[#1c1c19] hover:bg-gray-100 transition-colors">
          Cancelar
        </button>
        <button onClick={handleSave} className="px-4 py-2 text-xs font-bold uppercase bg-[#1c1c19] text-white hover:bg-[#0f4369] transition-colors flex items-center gap-2 shadow-[2px_2px_0_0_rgba(15,67,105,1)]">
          <Save size={14} /> Guardar
        </button>
      </div>
    </div>
  );

  return (
    <div className="p-8 max-w-6xl mx-auto h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 pb-4 border-b-4 border-[#1c1c19]">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#0f4369] text-white flex items-center justify-center border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
            <Database size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-[#1c1c19]">
              Catálogo de Especialidades
            </h1>
            <p className="text-xs font-mono uppercase text-[#72777f]">
              Administra las especialidades globales del sistema
            </p>
          </div>
        </div>
        
        {canEdit && !isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#00ff9d] text-[#1c1c19] border-2 border-[#1c1c19] font-black uppercase text-[10px] tracking-widest shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_rgba(28,28,25,1)] transition-all"
          >
            <Plus size={14} /> Nueva Especialidad
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-[#0f4369]" size={32} />
          </div>
        ) : (
          <>
            {isAdding && renderForm()}

            {specialties.length === 0 && !isAdding ? (
              <div className="text-center py-12 bg-white border-2 border-dashed border-gray-300">
                <Database className="mx-auto text-gray-400 mb-4" size={32} />
                <p className="text-gray-500 font-mono text-sm">No hay Especialidades registradas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {specialties.map(spec => (
                  <div key={spec.id} className="bg-white border-2 border-[#1c1c19] p-4 flex flex-col group hover:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-black text-sm uppercase text-[#1c1c19]">{spec.name}</h4>
                      {spec.abbreviation && (
                        <span className="bg-[#e8e4df] text-[#1c1c19] px-2 py-0.5 text-[9px] font-black border border-[#1c1c19]">
                          {spec.abbreviation}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-3 flex-1 mb-4">
                      {spec.description || 'Sin descripción'}
                    </p>
                    
                    {canEdit && (
                      <div className="flex justify-end gap-2 mt-auto pt-3 border-t border-dashed border-gray-300 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(spec)} className="p-1.5 text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-200 transition-colors" title="Editar">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(spec.id)} className="p-1.5 text-red-600 hover:bg-red-50 border border-transparent hover:border-red-200 transition-colors" title="Eliminar">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
