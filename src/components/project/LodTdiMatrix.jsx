import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle, ChevronDown, RotateCcw,
  Search, ListFilter, AlertCircle, Loader2, CheckCircle2,
  Table as TableIcon, X, Plus, Edit2, Trash2, Save
} from 'lucide-react';
import { projectService } from '../../services/projectService';

/* ─── Static data ──────────────────────────────────────────── */
const DISCIPLINE_ELEMENTS = [
  { discipline: 'Espacial', element: 'Ejes', defLods: { esq: 200, ant: 300, proy: 350 } },
  { discipline: 'Espacial', element: 'Niveles', defLods: { esq: 200, ant: 300, proy: 350 } },
  { discipline: 'Espacial', element: 'Zonas', defLods: { esq: 200, ant: 300, proy: 350 } },
  { discipline: 'Espacial', element: 'Espacios, habitaciones', defLods: { esq: 200, ant: 300, proy: 350 } },
  { discipline: 'Sitio', element: 'Topografía', defLods: { esq: 200, ant: 300, proy: 350 } },
  { discipline: 'Sitio', element: 'Excavación', defLods: { esq: 200, ant: 300, proy: 350 } },
  { discipline: 'Cimentación', element: 'Zapatas', defLods: { esq: 200, ant: 300, proy: 350 } },
  { discipline: 'Cimentación', element: 'Muros de contención', defLods: { esq: 200, ant: 300, proy: 350 } },
  { discipline: 'Cimentación', element: 'Pilotes', defLods: { esq: 200, ant: 300, proy: 350 } },
  { discipline: 'Estructura', element: 'Losas', defLods: { esq: 200, ant: 300, proy: 350 } },
  { discipline: 'Estructura', element: 'Vigas', defLods: { esq: 200, ant: 300, proy: 350 } },
  { discipline: 'Estructura', element: 'Columnas', defLods: { esq: 200, ant: 300, proy: 350 } },
  { discipline: 'Estructura', element: 'Muros', defLods: { esq: 200, ant: 300, proy: 350 } },
  { discipline: 'Estructura', element: 'Escaleras', defLods: { esq: 200, ant: 300, proy: 350 } },
  { discipline: 'Envolvente', element: 'Cubierta', defLods: { esq: 300, ant: 300, proy: 350 } },
  { discipline: 'Envolvente', element: 'Ventanas', defLods: { esq: 300, ant: 300, proy: 350 } },
  { discipline: 'Envolvente', element: 'Puertas, aberturas', defLods: { esq: 300, ant: 300, proy: 350 } },
  { discipline: 'Interiorismo', element: 'Particiones', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Interiorismo', element: 'Puertas, aberturas', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Interiorismo', element: 'Falso techo', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Interiorismo', element: 'Pisos', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Interiorismo', element: 'Mobiliario', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Plomería', element: 'Tuberías', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Plomería', element: 'Accesorios', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Plomería', element: 'Equipos', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Plomería', element: 'Mobiliario', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Eléctrica y Comunicación', element: 'Tuberías', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Eléctrica y Comunicación', element: 'Accesorios', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Eléctrica y Comunicación', element: 'Cables', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Eléctrica y Comunicación', element: 'Luminarias', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Eléctrica y Comunicación', element: 'Equipos', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Seguridad y Control', element: 'Tuberías', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Seguridad y Control', element: 'Accesorios', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Seguridad y Control', element: 'Cables', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Seguridad y Control', element: 'Luminarias', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'Seguridad y Control', element: 'Equipos', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'HVAC', element: 'Tubería', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'HVAC', element: 'Accesorios', defLods: { esq: '', ant: 300, proy: 350 } },
  { discipline: 'HVAC', element: 'Equipos', defLods: { esq: '', ant: 300, proy: 350 } },
];

const LOD_OPTIONS = [
  { val: '', label: '-' },
  { val: 100, label: '100' },
  { val: 200, label: '200' },
  { val: 300, label: '300' },
  { val: 350, label: '350' },
  { val: 400, label: '400' },
];

const TDI_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'];

const TDI_MAPPING = {
  100: ['A','B','C','F','G','H','I','J','K','L','N'],
  200: ['A','B','C','D','F','G','H','I','J','K','L','N'],
  300: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'],
  350: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N'],
  400: ['A','B','C','D','E','F','G','H','I','J','K','L','M','N']
};

/* ─── Componentes Hijos ────────────────────────── */

function PhaseCell({ data, onChange, disciplineColor }) {
  return (
    <div className={`flex flex-col w-full h-full border border-[#1c1c19]/10 overflow-hidden group focus-within:border-[#0f4369] focus-within:ring-1 focus-within:ring-[#0f4369] transition-colors ${disciplineColor}`}>
      <input
        type="text"
        value={data.aem || ''}
        onChange={e => onChange({ ...data, aem: e.target.value })}
        placeholder="AEM"
        className="w-full px-1.5 pt-1 pb-0.5 text-[9px] font-bold border-none border-b border-[#1c1c19]/10 focus:ring-0 focus:outline-none bg-transparent text-[#1c1c19] placeholder:text-gray-300 placeholder:italic"
      />
      <select 
        value={data.lod} 
        onChange={e => onChange({ ...data, lod: e.target.value === '' ? '' : parseInt(e.target.value, 10) })}
        className={`w-full px-1.5 pb-1 text-[11px] font-mono font-black border-none focus:ring-0 focus:outline-none cursor-pointer appearance-none text-center bg-transparent ${data.lod ? 'text-[#0f4369]' : 'text-gray-400'}`}
      >
        {LOD_OPTIONS.map(opt => (
          <option key={opt.val} value={opt.val}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function TdiReferenceModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#fcf9f4]/95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border-4 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(28,28,25,0.2)] w-full max-w-4xl my-8 flex flex-col">
        <div className="p-4 border-b-2 border-[#1c1c19] bg-[#1c1c19] text-white flex justify-between items-center">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <TableIcon size={16} /> Matriz Referencial TDI por Nivel LOD
          </h3>
          <button onClick={onClose} className="hover:text-red-400 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-center border-collapse border-2 border-[#1c1c19]">
            <thead>
              <tr className="bg-[#f6f3ee] border-b-2 border-[#1c1c19]">
                <th className="p-2 border-r-2 border-[#1c1c19] font-black text-xs">NIVEL LOD</th>
                {TDI_LETTERS.map(l => (
                  <th key={l} className="p-2 border-r border-[#1c1c19]/20 font-mono font-bold text-xs">{l}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[100, 200, 300, 400].map(lod => {
                const activeSet = TDI_MAPPING[lod] || [];
                return (
                  <tr key={lod} className="border-b border-[#1c1c19]/20">
                    <td className="p-2 border-r-2 border-[#1c1c19] font-black text-sm text-[#0f4369]">LOD {lod}</td>
                    {TDI_LETTERS.map(l => {
                      const isActive = activeSet.includes(l);
                      return (
                        <td key={l} className="p-2 border-r border-[#1c1c19]/20">
                          {isActive ? (
                            <div className="w-3 h-3 rounded-full bg-red-500 mx-auto shadow-[1px_1px_0_0_rgba(0,0,0,1)]" title="Aplica"></div>
                          ) : (
                            <span className="text-[10px] text-gray-300 font-black">N/A</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="mt-4 text-[10px] text-gray-500 font-bold uppercase tracking-wider">
            * El punto rojo indica que el requerimiento de información TDI es exigible para dicho nivel LOD según el estándar del proyecto. El TDI del nivel 350 es idéntico al 300.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Funciones Utilitarias ────────────────────────── */

const getPhaseColor = (discipline, lod) => {
  // If no LOD is defined, the cell is inactive, so keep it transparent or a default empty state color
  if (!lod) return 'bg-transparent';

  if (['Espacial', 'Sitio', 'Envolvente', 'Interiorismo'].includes(discipline)) {
    return 'bg-[#bfd4e7]'; // Arquitectura (Light Blue)
  }
  if (['Cimentación', 'Estructura'].includes(discipline)) {
    return 'bg-[#d6e3c8]'; // Estructura (Light Green)
  }
  if (['Plomería', 'Eléctrica y Comunicación', 'Seguridad y Control', 'HVAC'].includes(discipline)) {
    return 'bg-[#f4e29e]'; // MEP (Light Yellow)
  }
  
  return 'bg-[#a3a3a3]'; // Otras (Gray)
};

const parseNotes = (notesString, defaultLods) => {
  const def = {
    esquema: { aem: '', lod: defaultLods?.esq || '' },
    anteproyecto: { aem: '', lod: defaultLods?.ant || '' },
    finales: { aem: '', lod: defaultLods?.proy || '' },
    text: '',
    abbreviation: ''
  };

  if (!notesString) return def;

  try {
    if (notesString.trim().startsWith('{')) {
      const parsed = JSON.parse(notesString);
      return {
        esquema: parsed.esquema || def.esquema,
        anteproyecto: parsed.anteproyecto || def.anteproyecto,
        finales: parsed.finales || def.finales,
        text: parsed.text || '',
        abbreviation: parsed.abbreviation || ''
      };
    }
  } catch (e) {}

  // Legacy fallback
  return { ...def, text: notesString };
};

const serializeNotes = (dataObj) => {
  return JSON.stringify(dataObj);
};

/* ─── Main Component ───────────────────────────────────────── */
export default function LodTdiMatrix({ projectId }) {
  const [loading, setLoading] = useState(true);
  const [savingState, setSavingState] = useState('saved');
  const [matrixData, setMatrixData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const [showTdiModal, setShowTdiModal] = useState(false);
  const [projectElements, setProjectElements] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [form, setForm] = useState({ discipline: '', element: '', oldDiscipline: '', oldElement: '' });

  const disciplines = ['all', ...new Set(projectElements.map(e => e.discipline))];

  useEffect(() => {
    const fetchMatrix = async () => {
      if (!projectId) return;
      setLoading(true);
      const localKey = `peb_lod_tdi_matrix_${projectId}`;
      const localSaved = localStorage.getItem(localKey);
      try {
        let data = await projectService.getLodTdiMatrix(projectId);
        if (!data || data.length === 0) {
          const payload = DISCIPLINE_ELEMENTS.map(el => ({
             discipline: el.discipline,
             element_name: el.element,
             lod: 0,
             tdi: [],
             notes: serializeNotes(parseNotes('', el.defLods))
          }));
          await projectService.saveLodTdiMatrixBatch(projectId, payload);
          data = await projectService.getLodTdiMatrix(projectId);
        }
        
        const map = {};
        const elementsList = [];
        data.forEach(item => {
          const staticEl = DISCIPLINE_ELEMENTS.find(de => de.discipline === item.discipline && de.element === item.element_name);
          elementsList.push({ discipline: item.discipline, element: item.element_name, isCustom: !staticEl });
          map[`${item.discipline}::${item.element_name}`] = {
            parsed: parseNotes(item.notes, staticEl?.defLods),
            rawLod: item.lod
          };
        });
        setProjectElements(elementsList);
        setMatrixData(map);
        setSavingState('saved');
      } catch (err) {
        console.warn('Matrix fetch fallback:', err.message);
        if (localSaved) { 
           setMatrixData(JSON.parse(localSaved)); 
           setProjectElements(DISCIPLINE_ELEMENTS);
           setSavingState('local'); 
        }
      } finally {
        setLoading(false);
      }
    };
    fetchMatrix();
  }, [projectId]);

  const handleUpdate = async (discipline, element, field, subfield, value) => {
    const itemKey = `${discipline}::${element}`;
    const staticEl = DISCIPLINE_ELEMENTS.find(de => de.discipline === discipline && de.element === element);
    
    // Get current or initialize with defaults
    const currentData = matrixData[itemKey] || { parsed: parseNotes('', staticEl?.defLods) };
    
    // Create updated parsed object
    let updatedParsed = { ...currentData.parsed };
    if (field === 'text' || field === 'abbreviation') {
      updatedParsed[field] = value;
    } else if (subfield === null) {
      // PhaseCell passes the whole phase object (e.g. { aem, lod }) — replace directly
      updatedParsed[field] = { ...(updatedParsed[field] || {}), ...value };
    } else {
      updatedParsed[field] = { ...(updatedParsed[field] || {}), [subfield]: value };
    }

    // Determine max LOD for the legacy 'lod' column just for DB consistency
    const maxLod = Math.max(
      updatedParsed.esquema?.lod || 0,
      updatedParsed.anteproyecto?.lod || 0,
      updatedParsed.finales?.lod || 0
    );
    const finalLod = maxLod === 0 ? 100 : maxLod;

    const nextMatrixData = {
      ...matrixData,
      [itemKey]: { parsed: updatedParsed, rawLod: finalLod }
    };
    
    setMatrixData(nextMatrixData);
    localStorage.setItem(`peb_lod_tdi_matrix_${projectId}`, JSON.stringify(nextMatrixData));
    setSavingState('saving');
    
    try {
      // Serialize to store in 'notes' column. Leave 'tdi' empty since it's standard.
      await projectService.saveLodTdiElement(
        projectId, 
        discipline, 
        element, 
        finalLod, 
        [], 
        serializeNotes(updatedParsed)
      );
      setSavingState('saved');
    } catch (err) { 
      console.warn('LOD save error:', err);
      setSavingState('local'); 
    }
  };

  const handleResetAll = () => {
    if (!window.confirm('¿Reiniciar toda la matriz LOD? Se perderán todos los datos ingresados.')) return;
    localStorage.removeItem(`peb_lod_tdi_matrix_${projectId}`);
    setMatrixData({});
    setSavingState('saved');
    alert('Matriz reiniciada. Recarga la página para restaurar los elementos por defecto.');
  };

  const handleSaveElement = async () => {
    if (!form.discipline.trim() || !form.element.trim()) return;
    try {
      setSavingState('saving');
      const itemKey = `${form.discipline}::${form.element}`;
      
      if (form.oldDiscipline && form.oldElement) {
        await projectService.updateLodTdiElementName(projectId, form.oldDiscipline, form.oldElement, form.discipline, form.element);
        setProjectElements(prev => prev.map(e => 
          (e.discipline === form.oldDiscipline && e.element === form.oldElement) 
            ? { ...e, discipline: form.discipline, element: form.element }
            : e
        ));
        setMatrixData(prev => {
           const newData = { ...prev };
           const oldData = newData[`${form.oldDiscipline}::${form.oldElement}`];
           if (oldData) {
              newData[itemKey] = oldData;
              delete newData[`${form.oldDiscipline}::${form.oldElement}`];
           }
           return newData;
        });
      } else {
        await projectService.saveLodTdiElement(projectId, form.discipline, form.element, 100, [], serializeNotes(parseNotes('')));
        setProjectElements(prev => [...prev, { discipline: form.discipline, element: form.element, isCustom: true }]);
        setMatrixData(prev => ({ ...prev, [itemKey]: { parsed: parseNotes(''), rawLod: 100 } }));
      }
      setIsAdding(false);
      setForm({ discipline: '', element: '', oldDiscipline: '', oldElement: '' });
      setSavingState('saved');
    } catch (e) {
      console.error(e);
      alert('Error al guardar el elemento');
      setSavingState('local');
    }
  };

  const handleDeleteElement = async (discipline, element) => {
    if (!window.confirm(`¿Eliminar ${discipline} - ${element}?`)) return;
    try {
      setSavingState('saving');
      await projectService.deleteLodTdiElement(projectId, discipline, element);
      setProjectElements(prev => prev.filter(e => !(e.discipline === discipline && e.element === element)));
      setMatrixData(prev => {
        const newData = { ...prev };
        delete newData[`${discipline}::${element}`];
        return newData;
      });
      setSavingState('saved');
    } catch (e) {
      console.error(e);
      setSavingState('local');
    }
  };

  const startEditElement = (discipline, element) => {
    setForm({ discipline, element, oldDiscipline: discipline, oldElement: element });
    setIsAdding(true);
  };

  const filtered = projectElements.filter(item => {
    const s = searchTerm.toLowerCase();
    return (item.element.toLowerCase().includes(s) || item.discipline.toLowerCase().includes(s))
      && (selectedDiscipline === 'all' || item.discipline === selectedDiscipline);
  });

  return (
    <div className="space-y-6">
      {/* ── Control bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#f6f3ee] border-2 border-[#1c1c19] p-4 shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Buscar elemento..." value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border-2 border-[#1c1c19] text-xs font-bold focus:outline-none focus:bg-white bg-[#fcf9f4]" />
          </div>
          <div className="relative">
            <ListFilter className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <select value={selectedDiscipline} onChange={e => setSelectedDiscipline(e.target.value)}
              className="pl-9 pr-8 py-2 border-2 border-[#1c1c19] text-xs font-bold focus:outline-none bg-[#fcf9f4] appearance-none cursor-pointer uppercase">
              <option value="all">TODAS LAS DISCIPLINAS</option>
              {disciplines.filter(d => d !== 'all').map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-3 h-3 w-3 pointer-events-none" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowTdiModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-black text-[10px] uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <TableIcon size={14} /> Ver Matriz Referencial TDI
          </button>
          
          <button 
            onClick={() => { setForm({ discipline: '', element: '', oldDiscipline: '', oldElement: '' }); setIsAdding(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-[#00ff9d] text-[#1c1c19] border-2 border-[#1c1c19] font-black text-[10px] uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
          >
            <Plus size={14} /> Nuevo Elemento
          </button>

          <div className="h-6 w-[2px] bg-[#1c1c19]/20 mx-1"></div>

          {savingState === 'saving' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-800 uppercase font-mono">
              <Loader2 className="animate-spin h-3.5 w-3.5" /> Sincronizando
            </span>
          )}
          {savingState === 'saved' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 border border-green-300 text-[10px] font-bold text-green-800 uppercase font-mono">
              <CheckCircle2 className="h-3.5 w-3.5" /> DB_OK
            </span>
          )}
          {savingState === 'local' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 border border-blue-300 text-[10px] font-bold text-blue-800 uppercase font-mono">
              <AlertCircle className="h-3.5 w-3.5" /> Local
            </span>
          )}
          <button onClick={handleResetAll}
            className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-red-50 text-red-600 border-2 border-[#1c1c19] font-black text-[10px] uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
            <RotateCcw size={12} /> Reiniciar
          </button>
        </div>
      </div>

      {/* ── Help hint & Legend ── */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="p-4 border-2 border-dashed border-[#1c1c19] bg-[#fcf9f4] flex gap-3 items-start flex-1">
          <HelpCircle className="text-[#0f4369] shrink-0 mt-0.5" size={16} />
          <div className="text-[10px] font-bold text-slate-700 leading-normal uppercase">
            <strong className="text-[#1c1c19]">Guía:</strong> Define el Autor del Elemento del Modelo (AEM) y el Nivel de Desarrollo (LOD) para cada fase. El Tipo de Información (TDI) aplicable dependerá automáticamente del nivel LOD seleccionado en cada fase. (Clic en "Ver Matriz Referencial TDI" para más detalles).
          </div>
        </div>
        
        <div className="p-3 border-2 border-solid border-[#1c1c19] bg-white flex flex-col justify-center min-w-[280px] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)]">
          <div className="text-[9px] font-black uppercase text-[#0f4369] mb-2 tracking-widest border-b border-[#1c1c19]/10 pb-1">Asignación de Elementos</div>
          <div className="grid grid-cols-2 gap-2 text-[9px] font-bold uppercase text-slate-700">
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-[#bfd4e7] border border-black"></div> Arquitectura</div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-[#d6e3c8] border border-black"></div> Estructura</div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-[#f4e29e] border border-black"></div> MEP</div>
            <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 bg-[#a3a3a3] border border-black"></div> Otras</div>
          </div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th colSpan="2" className="bg-[#fcf9f4] border-r-2 border-[#1c1c19] p-2 text-center text-[10px] font-black text-transparent select-none">-</th>
                <th colSpan="3" className="bg-[#e5e2dd] border-b-2 border-r-2 border-[#1c1c19] p-2 text-center text-[10px] font-black tracking-widest text-[#0f4369] uppercase border-l-2">
                  Fases del Proyecto (AEM & LOD)
                </th>
                <th className="bg-[#fcf9f4] border-b-2 border-[#1c1c19] p-2 text-center text-[10px] font-black text-transparent select-none">-</th>
              </tr>
              <tr className="bg-[#1c1c19] text-white font-mono text-[10px] tracking-wider uppercase">
                <th className="p-3 w-[12%] border-r border-white/20">Disciplina</th>
                <th className="p-3 w-[15%] border-r-2 border-white/20">Elemento</th>
                <th className="p-3 w-[8%] border-r-2 border-white/20 text-center">Código</th>
                <th className="p-3 w-[15%] border-r border-white/20 text-center">Esquema Básico</th>
                <th className="p-3 w-[15%] border-r border-white/20 text-center">Anteproyecto</th>
                <th className="p-3 w-[15%] border-r-2 border-white/20 text-center">Proy/Finales</th>
                <th className="p-3 w-[18%] border-r-2 border-white/20">Notas</th>
                <th className="p-3 w-[6%] text-center">Acc.</th>
              </tr>
              <tr className="bg-[#2c2c29] text-white/50 font-mono text-[8px] tracking-widest uppercase">
                <th className="px-3 pb-1.5 border-r border-white/10" />
                <th className="px-3 pb-1.5 border-r-2 border-white/10" />
                <th className="px-3 pb-1.5 border-r-2 border-white/10" />
                <th className="px-3 pb-1.5 border-r border-white/10 text-center">AEM &bull; LOD</th>
                <th className="px-3 pb-1.5 border-r border-white/10 text-center">AEM &bull; LOD</th>
                <th className="px-3 pb-1.5 border-r-2 border-white/10 text-center">AEM &bull; LOD</th>
                <th className="px-3 pb-1.5 border-r-2 border-white/10" />
                <th className="px-3 pb-1.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c19]/15">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center">
                  <Loader2 className="animate-spin mx-auto text-[#0f4369]" size={28} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="p-8 text-center text-slate-500 italic">
                  No se encontraron elementos con los filtros actuales.
                </td></tr>
              ) : filtered.map((item, index) => {
                const key = `${item.discipline}::${item.element}`;
                const cfg = matrixData[key]?.parsed || parseNotes('', item.defLods);
                
                return (
                  <tr key={index} className="hover:bg-[#f6f3ee]/30 transition-colors">
                    <td className="p-3 border-r border-[#1c1c19]/10">
                      <span className="px-1.5 py-0.5 bg-[#f6f3ee] border border-[#1c1c19]/20 text-[8px] font-black uppercase font-mono text-slate-700">
                        {item.discipline}
                      </span>
                    </td>
                    <td className="p-3 border-r-2 border-[#1c1c19]/30 text-[10px] font-bold uppercase tracking-tight text-[#1c1c19]">
                      {item.element}
                    </td>
                    
                    <td className="p-1.5 border-r-2 border-[#1c1c19]/30">
                      <input 
                        type="text" 
                        value={cfg.abbreviation}
                        onChange={e => handleUpdate(item.discipline, item.element, 'abbreviation', null, e.target.value.toUpperCase())}
                        placeholder="Ej. MUR"
                        maxLength={6}
                        className="w-full text-center p-1.5 bg-[#fcf9f4] border border-[#1c1c19]/20 hover:border-[#1c1c19]/50 focus:border-[#0f4369] focus:bg-white text-[10px] font-bold uppercase placeholder:italic placeholder:font-normal placeholder:lowercase focus:outline-none transition-colors"
                      />
                    </td>
                    <td className="p-1.5 border-r border-[#1c1c19]/20 bg-[#f9f9f9] hover:bg-[#f0f0f0] transition-colors">
                      <PhaseCell 
                        data={cfg.esquema} 
                        onChange={(d) => handleUpdate(item.discipline, item.element, 'esquema', null, d)} 
                        disciplineColor={getPhaseColor(item.discipline, cfg.esquema.lod)}
                      />
                    </td>
                    <td className="p-1.5 border-r border-[#1c1c19]/20 bg-[#f9f9f9] hover:bg-[#f0f0f0] transition-colors">
                      <PhaseCell 
                        data={cfg.anteproyecto} 
                        onChange={(d) => handleUpdate(item.discipline, item.element, 'anteproyecto', null, d)} 
                        disciplineColor={getPhaseColor(item.discipline, cfg.anteproyecto.lod)}
                      />
                    </td>
                    <td className="p-1.5 border-r-2 border-[#1c1c19]/30 bg-[#f9f9f9] hover:bg-[#f0f0f0] transition-colors">
                      <PhaseCell 
                        data={cfg.finales} 
                        onChange={(d) => handleUpdate(item.discipline, item.element, 'finales', null, d)} 
                        disciplineColor={getPhaseColor(item.discipline, cfg.finales.lod)}
                      />
                    </td>
                    
                    <td className="p-2 border-r-2 border-[#1c1c19]/20">
                      <input type="text" value={cfg.text}
                        onChange={e => handleUpdate(item.discipline, item.element, 'text', null, e.target.value)}
                        placeholder="Notas adicionales..."
                        className="w-full p-1.5 bg-[#fcf9f4] border border-[#1c1c19]/20 hover:border-[#1c1c19]/50 focus:border-[#0f4369] focus:bg-white text-[10px] font-bold placeholder:italic placeholder:font-normal focus:outline-none transition-colors"
                      />
                    </td>
                    <td className="p-2 text-center align-middle">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => startEditElement(item.discipline, item.element)} className="text-[#0f4369] hover:bg-blue-100 p-1.5 rounded transition-colors" title="Editar"><Edit2 size={14}/></button>
                        <button onClick={() => handleDeleteElement(item.discipline, item.element)} className="text-red-600 hover:bg-red-100 p-1.5 rounded transition-colors" title="Eliminar"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-[#f6f3ee] border-t-2 border-[#1c1c19] p-3 text-[10px] font-bold text-slate-600 flex flex-wrap justify-between items-center font-mono">
          <span>ELEMENTOS: {DISCIPLINE_ELEMENTS.length}</span>
          <span>MOSTRANDO: {filtered.length}</span>
        </div>
      </div>

      <TdiReferenceModal isOpen={showTdiModal} onClose={() => setShowTdiModal(false)} />

      {isAdding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#1c1c19]/50 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)] w-full max-w-md flex flex-col">
            <div className="p-4 border-b-2 border-[#1c1c19] flex justify-between items-center bg-[#f6f3ee]">
              <h3 className="text-sm font-black uppercase">{form.oldElement ? 'Editar Elemento' : 'Nuevo Elemento'}</h3>
              <button onClick={() => setIsAdding(false)} className="hover:text-red-500 transition-colors"><X size={20}/></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Disciplina</label>
                <input type="text" value={form.discipline} onChange={e => setForm({...form, discipline: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-sm focus:outline-none focus:border-[#0f4369] transition-colors" placeholder="Ej. Arquitectura" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 block mb-1">Elemento</label>
                <input type="text" value={form.element} onChange={e => setForm({...form, element: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-sm focus:outline-none focus:border-[#0f4369] transition-colors" placeholder="Ej. Muros" />
              </div>
            </div>
            <div className="p-4 border-t-2 border-[#1c1c19] bg-[#f6f3ee] flex justify-end gap-2">
              <button onClick={() => setIsAdding(false)} className="px-4 py-2 border-2 border-[#1c1c19] text-xs font-bold uppercase hover:bg-white transition-colors">Cancelar</button>
              <button onClick={handleSaveElement} className="flex items-center gap-2 px-4 py-2 bg-[#1c1c19] text-white border-2 border-[#1c1c19] text-xs font-bold uppercase hover:bg-[#0f4369] transition-colors"><Save size={14}/> Guardar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
