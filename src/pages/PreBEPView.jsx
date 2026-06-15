import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  X, Download, Database, AlertTriangle, Loader2, Search, Printer, LayoutGrid,
  ChevronRight, RefreshCw, Info, Save, CheckCircle2, CloudOff, Book, FileText
} from 'lucide-react';
import { databaseReportService, TABLE_METADATA } from '../services/databaseReportService';
import { projectService } from '../services/projectService';
import { getMaterials } from '../services/materialsService';
import { supabase } from '../services/supabaseClient';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import ContentBlockEditor from '../components/modules/ContentBlockEditor';

// Helper para limpiar objetos de cualquier UUID o campo ID
const cleanObjectFromUuids = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(item => cleanObjectFromUuids(item));
  }
  if (typeof obj === 'object') {
    const cleaned = {};
    for (const [key, val] of Object.entries(obj)) {
      const keyLower = key.toLowerCase();
      const isId = keyLower === 'id' || keyLower.endsWith('_id') || keyLower.endsWith('id') || keyLower.includes('uuid') || keyLower === 'key';
      const isUuidVal = typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
      if (!isId && !isUuidVal) {
        cleaned[key] = cleanObjectFromUuids(val);
      }
    }
    return cleaned;
  }
  return obj;
};

// Helper para renderizar objetos, arrays o valores simples de forma legible y elegante en el documento impreso
const renderObjectOrValue = (val) => {
  if (val === null || val === undefined || val === '') return <span className="text-gray-400 italic font-mono">-</span>;

  if (typeof val === 'string') {
    const trimmed = val.trim();
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        const parsed = JSON.parse(trimmed);
        return renderObjectOrValue(parsed);
      } catch (e) {
        // Not a valid JSON, continue normal rendering
      }
    }
  }

  if (typeof val === 'boolean') {
    return val ? (
      <span className="bg-green-100 text-green-800 text-[9px] font-bold px-2 py-0.5 rounded border border-green-300 uppercase">TRUE</span>
    ) : (
      <span className="bg-red-100 text-red-800 text-[9px] font-bold px-2 py-0.5 rounded border border-red-300 uppercase">FALSE</span>
    );
  }

  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-gray-400 italic uppercase text-[9px]">-</span>;
    // Si es un arreglo de objetos complejos
    if (typeof val[0] === 'object') {
      return (
        <div className="space-y-2 pl-3 border-l-2 border-gray-200 mt-1.5 w-full">
          {val.map((item, idx) => (
            <div key={idx} className="p-2 bg-[#fcf9f4] border border-gray-300 text-[9px] rounded shadow-[2px_2px_0_0_rgba(28,28,25,0.05)] w-full overflow-hidden">
              {renderObjectOrValue(item)}
            </div>
          ))}
        </div>
      );
    }
    // Si es un arreglo simple
    return (
      <ul className="list-disc list-inside mt-1 pl-2 space-y-0.5">
        {val.map((item, idx) => (
          <li key={idx} className="text-[9px] text-gray-700 uppercase font-mono">{String(item)}</li>
        ))}
      </ul>
    );
  }

  if (typeof val === 'object') {
    const cleaned = cleanObjectFromUuids(val);
    const entries = Object.entries(cleaned);
    if (entries.length === 0) return <span className="text-gray-400 italic uppercase text-[9px]">-</span>;
    return (
      <div className="grid grid-cols-1 gap-1 text-[9px] mt-1.5 pl-3 border-l-2 border-gray-200 w-full overflow-hidden">
        {entries.map(([k, v]) => (
          <div key={k} className="flex flex-col md:flex-row md:items-start gap-1 w-full overflow-hidden">
            <span className="font-bold text-[#0f4369] uppercase min-w-[100px] break-all select-none">{k}:</span>
            <span className="text-slate-700 flex-1 break-words">{renderObjectOrValue(v)}</span>
          </div>
        ))}
      </div>
    );
  }

  const valStr = String(val);
  if (/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(valStr)) {
    return <span className="text-gray-400 italic font-mono">-</span>;
  }
  
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}(?::?\d{2})?)?$/.test(valStr)) {
    try {
      const d = new Date(valStr);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
    } catch (e) {}
  }
  
  if (/^\d{4}-\d{2}-\d{2}$/.test(valStr)) {
    try {
      const d = new Date(`${valStr}T00:00:00`);
      if (!isNaN(d.getTime())) {
        return d.toLocaleDateString('es-CO', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      }
    } catch (e) {}
  }

  if (valStr.startsWith('http://') || valStr.startsWith('https://')) {
    return <a href={valStr} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{valStr}</a>;
  }
  return valStr;
};

const PROJECT_TABS_OPTIONS = [
  // Del Sidebar del Proyecto
  { label: 'DATOS DEL PROYECTO', url: '?tab=datos' },
  { label: 'BEP - ESQUEMA', url: '/esquemas' },
  { label: 'BEP - ORGANIZADOR / DEPLOYER', url: '/planner' },
  { label: 'BEP - PROTOCOLOS', url: '?tab=protocolos' },
  { label: 'BEP - EQUIPO Y ROLES', url: '?tab=equipo&subtab=roles' },
  { label: 'BEP - PRE BEP', url: '/pre-bep' },
  { label: 'SUB PROYECTO / UNIDADES', url: '?tab=proyecto' },
  { label: 'MATERIALES', url: '/materials' },
  { label: 'DOCUMENTOS', url: '/documents' },
  { label: 'CALENDARIO SEM/MES', url: '?tab=mes' },
  { label: 'REQUISITOS DE INFORMACION', url: '?tab=requisitos' },
  { label: 'EQUIPO', url: '?tab=equipo' },
  { label: 'DIRECTORIO', url: '?tab=directorio' },
  
  // Adicionales
  { label: 'CURSOS / CAPACITACIÓN', url: '/roadmap' },
  { label: 'PROYECTO - MATRIZ LOD/TDI', url: '?tab=datos&subtab=lod_tdi' }, // Keep for legacy
  { label: 'GLOBAL - DICCIONARIO BIM', url: '/dictionary' },
  { label: 'GLOBAL - PORTAFOLIO DE PROYECTOS', url: '/projects' },

  // Ocultar
  { label: 'NINGUNO (OCULTAR ENLACE)', url: '' }
];

const EditableTabLink = ({ projectId, sectionId, defaultLabel, defaultUrl }) => {
  const [override, setOverride] = useState(() => {
    const saved = localStorage.getItem(`prebep_links_${projectId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed[sectionId]) return parsed[sectionId];
      } catch (e) {}
    }
    return null;
  });

  const [isEditing, setIsEditing] = useState(false);

  const currentLabel = override ? override.label : defaultLabel;
  const currentUrl = override ? override.url : defaultUrl;

  const handleSelect = (e) => {
    const selectedUrl = e.target.value;
    const selectedOpt = PROJECT_TABS_OPTIONS.find(opt => opt.url === selectedUrl);
    
    // Fallback if not found
    const label = selectedOpt ? selectedOpt.label : currentLabel;
    
    const newOverride = { label, url: selectedUrl };
    setOverride(newOverride);
    setIsEditing(false);

    const saved = localStorage.getItem(`prebep_links_${projectId}`);
    let parsed = {};
    if (saved) {
      try { parsed = JSON.parse(saved); } catch (e) {}
    }
    parsed[sectionId] = newOverride;
    localStorage.setItem(`prebep_links_${projectId}`, JSON.stringify(parsed));
  };

  const getHref = () => {
    if (!currentUrl) return '#';
    if (currentUrl.startsWith('?')) {
      return `/project/${projectId}${currentUrl}`;
    }
    const projectRoutes = ['/pre-bep', '/materials', '/documents', '/esquemas', '/planner'];
    if (projectRoutes.includes(currentUrl)) {
      return `${currentUrl}?projectId=${projectId}`;
    }
    return currentUrl;
  };

  if (currentUrl === '' && !isEditing) {
     return (
        <div className="mt-4 flex items-center justify-end no-print">
           <button onClick={() => setIsEditing(true)} className="text-[9px] text-gray-300 hover:text-gray-500 underline uppercase tracking-widest font-bold transition-colors">Mostrar Enlace / Editar</button>
        </div>
     );
  }

  return (
    <div className="mt-4 flex items-center gap-2 text-[10px] uppercase font-bold text-[#0f4369] bg-[#fcf9f4] p-2 border-l-4 border-[#ba1a1a] relative group">
      <span>👉 PARA INFORMACION COMPLETA VEASE : </span>
      {isEditing ? (
        <select 
          autoFocus
          value={currentUrl} 
          onChange={handleSelect}
          onBlur={() => setIsEditing(false)}
          className="border-b-2 border-[#1c1c19] text-[#1c1c19] text-[9px] font-bold p-1 bg-white outline-none cursor-pointer max-w-full"
        >
          {PROJECT_TABS_OPTIONS.map(opt => (
            <option key={opt.url} value={opt.url}>{opt.label}</option>
          ))}
        </select>
      ) : (
        <a href={getHref()} className="underline hover:text-[#ba1a1a] transition-colors break-words">
          {currentLabel}
        </a>
      )}
      {!isEditing && (
        <button 
          onClick={() => setIsEditing(true)} 
          className="opacity-0 group-hover:opacity-100 no-print ml-auto text-gray-400 hover:text-[#1c1c19] bg-gray-200 px-1.5 py-0.5 rounded text-[8px] transition-opacity"
        >
          Editar
        </button>
      )}
    </div>
  );
};

export default function PreBEPView() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || 'kengo-kuma';
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeView, setActiveView] = useState('document'); // 'document' or 'control_panel'
  
  // States for Control Panel
  const [chapterVisibility, setChapterVisibility] = useState(() => {
    const defaultVisibility = {
      datos: true,
      unidades: true,
      directorio: true,
      requisitos: true,
      lod_tdi: true,
      protocolos: true,
      materiales: true,
      documentos: true,
      calendario: true,
      esquemas: true,
      software: true,
      objetivos: true,
      cronograma_entregas: true
    };
    const saved = localStorage.getItem(`prebep_chapter_visibility_${projectId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Aseguramos que las nuevas llaves existan si el localStorage es antiguo
        return { ...defaultVisibility, ...parsed };
      } catch(e) {
        return defaultVisibility;
      }
    }
    return defaultVisibility;
  });

  const handleChapterVisibilityChange = (key, value) => {
    setChapterVisibility(prev => {
      const next = { ...prev, [key]: value };
      localStorage.setItem(`prebep_chapter_visibility_${projectId}`, JSON.stringify(next));
      return next;
    });
  };

  const CHAPTER_LABELS = {
    datos: "Datos del Proyecto",
    unidades: "Sub Proyectos / Unidades",
    directorio: "Equipo, Roles y Directorio",
    software: "Software y Plataformas",
    requisitos: "Requisitos de Información",
    lod_tdi: "Matriz de Entregables (LOD/TDI)",
    protocolos: "Protocolos",
    materiales: "Base de Datos de Materiales",
    documentos: "Documentos Generales",
    calendario: "Calendario Sem/Mes (Tasks)",
    esquemas: "BEP (Esquemas / Organizador)",
    objetivos: "Objetivos del Proyecto",
    cronograma_entregas: "Cronograma de Entregas"
  };

  const defaultChapterOrder = [
    'datos', 'unidades', 'directorio', 'software', 'requisitos', 'lod_tdi',
    'protocolos', 'materiales', 'documentos', 'calendario', 'esquemas',
    'objetivos', 'cronograma_entregas'
  ];

  const [chapterOrder, setChapterOrder] = useState(() => {
    const saved = localStorage.getItem(`prebep_chapter_order_${projectId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure all default chapters exist in parsed array
        const missing = defaultChapterOrder.filter(c => !parsed.includes(c));
        return [...parsed, ...missing];
      } catch (e) {
        return defaultChapterOrder;
      }
    }
    return defaultChapterOrder;
  });

  const handleOrderChange = (key, newIndex) => {
    // newIndex is 1-based index from the user input
    if (isNaN(newIndex)) return;
    let targetIndex = newIndex - 1;
    if (targetIndex < 0) targetIndex = 0;
    if (targetIndex >= chapterOrder.length) targetIndex = chapterOrder.length - 1;
    
    setChapterOrder(prev => {
      const currentIndex = prev.indexOf(key);
      if (currentIndex === targetIndex) return prev;
      
      const newOrder = [...prev];
      newOrder.splice(currentIndex, 1);
      newOrder.splice(targetIndex, 0, key);
      
      localStorage.setItem(`prebep_chapter_order_${projectId}`, JSON.stringify(newOrder));
      return newOrder;
    });
  };

  const [showIndex, setShowIndex] = useState(() => {
    const saved = localStorage.getItem(`prebep_show_index_${projectId}`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const handleShowIndexChange = (value) => {
    setShowIndex(value);
    localStorage.setItem(`prebep_show_index_${projectId}`, JSON.stringify(value));
  };

  const [selectedExplorerTable, setSelectedExplorerTable] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Structured data states (Unified from BimPreBEPDocument)
  const [project, setProject] = useState(null);
  const [pebInfo, setPebInfo] = useState(null);
  const [specialties, setSpecialties] = useState([]);
  const [bepTeam, setBepTeam] = useState([]);
  const [staff, setStaff] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [lodTdi, setLodTdi] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [spaces, setSpaces] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [plans, setPlans] = useState([]);
  const [software, setSoftware] = useState([]);
  const [objectives, setObjectives] = useState([]);
  const [bimUses, setBimUses] = useState([]);
  const [deliverables, setDeliverables] = useState([]);

  // LOD Columns state
  const [lodVisibleColumns, setLodVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(`prebep_lod_columns_${projectId}`);
    return saved ? JSON.parse(saved) : ['discipline', 'element_name', 'esquema_basico', 'anteproyecto', 'proy_finales', 'notas'];
  });

  const handleLodColumnToggle = (col) => {
    const nextCols = lodVisibleColumns.includes(col) 
      ? lodVisibleColumns.filter(c => c !== col)
      : [...lodVisibleColumns, col];
    setLodVisibleColumns(nextCols);
    localStorage.setItem(`prebep_lod_columns_${projectId}`, JSON.stringify(nextCols));
  };

  // Materiales Columns state
  const [materialesVisibleColumns, setMaterialesVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(`prebep_materiales_columns_${projectId}`);
    return saved ? JSON.parse(saved) : ['Nombre', 'categoria', 'unidad', 'precio_COP'];
  });

  const handleMaterialesColumnToggle = (col) => {
    const nextCols = materialesVisibleColumns.includes(col) 
      ? materialesVisibleColumns.filter(c => c !== col)
      : [...materialesVisibleColumns, col];
    setMaterialesVisibleColumns(nextCols);
    localStorage.setItem(`prebep_materiales_columns_${projectId}`, JSON.stringify(nextCols));
  };

  // Protocols display mode state
  const [showFullProtocols, setShowFullProtocols] = useState(() => {
    const saved = localStorage.getItem(`prebep_show_full_protocols_${projectId}`);
    return saved !== null ? JSON.parse(saved) : true;
  });

  const [subproyectosVisibleColumns, setSubproyectosVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(`prebep_subproyectos_columns_${projectId}`);
    return saved ? JSON.parse(saved) : ['nombre', 'datos'];
  });
  const handleSubproyectosColumnToggle = (col) => {
    const nextCols = subproyectosVisibleColumns.includes(col) ? subproyectosVisibleColumns.filter(c => c !== col) : [...subproyectosVisibleColumns, col];
    setSubproyectosVisibleColumns(nextCols);
    localStorage.setItem(`prebep_subproyectos_columns_${projectId}`, JSON.stringify(nextCols));
  };

  const [equipoVisibleColumns, setEquipoVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(`prebep_equipo_columns_${projectId}`);
    return saved ? JSON.parse(saved) : ['rol', 'nombre', 'compania'];
  });
  const handleEquipoColumnToggle = (col) => {
    const nextCols = equipoVisibleColumns.includes(col) ? equipoVisibleColumns.filter(c => c !== col) : [...equipoVisibleColumns, col];
    setEquipoVisibleColumns(nextCols);
    localStorage.setItem(`prebep_equipo_columns_${projectId}`, JSON.stringify(nextCols));
  };

  const [directorioVisibleColumns, setDirectorioVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(`prebep_directorio_columns_${projectId}`);
    return saved ? JSON.parse(saved) : ['nombre', 'rol', 'compania', 'contacto'];
  });
  const handleDirectorioColumnToggle = (col) => {
    const nextCols = directorioVisibleColumns.includes(col) ? directorioVisibleColumns.filter(c => c !== col) : [...directorioVisibleColumns, col];
    setDirectorioVisibleColumns(nextCols);
    localStorage.setItem(`prebep_directorio_columns_${projectId}`, JSON.stringify(nextCols));
  };

  const [softwareVisibleColumns, setSoftwareVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(`prebep_software_columns_${projectId}`);
    return saved ? JSON.parse(saved) : ['software', 'version', 'uso'];
  });
  const handleSoftwareColumnToggle = (col) => {
    const nextCols = softwareVisibleColumns.includes(col) ? softwareVisibleColumns.filter(c => c !== col) : [...softwareVisibleColumns, col];
    setSoftwareVisibleColumns(nextCols);
    localStorage.setItem(`prebep_software_columns_${projectId}`, JSON.stringify(nextCols));
  };

  const [calendarioVisibleColumns, setCalendarioVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(`prebep_calendario_columns_${projectId}`);
    return saved ? JSON.parse(saved) : ['tarea', 'estado', 'fechas'];
  });
  const handleCalendarioColumnToggle = (col) => {
    const nextCols = calendarioVisibleColumns.includes(col) ? calendarioVisibleColumns.filter(c => c !== col) : [...calendarioVisibleColumns, col];
    setCalendarioVisibleColumns(nextCols);
    localStorage.setItem(`prebep_calendario_columns_${projectId}`, JSON.stringify(nextCols));
  };

  const [objetivosVisibleColumns, setObjetivosVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(`prebep_objetivos_columns_${projectId}`);
    return saved ? JSON.parse(saved) : ['prioridad', 'descripcion', 'usos'];
  });
  const handleObjetivosColumnToggle = (col) => {
    const nextCols = objetivosVisibleColumns.includes(col) ? objetivosVisibleColumns.filter(c => c !== col) : [...objetivosVisibleColumns, col];
    setObjetivosVisibleColumns(nextCols);
    localStorage.setItem(`prebep_objetivos_columns_${projectId}`, JSON.stringify(nextCols));
  };

  const [entregasVisibleColumns, setEntregasVisibleColumns] = useState(() => {
    const saved = localStorage.getItem(`prebep_entregas_columns_${projectId}`);
    return saved ? JSON.parse(saved) : ['entregable_bim', 'fase', 'responsable'];
  });
  const handleEntregasColumnToggle = (col) => {
    const nextCols = entregasVisibleColumns.includes(col) ? entregasVisibleColumns.filter(c => c !== col) : [...entregasVisibleColumns, col];
    setEntregasVisibleColumns(nextCols);
    localStorage.setItem(`prebep_entregas_columns_${projectId}`, JSON.stringify(nextCols));
  };

  // State for active config tab in Control Panel
  const [activeConfigTab, setActiveConfigTab] = useState('lod_tdi');

  const toggleProtocolsDisplay = () => {
    const nextVal = !showFullProtocols;
    setShowFullProtocols(nextVal);
    localStorage.setItem(`prebep_show_full_protocols_${projectId}`, JSON.stringify(nextVal));
  };

  // Database metadata explorer states
  const [availableTables, setAvailableTables] = useState([]);
  const [dbData, setDbData] = useState({});

  // Configuración de tamaños de página (En Encuadre Vertical)
  // Por defecto inicializamos con 5 páginas del alto estándar Carta (278.8mm)
  const [pageHeights, setPageHeights] = useState([278.8, 278.8, 278.8, 278.8, 278.8]);

  // Estado de guardado de configuración
  const [configSaveStatus, setConfigSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const saveTimeoutRef = useRef(null);

  // Medición de altura del contenido del documento continuo para evitar imprimir páginas vacías
  const [contentHeightMm, setContentHeightMm] = useState(0);

  useEffect(() => {
    if (loading) return;
    
    const el = document.querySelector('.continuous-document-content');
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const heightPx = entry.contentRect.height;
        const heightMm = heightPx * 0.264583;
        setContentHeightMm(heightMm);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, [loading]);

  // ─── PERSISTENCIA DE CONFIGURACIÓN DE PÁGINAS ───────────────────────────

  // Dos fases: 'init' (antes de cargar de BD) → 'loaded' (después de cargar) → 'ready' (ya se puede autosave)
  const configPhase = useRef('init'); // 'init' | 'loaded' | 'ready'

  /** Carga la configuración guardada de páginas desde Supabase */
  const loadPageConfig = useCallback(async () => {
    try {
      // Intentar primero con usuario autenticado, luego sin usuario
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      const userId = user?.id ?? null;

      console.log('[PreBEP] loadPageConfig - projectId:', projectId, '| userId:', userId);

      // Buscar config del usuario actual
      let { data, error } = await supabase
        .from('pre_bep_config')
        .select('page_heights')
        .eq('project_id', projectId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('[PreBEP] loadPageConfig result:', { data, error });

      if (error) {
        console.warn('[PreBEP] Error cargando config (¿existe la tabla?):', error.message);
        configPhase.current = 'ready'; // Permitir guardar aunque no haya cargado
        return;
      }

      if (data?.page_heights && data.page_heights.length > 0) {
        console.log('[PreBEP] Configuración cargada:', data.page_heights);
        configPhase.current = 'loaded'; // Marcar: vamos a hacer setPageHeights
        setPageHeights(data.page_heights);
        // 'ready' se marcará en el useEffect tras el render del setPageHeights
      } else {
        console.log('[PreBEP] Sin config guardada, usando defaults.');
        configPhase.current = 'ready';
      }
    } catch (err) {
      console.warn('[PreBEP] No se pudo cargar la configuración:', err);
      configPhase.current = 'ready';
    }
  }, [projectId]);

  /** Guarda la configuración de páginas en Supabase (UPSERT) */
  const savePageConfig = useCallback(async (heights) => {
    setConfigSaveStatus('saving');
    try {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
      const userId = user?.id ?? null;

      console.log('[PreBEP] savePageConfig - heights:', heights, '| userId:', userId);

      // Estrategia: DELETE + INSERT para evitar problemas de NULL en UNIQUE constraint
      // Primero intentar UPDATE, si no hay fila, hacer INSERT
      let error;

      if (userId) {
        // Usuario autenticado: usar upsert normal
        const result = await supabase
          .from('pre_bep_config')
          .upsert(
            { project_id: projectId, user_id: userId, page_heights: heights },
            { onConflict: 'project_id,user_id' }
          );
        error = result.error;
      } else {
        // Sin usuario: primero intentar UPDATE, si no existe hacer INSERT
        const updateResult = await supabase
          .from('pre_bep_config')
          .update({ page_heights: heights })
          .eq('project_id', projectId)
          .is('user_id', null);

        if (updateResult.error || updateResult.count === 0) {
          // No había fila, insertar
          const insertResult = await supabase
            .from('pre_bep_config')
            .insert({ project_id: projectId, user_id: null, page_heights: heights });
          error = insertResult.error;
        } else {
          error = updateResult.error;
        }
      }

      console.log('[PreBEP] savePageConfig result error:', error);

      if (error) throw error;
      setConfigSaveStatus('saved');
      setTimeout(() => setConfigSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('[PreBEP] Error al guardar configuración:', err);
      setConfigSaveStatus('error');
      setTimeout(() => setConfigSaveStatus('idle'), 3000);
    }
  }, [projectId]);

  // Autosave con debounce de 800ms — solo cuando configPhase es 'ready'
  useEffect(() => {
    if (configPhase.current === 'init') {
      return; // Todavía en inicialización, ignorar
    }
    if (configPhase.current === 'loaded') {
      // Este render es el resultado del setPageHeights tras cargar la BD
      // Marcamos como 'ready' para el SIGUIENTE cambio de usuario
      configPhase.current = 'ready';
      return;
    }
    // configPhase === 'ready': el usuario hizo un cambio real, guardar
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      savePageConfig(pageHeights);
    }, 800);
    return () => clearTimeout(saveTimeoutRef.current);
  }, [pageHeights, savePageConfig]);

  // ─────────────────────────────────────────────────────────────────────────

  // Cargar todos los datos unificados
  const loadData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      // Cargar todos los datos estructurados en paralelo
      const [
        projData,
        pebInfoData,
        specialtiesData,
        teamData,
        staffData,
        contactsData,
        reqData,
        lodData,
        protocolsData,
        spacesData,
        materialsData,
        docsData,
        tasksData,
        plansData,
        softwareData,
        objectivesData,
        bimUsesData,
        deliverablesData,
        tables
      ] = await Promise.all([
        projectService.getProjectById(projectId).catch(() => ({ id: projectId, name: 'KENGO KUMA RESORT' })),
        databaseReportService.getTableData('project_general_info', projectId).then(data => data && data.length > 0 ? data[0] : null).catch(() => null),
        projectService.getSpecialties(projectId).catch(() => []),
        projectService.getBepTeam(projectId).catch(() => []),
        projectService.getStaff().catch(() => []),
        projectService.getDirectoryContacts(projectId).catch(() => []),
        projectService.getInformationRequirements(projectId).catch(() => []),
        projectService.getLodTdiMatrix(projectId)
          .then(data => {
            return data.map(item => {
              let parsedNotes = {};
              if (typeof item.notes === 'string' && item.notes.trim().startsWith('{')) {
                try { parsedNotes = JSON.parse(item.notes); } catch(e) {}
              } else {
                parsedNotes = { text: item.notes };
              }
              
              const formatPhase = (phase) => {
                if (!phase) return '-';
                const aem = phase.aem ? `AEM: ${phase.aem}` : '';
                const lod = phase.lod ? `LOD: ${phase.lod}` : '';
                if (aem && lod) return `${aem} | ${lod}`;
                if (aem) return aem;
                if (lod) return lod;
                return '-';
              };

              return {
                discipline: item.discipline,
                element_name: item.element_name,
                esquema_basico: formatPhase(parsedNotes.esquema),
                anteproyecto: formatPhase(parsedNotes.anteproyecto),
                proy_finales: formatPhase(parsedNotes.finales),
                lod: item.lod,
                tdi: item.tdi,
                notas: parsedNotes.text || ''
              };
            });
          })
          .catch(() => []),
        projectService.getProtocols(projectId)
          .then(async (protos) => {
            const extended = await Promise.all(protos.map(async (protocol) => {
              const { data: blocks } = await supabase.from('resource_content_blocks').select('*').eq('resource_id', protocol.id).order('sort_order', { ascending: true });
              const { data: childrenData } = await supabase.from('resources').select('*').eq('image_url', protocol.id);
              let manuals = [];
              let templates = [];
              if (childrenData && childrenData.length > 0) {
                 const childrenWithBlocks = await Promise.all(childrenData.map(async (child) => {
                    const { data: childBlocks } = await supabase.from('resource_content_blocks').select('*').eq('resource_id', child.id).order('sort_order', { ascending: true });
                    return { ...child, blocks: childBlocks || [] };
                 }));
                 manuals = childrenWithBlocks.filter(c => c.category === 'Manual');
                 templates = childrenWithBlocks.filter(c => c.category === 'Plantilla');
              }
              return { ...protocol, blocks: blocks || [], manuals, templates };
            }));
            return extended;
          })
          .catch(() => []),
        projectService.getSpaces(projectId).catch(() => []),
        getMaterials().catch(() => []),
        databaseReportService.getTableData('resources', projectId).then(data => data.filter(r => r.category !== 'Protocolo')).catch(() => []),
        databaseReportService.getTableData('tasks', projectId).catch(() => []),
        databaseReportService.getTableData('bim_plans', projectId).catch(() => []),
        databaseReportService.getTableData('project_software', projectId).then(data => {
          if (data && data.length > 0) return data;
          try {
            const local = localStorage.getItem(`project_software_${projectId}`);
            if (local && JSON.parse(local).length > 0) return JSON.parse(local);
          } catch(e) {}
          return [
            { software_principal: 'Revit', version_software: '2025', uso_del_modelo: 'Modelado BIM — Arquitectura, Estructura, Instalaciones, Protección contra incendios y Seguridad', es_software_primario: true },
            { software_principal: 'Navisworks Manage', version_software: '2025', uso_del_modelo: 'Coordinación 3D y Detección de interferencias (Clash Detection) — Equipo BIM y Coordinación Técnica', es_software_primario: false }
          ];
        }).catch(() => []),

        databaseReportService.getTableData('project_objectives', projectId).then(data => {
          if (data && data.length > 0) return data;
          try {
            const local = localStorage.getItem(`project_objectives_${projectId}`);
            if (local && JSON.parse(local).length > 0) return JSON.parse(local);
          } catch(e) {}
          return [
            { prioridad: 1, descripcion: 'Incrementar eficacia en el diseño', usos_potenciales: 'Desarrollo de diseños y Generación de Documentación.' },
            { prioridad: 1, descripcion: 'Revisar el progreso del diseño', usos_potenciales: 'Revisión de diseños y Coordinación 3D' },
            { prioridad: 1, descripcion: 'Evaluación de las cantidades asociadas a cambios en diseño y sus efectos en la cadena de valor', usos_potenciales: 'Cuantificación de Cantidades de obra 5D' },
            { prioridad: 1, descripcion: 'Optimización del proceso constructivo y manejo de Obra', usos_potenciales: 'Generación de documentación.' }
          ];
        }).catch(() => []),

        databaseReportService.getTableData('project_bim_uses', projectId).then(data => {
          if (data && data.length > 0) return data;
          try {
            const local = localStorage.getItem(`project_bim_uses_${projectId}`);
            if (local && JSON.parse(local).length > 0) return JSON.parse(local);
          } catch(e) {}
          return [
            { valor: 'ALTO', uso: 'Desarrollo de diseños (3D)', descripcion: 'Creación de los modelos BIM de las distintas disciplinas del proyecto para incorporar la información a una base de datos inteligente de la cual se pueden extraer diferentes tipos de data.', priority: 1 },
            { valor: 'MEDIO', uso: 'Documentación para la construcción', descripcion: 'A partir de los modelos BIM en el desarrollo de diseños, se genera la información planimétrica necesaria para la construcción, de tal manera que sea coherente entre la documentación y las revisiones.', priority: 1 },
            { valor: 'ALTO', uso: 'Coordinación 3D', descripcion: 'Proceso de planificación entre las distintas disciplinas previo y durante las fases de diseño para evitar posibles interferencias. Comprende la detección de interferencias entre varios modelos.', priority: 1 },
            { valor: 'MEDIO', uso: 'Cuantificación de Cantidades de obra 5D', descripcion: 'Proceso de utilización de la información de uno o más modelos BIM para extraer cantidades de componentes y materiales del proyecto', priority: 1 }
          ];
        }).catch(() => []),
        databaseReportService.getTableData('project_delivery_schedule', projectId).catch(() => []),
        databaseReportService.getAvailableTables()
      ]);

      setProject(projData);
      setPebInfo(pebInfoData);
      setSpecialties(specialtiesData || []);
      setBepTeam(teamData);
      setStaff(staffData);
      setContacts(contactsData);
      setRequirements(reqData);
      setLodTdi(lodData);
      setProtocols(protocolsData);
      setSpaces(spacesData);
      setMaterials(materialsData);
      setDocuments(docsData);
      setTasks(tasksData);
      setPlans(plansData);
      setSoftware(softwareData || []);
      setObjectives(objectivesData || []);
      setBimUses(bimUsesData || []);
      setDeliverables(deliverablesData || []);
      setAvailableTables(tables || []);

      if (tables?.length > 0 && !selectedExplorerTable) {
        setSelectedExplorerTable(tables[0]);
      }

      // Descargar datos de todas las tablas para el Explorador Interactivo
      const dataPromises = (tables || []).map(async (table) => {
        try {
          const records = await databaseReportService.getTableData(table, projectId);
          return { table, records, error: null };
        } catch (err) {
          return { table, records: [], error: err.message || 'Error' };
        }
      });

      const results = await Promise.all(dataPromises);
      const dataMap = {};
      results.forEach(res => {
        dataMap[res.table] = {
          records: res.records,
          error: res.error
        };
      });
      setDbData(dataMap);
    } catch (error) {
      console.error("Error loading Pre-BEP data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    loadPageConfig(); // Cargar configuración de páginas guardada
  }, [projectId]);


  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    return d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handlePageHeightChange = (idx, val) => {
    const nextHeights = [...pageHeights];
    nextHeights[idx] = val;
    setPageHeights(nextHeights);
  };

  const addPage = () => {
    setPageHeights([...pageHeights, 278.8]);
  };

  const deletePage = (idx) => {
    if (pageHeights.length <= 1) return;
    const nextHeights = [...pageHeights];
    nextHeights.splice(idx, 1);
    setPageHeights(nextHeights);
  };

  const resetPages = () => {
    setPageHeights([278.8, 278.8, 278.8, 278.8, 278.8]);
  };

  const startDrag = (e, idx) => {
    e.preventDefault();
    const startY = e.clientY;
    let startHeight;
    setPageHeights(prev => { startHeight = prev[idx]; return prev; });

    let ticking = false;

    const onMouseMove = (moveEvent) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const deltaY = moveEvent.clientY - startY;
          const mmDelta = deltaY * 0.264583;
          let newHeight = startHeight + mmDelta;
          if (newHeight < 40) newHeight = 40;
          if (newHeight > 278.8) newHeight = 278.8;
          
          setPageHeights(prev => {
            const next = [...prev];
            next[idx] = newHeight;
            return next;
          });
          ticking = false;
        });
        ticking = true;
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Renderiza una tabla genérica con todos los campos disponibles (para el explorador)
  const renderGenericTable = (tableName, records, error) => {
    if (error) {
      return (
        <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 text-xs font-mono uppercase flex items-center gap-2">
          <AlertTriangle size={16} /> Error: {error}
        </div>
      );
    }

    if (!records || records.length === 0) {
      return (
        <div className="p-4 bg-gray-50 border border-dashed border-gray-300 text-gray-500 text-xs font-mono uppercase italic">
          No hay registros cargados en esta tabla.
        </div>
      );
    }

    // Extraer todas las columnas únicas de los registros, excluyendo IDs técnicos
    const columns = Object.keys(records[0]).filter(col => {
      const colLower = col.toLowerCase();
      const isIdName = colLower === 'id' || colLower.endsWith('_id') || colLower.endsWith('id') || colLower.includes('uuid') || colLower === 'key';
      if (isIdName) return false;

      // Filtrar columnas donde todos o algunos valores son UUIDs
      const hasUuid = records.some(row => {
        const val = row[col];
        if (val === null || val === undefined || val === '') return false;
        return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(val));
      });
      return !hasUuid;
    });

    return (
      <div className="overflow-x-auto border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.15)] bg-white max-w-full">
        <table className="w-full text-[10px] border-collapse font-sans">
          <thead>
            <tr className="bg-[#1c1c19] text-white border-b-2 border-[#1c1c19]">
              {columns.map(col => (
                <th key={col} className="p-2.5 text-left font-mono font-bold uppercase tracking-wider border-r border-gray-700 select-none">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-200 hover:bg-[#fcf9f4] transition-colors even:bg-gray-50/50">
                {columns.map(col => (
                  <td key={col} className="p-2.5 border-r border-gray-200 align-top max-w-xs truncate hover:whitespace-normal hover:overflow-visible hover:break-all font-mono text-[9px]">
                    {renderObjectOrValue(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSubproyectosTable = () => (
    <table className="w-full text-xs border-collapse border border-gray-300 table-fixed">
      <thead className="bg-[#f6f3ee]">
        <tr>
          {subproyectosVisibleColumns.includes('nombre') && <th className="p-2.5 text-left border-r border-gray-300 font-bold uppercase w-1/3">Sub-proyecto / Fase</th>}
          {subproyectosVisibleColumns.includes('datos') && <th className="p-2.5 text-left font-bold uppercase">Descripción / Datos</th>}
        </tr>
      </thead>
      <tbody>
        {spaces.map((s, idx) => (
          <tr key={idx} className="border-b border-gray-200">
            {subproyectosVisibleColumns.includes('nombre') && <td className="p-2.5 font-semibold bg-gray-50 border-r border-gray-200 uppercase break-all">{s.name || 'Subproyecto sin nombre'}</td>}
            {subproyectosVisibleColumns.includes('datos') && <td className="p-2.5 break-words overflow-hidden">{renderObjectOrValue(s.Datos || s.description || 'Sin datos adicionales')}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderEquipoTable = () => (
    <table className="w-full text-xs border-collapse border border-gray-300 mb-8 table-fixed">
      <thead className="bg-[#1c1c19] text-white">
        <tr>
          {equipoVisibleColumns.includes('rol') && <th className="p-2 border-r border-gray-600 text-left w-1/3">Rol</th>}
          {equipoVisibleColumns.includes('nombre') && <th className="p-2 border-r border-gray-600 text-left w-1/3">Nombre</th>}
          {equipoVisibleColumns.includes('compania') && <th className="p-2 text-left">Compañía</th>}
        </tr>
      </thead>
      <tbody>
        {bepTeam.map((t, i) => {
          const staffNames = t.staff_ids && Array.isArray(t.staff_ids) && staff.length > 0
            ? t.staff_ids.map(id => {
                const s = staff.find(st => st.id === id);
                return s ? s.name : null;
              }).filter(Boolean).join(', ')
            : '';
          const finalName = staffNames || renderObjectOrValue(t.name) || '-';

          return (
            <tr key={i} className="border-b border-gray-200 hover:bg-[#fcf9f4]">
              {equipoVisibleColumns.includes('rol') && <td className="p-2 font-bold uppercase break-all">{renderObjectOrValue(t.role || t.role_name)}</td>}
              {equipoVisibleColumns.includes('nombre') && <td className="p-2 uppercase break-words">{finalName}</td>}
              {equipoVisibleColumns.includes('compania') && <td className="p-2 uppercase break-words">{renderObjectOrValue(t.company || t.organization)}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderDirectorioTable = (dataArray) => (
    <table className="w-full text-xs border-collapse border border-gray-300 table-fixed mb-6">
      <thead className="bg-[#f6f3ee]">
        <tr>
          {directorioVisibleColumns.includes('nombre') && <th className="p-2 border-r border-gray-300 text-left w-1/4">Nombre</th>}
          {directorioVisibleColumns.includes('rol') && <th className="p-2 border-r border-gray-300 text-left w-1/4">Rol / Cargo</th>}
          {directorioVisibleColumns.includes('compania') && <th className="p-2 border-r border-gray-300 text-left w-1/4">Compañía</th>}
          {directorioVisibleColumns.includes('contacto') && <th className="p-2 text-left">Contacto</th>}
        </tr>
      </thead>
      <tbody>
        {dataArray.map((c, i) => (
          <tr key={i} className="border-b border-gray-200">
            {directorioVisibleColumns.includes('nombre') && <td className="p-2 font-bold uppercase break-words">{renderObjectOrValue(c.name || c.nombre)}</td>}
            {directorioVisibleColumns.includes('rol') && <td className="p-2 uppercase break-words">{renderObjectOrValue(c.role || c.cargo || c.role_description)}</td>}
            {directorioVisibleColumns.includes('compania') && <td className="p-2 uppercase break-words">{renderObjectOrValue(c.company || c.empresa || c.compania)}</td>}
            {directorioVisibleColumns.includes('contacto') && <td className="p-2 font-mono text-[9px] break-all">{renderObjectOrValue(c.email || c.correo || c.phone)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderLodTable = () => (
    <table className="w-full text-xs border-collapse border border-gray-300 table-fixed">
      <thead className="bg-[#1c1c19] text-white">
        <tr>
          {lodVisibleColumns.map(col => (
            <th key={col} className="p-2 border-r border-gray-600 text-left uppercase">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {lodTdi.map((row, i) => (
          <tr key={i} className="border-b border-gray-200 even:bg-gray-50">
            {lodVisibleColumns.map(col => (
              <td key={col} className={`p-2 uppercase break-words ${col === 'lod' ? 'text-center font-mono font-bold text-[#0f4369]' : col === 'tdi' ? 'text-center font-mono font-bold text-[#ba1a1a]' : ''}`}>
                {renderObjectOrValue(row[col])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderMaterialesTable = () => (
    <table className="w-full text-[9px] border-collapse border border-gray-300 table-fixed">
      <thead className="bg-[#f6f3ee]">
        <tr>
          {materialesVisibleColumns.map(col => (
            <th key={col} className="p-2 border-r border-gray-300 text-left uppercase">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {materials.slice(0, 100).map((m, i) => (
          <tr key={i} className="border-b border-gray-200">
            {materialesVisibleColumns.map(col => {
              const val = m[col];
              // Formato especial para precio
              let displayVal = renderObjectOrValue(val);
              if (col.toLowerCase().includes('precio') && val) {
                displayVal = `$${Number(val).toLocaleString('es-CO')}`;
              }
              return (
                <td key={col} className="p-2 uppercase break-words">
                  {displayVal}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderCalendarioTable = () => (
    <table className="w-full text-xs border-collapse border border-gray-300 table-fixed">
      <thead className="bg-[#1c1c19] text-white">
        <tr>
          {calendarioVisibleColumns.includes('tarea') && <th className="p-2 text-left border-r border-gray-600 w-1/3">Tarea</th>}
          {calendarioVisibleColumns.includes('estado') && <th className="p-2 text-left border-r border-gray-600 w-24">Estado</th>}
          {calendarioVisibleColumns.includes('fechas') && <th className="p-2 text-left w-40">Fechas</th>}
        </tr>
      </thead>
      <tbody>
        {tasks.map((t, i) => (
          <tr key={i} className="border-b border-gray-200">
            {calendarioVisibleColumns.includes('tarea') && <td className="p-2 font-bold uppercase break-words">{renderObjectOrValue(t.title || t.name)}</td>}
            {calendarioVisibleColumns.includes('estado') && <td className="p-2 uppercase text-[10px] font-mono">
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                t.status === 'done' || t.status === 'completado' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
              }`}>{renderObjectOrValue(t.status)}</span>
            </td>}
            {calendarioVisibleColumns.includes('fechas') && <td className="p-2 text-[9px] font-mono break-all">{formatDate(t.start_date)} - {formatDate(t.end_date)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderSoftwareTable = () => (
    <table className="w-full text-xs border-collapse border border-gray-300 table-fixed">
      <thead className="bg-[#1c1c19] text-white">
        <tr>
          {softwareVisibleColumns.includes('software') && <th className="p-2 text-left border-r border-gray-600">Software</th>}
          {softwareVisibleColumns.includes('version') && <th className="p-2 text-left border-r border-gray-600">Versión</th>}
          {softwareVisibleColumns.includes('uso') && <th className="p-2 text-left">Uso / Propósito</th>}
        </tr>
      </thead>
      <tbody>
        {software.map((s, i) => (
          <tr key={i} className="border-b border-gray-200">
            {softwareVisibleColumns.includes('software') && <td className="p-2 font-bold uppercase break-words">{renderObjectOrValue(s.software_principal || s.name || s.software)} {s.es_software_primario && <span className="ml-2 text-[8px] bg-[#0f4369] text-white px-1 py-0.5 rounded">PRINCIPAL</span>}</td>}
            {softwareVisibleColumns.includes('version') && <td className="p-2 font-mono text-[10px] break-words">{renderObjectOrValue(s.version_software || s.version)}</td>}
            {softwareVisibleColumns.includes('uso') && <td className="p-2 text-[10px] uppercase break-words">{renderObjectOrValue(s.uso_del_modelo || s.purpose || s.uso || s.description)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderObjetivosTable = () => (
    <table className="w-full text-xs border-collapse border border-gray-300 table-fixed">
      <thead className="bg-[#1c1c19] text-white">
        <tr>
          {objetivosVisibleColumns.includes('prioridad') && <th className="p-2 text-left border-r border-gray-600 w-24">Prioridad [1-3]</th>}
          {objetivosVisibleColumns.includes('descripcion') && <th className="p-2 text-left border-r border-gray-600">Descripción del Objetivo</th>}
          {objetivosVisibleColumns.includes('usos') && <th className="p-2 text-left">Usos BIM Potenciales</th>}
        </tr>
      </thead>
      <tbody>
        {objectives.map((o, i) => {
          const uses = bimUses.filter(u => String(u.priority) === String(o.prioridad || o.priority)).map(u => u.name || u.description).join(', ');
          return (
            <tr key={i} className="border-b border-gray-200">
              {objetivosVisibleColumns.includes('prioridad') && <td className="p-2 font-bold text-center border-r border-gray-200">{renderObjectOrValue(o.prioridad || o.priority)}</td>}
              {objetivosVisibleColumns.includes('descripcion') && <td className="p-2 text-[10px] uppercase break-words border-r border-gray-200">{renderObjectOrValue(o.descripcion || o.description || o.name)}</td>}
              {objetivosVisibleColumns.includes('usos') && <td className="p-2 text-[10px] uppercase break-words">{renderObjectOrValue(o.usos_potenciales || o.bim_uses) || uses || '-'}</td>}
            </tr>
          );
        })}
      </tbody>
    </table>
  );

  const renderUsosBIMTable = () => (
    <table className="w-full text-xs border-collapse border border-gray-300 table-fixed">
      <thead className="bg-[#1c1c19] text-white">
        <tr>
          <th className="p-2 text-left border-r border-gray-600 w-24 uppercase">Valor</th>
          <th className="p-2 text-left border-r border-gray-600 uppercase">Usos</th>
          <th className="p-2 text-left uppercase">Descripción</th>
        </tr>
      </thead>
      <tbody>
        {bimUses.map((u, i) => (
          <tr key={i} className="border-b border-gray-200">
            <td className="p-2 font-bold text-center border-r border-gray-200 uppercase">{renderObjectOrValue(u.valor || (u.priority === 1 ? 'ALTO' : u.priority === 2 ? 'MEDIO' : u.priority === 3 ? 'BAJO' : u.priority))}</td>
            <td className="p-2 font-bold text-[10px] uppercase break-words border-r border-gray-200 text-[#0f4369]">{renderObjectOrValue(u.uso || u.name)}</td>
            <td className="p-2 text-[10px] uppercase break-words text-[#1c1c19] bg-[#fcf9f4]">{renderObjectOrValue(u.descripcion || u.description)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  const renderEntregasTable = () => (
    <table className="w-full text-xs border-collapse border border-gray-300 table-fixed">
      <thead className="bg-[#1c1c19] text-white">
        <tr>
          {entregasVisibleColumns.includes('entregable_bim') && <th className="p-2 text-left border-r border-gray-600">Entregable BIM</th>}
          {entregasVisibleColumns.includes('fase') && <th className="p-2 text-left border-r border-gray-600">Fase</th>}
          {entregasVisibleColumns.includes('responsable') && <th className="p-2 text-left">Responsable</th>}
        </tr>
      </thead>
      <tbody>
        {deliverables.map((d, i) => (
          <tr key={i} className="border-b border-gray-200">
            {entregasVisibleColumns.includes('entregable_bim') && <td className="p-2 font-bold uppercase break-words border-r border-gray-200">{renderObjectOrValue(d.entregable_bim || d.name)}</td>}
            {entregasVisibleColumns.includes('fase') && <td className="p-2 text-[10px] uppercase break-words border-r border-gray-200">{renderObjectOrValue(d.fase || d.phase)}</td>}
            {entregasVisibleColumns.includes('responsable') && <td className="p-2 text-[10px] uppercase break-words">{renderObjectOrValue(d.responsable || d.responsible)}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  );

  const getChapterNum = (key) => {
    const idx = chapterOrder.indexOf(key);
    return idx >= 0 ? idx + 1 : '';
  };

  // Renderiza el contenido completo continuo del PRE-BEP
  const renderContinuousDocument = () => {
    return (
      <div className="continuous-document-content w-full flex flex-col items-center bg-white text-[#1c1c19]">
        {/* PORTADA DEL DOCUMENTO */}
        <div className="w-full pb-10 pt-16 flex flex-col" style={{ boxSizing: 'border-box' }}>
          <div className="border-b-8 border-[#1c1c19] pb-8">
            <h2 className="text-[#0f4369] font-black uppercase tracking-[4px] text-xs mb-4">PLAN DE EJECUCIÓN BIM PRELIMINAR (PRE-BEP):</h2>
            <h1 className="text-5xl font-black text-[#1c1c19] mb-4 uppercase leading-none tracking-tighter break-words">
              {project?.name || 'KENGO KUMA RESORT'}
            </h1>
            <h2 className="text-2xl font-light text-gray-500 uppercase tracking-widest">
              COMPILACIÓN INTEGRAL DE REQUISITOS Y BASE DE DATOS
            </h2>
          </div>

          <div className="flex flex-col gap-6 my-10 max-w-xl">
            <div className="bg-[#fcf9f4] border-2 border-[#1c1c19] p-6 shadow-[6px_6px_0_0_rgba(28,28,25,1)]">
              <h3 className="font-black text-xs uppercase text-[#0f4369] mb-3 flex items-center gap-2">
                <Info size={14} /> INFORMACIÓN DE ENTREGA
              </h3>
              <p className="text-[10px] leading-relaxed uppercase text-[#72777f]">
                Este documento compila el estado preliminar del Plan de Ejecución BIM. Contiene la información general del proyecto, la matriz de entregables de información, directorio, protocolos activos y el catálogo maestro de especificaciones de materiales.
              </p>
            </div>
          </div>

          <div className="mt-10 border-t-4 border-[#1c1c19] pt-8 flex justify-between items-end text-xs">
            <div>
              <p className="text-[#72777f] text-[9px] font-bold tracking-[2px] uppercase mb-1">ID DE PROYECTO (SUPABASE):</p>
              <p className="font-mono text-[10px] bg-gray-100 p-1.5 border border-gray-300 select-all">{projectId}</p>
            </div>
            <div className="text-right">
              <p className="text-gray-500 text-[10px] uppercase tracking-widest">
                FECHA EXTRACCIÓN: {new Date().toLocaleDateString('es-CO')}
              </p>
              <p className="text-[8px] text-[#72777f] font-mono mt-1">
                TABLAS ACTIVAS EN SUPABASE: {availableTables.length}
              </p>
            </div>
          </div>
        </div>

        {/* Separación de Sección */}
        <div className="w-full border-t border-dashed border-gray-400 my-8"></div>

        {/* ÍNDICE DE CONTENIDO */}
        {showIndex && (
          <div className="w-full py-4 flex flex-col" style={{ boxSizing: 'border-box' }}>
            <section className="mb-8 w-full">
              <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">ÍNDICE DE CONTENIDO</h2>
              <ul className="list-none space-y-2 text-xs font-bold uppercase tracking-widest pl-4 border-l-4 border-[#0f4369]">
                {chapterOrder.filter(k => chapterVisibility[k]).map((k) => (
                  <li key={k}>{getChapterNum(k)}. {CHAPTER_LABELS[k]}</li>
                ))}
              </ul>
            </section>
            <div className="w-full border-t border-dashed border-gray-400 my-8"></div>
          </div>
        )}

        {/* Renderizado Dinámico de Capítulos */}
        {chapterOrder.filter(k => chapterVisibility[k]).map((key, index, array) => {
          let chapterContent = null;
          switch(key) {
            case 'datos':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">{getChapterNum('datos')}. DATOS DEL PROYECTO</h2>
                  <table className="w-full text-xs border-collapse mb-8 border border-gray-300 table-fixed">
                    <tbody>
                      <tr className="bg-[#f6f3ee]">
                        <th colSpan="2" className="text-left p-2.5 font-bold tracking-widest uppercase border-b border-gray-300">
                          INFORMACIÓN GENERAL
                        </th>
                      </tr>
                      {project && Object.entries(project).map(([k, value]) => {
                        const keyLower = k.toLowerCase();
                        const isId = keyLower === 'id' || keyLower.endsWith('_id') || keyLower.endsWith('id') || keyLower.includes('uuid') || keyLower === 'key' || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(value));
                        return !isId && (
                          <tr key={k} className="border-b border-gray-200">
                            <td className="p-2.5 font-semibold w-1/3 bg-gray-50 border-r border-gray-200 uppercase break-all">{k}</td>
                            <td className="p-2.5 font-medium break-words overflow-hidden">{renderObjectOrValue(value)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {pebInfo && (
                    <table className="w-full text-xs border-collapse mb-8 border border-gray-300 table-fixed">
                      <tbody>
                        <tr className="bg-[#f6f3ee]">
                          <th colSpan="2" className="text-left p-2.5 font-bold tracking-widest uppercase border-b border-gray-300">
                            ÁREAS DEL PROYECTO
                          </th>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-semibold w-1/3 bg-gray-50 border-r border-gray-200 uppercase break-all text-[#72777f]">Área del Lote</td>
                          <td className="p-2.5 font-medium break-words overflow-hidden font-mono">{parseFloat(pebInfo.lot_area || 0).toLocaleString()} m²</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-semibold w-1/3 bg-gray-50 border-r border-gray-200 uppercase break-all text-[#72777f]">Área Ventas</td>
                          <td className="p-2.5 font-medium break-words overflow-hidden font-mono">{parseFloat(pebInfo.sales_area || 0).toLocaleString()} m²</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-semibold w-1/3 bg-gray-50 border-r border-gray-200 uppercase break-all text-[#72777f]">Área Construida</td>
                          <td className="p-2.5 font-medium break-words overflow-hidden font-mono">{parseFloat(pebInfo.built_area || 0).toLocaleString()} m²</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-semibold w-1/3 bg-gray-50 border-r border-gray-200 uppercase break-all text-[#72777f]">Circulaciones</td>
                          <td className="p-2.5 font-medium break-words overflow-hidden font-mono">{parseFloat(pebInfo.circulation_area || 0).toLocaleString()} m²</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-semibold w-1/3 bg-gray-50 border-r border-gray-200 uppercase break-all text-[#72777f]">Ocupación Piso 1</td>
                          <td className="p-2.5 font-medium break-words overflow-hidden font-mono">{parseFloat(pebInfo.occupied_area || 0).toLocaleString()} m²</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="p-2.5 font-black w-1/3 bg-gray-50 border-r border-gray-200 uppercase break-all text-[#1c1c19]">Total</td>
                          <td className="p-2.5 font-bold break-words overflow-hidden text-[#0f4369] font-mono">{(parseFloat(pebInfo.sales_area || 0) + parseFloat(pebInfo.built_area || 0) + parseFloat(pebInfo.circulation_area || 0)).toLocaleString()} m²</td>
                        </tr>
                        <tr className="border-b border-gray-200 bg-[#f0f4f8]">
                          <td className="p-2.5 font-black w-1/3 border-r border-gray-200 uppercase break-all text-[#003366]">Índice de Construcción (IC)</td>
                          <td className="p-2.5 font-bold break-words overflow-hidden text-[#003366] font-mono">{parseFloat(pebInfo.lot_area || 0) > 0 ? (parseFloat(pebInfo.built_area || 0) / parseFloat(pebInfo.lot_area || 0)).toFixed(2) : '0.00'}</td>
                        </tr>
                        <tr className="border-b border-gray-200 bg-[#f0f4f8]">
                          <td className="p-2.5 font-black w-1/3 border-r border-gray-200 uppercase break-all text-[#003366]">Índice de Ocupación (IO)</td>
                          <td className="p-2.5 font-bold break-words overflow-hidden text-[#003366] font-mono">{parseFloat(pebInfo.lot_area || 0) > 0 ? ((parseFloat(pebInfo.occupied_area || 0) / parseFloat(pebInfo.lot_area || 0)) * 100).toFixed(2) + '%' : '0.00%'}</td>
                        </tr>
                      </tbody>
                    </table>
                  )}

                  <EditableTabLink projectId={projectId} sectionId="datos" defaultLabel="DATOS DEL PROYECTO" defaultUrl="?tab=datos" />
                </section>
              );
              break;

            case 'unidades':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">{getChapterNum('unidades')}. SUB PROYECTOS / UNIDADES</h2>
                  {spaces.length > 0 ? (
                    renderSubproyectosTable()
                  ) : (
                    <p className="text-xs text-gray-500 italic uppercase">No hay sub-proyectos registrados.</p>
                  )}
                  <EditableTabLink projectId={projectId} sectionId="unidades" defaultLabel="DATOS DEL PROYECTO - UNIDADES" defaultUrl="?tab=datos&subtab=unidades" />
                </section>
              );
              break;

            case 'directorio':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">{getChapterNum('directorio')}. EQUIPO, ROLES Y DIRECTORIO</h2>
                  
                  <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-[#1c1c19]">&bull; Equipo BIM (BEP Team)</h3>
                  {bepTeam.length > 0 ? (
                    renderEquipoTable()
                  ) : <p className="mb-8 text-xs text-gray-500 italic uppercase">Sin equipo BIM registrado.</p>}

                  <h3 className="font-bold text-sm mb-3 uppercase tracking-wider text-[#1c1c19]">&bull; Directorio Interno (Staff)</h3>
                  {staff.length > 0 ? (
                    renderDirectorioTable(staff)
                  ) : <p className="text-xs text-gray-500 italic uppercase mb-6">Sin directorio interno.</p>}

                  <h3 className="font-bold text-sm mb-3 mt-6 uppercase tracking-wider text-[#1c1c19]">&bull; Directorio Externo (Contactos)</h3>
                  {contacts.length > 0 ? (
                    renderDirectorioTable(contacts)
                  ) : <p className="text-xs text-gray-500 italic uppercase mb-6">Sin contactos externos.</p>}

                  <h3 className="font-bold text-sm mb-3 mt-6 uppercase tracking-wider text-[#1c1c19]">&bull; Catálogo de Especialidades</h3>
                  {specialties.length > 0 ? (
                    <table className="w-full text-xs border-collapse border border-gray-300 table-fixed mb-6">
                      <thead className="bg-[#f6f3ee]">
                        <tr>
                          <th className="p-2 border-r border-gray-300 text-left w-1/4 uppercase">Nombre</th>
                          <th className="p-2 border-r border-gray-300 text-left w-1/6 uppercase">Diminutivo</th>
                          <th className="p-2 border-r border-gray-300 text-left w-1/6 uppercase">Responsable</th>
                          <th className="p-2 text-left uppercase">Descripción</th>
                        </tr>
                      </thead>
                      <tbody>
                        {specialties.map((spec) => (
                          <tr key={spec.id} className="border-b border-gray-200">
                            <td className="p-2 font-bold uppercase break-words border-r border-gray-300 text-[#0f4369]">
                              {spec.name}
                              {!spec.project_id && (
                                <span className="ml-2 bg-gray-200 text-gray-600 px-1.5 py-0.5 text-[8px] font-black tracking-widest uppercase border border-gray-400 rounded-sm inline-block align-middle">Global</span>
                              )}
                            </td>
                            <td className="p-2 uppercase break-words border-r border-gray-300 font-mono font-bold text-center bg-[#f6f3ee]">{spec.abbreviation || '-'}</td>
                            <td className="p-2 uppercase break-words border-r border-gray-300 text-center text-gray-500 font-mono text-[9px]">{spec.responsible_name || '-'}</td>
                            <td className="p-2 text-[10px] text-gray-600 leading-tight uppercase break-words">{spec.description || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : <p className="mb-8 text-xs text-gray-500 italic uppercase">Sin especialidades registradas.</p>}

                  <EditableTabLink projectId={projectId} sectionId="directorio" defaultLabel="DIRECTORIO" defaultUrl="?tab=directorio" />
                </section>
              );
              break;

            case 'software':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">{getChapterNum('software')}. SOFTWARE Y PLATAFORMAS</h2>
                  {software.length > 0 ? (
                    renderSoftwareTable()
                  ) : <p className="text-xs text-gray-500 italic uppercase">Sin software registrado.</p>}
                  <EditableTabLink projectId={projectId} sectionId="software" defaultLabel="SOFTWARE" defaultUrl="?tab=datos&subtab=software" />
                </section>
              );
              break;

            case 'requisitos':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">{getChapterNum('requisitos')}. REQUISITOS DE INFORMACIÓN</h2>
                  {requirements.length > 0 ? (
                    <div className="space-y-4 mb-8 w-full">
                      {requirements.map((req, i) => (
                        <div key={i} className="p-3 border-2 border-[#1c1c19] bg-[#fcf9f4] shadow-[3px_3px_0_0_rgba(28,28,25,1)] w-full overflow-hidden">
                          <h4 className="font-bold text-xs uppercase text-[#0f4369] break-words">{req.title || req.name}</h4>
                          <p className="text-[8px] font-black uppercase text-gray-400 mb-1">{req.category}</p>
                          <div className="text-[10px] leading-relaxed uppercase break-words">{renderObjectOrValue(req.description || req.details)}</div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-500 italic uppercase mb-8">Sin requisitos.</p>}
                  <EditableTabLink projectId={projectId} sectionId="requisitos" defaultLabel="REQUISITOS" defaultUrl="?tab=requisitos" />
                </section>
              );
              break;

            case 'lod_tdi':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">{getChapterNum('lod_tdi')}. MATRIZ DE ENTREGABLES (LOD/TDI)</h2>
                  {lodTdi.length > 0 ? (
                    <>
                      {renderLodTable()}
                    </>
                  ) : <p className="text-xs text-gray-500 italic uppercase">Sin entregables registrados.</p>}
                  <EditableTabLink projectId={projectId} sectionId="lod_tdi" defaultLabel="DATOS DEL PROYECTO - LOD/TDI" defaultUrl="?tab=datos&subtab=lod_tdi" />
                </section>
              );
              break;

            case 'protocolos':
              chapterContent = (
                <section className="w-full">
                  <div className="flex items-center justify-between mb-4 border-b-2 border-[#1c1c19] pb-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-[#0f4369] m-0 border-0 pb-0">{getChapterNum('protocolos')}. PROTOCOLOS</h2>
                  </div>
                  {protocols.length > 0 ? (
                    <div className="space-y-16 w-full">
                      {protocols.map((p, i) => (
                        <div key={i} className={`w-full break-inside-avoid pb-8 ${showFullProtocols ? 'border-b-2 border-dashed border-gray-300' : 'border-b border-gray-200 pb-4'} last:border-0`}>
                          {/* Header Protocolo */}
                          <div className={showFullProtocols ? "mb-6" : "mb-0"}>
                            <div className="flex items-center justify-between mb-3 border-b-2 border-[#1c1c19] pb-2">
                              <div className="text-[10px] uppercase font-black tracking-[4px] text-[#0f4369]">Protocolo Maestro</div>
                              <div className="text-[9px] uppercase font-mono tracking-widest text-gray-400">REF_ID: {p.id?.substring(0,8).toUpperCase()}</div>
                            </div>
                            <h3 className="font-black text-4xl uppercase tracking-tight break-words text-[#1c1c19]">{p.title || p.name}</h3>
                            {p.description && (
                              <div className={`text-sm font-medium text-gray-700 italic border-l-4 border-[#0f4369] pl-4 ${showFullProtocols ? 'mt-4 mb-6' : 'mt-2 mb-0'}`}>
                                {p.description}
                              </div>
                            )}
                          </div>

                          {showFullProtocols && (
                            <>
                              {/* Estructura de documentos */}
                          { (p.manuals?.length > 0 || p.templates?.length > 0) && (
                            <div className="mb-10 pl-4 border-l-2 border-gray-200">
                              <h4 className="text-[10px] font-black uppercase text-gray-500 tracking-widest mb-4">
                                  ESTRUCTURA DE DOCUMENTOS RELACIONADOS
                              </h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                  {p.manuals?.length > 0 && (
                                    <div>
                                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">Manuales Secundarios ({p.manuals.length})</div>
                                      <ul className="list-disc list-inside space-y-1 text-xs text-[#0f4369] font-bold uppercase">
                                        {p.manuals.map(m => (
                                          <li key={m.id}>{m.title}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                  {p.templates?.length > 0 && (
                                    <div>
                                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-2 border-b border-gray-200 pb-1">Plantillas y Recursos ({p.templates.length})</div>
                                      <ul className="list-disc list-inside space-y-1 text-xs text-[#0f4369] font-bold uppercase">
                                        {p.templates.map(t => (
                                          <li key={t.id}>{t.title}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                              </div>
                            </div>
                          )}

                          {/* Contenido Protocolo */}
                          <div className="mb-10 prose prose-sm max-w-none prose-headings:font-black prose-headings:uppercase prose-a:text-[#0f4369]">
                            <h4 className="text-xl font-black uppercase border-b-2 border-[#1c1c19] pb-2 mb-6 text-[#1c1c19]">{p.title} GLOBAL</h4>
                            {p.blocks && p.blocks.length > 0 ? (
                              <ContentBlockEditor blocks={p.blocks} isEditing={false} onChange={() => {}} onUploadImage={() => {}} fontSize={13} />
                            ) : (
                              <div className="text-[11px] leading-relaxed font-sans text-slate-700 markdown-content prose max-w-none break-words">
                                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                  {(p.content || p.body || p.description || '').replace(/\n/g, '
')}
                                </ReactMarkdown>
                              </div>
                            )}
                          </div>
                          
                          {/* Manuales Full Content */}
                          {p.manuals?.map((m, idx) => (
                            <div key={m.id} className="mt-8 break-inside-avoid">
                                <div className="mb-4">
                                  <div className="text-[9px] uppercase font-black tracking-widest text-[#0f4369] mb-1">MANUAL SECUNDARIO {idx + 1}</div>
                                  <h4 className="font-black text-2xl uppercase tracking-tight text-[#1c1c19]">{m.title}</h4>
                                  {m.description && <p className="text-xs mt-1 text-gray-500 italic uppercase">{m.description}</p>}
                                </div>
                                <div className="prose prose-sm max-w-none prose-headings:font-black prose-headings:uppercase pl-4 border-l-2 border-gray-100">
                                  {m.blocks && m.blocks.length > 0 ? (
                                    <ContentBlockEditor blocks={m.blocks} isEditing={false} onChange={() => {}} onUploadImage={() => {}} fontSize={13} />
                                  ) : (
                                    <div className="text-[11px] leading-relaxed font-sans text-slate-700 markdown-content prose max-w-none break-words">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {(m.content || m.body || m.description || '').replace(/\n/g, '
')}
                                      </ReactMarkdown>
                                    </div>
                                  )}
                                </div>
                            </div>
                          ))}

                          {showFullProtocols && (p.url || p.file_url) && (
                            <div className="mt-8 pt-4 border-t border-gray-200">
                              <p className="text-[9px] text-blue-600 break-all font-mono">
                                URL EXTERNA: <a href={p.url || p.file_url} target="_blank" rel="noopener noreferrer" className="underline">{p.url || p.file_url}</a>
                              </p>
                            </div>
                          )}
                          
                          </>
                          )}

                          {!showFullProtocols && (
                            <div className="mt-4 bg-[#f6f3ee] border-l-4 border-[#ba1a1a] p-3 flex flex-wrap items-center gap-2">
                              <span className="text-[10px] font-black uppercase text-[#0f4369] tracking-widest flex items-center gap-2">
                                👉 PARA INFORMACION COMPLETA VEASE:
                              </span>
                              <a href={p.url || p.file_url || `/resourceView/${p.id}`} target="_blank" rel="noopener noreferrer" className="text-[10px] text-[#0f4369] hover:underline font-bold uppercase underline">
                                {p.title || p.name}
                              </a>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-500 italic uppercase">Sin protocolos registrados.</p>}
                  <EditableTabLink projectId={projectId} sectionId="protocolos" defaultLabel="PROTOCOLOS" defaultUrl="?tab=protocolos" />
                </section>
              );
              break;

            case 'materiales':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">{getChapterNum('materiales')}. BASE DE DATOS DE MATERIALES</h2>
                  {materials.length > 0 ? (
                    <div className="w-full">
                      {renderMaterialesTable()}
                      {materials.length > 100 && (
                        <p className="text-[9px] text-gray-400 mt-3 italic uppercase">* Se muestran los primeros 100 materiales del catálogo.</p>
                      )}
                    </div>
                  ) : <p className="text-xs text-gray-500 italic uppercase">El catálogo de materiales está vacío.</p>}
                  <EditableTabLink projectId={projectId} sectionId="materiales" defaultLabel="MATERIALES" defaultUrl="?tab=datos&subtab=materiales" />
                </section>
              );
              break;

            case 'documentos':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">{getChapterNum('documentos')}. DOCUMENTOS GENERALES</h2>
                  {documents.length > 0 ? (
                    <ul className="space-y-3 w-full">
                      {documents.map((d, i) => (
                        <li key={i} className="p-3 bg-white border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(28,28,25,1)] w-full overflow-hidden">
                          <h4 className="font-bold uppercase text-xs text-[#0f4369] break-words">{d.title || d.name}</h4>
                          <div className="text-[10px] text-gray-600 mb-1 uppercase break-words">{renderObjectOrValue(d.category)} - {renderObjectOrValue(d.description)}</div>
                          {d.url && (
                            <a href={d.url} target="_blank" rel="noopener noreferrer" className="text-[9px] text-blue-500 break-all font-mono underline">
                              {d.url}
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : <p className="text-xs text-gray-500 italic uppercase mb-8">No hay documentos registrados para este proyecto.</p>}
                  <EditableTabLink projectId={projectId} sectionId="documentos" defaultLabel="DOCUMENTOS" defaultUrl="?tab=recursos" />
                </section>
              );
              break;

            case 'calendario':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">{getChapterNum('calendario')}. CALENDARIO SEM/MES (TASKS)</h2>
                  {tasks.length > 0 ? (
                    renderCalendarioTable()
                  ) : <p className="text-xs text-gray-500 italic uppercase">No hay tareas o cronogramas cargados.</p>}
                  <EditableTabLink projectId={projectId} sectionId="calendario" defaultLabel="CALENDARIO MENSUAL" defaultUrl="?tab=cronograma" />
                </section>
              );
              break;

            case 'esquemas':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">{getChapterNum('esquemas')}. BEP (ESQUEMAS / ORGANIZADOR)</h2>
                  <p className="text-[9px] text-gray-500 mb-4 uppercase tracking-widest border-l-2 border-amber-400 pl-3">
                    Registro de los planes de implementación y esquemas conceptuales asociados al proyecto.
                  </p>
                  {plans.length > 0 ? (
                    <div className="space-y-6 w-full">
                      {plans.map((plan, i) => (
                        <div key={i} className="p-4 bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(28,28,25,1)] w-full overflow-hidden">
                          <h4 className="font-bold text-xs uppercase mb-1 break-words">{plan.name}</h4>
                          <p className="text-[10px] mb-3 uppercase text-gray-600 break-words">{plan.description}</p>
                          <div className="bg-[#fcf9f4] border border-gray-300 p-4 text-[10px] rounded-sm w-full overflow-hidden">
                            {renderObjectOrValue(plan.plan_data || plan.schema)}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-xs text-gray-500 italic uppercase">No se encontraron planes BIM o esquemas vinculados.</p>}
                  <EditableTabLink projectId={projectId} sectionId="esquemas" defaultLabel="ESQUEMAS" defaultUrl="?tab=acciones" />
                </section>
              );
              break;

            case 'objetivos':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">{getChapterNum('objetivos')}. OBJETIVOS DEL PROYECTO</h2>
                  
                  <h3 className="font-bold text-sm mb-3 mt-4 uppercase tracking-wider text-[#1c1c19]">&bull; TABLA 4: DEFINICIÓN OBJETIVOS DEL PROYECTO</h3>
                  {objectives.length > 0 ? (
                    renderObjetivosTable()
                  ) : <p className="text-xs text-gray-500 italic uppercase mb-6">Sin objetivos registrados.</p>}

                  <h3 className="font-bold text-sm mb-3 mt-8 uppercase tracking-wider text-[#1c1c19]">&bull; {getChapterNum('objetivos')}.1 USOS BIM (TABLA 5)</h3>
                  {bimUses.length > 0 ? (
                    renderUsosBIMTable()
                  ) : <p className="text-xs text-gray-500 italic uppercase mb-6">Sin usos BIM registrados.</p>}

                  <div className="mt-4">
                    <EditableTabLink projectId={projectId} sectionId="objetivos" defaultLabel="OBJETIVOS" defaultUrl="?tab=datos&subtab=objetivos" />
                  </div>
                </section>
              );
              break;

            case 'cronograma_entregas':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">{getChapterNum('cronograma_entregas')}. CRONOGRAMA DE ENTREGAS</h2>
                  {deliverables.length > 0 ? (
                    renderEntregasTable()
                  ) : <p className="text-xs text-gray-500 italic uppercase">Sin entregables registrados en el cronograma.</p>}
                  <EditableTabLink projectId={projectId} sectionId="cronograma_entregas" defaultLabel="CRONOGRAMA" defaultUrl="?tab=datos&subtab=cronograma" />
                </section>
              );
              break;
              
            default:
              return null;
          }

          return (
            <React.Fragment key={key}>
              <div className="w-full py-4 flex flex-col" style={{ boxSizing: 'border-box' }}>
                {chapterContent}
              </div>
              {index < array.length - 1 && (
                <div className="w-full border-t border-dashed border-gray-400 my-8"></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  };

  const renderedDocument = React.useMemo(() => renderContinuousDocument(), [
    project, bepTeam, staff, contacts, requirements, lodTdi, protocols, 
    spaces, materials, documents, tasks, plans, chapterVisibility, 
    showIndex, lodVisibleColumns
  ]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-[#f0ede6] font-mono">
        <Loader2 className="w-12 h-12 animate-spin text-[#0f4369] mb-4" />
        <span className="text-xs uppercase tracking-[4px] font-black text-[#1c1c19]">Compilando Documento PRE BEP...</span>
        <span className="text-[10px] text-gray-500 mt-2 uppercase">Conectando con Supabase y limpiando identificadores</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f0ede6] overflow-hidden font-mono text-[#1c1c19] print:bg-white print:h-auto print:overflow-visible print:block prebep-print-root">
      {/* HEADER DE NAVEGACIÓN */}
      <div className="no-print bg-white border-b-2 border-[#1c1c19] p-4 flex justify-between items-center relative z-50 shrink-0 shadow-[4px_4px_0_0_rgba(28,28,25,0.1)]">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/planner?projectId=${projectId}`)}
            className="px-4 py-2 bg-[#ba1a1a] text-white border-2 border-[#1c1c19] text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2 group"
          >
            <X size={14} className="group-hover:rotate-90 transition-transform" />
            VOLVER
          </button>
          
          <div className="border-l-2 border-[#1c1c19]/10 pl-4 flex flex-col">
            <span className="text-[8px] font-black text-[#0f4369] leading-none uppercase tracking-wider">DOCUMENTO GENERAL</span>
            <span className="text-xs font-black uppercase tracking-[2px]">{project?.name || 'KENGO KUMA RESORT'}</span>
          </div>
        </div>

        {/* TABS DE VISTA: DOCUMENTO / INTERACTIVO */}
        <div className="flex bg-[#f6f3ee] border-2 border-[#1c1c19] p-1 gap-1">
          <button
            onClick={() => setActiveView('document')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-[2px] flex items-center gap-2 transition-all ${
              activeView === 'document' ? 'bg-[#1c1c19] text-white' : 'text-[#1c1c19] hover:bg-gray-200'
            }`}
          >
            <Printer size={12} />
            Vista Impresión / PDF
          </button>
          <button
            onClick={() => setActiveView('control_panel')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-[2px] flex items-center gap-2 transition-all ${
              activeView === 'control_panel' ? 'bg-[#1c1c19] text-white' : 'text-[#1c1c19] hover:bg-gray-200'
            }`}
          >
            <LayoutGrid size={12} />
            Panel de Control
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="p-2 border-2 border-[#1c1c19] hover:bg-gray-100 transition-colors shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:translate-y-0.5 hover:shadow-none bg-white text-[#1c1c19]"
            title="Refrescar base de datos"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => window.print()}
            className="px-6 py-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:translate-y-1 hover:shadow-none transition-all flex items-center gap-2"
          >
            <Download size={14} /> EXPORTAR PRE BEP
          </button>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-1 flex overflow-hidden w-full relative print:block print:overflow-visible print:h-auto">
        
        {/* VISTA 1: IMPRESIÓN PRE BEP (ESTRUCTURA DE ENCUADRE DINÁMICO) */}
        {activeView === 'document' && (
          <div className="flex-1 overflow-y-auto w-full py-10 px-4 flex flex-col items-center print:p-0 print:block print:overflow-visible prebep-pages-scroll">
            
            {/* PANEL DE CONTROL DE ENCUADRE (PÁGINAS) */}
            <div className="no-print bg-white border-2 border-[#1c1c19] p-4 mb-6 shadow-[4px_4px_0_0_rgba(28,28,25,1)] w-[215.9mm] flex justify-between items-center gap-4">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-[#0f4369] uppercase">Control de Encuadre / Páginas</span>
                  {/* Indicador de estado de guardado */}
                  {configSaveStatus === 'saving' && (
                    <span className="flex items-center gap-1 text-[8px] text-amber-600 uppercase font-black animate-pulse">
                      <Save size={9} className="animate-spin" /> Guardando...
                    </span>
                  )}
                  {configSaveStatus === 'saved' && (
                    <span className="flex items-center gap-1 text-[8px] text-green-600 uppercase font-black">
                      <CheckCircle2 size={9} /> Guardado
                    </span>
                  )}
                  {configSaveStatus === 'error' && (
                    <span className="flex items-center gap-1 text-[8px] text-red-600 uppercase font-black">
                      <CloudOff size={9} /> Error al guardar
                    </span>
                  )}
                </div>
                <span className="text-[8px] text-gray-500 uppercase">
                  {pageHeights.length} página{pageHeights.length !== 1 ? 's' : ''} · La configuración se guarda automáticamente en la nube.
                </span>
                <span className="text-[7px] text-gray-400 uppercase">Para imprimir: márgenes en "Ninguno" y sin cabeceras/pies.</span>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={addPage}
                  className="px-3 py-1.5 bg-[#0f4369] text-white border-2 border-[#1c1c19] text-[9px] font-black uppercase tracking-wider hover:bg-[#16507c] transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                >
                  + Agregar Página
                </button>
                <button 
                  onClick={() => deletePage(pageHeights.length - 1)}
                  className="px-3 py-1.5 bg-[#ba1a1a] text-white border-2 border-[#1c1c19] text-[9px] font-black uppercase tracking-wider hover:bg-red-700 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                  disabled={pageHeights.length <= 1}
                >
                  - Eliminar Última
                </button>
                <button 
                  onClick={resetPages}
                  className="px-3 py-1.5 bg-white text-[#1c1c19] border-2 border-[#1c1c19] text-[9px] font-black uppercase tracking-wider hover:bg-gray-150 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                >
                  Restablecer
                </button>
              </div>
            </div>

            {/* RENDERIZADO DE LAS PÁGINAS COMO VIEWPORTS */}
            {(() => {
              // Calcular offsets acumulados de contenido visible
              const offsets = [];
              let currentOffset = 0;
              for (let i = 0; i < pageHeights.length; i++) {
                offsets.push(currentOffset);
                currentOffset += pageHeights[i]; // Avanzar exactamente el alto de la página anterior
              }

              return pageHeights.map((height, idx) => {
                const offsetY = offsets[idx];
                const isLast = idx === pageHeights.length - 1;
                const isEmpty = contentHeightMm > 0 && offsetY >= contentHeightMm + 20;

                return (
                  <div 
                    key={idx} 
                    className={`flex flex-col items-center page-container no-break ${isLast ? 'last-page' : 'normal-page'} ${isEmpty ? 'empty-page' : ''}`}
                    style={isEmpty ? { opacity: 0.4 } : undefined}
                  >
                    {isEmpty && (
                      <div className="no-print bg-[#ba1a1a] text-white text-[9px] font-black uppercase px-3 py-1 mb-2 border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                        Página Vacía - No se incluirá en la impresión
                      </div>
                    )}
                    {/* Contenedor Físico de Página (Dimensiones Carta) */}
                    <div 
                      className="page-wrapper relative bg-white overflow-hidden"
                      style={{
                        width: '215.9mm',
                        height: `${height}mm`,
                        '--page-print-height': `${height}mm`,
                        boxSizing: 'border-box'
                      }}
                    >
                      {/* Contenedor de clip interno: solo padding horizontal para no desplazar el offset vertical */}
                      <div 
                        className="absolute left-0 right-0 page-clip-inner"
                        style={{
                          top: `-${offsetY}mm`,
                          paddingLeft: '20mm',
                          paddingRight: '20mm',
                          boxSizing: 'border-box',
                          width: '100%'
                        }}
                      >
                        {renderedDocument}
                      </div>
                    </div>

                    {/* Deslizador y controles (Oculto en Impresión) */}
                    <div 
                      className="no-print relative flex items-center justify-center bg-[#1c1c19] hover:bg-[#ba1a1a] transition-colors cursor-ns-resize shadow-[0_2px_5px_rgba(0,0,0,0.2)]"
                      style={{ width: '215.9mm', height: '6px', zIndex: 10 }}
                      onMouseDown={(e) => startDrag(e, idx)}
                      title="Arrastra arriba o abajo para ajustar el alto de la página"
                    >
                      <div className="w-16 h-1 bg-white/50 rounded-full pointer-events-none"></div>
                      
                      {pageHeights.length > 1 && (
                        <button
                          onMouseDown={(e) => e.stopPropagation()}
                          onClick={(e) => {
                            e.stopPropagation();
                            deletePage(idx);
                          }}
                          className="absolute right-0 h-full px-2 bg-red-600 hover:bg-red-500 text-white cursor-pointer flex items-center justify-center"
                          title="Eliminar esta página"
                        >
                          <X size={8} strokeWidth={4} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              });
            })()}

            {/* BOTÓN PARA AGREGAR PÁGINA AL FINAL */}
            <div className="no-print mb-10 w-[215.9mm]">
              <button 
                onClick={addPage}
                className="w-full py-1.5 bg-[#1c1c19] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#0f4369] transition-colors shadow-[0_4px_6px_rgba(0,0,0,0.3)] rounded-b flex items-center justify-center gap-2"
              >
                + Añadir Página
              </button>
            </div>
          </div>
        )}

        {/* VISTA 2: PANEL DE CONTROL PRE-BEP */}
        {activeView === 'control_panel' && (
          <div className="flex-1 flex overflow-y-auto w-full p-8 bg-[#fcf9f4]">
            <div className="max-w-4xl mx-auto w-full space-y-8 pb-16">
              
              <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
                <h2 className="text-xl font-black uppercase mb-4 text-[#0f4369] flex items-center gap-2 border-b-2 border-gray-200 pb-2">
                  <LayoutGrid size={20} /> Configuración General del Documento
                </h2>
                <p className="text-xs text-gray-600 mb-6 uppercase">Selecciona los capítulos que deseas incluir en la exportación del documento Pre-BEP.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="flex items-center gap-3 p-3 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                    <input type="checkbox" checked={showIndex} onChange={(e) => handleShowIndexChange(e.target.checked)} className="w-4 h-4 accent-[#0f4369]" />
                    <span className="text-[10px] font-bold uppercase">Índice de Contenido</span>
                  </label>
                  {chapterOrder.map((key, index) => {
                    const labelText = CHAPTER_LABELS[key];
                    return (
                      <div key={key} className="flex items-center gap-3 p-2 border border-gray-200 hover:bg-gray-50 transition-colors">
                        <input
                          type="number"
                          value={index + 1}
                          onChange={(e) => handleOrderChange(key, parseInt(e.target.value))}
                          className="w-12 p-1 text-center border border-gray-300 text-xs font-bold text-[#0f4369] bg-white outline-none focus:border-[#0f4369]"
                          min={1}
                          max={chapterOrder.length}
                        />
                        <label className="flex items-center gap-3 cursor-pointer flex-1">
                          <input 
                            type="checkbox" 
                            checked={chapterVisibility[key]} 
                            onChange={(e) => handleChapterVisibilityChange(key, e.target.checked)} 
                            className="w-4 h-4 accent-[#0f4369]" 
                          />
                          <span className="text-[10px] font-bold uppercase">{labelText}</span>
                        </label>
                      </div>
                    );
                  })}
                </div>

                {chapterVisibility.protocolos && (
                  <div className="mt-6 pt-6 border-t border-gray-200">
                    <h3 className="text-sm font-black uppercase text-[#1c1c19] mb-4">Configuración de Visualización</h3>
                    <label className="flex items-center gap-3 p-3 border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors max-w-md">
                      <div className={`relative w-10 h-5 rounded-full transition-colors ${showFullProtocols ? 'bg-green-500' : 'bg-gray-400'}`}>
                        <div className={`absolute top-0.5 left-0.5 bg-white w-4 h-4 rounded-full transition-transform ${showFullProtocols ? 'transform translate-x-5' : ''}`}></div>
                      </div>
                      <input type="checkbox" className="hidden" checked={showFullProtocols} onChange={toggleProtocolsDisplay} />
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold uppercase">Despliegue Completo de Protocolos</span>
                        <span className="text-[9px] text-gray-500 uppercase">Mostrar todo el contenido o solo la lista resumida</span>
                      </div>
                    </label>
                  </div>
                )}
              </div>

              <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[4px_4px_0_0_rgba(28,28,25,1)] mb-8">
                <h2 className="text-xl font-black uppercase mb-4 text-[#0f4369] flex items-center gap-2 border-b-2 border-gray-200 pb-2">
                  <LayoutGrid size={20} /> Configuración de Columnas
                </h2>
                <p className="text-xs text-gray-600 mb-6 uppercase">Selecciona las columnas que deseas mostrar en cada tabla del documento.</p>
                
                {/* Tabs Header */}
                <div className="flex border-b border-[#1c1c19] mb-6 overflow-x-auto hide-scrollbar">
                  {[
                    { id: 'subproyectos', label: '2. SUB PROYECTOS', show: chapterVisibility.unidades },
                    { id: 'equipo', label: '3. EQUIPO BIM', show: chapterVisibility.directorio },
                    { id: 'directorio', label: '3. DIRECTORIO', show: chapterVisibility.directorio },
                    { id: 'software', label: '4. SOFTWARE', show: chapterVisibility.software },
                    { id: 'lod_tdi', label: '6. LOD/TDI', show: chapterVisibility.lod_tdi },
                    { id: 'materiales', label: '8. MATERIALES', show: chapterVisibility.materiales },
                    { id: 'calendario', label: '10. CALENDARIO', show: chapterVisibility.calendario },
                    { id: 'objetivos', label: '12. OBJETIVOS', show: chapterVisibility.objetivos },
                    { id: 'cronograma', label: '13. CRONOGRAMA', show: chapterVisibility.cronograma_entregas }
                  ].filter(tab => tab.show).map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveConfigTab(tab.id)}
                      className={`px-4 py-2 text-[10px] font-black uppercase transition-colors whitespace-nowrap ${
                        activeConfigTab === tab.id 
                          ? 'bg-[#1c1c19] text-white border-t-2 border-l-2 border-r-2 border-[#1c1c19]' 
                          : 'bg-[#f6f3ee] text-[#1c1c19] border-t-2 border-l-2 border-r-2 border-transparent hover:bg-gray-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tabs Content */}
                <div className="min-h-[150px]">
                  {activeConfigTab === 'subproyectos' && chapterVisibility.unidades && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap gap-2">
                        {['nombre', 'datos'].map(col => (
                          <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                            <input type="checkbox" checked={subproyectosVisibleColumns.includes(col)} onChange={() => handleSubproyectosColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                            {col}
                          </label>
                        ))}
                      </div>
                      <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                        {renderSubproyectosTable()}
                      </div>
                    </div>
                  )}
                  
                  {activeConfigTab === 'equipo' && chapterVisibility.directorio && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap gap-2">
                        {['rol', 'nombre', 'compania'].map(col => (
                          <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                            <input type="checkbox" checked={equipoVisibleColumns.includes(col)} onChange={() => handleEquipoColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                            {col}
                          </label>
                        ))}
                      </div>
                      <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                        {renderEquipoTable()}
                      </div>
                    </div>
                  )}

                  {activeConfigTab === 'directorio' && chapterVisibility.directorio && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap gap-2">
                        {['nombre', 'rol', 'compania', 'contacto'].map(col => (
                          <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                            <input type="checkbox" checked={directorioVisibleColumns.includes(col)} onChange={() => handleDirectorioColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                            {col}
                          </label>
                        ))}
                      </div>
                      <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)] flex flex-col p-4 gap-4">
                        <div className="font-bold text-[10px] uppercase text-[#72777f]">Directorio Interno (Staff)</div>
                        {renderDirectorioTable(staff)}
                        <div className="font-bold text-[10px] uppercase text-[#72777f]">Directorio Externo (Contactos)</div>
                        {renderDirectorioTable(contacts)}
                      </div>
                    </div>
                  )}

                  {activeConfigTab === 'software' && chapterVisibility.software && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap gap-2">
                        {['software', 'version', 'uso'].map(col => (
                          <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                            <input type="checkbox" checked={softwareVisibleColumns.includes(col)} onChange={() => handleSoftwareColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                            {col}
                          </label>
                        ))}
                      </div>
                      <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                        {renderSoftwareTable()}
                      </div>
                    </div>
                  )}

                  {activeConfigTab === 'lod_tdi' && chapterVisibility.lod_tdi && lodTdi.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(lodTdi[0] || {}).filter(k => {
                          const lower = k.toLowerCase();
                          return lower !== 'id' && !lower.endsWith('_id') && !lower.includes('uuid');
                        }).map(col => (
                          <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                            <input type="checkbox" checked={lodVisibleColumns.includes(col)} onChange={() => handleLodColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                            {col}
                          </label>
                        ))}
                      </div>
                      <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                        {renderLodTable()}
                      </div>
                    </div>
                  )}

                  {activeConfigTab === 'materiales' && chapterVisibility.materiales && materials.length > 0 && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap gap-2">
                        {Object.keys(materials[0] || {}).filter(k => {
                          const lower = k.toLowerCase();
                          return lower !== 'id' && !lower.endsWith('_id') && !lower.includes('uuid');
                        }).map(col => (
                          <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                            <input type="checkbox" checked={materialesVisibleColumns.includes(col)} onChange={() => handleMaterialesColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                            {col}
                          </label>
                        ))}
                      </div>
                      <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                        {renderMaterialesTable()}
                      </div>
                    </div>
                  )}

                  {activeConfigTab === 'calendario' && chapterVisibility.calendario && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap gap-2">
                        {['tarea', 'estado', 'fechas'].map(col => (
                          <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                            <input type="checkbox" checked={calendarioVisibleColumns.includes(col)} onChange={() => handleCalendarioColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                            {col}
                          </label>
                        ))}
                      </div>
                      <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                        {renderCalendarioTable()}
                      </div>
                    </div>
                  )}

                  {activeConfigTab === 'objetivos' && chapterVisibility.objetivos && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap gap-2">
                        {['prioridad', 'descripcion', 'usos'].map(col => (
                          <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                            <input type="checkbox" checked={objetivosVisibleColumns.includes(col)} onChange={() => handleObjetivosColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                            {col}
                          </label>
                        ))}
                      </div>
                      <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)] flex flex-col p-4 gap-4">
                        <div className="font-bold text-[10px] uppercase text-[#72777f]">Tabla 4: Definición Objetivos del Proyecto</div>
                        {renderObjetivosTable()}
                        <div className="font-bold text-[10px] uppercase text-[#72777f] mt-4">Tabla 5: Usos BIM</div>
                        {renderUsosBIMTable()}
                      </div>
                    </div>
                  )}

                  {activeConfigTab === 'cronograma' && chapterVisibility.cronograma_entregas && (
                    <div className="flex flex-col gap-4">
                      <div className="flex flex-wrap gap-2">
                        {['entregable_bim', 'fase', 'responsable'].map(col => (
                          <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                            <input type="checkbox" checked={entregasVisibleColumns.includes(col)} onChange={() => handleEntregasColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                            {col}
                          </label>
                        ))}
                      </div>
                      <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                        {renderEntregasTable()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
                <h2 className="text-xl font-black uppercase mb-4 text-[#0f4369] flex items-center gap-2 border-b-2 border-gray-200 pb-2">
                  <Database size={20} /> Edición de Tablas
                </h2>
                <p className="text-xs text-gray-600 mb-6 uppercase">Accede directamente a los formularios para editar la información de cada sección.</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {PROJECT_TABS_OPTIONS.filter(opt => opt.url && opt.url !== '').map((opt, i) => {
                    const href = opt.url.startsWith('?') ? `/project/${projectId}${opt.url}` : `${opt.url}?projectId=${projectId}`;
                    return (
                      <a 
                        key={i} 
                        href={href} 
                        target="_blank" rel="noopener noreferrer"
                        className="p-4 border-2 border-[#1c1c19] bg-[#f6f3ee] hover:bg-[#1c1c19] hover:text-white transition-all flex flex-col justify-between h-full group shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-y-0.5"
                      >
                        <span className="text-[10px] font-black uppercase mb-2">{opt.label}</span>
                        <div className="flex justify-end w-full">
                          <ChevronRight size={14} className="opacity-50 group-hover:opacity-100" />
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* ESTILOS DE IMPRESIÓN Y VISTA PREVIA */}
      <style dangerouslySetInnerHTML={{__html: `
        /* ── Pantalla (vista previa) ── */
        .page-container { margin-bottom: 24px; }

        .page-wrapper {
          box-sizing: border-box;
          transition: height 0.1s ease-out;
          outline: 4px solid #1c1c19;
          outline-offset: -4px;
        }

        .markdown-content img {
          max-width: 100% !important;
          height: auto !important;
          display: block;
          margin: 10px 0;
        }

        /* ── IMPRESIÓN ── */
        @media print {
          @page {
            margin: 0 !important;
            size: letter portrait;
          }

          /* Limpiar layout raíz — los contenedores del MainLayout
             ya tienen print:block / print:h-auto via Tailwind */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }

          /* El sidebar ya tiene print:hidden de Tailwind.
             Ocultamos también cualquier otro elemento de UI que no sea
             el scroll de páginas del Pre-BEP */
          .no-print { display: none !important; }

          /* Contenedor raíz del Pre-BEP: ocupa el ancho completo disponible */
          .prebep-print-root {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            height: auto !important;
          }

          /* Scroll de páginas: sin padding extra en impresión */
          .prebep-pages-scroll {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
          }

          /* Cada bloque contenedor de página */
          .page-container {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          /* Páginas vacías → ocultar */
          .empty-page { display: none !important; }

          /* Salto de página después de cada página (excepto la última) */
          .normal-page {
            page-break-after: always !important;
            break-after: page !important;
          }
          .last-page {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          /* El recuadro físico de la página:
             - Tamaño exacto en mm según la configuración del usuario
             - overflow:hidden para hacer el clip del contenido
             - position:relative para que el clip interno con top negativo funcione */
          .page-wrapper {
            display: block !important;
            position: relative !important;
            box-shadow: none !important;
            outline: none !important;
            border: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            width: 215.9mm !important;
            height: var(--page-print-height) !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* El contenedor interior de clip — sin visibilidad forzada */
          .page-clip-inner {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Colores exactos en el contenido del documento */
          .continuous-document-content,
          .continuous-document-content * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}

