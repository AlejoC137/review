import { REVIT_CATEGORIES, REVIT_TOOLS } from './constants';

/**
 * Extracts and parses a JSON object or array from an AI response string,
 * handling markdown code fences or surrounding conversational text.
 */
export const extractJsonFromText = (rawText) => {
  if (!rawText || typeof rawText !== 'string') {
    throw new Error('El texto JSON está vacío.');
  }

  let text = rawText.trim();

  // 1. Strip markdown code block fences if present
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (codeBlockMatch && codeBlockMatch[1]) {
    text = codeBlockMatch[1].trim();
  }

  // 2. Try direct parse first
  try {
    return JSON.parse(text);
  } catch (_) {
    // 3. Fallback: extract between first { or [ and last } or ]
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    let startIdx = -1;
    let endIdx = -1;

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endIdx = text.lastIndexOf('}');
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endIdx = text.lastIndexOf(']');
    }

    if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
      const candidate = text.substring(startIdx, endIdx + 1);
      return JSON.parse(candidate);
    }

    throw new Error('No se encontró un bloque JSON válido ({ ... } o [ ... ]).');
  }
};

/**
 * Normalizes any incoming JSON payload (either a MindMap tree with `children`,
 * a `{ process_name, actions: [...] }` object, or a flat array of Revit actions `[...]`)
 * into a valid Esquemas tree or branch structure with `revitAction` payloads.
 */
export const normalizeImportedRevitJson = (jsonData, fallbackTitle = 'Proceso BIM Revit') => {
  if (!jsonData) return null;

  // Case 1: Array of flat Revit actions -> wrap into a root/branch node with children
  if (Array.isArray(jsonData)) {
    // Check if items look like Revit actions or schema nodes
    const children = jsonData.map((item, idx) => convertActionOrNodeToSchemaNode(item, idx + 1));
    return {
      name: fallbackTitle,
      description: `Secuencia de ${children.length} acciones de Revit importadas por JSON.`,
      blockType: 'text',
      children
    };
  }

  // Case 2: Object with `actions` or `steps` array (Direct AI Action Queue format)
  if (typeof jsonData === 'object' && (Array.isArray(jsonData.actions) || Array.isArray(jsonData.steps))) {
    const rawList = jsonData.actions || jsonData.steps;
    const phasesMap = new Map();

    rawList.forEach((act, idx) => {
      const phaseName = act.phase || act.process || act.group || '';
      const nodeItem = convertActionOrNodeToSchemaNode(act, idx + 1);
      if (phaseName) {
        if (!phasesMap.has(phaseName)) {
          phasesMap.set(phaseName, []);
        }
        phasesMap.get(phaseName).push(nodeItem);
      } else {
        if (!phasesMap.has('__direct__')) {
          phasesMap.set('__direct__', []);
        }
        phasesMap.get('__direct__').push(nodeItem);
      }
    });

    let children = [];
    if (phasesMap.size === 1 && phasesMap.has('__direct__')) {
      children = phasesMap.get('__direct__');
    } else {
      let phaseIdx = 1;
      for (const [phaseKey, nodes] of phasesMap.entries()) {
        if (phaseKey === '__direct__') {
          children.push(...nodes);
        } else {
          children.push({
            id: `phase_${Date.now()}_${phaseIdx++}`,
            name: phaseKey,
            description: `Fase del proceso con ${nodes.length} acción(es) de Revit.`,
            blockType: 'text',
            children: nodes
          });
        }
      }
    }

    return {
      name: jsonData.process_name || jsonData.name || jsonData.title || fallbackTitle,
      description: jsonData.description || `Proceso automatizado de Revit con ${rawList.length} acciones configuradas.`,
      blockType: 'text',
      children
    };
  }

  // Case 3: Standard or Revit-enriched Schema Tree (`name`, `children`, etc.)
  if (typeof jsonData === 'object') {
    return enrichSchemaNodeWithRevitLayer(jsonData, 1);
  }

  return jsonData;
};

const convertActionOrNodeToSchemaNode = (item, defaultOrder = 1) => {
  if (!item || typeof item !== 'object') {
    return {
      name: String(item || 'Nodo'),
      description: '',
      blockType: 'text',
      children: []
    };
  }

  // If it already has `revitAction` or `action`/`tool` + `category`/`parameters`
  const hasRevitFields =
    item.revitAction ||
    item.action ||
    item.tool ||
    (item.category && (item.parameters || item.filter));

  if (hasRevitFields) {
    const rawRevit = item.revitAction || item;
    const toolId = rawRevit.tool || rawRevit.action || 'modify_parameters';
    const categoryId = rawRevit.category || 'Walls';
    const filterObj = rawRevit.filter || {};

    return {
      id: item.id || undefined,
      name: item.name || item.title || item.step_name || `${toolId.toUpperCase()} → ${categoryId}`,
      description: item.description || item.notes || `Acción Revit [${toolId}] sobre categoría ${categoryId}`,
      blockType: 'revit_action',
      bgColor: item.bgColor || '#e0f2fe',
      revitAction: {
        enabled: rawRevit.enabled !== false,
        order: Number(rawRevit.order || defaultOrder),
        phase: rawRevit.phase || item.phase || 'Fase 1: Ejecución BIM',
        category: categoryId,
        tool: toolId,
        filter: {
          type_name: filterObj.type_name || '',
          family_name: filterObj.family_name || '',
          level_name: filterObj.level_name || '',
          search_text: filterObj.search_text || ''
        },
        element_ids: Array.isArray(rawRevit.element_ids) ? rawRevit.element_ids : [],
        parameters: rawRevit.parameters && typeof rawRevit.parameters === 'object' ? { ...rawRevit.parameters } : {}
      },
      children: Array.isArray(item.children)
        ? item.children.map((ch, i) => enrichSchemaNodeWithRevitLayer(ch, defaultOrder * 10 + i + 1))
        : []
    };
  }

  return enrichSchemaNodeWithRevitLayer(item, defaultOrder);
};

const enrichSchemaNodeWithRevitLayer = (node, orderCounter = 1) => {
  if (!node || typeof node !== 'object') return node;

  const hasRevit =
    node.blockType === 'revit_action' ||
    node.revitAction ||
    node.action ||
    node.tool;

  const normalized = {
    ...node,
    name: node.name || node.title || 'Nodo sin título',
    description: node.description ?? '',
    blockType: hasRevit ? 'revit_action' : (node.blockType || (node.description ? 'text' : 'unselected'))
  };

  if (hasRevit) {
    const rawRevit = node.revitAction || node;
    const filterObj = rawRevit.filter || {};
    normalized.revitAction = {
      enabled: rawRevit.enabled !== false,
      order: Number(rawRevit.order || orderCounter),
      phase: rawRevit.phase || 'Fase 1: Ejecución BIM',
      category: rawRevit.category || 'Walls',
      tool: rawRevit.tool || rawRevit.action || 'modify_parameters',
      filter: {
        type_name: filterObj.type_name || '',
        family_name: filterObj.family_name || '',
        level_name: filterObj.level_name || '',
        search_text: filterObj.search_text || ''
      },
      element_ids: Array.isArray(rawRevit.element_ids) ? rawRevit.element_ids : [],
      parameters: rawRevit.parameters && typeof rawRevit.parameters === 'object' ? { ...rawRevit.parameters } : {}
    };
  }

  if (Array.isArray(node.children)) {
    normalized.children = node.children.map((child, idx) =>
      enrichSchemaNodeWithRevitLayer(child, orderCounter + idx + 1)
    );
  } else if (Array.isArray(node.actions)) {
    normalized.children = node.actions.map((act, idx) =>
      convertActionOrNodeToSchemaNode(act, orderCounter + idx + 1)
    );
  } else {
    normalized.children = [];
  }

  return normalized;
};

/**
 * Extracts a clean, readable outline of the entire schema tree so the AI
 * knows the full context, hierarchy, and existing content of the map.
 */
const serializeTreeContext = (node, depth = 0, targetId = null) => {
  if (!node) return '';
  const indent = '  '.repeat(depth);
  const isTarget = targetId && String(node.id) === String(targetId);
  const marker = isTarget ? ' 🎯 [NODO OBJETIVO SELECCIONADO]' : '';
  const desc = (node.description || '').trim();
  const shortDesc = desc
    ? ` — "${desc.length > 140 ? desc.substring(0, 140) + '...' : desc}"`
    : '';

  let revitTag = '';
  if (node.revitAction || node.blockType === 'revit_action') {
    const ra = node.revitAction || {};
    revitTag = ` ⚡[REVIT: tool=${ra.tool || 'modify_parameters'}, category=${ra.category || 'Walls'}, params=${JSON.stringify(ra.parameters || {})}]`;
  }

  let line = `${indent}- ${node.name || 'Sin título'}${marker}${revitTag}${shortDesc}\n`;

  if (Array.isArray(node.children) && node.children.length > 0) {
    node.children.forEach((child) => {
      line += serializeTreeContext(child, depth + 1, targetId);
    });
  }
  return line;
};

/**
 * Finds the breadcrumb path from the root to a specific node ID.
 */
const findNodePath = (root, targetId, currentPath = []) => {
  if (!root) return null;
  const nextPath = [...currentPath, root.name || 'Sin título'];
  if (String(root.id) === String(targetId)) return nextPath;

  if (Array.isArray(root.children)) {
    for (const child of root.children) {
      const found = findNodePath(child, targetId, nextPath);
      if (found) return found;
    }
  }
  return null;
};

/**
 * Generates the specialized REVIT LAYER + MARKDOWN SCHEMA AI PROMPT.
 * This prompt teaches any LLM how to construct hierarchical mind-map schemas
 * where processes, branches, and leaf nodes contain executable Revit actions
 * based on Revit categories and ARCA Review tools.
 */
export const generateRevitSchemaAiPrompt = ({
  mapData,
  targetNode = null,
  customTopic = ''
} = {}) => {
  const fullOutline = mapData ? serializeTreeContext(mapData, 0, targetNode?.id) : '';
  const pathArray = (mapData && targetNode) ? (findNodePath(mapData, targetNode.id) || [targetNode.name]) : [];
  const breadcrumb = pathArray.join(' > ');

  const categoriesCatalog = REVIT_CATEGORIES.map(
    (c) => `  - "${c.id}" (${c.label}) -> Parámetros típicos: ${c.sampleParams.join(', ')}`
  ).join('\n');

  const toolsCatalog = REVIT_TOOLS.map(
    (t) => `  - "${t.id}" (${t.label}): ${t.description} | Ejemplo params: ${JSON.stringify(t.defaultParameters)}`
  ).join('\n');

  const contextSection = mapData
    ? `====================================================================
1. CONTEXTO ACTUAL DEL ESQUEMA BIM EN ARCA REVIEW
====================================================================
- TÍTULO DEL ESQUEMA RAÍZ: "${mapData.name || 'Esquema General BIM'}"
${targetNode ? `- RUTA JERÁRQUICA DEL NODO SELECCIONADO: ${breadcrumb}\n- NODO OBJETIVO: "${targetNode.name}"` : ''}

ESTRUCTURA ACTUAL DEL MAPA (Para mantener coherencia y secuencia lógica):
${fullOutline}
`
    : '';

  return `Actúa como un Director BIM Senior (ISO 19650), Arquitecto de Automatización en Autodesk Revit API y Especialista en Esquemas de Procesos de ARCA Review.

Tu objetivo es construir un **Esquema Jerárquico Visual (estilo MindMap Markdown)** enriquecido con una **Capa Ejecutable de Acciones de Revit (Revit Action Layer)** que podrá:
1. Visualizarse y editarse como un mapa de nodos y cables en el lienzo de **Esquemas de ARCA Review**.
2. Organizarse por fases, ramas, categorías y secuencia en la **Pestaña de Acciones Revit**.
3. Enviarse e inyectarse directamente en el **Receptor del Plugin de Revit (ARCA Review PlugIn)** para simular y ejecutar las acciones automáticamente sobre el modelo \`.rvt\`.

${contextSection}
====================================================================
2. CATÁLOGO DE CATEGORÍAS DE REVIT SOPORTADAS (\`category\`)
====================================================================
Usa exactamente uno de estos identificadores en el campo \`revitAction.category\`:
${categoriesCatalog}

====================================================================
3. CATÁLOGO DE HERRAMIENTAS Y ACCIONES DE REVIT (\`tool\`)
====================================================================
Usa exactamente uno de estos identificadores en el campo \`revitAction.tool\`:
${toolsCatalog}

====================================================================
4. FORMATO JSON OBLIGATORIO (ESQUEMA + CAPA DE ACCIONES REVIT)
====================================================================
- Responde **ÚNICAMENTE** con un bloque JSON válido (\`{ ... }\`). No incluyas texto fuera del JSON.
- Los nodos intermedios (Fases, Procesos o Disciplinas) usan \`"blockType": "text"\` para explicar el protocolo técnico.
- Los nodos ejecutables (Acciones o Pasos de Revit) usan \`"blockType": "revit_action"\` e incluyen el objeto \`"revitAction"\` con toda la configuración paramétrica y de filtrado para que el Plugin de Revit lo ejecute.

\`\`\`json
{
  "name": "${targetNode ? targetNode.name : (customTopic || 'Proceso Automatizado BIM en Revit')}",
  "description": "Descripción ejecutiva del proceso o flujo de trabajo BIM en Revit.",
  "blockType": "text",
  "bgColor": "#ffffff",
  "children": [
    {
      "name": "FASE 1: AUDITORÍA Y CODIFICACIÓN PARAMÉTRICA",
      "description": "Normalización de parámetros según estándar ISO 19650 y matriz LOIN.",
      "blockType": "text",
      "bgColor": "#f1f5f9",
      "children": [
        {
          "name": "Codificar Muros Estructurales e Interiores",
          "description": "Asigna clasificación de resistencia al fuego y comentario técnico a muros filtrados.",
          "blockType": "revit_action",
          "bgColor": "#e0f2fe",
          "revitAction": {
            "enabled": true,
            "order": 1,
            "phase": "Fase 1: Normalización",
            "category": "Walls",
            "tool": "modify_parameters",
            "filter": {
              "type_name": "15",
              "family_name": "Basic Wall",
              "level_name": "",
              "search_text": ""
            },
            "element_ids": [],
            "parameters": {
              "Comments": "MURO AUDITADO - ARCA REVIEW",
              "Fire Rating": "60 min"
            }
          },
          "children": []
        }
      ]
    },
    {
      "name": "FASE 2: MODELADO CONSTRUCTIVO Y DOCUMENTACIÓN",
      "description": "Despiece constructivo 3D, creación de tablas de cómputos y láminas.",
      "blockType": "text",
      "bgColor": "#f1f5f9",
      "children": [
        {
          "name": "Generar Tabla de Cuantificación de Muros",
          "description": "Crea automáticamente el ViewSchedule con campos de área, longitud y volumen.",
          "blockType": "revit_action",
          "bgColor": "#dcfce7",
          "revitAction": {
            "enabled": true,
            "order": 2,
            "phase": "Fase 2: Documentación",
            "category": "Schedules",
            "tool": "create_schedule",
            "filter": {
              "type_name": "",
              "family_name": "",
              "level_name": "",
              "search_text": ""
            },
            "element_ids": [],
            "parameters": {
              "ScheduleName": "ARCA_COMPUTO_MUROS_GENERAL",
              "TargetCategory": "Walls",
              "Fields": "Family and Type,Base Constraint,Length,Area,Volume,Comments"
            }
          },
          "children": []
        },
        {
          "name": "Actualizar Metadatos de Láminas A-100",
          "description": "Estandariza nombres y responsables de revisión en planos arquitectónicos.",
          "blockType": "revit_action",
          "bgColor": "#fef9c3",
          "revitAction": {
            "enabled": true,
            "order": 3,
            "phase": "Fase 2: Documentación",
            "category": "Sheets",
            "tool": "manage_sheets",
            "filter": {
              "type_name": "",
              "family_name": "",
              "level_name": "",
              "search_text": "A-10"
            },
            "element_ids": [],
            "parameters": {
              "Sheet Name": "PLANTA ARQUITECTÓNICA GENERAL - COORDINADA",
              "Drawn By": "ARCA BIM IA",
              "Approved By": "DIRECCIÓN BIM"
            }
          },
          "children": []
        }
      ]
    }
  ]
}
\`\`\`

====================================================================
5. INSTRUCCIÓN DEL USUARIO A DESARROLLAR AHORA
====================================================================
${customTopic ? `Requerimiento específico: "${customTopic}"` : `Desarrolla a profundidad ${targetNode ? `la rama "${targetNode.name}"` : 'un esquema completo de automatización BIM en Revit'} combinando nodos conceptuales ("blockType": "text") y nodos de acción ejecutable en Revit ("blockType": "revit_action") con filtros realistas y parámetros precisos.`}

Devuelve únicamente el objeto JSON listo para pegar en ARCA Review o en el Plugin de Revit.`;
};

/**
 * Generates a rich, context-aware AI prompt for expanding or replacing a specific node/branch.
 */
export const generateBranchAiPrompt = (mapData, targetNode, useRevitLayer = true) => {
  if (useRevitLayer) {
    return generateRevitSchemaAiPrompt({ mapData, targetNode });
  }

  const fullOutline = serializeTreeContext(mapData, 0, targetNode.id);
  const pathArray = findNodePath(mapData, targetNode.id) || [targetNode.name];
  const breadcrumb = pathArray.join(' > ');
  const existingChildrenCount = Array.isArray(targetNode.children) ? targetNode.children.length : 0;

  return `Actúa como un Consultor Senior experto en Arquitectura, Ingeniería, Construcción (AEC), Gestión de Proyectos, Normativa Técnica y Metodología BIM (ISO 19650).

Tu objetivo es desarrollar a profundidad una rama específica dentro de un Mapa Mental / Esquema Técnico existente, asegurando que el contenido nuevo sea 100% coherente con todo el contexto del esquema, sin repetir nodos que ya existen en otras ramas y manteniendo el nivel técnico.

====================================================================
1. CONTEXTO GLOBAL DEL ESQUEMA ACTUAL
====================================================================
- TÍTULO DEL ESQUEMA RAÍZ: "${mapData.name || 'Esquema General'}"
- DESCRIPCIÓN DEL ESQUEMA RAÍZ: "${mapData.description || 'Sin descripción'}"
- RUTA JERÁRQUICA DEL NODO A DESARROLLAR: ${breadcrumb}

ESTRUCTURA COMPLETA ACTUAL DEL MAPA (Para que conozcas todo el contexto):
${fullOutline}

====================================================================
2. NODO OBJETIVO A EXPANDIR / DESARROLLAR
====================================================================
- Nombre actual del nodo: "${targetNode.name}"
- Descripción actual del nodo: "${targetNode.description || '(Vacía - debes redactar una descripción técnica clara y completa)'}"
- Sub-nodos directos actuales: ${existingChildrenCount}

====================================================================
3. REGLAS ESTRICTAS DE RESPUESTA (FORMATO JSON)
====================================================================
- Responde **ÚNICAMENTE** con un objeto JSON válido. No incluyas saludos, explicaciones ni texto fuera del bloque JSON.
- El JSON devuelto representa el nodo objetivo actualizado y toda su descendencia (\`children\`).

\`\`\`json
{
  "name": "${targetNode.name}",
  "description": "Síntesis técnica clara del nodo objetivo.",
  "blockType": "text",
  "bgColor": "#ffffff",
  "children": [
    {
      "name": "1. Sub-nodo o Proceso Clave",
      "description": "Explicación detallada, criterios técnicos, entregables o protocolo aplicable.",
      "blockType": "text",
      "bgColor": "#ffffff",
      "children": []
    }
  ]
}
\`\`\``;
};

/**
 * Generates a prompt for creating or restructuring a full schema from scratch or from a topic.
 */
export const generateFullSchemaAiPrompt = (currentTitle = '', currentMapData = null, useRevitLayer = true) => {
  if (useRevitLayer) {
    return generateRevitSchemaAiPrompt({
      mapData: currentMapData,
      targetNode: null,
      customTopic: currentTitle
    });
  }

  const hasExistingContext = currentMapData && Array.isArray(currentMapData.children) && currentMapData.children.length > 0;
  const existingOutline = hasExistingContext ? serializeTreeContext(currentMapData, 0, null) : '';

  return `Actúa como un Consultor Senior experto en Arquitectura, Ingeniería, Construcción (AEC) y Metodología BIM (ISO 19650).

Tu objetivo es generar la estructura completa en formato JSON de un Esquema / Mapa Mental técnico de alto nivel sobre el tema: "${currentTitle || '[ESCRIBE AQUÍ EL TEMA DEL ESQUEMA]'}".
${hasExistingContext ? `\nCONTEXTO ACTUAL DEL MAPA:\n${existingOutline}\n` : ''}
Responde **ÚNICAMENTE** con un objeto JSON válido con la propiedad \`name\`, \`description\`, \`blockType\` y \`children\` recursivos.`;
};

/**
 * Extracts all executable Revit actions from a schema tree (`mapData`) in hierarchical/ordered sequence.
 */
export const extractRevitActionsFromTree = (rootNode) => {
  const extracted = [];
  if (!rootNode) return extracted;

  const traverse = (node, path = [], parentBranchName = '') => {
    if (!node) return;
    const currentPath = [...path, node.name || 'Nodo'];
    const branchName = path.length >= 1 ? path[1] || node.name : node.name;

    if (node.blockType === 'revit_action' || node.revitAction) {
      const ra = node.revitAction || {};
      extracted.push({
        nodeId: node.id,
        nodeName: node.name || 'Acción Revit',
        description: node.description || '',
        processBranch: parentBranchName || branchName || 'Proceso General',
        fullPath: currentPath.join(' › '),
        enabled: ra.enabled !== false,
        order: Number(ra.order ?? extracted.length + 1),
        phase: ra.phase || parentBranchName || 'Fase 1: Ejecución BIM',
        category: ra.category || 'Walls',
        tool: ra.tool || ra.action || 'modify_parameters',
        filter: {
          type_name: ra.filter?.type_name || '',
          family_name: ra.filter?.family_name || '',
          level_name: ra.filter?.level_name || '',
          search_text: ra.filter?.search_text || ''
        },
        element_ids: Array.isArray(ra.element_ids) ? ra.element_ids : [],
        parameters: ra.parameters && typeof ra.parameters === 'object' ? { ...ra.parameters } : {}
      });
    }

    if (Array.isArray(node.children)) {
      const nextBranch = path.length === 1 ? node.name : parentBranchName;
      node.children.forEach((child) => traverse(child, currentPath, nextBranch));
    }
  };

  traverse(rootNode, [], '');
  return extracted.sort((a, b) => (a.order || 0) - (b.order || 0));
};

/**
 * Compiles the schema's Revit actions into the universal JSON payload ready for the
 * ARCA Review Revit Plugin (`reviewPlugIn` DirectAiActionService & Schema Receiver).
 */
export const compileRevitPluginJsonPayload = (mapData, schemaTitle = 'Esquema BIM') => {
  const actions = extractRevitActionsFromTree(mapData);
  return {
    schema_version: '2.0-revit-schema',
    schema_title: schemaTitle || mapData?.name || 'Esquema de Acciones Revit',
    generated_at: new Date().toISOString(),
    total_actions: actions.length,
    enabled_actions: actions.filter((a) => a.enabled).length,
    actions: actions.map((a, idx) => ({
      id: a.nodeId,
      order: a.order || idx + 1,
      enabled: a.enabled !== false,
      step_name: a.nodeName,
      process: a.processBranch,
      phase: a.phase,
      path: a.fullPath,
      description: a.description,
      action: a.tool,
      tool: a.tool,
      category: a.category,
      filter: a.filter,
      element_ids: a.element_ids,
      parameters: a.parameters
    })),
    schema_tree: mapData
  };
};
