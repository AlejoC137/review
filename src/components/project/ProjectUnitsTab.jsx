import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { Save, Edit2, Loader2, Info, LayoutGrid, TableProperties, X } from 'lucide-react';

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
  const { isAdmin, isBimManager } = useAuth();
  const canEdit = isAdmin || isBimManager;

  const [unitsInfo, setUnitsInfo] = useState(defaultUnits);
  const [originalUnits, setOriginalUnits] = useState(defaultUnits);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('table'); // 'cards' or 'table'

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
        const merged = { ...defaultUnits, ...data };
        setUnitsInfo(merged);
        setOriginalUnits(merged);
      } else {
        const local = localStorage.getItem(localKey);
        if (local) {
          const parsed = { ...defaultUnits, ...JSON.parse(local) };
          setUnitsInfo(parsed);
          setOriginalUnits(parsed);
        }
      }
    } catch (err) {
      console.warn("Using local fallback for units info:", err);
      const local = localStorage.getItem(localKey);
      if (local) {
        const parsed = { ...defaultUnits, ...JSON.parse(local) };
        setUnitsInfo(parsed);
        setOriginalUnits(parsed);
      }
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
      setOriginalUnits(unitsInfo);
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving units:", err);
      alert("Guardado temporalmente en la memoria del navegador (base de datos no configurada).");
      setOriginalUnits(unitsInfo);
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setUnitsInfo(originalUnits);
    setIsEditing(false);
  };

  const handleChange = (field, value) => {
    setUnitsInfo(prev => ({ ...prev, [field]: value }));
  };

  const parseUnit = (unitString) => {
    if (!unitString) return { name: '', symbol: '' };
    const match = unitString.match(/(.*?)\s*\((.*?)\)/);
    if (match) {
      return { name: match[1].trim(), symbol: match[2].trim() };
    }
    return { name: unitString, symbol: '' };
  };

  if (loading && !unitsInfo) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="animate-spin text-[#0f4369]" size={24} />
      </div>
    );
  }

  const dimensions = [
    { key: 'length', label: 'LONGITUD', unitKey: 'length_unit', precKey: 'length_precision' },
    { key: 'area', label: 'ÁREA', unitKey: 'area_unit', precKey: 'area_precision' },
    { key: 'volume', label: 'VOLUMEN', unitKey: 'volume_unit', precKey: 'volume_precision' },
    { key: 'angle', label: 'ÁNGULO', unitKey: 'angle_unit', precKey: 'angle_precision' },
    { key: 'slope', label: 'PENDIENTE', unitKey: 'slope_unit', precKey: 'slope_precision' },
  ];

  return (
    <div className="bg-white border-2 border-[#1c1c19] p-8 shadow-[6px_6px_0_0_rgba(28,28,25,1)]">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-[#1c1c19]/10 pb-4 mb-6 gap-4">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-[#1c1c19]">Unidades de Medida y Formatos</h3>
          <p className="text-[10px] uppercase text-[#72777f] font-bold tracking-widest mt-1">
            Configuración de precisiones y excepciones para el proyecto
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-[#f6f3ee] border-2 border-[#1c1c19] p-1 shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 transition-colors ${viewMode === 'table' ? 'bg-[#1c1c19] text-white' : 'text-[#72777f] hover:text-[#1c1c19]'}`}
              title="Vista de Tabla"
            >
              <TableProperties size={16} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 transition-colors ${viewMode === 'cards' ? 'bg-[#1c1c19] text-white' : 'text-[#72777f] hover:text-[#1c1c19]'}`}
              title="Vista de Tarjetas"
            >
              <LayoutGrid size={16} />
            </button>
          </div>

          {canEdit && (
            !isEditing ? (
              <button
                onClick={() => { setOriginalUnits(unitsInfo); setIsEditing(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-black text-[9px] uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
              >
                <Edit2 size={12} /> Editar
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-black text-[9px] uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <X size={12} /> Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-black text-[9px] uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all disabled:opacity-50"
                >
                  {loading ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Guardar
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="overflow-x-auto border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,1)] mb-6">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-[#fcf9f4] border-b-2 border-[#1c1c19]">
                <th className="p-3 text-[10px] font-black uppercase text-[#72777f] border-r-2 border-[#1c1c19]/20 w-1/4">Dimensión</th>
                <th className="p-3 text-[10px] font-black uppercase text-[#72777f] border-r-2 border-[#1c1c19]/20 w-1/4">Unidad</th>
                <th className="p-3 text-[10px] font-black uppercase text-[#72777f] border-r-2 border-[#1c1c19]/20 w-1/4 text-center">Símbolo</th>
                <th className="p-3 text-[10px] font-black uppercase text-[#72777f] w-1/4 text-center">Precisión</th>
              </tr>
            </thead>
            <tbody>
              {dimensions.map((dim, idx) => {
                const { name, symbol } = parseUnit(unitsInfo[dim.unitKey]);
                return (
                  <tr key={dim.key} className={`border-b border-[#1c1c19]/10 ${idx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]/50'} hover:bg-[#f6f3ee] transition-colors`}>
                    <td className="p-3 text-xs font-black text-[#1c1c19] border-r border-[#1c1c19]/10">
                      {dim.label}
                    </td>
                    <td className="p-3 border-r border-[#1c1c19]/10">
                      {isEditing ? (
                        <input
                          type="text"
                          value={unitsInfo[dim.unitKey]}
                          onChange={(e) => handleChange(dim.unitKey, e.target.value)}
                          className="w-full p-1.5 bg-white border border-[#1c1c19] text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#0f4369]"
                        />
                      ) : (
                        <span className="text-xs font-semibold text-slate-700">{name || unitsInfo[dim.unitKey]}</span>
                      )}
                    </td>
                    <td className="p-3 border-r border-[#1c1c19]/10 text-center">
                      {!isEditing && <span className="inline-block px-2 py-0.5 bg-[#1c1c19]/5 text-[#1c1c19] text-xs font-bold rounded">{symbol || '-'}</span>}
                      {isEditing && <span className="text-[10px] text-slate-400 font-medium italic">(Extraído auto.)</span>}
                    </td>
                    <td className="p-3 text-center">
                      {isEditing ? (
                        <input
                          type="number"
                          min="0"
                          max="5"
                          value={unitsInfo[dim.precKey]}
                          onChange={(e) => handleChange(dim.precKey, parseInt(e.target.value) || 0)}
                          className="w-16 p-1.5 mx-auto bg-white border border-[#1c1c19] text-xs font-bold focus:outline-none text-center"
                        />
                      ) : (
                        <span className="text-xs font-bold text-[#1c1c19]">{unitsInfo[dim.precKey] != null ? unitsInfo[dim.precKey] : '-'}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
          <div className="space-y-4">
            {dimensions.slice(0, 3).map((dim) => (
              <div key={dim.key} className="p-4 bg-[#fcf9f4] border border-[#1c1c19]/20">
                <label className="text-[10px] font-black uppercase text-[#72777f] block mb-2">{dim.label}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={unitsInfo[dim.unitKey]}
                    onChange={e => handleChange(dim.unitKey, e.target.value)}
                    disabled={!isEditing}
                    className="flex-1 p-2 bg-white border border-[#1c1c19] text-sm font-bold disabled:bg-transparent disabled:border-transparent"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#72777f]">Precisión:</span>
                    <input 
                      type="number" 
                      min="0" max="5"
                      value={unitsInfo[dim.precKey]}
                      onChange={e => handleChange(dim.precKey, parseInt(e.target.value) || 0)}
                      disabled={!isEditing}
                      className="w-16 p-2 bg-white border border-[#1c1c19] text-sm font-bold disabled:bg-transparent disabled:border-transparent text-center"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            {dimensions.slice(3).map((dim) => (
              <div key={dim.key} className="p-4 bg-[#fcf9f4] border border-[#1c1c19]/20">
                <label className="text-[10px] font-black uppercase text-[#72777f] block mb-2">{dim.label}</label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={unitsInfo[dim.unitKey]}
                    onChange={e => handleChange(dim.unitKey, e.target.value)}
                    disabled={!isEditing}
                    className="flex-1 p-2 bg-white border border-[#1c1c19] text-sm font-bold disabled:bg-transparent disabled:border-transparent"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#72777f]">Precisión:</span>
                    <input 
                      type="number" 
                      min="0" max="5"
                      value={unitsInfo[dim.precKey]}
                      onChange={e => handleChange(dim.precKey, parseInt(e.target.value) || 0)}
                      disabled={!isEditing}
                      className="w-16 p-2 bg-white border border-[#1c1c19] text-sm font-bold disabled:bg-transparent disabled:border-transparent text-center"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Excepciones MEP - Visible en ambos modos */}
      <div className="p-4 bg-[#f6f3ee] border-2 border-[#1c1c19]/20 flex items-start gap-3">
        <Info className="text-[#0f4369] mt-0.5 shrink-0" size={18} />
        <div className="flex-1">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
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
            *Excepción: Los elementos que por su presentación comercial manejen otro tipo de unidades podrán conservar las mismas en los modelos BIM. Ejemplo: Tuberías, Ductos, Perfiles metálicos (Su sección transversal se maneja habitualmente en sistema imperial).
          </p>
        </div>
      </div>

    </div>
  );
}

