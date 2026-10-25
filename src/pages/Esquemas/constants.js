export const INITIAL_MIND_MAP_DATA = {
  id: 'root',
  name: 'Ecosistema BIM Revit (ISO 19650) y Automatización de Procesos',
  description: 'GESTIÓN CENTRALIZADA DE ESQUEMAS Y ACCIONES REVIT',
  isRoot: true,
  children: [
    {
      id: '1',
      name: '1. AUDITORÍA Y NORMALIZACIÓN DE MUROS',
      description: 'Proceso automatizado para codificación, asignación de resistencia al fuego y despiece de albañilería en muros.',
      blockType: 'text',
      children: [
        {
          id: '1.1',
          name: 'Codificar Muros Interiores (15cm)',
          description: 'Asigna comentarios técnicos y clasificación de resistencia al fuego a muros interiores.',
          blockType: 'revit_action',
          revitAction: {
            enabled: true,
            order: 1,
            phase: 'Fase 1: Normalización',
            category: 'Walls',
            tool: 'modify_parameters',
            filter: {
              type_name: '15',
              family_name: 'Basic Wall',
              level_name: '',
              search_text: ''
            },
            element_ids: [],
            parameters: {
              Comments: 'MURO INTERIOR NORMALIZADO - ARCA BIM',
              'Fire Rating': '60 min'
            }
          },
          children: []
        },
        {
          id: '1.2',
          name: 'Convertir Muros de Ladrillo a Piezas 3D',
          description: 'Ejecuta el motor de albañilería detallada sobre muros seleccionados.',
          blockType: 'revit_action',
          revitAction: {
            enabled: true,
            order: 2,
            phase: 'Fase 2: Modelado Constructivo',
            category: 'Walls',
            tool: 'convert_walls_to_bricks',
            filter: {
              type_name: 'Ladrillo',
              family_name: '',
              level_name: 'Nivel 1',
              search_text: ''
            },
            element_ids: [],
            parameters: {
              BrickFamily: 'Ladrillo Estándar',
              MortarThicknessMm: '15',
              IncludeVerticalJoints: 'true'
            }
          },
          children: []
        }
      ]
    },
    {
      id: '2',
      name: '2. ACABADOS DE PISOS Y ESTRUCTURA',
      description: 'Secuencia de automatización para acabados cerámicos y entrepisos metálicos.',
      blockType: 'text',
      children: [
        {
          id: '2.1',
          name: 'Normalizar Pisos de Áreas Húmedas',
          description: 'Actualiza parámetros de acabado y marca técnica en suelos cerámicos.',
          blockType: 'revit_action',
          revitAction: {
            enabled: true,
            order: 3,
            phase: 'Fase 1: Normalización',
            category: 'Floors',
            tool: 'modify_parameters',
            filter: {
              type_name: 'Cerámica',
              family_name: '',
              level_name: '',
              search_text: ''
            },
            element_ids: [],
            parameters: {
              Comments: 'ACABADO ANTIDESLIZANTE VERIFICADO'
            }
          },
          children: []
        }
      ]
    },
    {
      id: '3',
      name: '3. DOCUMENTACIÓN Y ENTREGABLES (PLANOS Y TABLAS)',
      description: 'Generación y estandarización ISO 19650 de láminas y tablas de planificación.',
      blockType: 'text',
      children: [
        {
          id: '3.1',
          name: 'Estandarizar Nombres de Láminas Arquitectónicas',
          description: 'Renombra y actualiza metadatos de planos según matriz de entregables.',
          blockType: 'revit_action',
          revitAction: {
            enabled: true,
            order: 4,
            phase: 'Fase 3: Documentación',
            category: 'Sheets',
            tool: 'manage_sheets',
            filter: {
              search_text: 'A-10'
            },
            element_ids: [],
            parameters: {
              'Sheet Name': 'PLANTA ARQUITECTÓNICA GENERAL - REVISIÓN BIM',
              'Drawn By': 'ARCA REVIEW IA',
              'Approved By': 'COORDINACIÓN BIM'
            }
          },
          children: []
        },
        {
          id: '3.2',
          name: 'Crear Tabla de Cuantificación de Muros',
          description: 'Genera automáticamente una tabla de planificación en Revit con campos clave.',
          blockType: 'revit_action',
          revitAction: {
            enabled: true,
            order: 5,
            phase: 'Fase 3: Documentación',
            category: 'Schedules',
            tool: 'create_schedule',
            filter: {
              search_text: 'Walls'
            },
            element_ids: [],
            parameters: {
              ScheduleName: 'ARCA_COMPUTO_MUROS_BIM',
              TargetCategory: 'Walls',
              Fields: 'Family and Type,Base Constraint,Length,Area,Volume,Comments'
            }
          },
          children: []
        }
      ]
    }
  ]
};

export const MARKER_COLORS = [
  { name: 'yellow', value: '#fef08a' },
  { name: 'green', value: '#bbf7d0' },
  { name: 'blue', value: '#bfdbfe' },
  { name: 'pink', value: '#fbcfe8' },
  { name: 'purple', value: '#e9d5ff' }
];

export const NODE_TYPES = {
  TOOL: 'TOOL',
  DOC: 'DOC',
  FOLDER: 'FOLDER',
  RVT: '.RVT',
  RTE: '.RTE',
  RFA: '.RFA',
  DWG: '.DWG',
  PDF: '.PDF',
  WORD: '.DOC',
  MD: '.MD',
  REVIT_ACTION: 'REVIT_ACTION'
};

export const REVIT_CATEGORIES = [
  { id: 'Walls', label: 'Muros (Walls)', builtIn: 'OST_Walls', icon: '🧱', group: 'Arquitectura', sampleParams: ['Comments', 'Mark', 'Fire Rating', 'Structural Usage', 'Unconnected Height'] },
  { id: 'Floors', label: 'Pisos / Suelos (Floors)', builtIn: 'OST_Floors', icon: '🪵', group: 'Arquitectura', sampleParams: ['Comments', 'Mark', 'Height Offset From Level', 'Structural'] },
  { id: 'Doors', label: 'Puertas (Doors)', builtIn: 'OST_Doors', icon: '🚪', group: 'Arquitectura', sampleParams: ['Mark', 'Comments', 'Fire Rating', 'Sill Height', 'Head Height'] },
  { id: 'Windows', label: 'Ventanas (Windows)', builtIn: 'OST_Windows', icon: '🪟', group: 'Arquitectura', sampleParams: ['Mark', 'Comments', 'Sill Height', 'Head Height'] },
  { id: 'Rooms', label: 'Habitaciones (Rooms)', builtIn: 'OST_Rooms', icon: '🏠', group: 'Arquitectura', sampleParams: ['Name', 'Number', 'Department', 'Floor Finish', 'Wall Finish', 'Ceiling Finish', 'Comments'] },
  { id: 'Ceilings', label: 'Cielorrasos (Ceilings)', builtIn: 'OST_Ceilings', icon: '⬜', group: 'Arquitectura', sampleParams: ['Comments', 'Mark', 'Height Offset From Level'] },
  { id: 'Roofs', label: 'Cubiertas / Techos (Roofs)', builtIn: 'OST_Roofs', icon: '⛺', group: 'Arquitectura', sampleParams: ['Comments', 'Mark', 'Base Offset From Level'] },
  { id: 'StructuralColumns', label: 'Columnas Estructurales', builtIn: 'OST_StructuralColumns', icon: '🏛️', group: 'Estructura', sampleParams: ['Mark', 'Comments', 'Base Offset', 'Top Offset'] },
  { id: 'StructuralFraming', label: 'Vigas / Entrepisos (Framing)', builtIn: 'OST_StructuralFraming', icon: '🔩', group: 'Estructura', sampleParams: ['Mark', 'Comments', 'Start Level Offset', 'End Level Offset'] },
  { id: 'StructuralFoundation', label: 'Cimentaciones (Foundations)', builtIn: 'OST_StructuralFoundation', icon: '🪨', group: 'Estructura', sampleParams: ['Mark', 'Comments', 'Elevation at Bottom'] },
  { id: 'PlumbingFixtures', label: 'Aparatos Sanitarios', builtIn: 'OST_PlumbingFixtures', icon: '🚰', group: 'MEP', sampleParams: ['Mark', 'Comments', 'Elevation from Level'] },
  { id: 'PipeCurves', label: 'Tuberías (Pipes)', builtIn: 'OST_PipeCurves', icon: '🔧', group: 'MEP', sampleParams: ['Comments', 'Mark', 'Diameter', 'System Type'] },
  { id: 'DuctCurves', label: 'Ductos HVAC (Ducts)', builtIn: 'OST_DuctCurves', icon: '🌬️', group: 'MEP', sampleParams: ['Comments', 'Mark', 'System Classification'] },
  { id: 'ElectricalEquipment', label: 'Equipos Eléctricos', builtIn: 'OST_ElectricalEquipment', icon: '⚡', group: 'MEP', sampleParams: ['Mark', 'Comments', 'Panel Name', 'Voltage'] },
  { id: 'LightingFixtures', label: 'Luminarias (Lighting)', builtIn: 'OST_LightingFixtures', icon: '💡', group: 'MEP', sampleParams: ['Mark', 'Comments', 'Elevation from Level'] },
  { id: 'Furniture', label: 'Mobiliario (Furniture)', builtIn: 'OST_Furniture', icon: '🪑', group: 'Arquitectura', sampleParams: ['Mark', 'Comments'] },
  { id: 'GenericModel', label: 'Modelos Genéricos (Ladrillos/Piezas)', builtIn: 'OST_GenericModel', icon: '📦', group: 'Constructivo', sampleParams: ['Mark', 'Comments'] },
  { id: 'Sheets', label: 'Láminas / Planos (Sheets)', builtIn: 'OST_Sheets', icon: '📐', group: 'Documentación', sampleParams: ['Sheet Name', 'Sheet Number', 'Drawn By', 'Checked By', 'Approved By', 'Issue Date'] },
  { id: 'Views', label: 'Vistas (Views)', builtIn: 'OST_Views', icon: '👁️', group: 'Documentación', sampleParams: ['View Name', 'Title on Sheet', 'View Scale', 'Comments'] },
  { id: 'Schedules', label: 'Tablas de Planificación (Schedules)', builtIn: 'OST_Schedules', icon: '📊', group: 'Documentación', sampleParams: ['ScheduleName', 'TargetCategory', 'Fields'] },
  { id: 'Materials', label: 'Materiales (Materials)', builtIn: 'OST_Materials', icon: '🎨', group: 'Materialidad', sampleParams: ['MaterialName', 'ColorHex', 'Comments', 'Mark'] }
];

export const REVIT_TOOLS = [
  {
    id: 'modify_parameters',
    label: 'Modificar Parámetros (Masivo / Filtro)',
    shortLabel: 'MOD_PARAMS',
    icon: '✏️',
    color: '#0f4369',
    description: 'Busca elementos por Categoría y Filtros (Tipo, Familia, Nivel, Texto o IDs) y escribe valores en sus parámetros de instancia o tipo.',
    defaultParameters: { Comments: 'ACTUALIZADO POR ESQUEMA BIM' }
  },
  {
    id: 'assign_type',
    label: 'Cambiar / Asignar Tipo de Familia',
    shortLabel: 'CHANGE_TYPE',
    icon: '🔄',
    color: '#0284c7',
    description: 'Cambia el ElementType (FamilySymbol / WallType / FloorType) de los elementos filtrados al tipo indicado en TargetTypeName.',
    defaultParameters: { TargetTypeName: 'Nombre del Nuevo Tipo' }
  },
  {
    id: 'manage_sheets',
    label: 'Gestionar / Crear Láminas (Sheets)',
    shortLabel: 'SHEETS',
    icon: '📐',
    color: '#059669',
    description: 'Renombra, renumera, actualiza metadatos o crea nuevas láminas (Sheets) en el documento activo de Revit.',
    defaultParameters: { 'Sheet Name': 'NUEVO NOMBRE DE PLANO', 'Drawn By': 'ARCA BIM' }
  },
  {
    id: 'create_schedule',
    label: 'Crear Tabla de Planificación (Schedule)',
    shortLabel: 'SCHEDULE',
    icon: '📊',
    color: '#7c3aed',
    description: 'Crea una nueva tabla de planificación (ViewSchedule) para la categoría indicada y añade automáticamente los campos especificados.',
    defaultParameters: {
      ScheduleName: 'ARCA_TABLA_CUANTIFICACION',
      TargetCategory: 'Walls',
      Fields: 'Family and Type,Length,Area,Volume,Comments'
    }
  },
  {
    id: 'sync_materials',
    label: 'Crear / Aplicar Material BIM',
    shortLabel: 'MATERIAL',
    icon: '🎨',
    color: '#d97706',
    description: 'Crea o actualiza un material en Revit con su color RGB/Hex y opcionalmente lo asigna a los elementos filtrados.',
    defaultParameters: {
      MaterialName: 'ARCA_Concreto_Expuesto',
      ColorHex: '#94A3B8',
      ApplyToElements: 'true'
    }
  },
  {
    id: 'convert_walls_to_bricks',
    label: 'Modelador: Muros a Ladrillos 3D',
    shortLabel: 'BRICK_GEN',
    icon: '🧱',
    color: '#dc2626',
    description: 'Activa el motor constructivo de Review para despiezar muros en familias de ladrillos 3D, mortero de pega y juntas.',
    defaultParameters: {
      BrickFamily: 'Ladrillo Estándar',
      MortarThicknessMm: '15',
      IncludeVerticalJoints: 'true'
    }
  },
  {
    id: 'convert_floors_to_tiles',
    label: 'Modelador: Pisos a Baldosas 3D',
    shortLabel: 'TILE_GEN',
    icon: '🪵',
    color: '#b45309',
    description: 'Activa el generador constructivo de piezas y baldosas 3D sobre los pisos seleccionados o filtrados.',
    defaultParameters: {
      TileWidthMm: '600',
      TileLengthMm: '600',
      JointMm: '3'
    }
  },
  {
    id: 'convert_steel_deck',
    label: 'Modelador: Entrepiso Steel Deck',
    shortLabel: 'STEEL_DECK',
    icon: '🔩',
    color: '#334155',
    description: 'Configura y ejecuta el despiece de lámina colaborante Steel Deck sobre losas o sistemas de vigas.',
    defaultParameters: {
      DeckProfile: '2 Pulgadas',
      ConcreteToppingMm: '60'
    }
  },
  {
    id: 'audit_qaqc',
    label: 'Auditoría QA/QC de Parámetros',
    shortLabel: 'QAQC_AUDIT',
    icon: '🛡️',
    color: '#be123c',
    description: 'Verifica que los elementos de la categoría cumplan con los parámetros obligatorios del BEP / ISO 19650 y marca hallazgos.',
    defaultParameters: {
      RequiredParameters: 'Comments,Mark',
      StampOnPass: 'QAQC_APROBADO',
      StampOnFail: 'QAQC_INCOMPLETO'
    }
  }
];

export const DEFAULT_REVIT_ACTION = {
  enabled: true,
  order: 1,
  phase: 'Fase 1: Ejecución BIM',
  category: 'Walls',
  tool: 'modify_parameters',
  filter: {
    type_name: '',
    family_name: '',
    level_name: '',
    search_text: ''
  },
  element_ids: [],
  parameters: {
    Comments: 'ACTUALIZADO DESDE ESQUEMA ARCA REVIEW'
  }
};
