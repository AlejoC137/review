import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Save, Edit2, Loader2, Info } from 'lucide-react';

const defaultUnits = {
  length_unit: 'Metros (m)',
  length_precision: 2,
  area_unit: 'Metros cuadrados (m2)',
  area_precision: 2,
  volume_unit: 'Metros cúbicos (m3)',
  volume_precision: 2,
  angle_unit: 'Grados (°)',
  angle_precision: 1,
  slope_unit: 'Porcentaje (%)',
  slope_precision: 1,
  mep_exceptions: true
};

export default function ProjectUnitsTab({ project }) {
  const [unitsInfo, setUnitsInfo] = useState(defaultUnits);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUnits();
  }, [project?.id]);

  const fetchUnits = async () => {
    if (!project?.id) return;
    setLoading(true);
    const localKey = `project_units_${project.id}`;
    try {
      const { data, error } = await supabase
        .from('project_units')
        .select('*')
        .eq('project_id', project.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        setUnitsInfo(data);
      } else {
        const local = localStorage.getItem(localKey);
        if (local) setUnitsInfo(JSON.parse(local));
      }
    } catch (err) {
      console.warn("Using local fallback for units info:", err);
      const local = localStorage.getItem(localKey);
      if (local) setUnitsInfo(JSON.parse(local));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!project?.id) return;
    setLoading(true);
    const payload = {
      project_id: project.id,
      ...unitsInfo,
      updated_at: new Date().toISOString()
    };

    localStorage.setItem(`project_units_${project.id}`, JSON.stringify(payload));

    try {
      const { error } = await supabase
        .from('project_units')
        .upsert(payload, { onConflict: 'project_id' });
      
      if (error) throw error;
      alert("Unidades de medida actualizadas exitosamente.");
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving units:", err);
      alert("Guardado temporalmente en la memoria del navegador (base de datos no configurada).");
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setUnitsInfo(prev => ({ ...prev, [field]: value }));
  };

  if (loading && !unitsInfo) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-[#0f4369]" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-white border-2 border-[#1c1c19] p-8 shadow-[6px_6px_0_0_rgba(28,28,25,1)]">
      <div className="flex justify-between items-center border-b-2 border-[#1c1c19]/10 pb-4 mb-6">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-[#1c1c19]">Unidades de Medida y Formatos</h3>
          <p className="text-[10px] uppercase text-[#72777f] font-bold tracking-widest mt-1">
            Configuración de precisiones y excepciones para el proyecto
          </p>
        </div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Longitud */}
        <div className="space-y-4">
          <div className="p-4 bg-[#fcf9f4] border border-[#1c1c19]/20">
            <label className="text-[10px] font-black uppercase text-[#72777f] block mb-2">Longitud</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={unitsInfo.length_unit}
                onChange={e => handleChange('length_unit', e.target.value)}
                disabled={!isEditing}
                className="flex-1 p-2 bg-white border border-[#1c1c19] text-sm font-bold disabled:bg-transparent disabled:border-transparent"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#72777f]">Precisión:</span>
                <input 
                  type="number" 
                  min="0" max="5"
                  value={unitsInfo.length_precision}
                  onChange={e => handleChange('length_precision', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="w-16 p-2 bg-white border border-[#1c1c19] text-sm font-bold disabled:bg-transparent disabled:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Área */}
          <div className="p-4 bg-[#fcf9f4] border border-[#1c1c19]/20">
            <label className="text-[10px] font-black uppercase text-[#72777f] block mb-2">Área</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={unitsInfo.area_unit}
                onChange={e => handleChange('area_unit', e.target.value)}
                disabled={!isEditing}
                className="flex-1 p-2 bg-white border border-[#1c1c19] text-sm font-bold disabled:bg-transparent disabled:border-transparent"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#72777f]">Precisión:</span>
                <input 
                  type="number" 
                  min="0" max="5"
                  value={unitsInfo.area_precision}
                  onChange={e => handleChange('area_precision', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="w-16 p-2 bg-white border border-[#1c1c19] text-sm font-bold disabled:bg-transparent disabled:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Volumen */}
          <div className="p-4 bg-[#fcf9f4] border border-[#1c1c19]/20">
            <label className="text-[10px] font-black uppercase text-[#72777f] block mb-2">Volumen</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={unitsInfo.volume_unit}
                onChange={e => handleChange('volume_unit', e.target.value)}
                disabled={!isEditing}
                className="flex-1 p-2 bg-white border border-[#1c1c19] text-sm font-bold disabled:bg-transparent disabled:border-transparent"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#72777f]">Precisión:</span>
                <input 
                  type="number" 
                  min="0" max="5"
                  value={unitsInfo.volume_precision}
                  onChange={e => handleChange('volume_precision', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="w-16 p-2 bg-white border border-[#1c1c19] text-sm font-bold disabled:bg-transparent disabled:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {/* Ángulo */}
          <div className="p-4 bg-[#fcf9f4] border border-[#1c1c19]/20">
            <label className="text-[10px] font-black uppercase text-[#72777f] block mb-2">Ángulo</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={unitsInfo.angle_unit}
                onChange={e => handleChange('angle_unit', e.target.value)}
                disabled={!isEditing}
                className="flex-1 p-2 bg-white border border-[#1c1c19] text-sm font-bold disabled:bg-transparent disabled:border-transparent"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#72777f]">Precisión:</span>
                <input 
                  type="number" 
                  min="0" max="5"
                  value={unitsInfo.angle_precision}
                  onChange={e => handleChange('angle_precision', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="w-16 p-2 bg-white border border-[#1c1c19] text-sm font-bold disabled:bg-transparent disabled:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Pendiente */}
          <div className="p-4 bg-[#fcf9f4] border border-[#1c1c19]/20">
            <label className="text-[10px] font-black uppercase text-[#72777f] block mb-2">Pendiente</label>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={unitsInfo.slope_unit}
                onChange={e => handleChange('slope_unit', e.target.value)}
                disabled={!isEditing}
                className="flex-1 p-2 bg-white border border-[#1c1c19] text-sm font-bold disabled:bg-transparent disabled:border-transparent"
              />
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#72777f]">Precisión:</span>
                <input 
                  type="number" 
                  min="0" max="5"
                  value={unitsInfo.slope_precision}
                  onChange={e => handleChange('slope_precision', parseInt(e.target.value))}
                  disabled={!isEditing}
                  className="w-16 p-2 bg-white border border-[#1c1c19] text-sm font-bold disabled:bg-transparent disabled:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Excepciones MEP */}
          <div className="p-4 bg-[#f6f3ee] border-2 border-[#1c1c19]/20 flex items-start gap-3 mt-4">
            <Info className="text-[#0f4369] mt-0.5 shrink-0" size={18} />
            <div className="flex-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={unitsInfo.mep_exceptions}
                  onChange={e => handleChange('mep_exceptions', e.target.checked)}
                  disabled={!isEditing}
                  className="w-4 h-4 accent-[#0f4369] cursor-pointer"
                />
                <span className="text-[11px] font-black uppercase tracking-wide text-[#1c1c19]">Permitir excepciones puntuales MEP</span>
              </label>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed font-medium">
                Se admiten excepciones para elementos MEP (como tuberías y conductos), cuyas dimensiones podrán representarse en sistema imperial si su presentación comercial así lo exige.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
