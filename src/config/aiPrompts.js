const GENERAL_RULES = `
REGLAS GENERALES OBLIGATORIAS:
1. Eliminar siempre las fuentes y referencias, NO debe aparecer ningún marcador de cita ni referencia (ej. [1], [2], [cite:...], (Fuente), etc.).
2. No incluyas referencias internas de estilo NotebookLM como [cite:...] o similares en la respuesta.
3. El output debe limitarse a cumplir la estructura solicitada sin texto adicional ni formateos innecesarios.
`;

export const getPrompt = (basePrompt) => {
    return `${basePrompt}\n${GENERAL_RULES}`;
};

export const PROMPTS = {
    roles: getPrompt(`Actúa como DBA o Experto BIM. Genera un JSON Array para la tabla 'roles'.

COLUMNAS Y TIPOS:
- name (text, requerido): Nombre del rol (ej: Coordinador MEP, BIM Manager).
- description (text): Descripción breve de sus responsabilidades.

REGLAS CRÍTICAS:
1. El output debe ser ÚNICAMENTE el JSON Array, sin texto adicional ni bloques de markdown. Ejemplo: [{"name":"Rol","description":"Desc"}]`),

    specialties: getPrompt(`Actúa como DBA o Experto BIM. Genera un JSON Array para la tabla 'specialties'.

COLUMNAS Y TIPOS:
- name (text, requerido): Nombre de la especialidad (ej: Diseño Arquitectónico, Estructural).
- description (text): Descripción breve de la especialidad.

REGLAS CRÍTICAS:
1. El output debe ser ÚNICAMENTE el JSON Array, sin texto adicional ni bloques de markdown. Ejemplo: [{"name":"Especialidad","description":"Desc"}]`),

    protocolsStructure: getPrompt(`Eres un experto BIM Manager. Actúa como tal y genera una estructura de documentos para un nuevo proyecto.
Tu respuesta DEBE ser EXCLUSIVAMENTE un string en formato JSON válido que represente un arreglo (array) de objetos. No agregues texto antes ni después del JSON.

Cada objeto en el arreglo debe tener la siguiente estructura exacta:
{
  "title": "Nombre del documento (ej. BEP, PIR, AIR, etc.)",
  "category": "Categoría (ej. ISO 19650, Requisitos, Normativas)",
  "content": "Un resumen o plantilla básica en formato markdown para este documento (Usa \\n para saltos de línea)"
}

Genera al menos 5 documentos estándar esenciales para la gestión de la información BIM (ej. EIR, BEP Pre-contrato, BEP Post-contrato, MIDP, TIDP).`),

    esquemasMap: getPrompt(`Genera ÚNICAMENTE un objeto JSON para un mapa mental siguiendo esta estructura exacta:
{
  "name": "Nombre de la raíz",
  "children": [
    { "name": "Rama 1", "children": [...] },
    { "name": "Rama 2" }
  ]
}`),

    esquemasExpand: (nodeName) => getPrompt(`Actúa como un experto en estructuración de datos. Genera ÚNICAMENTE un objeto JSON que contenga los nodos hijos para expandir el nodo: "${nodeName}".

Estructura de salida JSON ESPERADA:
{
  "name": "Nombre del nodo padre",
  "children": [
    { "name": "Hijo 1" },
    { "name": "Hijo 2", "children": [ { "name": "Nieto 1" } ] }
  ]
}`),

    bimFolderExplorer: (nodeName, promptPath, cleanNode) => getPrompt(`Actúa como un experto en estructuración de datos y sistemas BIM.
Estoy trabajando en el siguiente nodo del esquema (VISTA ESTRUCTURA):
    
NOMBRE: ${nodeName}
ESTRUCTURA HUD: ${promptPath}
DEFINICIÓN TÉCNICA:
${JSON.stringify(cleanNode, null, 2)}

Por favor, ayúdame a entender o procesar este elemento en el CDE.`),

    bimImplementationPlanner: (dataName, hierarchy, dataStr) => getPrompt(`Actúa como un experto en estructuración de datos y sistemas BIM de clase mundial.
Estoy trabajando en la sección o elemento de la implementación BIM:
    
SECCIÓN/NODO: ${dataName}
JERARQUÍA COMPLETA: ${hierarchy}
DETALLES TÉCNICOS:
${dataStr}

Por favor, analízalo y bríndame recomendaciones para su correcta implementación en un proyecto real.`),

    deliverySchedule: getPrompt(`Actúa como un BIM Manager experto. Genera ÚNICAMENTE un arreglo JSON para importar entregables BIM a un cronograma.

ESTRUCTURA DE CADA OBJETO JSON:
- entregable_bim: (String) Nombre del archivo o modelo.
- responsable: (String) Cargo o persona responsable (ej. "ARQ_COL").
- fase: (String) Fase del proyecto, DEBE SER "EB", "AP", o "PR".
- fecha: (String) Fecha en formato YYYY-MM-DD.
- observaciones: (String) Comentario breve.
- formato: (String) Extensión del archivo (ej. ".RVT", ".PDF", ".DWG").

REGLAS CRÍTICAS:
1. Genera los entregables basados en lo que el usuario pida.
2. El output debe ser ÚNICAMENTE el JSON Array, sin texto adicional ni bloques de markdown. Ejemplo: [{"entregable_bim":"Modelo Arquitectura","responsable":"ARQ","fase":"EB","fecha":"2026-06-01","observaciones":"Preliminar","formato":".RVT"}]`),

    monthlyTasks: (contextData) => getPrompt(`Actúa como un Asistente Experto en Gestión de Proyectos. Genera ÚNICAMENTE un arreglo JSON para importar tareas a un cronograma mensual.

CONTEXTO DEL PROYECTO (BASES DE DATOS APROBADAS):

EQUIPO (STAFF) - LISTA DE IDs y NOMBRES:
${contextData.staff}

ESPACIOS / UNIDADES (SUBPROYECTOS) - LISTA DE IDs y NOMBRES:
${contextData.spaces}

ESTRUCTURA DE CADA OBJETO JSON:
- name: (String) Nombre corto de la tarea.
- description: (String) Descripción detallada de la tarea.
- fecha_inicio: (String) Fecha de inicio en formato YYYY-MM-DD.
- fecha_fin_estimada: (String) Fecha fin estimada en formato YYYY-MM-DD.
- priority: (String) Prioridad, DEBE SER "BAJA", "NORMAL", "ALTA" o "URGENTE".
- subproject_id: (String) ID del Espacio/Unidad. DEBES usar EXACTAMENTE uno de los IDs listados arriba en el contexto. Si no aplica a ningún espacio en específico, déjalo como string vacío "".
- staff_id: (String) ID del responsable. DEBES usar EXACTAMENTE uno de los IDs listados arriba en el contexto. Si no aplica a ningún miembro del equipo en específico, déjalo como string vacío "".

REGLAS CRÍTICAS:
1. Genera las tareas basándote estrictamente en la instrucción del usuario y utilizando los IDs exactos proporcionados en el contexto para asignar espacios y responsables.
2. El output debe ser ÚNICAMENTE el JSON Array, sin texto adicional ni bloques de markdown. Ejemplo: [{"name":"Excavación","description":"Excavación de cimientos","fecha_inicio":"2026-06-01","fecha_fin_estimada":"2026-06-05","priority":"ALTA","subproject_id":"UUID","staff_id":"UUID"}]`)
};
