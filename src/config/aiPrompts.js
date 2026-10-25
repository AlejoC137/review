import { generateRevitSchemaAiPrompt } from '../pages/Esquemas/schemaAiPrompt';

/**
 * Prompts de Inteligencia Artificial para la generación de Esquemas Interactivos y Acciones de Revit
 */
export const GENERATE_SCHEMA_AI_PROMPT = (nodeName, rootName = 'Proyecto BIM General', mapData = null) => {
  return generateRevitSchemaAiPrompt({
    mapData: mapData || { name: rootName, children: [] },
    targetNode: nodeName ? { id: 'target', name: nodeName } : null,
    customTopic: nodeName || rootName
  });
};
