import React from 'react';

// Helper para limpiar objetos de cualquier UUID o campo ID
export const cleanObjectFromUuids = (obj) => {
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
export const renderObjectOrValue = (val) => {
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

  return <span className="font-medium text-slate-800 break-words">{String(val)}</span>;
};

export const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch (e) {
    return dateString;
  }
};

export const formatPhase = (phase) => {
  if (!phase) return '-';
  const phaseMap = {
    'diseno_conceptual': 'Diseño Conceptual',
    'anteproyecto': 'Anteproyecto',
    'diseno_detallado': 'Diseño Detallado',
    'documentacion': 'Documentación',
    'construccion': 'Construcción',
    'operacion': 'Operación',
    'cierre': 'Cierre'
  };
  return phaseMap[phase] || phase;
};

export const PROJECT_TABS_OPTIONS = [
  { label: '--- Pestañas Principales ---', value: '' },
  { label: 'Información General', value: '?tab=info' },
  { label: 'Unidades / Subproyectos', value: '?tab=units' },
  { label: 'Especialidades', value: '?tab=specialties' },
  { label: 'Equipo BIM', value: '?tab=team' },
  { label: 'Directorio', value: '?tab=directory' },
  { label: 'Software', value: '?tab=software' },
  { label: 'Herramientas BIM', value: '?tab=tools' },
  { label: 'Requisitos del Cliente', value: '?tab=requirements' },
  { label: 'LOD / TDI', value: '?tab=lod_tdi' },
  { label: 'Matriz LOD / TDI', value: '?tab=matrix' },
  { label: 'Protocolos de Modelado', value: '?tab=protocols' },
  { label: 'Materiales', value: '?tab=materials' },
  { label: 'Documentos', value: '?tab=documents' },
  { label: 'Calendario Mensual', value: '?tab=calendar' },
  { label: 'Esquemas / Espacios', value: '?tab=spaces' },
  { label: 'Objetivos BIM', value: '?tab=objectives' },
  { label: 'Cronograma de Entregas', value: '?tab=deliverables' },
  { label: '--- Rutas Globales ---', value: '' },
  { label: 'Explorador CDE', value: '/planner' },
  { label: 'Reportes de Proyecto', value: '/reports' },
  { label: 'Listado de Proyectos', value: '/' },
];

export const CHAPTER_LABELS = {
  datos: '1. DATOS DEL PROYECTO',
  unidades: '2. SUB PROYECTOS',
  directorio: '3. EQUIPO Y DIRECTORIO',
  software: '4. SOFTWARE Y HERRAMIENTAS',
  requisitos: '5. REQUISITOS',
  lod_tdi: '6. DATOS DEL PROYECTO - LOD/TDI',
  cde: '7. EXPLORADOR CDE',
  protocolos: '8. PROTOCOLOS',
  materiales: '9. MATERIALES',
  documentos: '10. DOCUMENTOS',
  calendario: '11. CALENDARIO MENSUAL',
  esquemas: '12. ESQUEMAS',
  objetivos: '13. OBJETIVOS Y USOS BIM',
  cronograma_entregas: '14. CRONOGRAMA DE ENTREGAS'
};

export const DEFAULT_CHAPTER_ORDER = [
  'datos',
  'unidades',
  'directorio',
  'software',
  'requisitos',
  'lod_tdi',
  'cde',
  'protocolos',
  'materiales',
  'documentos',
  'calendario',
  'esquemas',
  'objetivos',
  'cronograma_entregas'
];

export const DEFAULT_CHAPTER_VISIBILITY = {
  datos: true,
  unidades: true,
  directorio: true,
  software: true,
  requisitos: true,
  lod_tdi: true,
  cde: true,
  protocolos: true,
  materiales: true,
  documentos: true,
  calendario: true,
  esquemas: true,
  objetivos: true,
  cronograma_entregas: true
};

export const STATIC_ELEMENTS = [
  { discipline: 'Estructuras', element: 'Cimentaciones superficiales y profundas', tdi: 'TDI 2', lod: 'LOD 300' },
  { discipline: 'Estructuras', element: 'Columnas, muros de corte y elementos verticales', tdi: 'TDI 2', lod: 'LOD 300' },
  { discipline: 'Estructuras', element: 'Vigas, losas y sistemas de entrepiso', tdi: 'TDI 2', lod: 'LOD 300' },
  { discipline: 'Estructuras', element: 'Estructuras metálicas y conexiones principales', tdi: 'TDI 3', lod: 'LOD 350' },
  { discipline: 'Arquitectura', element: 'Muros exteriores, fachadas y cerramientos', tdi: 'TDI 2', lod: 'LOD 300' },
  { discipline: 'Arquitectura', element: 'Muros interiores y divisiones', tdi: 'TDI 2', lod: 'LOD 200' },
  { discipline: 'Arquitectura', element: 'Puertas, ventanas y carpinterías', tdi: 'TDI 2', lod: 'LOD 300' },
  { discipline: 'Arquitectura', element: 'Cielorrasos, acabados de piso y revestimientos', tdi: 'TDI 2', lod: 'LOD 200' },
  { discipline: 'Arquitectura', element: 'Aparatos sanitarios y equipamiento fijo', tdi: 'TDI 2', lod: 'LOD 300' },
  { discipline: 'Instalaciones Hidrosanitarias', element: 'Redes principales de suministro de agua potable', tdi: 'TDI 2', lod: 'LOD 300' },
  { discipline: 'Instalaciones Hidrosanitarias', element: 'Redes de desagüe sanitario y pluvial', tdi: 'TDI 2', lod: 'LOD 300' },
  { discipline: 'Instalaciones Hidrosanitarias', element: 'Equipos de bombeo, tanques y almacenamiento', tdi: 'TDI 3', lod: 'LOD 350' },
  { discipline: 'Instalaciones Hidrosanitarias', element: 'Sistema contra incendios (tuberías y rociadores)', tdi: 'TDI 3', lod: 'LOD 300' },
  { discipline: 'Instalaciones Eléctricas', element: 'Tableros de distribución y alimentadores principales', tdi: 'TDI 3', lod: 'LOD 350' },
  { discipline: 'Instalaciones Eléctricas', element: 'Canalizaciones y bandejas portacables principales', tdi: 'TDI 2', lod: 'LOD 300' },
  { discipline: 'Instalaciones Eléctricas', element: 'Circuitos ramales de iluminación y fuerza', tdi: 'TDI 2', lod: 'LOD 200' },
  { discipline: 'Instalaciones Eléctricas', element: 'Luminarias y dispositivos de control', tdi: 'TDI 2', lod: 'LOD 300' },
  { discipline: 'Instalaciones HVAC', element: 'Equipos de aire acondicionado y ventilación mecánica', tdi: 'TDI 3', lod: 'LOD 350' },
  { discipline: 'Instalaciones HVAC', element: 'Red de ductos y rejillas/difusores', tdi: 'TDI 2', lod: 'LOD 300' },
  { discipline: 'Instalaciones HVAC', element: 'Tuberías de refrigerante / agua helada', tdi: 'TDI 2', lod: 'LOD 300' }
];

export const DEFAULT_LOD_COLS = ['disciplina', 'elemento', 'tdi', 'lod', 'formato', 'fase_conceptual', 'fase_anteproyecto', 'fase_detallado', 'fase_documentacion', 'notas'];
export const DEFAULT_MATERIALES_COLS = ['codigo', 'nombre', 'categoria', 'marca', 'modelo', 'unidad', 'descripcion'];
export const DEFAULT_SUBPROYECTOS_COLS = ['codigo', 'nombre', 'descripcion', 'estado'];
export const DEFAULT_EQUIPO_COLS = ['rol_bep', 'nombre', 'empresa', 'email', 'telefono'];
export const DEFAULT_DIRECTORIO_COLS = ['nombre', 'empresa', 'disciplina', 'email', 'telefono'];
export const DEFAULT_SOFTWARE_COLS = ['software', 'version', 'disciplina', 'formato_nativo', 'formato_intercambio'];
export const DEFAULT_CALENDARIO_COLS = ['mes', 'fase', 'actividades_principales', 'hitos'];
export const DEFAULT_OBJETIVOS_COLS = ['codigo', 'prioridad', 'objetivo_cliente', 'objetivo_proyecto', 'usos_bim_asociados'];
export const DEFAULT_ENTREGAS_COLS = ['codigo', 'fase', 'fecha_entrega', 'entregables_modelo', 'entregables_documentos', 'responsable'];
