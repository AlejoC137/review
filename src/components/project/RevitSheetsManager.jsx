import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers, Search, RefreshCw, Send, RotateCcw, Plus, Trash2, CheckSquare,
  Square, Edit3, AlertTriangle, CheckCircle2, Clock, FolderPlus, Sliders,
  Hash, Type, Tag, Settings2, X, ChevronRight, Eye, Sparkles, ArrowRight,
  FileSpreadsheet, Check, Copy
} from 'lucide-react';
import {
  sheetsSyncService,
  normalizeCollectionName,
  compareSheetNumbers
} from '../../services/sheetsSyncService';

/**
 * Incrementa o desplaza la parte numérica final de un código de plano (ej. "DET-TAN-01" + 1 => "DET-TAN-02", "102" + 1 => "103")
 */
function shiftSheetNumberString(sheetNumStr, offset) {
  const str = String(sheetNumStr || '');
  const match = str.match(/^(.*?)(\d+)(\D*)$/);
  if (!match) {
    return `${str}_${offset >= 0 ? '+' : ''}${offset}`;
  }
  const [, prefix, digits, suffix] = match;
  const numVal = parseInt(digits, 10) + offset;
  const safeVal = Math.max(0, numVal);
  const padded = String(safeVal).padStart(digits.length, '0');
  return `${prefix}${padded}${suffix}`;
}

/**
 * Compara si un plano editado difiere de su estado original sincronizado desde Revit
 */
function getSheetDiff(orig, curr) {
  if (!orig && curr?.isNew) {
    return {
      hasChanges: true,
      isNew: true,
      changedFields: ['sheet_number', 'sheet_name', 'sheet_collection']
    };
  }
  if (!orig || !curr) return { hasChanges: false, isNew: false, changedFields: [] };

  const changedFields = [];
  const fieldsToCompare = [
    'sheet_number',
    'sheet_name',
    'sheet_collection',
    'numeracion_plano',
    'drawn_by',
    'checked_by',
    'approved_by',
    'designed_by',
    'issue_date',
    'appears_in_list'
  ];

  for (const field of fieldsToCompare) {
    if (String(orig[field] ?? '').trim() !== String(curr[field] ?? '').trim()) {
      changedFields.push(field);
    }
  }

  // Comparar custom_parameters
  const origCustom = orig.custom_parameters || {};
  const currCustom = curr.custom_parameters || {};
  const allCustomKeys = new Set([...Object.keys(origCustom), ...Object.keys(currCustom)]);
  for (const k of allCustomKeys) {
    if (String(origCustom[k] ?? '').trim() !== String(currCustom[k] ?? '').trim()) {
      changedFields.push(`param:${k}`);
    }
  }

  return {
    hasChanges: changedFields.length > 0,
    isNew: Boolean(curr.isNew),
    changedFields
  };
}

export default function RevitSheetsManager({ projectId, user }) {
  const [loading, setLoading] = useState(true);
  const [savingQueue, setSavingQueue] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successBanner, setSuccessBanner] = useState('');

  // Datos de exportación Revit y proyecto
  const [allExports, setAllExports] = useState([]);
  const [selectedExportId, setSelectedExportId] = useState('');
  const [exportRecord, setExportRecord] = useState(null);
  const [projectMeta, setProjectMeta] = useState(null);

  // Estado original vs estado editable de Sheets y Categorías (Sheet Collections)
  const [originalSheets, setOriginalSheets] = useState([]);
  const [workingSheets, setWorkingSheets] = useState([]);
  const [collections, setCollections] = useState([]);

  // Cola guardada actualmente en Supabase
  const [cloudQueue, setCloudQueue] = useState(null);
  const [showQueueModal, setShowQueueModal] = useState(false);

  // Filtros y selección
  const [activeCollection, setActiveCollection] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [onlyModifiedFilter, setOnlyModifiedFilter] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Panel de Lógica de Cambio Masivo
  const [showBatchTools, setShowBatchTools] = useState(false);
  const [batchTab, setBatchTab] = useState('renumber'); // 'renumber' | 'names' | 'category' | 'properties'

  // Estado para Herramienta 1: Numeración
  const [renumberMode, setRenumberMode] = useState('sequence'); // 'sequence' | 'shift' | 'fraction'
  const [seqPrefix, setSeqPrefix] = useState('');
  const [seqStart, setSeqStart] = useState(101);
  const [seqStep, setSeqStep] = useState(1);
  const [seqPadding, setSeqPadding] = useState(3);
  const [seqSuffix, setSeqSuffix] = useState('');
  const [shiftOffset, setShiftOffset] = useState(1);
  const [autoUpdateFraction, setAutoUpdateFraction] = useState(true);

  // Estado para Herramienta 2: Nombres (Buscar / Reemplazar / Prefijo)
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [replaceTargetField, setReplaceTargetField] = useState('sheet_name'); // 'sheet_name' | 'sheet_number' | 'both'
  const [namePrefixToAdd, setNamePrefixToAdd] = useState('');
  const [nameSuffixToAdd, setNameSuffixToAdd] = useState('');

  // Estado para Herramienta 3: Categorías (Sheet Collections)
  const [targetCollectionBatch, setTargetCollectionBatch] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [showNewCollectionInput, setShowNewCollectionInput] = useState(false);

  // Estado para Herramienta 4: Propiedades en Lote
  const [batchProps, setBatchProps] = useState({
    drawn_by: '',
    checked_by: '',
    approved_by: '',
    designed_by: '',
    issue_date: '',
    numeracion_plano: '',
    custom_key: '',
    custom_val: ''
  });

  // Modal para crear nuevo Sheet en cola
  const [showNewSheetModal, setShowNewSheetModal] = useState(false);
  const [newSheetForm, setNewSheetForm] = useState({
    sheet_number: '',
    sheet_name: '',
    sheet_collection: 'CURADURIA',
    numeracion_plano: '',
    drawn_by: 'Autor',
    checked_by: 'Verificador',
    approved_by: 'Autorizador',
    designed_by: 'Diseñador',
    issue_date: new Date().toLocaleDateString('es-CO')
  });

  // Inspector lateral de un Sheet específico
  const [inspectedSheetId, setInspectedSheetId] = useState(null);
  const [newCustomParamKey, setNewCustomParamKey] = useState('');
  const [newCustomParamVal, setNewCustomParamVal] = useState('');

  // Cargar datos iniciales al montar o cambiar projectId
  useEffect(() => {
    loadInitialSyncedData();
  }, [projectId]);

  const loadInitialSyncedData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { matchedExportSummary, allExports: list, projectMeta: pMeta } =
        await sheetsSyncService.getSyncedExportsForProject(projectId);

      setAllExports(list || []);
      setProjectMeta(pMeta);

      if (matchedExportSummary?.id) {
        setSelectedExportId(matchedExportSummary.id);
        await loadExportDetailsAndQueue(matchedExportSummary.id, pMeta?.name || matchedExportSummary.project_name);
      } else {
        setOriginalSheets([]);
        setWorkingSheets([]);
        setCollections([]);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al cargar los planos sincronizados desde Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const loadExportDetailsAndQueue = async (exportId, revitProjNameHint = '') => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { exportRecord: fullRec, sheets, collections: cols } =
        await sheetsSyncService.getFullExportSheets(exportId);

      setExportRecord(fullRec);
      setOriginalSheets(JSON.parse(JSON.stringify(sheets)));

      // Consultar si existe una cola pendiente en Supabase para este proyecto
      const queueRes = await sheetsSyncService.getSheetsQueue(
        projectId,
         fullRec?.project_name || revitProjNameHint
      );

      let mergedSheets = JSON.parse(JSON.stringify(sheets));
      let mergedCollections = [...cols];

      if (queueRes?.queueData) {
        setCloudQueue(queueRes.queueData);

        // Si la cola está pendiente ("pending"), superponer los cambios en cola sobre la tabla de trabajo
        if (queueRes.queueData.status === 'pending') {
          if (Array.isArray(queueRes.queueData.collections)) {
            for (const c of queueRes.queueData.collections) {
              if (c && !mergedCollections.includes(c)) mergedCollections.push(c);
            }
          }

          if (Array.isArray(queueRes.queueData.changes)) {
            const changesById = new Map();
            const changesByNum = new Map();
            for (const ch of queueRes.queueData.changes) {
              if (ch.sheet_id) changesById.set(Number(ch.sheet_id), ch);
              if (ch.original?.sheet_number) changesByNum.set(String(ch.original.sheet_number), ch);
            }

            mergedSheets = mergedSheets.map(sh => {
              const ch = changesById.get(Number(sh.id)) || changesByNum.get(String(sh.sheet_number));
              if (!ch || !ch.target) return sh;
              const targetCol = normalizeCollectionName(ch.target.sheet_collection || sh.sheet_collection);
              if (targetCol !== 'SIN CATEGORÍA' && !mergedCollections.includes(targetCol)) {
                mergedCollections.push(targetCol);
              }
              return {
                ...sh,
                sheet_number: ch.target.sheet_number ?? sh.sheet_number,
                sheet_name: ch.target.sheet_name ?? sh.sheet_name,
                sheet_collection: targetCol,
                numeracion_plano: ch.target.numeracion_plano ?? sh.numeracion_plano,
                drawn_by: ch.target.drawn_by ?? sh.drawn_by,
                checked_by: ch.target.checked_by ?? sh.checked_by,
                approved_by: ch.target.approved_by ?? sh.approved_by,
                designed_by: ch.target.designed_by ?? sh.designed_by,
                issue_date: ch.target.issue_date ?? sh.issue_date,
                appears_in_list: ch.target.appears_in_list ?? sh.appears_in_list,
                custom_parameters: {
                  ...(sh.custom_parameters || {}),
                  ...(ch.target.custom_parameters || {})
                },
                isQueuedInCloud: true
              };
            });
          }

          if (Array.isArray(queueRes.queueData.new_sheets)) {
            for (const ns of queueRes.queueData.new_sheets) {
              const tempId = ns.temp_id || `new_${Math.random().toString(36).slice(2, 8)}`;
              const col = normalizeCollectionName(ns.sheet_collection);
              if (col !== 'SIN CATEGORÍA' && !mergedCollections.includes(col)) {
                mergedCollections.push(col);
              }
              mergedSheets.push({
                id: tempId,
                isNew: true,
                isQueuedInCloud: true,
                sheet_number: ns.sheet_number || '',
                sheet_name: ns.sheet_name || 'NUEVO PLANO',
                sheet_collection: col,
                numeracion_plano: ns.numeracion_plano || '',
                drawn_by: ns.drawn_by || 'Autor',
                checked_by: ns.checked_by || 'Verificador',
                approved_by: ns.approved_by || 'Autorizador',
                designed_by: ns.designed_by || 'Diseñador',
                issue_date: ns.issue_date || '',
                scale: ns.scale || '1 : 100',
                appears_in_list: 'Yes',
                custom_parameters: ns.custom_parameters || {}
              });
            }
          }
        }
      } else {
        setCloudQueue(null);
      }

      setWorkingSheets(mergedSheets);
      setCollections(mergedCollections.sort((a, b) => a.localeCompare(b)));
      if (mergedCollections.length > 0 && !targetCollectionBatch) {
        setTargetCollectionBatch(mergedCollections[0]);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar los planos del modelo.');
    } finally {
      setLoading(false);
    }
  };

  // Mapa rápido de planos originales por ID
  const originalSheetsById = useMemo(() => {
    const map = new Map();
    for (const s of originalSheets) {
      map.set(s.id, s);
    }
    return map;
  }, [originalSheets]);

  // Detectar números de plano duplicados en workingSheets
  const duplicateNumbersSet = useMemo(() => {
    const counts = new Map();
    for (const s of workingSheets) {
      const num = String(s.sheet_number || '').trim().toUpperCase();
      if (!num) continue;
      counts.set(num, (counts.get(num) || 0) + 1);
    }
    const dups = new Set();
    for (const [num, c] of counts.entries()) {
      if (c > 1) dups.add(num);
    }
    return dups;
  }, [workingSheets]);

  // Calcular diffs de todos los planos respecto al original de Revit
  const sheetsWithDiff = useMemo(() => {
    return workingSheets.map(sh => {
      const orig = originalSheetsById.get(sh.id);
      const diff = getSheetDiff(orig, sh);
      const isDuplicateNum = duplicateNumbersSet.has(String(sh.sheet_number || '').trim().toUpperCase());
      return {
        ...sh,
        _diff: diff,
        _orig: orig || null,
        _isDuplicateNumber: isDuplicateNum
      };
    });
  }, [workingSheets, originalSheetsById, duplicateNumbersSet]);

  // Resumen total de cambios para enviar a la cola de Revit
  const pendingChangesSummary = useMemo(() => {
    const modified = [];
    const created = [];

    for (const sh of sheetsWithDiff) {
      if (!sh._diff.hasChanges) continue;
      if (sh.isNew) {
        created.push({
          temp_id: sh.id,
          sheet_number: sh.sheet_number,
          sheet_name: sh.sheet_name,
          sheet_collection: sh.sheet_collection === 'SIN CATEGORÍA' ? '<None>' : sh.sheet_collection,
          numeracion_plano: sh.numeracion_plano || '',
          drawn_by: sh.drawn_by || '',
          checked_by: sh.checked_by || '',
          approved_by: sh.approved_by || '',
          designed_by: sh.designed_by || '',
          issue_date: sh.issue_date || '',
          custom_parameters: sh.custom_parameters || {}
        });
      } else if (sh._orig) {
        modified.push({
          action: 'update',
          sheet_id: sh.id,
          unique_id: sh.unique_id,
          changed_fields: sh._diff.changedFields,
          original: {
            sheet_number: sh._orig.sheet_number,
            sheet_name: sh._orig.sheet_name,
            sheet_collection: sh._orig.sheet_collection,
            numeracion_plano: sh._orig.numeracion_plano,
            drawn_by: sh._orig.drawn_by,
            checked_by: sh._orig.checked_by,
            approved_by: sh._orig.approved_by,
            designed_by: sh._orig.designed_by,
            issue_date: sh._orig.issue_date,
            custom_parameters: sh._orig.custom_parameters || {}
          },
          target: {
            sheet_number: sh.sheet_number,
            sheet_name: sh.sheet_name,
            sheet_collection: sh.sheet_collection === 'SIN CATEGORÍA' ? '<None>' : sh.sheet_collection,
            numeracion_plano: sh.numeracion_plano,
            drawn_by: sh.drawn_by,
            checked_by: sh.checked_by,
            approved_by: sh.approved_by,
            designed_by: sh.designed_by,
            issue_date: sh.issue_date,
            custom_parameters: sh.custom_parameters || {}
          }
        });
      }
    }

    return {
      modified,
      created,
      totalCount: modified.length + created.length
    };
  }, [sheetsWithDiff]);

  // Conteo de planos por categoría (Sheet Collection)
  const collectionCounts = useMemo(() => {
    const map = new Map();
    map.set('ALL', { total: sheetsWithDiff.length, modified: 0 });
    for (const c of collections) {
      map.set(c, { total: 0, modified: 0 });
    }
    map.set('SIN CATEGORÍA', { total: 0, modified: 0 });

    for (const sh of sheetsWithDiff) {
      const col = normalizeCollectionName(sh.sheet_collection);
      if (!map.has(col)) map.set(col, { total: 0, modified: 0 });
      const entry = map.get(col);
      entry.total += 1;
      if (sh._diff.hasChanges) {
        entry.modified += 1;
        map.get('ALL').modified += 1;
      }
    }
    return map;
  }, [sheetsWithDiff, collections]);

  // Filtrar planos mostrados en la tabla
  const filteredSheets = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sheetsWithDiff.filter(sh => {
      if (activeCollection !== 'ALL' && normalizeCollectionName(sh.sheet_collection) !== activeCollection) {
        return false;
      }
      if (onlyModifiedFilter && !sh._diff.hasChanges) {
        return false;
      }
      if (q) {
        const matchNum = String(sh.sheet_number || '').toLowerCase().includes(q);
        const matchName = String(sh.sheet_name || '').toLowerCase().includes(q);
        const matchCol = String(sh.sheet_collection || '').toLowerCase().includes(q);
        const matchDrawn = String(sh.drawn_by || '').toLowerCase().includes(q);
        const matchNumPlano = String(sh.numeracion_plano || '').toLowerCase().includes(q);
        return matchNum || matchName || matchCol || matchDrawn || matchNumPlano;
      }
      return true;
    });
  }, [sheetsWithDiff, activeCollection, onlyModifiedFilter, searchTerm]);

  // Plano actualmente abierto en el inspector lateral
  const inspectedSheet = useMemo(() => {
    if (!inspectedSheetId) return null;
    return sheetsWithDiff.find(s => s.id === inspectedSheetId) || null;
  }, [sheetsWithDiff, inspectedSheetId]);

  // Handlers de edición individual
  const updateSheetField = (sheetId, field, value) => {
    setWorkingSheets(prev =>
      prev.map(sh => (sh.id === sheetId ? { ...sh, [field]: value } : sh))
    );
  };

  const updateSheetCustomParam = (sheetId, paramKey, paramVal) => {
    setWorkingSheets(prev =>
      prev.map(sh => {
        if (sh.id !== sheetId) return sh;
        return {
          ...sh,
          custom_parameters: {
            ...(sh.custom_parameters || {}),
            [paramKey]: paramVal
          }
        };
      })
    );
  };

  const revertSingleSheet = (sheetId) => {
    const orig = originalSheetsById.get(sheetId);
    if (!orig) {
      // Si era un plano nuevo creado en borrador, lo eliminamos
      setWorkingSheets(prev => prev.filter(sh => sh.id !== sheetId));
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(sheetId);
        return next;
      });
      return;
    }
    setWorkingSheets(prev =>
      prev.map(sh => (sh.id === sheetId ? JSON.parse(JSON.stringify(orig)) : sh))
    );
  };

  const revertAllChanges = () => {
    if (!window.confirm('¿Revertir todos los cambios locales a los valores originales sincronizados desde Revit?')) {
      return;
    }
    setWorkingSheets(JSON.parse(JSON.stringify(originalSheets)));
    setSelectedIds(new Set());
  };

  // Selección múltiple
  const toggleSelectOne = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllFiltered = () => {
    const allFilteredSelected =
      filteredSheets.length > 0 && filteredSheets.every(sh => selectedIds.has(sh.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (allFilteredSelected) {
        for (const sh of filteredSheets) next.delete(sh.id);
      } else {
        for (const sh of filteredSheets) next.add(sh.id);
      }
      return next;
    });
  };

  // Planos objetivo para las herramientas de lógica de cambio (seleccionados o filtrados actuales)
  const targetBatchIds = useMemo(() => {
    if (selectedIds.size > 0) return selectedIds;
    return new Set(filteredSheets.map(s => s.id));
  }, [selectedIds, filteredSheets]);

  // --- LÓGICA DE CAMBIO 1: RENUMERACIÓN / DESPLAZAMIENTO / FRACCIÓN ---
  const handleApplyRenumberLogic = () => {
    const targetList = workingSheets.filter(sh => targetBatchIds.has(sh.id));
    if (targetList.length === 0) return;

    const totalInBatch = targetList.length;
    const updatesById = new Map();

    targetList.forEach((sh, idx) => {
      let nextSheetNumber = sh.sheet_number;
      let nextFraction = sh.numeracion_plano;

      if (renumberMode === 'sequence') {
        const currentNum = Number(seqStart) + idx * Number(seqStep);
        const padded = String(Math.max(0, currentNum)).padStart(Number(seqPadding), '0');
        nextSheetNumber = `${seqPrefix}${padded}${seqSuffix}`;
        if (autoUpdateFraction) {
          nextFraction = `${idx + 1}/${totalInBatch}`;
        }
      } else if (renumberMode === 'shift') {
        nextSheetNumber = shiftSheetNumberString(sh.sheet_number, Number(shiftOffset));
      } else if (renumberMode === 'fraction') {
        nextFraction = `${idx + 1}/${totalInBatch}`;
      }

      updatesById.set(sh.id, {
        sheet_number: nextSheetNumber,
        numeracion_plano: nextFraction
      });
    });

    setWorkingSheets(prev =>
      prev.map(sh => {
        const u = updatesById.get(sh.id);
        if (!u) return sh;
        return {
          ...sh,
          sheet_number: u.sheet_number,
          numeracion_plano: u.numeracion_plano
        };
      })
    );
  };

  // --- LÓGICA DE CAMBIO 2: NOMBRES Y TEXTO ---
  const handleApplyNamesLogic = (mode) => {
    setWorkingSheets(prev =>
      prev.map(sh => {
        if (!targetBatchIds.has(sh.id)) return sh;
        let nextName = sh.sheet_name;
        let nextNum = sh.sheet_number;

        if (mode === 'replace' && findText) {
          if (replaceTargetField === 'sheet_name' || replaceTargetField === 'both') {
            nextName = nextName.split(findText).join(replaceText);
          }
          if (replaceTargetField === 'sheet_number' || replaceTargetField === 'both') {
            nextNum = nextNum.split(findText).join(replaceText);
          }
        } else if (mode === 'affix') {
          if (namePrefixToAdd && !nextName.startsWith(namePrefixToAdd)) {
            nextName = `${namePrefixToAdd}${nextName}`;
          }
          if (nameSuffixToAdd && !nextName.endsWith(nameSuffixToAdd)) {
            nextName = `${nextName}${nameSuffixToAdd}`;
          }
        } else if (mode === 'uppercase') {
          nextName = nextName.toUpperCase();
        } else if (mode === 'clean_spaces') {
          nextName = nextName.replace(/\s+/g, ' ').trim();
        }

        return {
          ...sh,
          sheet_name: nextName,
          sheet_number: nextNum
        };
      })
    );
  };

  // --- LÓGICA DE CAMBIO 3: CATEGORÍA (SHEET COLLECTION) ---
  const handleCreateCollection = () => {
    const clean = newCollectionName.trim().toUpperCase();
    if (!clean) return;
    if (!collections.includes(clean)) {
      setCollections(prev => [...prev, clean].sort((a, b) => a.localeCompare(b)));
    }
    setTargetCollectionBatch(clean);
    setNewCollectionName('');
    setShowNewCollectionInput(false);
  };

  const handleApplyCategoryLogic = () => {
    if (!targetCollectionBatch) return;
    setWorkingSheets(prev =>
      prev.map(sh =>
        targetBatchIds.has(sh.id) ? { ...sh, sheet_collection: targetCollectionBatch } : sh
      )
    );
  };

  // --- LÓGICA DE CAMBIO 4: PROPIEDADES EN LOTE ---
  const handleApplyBatchProperties = () => {
    setWorkingSheets(prev =>
      prev.map(sh => {
        if (!targetBatchIds.has(sh.id)) return sh;
        const updated = { ...sh };
        if (batchProps.drawn_by.trim() !== '') updated.drawn_by = batchProps.drawn_by.trim();
        if (batchProps.checked_by.trim() !== '') updated.checked_by = batchProps.checked_by.trim();
        if (batchProps.approved_by.trim() !== '') updated.approved_by = batchProps.approved_by.trim();
        if (batchProps.designed_by.trim() !== '') updated.designed_by = batchProps.designed_by.trim();
        if (batchProps.issue_date.trim() !== '') updated.issue_date = batchProps.issue_date.trim();
        if (batchProps.numeracion_plano.trim() !== '') updated.numeracion_plano = batchProps.numeracion_plano.trim();

        if (batchProps.custom_key.trim() !== '') {
          updated.custom_parameters = {
            ...(updated.custom_parameters || {}),
            [batchProps.custom_key.trim()]: batchProps.custom_val
          };
        }
        return updated;
      })
    );
  };

  // --- CREAR NUEVO SHEET EN COLA ---
  const handleAddNewSheetToQueue = () => {
    if (!newSheetForm.sheet_number.trim() || !newSheetForm.sheet_name.trim()) {
      alert('Ingresa el Número y Nombre del nuevo plano.');
      return;
    }
    const col = normalizeCollectionName(newSheetForm.sheet_collection);
    if (col !== 'SIN CATEGORÍA' && !collections.includes(col)) {
      setCollections(prev => [...prev, col].sort((a, b) => a.localeCompare(b)));
    }

    const createdSheet = {
      id: `new_${Date.now()}`,
      isNew: true,
      sheet_number: newSheetForm.sheet_number.trim(),
      sheet_name: newSheetForm.sheet_name.trim(),
      sheet_collection: col,
      numeracion_plano: newSheetForm.numeracion_plano.trim(),
      drawn_by: newSheetForm.drawn_by.trim(),
      checked_by: newSheetForm.checked_by.trim(),
      approved_by: newSheetForm.approved_by.trim(),
      designed_by: newSheetForm.designed_by.trim(),
      issue_date: newSheetForm.issue_date.trim(),
      scale: '1 : 100',
      appears_in_list: 'Yes',
      custom_parameters: {}
    };

    setWorkingSheets(prev => [createdSheet, ...prev]);
    setShowNewSheetModal(false);
    setNewSheetForm(prev => ({
      ...prev,
      sheet_number: shiftSheetNumberString(prev.sheet_number, 1),
      sheet_name: ''
    }));
  };

  // --- ENVIAR CAMBIOS A COLA EN SUPABASE PARA REVIT ---
  const handleSendToRevitQueue = async () => {
    if (pendingChangesSummary.totalCount === 0) {
      alert('No hay cambios pendientes por enviar a la cola de Revit.');
      return;
    }

    if (duplicateNumbersSet.size > 0) {
      const confirmDup = window.confirm(
        `⚠️ Advertencia: Se detectaron números de plano duplicados (${Array.from(duplicateNumbersSet).join(', ')}).\nRevit exige que cada plano tenga un Sheet Number único.\n¿Deseas guardar en cola de todas formas?`
      );
      if (!confirmDup) return;
    }

    setSavingQueue(true);
    setErrorMsg('');
    setSuccessBanner('');

    try {
      const result = await sheetsSyncService.saveSheetsQueue({
        projectId: projectId || 'GENERAL',
        projectName: projectMeta?.name || exportRecord?.project_name || '',
        revitProjectName: exportRecord?.project_name || projectMeta?.name || '',
        exportId: selectedExportId,
        userEmail: user?.mail || user?.email || exportRecord?.user_email || 'usuario@review.com',
        userId: user?.id || null,
        changes: pendingChangesSummary.modified,
        newSheets: pendingChangesSummary.created,
        collections
      });

      setCloudQueue(result.queueData);
      setSuccessBanner(
        `✅ ¡${pendingChangesSummary.totalCount} cambios puestos en cola exitosamente para "${exportRecord?.project_name || 'Revit'}"! Ahora abre Revit -> Review Control Panel -> "Cargar y Aplicar Cola de Planos".`
      );
    } catch (err) {
      setErrorMsg('Error al guardar la cola en Supabase: ' + (err.message || err));
    } finally {
      setSavingQueue(false);
    }
  };

  const handleClearCloudQueue = async () => {
    if (!window.confirm('¿Seguro que deseas vaciar la cola de cambios pendiente en la nube?')) return;
    setSavingQueue(true);
    try {
      await sheetsSyncService.clearSheetsQueue(
        projectId,
        exportRecord?.project_name || projectMeta?.name || ''
      );
      setCloudQueue(null);
      setWorkingSheets(JSON.parse(JSON.stringify(originalSheets)));
      setShowQueueModal(false);
      setSuccessBanner('Cola de cambios eliminada correctamente.');
    } catch (err) {
      setErrorMsg('Error al limpiar la cola: ' + err.message);
    } finally {
      setSavingQueue(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#fcf9f4] font-mono text-[#1c1c19]">
        <RefreshCw size={32} className="animate-spin text-[#0f4369] mb-4" />
        <p className="text-xs font-black uppercase tracking-widest">
          SINCRONIZANDO PLANOS (SHEETS) DEL MODELO REVIT...
        </p>
      </div>
    );
  }

  if (!exportRecord || originalSheets.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-[#fcf9f4] font-mono text-[#1c1c19]">
        <div className="max-w-lg w-full bg-white border-2 border-[#1c1c19] p-8 shadow-[8px_8px_0_0_rgba(28,28,25,1)] text-center space-y-4">
          <Layers size={48} className="mx-auto text-[#0f4369]" />
          <h3 className="text-lg font-black uppercase tracking-tight">
            NO HAY SHEETS SINCRONIZADOS PARA ESTE PROYECTO
          </h3>
          <p className="text-xs text-[#72777f] leading-relaxed">
            1. Abre tu modelo en <strong>Autodesk Revit</strong>.<br />
            2. En el panel <strong>Review Control Panel</strong> o pestaña <strong>📕 Review</strong>, haz clic en <strong>Sincronizar Modelo a Supabase</strong>.<br />
            3. Regresa aquí y presiona <strong>Recargar Sincronización</strong>.
          </p>
          <button
            onClick={loadInitialSyncedData}
            className="px-6 py-3 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-black text-xs uppercase tracking-widest hover:bg-[#1c1c19] transition-all shadow-[4px_4px_0_0_rgba(28,28,25,1)] inline-flex items-center gap-2"
          >
            <RefreshCw size={14} /> RECARGAR SINCRONIZACIÓN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#f6f3ee] font-mono text-[#1c1c19]">
      {/* TOP BAR: INFO DE SINCRONIZACIÓN Y BOTÓN ENVIAR A COLA DE REVIT */}
      <div className="p-4 bg-[#e5e2dd] border-b-2 border-[#1c1c19] flex flex-col lg:flex-row lg:items-center justify-between gap-4 shrink-0">
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3 py-1.5 bg-[#1c1c19] text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
            REVIT SYNC: {exportRecord.project_name}
          </div>

          {allExports.length > 1 && (
            <select
              value={selectedExportId}
              onChange={(e) => {
                setSelectedExportId(e.target.value);
                loadExportDetailsAndQueue(e.target.value);
              }}
              className="bg-white border-2 border-[#1c1c19] px-2 py-1 text-[10px] font-bold uppercase focus:outline-none"
              title="Cambiar instantánea de exportación Revit"
            >
              {allExports.map(exp => (
                <option key={exp.id} value={exp.id}>
                  {exp.project_name} ({new Date(exp.exported_at || exp.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          )}

          <span className="text-[10px] font-bold text-[#72777f] uppercase">
            {workingSheets.length} PLANOS // {collections.length} CATEGORÍAS
          </span>

          {cloudQueue && (
            <button
              onClick={() => setShowQueueModal(true)}
              className={`px-2.5 py-1 border-2 border-[#1c1c19] text-[10px] font-black uppercase flex items-center gap-1.5 transition-all ${
                cloudQueue.status === 'pending'
                  ? 'bg-amber-300 text-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]'
                  : 'bg-green-200 text-green-900'
              }`}
            >
              {cloudQueue.status === 'pending' ? (
                <>
                  <Clock size={12} />
                  COLA EN NUBE: {cloudQueue.summary?.total_operations || (cloudQueue.changes?.length || 0)} PENDIENTES PARA REVIT
                </>
              ) : (
                <>
                  <CheckCircle2 size={12} />
                  COLA APLICADA EN REVIT
                </>
              )}
            </button>
          )}
        </div>

        {/* Botones de Acción Principal */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => loadExportDetailsAndQueue(selectedExportId)}
            className="px-3 py-2 bg-white hover:bg-[#fcf9f4] text-[#1c1c19] border-2 border-[#1c1c19] text-[10px] font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0_0_rgba(28,28,25,1)] active:translate-y-[1px]"
            title="Recargar desde Supabase"
          >
            <RefreshCw size={13} /> ACTUALIZAR
          </button>

          <button
            onClick={() => setShowNewSheetModal(true)}
            className="px-3 py-2 bg-white hover:bg-[#fcf9f4] text-[#0f4369] border-2 border-[#1c1c19] text-[10px] font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0_0_rgba(28,28,25,1)] active:translate-y-[1px]"
          >
            <Plus size={13} strokeWidth={3} /> NUEVO SHEET
          </button>

          <button
            onClick={() => setShowBatchTools(!showBatchTools)}
            className={`px-3 py-2 border-2 border-[#1c1c19] text-[10px] font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0_0_rgba(28,28,25,1)] transition-all ${
              showBatchTools ? 'bg-[#1c1c19] text-white' : 'bg-[#fcf9f4] text-[#1c1c19] hover:bg-white'
            }`}
          >
            <Sliders size={13} /> LÓGICA DE CAMBIO MASIVO ({selectedIds.size > 0 ? `${selectedIds.size} SEL.` : 'FILTRADOS'})
          </button>

          {pendingChangesSummary.totalCount > 0 && (
            <button
              onClick={revertAllChanges}
              className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border-2 border-[#1c1c19] text-[10px] font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0_0_rgba(28,28,25,1)]"
              title="Deshacer todos los cambios locales"
            >
              <RotateCcw size={13} /> REVERTIR ({pendingChangesSummary.totalCount})
            </button>
          )}

          <button
            onClick={handleSendToRevitQueue}
            disabled={savingQueue || pendingChangesSummary.totalCount === 0}
            className={`px-4 py-2 border-2 border-[#1c1c19] text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
              pendingChangesSummary.totalCount > 0
                ? 'bg-[#0f4369] hover:bg-[#16598a] text-white shadow-[4px_4px_0_0_rgba(28,28,25,1)]'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed opacity-70'
            }`}
          >
            {savingQueue ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            ENVIAR CAMBIOS A COLA REVIT ({pendingChangesSummary.totalCount})
          </button>
        </div>
      </div>

      {/* BANNERS DE FEEDBACK Y ALERTAS */}
      {errorMsg && (
        <div className="px-4 py-2.5 bg-red-100 border-b-2 border-[#1c1c19] text-red-900 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-xs font-black px-2">✕</button>
        </div>
      )}

      {successBanner && (
        <div className="px-4 py-2.5 bg-green-200 border-b-2 border-[#1c1c19] text-green-950 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} />
            <span>{successBanner}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQueueModal(true)}
              className="px-2.5 py-1 bg-[#1c1c19] text-white text-[10px] font-black uppercase"
            >
              VER COLA JSON
            </button>
            <button onClick={() => setSuccessBanner('')} className="text-xs font-black px-2">✕</button>
          </div>
        </div>
      )}

      {duplicateNumbersSet.size > 0 && (
        <div className="px-4 py-2 bg-amber-100 border-b-2 border-[#1c1c19] text-amber-900 text-[11px] font-bold flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-700 shrink-0" />
          <span>
            Numeración duplicada detectada en borrador:{' '}
            <strong>{Array.from(duplicateNumbersSet).join(', ')}</strong>. Ajusta o usa la herramienta de Renumeración Secuencial antes de enviar a Revit.
          </span>
        </div>
      )}

      {/* PANEL DESPLEGABLE: LÓGICA DE CAMBIO MASIVO (NUMERACIÓN, NOMBRES, CATEGORÍAS, PROPIEDADES) */}
      {showBatchTools && (
        <div className="bg-[#fcf9f4] border-b-2 border-[#1c1c19] p-4 shadow-inner shrink-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1c1c19]/20 pb-2">
            <div className="flex flex-wrap items-center gap-1">
              <button
                onClick={() => setBatchTab('renumber')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase border-2 border-[#1c1c19] flex items-center gap-1.5 ${
                  batchTab === 'renumber' ? 'bg-[#0f4369] text-white' : 'bg-white text-[#1c1c19]'
                }`}
              >
                <Hash size={12} /> 1. NUMERACIÓN Y SECUENCIA
              </button>
              <button
                onClick={() => setBatchTab('names')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase border-2 border-[#1c1c19] flex items-center gap-1.5 ${
                  batchTab === 'names' ? 'bg-[#0f4369] text-white' : 'bg-white text-[#1c1c19]'
                }`}
              >
                <Type size={12} /> 2. NOMBRES (BUSCAR / REEMPLAZAR)
              </button>
              <button
                onClick={() => setBatchTab('category')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase border-2 border-[#1c1c19] flex items-center gap-1.5 ${
                  batchTab === 'category' ? 'bg-[#0f4369] text-white' : 'bg-white text-[#1c1c19]'
                }`}
              >
                <Tag size={12} /> 3. CAMBIAR CATEGORÍA (COLLECTION)
              </button>
              <button
                onClick={() => setBatchTab('properties')}
                className={`px-3 py-1.5 text-[10px] font-black uppercase border-2 border-[#1c1c19] flex items-center gap-1.5 ${
                  batchTab === 'properties' ? 'bg-[#0f4369] text-white' : 'bg-white text-[#1c1c19]'
                }`}
              >
                <Settings2 size={12} /> 4. PROPIEDADES Y RÓTULO EN LOTE
              </button>
            </div>

            <div className="text-[10px] font-black uppercase text-[#0f4369]">
              APLICANDO A: {selectedIds.size > 0 ? `${selectedIds.size} PLANOS SELECCIONADOS` : `${filteredSheets.length} PLANOS EN VISTA ACTUAL`}
            </div>
          </div>

          {/* TAB 1: NUMERACIÓN Y SECUENCIA */}
          {batchTab === 'renumber' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-3 flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-[#72777f]">MODO DE NUMERACIÓN</label>
                <select
                  value={renumberMode}
                  onChange={e => setRenumberMode(e.target.value)}
                  className="bg-white border-2 border-[#1c1c19] p-2 text-xs font-bold"
                >
                  <option value="sequence">Secuencia Automática (Prefijo + N°)</option>
                  <option value="shift">Desplazar Numeración Existente (+N / -N)</option>
                  <option value="fraction">Solo Recalcular Numeración Interna (1/N, 2/N...)</option>
                </select>
              </div>

              {renumberMode === 'sequence' && (
                <>
                  <div className="lg:col-span-2 flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-[#72777f]">PREFIJO (OPCIONAL)</label>
                    <input
                      type="text"
                      value={seqPrefix}
                      onChange={e => setSeqPrefix(e.target.value)}
                      placeholder="Ej: A- o DET-"
                      className="bg-white border-2 border-[#1c1c19] p-2 text-xs font-bold"
                    />
                  </div>
                  <div className="lg:col-span-1 flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-[#72777f]">INICIO</label>
                    <input
                      type="number"
                      value={seqStart}
                      onChange={e => setSeqStart(Number(e.target.value))}
                      className="bg-white border-2 border-[#1c1c19] p-2 text-xs font-bold"
                    />
                  </div>
                  <div className="lg:col-span-1 flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-[#72777f]">PASO</label>
                    <input
                      type="number"
                      value={seqStep}
                      onChange={e => setSeqStep(Number(e.target.value))}
                      className="bg-white border-2 border-[#1c1c19] p-2 text-xs font-bold"
                    />
                  </div>
                  <div className="lg:col-span-1 flex flex-col gap-1">
                    <label className="text-[9px] font-black uppercase text-[#72777f]">DÍGITOS</label>
                    <input
                      type="number"
                      min="1"
                      max="6"
                      value={seqPadding}
                      onChange={e => setSeqPadding(Number(e.target.value))}
                      className="bg-white border-2 border-[#1c1c19] p-2 text-xs font-bold"
                    />
                  </div>
                  <div className="lg:col-span-2 flex items-center gap-2 pb-2">
                    <input
                      type="checkbox"
                      id="chkAutoFraction"
                      checked={autoUpdateFraction}
                      onChange={e => setAutoUpdateFraction(e.target.checked)}
                      className="w-4 h-4 accent-[#0f4369]"
                    />
                    <label htmlFor="chkAutoFraction" className="text-[10px] font-bold uppercase cursor-pointer">
                      Actualizar X/Total
                    </label>
                  </div>
                </>
              )}

              {renumberMode === 'shift' && (
                <div className="lg:col-span-4 flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-[#72777f]">
                    DESPLAZAMIENTO NUMÉRICO (EJ: +1 PARA INSERTAR PLANO, -1 PARA RETROCEDER)
                  </label>
                  <input
                    type="number"
                    value={shiftOffset}
                    onChange={e => setShiftOffset(Number(e.target.value))}
                    className="bg-white border-2 border-[#1c1c19] p-2 text-xs font-bold w-40"
                  />
                </div>
              )}

              <div className="lg:col-span-2">
                <button
                  onClick={handleApplyRenumberLogic}
                  className="w-full py-2 px-4 bg-[#0f4369] hover:bg-[#1c1c19] text-white border-2 border-[#1c1c19] text-[10px] font-black uppercase shadow-[3px_3px_0_0_rgba(28,28,25,1)]"
                >
                  APLICAR NUMERACIÓN
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: NOMBRES Y TEXTO */}
          {batchTab === 'names' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
              <div className="lg:col-span-2 flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-[#72777f]">CAMPO OBJETIVO</label>
                <select
                  value={replaceTargetField}
                  onChange={e => setReplaceTargetField(e.target.value)}
                  className="bg-white border-2 border-[#1c1c19] p-2 text-xs font-bold"
                >
                  <option value="sheet_name">Nombre del Plano</option>
                  <option value="sheet_number">Número del Plano</option>
                  <option value="both">Ambos Campos</option>
                </select>
              </div>
              <div className="lg:col-span-2 flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-[#72777f]">BUSCAR TEXTO</label>
                <input
                  type="text"
                  value={findText}
                  onChange={e => setFindText(e.target.value)}
                  placeholder="Ej: MAC_ARQ_CIC_"
                  className="bg-white border-2 border-[#1c1c19] p-2 text-xs font-bold"
                />
              </div>
              <div className="lg:col-span-2 flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-[#72777f]">REEMPLAZAR CON</label>
                <input
                  type="text"
                  value={replaceText}
                  onChange={e => setReplaceText(e.target.value)}
                  placeholder="Ej: MAC_ARQ_"
                  className="bg-white border-2 border-[#1c1c19] p-2 text-xs font-bold"
                />
              </div>
              <div className="lg:col-span-2">
                <button
                  onClick={() => handleApplyNamesLogic('replace')}
                  className="w-full py-2 px-3 bg-[#0f4369] text-white border-2 border-[#1c1c19] text-[10px] font-black uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)]"
                >
                  REEMPLAZAR TEXTO
                </button>
              </div>
              <div className="lg:col-span-2 flex flex-col gap-1">
                <label className="text-[9px] font-black uppercase text-[#72777f]">AÑADIR PREFIJO AL NOMBRE</label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={namePrefixToAdd}
                    onChange={e => setNamePrefixToAdd(e.target.value)}
                    placeholder="Prefijo..."
                    className="bg-white border-2 border-[#1c1c19] p-2 text-xs font-bold flex-1 min-w-0"
                  />
                  <button
                    onClick={() => handleApplyNamesLogic('affix')}
                    className="px-2.5 bg-[#1c1c19] text-white text-[10px] font-black uppercase"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="lg:col-span-2 flex gap-1">
                <button
                  onClick={() => handleApplyNamesLogic('uppercase')}
                  className="flex-1 py-2 px-2 bg-white hover:bg-[#e5e2dd] border-2 border-[#1c1c19] text-[9px] font-black uppercase"
                >
                  MAYÚSCULAS
                </button>
                <button
                  onClick={() => handleApplyNamesLogic('clean_spaces')}
                  className="flex-1 py-2 px-2 bg-white hover:bg-[#e5e2dd] border-2 border-[#1c1c19] text-[9px] font-black uppercase"
                >
                  LIMPIAR ESPACIOS
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORÍAS / COLECCIONES DE PLANOS */}
          {batchTab === 'category' && (
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex flex-col gap-1 min-w-[240px]">
                <label className="text-[9px] font-black uppercase text-[#72777f]">
                  MOVER PLANOS SELECCIONADOS A CATEGORÍA (SHEET COLLECTION)
                </label>
                <select
                  value={targetCollectionBatch}
                  onChange={e => setTargetCollectionBatch(e.target.value)}
                  className="bg-white border-2 border-[#1c1c19] p-2 text-xs font-bold"
                >
                  {collections.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="SIN CATEGORÍA">SIN CATEGORÍA (&lt;None&gt;)</option>
                </select>
              </div>

              <button
                onClick={handleApplyCategoryLogic}
                className="py-2 px-5 bg-[#0f4369] hover:bg-[#1c1c19] text-white border-2 border-[#1c1c19] text-[10px] font-black uppercase shadow-[3px_3px_0_0_rgba(28,28,25,1)]"
              >
                ASIGNAR CATEGORÍA EN LOTE
              </button>

              <div className="flex items-end gap-2 ml-auto">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-black uppercase text-[#72777f]">CREAR NUEVA CATEGORÍA EN REVIT</label>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={e => setNewCollectionName(e.target.value)}
                    placeholder="Ej: ESTRUCTURAL o FACHADAS..."
                    className="bg-white border-2 border-[#1c1c19] p-2 text-xs font-bold uppercase"
                  />
                </div>
                <button
                  onClick={handleCreateCollection}
                  className="py-2 px-4 bg-[#1c1c19] text-white border-2 border-[#1c1c19] text-[10px] font-black uppercase"
                >
                  + CREAR CATEGORÍA
                </button>
              </div>
            </div>
          )}

          {/* TAB 4: PROPIEDADES Y RÓTULO EN LOTE */}
          {batchTab === 'properties' && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 items-end">
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase text-[#72777f]">DRAWN BY (DIBUJÓ)</label>
                <input
                  type="text"
                  value={batchProps.drawn_by}
                  onChange={e => setBatchProps({ ...batchProps, drawn_by: e.target.value })}
                  placeholder="Sin cambio..."
                  className="bg-white border-2 border-[#1c1c19] p-1.5 text-[11px] font-bold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase text-[#72777f]">CHECKED BY (REVISÓ)</label>
                <input
                  type="text"
                  value={batchProps.checked_by}
                  onChange={e => setBatchProps({ ...batchProps, checked_by: e.target.value })}
                  placeholder="Sin cambio..."
                  className="bg-white border-2 border-[#1c1c19] p-1.5 text-[11px] font-bold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase text-[#72777f]">APPROVED BY (APROBÓ)</label>
                <input
                  type="text"
                  value={batchProps.approved_by}
                  onChange={e => setBatchProps({ ...batchProps, approved_by: e.target.value })}
                  placeholder="Sin cambio..."
                  className="bg-white border-2 border-[#1c1c19] p-1.5 text-[11px] font-bold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase text-[#72777f]">DESIGNED BY (DISEÑÓ)</label>
                <input
                  type="text"
                  value={batchProps.designed_by}
                  onChange={e => setBatchProps({ ...batchProps, designed_by: e.target.value })}
                  placeholder="Sin cambio..."
                  className="bg-white border-2 border-[#1c1c19] p-1.5 text-[11px] font-bold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase text-[#72777f]">ISSUE DATE (FECHA)</label>
                <input
                  type="text"
                  value={batchProps.issue_date}
                  onChange={e => setBatchProps({ ...batchProps, issue_date: e.target.value })}
                  placeholder="Ej: 16/10/26"
                  className="bg-white border-2 border-[#1c1c19] p-1.5 text-[11px] font-bold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase text-[#72777f]">PARAM PERSONALIZADO</label>
                <input
                  type="text"
                  value={batchProps.custom_key}
                  onChange={e => setBatchProps({ ...batchProps, custom_key: e.target.value })}
                  placeholder="Nombre param..."
                  className="bg-white border-2 border-[#1c1c19] p-1.5 text-[11px] font-bold"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[8px] font-black uppercase text-[#72777f]">VALOR PARAM</label>
                <input
                  type="text"
                  value={batchProps.custom_val}
                  onChange={e => setBatchProps({ ...batchProps, custom_val: e.target.value })}
                  placeholder="Valor..."
                  className="bg-white border-2 border-[#1c1c19] p-1.5 text-[11px] font-bold"
                />
              </div>
              <div>
                <button
                  onClick={handleApplyBatchProperties}
                  className="w-full py-2 px-3 bg-[#0f4369] hover:bg-[#1c1c19] text-white border-2 border-[#1c1c19] text-[10px] font-black uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)]"
                >
                  APLICAR PROPIEDADES
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BARRA DE CATEGORÍAS (SHEET COLLECTIONS) Y BÚSQUEDA */}
      <div className="px-4 py-2.5 bg-white border-b-2 border-[#1c1c19] flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Pills de Categorías */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveCollection('ALL')}
            className={`px-2.5 py-1 text-[10px] font-black uppercase border-2 transition-all flex items-center gap-1.5 ${
              activeCollection === 'ALL'
                ? 'bg-[#1c1c19] text-white border-[#1c1c19]'
                : 'bg-[#f6f3ee] text-[#1c1c19] border-[#1c1c19]/30 hover:border-[#1c1c19]'
            }`}
          >
            <span>TODOS ({collectionCounts.get('ALL')?.total || 0})</span>
            {(collectionCounts.get('ALL')?.modified || 0) > 0 && (
              <span className="px-1 bg-amber-400 text-[#1c1c19] rounded-sm text-[9px]">
                {collectionCounts.get('ALL')?.modified} mod
              </span>
            )}
          </button>

          {collections.map(col => {
            const cInfo = collectionCounts.get(col) || { total: 0, modified: 0 };
            return (
              <button
                key={col}
                onClick={() => setActiveCollection(col)}
                className={`px-2.5 py-1 text-[10px] font-black uppercase border-2 transition-all flex items-center gap-1.5 ${
                  activeCollection === col
                    ? 'bg-[#0f4369] text-white border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]'
                    : 'bg-[#fcf9f4] text-[#1c1c19] border-[#1c1c19]/40 hover:border-[#1c1c19]'
                }`}
              >
                <span>{col} ({cInfo.total})</span>
                {cInfo.modified > 0 && (
                  <span className="px-1 bg-amber-400 text-[#1c1c19] rounded-sm text-[9px]">
                    {cInfo.modified}
                  </span>
                )}
              </button>
            );
          })}

          {(collectionCounts.get('SIN CATEGORÍA')?.total || 0) > 0 && (
            <button
              onClick={() => setActiveCollection('SIN CATEGORÍA')}
              className={`px-2.5 py-1 text-[10px] font-black uppercase border-2 transition-all ${
                activeCollection === 'SIN CATEGORÍA'
                  ? 'bg-[#0f4369] text-white border-[#1c1c19]'
                  : 'bg-[#f6f3ee] text-[#72777f] border-[#1c1c19]/30'
              }`}
            >
              SIN CATEGORÍA ({collectionCounts.get('SIN CATEGORÍA')?.total || 0})
            </button>
          )}

          {showNewCollectionInput ? (
            <div className="flex items-center gap-1">
              <input
                type="text"
                autoFocus
                value={newCollectionName}
                onChange={e => setNewCollectionName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateCollection()}
                placeholder="NUEVA CATEGORÍA..."
                className="px-2 py-0.5 text-[10px] font-bold border-2 border-[#0f4369] uppercase w-36"
              />
              <button
                onClick={handleCreateCollection}
                className="p-1 bg-[#0f4369] text-white border border-[#1c1c19]"
              >
                <Check size={12} />
              </button>
              <button
                onClick={() => setShowNewCollectionInput(false)}
                className="p-1 bg-white text-[#1c1c19] border border-[#1c1c19]"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNewCollectionInput(true)}
              className="px-2 py-1 text-[10px] font-black uppercase border-2 border-dashed border-[#1c1c19]/40 hover:border-[#1c1c19] text-[#0f4369] flex items-center gap-1"
              title="Añadir nueva categoría (Sheet Collection)"
            >
              <FolderPlus size={12} /> + CATEGORÍA
            </button>
          )}
        </div>

        {/* Buscador y filtro de Solo Modificados */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-[10px] font-black uppercase cursor-pointer select-none px-2 py-1 border border-[#1c1c19]/30 bg-[#f6f3ee]">
            <input
              type="checkbox"
              checked={onlyModifiedFilter}
              onChange={e => setOnlyModifiedFilter(e.target.checked)}
              className="accent-[#0f4369]"
            />
            SOLO MODIFICADOS ({pendingChangesSummary.totalCount})
          </label>

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#72777f]" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="BUSCAR N° O NOMBRE..."
              className="pl-8 pr-3 py-1 bg-[#fcf9f4] border-2 border-[#1c1c19] text-[10px] font-bold w-52 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* CUERPO PRINCIPAL: TABLA INTERACTIVA DE SHEETS + INSPECTOR LATERAL */}
      <div className="flex-1 flex overflow-hidden">
        {/* TABLA DE SHEETS */}
        <div className="flex-1 overflow-auto custom-scrollbar p-4">
          <div className="bg-white border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,0.12)] overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#1c1c19] text-white uppercase text-[10px] tracking-wider border-b-2 border-[#1c1c19]">
                  <th className="p-2.5 w-9 text-center">
                    <button onClick={toggleSelectAllFiltered} className="inline-flex items-center justify-center">
                      {filteredSheets.length > 0 && filteredSheets.every(sh => selectedIds.has(sh.id)) ? (
                        <CheckSquare size={14} className="text-amber-300" />
                      ) : (
                        <Square size={14} />
                      )}
                    </button>
                  </th>
                  <th className="p-2.5 w-24">ESTADO</th>
                  <th className="p-2.5 w-40">N° PLANO (SHEET #)</th>
                  <th className="p-2.5 min-w-[280px]">NOMBRE DEL PLANO (SHEET NAME)</th>
                  <th className="p-2.5 w-48">CATEGORÍA (COLLECTION)</th>
                  <th className="p-2.5 w-28">NUMERACIÓN</th>
                  <th className="p-2.5 w-32">DIBUJÓ (DRAWN)</th>
                  <th className="p-2.5 w-28">FECHA EMISIÓN</th>
                  <th className="p-2.5 w-24 text-right">PROPIEDADES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e2dd]">
                {filteredSheets.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-[#72777f] font-bold uppercase text-xs">
                      No hay planos que coincidan con el filtro actual.
                    </td>
                  </tr>
                ) : (
                  filteredSheets.map(sh => {
                    const isSelected = selectedIds.has(sh.id);
                    const hasChanges = sh._diff.hasChanges;
                    const orig = sh._orig;
                    const numChanged = orig && orig.sheet_number !== sh.sheet_number;
                    const nameChanged = orig && orig.sheet_name !== sh.sheet_name;
                    const colChanged = orig && orig.sheet_collection !== sh.sheet_collection;

                    return (
                      <tr
                        key={sh.id}
                        className={`transition-colors ${
                          sh.isNew
                            ? 'bg-emerald-50/70 hover:bg-emerald-50'
                            : hasChanges
                            ? 'bg-amber-50/80 hover:bg-amber-100/60'
                            : isSelected
                            ? 'bg-[#e5f0f8]/60'
                            : 'hover:bg-[#fcf9f4]'
                        }`}
                      >
                        {/* Selección */}
                        <td className="p-2 text-center">
                          <button onClick={() => toggleSelectOne(sh.id)} className="text-[#1c1c19]">
                            {isSelected ? (
                              <CheckSquare size={15} className="text-[#0f4369]" />
                            ) : (
                              <Square size={15} className="text-[#72777f]" />
                            )}
                          </button>
                        </td>

                        {/* Estado */}
                        <td className="p-2">
                          <div className="flex flex-col gap-0.5">
                            {sh.isNew ? (
                              <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[9px] font-black uppercase w-fit">
                                + NUEVO
                              </span>
                            ) : hasChanges ? (
                              <span className="px-1.5 py-0.5 bg-amber-400 text-[#1c1c19] border border-[#1c1c19] text-[9px] font-black uppercase w-fit">
                                MODIFICADO
                              </span>
                            ) : (
                              <span className="text-[9px] font-bold text-[#72777f] uppercase">
                                SINCRONIZADO
                              </span>
                            )}
                            <span className="text-[8px] text-[#72777f]">ID: {sh.id}</span>
                          </div>
                        </td>

                        {/* Número de Plano Editable */}
                        <td className="p-2">
                          <div className="flex flex-col gap-0.5">
                            <input
                              type="text"
                              value={sh.sheet_number}
                              onChange={e => updateSheetField(sh.id, 'sheet_number', e.target.value)}
                              className={`w-full px-2 py-1 border font-black text-xs focus:outline-none ${
                                sh._isDuplicateNumber
                                  ? 'border-2 border-red-600 bg-red-50 text-red-900'
                                  : numChanged
                                  ? 'border-2 border-[#0f4369] bg-white text-[#0f4369]'
                                  : 'border-[#1c1c19]/30 bg-transparent focus:bg-white focus:border-[#1c1c19]'
                              }`}
                            />
                            {numChanged && (
                              <span className="text-[9px] font-bold text-[#0f4369] flex items-center gap-1">
                                Antes: <del className="opacity-70">{orig.sheet_number}</del>
                              </span>
                            )}
                            {sh._isDuplicateNumber && (
                              <span className="text-[8px] font-black text-red-600 uppercase">
                                ⚠️ N° DUPLICADO
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Nombre del Plano Editable */}
                        <td className="p-2">
                          <div className="flex flex-col gap-0.5">
                            <input
                              type="text"
                              value={sh.sheet_name}
                              onChange={e => updateSheetField(sh.id, 'sheet_name', e.target.value)}
                              className={`w-full px-2 py-1 border font-bold text-xs focus:outline-none ${
                                nameChanged
                                  ? 'border-2 border-[#0f4369] bg-white text-[#0f4369]'
                                  : 'border-[#1c1c19]/30 bg-transparent focus:bg-white focus:border-[#1c1c19]'
                              }`}
                            />
                            {nameChanged && (
                              <span className="text-[9px] font-bold text-[#0f4369] truncate max-w-md">
                                Antes: <del className="opacity-70">{orig.sheet_name}</del>
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Categoría / Sheet Collection Editable */}
                        <td className="p-2">
                          <div className="flex flex-col gap-0.5">
                            <select
                              value={normalizeCollectionName(sh.sheet_collection)}
                              onChange={e => updateSheetField(sh.id, 'sheet_collection', e.target.value)}
                              className={`w-full px-2 py-1 border text-[10px] font-black uppercase focus:outline-none ${
                                colChanged
                                  ? 'border-2 border-[#0f4369] bg-white text-[#0f4369]'
                                  : 'border-[#1c1c19]/30 bg-[#f6f3ee]'
                              }`}
                            >
                              {collections.map(c => (
                                <option key={c} value={c}>{c}</option>
                              ))}
                              <option value="SIN CATEGORÍA">SIN CATEGORÍA</option>
                            </select>
                            {colChanged && (
                              <span className="text-[9px] font-bold text-[#0f4369]">
                                Antes: {orig.sheet_collection}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Numeración Plano (ej. 3/10) */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={sh.numeracion_plano || ''}
                            onChange={e => updateSheetField(sh.id, 'numeracion_plano', e.target.value)}
                            placeholder="Ej: 1/10"
                            className="w-full px-2 py-1 border border-[#1c1c19]/30 bg-transparent focus:bg-white focus:border-[#1c1c19] text-[11px] font-bold"
                          />
                        </td>

                        {/* Drawn By */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={sh.drawn_by || ''}
                            onChange={e => updateSheetField(sh.id, 'drawn_by', e.target.value)}
                            className="w-full px-2 py-1 border border-[#1c1c19]/30 bg-transparent focus:bg-white focus:border-[#1c1c19] text-[11px]"
                          />
                        </td>

                        {/* Fecha Emisión */}
                        <td className="p-2">
                          <input
                            type="text"
                            value={sh.issue_date || ''}
                            onChange={e => updateSheetField(sh.id, 'issue_date', e.target.value)}
                            className="w-full px-2 py-1 border border-[#1c1c19]/30 bg-transparent focus:bg-white focus:border-[#1c1c19] text-[11px]"
                          />
                        </td>

                        {/* Acciones de Fila (Inspector de Propiedades y Revertir) */}
                        <td className="p-2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {hasChanges && (
                              <button
                                onClick={() => revertSingleSheet(sh.id)}
                                className="p-1.5 text-red-600 hover:bg-red-100 border border-transparent hover:border-red-400"
                                title="Revertir cambios de este plano"
                              >
                                <RotateCcw size={13} />
                              </button>
                            )}
                            <button
                              onClick={() => setInspectedSheetId(sh.id)}
                              className={`px-2 py-1 border border-[#1c1c19] text-[9px] font-black uppercase flex items-center gap-1 ${
                                inspectedSheetId === sh.id
                                  ? 'bg-[#0f4369] text-white'
                                  : 'bg-[#f6f3ee] hover:bg-[#1c1c19] hover:text-white'
                              }`}
                              title="Editar todas las propiedades y parámetros del plano"
                            >
                              <Settings2 size={12} /> DATOS
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* INSPECTOR LATERAL DE PROPIEDADES DEL PLANO SELECCIONADO */}
        {inspectedSheet && (
          <div className="w-80 md:w-96 border-l-2 border-[#1c1c19] bg-[#fcf9f4] flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
            <div className="p-4 bg-[#1c1c19] text-white flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-300 block">
                  INSPECTOR DE PROPIEDADES BIM
                </span>
                <h4 className="text-xs font-black uppercase truncate">
                  {inspectedSheet.sheet_number} // {inspectedSheet.sheet_name}
                </h4>
              </div>
              <button
                onClick={() => setInspectedSheetId(null)}
                className="p-1 hover:bg-white/20 text-white"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-4 space-y-4 flex-1 text-xs">
              <div className="space-y-2.5 bg-white p-3 border-2 border-[#1c1c19]">
                <h5 className="text-[10px] font-black uppercase text-[#0f4369] border-b border-[#1c1c19]/20 pb-1">
                  IDENTIFICACIÓN Y CATEGORÍA
                </h5>

                <div>
                  <label className="text-[9px] font-black uppercase text-[#72777f]">SHEET NUMBER (N° PLANO)</label>
                  <input
                    type="text"
                    value={inspectedSheet.sheet_number}
                    onChange={e => updateSheetField(inspectedSheet.id, 'sheet_number', e.target.value)}
                    className="w-full mt-0.5 p-2 border-2 border-[#1c1c19] font-black text-xs"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-[#72777f]">SHEET NAME (NOMBRE)</label>
                  <input
                    type="text"
                    value={inspectedSheet.sheet_name}
                    onChange={e => updateSheetField(inspectedSheet.id, 'sheet_name', e.target.value)}
                    className="w-full mt-0.5 p-2 border-2 border-[#1c1c19] font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-[#72777f]">
                    SHEET COLLECTION (CATEGORÍA REVIT)
                  </label>
                  <select
                    value={normalizeCollectionName(inspectedSheet.sheet_collection)}
                    onChange={e => updateSheetField(inspectedSheet.id, 'sheet_collection', e.target.value)}
                    className="w-full mt-0.5 p-2 border-2 border-[#1c1c19] font-black text-xs uppercase bg-white"
                  >
                    {collections.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="SIN CATEGORÍA">SIN CATEGORÍA (&lt;None&gt;)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-[#72777f]">
                    NUMERACIÓN PLANO (CONSECUTIVO INTERNO)
                  </label>
                  <input
                    type="text"
                    value={inspectedSheet.numeracion_plano || ''}
                    onChange={e => updateSheetField(inspectedSheet.id, 'numeracion_plano', e.target.value)}
                    placeholder="Ej: 3/10"
                    className="w-full mt-0.5 p-2 border-2 border-[#1c1c19] font-bold text-xs"
                  />
                </div>
              </div>

              {/* DATOS DE RÓTULO / TITLEBLOCK */}
              <div className="space-y-2.5 bg-white p-3 border-2 border-[#1c1c19]">
                <h5 className="text-[10px] font-black uppercase text-[#0f4369] border-b border-[#1c1c19]/20 pb-1">
                  PROPIEDADES DE RÓTULO Y FIRMAS
                </h5>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-black uppercase text-[#72777f]">DRAWN BY (DIBUJÓ)</label>
                    <input
                      type="text"
                      value={inspectedSheet.drawn_by || ''}
                      onChange={e => updateSheetField(inspectedSheet.id, 'drawn_by', e.target.value)}
                      className="w-full mt-0.5 p-1.5 border border-[#1c1c19] font-bold text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-[#72777f]">CHECKED BY (REVISÓ)</label>
                    <input
                      type="text"
                      value={inspectedSheet.checked_by || ''}
                      onChange={e => updateSheetField(inspectedSheet.id, 'checked_by', e.target.value)}
                      className="w-full mt-0.5 p-1.5 border border-[#1c1c19] font-bold text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-[#72777f]">APPROVED BY (APROBÓ)</label>
                    <input
                      type="text"
                      value={inspectedSheet.approved_by || ''}
                      onChange={e => updateSheetField(inspectedSheet.id, 'approved_by', e.target.value)}
                      className="w-full mt-0.5 p-1.5 border border-[#1c1c19] font-bold text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-[#72777f]">DESIGNED BY (DISEÑÓ)</label>
                    <input
                      type="text"
                      value={inspectedSheet.designed_by || ''}
                      onChange={e => updateSheetField(inspectedSheet.id, 'designed_by', e.target.value)}
                      className="w-full mt-0.5 p-1.5 border border-[#1c1c19] font-bold text-[11px]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-black uppercase text-[#72777f]">SHEET ISSUE DATE</label>
                    <input
                      type="text"
                      value={inspectedSheet.issue_date || ''}
                      onChange={e => updateSheetField(inspectedSheet.id, 'issue_date', e.target.value)}
                      className="w-full mt-0.5 p-1.5 border border-[#1c1c19] font-bold text-[11px]"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-black uppercase text-[#72777f]">ESCALA (SOLO LECTURA)</label>
                    <input
                      type="text"
                      readOnly
                      value={inspectedSheet.scale || 'N/A'}
                      className="w-full mt-0.5 p-1.5 border border-[#1c1c19]/30 bg-gray-100 text-[#72777f] text-[11px]"
                    />
                  </div>
                </div>
              </div>

              {/* PARÁMETROS PERSONALIZADOS DEL PLANO */}
              <div className="space-y-2.5 bg-white p-3 border-2 border-[#1c1c19]">
                <h5 className="text-[10px] font-black uppercase text-[#0f4369] border-b border-[#1c1c19]/20 pb-1">
                  PARÁMETROS PERSONALIZADOS REVIT
                </h5>

                {Object.entries(inspectedSheet.custom_parameters || {}).map(([pKey, pVal]) => (
                  <div key={pKey}>
                    <label className="text-[8px] font-black uppercase text-[#72777f]">{pKey}</label>
                    <input
                      type="text"
                      value={pVal}
                      onChange={e => updateSheetCustomParam(inspectedSheet.id, pKey, e.target.value)}
                      className="w-full mt-0.5 p-1.5 border border-[#1c1c19] font-bold text-[11px]"
                    />
                  </div>
                ))}

                <div className="pt-2 border-t border-[#1c1c19]/10 space-y-1.5">
                  <span className="text-[8px] font-black uppercase text-[#72777f] block">
                    + AGREGAR / MODIFICAR PARÁMETRO DE PROYECTO
                  </span>
                  <div className="flex gap-1">
                    <input
                      type="text"
                      value={newCustomParamKey}
                      onChange={e => setNewCustomParamKey(e.target.value)}
                      placeholder="Parámetro..."
                      className="w-1/2 p-1.5 border border-[#1c1c19] text-[10px]"
                    />
                    <input
                      type="text"
                      value={newCustomParamVal}
                      onChange={e => setNewCustomParamVal(e.target.value)}
                      placeholder="Valor..."
                      className="w-1/2 p-1.5 border border-[#1c1c19] text-[10px]"
                    />
                    <button
                      onClick={() => {
                        if (!newCustomParamKey.trim()) return;
                        updateSheetCustomParam(inspectedSheet.id, newCustomParamKey.trim(), newCustomParamVal);
                        setNewCustomParamKey('');
                        setNewCustomParamVal('');
                      }}
                      className="px-2 bg-[#0f4369] text-white text-[10px] font-black"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: CREAR NUEVO SHEET EN COLA */}
      {showNewSheetModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fcf9f4] border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)] w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#1c1c19] pb-3">
              <h3 className="text-sm font-black uppercase text-[#0f4369]">
                + AGREGAR NUEVO PLANO (SHEET) A LA COLA DE REVIT
              </h3>
              <button onClick={() => setShowNewSheetModal(false)} className="font-black text-sm">✕</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[9px] font-black uppercase text-[#72777f]">SHEET NUMBER (N° PLANO) *</label>
                <input
                  type="text"
                  value={newSheetForm.sheet_number}
                  onChange={e => setNewSheetForm({ ...newSheetForm, sheet_number: e.target.value })}
                  placeholder="Ej: 115 o DET-10"
                  className="w-full mt-1 p-2 bg-white border-2 border-[#1c1c19] font-black"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-[#72777f]">CATEGORÍA (SHEET COLLECTION)</label>
                <select
                  value={newSheetForm.sheet_collection}
                  onChange={e => setNewSheetForm({ ...newSheetForm, sheet_collection: e.target.value })}
                  className="w-full mt-1 p-2 bg-white border-2 border-[#1c1c19] font-bold uppercase"
                >
                  {collections.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="SIN CATEGORÍA">SIN CATEGORÍA</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="text-[9px] font-black uppercase text-[#72777f]">SHEET NAME (NOMBRE DEL PLANO) *</label>
                <input
                  type="text"
                  value={newSheetForm.sheet_name}
                  onChange={e => setNewSheetForm({ ...newSheetForm, sheet_name: e.target.value })}
                  placeholder="Ej: MAC_ARQ_CIC_PLANTA CUBIERTAS"
                  className="w-full mt-1 p-2 bg-white border-2 border-[#1c1c19] font-bold"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-[#72777f]">NUMERACIÓN INTERNA</label>
                <input
                  type="text"
                  value={newSheetForm.numeracion_plano}
                  onChange={e => setNewSheetForm({ ...newSheetForm, numeracion_plano: e.target.value })}
                  placeholder="Ej: 11/12"
                  className="w-full mt-1 p-2 bg-white border-2 border-[#1c1c19] font-bold"
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-[#72777f]">DRAWN BY (DIBUJADO POR)</label>
                <input
                  type="text"
                  value={newSheetForm.drawn_by}
                  onChange={e => setNewSheetForm({ ...newSheetForm, drawn_by: e.target.value })}
                  className="w-full mt-1 p-2 bg-white border-2 border-[#1c1c19] font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#1c1c19]/20">
              <button
                onClick={() => setShowNewSheetModal(false)}
                className="px-4 py-2 bg-white border-2 border-[#1c1c19] text-[10px] font-black uppercase"
              >
                CANCELAR
              </button>
              <button
                onClick={handleAddNewSheetToQueue}
                className="px-5 py-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] text-[10px] font-black uppercase shadow-[3px_3px_0_0_rgba(28,28,25,1)]"
              >
                AGREGAR A BORRADOR DE COLA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: DETALLE DE LA COLA EN LA NUBE (PARA CONFIRMAR EN REVIT) */}
      {showQueueModal && cloudQueue && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fcf9f4] border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)] w-full max-w-4xl max-h-[85vh] flex flex-col">
            <div className="p-4 bg-[#0f4369] text-white flex items-center justify-between border-b-2 border-[#1c1c19]">
              <div>
                <h3 className="text-sm font-black uppercase">
                  COLA DE CAMBIOS DE PLANOS EN SUPABASE ({cloudQueue.revit_project_name})
                </h3>
                <p className="text-[10px] opacity-80">
                  Estado: {cloudQueue.status?.toUpperCase()} // Enviado: {new Date(cloudQueue.queued_at).toLocaleString()} por {cloudQueue.queued_by}
                </p>
              </div>
              <button
                onClick={() => setShowQueueModal(false)}
                className="px-2.5 py-1 bg-red-600 text-white text-xs font-black border border-white"
              >
                ✕ CERRAR
              </button>
            </div>

            <div className="p-4 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="p-3 bg-amber-50 border-2 border-[#1c1c19] text-[11px] leading-relaxed">
                <strong>¿Cómo aplicar estos cambios en Revit?</strong><br />
                1. En Autodesk Revit, abre el <strong>Panel de Control Review</strong> (o usa la cinta <strong>📕 Review &rarr; Sincronizar Planos (Cola)</strong>).<br />
                2. Haz clic en <strong>📐 Cargar y Aplicar Cola de Planos (Sheets)</strong>.<br />
                3. Revisa la tabla de confirmación en Revit y presiona <strong>Confirmar y Aplicar Automáticamente</strong>.
              </div>

              {Array.isArray(cloudQueue.changes) && cloudQueue.changes.length > 0 && (
                <div className="bg-white border-2 border-[#1c1c19]">
                  <div className="p-2 bg-[#1c1c19] text-white text-[10px] font-black uppercase">
                    PLANOS MODIFICADOS EN COLA ({cloudQueue.changes.length})
                  </div>
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#f6f3ee] border-b border-[#1c1c19]">
                        <th className="p-2">ID REVIT</th>
                        <th className="p-2">N° PLANO (ANTES &rarr; NUEVO)</th>
                        <th className="p-2">NOMBRE (ANTES &rarr; NUEVO)</th>
                        <th className="p-2">CATEGORÍA (ANTES &rarr; NUEVA)</th>
                        <th className="p-2">OTROS CAMBIOS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {cloudQueue.changes.map((ch, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-bold text-[#0f4369]">{ch.sheet_id}</td>
                          <td className="p-2 font-black">
                            {ch.original?.sheet_number !== ch.target?.sheet_number ? (
                              <span>
                                <del className="text-gray-400 mr-1">{ch.original?.sheet_number}</del>
                                <span className="text-[#0f4369]">&rarr; {ch.target?.sheet_number}</span>
                              </span>
                            ) : (
                              ch.target?.sheet_number
                            )}
                          </td>
                          <td className="p-2">
                            {ch.original?.sheet_name !== ch.target?.sheet_name ? (
                              <span>
                                <del className="text-gray-400 mr-1">{ch.original?.sheet_name}</del>
                                <strong className="text-[#0f4369]">&rarr; {ch.target?.sheet_name}</strong>
                              </span>
                            ) : (
                              ch.target?.sheet_name
                            )}
                          </td>
                          <td className="p-2 font-bold">
                            {ch.original?.sheet_collection !== ch.target?.sheet_collection ? (
                              <span>
                                <del className="text-gray-400 mr-1">{ch.original?.sheet_collection}</del>
                                <span className="text-[#0f4369]">&rarr; {ch.target?.sheet_collection}</span>
                              </span>
                            ) : (
                              ch.target?.sheet_collection
                            )}
                          </td>
                          <td className="p-2 text-[10px] text-[#72777f]">
                            {(ch.changed_fields || []).join(', ')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {Array.isArray(cloudQueue.new_sheets) && cloudQueue.new_sheets.length > 0 && (
                <div className="bg-white border-2 border-[#1c1c19]">
                  <div className="p-2 bg-emerald-700 text-white text-[10px] font-black uppercase">
                    NUEVOS PLANOS POR CREAR EN REVIT ({cloudQueue.new_sheets.length})
                  </div>
                  <table className="w-full text-left border-collapse text-[11px]">
                    <thead>
                      <tr className="bg-[#f6f3ee] border-b border-[#1c1c19]">
                        <th className="p-2">N° PLANO</th>
                        <th className="p-2">NOMBRE</th>
                        <th className="p-2">CATEGORÍA</th>
                        <th className="p-2">DIBUJÓ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {cloudQueue.new_sheets.map((ns, idx) => (
                        <tr key={idx}>
                          <td className="p-2 font-black text-emerald-800">{ns.sheet_number}</td>
                          <td className="p-2 font-bold">{ns.sheet_name}</td>
                          <td className="p-2">{ns.sheet_collection}</td>
                          <td className="p-2">{ns.drawn_by}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 bg-[#e5e2dd] border-t-2 border-[#1c1c19] flex justify-between items-center">
              <button
                onClick={handleClearCloudQueue}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white border-2 border-[#1c1c19] text-[10px] font-black uppercase flex items-center gap-1.5"
              >
                <Trash2 size={13} /> VACIAR / CANCELAR COLA EN NUBE
              </button>
              <button
                onClick={() => setShowQueueModal(false)}
                className="px-6 py-2 bg-[#1c1c19] text-white text-[10px] font-black uppercase"
              >
                ENTENDIDO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
