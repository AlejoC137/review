import React, { useState, useEffect } from 'react';
import { 
  FileText, Layers, Database, ChevronDown, Check, Loader2, Info, BookOpen, Fingerprint, Copy, CheckCircle2
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { supabase } from '../../services/supabaseClient';
import { levelsService } from '../../services/levelsService';

export default function ProjectNamingProtocolModule({ project }) {
  const [specialties, setSpecialties] = useState([]);
  const [matrixElements, setMatrixElements] = useState([]);
  const [pebInfo, setPebInfo] = useState(null);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedSpecialty, setSelectedSpecialty] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  // States for Archivo Central
  const [zona, setZona] = useState('ZZ');
  const [nivel, setNivel] = useState('ZZ');
  const [tipo, setTipo] = useState('M3');
  const [disciplinaSec, setDisciplinaSec] = useState('A');
  const [numero, setNumero] = useState('0001');
  const [copiedCentral, setCopiedCentral] = useState(false);

  // States for Familias
  const [descripcion, setDescripcion] = useState('NombreDescriptivo');
  const [variante, setVariante] = useState('50x50cm');
  const [copiedFamilia, setCopiedFamilia] = useState(false);

  // State for the dictionary list copy button
  const [copiedRow, setCopiedRow] = useState(null);

  const projectCode = pebInfo?.code || 'CCWE';
  const originCode = projectCode.length >= 3 ? projectCode.substring(0, 3).toUpperCase() : 'CLK';

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'central') {
      setCopiedCentral(true);
      setTimeout(() => setCopiedCentral(false), 2000);
    } else if (type === 'familia') {
      setCopiedFamilia(true);
      setTimeout(() => setCopiedFamilia(false), 2000);
    } else if (type.startsWith('row-')) {
      setCopiedRow(type);
      setTimeout(() => setCopiedRow(null), 2000);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!project?.id) return;
      setLoading(true);
      try {
        let specs = [];
        let matrixData = [];
        let pebResData = null;

        try {
          const [specsRes, matrixRes, pebRes, levelsRes] = await Promise.all([
            projectService.getSpecialties(project.id),
            projectService.getLodTdiMatrix(project.id),
            supabase.from('project_general_info').select('code').eq('project_id', project.id).maybeSingle(),
            levelsService.getLevels(project.id).catch(() => [])
          ]);
          specs = specsRes || [];
          matrixData = matrixRes || [];
          pebResData = pebRes.data;
          setLevels(levelsRes || []);
          if (levelsRes && levelsRes.length > 0) {
            setNivel(levelsRes[0].nombre);
          }
        } catch (e) {
          console.warn('DB fetch failed, falling back to local storage', e);
        }

        // Fallbacks
        if (!pebResData) {
          const localPeb = localStorage.getItem(`peb_info_${project.id}`);
          if (localPeb) pebResData = JSON.parse(localPeb);
        }
        if (specs.length === 0) {
           // Specialties might not have a dedicated local storage key in projectService, but we check if we can fetch
        }
        if (matrixData.length === 0) {
          const localMatrix = localStorage.getItem(`peb_lod_tdi_matrix_${project.id}`);
          if (localMatrix) {
            const parsedLocal = JSON.parse(localMatrix);
            // Convert dictionary map to array format expected
            matrixData = Object.entries(parsedLocal).map(([key, val]) => {
              const [disc, elem] = key.split('::');
              return {
                discipline: disc,
                element_name: elem,
                notes: JSON.stringify(val.parsed)
              };
            });
          }
        }

        if (pebResData) {
          setPebInfo(pebResData);
        }

        setSpecialties(specs);
        
        // Parse matrix elements to extract abbreviations
        const parsedMatrix = matrixData.map(item => {
          let abbr = '';
          try {
            if (item.notes && item.notes.trim().startsWith('{')) {
              const parsed = JSON.parse(item.notes);
              abbr = parsed.abbreviation || '';
            }
          } catch (e) {}
          return {
            discipline: item.discipline,
            element: item.element_name,
            abbreviation: abbr
          };
        }).filter(item => item.abbreviation); // Only those with abbreviation
        
        
        setMatrixElements(parsedMatrix);

        if (specs && specs.length > 0) setSelectedSpecialty(specs[0].abbreviation || 'ARQ');
        if (parsedMatrix && parsedMatrix.length > 0) setSelectedCategory(parsedMatrix[0].abbreviation || 'FURN');

      } catch (err) {
        console.error("Error fetching nomenclature data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [project?.id]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#f6f3ee]">
        <Loader2 size={40} className="animate-spin text-[#0f4369]" />
      </div>
    );
  }

  const activeSpecialty = specialties.find(s => s.abbreviation === selectedSpecialty) || { abbreviation: 'ARQ', name: 'Arquitectura' };
  const activeCategory = matrixElements.find(c => c.abbreviation === selectedCategory) || { abbreviation: 'FURN', element: 'Mobiliario' };

  const getSpecialtyAbbrevForDiscipline = (discipline) => {
    const exact = specialties.find(s => 
      s.name.toLowerCase() === discipline.toLowerCase() || 
      (s.abbreviation && s.abbreviation.toLowerCase() === discipline.toLowerCase())
    );
    if (exact) return exact.abbreviation;

    const mapping = {
      'espacial': ['arquitectura', 'arq'],
      'sitio': ['arquitectura', 'arq', 'topografía', 'top'],
      'cimentación': ['estructura', 'est'],
      'estructura': ['estructura', 'est'],
      'envolvente': ['arquitectura', 'arq'],
      'interiorismo': ['arquitectura', 'arq', 'interiores'],
      'plomería': ['hidrosanitario', 'hid', 'plomería', 'plo'],
      'eléctrica y comunicación': ['eléctrico', 'ele', 'eléctrica', 'comunicaciones', 'com'],
      'seguridad y control': ['seguridad', 'seg', 'red contra incendio', 'rci', 'eléctrico'],
      'hvac': ['hvac', 'aire acondicionado', 'mecánico', 'mec']
    };

    const aliases = mapping[discipline.toLowerCase()];
    if (aliases) {
      const aliasMatch = specialties.find(s => 
        aliases.includes(s.name.toLowerCase()) || 
        (s.abbreviation && aliases.includes(s.abbreviation.toLowerCase()))
      );
      if (aliasMatch) return aliasMatch.abbreviation;
    }

    return 'XXX';
  };

  const centralCode = `${projectCode}-${activeSpecialty.abbreviation || 'XXX'}-${zona || 'ZZ'}-${nivel || 'ZZ'}-${tipo || 'M3'}-${disciplinaSec || 'A'}-${numero || '0001'}`;
  const familiaCode = `${originCode}_${activeSpecialty.abbreviation || 'XXX'}_${activeCategory.abbreviation || 'YYY'}_${descripcion || 'Desc'}_${variante || 'Var'}`;

  return (
    <div className="flex flex-col h-full bg-[#f6f3ee] overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto w-full space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4 bg-white border-2 border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(28,28,25,1)]">
          <div className="p-4 bg-[#1c1c19] text-white border-2 border-[#1c1c19]">
            <BookOpen size={32} />
          </div>
          <div>
            <span className="text-[10px] font-black text-[#72777f] uppercase tracking-[0.3em] mb-1 block italic">
              ESTÁNDAR BIM / {projectCode}
            </span>
            <h1 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-[#1c1c19] leading-none">
              Protocolo de Nomenclatura
            </h1>
            <p className="text-xs text-gray-500 font-bold mt-2 uppercase tracking-wide">
              Lineamientos técnicos obligatorios para la asignación de nombres generados dinámicamente.
            </p>
          </div>
        </div>

        {/* Nomenclatura General de Archivos */}
        <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(28,28,25,1)] space-y-6">
          <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-4">
            <FileText size={20} className="text-[#0f4369]" />
            <h2 className="text-xl font-black uppercase tracking-tight text-[#1c1c19]">1. Nomenclatura General de Archivos</h2>
          </div>

          <div className="p-4 border-2 border-dashed border-[#1c1c19] bg-[#fcf9f4]">
            <p className="text-xs font-bold text-gray-600 mb-4 uppercase tracking-wider">Estructura Base (ISO 19650):</p>
            <div className="flex flex-wrap gap-2 text-xs font-mono font-black text-[#0f4369]">
              <span className="bg-[#e8e4df] px-2 py-1 border border-[#1c1c19] text-[#1c1c19]">[PROYECTO]</span> -
              <span className="bg-[#e8e4df] px-2 py-1 border border-[#1c1c19] text-[#1c1c19]">[ORIGINADOR/DISCIPLINA]</span> -
              <span className="bg-white px-2 py-1 border border-gray-300 text-gray-500">[VOLUMEN/ZONA]</span> -
              <span className="bg-white px-2 py-1 border border-gray-300 text-gray-500">[NIVEL]</span> -
              <span className="bg-white px-2 py-1 border border-gray-300 text-gray-500">[TIPO]</span> -
              <span className="bg-white px-2 py-1 border border-gray-300 text-gray-500">[DISCIPLINA_SECUNDARIA]</span> -
              <span className="bg-white px-2 py-1 border border-gray-300 text-gray-500">[NÚMERO]</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-[#72777f] mb-2 block">Selecciona Disciplina (Originador):</label>
                <div className="relative">
                  <select 
                    value={selectedSpecialty} 
                    onChange={e => setSelectedSpecialty(e.target.value)}
                    className="w-full p-3 border-2 border-[#1c1c19] text-sm font-bold bg-white focus:outline-none appearance-none cursor-pointer uppercase"
                  >
                    {specialties.length === 0 && <option value="">Sin especialidades registradas</option>}
                    {specialties.map(s => (
                      <option key={s.id} value={s.abbreviation}>{s.name} ({s.abbreviation || 'N/A'})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-3.5 h-4 w-4 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-[#72777f] mb-2 block">Volumen / Zona:</label>
                  <input type="text" value={zona} onChange={e => setZona(e.target.value.toUpperCase())} className="w-full p-2 border-2 border-[#1c1c19] text-xs font-bold uppercase focus:outline-none focus:border-[#0f4369]" placeholder="ZZ" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[#72777f] mb-2 block">Nivel:</label>
                  {levels && levels.length > 0 ? (
                    <div className="relative">
                      <select 
                        value={nivel} 
                        onChange={e => setNivel(e.target.value.toUpperCase())}
                        className="w-full p-2 border-2 border-[#1c1c19] text-xs font-bold uppercase focus:outline-none focus:border-[#0f4369] appearance-none"
                      >
                        <option value="ZZ">ZZ (Múltiples / General)</option>
                        {levels.map(l => (
                          <option key={l.id} value={l.nombre}>{l.nombre}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 pointer-events-none text-gray-500" />
                    </div>
                  ) : (
                    <input type="text" value={nivel} onChange={e => setNivel(e.target.value.toUpperCase())} className="w-full p-2 border-2 border-[#1c1c19] text-xs font-bold uppercase focus:outline-none focus:border-[#0f4369]" placeholder="ZZ" />
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[#72777f] mb-2 block">Tipo:</label>
                  <input type="text" value={tipo} onChange={e => setTipo(e.target.value.toUpperCase())} className="w-full p-2 border-2 border-[#1c1c19] text-xs font-bold uppercase focus:outline-none focus:border-[#0f4369]" placeholder="M3" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[#72777f] mb-2 block">Número:</label>
                  <input type="text" value={numero} onChange={e => setNumero(e.target.value.toUpperCase())} className="w-full p-2 border-2 border-[#1c1c19] text-xs font-bold uppercase focus:outline-none focus:border-[#0f4369]" placeholder="0001" />
                </div>
              </div>
            </div>

            <div className="bg-[#f6f3ee] p-4 border-2 border-[#1c1c19] flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase text-[#72777f] mb-2">Generador de Código (Archivo Central):</p>
              <div className="bg-white border-2 border-[#1c1c19] p-4 text-base font-mono font-black text-center shadow-inner overflow-x-auto whitespace-nowrap text-[#0f4369]">
                {centralCode}
              </div>
              <button 
                onClick={() => copyToClipboard(centralCode, 'central')}
                className={`mt-4 w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all ${copiedCentral ? 'bg-green-400 text-green-900' : 'bg-[#1c1c19] text-white hover:bg-gray-800'}`}
              >
                {copiedCentral ? <><CheckCircle2 size={14} /> Copiado</> : <><Copy size={14} /> Copiar Código</>}
              </button>
            </div>
          </div>
        </div>

        {/* Nomenclatura de Familias y Componentes */}
        <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(28,28,25,1)] space-y-6">
          <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-4">
            <Layers size={20} className="text-[#0f4369]" />
            <h2 className="text-xl font-black uppercase tracking-tight text-[#1c1c19]">2. Nomenclatura de Familias y Componentes BIM</h2>
          </div>

          <div className="p-4 border-2 border-dashed border-[#1c1c19] bg-[#fcf9f4]">
            <p className="text-xs font-bold text-gray-600 mb-4 uppercase tracking-wider">Estructura Paramétrica:</p>
            <div className="flex flex-wrap gap-2 text-xs font-mono font-black text-[#0f4369]">
              <span className="bg-[#e8e4df] px-2 py-1 border border-[#1c1c19] text-[#1c1c19]">[ORIGEN]</span> _
              <span className="bg-[#e8e4df] px-2 py-1 border border-[#1c1c19] text-[#1c1c19]">[DISCIPLINA]</span> _
              <span className="bg-[#e8e4df] px-2 py-1 border border-[#1c1c19] text-[#1c1c19]">[CATEGORÍA]</span> _
              <span className="bg-white px-2 py-1 border border-gray-300 text-gray-500">[DESCRIPCIÓN]</span> _
              <span className="bg-white px-2 py-1 border border-gray-300 text-gray-500">[VARIANTE TÉCNICA]</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-[#72777f] mb-2 block">Disciplina:</label>
                  <div className="p-2 border-2 border-gray-200 bg-gray-50 text-xs font-bold uppercase text-gray-600 cursor-not-allowed h-[36px] flex items-center overflow-hidden whitespace-nowrap">
                    {activeSpecialty.abbreviation || 'N/A'}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[#72777f] mb-2 block">Categoría (Matriz LOD):</label>
                  <div className="relative">
                    <select 
                      value={selectedCategory} 
                      onChange={e => setSelectedCategory(e.target.value)}
                      className="w-full p-2 border-2 border-[#1c1c19] text-xs font-bold bg-white focus:outline-none appearance-none cursor-pointer uppercase h-[36px]"
                    >
                      {matrixElements.length === 0 && <option value="">N/A</option>}
                      {matrixElements.map((m, i) => (
                        <option key={i} value={m.abbreviation}>{m.element} ({m.abbreviation})</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2 top-2.5 h-4 w-4 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#72777f] mb-2 block">Descripción:</label>
                <input type="text" value={descripcion} onChange={e => setDescripcion(e.target.value)} className="w-full p-2 border-2 border-[#1c1c19] text-xs font-bold focus:outline-none focus:border-[#0f4369]" placeholder="NombreDescriptivo" />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#72777f] mb-2 block">Variante Técnica:</label>
                <input type="text" value={variante} onChange={e => setVariante(e.target.value)} className="w-full p-2 border-2 border-[#1c1c19] text-xs font-bold focus:outline-none focus:border-[#0f4369]" placeholder="50x50cm" />
              </div>
            </div>

            <div className="bg-[#f6f3ee] p-4 border-2 border-[#1c1c19] flex flex-col justify-center">
              <p className="text-[10px] font-black uppercase text-[#72777f] mb-2">Generador de Código (Familia .RFA):</p>
              <div className="bg-white border-2 border-[#1c1c19] p-4 text-base font-mono font-black text-center shadow-inner overflow-x-auto whitespace-nowrap text-[#0f4369]">
                {familiaCode}
              </div>
              
              <button 
                onClick={() => copyToClipboard(familiaCode, 'familia')}
                className={`mt-4 w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all ${copiedFamilia ? 'bg-green-400 text-green-900' : 'bg-[#1c1c19] text-white hover:bg-gray-800'}`}
              >
                {copiedFamilia ? <><CheckCircle2 size={14} /> Copiado</> : <><Copy size={14} /> Copiar Código</>}
              </button>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 uppercase">
                  <Fingerprint size={12} className="text-[#0f4369]" /> Origen: <span className="text-[#1c1c19] bg-white px-1 border border-gray-300">{originCode}</span> (Auto-generado del Proyecto)
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-600 uppercase">
                  <Database size={12} className="text-[#0f4369]" /> Categoría: <span className="text-[#1c1c19] bg-white px-1 border border-gray-300">{activeCategory.abbreviation || 'N/A'}</span> (Viene de Matriz LOD)
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Generador Masivo para todos los elementos */}
        <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(28,28,25,1)] space-y-6">
          <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-4">
            <Database size={20} className="text-[#0f4369]" />
            <h2 className="text-xl font-black uppercase tracking-tight text-[#1c1c19]">3. Diccionario de Nomenclatura (Matriz LOD)</h2>
          </div>
          <p className="text-[10px] font-bold text-gray-500 uppercase">
            Lista autogenerada de todos los elementos registrados en la Matriz LOD. Utiliza la Disciplina, Descripción y Variante Técnica ingresadas en la sección anterior.
          </p>

          <div className="overflow-x-auto border-2 border-[#1c1c19]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#1c1c19] text-white text-[10px] font-black uppercase tracking-wider">
                  <th className="p-3 border-r border-white/20">Disciplina</th>
                  <th className="p-3 border-r border-white/20">Elemento</th>
                  <th className="p-3 border-r border-white/20">Abrev.</th>
                  <th className="p-3 border-r border-white/20">Código Generado (.RFA)</th>
                  <th className="p-3 w-[60px] text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-[#1c1c19]">
                {matrixElements.length === 0 && (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-xs font-bold text-gray-500 bg-[#f6f3ee]">No hay elementos con código en la matriz LOD.</td>
                  </tr>
                )}
                {matrixElements.map((m, idx) => {
                  const specAbbrev = getSpecialtyAbbrevForDiscipline(m.discipline);
                  const mCode = `${originCode}_${specAbbrev}_${m.abbreviation}_${descripcion || 'Desc'}_${variante || 'Var'}`;
                  return (
                    <tr key={idx} className="hover:bg-[#f6f3ee] transition-colors">
                      <td className="p-3 border-r-2 border-[#1c1c19] text-[10px] font-bold uppercase">{m.discipline}</td>
                      <td className="p-3 border-r-2 border-[#1c1c19] text-xs font-black text-[#0f4369]">{m.element}</td>
                      <td className="p-3 border-r-2 border-[#1c1c19] text-xs font-mono font-bold bg-[#fcf9f4]">{m.abbreviation}</td>
                      <td className="p-3 border-r-2 border-[#1c1c19] text-xs font-mono font-bold text-[#1c1c19] whitespace-nowrap">{mCode}</td>
                      <td className="p-2 text-center align-middle">
                        <button 
                          onClick={() => copyToClipboard(mCode, `row-${idx}`)}
                          className="p-2 bg-[#1c1c19] text-white hover:bg-[#0f4369] transition-colors"
                          title="Copiar Código"
                        >
                          {copiedRow === `row-${idx}` ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-[#e8f0fe] border-2 border-[#0f4369] p-4 flex gap-3 shadow-[4px_4px_0_0_rgba(15,67,105,1)]">
          <Info size={20} className="text-[#0f4369] shrink-0 mt-0.5" />
          <p className="text-xs font-bold text-[#0f4369] uppercase leading-relaxed">
            Este protocolo es dinámico. Si modificas el Código del Proyecto en "Información General", los diminutivos en "Catálogo de Especialidades", o los códigos en la "Matriz LOD y TDI", los ejemplos mostrados aquí se actualizarán automáticamente.
          </p>
        </div>

      </div>
    </div>
  );
}
