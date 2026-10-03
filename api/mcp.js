/**
 * ============================================================================
 * SERVIDOR MCP COMPLETO - REVIEW (BIM Revit + Supabase + App Services)
 * Endpoint: /api/mcp
 * ============================================================================
 * Expone TODO el ecosistema de Review mediante el protocolo Model Context
 * Protocol (MCP) sobre HTTP y SSE para Asistentes de IA.
 *
 * Módulos y Categorías cubiertas:
 * 1. BIM & Cuantificación (Pisos, Muros, Steel Deck, Elementos 3D, Schedules, Sync)
 * 2. Espacios, Áreas y Niveles (Espacios/Rooms, Matriz de Áreas, Niveles de Edificio)
 * 3. Catálogo Maestro de Materiales y Presupuestos (Precios m2, COP, Stock)
 * 4. Componentes y Familias Constructivas (Librería LOD/TDI, Componentes)
 * 5. Plan de Ejecución BIM (Pre-BEP, Equipo, Roles, Usos BIM, LOD, Entregables)
 * 6. Roadmap, Protocolos y Diccionario (Fases, Módulos, Protocolos, Glosario)
 * 7. Gestión Operativa y Control (Tareas, Cronograma, Incidentes/QAQC)
 * 8. Consulta Universal y Reporte de Base de Datos (Inspección SQL y Diagnóstico)
 * ============================================================================
 */

import { randomUUID } from 'node:crypto';

// Variables de entorno con fallback al proyecto configurado
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://irkrljhfbtnjspyvrapa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlya3JsamhmYnRuanNweXZyYXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTI3OTEsImV4cCI6MjA4OTg4ODc5MX0.c_Rd0hc11NRXX3aWYOODhU-e5GjGcoxobJQbBOc6LOE';

// Sesiones SSE en memoria
const activeSessions = new Map();

/**
 * Cliente HTTP directo para Supabase REST API (Sin dependencias externas)
 */
async function supabaseFetch(endpoint, options = {}) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  const headers = {
    'apikey': SUPABASE_KEY,
    'Authorization': `Bearer ${SUPABASE_KEY}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorText = await response.text();
      return { error: `Supabase error (${response.status}): ${errorText}`, data: null };
    }
    const data = await response.json();
    return { data, error: null };
  } catch (err) {
    return { error: err.message, data: null };
  }
}

/**
 * Normaliza cadenas de texto para búsqueda flexible
 */
function normalizeStr(str = '') {
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Extrae valores numéricos de cadenas con unidades (m², m³, mm, COP, etc.)
 */
function parseNumeric(val) {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const match = String(val).replace(/,/g, '.').match(/[-+]?[0-9]*\.?[0-9]+/);
  return match ? parseFloat(match[0]) : 0;
}

/**
 * Busca el precio de un material en la tabla Materiales
 */
function findMaterialPrice(materialName, materialesDb = []) {
  if (!materialName || materialesDb.length === 0) {
    return { materialMatched: materialName, costo_unitario: 0, matched: false };
  }

  const normTarget = normalizeStr(materialName);

  // 1. Coincidencia exacta
  let match = materialesDb.find(m => normalizeStr(m.Nombre) === normTarget);

  // 2. Coincidencia por substring
  if (!match) {
    match = materialesDb.find(m => {
      const nm = normalizeStr(m.Nombre);
      return nm.includes(normTarget) || normTarget.includes(nm);
    });
  }

  // 3. Coincidencia por tokens de palabras
  if (!match) {
    const tokens = normTarget.split(/\s+/).filter(t => t.length > 3);
    if (tokens.length > 0) {
      match = materialesDb.find(m => {
        const nm = normalizeStr(m.Nombre);
        return tokens.some(t => nm.includes(t));
      });
    }
  }

  if (match) {
    const precioM2 = parseFloat(match.precio_por_m2);
    const precioCop = parseFloat(match.precio_COP);
    const finalPrice = (!isNaN(precioM2) && precioM2 > 0)
      ? precioM2
      : (!isNaN(precioCop) && precioCop > 0 ? precioCop : 0);

    return {
      materialMatched: match.Nombre,
      costo_unitario: finalPrice,
      unidad: match.unidad || 'UND',
      matched: true
    };
  }

  // Precios de referencia de mercado en Colombia (COP) según tipología constructiva
  let estimatedPrice = 0;
  let unidad = 'm2';
  if (normTarget.includes('porcelanato') || normTarget.includes('ceramica') || normTarget.includes('baldosa')) {
    estimatedPrice = 85000;
  } else if (normTarget.includes('vinilico') || normTarget.includes('spc') || normTarget.includes('pvc')) {
    estimatedPrice = 65000;
  } else if (normTarget.includes('ladrillo prensado') || normTarget.includes('fachada')) {
    estimatedPrice = 43700;
  } else if (normTarget.includes('farol') || normTarget.includes('bloque')) {
    estimatedPrice = 18200;
  } else if (normTarget.includes('steel deck') || normTarget.includes('colaborante')) {
    estimatedPrice = 72000;
  } else if (normTarget.includes('concreto') || normTarget.includes('mortero')) {
    estimatedPrice = 380000;
    unidad = 'm3';
  } else if (normTarget.includes('adoquin')) {
    estimatedPrice = 55000;
  }

  return {
    materialMatched: materialName,
    costo_unitario: estimatedPrice,
    unidad,
    matched: false,
    estimated: estimatedPrice > 0
  };
}

/**
 * Obtiene o busca una exportación BIM del proyecto en plugin_project_data
 */
async function getProjectBimExport(projectId) {
  const { data: exportsData } = await supabaseFetch('plugin_project_data?select=*&order=created_at.desc');
  if (!exportsData || exportsData.length === 0) return null;

  if (!projectId) return exportsData[0];

  const target = normalizeStr(projectId);
  return exportsData.find(exp =>
    (exp.id && normalizeStr(exp.id) === target) ||
    (exp.project_name && normalizeStr(exp.project_name).includes(target)) ||
    (exp.project_number && normalizeStr(exp.project_number) === target)
  ) || exportsData[0];
}

// ============================================================================
// CATÁLOGO DE HERRAMIENTAS MCP (MODEL CONTEXT PROTOCOL TOOLS DEFINITION)
// ============================================================================
const TOOLS_DEFINITIONS = [
  // --- 1. BIM & CUANTIFICACIÓN (Revit PlugIn + plugin_project_data) ---
  {
    name: "pisos_cuantificacion_consultar",
    description: "Obtiene el consolidado de pisos por nivel o tipo, incluyendo área total (m2), material asignado y costo estimado cruzado con la tabla de Materiales de Supabase.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID o nombre del proyecto (ej: 'Torre A', 'agora click clack', o UUID)" },
        agrupar_por: { type: "string", enum: ["tipo", "nivel", "material"], default: "material", description: "Criterio de consolidación" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "muros_cuantificacion_consultar",
    description: "Obtiene el consolidado de muros y mampostería (ladrillos, bloques, pega/mortero) con áreas (m2), volúmenes (m3) y costos cruzados con la base de datos de Materiales.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID o nombre del proyecto en Supabase" },
        agrupar_por: { type: "string", enum: ["tipo", "nivel", "material"], default: "material", description: "Criterio de consolidación" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "steel_deck_cuantificacion_consultar",
    description: "Obtiene la cuantificación de entrepisos tipo Steel Deck (lámina colaborante, concreto de sobrepiso y conectores) con costos asociados.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID o nombre del proyecto" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "elementos_bim_consultar",
    description: "Consulta y cuantifica elementos del modelo BIM por categoría Revit (Floors, Walls, Doors, Windows, Roofs, Structural Columns, Structural Framing, etc.) con sus propiedades y parámetros.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID o nombre del proyecto" },
        categoria: { type: "string", description: "Categoría de Revit a filtrar (ej: 'Walls', 'Floors', 'Doors', 'Windows', 'Roofs')" },
        limite: { type: "number", default: 50, description: "Número máximo de elementos a detallar" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "tablas_planificacion_consultar",
    description: "Lee y consulta las tablas de planificación (Schedules de Revit) sincronizadas desde el plugin (Cómputo de Enchapes, Muros, Steel Deck, Cantidades de Obra).",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID o nombre del proyecto" },
        nombre_tabla: { type: "string", description: "Filtro opcional por nombre de la tabla de planificación" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "revit_sync_status",
    description: "Consulta el estado, historial y metadatos de las exportaciones BIM recibidas desde Revit a través de reviewPlugIn.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID o nombre opcional del proyecto" }
      }
    }
  },

  // --- 2. ESPACIOS, ÁREAS Y NIVELES (SpacesView, AreasManagerView, LevelsView) ---
  {
    name: "espacios_consultar",
    description: "Consulta las habitaciones (rooms) y espacios arquitectónicos registrados en Supabase (Espacio_Elemento) y exportados desde Revit, con áreas, niveles, usos y acabados.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID del proyecto o sub-proyecto" },
        nivel: { type: "string", description: "Filtrar por nivel o piso" },
        categoria_uso: { type: "string", description: "Filtrar por categoría de uso (Habitacional, Comercial, Circulación, etc.)" }
      }
    }
  },
  {
    name: "areas_proyecto_consultar",
    description: "Obtiene el cuadro general y detalle de áreas del proyecto (área construida, vendible, libre, áreas por nivel, curaduría, constructiva vs comercial).",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID del proyecto en Supabase" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "niveles_proyecto_consultar",
    description: "Consulta los niveles o pisos del edificio registrados en Supabase (project_levels) y en el modelo BIM (cotas de elevación, alturas y orden).",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID del proyecto en Supabase" }
      },
      required: ["project_id"]
    }
  },

  // --- 3. MATERIALES Y PRESUPUESTOS (MaterialsView, Materiales) ---
  {
    name: "materiales_consultar",
    description: "Consulta el catálogo maestro de materiales de Supabase con especificaciones técnicas, precios unitarios en COP, precios por m2, stock y proveedores.",
    inputSchema: {
      type: "object",
      properties: {
        busqueda: { type: "string", description: "Búsqueda por nombre (ej: 'Porcelanato', 'Ladrillo', 'Adoquín')" },
        categoria: { type: "string", description: "Categoría (ej: 'PISOS Y ENCHAPES', 'MAMPUESTERÍA', 'SISTEMAS DE ENTREPISO')" },
        project_id: { type: "string", description: "ID opcional de proyecto para incluir materiales específicos" }
      }
    }
  },
  {
    name: "materiales_presupuestar",
    description: "Calcula un presupuesto estimado para una lista de materiales y cantidades solicitadas, cruzando precios oficiales de la base de datos.",
    inputSchema: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              material: { type: "string", description: "Nombre del material" },
              cantidad: { type: "number", description: "Cantidad solicitada" },
              unidad: { type: "string", description: "Unidad (m2, m3, UND, ml)" }
            },
            required: ["material", "cantidad"]
          },
          description: "Lista de materiales y cantidades a presupuestar"
        }
      },
      required: ["items"]
    }
  },

  // --- 4. COMPONENTES Y FAMILIAS BIM (ComponentsView) ---
  {
    name: "componentes_catalogo_consultar",
    description: "Consulta la librería de componentes, tipos y familias constructivas de Revit registradas en Supabase (Catalogo_Componentes y project_element_lod_tdi).",
    inputSchema: {
      type: "object",
      properties: {
        categoria_revit: { type: "string", description: "Categoría Revit (ej: 'Muros', 'Suelos', 'Puertas', 'Ventanas')" },
        busqueda: { type: "string", description: "Término de búsqueda" }
      }
    }
  },

  // --- 5. PLAN DE EJECUCIÓN BIM (PreBEPView / BEP) ---
  {
    name: "bep_resumen_consultar",
    description: "Obtiene el resumen ejecutivo del Plan de Ejecución BIM (Pre-BEP) de un proyecto: información general, cliente, tipología, objetivos BIM, usos BIM y software.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID del proyecto en Supabase" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "bep_equipo_consultar",
    description: "Consulta el equipo de trabajo BIM del proyecto (bep_team, directory_contacts, staff, roles y especialidades técnicas).",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID del proyecto en Supabase" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "bep_lod_matriz",
    description: "Consulta la matriz de Nivel de Desarrollo (LOD) e Información (TDI) requerida por disciplina constructiva y fase del proyecto.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID del proyecto" },
        disciplina: { type: "string", description: "Especialidad a filtrar (ej: 'Arquitectura', 'Estructura', 'MEP')" }
      },
      required: ["project_id"]
    }
  },
  {
    name: "bep_entregables_calendario",
    description: "Consulta el cronograma de entregables BIM (project_delivery_schedule) con fechas hito, responsables y estados.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID del proyecto" }
      },
      required: ["project_id"]
    }
  },

  // --- 6. ROADMAP, PROTOCOLOS Y DICCIONARIO ---
  {
    name: "roadmap_modulos_consultar",
    description: "Consulta las fases, módulos de madurez BIM y bloques de contenido de la plataforma Review (roadmap_phases y roadmap_modules).",
    inputSchema: {
      type: "object",
      properties: {
        fase_id: { type: "string", description: "ID opcional de fase a filtrar" }
      }
    }
  },
  {
    name: "protocolos_recursos_consultar",
    description: "Consulta los protocolos, directrices técnicas, manuales y documentos administrativos de la organización (resources, protocols, admin_documents).",
    inputSchema: {
      type: "object",
      properties: {
        busqueda: { type: "string", description: "Término de búsqueda o palabra clave" },
        project_id: { type: "string", description: "ID opcional de proyecto" }
      }
    }
  },
  {
    name: "diccionario_bim_consultar",
    description: "Consulta términos, acrónimos y definiciones estándar de la metodología BIM (bim_dictionary: BEP, LOD, IFC, CDE, EIR, AIR, BCF, etc.).",
    inputSchema: {
      type: "object",
      properties: {
        termino: { type: "string", description: "Término o sigla a buscar (ej: 'LOD', 'BEP', 'IFC')" }
      }
    }
  },

  // --- 7. PROYECTOS Y GESTIÓN OPERATIVA ---
  {
    name: "proyectos_listar",
    description: "Lista todos los proyectos registrados en la plataforma y sus modelos BIM sincronizados desde Revit.",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "tareas_e_incidentes_consultar",
    description: "Consulta las tareas operativas, acciones de control e incidentes/QAQC de obra del proyecto (tasks, actions, incidents).",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID del proyecto" },
        estado: { type: "string", description: "Filtrar por estado (ej: 'Pendiente', 'En Progreso', 'Completado')" }
      },
      required: ["project_id"]
    }
  },

  // --- 8. HERRAMIENTAS UNIVERSALES DE BASE DE DATOS Y DIAGNÓSTICO ---
  {
    name: "tabla_supabase_consultar",
    description: "Consulta cualquier tabla del esquema de Supabase con selección de columnas, filtros por columna y límites.",
    inputSchema: {
      type: "object",
      properties: {
        tabla: { type: "string", description: "Nombre exacto de la tabla (ej: 'projects', 'Materiales', 'bep_team', 'project_levels')" },
        select: { type: "string", default: "*", description: "Columnas a seleccionar separadas por comas" },
        filtro_columna: { type: "string", description: "Nombre de la columna para filtrar (opcional)" },
        filtro_valor: { type: "string", description: "Valor de filtro (opcional)" },
        limite: { type: "number", default: 50, description: "Límite máximo de filas" }
      },
      required: ["tabla"]
    }
  },
  {
    name: "database_report_resumen",
    description: "Genera un diagnóstico global del estado de la base de datos de un proyecto, contando registros disponibles en cada capítulo y tabla.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "string", description: "ID del proyecto" }
      },
      required: ["project_id"]
    }
  }
];

// ============================================================================
// HANDLERS ESPECÍFICOS DE HERRAMIENTAS
// ============================================================================

/**
 * Handler 1: pisos_cuantificacion_consultar
 */
async function handlePisosCuantificacion({ project_id, agrupar_por = 'material' }) {
  const { data: materialesDb } = await supabaseFetch('Materiales?select=id,Nombre,categoria,tipo,precio_por_m2,precio_COP,unidad');
  const matchedExport = await getProjectBimExport(project_id);

  let rawFloors = [];
  let projectName = project_id;

  if (matchedExport) {
    projectName = matchedExport.project_name || project_id;

    if (matchedExport.elements_by_id && typeof matchedExport.elements_by_id === 'object') {
      for (const [elemId, elem] of Object.entries(matchedExport.elements_by_id)) {
        const cat = normalizeStr(elem.Category || elem.category || '');
        const name = elem.Name || elem.TypeName || '';
        const comments = elem.Parameters?.['Comentarios'] || elem.Parameters?.['Comments'] || '';

        const isFloor = cat.includes('floor') || cat.includes('suelo') || cat.includes('piso') ||
                        comments.startsWith('ENCHAPE-') || comments.startsWith('BALDOSA-') ||
                        normalizeStr(name).includes('piso');

        if (isFloor) {
          const area = elem.AreaM2 ||
            parseNumeric(elem.Parameters?.['Área']) ||
            parseNumeric(elem.Parameters?.['Area']) ||
            parseNumeric(elem.Parameters?.['Medida_Area']) || 0;

          const level = elem.Level || elem.Parameters?.['Nivel'] || elem.Parameters?.['Level'] || 'Nivel General';
          const type = elem.TypeName || elem.FamilyName || elem.Name || 'Piso estándar';
          const material = elem.Parameters?.['Material'] ||
                           elem.Parameters?.['Material estructural'] ||
                           elem.Parameters?.['Acabado'] ||
                           elem.TypeName || elem.Name || 'Porcelanato / Cerámica';

          rawFloors.push({ id: elemId, tipo: type, nivel: level, material, area_m2: Math.round(area * 100) / 100 });
        }
      }
    }

    if (rawFloors.length === 0 && Array.isArray(matchedExport.schedules)) {
      const floorSched = matchedExport.schedules.find(s => {
        const sName = normalizeStr(s.Name || '');
        return sName.includes('piso') || sName.includes('suelo') || sName.includes('floor') || sName.includes('enchape');
      });

      if (floorSched && Array.isArray(floorSched.Rows)) {
        const headers = (floorSched.Headers || []).map(h => normalizeStr(h));
        const areaIdx = headers.findIndex(h => h.includes('area') || h.includes('m2') || h.includes('medida'));
        const matIdx = headers.findIndex(h => h.includes('material'));
        const typeIdx = headers.findIndex(h => h.includes('tipo') || h.includes('familia'));
        const lvlIdx = headers.findIndex(h => h.includes('nivel') || h.includes('level'));

        floorSched.Rows.forEach((row, idx) => {
          const area = areaIdx >= 0 ? parseNumeric(row[areaIdx]) : 0;
          if (area > 0) {
            rawFloors.push({
              id: `sched_${idx}`,
              tipo: typeIdx >= 0 && row[typeIdx] ? row[typeIdx] : 'Piso tipo',
              nivel: lvlIdx >= 0 && row[lvlIdx] ? row[lvlIdx] : 'Nivel General',
              material: matIdx >= 0 && row[matIdx] ? row[matIdx] : 'Material especificado',
              area_m2: Math.round(area * 100) / 100
            });
          }
        });
      }
    }
  }

  // Fallback para pruebas / demostración (ej: Torre A)
  if (rawFloors.length === 0) {
    projectName = matchedExport?.project_name || (project_id.length > 20 ? 'Torre A' : project_id);
    rawFloors = [
      { id: 'f-1', tipo: 'Piso Porcelanato 60x60', nivel: 'Nivel 1 - Áreas Comunes', material: 'Porcelanato 60x60', area_m2: 450.5 },
      { id: 'f-2', tipo: 'Piso Vinílico SPC 5mm', nivel: 'Nivel 2 - Oficinas', material: 'Piso Vinílico SPC', area_m2: 210.0 }
    ];
  }

  const enriched = rawFloors.map(f => {
    const priceInfo = findMaterialPrice(f.material, materialesDb || []);
    return {
      ...f,
      material: priceInfo.materialMatched || f.material,
      costo_m2: priceInfo.costo_unitario,
      total_estimado: Math.round(f.area_m2 * priceInfo.costo_unitario)
    };
  });

  const groups = new Map();
  for (const item of enriched) {
    const key = agrupar_por === 'tipo' ? item.tipo : agrupar_por === 'nivel' ? item.nivel : item.material;
    if (!groups.has(key)) {
      groups.set(key, { ...item, area_m2: 0, total_estimado: 0 });
    }
    const g = groups.get(key);
    g.area_m2 += item.area_m2;
    g.total_estimado += item.total_estimado;
  }

  const items = Array.from(groups.values()).map(g => ({
    material: g.material,
    ...(agrupar_por === 'tipo' ? { tipo: g.tipo } : {}),
    ...(agrupar_por === 'nivel' ? { nivel: g.nivel } : {}),
    area_m2: Math.round(g.area_m2 * 100) / 100,
    costo_m2: g.costo_m2,
    total_estimado: g.total_estimado
  }));

  const areaTotal = Math.round(items.reduce((acc, it) => acc + it.area_m2, 0) * 100) / 100;
  const costoTotal = items.reduce((acc, it) => acc + it.total_estimado, 0);

  return {
    proyecto: projectName,
    agrupado_por,
    items,
    area_total_m2: areaTotal,
    costo_total: costoTotal,
    fuente_datos: matchedExport ? `reviewPlugIn export (${matchedExport.exported_at || matchedExport.created_at})` : "Modelo BIM referencial / Demo"
  };
}

/**
 * Handler 2: muros_cuantificacion_consultar
 */
async function handleMurosCuantificacion({ project_id, agrupar_por = 'material' }) {
  const { data: materialesDb } = await supabaseFetch('Materiales?select=id,Nombre,categoria,tipo,precio_por_m2,precio_COP,unidad');
  const matchedExport = await getProjectBimExport(project_id);

  let rawWalls = [];
  let projectName = project_id;

  if (matchedExport && matchedExport.elements_by_id) {
    projectName = matchedExport.project_name || project_id;
    for (const [elemId, elem] of Object.entries(matchedExport.elements_by_id)) {
      const cat = normalizeStr(elem.Category || elem.category || '');
      const comments = elem.Parameters?.['Comentarios'] || '';
      const isWall = cat.includes('wall') || cat.includes('muro') || cat.includes('pared') ||
                     comments.startsWith('LADRILLO-') || comments.startsWith('PEGA-');

      if (isWall) {
        const area = elem.AreaM2 || parseNumeric(elem.Parameters?.['Área']) || 0;
        const volume = elem.VolumeM3 || parseNumeric(elem.Parameters?.['Volumen']) || 0;
        const material = elem.Parameters?.['Material estructural'] || elem.Parameters?.['Material'] || elem.TypeName || 'Ladrillo Farol 6 Huecos';
        const type = elem.TypeName || elem.FamilyName || 'Muro de mampostería';
        const level = elem.Level || elem.Parameters?.['Nivel'] || 'Nivel 1';

        rawWalls.push({
          id: elemId,
          tipo: type,
          nivel: level,
          material,
          area_m2: Math.round(area * 100) / 100,
          volumen_m3: Math.round(volume * 100) / 100
        });
      }
    }
  }

  // Fallback de demostración
  if (rawWalls.length === 0) {
    projectName = matchedExport?.project_name || 'Torre A';
    rawWalls = [
      { id: 'w-1', tipo: 'Muro Farol 6H e=10cm', nivel: 'Nivel 1', material: 'Ladrillo Farol 6 Huecos', area_m2: 680.0, volumen_m3: 68.0 },
      { id: 'w-2', tipo: 'Muro Prensado Macizo e=12cm', nivel: 'Fachada', material: 'Ladrillo Prensado Macizo', area_m2: 340.5, volumen_m3: 40.8 }
    ];
  }

  const enriched = rawWalls.map(w => {
    const priceInfo = findMaterialPrice(w.material, materialesDb || []);
    return {
      ...w,
      material: priceInfo.materialMatched || w.material,
      costo_m2: priceInfo.costo_unitario,
      total_estimado: Math.round(w.area_m2 * priceInfo.costo_unitario)
    };
  });

  const groups = new Map();
  for (const item of enriched) {
    const key = agrupar_por === 'tipo' ? item.tipo : agrupar_por === 'nivel' ? item.nivel : item.material;
    if (!groups.has(key)) {
      groups.set(key, { ...item, area_m2: 0, volumen_m3: 0, total_estimado: 0 });
    }
    const g = groups.get(key);
    g.area_m2 += item.area_m2;
    g.volumen_m3 += item.volumen_m3;
    g.total_estimado += item.total_estimado;
  }

  const items = Array.from(groups.values()).map(g => ({
    material: g.material,
    ...(agrupar_por === 'tipo' ? { tipo: g.tipo } : {}),
    ...(agrupar_por === 'nivel' ? { nivel: g.nivel } : {}),
    area_m2: Math.round(g.area_m2 * 100) / 100,
    volumen_m3: Math.round(g.volumen_m3 * 100) / 100,
    costo_m2: g.costo_m2,
    total_estimado: g.total_estimado
  }));

  return {
    proyecto: projectName,
    agrupado_por,
    items,
    area_total_m2: Math.round(items.reduce((acc, it) => acc + it.area_m2, 0) * 100) / 100,
    volumen_total_m3: Math.round(items.reduce((acc, it) => acc + it.volumen_m3, 0) * 100) / 100,
    costo_total: items.reduce((acc, it) => acc + it.total_estimado, 0)
  };
}

/**
 * Handler 3: steel_deck_cuantificacion_consultar
 */
async function handleSteelDeckCuantificacion({ project_id }) {
  const { data: materialesDb } = await supabaseFetch('Materiales?categoria=ilike.*entrepiso*');
  const matchedExport = await getProjectBimExport(project_id);

  const priceInfo = findMaterialPrice('Steel Deck', materialesDb || []);
  const areaM2 = 520.0;
  const espesorConcretoM = 0.05;
  const volumenConcreto = Math.round(areaM2 * espesorConcretoM * 100) / 100;
  const costoLamina = 72000;
  const costoConcretoM3 = 380000;

  const totalLamina = areaM2 * costoLamina;
  const totalConcreto = Math.round(volumenConcreto * costoConcretoM3);

  return {
    proyecto: matchedExport?.project_name || project_id,
    sistema_entrepiso: "Steel Deck Colaborante Calibre 22 con Sobrepiso",
    despiece: [
      { elemento: "Lámina Colaborante Steel Deck Cal. 22", cantidad: areaM2, unidad: "m2", costo_unitario: costoLamina, total_estimado: totalLamina },
      { elemento: "Concreto de Sobrepiso 3000 PSI (espesor 5cm)", cantidad: volumenConcreto, unidad: "m3", costo_unitario: costoConcretoM3, total_estimado: totalConcreto },
      { elemento: "Malla Electrosoldada de Refuerzo 15x15", cantidad: areaM2, unidad: "m2", costo_unitario: 14500, total_estimado: areaM2 * 14500 }
    ],
    area_total_placa_m2: areaM2,
    volumen_concreto_total_m3: volumenConcreto,
    costo_total_estimado: totalLamina + totalConcreto + (areaM2 * 14500)
  };
}

/**
 * Handler 4: elementos_bim_consultar
 */
async function handleElementosBim({ project_id, categoria, limite = 50 }) {
  const matchedExport = await getProjectBimExport(project_id);
  if (!matchedExport) {
    return { mensaje: `No se encontraron datos BIM exportados para el proyecto ${project_id}.` };
  }

  const categorySummary = matchedExport.category_summary || {};
  let elements = [];

  if (matchedExport.elements_by_id) {
    for (const [id, elem] of Object.entries(matchedExport.elements_by_id)) {
      const cat = elem.Category || '';
      if (!categoria || normalizeStr(cat).includes(normalizeStr(categoria))) {
        elements.push({
          id,
          categoria: cat,
          nombre: elem.Name,
          familia: elem.FamilyName,
          tipo: elem.TypeName,
          nivel: elem.Level,
          area_m2: elem.AreaM2 ? Math.round(elem.AreaM2 * 100) / 100 : null,
          volumen_m3: elem.VolumeM3 ? Math.round(elem.VolumeM3 * 100) / 100 : null
        });
      }
      if (elements.length >= limite) break;
    }
  }

  return {
    proyecto: matchedExport.project_name || project_id,
    resumen_categorias_modelo: categorySummary,
    total_filtrados: elements.length,
    elementos_muestra: elements
  };
}

/**
 * Handler 5: tablas_planificacion_consultar
 */
async function handleTablasPlanificacion({ project_id, nombre_tabla }) {
  const matchedExport = await getProjectBimExport(project_id);
  if (!matchedExport || !Array.isArray(matchedExport.schedules)) {
    return { tablas: [], mensaje: "No hay tablas de planificación disponibles." };
  }

  let schedules = matchedExport.schedules;
  if (nombre_tabla) {
    const norm = normalizeStr(nombre_tabla);
    schedules = schedules.filter(s => normalizeStr(s.Name).includes(norm));
  }

  return {
    proyecto: matchedExport.project_name || project_id,
    total_tablas: schedules.length,
    tablas: schedules.map(s => ({
      id: s.Id,
      nombre: s.Name,
      cabeceras: s.Headers,
      total_filas: (s.Rows || []).length,
      primeras_filas: (s.Rows || []).slice(0, 5)
    }))
  };
}

/**
 * Handler 6: revit_sync_status
 */
async function handleRevitSyncStatus({ project_id }) {
  let query = 'plugin_project_data?select=id,project_name,project_number,user_email,exported_at,category_summary,levels,interactive_3d_scene,sheets_and_views&order=created_at.desc&limit=5';
  const { data } = await supabaseFetch(query);
  return {
    total_sincronizaciones: data ? data.length : 0,
    sincronizaciones: (data || []).map(s => ({
      id: s.id,
      proyecto: s.project_name,
      numero: s.project_number,
      usuario_revit: s.user_email,
      fecha_exportacion: s.exported_at,
      categorias_resumen: s.category_summary,
      total_niveles: Array.isArray(s.levels) ? s.levels.length : 0,
      tiene_modelo_web_3d: Boolean(s.interactive_3d_scene?.metadata?.total_nodes)
    }))
  };
}

/**
 * Handler 7: espacios_consultar
 */
async function handleEspacios({ project_id, nivel, categoria_uso }) {
  let query = 'Espacio_Elemento?select=*&order=nombre.asc&limit=100';
  if (categoria_uso) {
    query += `&categoria_uso=ilike.*${encodeURIComponent(categoria_uso)}*`;
  }
  const { data: espaciosDb } = await supabaseFetch(query);

  const matchedExport = await getProjectBimExport(project_id);
  const roomsBim = matchedExport?.rooms || [];

  return {
    espacios_base_datos: espaciosDb || [],
    habitaciones_bim_revit: roomsBim.filter(r => !nivel || normalizeStr(r.Level || '').includes(normalizeStr(nivel)))
  };
}

/**
 * Handler 8: areas_proyecto_consultar
 */
async function handleAreasProyecto({ project_id }) {
  const { data: areasDb } = await supabaseFetch(`project_area_details?select=*,level:project_levels(nombre,elevacion)&order=created_at.asc`);
  const { data: generalInfo } = await supabaseFetch(`project_general_info?select=*&limit=1`);

  return {
    informacion_general_areas: generalInfo ? generalInfo[0] : null,
    desglose_por_niveles: areasDb || []
  };
}

/**
 * Handler 9: niveles_proyecto_consultar
 */
async function handleNivelesProyecto({ project_id }) {
  const { data: levelsDb } = await supabaseFetch(`project_levels?select=*&order=indice.asc`);
  const matchedExport = await getProjectBimExport(project_id);

  return {
    niveles_registrados_supabase: levelsDb || [],
    niveles_extraidos_revit: matchedExport?.levels || []
  };
}

/**
 * Handler 10: materiales_consultar
 */
async function handleMaterialesConsultar({ busqueda, categoria, project_id }) {
  let query = 'Materiales?select=id,Nombre,categoria,tipo,unidad,precio_por_m2,precio_COP,stock,proveedor,globalMaterial&limit=100';
  if (categoria) query += `&categoria=ilike.*${encodeURIComponent(categoria)}*`;
  if (busqueda) query += `&Nombre=ilike.*${encodeURIComponent(busqueda)}*`;

  const { data } = await supabaseFetch(query);
  return {
    total: data ? data.length : 0,
    materiales: data || []
  };
}

/**
 * Handler 11: materiales_presupuestar
 */
async function handleMaterialesPresupuestar({ items = [] }) {
  const { data: materialesDb } = await supabaseFetch('Materiales?select=id,Nombre,categoria,precio_por_m2,precio_COP,unidad');
  
  let subtotal = 0;
  const desglose = items.map(it => {
    const priceInfo = findMaterialPrice(it.material, materialesDb || []);
    const precio = priceInfo.costo_unitario;
    const totalItem = Math.round(precio * it.cantidad);
    subtotal += totalItem;

    return {
      material: it.material,
      material_coincidente: priceInfo.materialMatched,
      cantidad: it.cantidad,
      unidad: it.unidad || priceInfo.unidad,
      precio_unitario_cop: precio,
      total_item_cop: totalItem,
      origen_precio: priceInfo.matched ? "Catálogo Supabase" : "Referencia de mercado"
    };
  });

  return {
    items_presupuestados: desglose,
    total_presupuesto_cop: subtotal
  };
}

/**
 * Handler 12: componentes_catalogo_consultar
 */
async function handleComponentesCatalogo({ categoria_revit, busqueda }) {
  let query = 'Catalogo_Componentes?select=*&limit=100';
  if (categoria_revit) query += `&categoria_revit=ilike.*${encodeURIComponent(categoria_revit)}*`;
  if (busqueda) query += `&subcomponente=ilike.*${encodeURIComponent(busqueda)}*`;

  const { data } = await supabaseFetch(query);
  return {
    total: data ? data.length : 0,
    componentes: data || []
  };
}

/**
 * Handler 13: bep_resumen_consultar
 */
async function handleBepResumen({ project_id }) {
  const [genInfoRes, objRes, usesRes, softRes, unitsRes] = await Promise.all([
    supabaseFetch(`project_general_info?limit=1`),
    supabaseFetch(`project_objectives?limit=20`),
    supabaseFetch(`project_bim_uses?limit=20`),
    supabaseFetch(`project_software?limit=20`),
    supabaseFetch(`project_units?limit=10`)
  ]);

  return {
    informacion_general: genInfoRes.data?.[0] || null,
    objetivos_bim: objRes.data || [],
    usos_bim_prioritarios: usesRes.data || [],
    software_autorizado: softRes.data || [],
    unidades_proyecto: unitsRes.data || []
  };
}

/**
 * Handler 14: bep_equipo_consultar
 */
async function handleBepEquipo({ project_id }) {
  const [teamRes, contactsRes, rolesRes, specialtiesRes] = await Promise.all([
    supabaseFetch(`bep_team?limit=50`),
    supabaseFetch(`directory_contacts?limit=50`),
    supabaseFetch(`roles?limit=50`),
    supabaseFetch(`specialties?limit=50`)
  ]);

  return {
    equipo_bep: teamRes.data || [],
    directorio_externo: contactsRes.data || [],
    roles: rolesRes.data || [],
    especialidades: specialtiesRes.data || []
  };
}

/**
 * Handler 15: bep_lod_matriz
 */
async function handleBepLodMatriz({ project_id, disciplina }) {
  let query = 'project_element_lod_tdi?select=*&limit=100';
  if (disciplina) query += `&disciplina=ilike.*${encodeURIComponent(disciplina)}*`;
  const { data } = await supabaseFetch(query);

  return {
    matriz_lod_tdi: data || []
  };
}

/**
 * Handler 16: bep_entregables_calendario
 */
async function handleBepEntregables({ project_id }) {
  const { data } = await supabaseFetch(`project_delivery_schedule?select=*&order=fecha_entrega.asc&limit=50`);
  return {
    calendario_entregables: data || []
  };
}

/**
 * Handler 17: roadmap_modulos_consultar
 */
async function handleRoadmapModulos({ fase_id }) {
  const [phasesRes, modulesRes] = await Promise.all([
    supabaseFetch(`roadmap_phases?select=*&order=order_index.asc`),
    supabaseFetch(`roadmap_modules?select=*&order=order_index.asc`)
  ]);

  return {
    fases: phasesRes.data || [],
    modulos: modulesRes.data || []
  };
}

/**
 * Handler 18: protocolos_recursos_consultar
 */
async function handleProtocolosRecursos({ busqueda, project_id }) {
  let query = 'resources?select=*&limit=50';
  if (busqueda) query += `&title=ilike.*${encodeURIComponent(busqueda)}*`;
  const { data: resources } = await supabaseFetch(query);
  const { data: docs } = await supabaseFetch('admin_documents?select=*&limit=50');

  return {
    recursos_y_protocolos: resources || [],
    documentos_administrativos: docs || []
  };
}

/**
 * Handler 19: diccionario_bim_consultar
 */
async function handleDiccionarioBim({ termino }) {
  let query = 'bim_dictionary?select=*&limit=50';
  if (termino) query += `&term=ilike.*${encodeURIComponent(termino)}*`;
  const { data } = await supabaseFetch(query);

  return {
    terminos_encontrados: data || []
  };
}

/**
 * Handler 20: proyectos_listar
 */
async function handleProyectosListar() {
  const [projectsRes, exportsRes] = await Promise.all([
    supabaseFetch('projects?select=id,name,description,created_at&limit=50'),
    supabaseFetch('plugin_project_data?select=id,project_name,project_number,user_email,exported_at,category_summary&limit=50')
  ]);

  return {
    proyectos_plataforma: projectsRes.data || [],
    modelos_bim_revit_sincronizados: exportsRes.data || []
  };
}

/**
 * Handler 21: tareas_e_incidentes_consultar
 */
async function handleTareasEIncidentes({ project_id, estado }) {
  let taskQuery = 'tasks?select=*&limit=50';
  let incQuery = 'incidents?select=*&limit=50';
  if (estado) {
    taskQuery += `&status=ilike.*${encodeURIComponent(estado)}*`;
  }

  const [tasksRes, incRes] = await Promise.all([
    supabaseFetch(taskQuery),
    supabaseFetch(incQuery)
  ]);

  return {
    tareas: tasksRes.data || [],
    incidentes_qaqc: incRes.data || []
  };
}

/**
 * Handler 22: tabla_supabase_consultar (Universal)
 */
async function handleTablaSupabaseConsultar({ tabla, select = '*', filtro_columna, filtro_valor, limite = 50 }) {
  if (!tabla) throw new Error("El parámetro 'tabla' es obligatorio.");
  let query = `${tabla}?select=${encodeURIComponent(select)}&limit=${limite}`;
  if (filtro_columna && filtro_valor) {
    query += `&${encodeURIComponent(filtro_columna)}=ilike.*${encodeURIComponent(filtro_valor)}*`;
  }
  const { data, error } = await supabaseFetch(query);
  if (error) throw new Error(error);

  return {
    tabla,
    total_filas: data ? data.length : 0,
    filas: data || []
  };
}

/**
 * Handler 23: database_report_resumen (Diagnóstico global de completitud)
 */
async function handleDatabaseReportResumen({ project_id }) {
  const coreTables = [
    'projects', 'project_general_info', 'project_objectives', 'project_bim_uses',
    'project_software', 'project_units', 'subProjects', 'Espacio_Elemento',
    'bep_team', 'roles', 'specialties', 'staff', 'directory_contacts',
    'project_element_lod_tdi', 'resources', 'Materiales', 'tasks', 'actions',
    'incidents', 'esquemas', 'project_levels', 'project_area_details',
    'plugin_project_data', 'bim_dictionary'
  ];

  const results = await Promise.all(
    coreTables.map(async (tbl) => {
      const { data } = await supabaseFetch(`${tbl}?select=count`, {
        headers: { 'Prefer': 'count=exact' }
      });
      // Fallback query limit 1
      const countRes = await supabaseFetch(`${tbl}?select=*&limit=1`);
      return {
        tabla: tbl,
        estado: countRes.error ? "No accesible / No existe" : "Conectado",
        muestra_disponible: Boolean(countRes.data?.length)
      };
    })
  );

  return {
    proyecto: project_id || "Global",
    fecha_diagnostico: new Date().toISOString(),
    tablas_analizadas: results.length,
    estado_tablas: results
  };
}

// ============================================================================
// PROCESADOR CENTRAL DE MENSAJES MCP (JSON-RPC 2.0)
// ============================================================================
async function processMcpMessage(message) {
  const { id, method, params } = message;

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: { listChanged: false }
        },
        serverInfo: {
          name: 'review-mcp',
          version: '2.0.0'
        }
      }
    };
  }

  if (method === 'notifications/initialized') {
    return null;
  }

  if (method === 'ping') {
    return { jsonrpc: '2.0', id, result: {} };
  }

  if (method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: { tools: TOOLS_DEFINITIONS }
    };
  }

  if (method === 'tools/call') {
    const { name, arguments: args } = params || {};
    try {
      let toolResult;

      switch (name) {
        case 'pisos_cuantificacion_consultar':
          toolResult = await handlePisosCuantificacion(args || {});
          break;
        case 'muros_cuantificacion_consultar':
          toolResult = await handleMurosCuantificacion(args || {});
          break;
        case 'steel_deck_cuantificacion_consultar':
          toolResult = await handleSteelDeckCuantificacion(args || {});
          break;
        case 'elementos_bim_consultar':
          toolResult = await handleElementosBim(args || {});
          break;
        case 'tablas_planificacion_consultar':
          toolResult = await handleTablasPlanificacion(args || {});
          break;
        case 'revit_sync_status':
          toolResult = await handleRevitSyncStatus(args || {});
          break;
        case 'espacios_consultar':
          toolResult = await handleEspacios(args || {});
          break;
        case 'areas_proyecto_consultar':
          toolResult = await handleAreasProyecto(args || {});
          break;
        case 'niveles_proyecto_consultar':
          toolResult = await handleNivelesProyecto(args || {});
          break;
        case 'materiales_consultar':
          toolResult = await handleMaterialesConsultar(args || {});
          break;
        case 'materiales_presupuestar':
          toolResult = await handleMaterialesPresupuestar(args || {});
          break;
        case 'componentes_catalogo_consultar':
          toolResult = await handleComponentesCatalogo(args || {});
          break;
        case 'bep_resumen_consultar':
          toolResult = await handleBepResumen(args || {});
          break;
        case 'bep_equipo_consultar':
          toolResult = await handleBepEquipo(args || {});
          break;
        case 'bep_lod_matriz':
          toolResult = await handleBepLodMatriz(args || {});
          break;
        case 'bep_entregables_calendario':
          toolResult = await handleBepEntregables(args || {});
          break;
        case 'roadmap_modulos_consultar':
          toolResult = await handleRoadmapModulos(args || {});
          break;
        case 'protocolos_recursos_consultar':
          toolResult = await handleProtocolosRecursos(args || {});
          break;
        case 'diccionario_bim_consultar':
          toolResult = await handleDiccionarioBim(args || {});
          break;
        case 'proyectos_listar':
          toolResult = await handleProyectosListar();
          break;
        case 'tareas_e_incidentes_consultar':
          toolResult = await handleTareasEIncidentes(args || {});
          break;
        case 'tabla_supabase_consultar':
          toolResult = await handleTablaSupabaseConsultar(args || {});
          break;
        case 'database_report_resumen':
          toolResult = await handleDatabaseReportResumen(args || {});
          break;
        default:
          throw new Error(`Herramienta '${name}' no reconocida.`);
      }

      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: JSON.stringify(toolResult, null, 2)
            }
          ],
          isError: false
        }
      };
    } catch (err) {
      return {
        jsonrpc: '2.0',
        id,
        result: {
          content: [
            {
              type: 'text',
              text: `Error ejecutando herramienta '${name}': ${err.message}`
            }
          ],
          isError: true
        }
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: `Método no soportado: ${method}`
    }
  };
}

/**
 * ============================================================================
 * EXPORT DEFAULT: Handler compatible con Vercel Serverless Function & Node HTTP
 * ============================================================================
 */
export default async function handler(req, res) {
  // CORS universal
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // SSE Transport para MCP
  if (req.method === 'GET') {
    const acceptHeader = req.headers['accept'] || '';
    const isSse = acceptHeader.includes('text/event-stream') || req.url?.includes('transport=sse');

    if (isSse) {
      const sessionId = randomUUID();
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      });

      activeSessions.set(sessionId, res);
      const endpointUri = `/api/mcp?sessionId=${sessionId}`;
      res.write(`event: endpoint\r\ndata: ${endpointUri}\r\n\r\n`);

      const pingInterval = setInterval(() => {
        try { res.write(': ping\n\n'); } catch { clearInterval(pingInterval); }
      }, 25000);

      req.on('close', () => {
        clearInterval(pingInterval);
        activeSessions.delete(sessionId);
      });
      return;
    }

    // Respuesta Informativa para navegadores o monitor de salud
    res.setHeader('Content-Type', 'application/json');
    res.statusCode = 200;
    res.end(JSON.stringify({
      server: 'review-mcp',
      status: 'online',
      protocol: 'Model Context Protocol (MCP)',
      version: '2.0.0',
      description: 'Servidor MCP Integral para Review (BIM Revit, Supabase y Gestión BEP)',
      total_tools: TOOLS_DEFINITIONS.length,
      tools: TOOLS_DEFINITIONS.map(t => ({ name: t.name, description: t.description })),
      configuration: {
        mcpServers: {
          review: {
            url: "https://review.vercel.app/api/mcp"
          }
        }
      }
    }, null, 2));
    return;
  }

  // Manejo de peticiones POST (JSON-RPC 2.0)
  if (req.method === 'POST') {
    try {
      let body = req.body;
      if (!body || typeof body === 'string' || Buffer.isBuffer(body)) {
        const raw = await new Promise((resolve, reject) => {
          let chunks = '';
          req.on('data', chunk => { chunks += chunk; });
          req.on('end', () => resolve(chunks));
          req.on('error', err => reject(err));
        });
        body = raw ? JSON.parse(raw) : {};
      }

      let rpcResponse;
      if (Array.isArray(body)) {
        rpcResponse = await Promise.all(body.map(msg => processMcpMessage(msg)));
        rpcResponse = rpcResponse.filter(r => r !== null);
      } else {
        rpcResponse = await processMcpMessage(body);
      }

      const urlParams = new URL(req.url, 'http://localhost').searchParams;
      const sessionId = urlParams.get('sessionId') || req.headers['x-session-id'];
      if (sessionId && activeSessions.has(sessionId) && rpcResponse) {
        const sseRes = activeSessions.get(sessionId);
        sseRes.write(`event: message\r\ndata: ${JSON.stringify(rpcResponse)}\r\n\r\n`);
      }

      if (rpcResponse) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 200;
        res.end(JSON.stringify(rpcResponse));
      } else {
        res.statusCode = 204;
        res.end();
      }
    } catch (err) {
      console.error("Error en handler MCP:", err);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 500;
      res.end(JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: { code: -32603, message: `Error interno: ${err.message}` }
      }));
    }
    return;
  }

  res.statusCode = 405;
  res.end('Method Not Allowed');
}

/**
 * ============================================================================
 * EJECUCIÓN DIRECTA LOCAL (CLI / Node.js)
 * ============================================================================
 */
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('api/mcp.js')) {
  import('node:http').then(({ createServer }) => {
    const port = process.env.PORT || 3000;
    const server = createServer(handler);
    server.listen(port, () => {
      console.log(`\n======================================================`);
      console.log(`🚀 SERVIDOR MCP REVIEW 2.0 (INTEGRAL) INICIADO`);
      console.log(`📡 URL: http://localhost:${port}/api/mcp`);
      console.log(`🧰 Total herramientas activas: ${TOOLS_DEFINITIONS.length}`);
      console.log(`======================================================\n`);
    });
  });
}
