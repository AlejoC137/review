import React, { useState, useEffect, useRef } from 'react';
import {
  HelpCircle, ChevronDown, RotateCcw,
  Search, ListFilter, AlertCircle, Loader2, CheckCircle2
} from 'lucide-react';
import { projectService } from '../../services/projectService';

/* ─── Static data ──────────────────────────────────────────── */
const DISCIPLINE_ELEMENTS = [
  { discipline: 'Espacial', element: 'Ejes' },
  { discipline: 'Espacial', element: 'Niveles' },
  { discipline: 'Espacial', element: 'Zonas' },
  { discipline: 'Espacial', element: 'Espacios, habitaciones' },
  { discipline: 'Sitio', element: 'Topografía' },
  { discipline: 'Sitio', element: 'Excavación' },
  { discipline: 'Cimentación', element: 'Zapatas' },
  { discipline: 'Cimentación', element: 'Muros de contención' },
  { discipline: 'Cimentación', element: 'Pilotes' },
  { discipline: 'Estructura', element: 'Losas' },
  { discipline: 'Estructura', element: 'Vigas' },
  { discipline: 'Estructura', element: 'Columnas' },
  { discipline: 'Estructura', element: 'Muros' },
  { discipline: 'Estructura', element: 'Escaleras' },
  { discipline: 'Envolvente', element: 'Cubierta' },
  { discipline: 'Envolvente', element: 'Ventanas' },
  { discipline: 'Envolvente', element: 'Puertas, aberturas' },
  { discipline: 'Interiorismo', element: 'Particiones' },
  { discipline: 'Interiorismo', element: 'Puertas, aberturas' },
  { discipline: 'Interiorismo', element: 'Falso techo' },
  { discipline: 'Interiorismo', element: 'Pisos' },
  { discipline: 'Interiorismo', element: 'Mobiliario' },
  { discipline: 'Plomería (Hidrosanitario)', element: 'Tuberías' },
  { discipline: 'Plomería (Hidrosanitario)', element: 'Accesorios' },
  { discipline: 'Plomería (Hidrosanitario)', element: 'Equipos' },
  { discipline: 'Plomería (Hidrosanitario)', element: 'Mobiliario' },
  { discipline: 'Eléctrica y Comunicación', element: 'Tuberías' },
  { discipline: 'Eléctrica y Comunicación', element: 'Accesorios' },
  { discipline: 'Eléctrica y Comunicación', element: 'Cables' },
  { discipline: 'Eléctrica y Comunicación', element: 'Luminarias' },
  { discipline: 'Eléctrica y Comunicación', element: 'Equipos' },
  { discipline: 'Seguridad y Control', element: 'Tuberías' },
  { discipline: 'Seguridad y Control', element: 'Accesorios' },
  { discipline: 'Seguridad y Control', element: 'Cables' },
  { discipline: 'Seguridad y Control', element: 'Luminarias' },
  { discipline: 'Seguridad y Control', element: 'Equipos' },
  { discipline: 'HVAC (Aire Acondicionado)', element: 'Tubería' },
  { discipline: 'HVAC (Aire Acondicionado)', element: 'Accesorios' },
  { discipline: 'HVAC (Aire Acondicionado)', element: 'Equipos' },
];

const LOD_OPTIONS = [
  { val: 100, label: '100', color: '#94a3b8', desc: 'Conceptual' },
  { val: 200, label: '200', color: '#60a5fa', desc: 'Esquemático' },
  { val: 300, label: '300', color: '#34d399', desc: 'Técnico' },
  { val: 350, label: '350', color: '#f59e0b', desc: 'Coordinación' },
  { val: 400, label: '400', color: '#f97316', desc: 'Construcción' },
];

const TDI_LETTERS = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O'];

const TDI_DESCRIPTIONS = {
  A: 'TDI_A: Información General del Proyecto',
  B: 'TDI_B: Datos de Ubicación y Terreno',
  C: 'TDI_C: Características Físicas y Dimensiones',
  D: 'TDI_D: Especificaciones del Fabricante y Catálogos',
  E: 'TDI_E: Certificados e Informes de Ensayos',
  F: 'TDI_F: Costos y Estimaciones Financieras',
  G: 'TDI_G: Rendimiento Energético y Sostenibilidad',
  H: 'TDI_H: Planificación y Fases Temporales',
  I: 'TDI_I: Requisitos de Mantenimiento y Operaciones',
  J: 'TDI_J: Estándares de Seguridad y Normativas',
  K: 'TDI_K: Propiedades Acústicas y Térmicas',
  L: 'TDI_L: Ciclo de Vida y Reusabilidad de Materiales',
  M: 'TDI_M: Datos del Diseñador e Historial de Cambios',
  N: 'TDI_N: Requisitos de Instalación y Ensamblaje',
  O: 'TDI_O: Manuales de Usuario y Garantías',
};

/* ─── LOD Slider (segmented pills) ────────────────────────── */
function LodDial({ value, onChange }) {
  return (
    <div className="flex flex-col items-center gap-1.5 w-full px-1">
      {/* Pill row */}
      <div className="flex w-full border-2 border-[#1c1c19] overflow-hidden">
        {LOD_OPTIONS.map((opt, i) => {
          const active = value === opt.val;
          return (
            <button
              key={opt.val}
              type="button"
              onClick={() => onChange(opt.val)}
              className={`flex-1 py-1.5 text-[9px] font-black font-mono tracking-wider transition-all
                ${i < LOD_OPTIONS.length - 1 ? 'border-r border-[#1c1c19]' : ''}
                ${active
                  ? 'text-white shadow-inner'
                  : 'bg-[#fcf9f4] text-[#72777f] hover:bg-[#f0ede8]'
                }`}
              style={active ? { backgroundColor: opt.color } : {}}
              title={opt.desc}
            >
              {opt.val}
            </button>
          );
        })}
      </div>
      {/* Active label */}
      <span
        className="text-[8px] font-black uppercase font-mono px-2 py-0.5 border border-[#1c1c19]/20"
        style={{ color: LOD_OPTIONS.find(o => o.val === value)?.color }}
      >
        {LOD_OPTIONS.find(o => o.val === value)?.desc}
      </span>
    </div>
  );
}


/* ─── Main Component ───────────────────────────────────────── */
export default function LodTdiMatrix({ projectId }) {
  const [loading, setLoading] = useState(true);
  const [savingState, setSavingState] = useState('saved');
  const [matrixData, setMatrixData] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDiscipline, setSelectedDiscipline] = useState('all');
  const [activePopover, setActivePopover] = useState(null);
  const popoverRef = useRef(null);

  const disciplines = ['all', ...new Set(DISCIPLINE_ELEMENTS.map(e => e.discipline))];

  useEffect(() => {
    const fetchMatrix = async () => {
      if (!projectId) return;
      setLoading(true);
      const localKey = `peb_lod_tdi_matrix_${projectId}`;
      const localSaved = localStorage.getItem(localKey);
      try {
        const data = await projectService.getLodTdiMatrix(projectId);
        if (data && data.length > 0) {
          const map = {};
          data.forEach(item => {
            map[`${item.discipline}::${item.element_name}`] = {
              lod: item.lod, tdi: item.tdi || [], notes: item.notes || ''
            };
          });
          setMatrixData(map);
          setSavingState('saved');
        } else if (localSaved) {
          setMatrixData(JSON.parse(localSaved));
          setSavingState('local');
        } else {
          setMatrixData({});
        }
      } catch (err) {
        console.warn('Matrix fetch fallback:', err.message);
        if (localSaved) { setMatrixData(JSON.parse(localSaved)); setSavingState('local'); }
      } finally {
        setLoading(false);
      }
    };
    fetchMatrix();
  }, [projectId]);

  useEffect(() => {
    const handler = e => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) setActivePopover(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleUpdate = async (discipline, element, key, value) => {
    const itemKey = `${discipline}::${element}`;
    const cur = matrixData[itemKey] || { lod: 100, tdi: [], notes: '' };
    const updated = { ...cur, [key]: value };
    const next = { ...matrixData, [itemKey]: updated };
    setMatrixData(next);
    localStorage.setItem(`peb_lod_tdi_matrix_${projectId}`, JSON.stringify(next));
    setSavingState('saving');
    try {
      await projectService.saveLodTdiElement(projectId, discipline, element, updated.lod, updated.tdi, updated.notes);
      setSavingState('saved');
    } catch { setSavingState('local'); }
  };

  const toggleTdi = (d, e, letter) => {
    const k = `${d}::${e}`;
    const cur = matrixData[k]?.tdi || [];
    const s = `TDI_${letter}`;
    const next = cur.includes(s) ? cur.filter(t => t !== s) : [...cur, s].sort();
    handleUpdate(d, e, 'tdi', next);
  };

  const handleResetAll = () => {
    if (!window.confirm('¿Reiniciar toda la matriz LOD y TDI?')) return;
    localStorage.removeItem(`peb_lod_tdi_matrix_${projectId}`);
    setMatrixData({});
    setSavingState('saved');
    alert('Matriz reiniciada.');
  };

  const filtered = DISCIPLINE_ELEMENTS.filter(item => {
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
          {savingState === 'saving' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 border border-amber-300 text-[10px] font-bold text-amber-800 uppercase font-mono">
              <Loader2 className="animate-spin h-3.5 w-3.5" /> Sincronizando...
            </span>
          )}
          {savingState === 'saved' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 border border-green-300 text-[10px] font-bold text-green-800 uppercase font-mono">
              <CheckCircle2 className="h-3.5 w-3.5" /> Base de Datos OK
            </span>
          )}
          {savingState === 'local' && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 border border-blue-300 text-[10px] font-bold text-blue-800 uppercase font-mono">
              <AlertCircle className="h-3.5 w-3.5" /> Guardado Local
            </span>
          )}
          <button onClick={handleResetAll}
            className="flex items-center gap-1 px-3 py-2 bg-white hover:bg-red-50 text-red-600 border-2 border-[#1c1c19] font-black text-[10px] uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all">
            <RotateCcw size={12} /> Reiniciar
          </button>
        </div>
      </div>

      {/* ── Help hint ── */}
      <div className="p-4 border-2 border-dashed border-[#1c1c19] bg-[#fcf9f4] flex gap-3 items-start">
        <HelpCircle className="text-[#0f4369] shrink-0 mt-0.5" size={16} />
        <div className="text-[11px] font-semibold text-slate-700 leading-normal uppercase">
          <strong className="text-[#1c1c19]">Guía:</strong> Gira el <strong className="text-[#0f4369]">dial LOD</strong> con la rueda del ratón, teclas ← → o los botones ‹ ›. Haz clic en <strong className="text-[#0f4369]">TDI</strong> para marcar atributos de información. Los cambios se guardan automáticamente.
        </div>
      </div>

      {/* ── Table ── */}
      <div className="bg-white border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#1c1c19] text-white font-mono text-[10px] tracking-wider uppercase">
                <th className="p-3 w-[16%] border-r border-white/10">Disciplina</th>
                <th className="p-3 w-[20%] border-r border-white/10">Elemento del Modelo</th>
                <th className="p-3 w-[22%] border-r border-white/10 text-center">Dial LOD</th>
                <th className="p-3 w-[18%] border-r border-white/10">TDI (A–O)</th>
                <th className="p-3 w-[24%]">Notas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1c1c19]/15">
              {loading ? (
                <tr><td colSpan={5} className="p-12 text-center">
                  <Loader2 className="animate-spin mx-auto text-[#0f4369]" size={28} />
                </td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-slate-500 italic">
                  No se encontraron elementos con los filtros actuales.
                </td></tr>
              ) : filtered.map((item, index) => {
                const key = `${item.discipline}::${item.element}`;
                const cfg = matrixData[key] || { lod: 100, tdi: [], notes: '' };
                const popOpen = activePopover === key;
                return (
                  <tr key={index} className="hover:bg-[#f6f3ee]/30 transition-colors">
                    {/* Disciplina */}
                    <td className="p-3 border-r border-[#1c1c19]/10">
                      <span className="px-2 py-0.5 bg-[#f6f3ee] border border-[#1c1c19]/20 text-[9px] font-black uppercase font-mono text-slate-700">
                        {item.discipline}
                      </span>
                    </td>
                    {/* Elemento */}
                    <td className="p-3 border-r border-[#1c1c19]/10 text-xs font-bold uppercase tracking-tight text-[#1c1c19]">
                      {item.element}
                    </td>
                    {/* LOD DIAL */}
                    <td className="p-2 border-r border-[#1c1c19]/10">
                      <div className="flex justify-center">
                        <LodDial
                          value={cfg.lod}
                          onChange={v => handleUpdate(item.discipline, item.element, 'lod', v)}
                        />
                      </div>
                    </td>
                    {/* TDI */}
                    <td className="p-3 border-r border-[#1c1c19]/10 relative">
                      <button
                        onClick={() => setActivePopover(popOpen ? null : key)}
                        className="w-full flex items-center justify-between bg-[#fcf9f4] hover:bg-white border-2 border-[#1c1c19] px-3 py-1.5 text-left font-bold text-[10px] tracking-tight uppercase transition-all shadow-[2px_2px_0_0_rgba(28,28,25,0.08)]"
                      >
                        <span className="truncate max-w-[110px] font-mono">
                          {cfg.tdi.length > 0 ? cfg.tdi.map(t => t.replace('TDI_','')).join(', ') : 'Ninguno'}
                        </span>
                        <span className="text-[9px] bg-[#0f4369] text-white px-1.5 py-0.5 border border-black font-black">
                          {cfg.tdi.length}
                        </span>
                      </button>
                      {popOpen && (
                        <div ref={popoverRef}
                          className="absolute z-50 left-3 right-3 top-[44px] bg-[#fcf9f4] border-2 border-[#1c1c19] p-4 shadow-[8px_8px_0_0_rgba(28,28,25,1)] space-y-3 min-w-[280px]">
                          <div className="flex justify-between items-center border-b border-[#1c1c19]/10 pb-1.5">
                            <span className="text-[10px] font-black uppercase text-[#0f4369]">Tipos de Información (TDI)</span>
                            <span className="text-[8px] font-black text-slate-500">{item.element}</span>
                          </div>
                          <div className="grid grid-cols-5 gap-1.5">
                            {TDI_LETTERS.map(l => {
                              const s = `TDI_${l}`;
                              const on = cfg.tdi.includes(s);
                              return (
                                <button key={l} type="button"
                                  onClick={() => toggleTdi(item.discipline, item.element, l)}
                                  title={TDI_DESCRIPTIONS[l]}
                                  className={`p-1.5 font-mono text-[10px] font-black border transition-all uppercase flex items-center justify-center
                                    ${on ? 'bg-[#0f4369] text-white border-black shadow-[1px_1px_0_0_rgba(0,0,0,1)]'
                                         : 'bg-white text-slate-700 border-slate-300 hover:border-black'}`}>
                                  {l}
                                </button>
                              );
                            })}
                          </div>
                          <div className="flex gap-2 justify-between pt-1 text-[9px] font-bold border-t border-[#1c1c19]/10">
                            <div className="flex gap-1.5">
                              <button type="button" onClick={() => handleUpdate(item.discipline, item.element, 'tdi', TDI_LETTERS.map(l => `TDI_${l}`))}
                                className="text-[#0f4369] hover:underline">Todos</button>
                              <span className="text-slate-400">|</span>
                              <button type="button" onClick={() => handleUpdate(item.discipline, item.element, 'tdi', [])}
                                className="text-red-600 hover:underline">Limpiar</button>
                            </div>
                            <button type="button" onClick={() => setActivePopover(null)}
                              className="px-2 py-0.5 bg-black text-white hover:bg-slate-800 font-bold uppercase text-[8px]">
                              Hecho
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                    {/* Notas */}
                    <td className="p-3">
                      <input type="text" value={cfg.notes}
                        onChange={e => handleUpdate(item.discipline, item.element, 'notes', e.target.value)}
                        placeholder="Notas del modelador..."
                        className="w-full p-2 bg-[#fcf9f4] border-2 border-[#1c1c19]/25 hover:border-[#1c1c19]/60 focus:border-[#0f4369] focus:bg-white text-xs font-bold placeholder:italic placeholder:font-normal focus:outline-none"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="bg-[#f6f3ee] border-t-2 border-[#1c1c19] p-3 text-[10px] font-bold text-slate-600 flex flex-wrap justify-between items-center font-mono">
          <span>ELEMENTOS CONFIGURABLES: {DISCIPLINE_ELEMENTS.length}</span>
          <span>MOSTRANDO: {filtered.length}</span>
        </div>
      </div>
    </div>
  );
}
