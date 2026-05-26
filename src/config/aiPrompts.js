const GENERAL_RULES = `
REGLAS GENERALES OBLIGATORIAS:
1. Eliminar siempre las fuentes, NO deben aparecer referencias a fuentes (ej. [1], [2], etc.).
2. El output debe limitarse a cumplir la estructura solicitada sin texto adicional ni formateos innecesarios.
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

Por favor, analízalo y bríndame recomendaciones para su correcta implementación en un proyecto real.`)
};
