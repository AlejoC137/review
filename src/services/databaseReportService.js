import { supabase } from './supabaseClient';

export const TABLE_METADATA = {
  projects: {
    displayName: 'projects (Proyectos)',
    chapter: '1. Datos del Proyecto',
    description: 'Tabla principal de proyectos registrados en la plataforma.',
    filterColumn: 'id'
  },
  project_general_info: {
    displayName: 'project_general_info (Información General)',
    chapter: '1. Datos del Proyecto',
    description: 'Información general de áreas, normatividad, usos BIM e indicadores del proyecto.',
    filterColumn: 'project_id'
  },
  project_objectives: {
    displayName: 'project_objectives (Objetivos del Proyecto)',
    chapter: '1. Datos del Proyecto',
    description: 'Objetivos específicos y prioridades del proyecto.',
    filterColumn: 'project_id'
  },
  project_bim_uses: {
    displayName: 'project_bim_uses (Usos BIM del Proyecto)',
    chapter: '1. Datos del Proyecto',
    description: 'Listado de usos BIM aplicados, clasificados por prioridad.',
    filterColumn: 'project_id'
  },
  project_software: {
    displayName: 'project_software (Software de Proyecto)',
    chapter: '1. Datos del Proyecto',
    description: 'Software y herramientas de autoría asignados con versiones y propósitos.',
    filterColumn: 'project_id'
  },
  subProjects: {
    displayName: 'subProjects (Fases / Sub-Proyectos)',
    chapter: '2. Sub Proyectos / Unidades',
    description: 'Sub-proyectos principales o bloques de construcción definidos.',
    filterColumn: null
  },
  project_units: {
    displayName: 'project_units (Unidades de Proyecto)',
    chapter: '2. Sub Proyectos / Unidades',
    description: 'Relación de unidades específicas del proyecto con áreas y estados.',
    filterColumn: 'project_id'
  },
  Espacio_Elemento: {
    displayName: 'Espacio_Elemento (Plantillas y Espacios)',
    chapter: '2. Sub Proyectos / Unidades',
    description: 'Registro detallado de pisos, espacios y componentes constructivos asociados.',
    filterColumn: 'subProject_id'
  },
  Componentes: {
    displayName: 'Componentes (Librería de Componentes)',
    chapter: '2. Sub Proyectos / Unidades',
    description: 'Librería maestra de tipos de elementos y componentes constructivos.',
    filterColumn: null
  },
  bep_team: {
    displayName: 'bep_team (Equipo BEP)',
    chapter: '3. Equipo y Roles',
    description: 'Integrantes del equipo BIM (roles, compañías y datos de contacto).',
    filterColumn: 'project_id'
  },
  roles: {
    displayName: 'roles (Catálogo de Roles)',
    chapter: '3. Equipo y Roles',
    description: 'Catálogo de roles y permisos definidos para los proyectos.',
    filterColumn: null
  },
  specialties: {
    displayName: 'specialties (Especialidades)',
    chapter: '3. Equipo y Roles',
    description: 'Especialidades técnicas de ingeniería y arquitectura.',
    filterColumn: null
  },
  staff: {
    displayName: 'staff (Personal / Staff)',
    chapter: '3. Equipo y Roles',
    description: 'Registro completo de personal interno disponible.',
    filterColumn: null
  },
  directory_contacts: {
    displayName: 'directory_contacts (Directorio Externo)',
    chapter: '3. Equipo y Roles',
    description: 'Contactos y proveedores externos asociados al proyecto.',
    filterColumn: 'project_id'
  },
  information_requirements: {
    displayName: 'information_requirements (Requisitos de Información)',
    chapter: '4. Requisitos de Información',
    description: 'Requisitos de información organizacional (OIR) y de proyecto (PIR).',
    filterColumn: 'project_id'
  },
  project_element_lod_tdi: {
    displayName: 'project_element_lod_tdi (Matriz LOD/TDI)',
    chapter: '5. Matriz de Entregables (LOD/TDI)',
    description: 'Nivel de Desarrollo (LOD) e Información (TDI) requerida por disciplina y elemento.',
    filterColumn: 'project_id'
  },
  resources: {
    displayName: 'resources (Recursos y Protocolos)',
    chapter: '6. Protocolos y Documentos',
    description: 'Protocolos, manuales, guías y documentos adjuntos vinculados.',
    filterColumn: 'project_id'
  },
  Materiales: {
    displayName: 'Materiales (Base de Datos de Materiales)',
    chapter: '7. Materiales',
    description: 'Base de datos maestra de especificaciones de materiales y costos.',
    filterColumn: null
  },
  tasks: {
    displayName: 'tasks (Tareas y Calendario)',
    chapter: '8. Tareas y Cronograma',
    description: 'Plan de trabajo operativo con estados, responsables y fechas de ejecución.',
    filterColumn: 'project_id'
  },
  actions: {
    displayName: 'actions (Sub-Tareas / Acciones)',
    chapter: '8. Tareas y Cronograma',
    description: 'Acciones de control y listas de verificación internas.',
    filterColumn: null
  },
  incidents: {
    displayName: 'incidents (Llamados e Incidentes)',
    chapter: '8. Tareas y Cronograma',
    description: 'Centro de llamados, incidencias técnicas y control en obra.',
    filterColumn: 'project_id'
  },
  esquemas: {
    displayName: 'esquemas (Esquemas Base BIM)',
    chapter: '9. Esquemas y Planes',
    description: 'Ecosistemas o esquemas conceptuales base definidos.',
    filterColumn: null
  },
  bim_plans: {
    displayName: 'bim_plans (Planes de Implementación)',
    chapter: '9. Esquemas y Planes',
    description: 'Instancias y planes de implementación BIM organizados.',
    filterColumn: null
  },
  lifecycles: {
    displayName: 'lifecycles (Ciclos de Vida)',
    chapter: '10. Gestión de Ciclo de Vida',
    description: 'Estructuras de fases del ciclo de vida general del proyecto.',
    filterColumn: null
  },
  lifecycle_stages: {
    displayName: 'lifecycle_stages (Etapas de Ciclo)',
    chapter: '10. Gestión de Ciclo de Vida',
    description: 'Etapas ordenadas asociadas a cada ciclo de vida.',
    filterColumn: null
  },
  activities: {
    displayName: 'activities (Actividades de Ciclo)',
    chapter: '10. Gestión de Ciclo de Vida',
    description: 'Actividades de control del ciclo de vida programadas en el Gantt.',
    filterColumn: 'project_id'
  },
  project_delivery_schedule: {
    displayName: 'project_delivery_schedule (Cronograma de Entregas)',
    chapter: '11. Cronograma de Entregas',
    description: 'Cronograma y planificación de entregables BIM.',
    filterColumn: 'project_id'
  }
};

export const KNOWN_EXISTING_TABLES = [
  'projects',
  'project_general_info',
  'project_objectives',
  'project_bim_uses',
  'project_software',
  'subProjects',
  'project_units',
  'Espacio_Elemento',
  // 'Componentes' — tabla reemplazada por project_element_lod_tdi; no existe en Supabase
  'bep_team',
  'roles',
  'specialties',
  'staff',
  'directory_contacts',
  'information_requirements',
  'project_element_lod_tdi',
  'resources',
  'Materiales',
  'tasks',
  'actions',
  'incidents',
  'esquemas',
  'bim_plans',
  'lifecycles',
  'lifecycle_stages',
  'project_delivery_schedule'
];

export const databaseReportService = {
  /**
   * Retorna las tablas que están mapeadas en TABLE_METADATA y que existen en la base de datos.
   * Usamos una lista estática (KNOWN_EXISTING_TABLES) para evitar realizar peticiones HTTP
   * a tablas inexistentes (como 'activities'), lo cual previene que el navegador registre
   * molestos errores 404 / 401 en la consola.
   */
  async getAvailableTables() {
    const tableKeys = Object.keys(TABLE_METADATA);
    return tableKeys.filter(key => KNOWN_EXISTING_TABLES.includes(key));
  },

  /**
   * Obtiene los registros de una tabla específica, filtrando por ID de proyecto
   * si la tabla lo requiere y cuenta con la columna correspondiente.
   */
  async getTableData(tableName, projectId = null) {
    const meta = TABLE_METADATA[tableName];
    if (!meta) throw new Error(`Tabla ${tableName} no mapeada.`);

    let query = supabase.from(tableName).select('*');

    // Aplicar filtros específicos de proyecto
    if (projectId) {
      if (meta.filterColumn) {
        query = query.eq(meta.filterColumn, projectId);
      } else if (tableName === 'Espacio_Elemento') {
        // Para espacios, primero obtenemos los subproyectos del proyecto para filtrar
        const { data: subProjs } = await supabase
          .from('subProjects')
          .select('id');
        
        // Si hay subproyectos, filtramos los espacios que pertenezcan a ellos
        if (subProjs && subProjs.length > 0) {
          const subProjIds = subProjs.map(sp => sp.id);
          query = query.in('subProject_id', subProjIds);
        } else {
          // Si no hay subproyectos, devolvemos vacío o no aplicamos filtro
          query = query.is('subProject_id', null);
        }
      } else if (tableName === 'actions') {
        // Para sub-tareas, primero obtenemos las tareas de ese proyecto
        const { data: projTasks } = await supabase
          .from('tasks')
          .select('id')
          .eq('project_id', projectId);
        
        if (projTasks && projTasks.length > 0) {
          const taskIds = projTasks.map(t => t.id);
          query = query.in('task_id', taskIds);
        } else {
          return [];
        }
      }
    }

    // Ordenamiento por defecto según la tabla para mejorar legibilidad
    if (tableName === 'Materiales') {
      query = query.order('Nombre', { ascending: true });
    } else if (tableName === 'projects' || tableName === 'subProjects' || tableName === 'esquemas') {
      query = query.order('name', { ascending: true });
    } else if (tableName === 'tasks') {
      query = query.order('created_at', { ascending: true });
    }

    const { data, error } = await query;
    if (error) {
      console.warn(`Error al consultar tabla ${tableName}:`, error.message);
      throw error;
    }
    return data || [];
  }
};
