import { supabase } from './supabaseClient';

const QUEUE_DOC_TYPE = 'revit_sheets_queue';

// Parámetros de sistema de Revit en un ViewSheet que son de solo lectura o internos
const SYSTEM_READONLY_PARAMS = new Set([
  'None',
  'Type',
  'Type Id',
  'Family',
  'Family and Type',
  'Category',
  'Workset',
  'File Path',
  'Design Option',
  'View Template',
  'Guide Grid',
  'Referencing Sheet Collection',
  'Current Revision Issued',
  ' Dependency',
  'Dependency',
  'Scale',
  'Sheet Number',
  'Sheet Name',
  'Sheet Collection',
  'Colección de planos',
  'Drawn By',
  'Dibujado por',
  'Checked By',
  'Revisado por',
  'Approved By',
  'Aprobado por',
  'Designed By',
  'Diseñado por',
  'Sheet Issue Date',
  'Fecha de emisión de plano',
  'Appears In Sheet List',
  'Aparece en la lista de planos',
  'Númeración plano',
  'Numeración plano',
  'Numeracion plano'
]);

function normalizeStr(str = '') {
  return String(str || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export function normalizeCollectionName(val) {
  if (!val) return 'SIN CATEGORÍA';
  const trimmed = String(val).trim();
  if (
    trimmed === '' ||
    trimmed.toLowerCase() === '<none>' ||
    trimmed.toLowerCase() === '<ninguno>' ||
    trimmed.toLowerCase() === 'none'
  ) {
    return 'SIN CATEGORÍA';
  }
  return trimmed;
}

/**
 * Ordenamiento natural alfanumérico para números de plano (ej. 1, 2, 10, 102, A-01, DET-02)
 */
export function compareSheetNumbers(a = '', b = '') {
  return String(a).localeCompare(String(b), undefined, {
    numeric: true,
    sensitivity: 'base'
  });
}

export const sheetsSyncService = {
  /**
   * Obtiene el nombre del proyecto en Review a partir de su UUID
   */
  async getProjectMetadata(projectId) {
    if (!projectId || projectId === 'GENERAL') return null;
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description')
        .eq('id', projectId)
        .maybeSingle();
      if (error) return null;
      return data;
    } catch {
      return null;
    }
  },

  /**
   * Busca las exportaciones de plugin_project_data y selecciona la que corresponde al proyecto activo
   */
  async getSyncedExportsForProject(projectId, projectNameHint = '') {
    // 1. Obtener lista ligera de exportaciones (sin elements_by_id pesado primero)
    const { data: exportsList, error } = await supabase
      .from('plugin_project_data')
      .select('id, project_name, project_number, project_address, user_email, exported_at, created_at, category_summary, project_info')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error consultando plugin_project_data:', error);
      throw error;
    }

    if (!exportsList || exportsList.length === 0) {
      return { matchedExportSummary: null, allExports: [], projectMeta: null };
    }

    let projectMeta = null;
    let targetName = projectNameHint;
    if (projectId && projectId !== 'GENERAL') {
      projectMeta = await this.getProjectMetadata(projectId);
      if (projectMeta?.name) {
        targetName = projectMeta.name;
      }
    }

    const normTarget = normalizeStr(targetName);
    const normProjId = normalizeStr(projectId);

    // Buscar coincidencia por review_project_id o por nombre de proyecto
    let matched = exportsList.find(exp => {
      const infoProjId = normalizeStr(exp.project_info?.review_project_id || '');
      if (normProjId && infoProjId && infoProjId === normProjId) return true;
      const expName = normalizeStr(exp.project_name || exp.project_info?.name || '');
      if (normTarget && expName && (expName.includes(normTarget) || normTarget.includes(expName))) {
        return true;
      }
      return false;
    });

    if (!matched) {
      matched = exportsList[0];
    }

    return {
      matchedExportSummary: matched,
      allExports: exportsList,
      projectMeta
    };
  },

  /**
   * Carga el detalle completo de un registro de plugin_project_data y extrae sus Sheets y Sheet Collections
   */
  async getFullExportSheets(exportId) {
    if (!exportId) return { exportRecord: null, sheets: [], collections: [] };

    const { data, error } = await supabase
      .from('plugin_project_data')
      .select('id, project_name, project_number, project_address, user_email, exported_at, created_at, category_summary, project_info, sheets_and_views, elements_by_id')
      .eq('id', exportId)
      .single();

    if (error) {
      console.error('Error cargando detalle de exportación BIM:', error);
      throw error;
    }

    const { sheets, collections } = this.extractSheetsFromExportRecord(data);
    return {
      exportRecord: data,
      sheets,
      collections
    };
  },

  /**
   * Extrae todas las láminas (Sheets) y colecciones (Sheet Collections) tanto de elements_by_id como de sheets_and_views
   */
  extractSheetsFromExportRecord(record) {
    if (!record) return { sheets: [], collections: [] };

    const sheetsMap = new Map();
    const collectionsSet = new Set();
    const collectionsMeta = [];

    const elementsById = record.elements_by_id || {};

    // 1. Extraer Sheet Collections y Sheets desde elements_by_id (contiene todos los parámetros de Revit)
    for (const [keyId, elem] of Object.entries(elementsById)) {
      if (!elem) continue;
      const cat = elem.category || elem.Category || '';
      const params = elem.parameters || elem.Parameters || {};

      if (cat === 'Sheet Collections' || cat === 'Sheets: Sheet Collections') {
        const colName = normalizeCollectionName(params['Name'] || elem.name || elem.Name);
        if (colName && colName !== 'SIN CATEGORÍA') {
          collectionsSet.add(colName);
          collectionsMeta.push({
            id: Number(elem.element_id || keyId),
            name: colName,
            unique_id: elem.unique_id || ''
          });
        }
        continue;
      }

      if (cat === 'Sheets' || cat === 'Planos') {
        const sheetId = Number(elem.element_id || keyId);
        const sheetNumber =
          params['Sheet Number'] ??
          params['Número de plano'] ??
          params['Numero de plano'] ??
          '';
        const sheetName =
          params['Sheet Name'] ??
          params['Nombre de plano'] ??
          elem.name ??
          elem.Name ??
          '';
        const rawCollection =
          params['Sheet Collection'] ??
          params['Colección de planos'] ??
          params['Coleccion de planos'] ??
          '<None>';
        const sheetCollection = normalizeCollectionName(rawCollection);

        if (sheetCollection !== 'SIN CATEGORÍA') {
          collectionsSet.add(sheetCollection);
        }

        const numeracionPlano =
          params['Númeración plano'] ??
          params['Numeración plano'] ??
          params['Numeracion plano'] ??
          '';

        const drawnBy = params['Drawn By'] ?? params['Dibujado por'] ?? '';
        const checkedBy = params['Checked By'] ?? params['Revisado por'] ?? '';
        const approvedBy = params['Approved By'] ?? params['Aprobado por'] ?? '';
        const designedBy = params['Designed By'] ?? params['Diseñado por'] ?? '';
        const issueDate = params['Sheet Issue Date'] ?? params['Fecha de emisión de plano'] ?? '';
        const scale = params['Scale'] ?? params['Escala'] ?? '';
        const appearsInList = params['Appears In Sheet List'] ?? params['Aparece en la lista de planos'] ?? 'Yes';

        // Extraer parámetros personalizados adicionales
        const customParameters = {};
        for (const [pKey, pVal] of Object.entries(params)) {
          if (!SYSTEM_READONLY_PARAMS.has(pKey)) {
            customParameters[pKey] = String(pVal ?? '');
          }
        }

        sheetsMap.set(sheetId, {
          id: sheetId,
          unique_id: elem.unique_id || '',
          sheet_number: String(sheetNumber),
          sheet_name: String(sheetName),
          sheet_collection: sheetCollection,
          numeracion_plano: String(numeracionPlano),
          drawn_by: String(drawnBy),
          checked_by: String(checkedBy),
          approved_by: String(approvedBy),
          designed_by: String(designedBy),
          issue_date: String(issueDate),
          scale: String(scale).trim(),
          appears_in_list: String(appearsInList),
          custom_parameters: customParameters,
          all_raw_parameters: params
        });
      }
    }

    // 2. Complementar con sheets_and_views (o project_info.sheets_and_views) si existen planos no indexados en elements_by_id
    const sv =
      (record.sheets_and_views && Array.isArray(record.sheets_and_views.sheets)
        ? record.sheets_and_views
        : null) ||
      (record.project_info?.sheets_and_views && Array.isArray(record.project_info.sheets_and_views.sheets)
        ? record.project_info.sheets_and_views
        : null);

    if (sv && Array.isArray(sv.sheets)) {
      for (const s of sv.sheets) {
        const sid = Number(s.id || s.Id);
        if (!sid) continue;
        const colName = normalizeCollectionName(s.sheet_collection || s.SheetCollection);
        if (colName !== 'SIN CATEGORÍA') collectionsSet.add(colName);

        if (!sheetsMap.has(sid)) {
          sheetsMap.set(sid, {
            id: sid,
            unique_id: s.unique_id || '',
            sheet_number: String(s.sheet_number ?? s.SheetNumber ?? ''),
            sheet_name: String(s.name ?? s.Name ?? ''),
            sheet_collection: colName,
            numeracion_plano: String(s.numeracion_plano ?? ''),
            drawn_by: String(s.drawn_by ?? s.DrawnBy ?? ''),
            checked_by: String(s.checked_by ?? s.CheckedBy ?? ''),
            approved_by: String(s.approved_by ?? s.ApprovedBy ?? ''),
            designed_by: String(s.designed_by ?? s.DesignedBy ?? ''),
            issue_date: String(s.issue_date ?? s.IssueDate ?? ''),
            scale: String(s.scale ?? ''),
            appears_in_list: 'Yes',
            custom_parameters: s.parameters || {},
            all_raw_parameters: s.parameters || {}
          });
        }
      }
    }

    const sheets = Array.from(sheetsMap.values()).sort((a, b) =>
      compareSheetNumbers(a.sheet_number, b.sheet_number)
    );

    const collections = Array.from(collectionsSet).sort((a, b) => a.localeCompare(b));

    return {
      sheets,
      collections,
      collectionsMeta
    };
  },

  /**
   * Consulta la cola de cambios de planos en admin_documents (type = 'revit_sheets_queue')
   */
  async getSheetsQueue(projectId, revitProjectName = '') {
    const { data, error } = await supabase
      .from('admin_documents')
      .select('*')
      .eq('type', QUEUE_DOC_TYPE)
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error obteniendo cola de sheets:', error);
      return null;
    }

    if (!data || data.length === 0) return null;

    const normProjId = normalizeStr(projectId);
    const normRevitName = normalizeStr(revitProjectName);

    for (const row of data) {
      let parsed = null;
      try {
        parsed = typeof row.content === 'string' ? JSON.parse(row.content) : row.content;
      } catch {
        continue;
      }

      const rowProjId = normalizeStr(row.project_id);
      const payloadProjId = normalizeStr(parsed?.project_id);
      const payloadRevitName = normalizeStr(parsed?.revit_project_name);

      const matchesId =
        normProjId &&
        normProjId !== 'general' &&
        (rowProjId === normProjId || payloadProjId === normProjId);

      const matchesName =
        normRevitName &&
        payloadRevitName &&
        (payloadRevitName.includes(normRevitName) || normRevitName.includes(payloadRevitName));

      if (matchesId || matchesName) {
        return {
          docRow: row,
          queueData: parsed
        };
      }
    }

    // Fallback al más reciente si no se especificó filtro
    if (!projectId && !revitProjectName && data[0]) {
      try {
        const parsed = typeof data[0].content === 'string' ? JSON.parse(data[0].content) : data[0].content;
        return { docRow: data[0], queueData: parsed };
      } catch {
        return null;
      }
    }

    return null;
  },

  /**
   * Guarda o actualiza la cola de cambios de planos en Supabase para que Revit la cargue y aplique
   */
  async saveSheetsQueue({
    projectId,
    projectName,
    revitProjectName,
    exportId,
    userEmail,
    userId,
    changes,
    newSheets = [],
    collections = []
  }) {
    const existing = await this.getSheetsQueue(projectId, revitProjectName);

    const queuePayload = {
      queue_version: '1.0',
      status: 'pending',
      project_id: projectId || 'GENERAL',
      project_name: projectName || revitProjectName || '',
      revit_project_name: revitProjectName || projectName || '',
      export_id: exportId || '',
      queued_at: new Date().toISOString(),
      queued_by: userEmail || 'review_user',
      collections,
      summary: {
        modified_sheets_count: changes.length,
        created_sheets_count: newSheets.length,
        total_operations: changes.length + newSheets.length
      },
      changes,
      new_sheets: newSheets
    };

    const contentStr = JSON.stringify(queuePayload, null, 2);
    const docTitle = `COLA_SHEETS_REVIT // ${revitProjectName || projectName || projectId || 'PROYECTO'}`;
    const todayDate = new Date().toISOString().split('T')[0];

    if (existing?.docRow?.id) {
      const { data, error } = await supabase
        .from('admin_documents')
        .update({
          title: docTitle,
          content: contentStr,
          doc_date: todayDate,
          project_id: projectId || existing.docRow.project_id || 'GENERAL',
          amount: changes.length + newSheets.length
        })
        .eq('id', existing.docRow.id)
        .select()
        .single();

      if (error) throw error;
      return { docRow: data, queueData: queuePayload };
    } else {
      const insertObj = {
        title: docTitle,
        type: QUEUE_DOC_TYPE,
        doc_date: todayDate,
        content: contentStr,
        project_id: projectId || 'GENERAL',
        amount: changes.length + newSheets.length
      };
      if (userId) insertObj.user_id = userId;

      const { data, error } = await supabase
        .from('admin_documents')
        .insert([insertObj])
        .select()
        .single();

      if (error) throw error;
      return { docRow: data, queueData: queuePayload };
    }
  },

  /**
   * Limpia o cancela la cola pendiente de un proyecto
   */
  async clearSheetsQueue(projectId, revitProjectName = '') {
    const existing = await this.getSheetsQueue(projectId, revitProjectName);
    if (!existing?.docRow?.id) return true;

    const { error } = await supabase
      .from('admin_documents')
      .delete()
      .eq('id', existing.docRow.id);

    if (error) throw error;
    return true;
  }
};
