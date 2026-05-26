export const INITIAL_MIND_MAP_DATA = {
  id: 'root',
  name: 'Ecosistema BIM Revit (ISO 19650) y Disciplina MEP',
  description: 'GESTIÓN CENTRALIZADA ISO 19650',
  isRoot: true,
  children: [
    {
      id: '1',
      name: '1. ESTRATEGIA Y GESTIÓN BIM',
      description: 'Marco procedimental y contractual que asegura que las personas correctas trabajen con la información correcta en el momento oportuno.',
      children: [
        {
          id: '1.1',
          name: 'Requisitos de Información',
          description: 'Especifican para qué, cuándo, cómo y para quién se produce la información del proyecto.',
          children: [
            { id: '1.1.1', name: 'OIR / PIR / AIR', description: 'Definen las necesidades a nivel organizacional y del activo.' },
            { id: '1.1.2', name: 'EIR (Req. de Intercambio)', description: 'Qué información debe entregarse en cada hito por contrato.' },
            { id: '1.1.3', name: 'LOIN', description: 'Nivel de Necesidad de Información geométrica y alfanumérica.' }
          ]
        },
        {
          id: '1.2',
          name: 'Entorno de Datos Común (CDE)',
          description: 'Solución tecnológica y flujo de trabajo que gestiona la recopilación y difusión de la información.',
          children: [
            { id: '1.2.1', name: 'WIP (S0)', description: 'Trabajo en curso: Información aislada, ineditable para los demás.' },
            { id: '1.2.2', name: 'Compartido (S1)', description: 'Información aprobada internamente para coordinación y revisión.' },
            { id: '1.2.3', name: 'Publicado (A1)', description: 'Entregable contractual de solo lectura validado.' },
            { id: '1.2.4', name: 'Archivado', description: 'Registro histórico inmutable utilizado para auditorías.' }
          ]
        },
        {
          id: '1.3',
          name: 'Control de Calidad (QA/QC)',
          description: 'Mecanismos para prevenir errores antes de compartir modelos fallidos.',
          children: [
            { id: '1.3.1', name: 'Auditorías y Purgado', description: 'Revisiones sistemáticas para eliminar información duplicada.' }
          ]
        }
      ]
    },
    {
      id: '2',
      name: '2. BIBLIOTECA DE FAMILIAS',
      description: 'Gestión de los activos digitales paramétricos que componen el modelo geométrico.',
      children: [
        {
          id: '2.1',
          name: 'Tipologías de Archivos',
          description: 'Estrategia híbrida según comportamiento en software.',
          children: [
            { id: '2.1.1', name: 'Familias Cargables (.rfa)', description: 'Elementos manufacturados discretos independientes (equipos).' },
            { id: '2.1.2', name: 'Archivos Contenedores (.rvt)', description: 'Recopilatorios para familias de sistema (muros, suelos).' }
          ]
        },
        {
          id: '2.2',
          name: 'Nomenclatura (Naming)',
          description: 'Reglas estrictas para nombrar archivos de forma consistente y evitar redundancias.'
        },
        {
          id: '2.3',
          name: 'Reglas de Modelado',
          description: 'Prácticas minimalistas para proteger el rendimiento computacional del proyecto global.',
          children: [
            { id: '2.3.1', name: 'Reglas de carga geométrica', description: 'Minimizar extrusiones complejas, emplear usar símbolos 2D.' }
          ]
        }
      ]
    },
    {
      id: '3',
      name: '3. REVIT MEP',
      description: 'Disciplina técnica que modela instalaciones y se coordina obligatoriamente en el CDE.',
      children: [
        {
          id: '3.1',
          name: 'Mecánica (HVAC)',
          description: 'Sistemas de calefacción, ventilación y A/C para habitabilidad.',
          children: [
            { id: '3.1.1', name: 'Equipos y Terminales', description: 'Colocación de Manejadoras de Aire (AHU) y difusores en espacios.' },
            { id: '3.1.2', name: 'Red de Ductos', description: 'Trazado usando ductos rígidos y uniones flexibles para sortear vigas.' }
          ]
        },
        {
          id: '3.2',
          name: 'Plomería y Contra Incendios',
          description: 'Sistemas de gestión de fluidos por gravedad y bombeo.',
          children: [
            { id: '3.2.1', name: 'Equipamiento Sanitario', description: 'Ubicación precisa de Bombas, inodoros, calefones.' },
            { id: '3.2.2', name: 'Sistemas Lógicos', description: 'Generación de redes cerradas para calcular pérdidas de presión reales.' }
          ]
        },
        {
          id: '3.3',
          name: 'Eléctrica',
          description: 'Redes de suministro de energía de alto y bajo voltaje.',
          children: [
            { id: '3.3.1', name: 'Rutas Eléctricas', description: 'Conexión lógica de luminarias a paneles mediante circuitos.' }
          ]
        },
        {
          id: '3.4',
          name: 'Configuración Avanzada',
          description: 'Uso intensivo de parámetros compartidos.',
          children: [
            { id: '3.4.1', name: 'Conectores Paramétricos', description: 'Elementos que inyectan datos físicos (caída, voltaje) a la red general.' }
          ]
        }
      ]
    },
    {
      id: '4',
      name: '4. DOCUMENTACIÓN Y ENTREGABLES',
      description: 'Productos finales derivados bidireccionalmente de la base de datos central.',
      children: [
        {
          id: '4.1',
          name: 'Tablas de Planificación',
          description: 'Extracción automatizada de cuantificaciones de materiales e insumos.'
        },
        {
          id: '4.2',
          name: 'Planos e Isométricos',
          description: 'Generación de Vistas 2D y 3D detalladas con anotaciones analíticas nativas.'
        },
        {
          id: '4.3',
          name: 'Entrega del PIM',
          description: 'Emisión del Modelo validado y libre de interferencias entregado al cliente final.'
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
  RFA: '.RFA',
  DWG: '.DWG',
  PDF: '.PDF',
  WORD: '.DOC',
  MD: '.MD'
};
