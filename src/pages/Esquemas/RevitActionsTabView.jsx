import React, { useState, useMemo } from 'react';
import {
  Cpu,
  Layers,
  Wrench,
  Plus,
  Trash2,
  Copy,
  Check,
  Wand2,
  FileJson,
  ArrowUp,
  ArrowDown,
  Filter,
  Sliders,
  Play,
  FolderTree,
  ListOrdered,
  Eye,
  Code2,
  Sparkles,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { REVIT_CATEGORIES, REVIT_TOOLS, DEFAULT_REVIT_ACTION } from './constants';
import {
  extractRevitActionsFromTree,
  compileRevitPluginJsonPayload,
  generateRevitSchemaAiPrompt
} from './schemaAiPrompt';

const PROCESS_PRESETS = [
  {
    id: 'preset_walls_qaqc',
    title: '🧱 Proceso: Auditoría y Despiece de Muros',
    branchName: 'PROCESO: AUDITORÍA Y ALBAÑILERÍA DE MUROS',
    description: 'Normaliza parámetros de muros e inicia conversión constructiva a ladrillos 3D.',
    actions: [
      {
        name: 'Codificar Muros Interiores 15cm',
        description: 'Asigna comentarios y resistencia al fuego a muros interiores.',
        revitAction: {
          enabled: true,
          order: 1,
          phase: 'Fase 1: Normalización',
          category: 'Walls',
          tool: 'modify_parameters',
          filter: { type_name: '15', family_name: 'Basic Wall', level_name: '', search_text: '' },
          element_ids: [],
          parameters: { Comments: 'MURO AUDITADO ISO 19650', 'Fire Rating': '60 min' }
        }
      },
      {
        name: 'Despiezar Muros en Ladrillos 3D',
        description: 'Ejecuta el generador de ladrillos y mortero de pega.',
        revitAction: {
          enabled: true,
          order: 2,
          phase: 'Fase 2: Modelado Constructivo',
          category: 'Walls',
          tool: 'convert_walls_to_bricks',
          filter: { type_name: 'Ladrillo', family_name: '', level_name: '', search_text: '' },
          element_ids: [],
          parameters: { BrickFamily: 'Ladrillo Estándar', MortarThicknessMm: '15', IncludeVerticalJoints: 'true' }
        }
      }
    ]
  },
  {
    id: 'preset_docs_iso',
    title: '📐 Proceso: Documentación ISO 19650 (Planos y Tablas)',
    branchName: 'PROCESO: ENTREGABLES Y CÓMPUTOS BIM',
    description: 'Estandariza metadatos de láminas y crea tablas de cuantificación.',
    actions: [
      {
        name: 'Crear Tabla de Cuantificación de Muros',
        description: 'Genera ViewSchedule con longitud, área, volumen y comentarios.',
        revitAction: {
          enabled: true,
          order: 1,
          phase: 'Fase 1: Cómputos',
          category: 'Schedules',
          tool: 'create_schedule',
          filter: { type_name: '', family_name: '', level_name: '', search_text: '' },
          element_ids: [],
          parameters: {
            ScheduleName: 'ARCA_COMPUTO_MUROS_BIM',
            TargetCategory: 'Walls',
            Fields: 'Family and Type,Base Constraint,Length,Area,Volume,Comments'
          }
        }
      },
      {
        name: 'Actualizar Cajetín de Planos Arquitectónicos',
        description: 'Actualiza responsables y nombres en láminas serie A.',
        revitAction: {
          enabled: true,
          order: 2,
          phase: 'Fase 2: Planimetría',
          category: 'Sheets',
          tool: 'manage_sheets',
          filter: { type_name: '', family_name: '', level_name: '', search_text: 'A-' },
          element_ids: [],
          parameters: {
            'Drawn By': 'ARCA REVIEW IA',
            'Approved By': 'COORDINACIÓN BIM'
          }
        }
      }
    ]
  },
  {
    id: 'preset_finishes',
    title: '🪵 Proceso: Acabados de Pisos y Materiales',
    branchName: 'PROCESO: ACABADOS Y MATERIALIDAD',
    description: 'Sincroniza materiales BIM y ejecuta despiece de baldosas en pisos.',
    actions: [
      {
        name: 'Crear Material Acabado Cerámico BIM',
        description: 'Registra material estandarizado y lo aplica a pisos filtrados.',
        revitAction: {
          enabled: true,
          order: 1,
          phase: 'Fase 1: Materiales',
          category: 'Floors',
          tool: 'sync_materials',
          filter: { type_name: 'Cerámica', family_name: '', level_name: '', search_text: '' },
          element_ids: [],
          parameters: {
            MaterialName: 'ARCA_Ceramica_Antideslizante',
            ColorHex: '#CBD5E1',
            ApplyToElements: 'true'
          }
        }
      },
      {
        name: 'Despiezar Pisos en Baldosas 60x60',
        description: 'Genera piezas 3D de acabado sobre los suelos seleccionados.',
        revitAction: {
          enabled: true,
          order: 2,
          phase: 'Fase 2: Despiece 3D',
          category: 'Floors',
          tool: 'convert_floors_to_tiles',
          filter: { type_name: 'Cerámica', family_name: '', level_name: '', search_text: '' },
          element_ids: [],
          parameters: { TileWidthMm: '600', TileLengthMm: '600', JointMm: '3' }
        }
      }
    ]
  }
];

const RevitActionsTabView = ({
  mapData,
  schemaTitle,
  onSaveNodeContent,
  onDeleteNode,
  onAddActionNodeToBranch,
  onInjectPresetBranch,
  onOpenUniversalJsonModal,
  onSwitchToCanvas
}) => {
  const [groupMode, setGroupMode] = useState('branch'); // 'branch' | 'category' | 'sequence'
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterTool, setFilterTool] = useState('ALL');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [showJsonPanel, setShowJsonPanel] = useState(true);
  const [showNewActionForm, setShowNewActionForm] = useState(false);

  // New Action Form State
  const [targetBranchId, setTargetBranchId] = useState('root');
  const [newActionName, setNewActionName] = useState('');
  const [newActionDesc, setNewActionDesc] = useState('');
  const [newActionCategory, setNewActionCategory] = useState('Walls');
  const [newActionTool, setNewActionTool] = useState('modify_parameters');
  const [newFilterType, setNewFilterType] = useState('');
  const [newFilterFamily, setNewFilterFamily] = useState('');
  const [newFilterLevel, setNewFilterLevel] = useState('');
  const [newParamKey, setNewParamKey] = useState('Comments');
  const [newParamVal, setNewParamVal] = useState('ACTUALIZADO DESDE ARCA REVIEW');

  // Collect all branches (depth 0 and depth 1) for the target branch selector
  const availableBranches = useMemo(() => {
    if (!mapData) return [];
    const list = [{ id: mapData.id || 'root', name: `📍 [RAÍZ] ${mapData.name}` }];
    if (Array.isArray(mapData.children)) {
      mapData.children.forEach((ch) => {
        list.push({ id: ch.id, name: `📂 ${ch.name}` });
      });
    }
    return list;
  }, [mapData]);

  // Extract all Revit actions from the schema tree
  const allActions = useMemo(() => extractRevitActionsFromTree(mapData), [mapData]);

  const filteredActions = useMemo(() => {
    return allActions.filter((item) => {
      if (filterCategory !== 'ALL' && item.category !== filterCategory) return false;
      if (filterTool !== 'ALL' && item.tool !== filterTool) return false;
      return true;
    });
  }, [allActions, filterCategory, filterTool]);

  // Group actions according to groupMode
  const groupedActions = useMemo(() => {
    if (groupMode === 'sequence') {
      return [{ groupTitle: 'SECUENCIA GLOBAL DE EJECUCIÓN EN REVIT', items: filteredActions }];
    }
    const map = new Map();
    filteredActions.forEach((act) => {
      const key =
        groupMode === 'category'
          ? REVIT_CATEGORIES.find((c) => c.id === act.category)?.label || act.category
          : act.processBranch || 'Proceso Principal';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(act);
    });
    return Array.from(map.entries()).map(([groupTitle, items]) => ({ groupTitle, items }));
  }, [filteredActions, groupMode]);

  const compiledPayload = useMemo(
    () => compileRevitPluginJsonPayload(mapData, schemaTitle),
    [mapData, schemaTitle]
  );

  const handleCopyPluginJson = () => {
    navigator.clipboard.writeText(JSON.stringify(compiledPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 3000);
  };

  const handleCopyRevitPrompt = () => {
    const prompt = generateRevitSchemaAiPrompt({
      mapData,
      targetNode: null,
      customTopic: schemaTitle
    });
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 3000);
  };

  const handleUpdateAction = (actionItem, updatedFields) => {
    if (!onSaveNodeContent) return;
    const nextRevitAction = {
      ...DEFAULT_REVIT_ACTION,
      category: actionItem.category,
      tool: actionItem.tool,
      enabled: actionItem.enabled,
      order: actionItem.order,
      phase: actionItem.phase,
      filter: { ...actionItem.filter },
      element_ids: [...(actionItem.element_ids || [])],
      parameters: { ...(actionItem.parameters || {}) },
      ...updatedFields
    };
    onSaveNodeContent(actionItem.nodeId, {
      blockType: 'revit_action',
      revitAction: nextRevitAction
    });
  };

  const handleMoveOrder = (actionItem, delta) => {
    const nextOrder = Math.max(1, (actionItem.order || 1) + delta);
    handleUpdateAction(actionItem, { order: nextOrder });
  };

  const handleCreateNewAction = (e) => {
    e.preventDefault();
    if (!onAddActionNodeToBranch) return;
    const toolObj = REVIT_TOOLS.find((t) => t.id === newActionTool);
    const title =
      newActionName.trim() ||
      `${toolObj?.label || newActionTool} → ${newActionCategory}`;

    const params = {};
    if (newParamKey.trim()) {
      params[newParamKey.trim()] = newParamVal;
    } else if (toolObj?.defaultParameters) {
      Object.assign(params, toolObj.defaultParameters);
    }

    onAddActionNodeToBranch(targetBranchId || 'root', {
      name: title,
      description: newActionDesc.trim() || `Acción configurada para categoría ${newActionCategory}`,
      blockType: 'revit_action',
      bgColor: '#e0f2fe',
      revitAction: {
        enabled: true,
        order: allActions.length + 1,
        phase: 'Fase 1: Ejecución BIM',
        category: newActionCategory,
        tool: newActionTool,
        filter: {
          type_name: newFilterType.trim(),
          family_name: newFilterFamily.trim(),
          level_name: newFilterLevel.trim(),
          search_text: ''
        },
        element_ids: [],
        parameters: params
      }
    });

    setNewActionName('');
    setNewActionDesc('');
    setShowNewActionForm(false);
  };

  return (
    <div className="w-full h-full pt-20 pb-10 px-6 overflow-y-auto bg-[#fcf9f4] text-[#1c1c19]">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TOP BANNER & KPI HEADER */}
        <div className="bg-[#1c1c19] text-white border-[3px] border-[#1c1c19] shadow-[8px_8px_0_0_rgba(15,67,105,1)] p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-yellow-400 text-[#1c1c19] font-mono text-[9px] font-black uppercase tracking-widest">
                CAPA DE AUTOMATIZACIÓN REVIT API
              </span>
              <span className="font-mono text-[10px] text-cyan-300 font-bold uppercase tracking-widest">
                {allActions.length} ACCIONES EN ESQUEMA ({allActions.filter((a) => a.enabled).length} ACTIVAS)
              </span>
            </div>
            <h1 className="text-2xl font-black uppercase tracking-tight">
              Orquestador de Acciones y Procesos Revit — {schemaTitle || mapData?.name}
            </h1>
            <p className="text-xs text-white/70 max-w-3xl leading-relaxed">
              Organiza las ramas de tu esquema como secuencias ejecutables basadas en las categorías y herramientas de Revit. Todo cambio aquí se sincroniza en tiempo real con los nodos del mapa y genera el paquete JSON para el Receptor del Plugin de Revit.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyRevitPrompt}
              className={`px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-wider border-2 border-white flex items-center gap-2 transition-all ${
                copiedPrompt
                  ? 'bg-green-400 text-[#1c1c19]'
                  : 'bg-[#0f4369] text-white hover:bg-white hover:text-[#1c1c19]'
              }`}
            >
              {copiedPrompt ? <Check size={14} /> : <Wand2 size={14} className="text-yellow-400" />}
              {copiedPrompt ? '¡PROMPT IA COPIADO!' : 'COPIAR PROMPT IA REVIT'}
            </button>

            <button
              type="button"
              onClick={onOpenUniversalJsonModal}
              className="px-4 py-2.5 bg-white text-[#1c1c19] hover:bg-yellow-400 font-mono text-[10px] font-black uppercase tracking-wider border-2 border-white flex items-center gap-2 transition-all"
            >
              <FileJson size={14} />
              INYECTAR JSON DE ACCIONES
            </button>

            <button
              type="button"
              onClick={handleCopyPluginJson}
              className={`px-4 py-2.5 font-mono text-[10px] font-black uppercase tracking-wider border-2 border-yellow-400 flex items-center gap-2 transition-all shadow-[4px_4px_0_0_rgba(250,204,21,0.4)] ${
                copiedPayload
                  ? 'bg-green-500 text-white border-green-300'
                  : 'bg-yellow-400 text-[#1c1c19] hover:bg-yellow-300'
              }`}
            >
              {copiedPayload ? <Check size={14} strokeWidth={3} /> : <Play size={14} />}
              {copiedPayload ? '¡COLA COPIADA PARA EL PLUGIN!' : 'COPIAR COLA PARA PLUGIN REVIT'}
            </button>
          </div>
        </div>

        {/* QUICK PRESET PROCESSES BAR */}
        <div className="bg-white border-2 border-[#1c1c19] p-4 shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-[#0f4369]" />
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#0f4369]">
                Insertar Proceso Tipo de Revit en el Esquema (1 Clic):
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {PROCESS_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onInjectPresetBranch && onInjectPresetBranch(preset)}
                  className="px-3 py-1.5 bg-[#fcf9f4] hover:bg-[#0f4369] hover:text-white text-[#1c1c19] border-2 border-[#1c1c19] font-mono text-[9px] font-black uppercase transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none"
                >
                  + {preset.title}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowNewActionForm(!showNewActionForm)}
                className="px-3 py-1.5 bg-[#e62020] text-white hover:bg-[#1c1c19] border-2 border-[#1c1c19] font-mono text-[9px] font-black uppercase transition-all flex items-center gap-1 shadow-[2px_2px_0_0_rgba(28,28,25,1)]"
              >
                <Plus size={12} strokeWidth={3} /> NUEVA ACCIÓN REVIT
              </button>
            </div>
          </div>

          {/* COLLAPSIBLE NEW ACTION BUILDER */}
          {showNewActionForm && (
            <form
              onSubmit={handleCreateNewAction}
              className="mt-4 pt-4 border-t-2 border-[#1c1c19] grid grid-cols-1 md:grid-cols-4 gap-3 bg-[#f8fafc] p-4"
            >
              <div>
                <label className="block font-mono text-[8px] font-black uppercase text-[#0f4369] mb-1">
                  1. Rama / Proceso Destino
                </label>
                <select
                  value={targetBranchId}
                  onChange={(e) => setTargetBranchId(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono font-bold bg-white border-2 border-[#1c1c19]"
                >
                  {availableBranches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[8px] font-black uppercase text-[#0f4369] mb-1">
                  2. Categoría de Revit
                </label>
                <select
                  value={newActionCategory}
                  onChange={(e) => setNewActionCategory(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono font-bold bg-white border-2 border-[#1c1c19]"
                >
                  {REVIT_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[8px] font-black uppercase text-[#0f4369] mb-1">
                  3. Herramienta / Acción
                </label>
                <select
                  value={newActionTool}
                  onChange={(e) => setNewActionTool(e.target.value)}
                  className="w-full px-2.5 py-2 text-xs font-mono font-bold bg-[#0f4369] text-white border-2 border-[#1c1c19]"
                >
                  {REVIT_TOOLS.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.icon} {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[8px] font-black uppercase text-[#0f4369] mb-1">
                  4. Nombre del Paso / Acción
                </label>
                <input
                  type="text"
                  value={newActionName}
                  onChange={(e) => setNewActionName(e.target.value)}
                  placeholder="Ej. Codificar Muros Nivel 1"
                  className="w-full px-2.5 py-2 text-xs font-bold bg-white border-2 border-[#1c1c19]"
                />
              </div>

              <div>
                <label className="block font-mono text-[8px] font-black uppercase text-[#72777f] mb-1">
                  Filtro: Tipo contiene
                </label>
                <input
                  type="text"
                  value={newFilterType}
                  onChange={(e) => setNewFilterType(e.target.value)}
                  placeholder="Ej. 15cm / Ladrillo"
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-[#1c1c19]"
                />
              </div>

              <div>
                <label className="block font-mono text-[8px] font-black uppercase text-[#72777f] mb-1">
                  Filtro: Nivel
                </label>
                <input
                  type="text"
                  value={newFilterLevel}
                  onChange={(e) => setNewFilterLevel(e.target.value)}
                  placeholder="Ej. Nivel 1"
                  className="w-full px-2.5 py-1.5 text-xs font-mono bg-white border border-[#1c1c19]"
                />
              </div>

              <div>
                <label className="block font-mono text-[8px] font-black uppercase text-[#72777f] mb-1">
                  Parámetro Inicial (Clave = Valor)
                </label>
                <div className="flex gap-1">
                  <input
                    type="text"
                    value={newParamKey}
                    onChange={(e) => setNewParamKey(e.target.value)}
                    placeholder="Comments"
                    className="w-1/2 px-2 py-1.5 text-xs font-mono bg-white border border-[#1c1c19]"
                  />
                  <input
                    type="text"
                    value={newParamVal}
                    onChange={(e) => setNewParamVal(e.target.value)}
                    placeholder="Valor..."
                    className="w-1/2 px-2 py-1.5 text-xs font-mono bg-white border border-[#1c1c19]"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2 bg-[#0f4369] text-white font-mono text-[10px] font-black uppercase border-2 border-[#1c1c19] hover:bg-[#1c1c19] transition-all"
                >
                  + AGREGAR AL ESQUEMA
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewActionForm(false)}
                  className="px-3 py-2 bg-white text-[#1c1c19] font-mono text-[10px] font-black uppercase border-2 border-[#1c1c19]"
                >
                  CERRAR
                </button>
              </div>
            </form>
          )}
        </div>

        {/* FILTER & GROUPING TOOLBAR */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-[#f6f3ee] border-2 border-[#1c1c19] p-3.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] font-black uppercase text-[#72777f] mr-1">
              ORGANIZAR POR:
            </span>
            <button
              type="button"
              onClick={() => setGroupMode('branch')}
              className={`px-3 py-1.5 font-mono text-[9px] font-black uppercase border border-[#1c1c19] flex items-center gap-1.5 ${
                groupMode === 'branch'
                  ? 'bg-[#0f4369] text-white'
                  : 'bg-white text-[#1c1c19] hover:bg-gray-100'
              }`}
            >
              <FolderTree size={12} /> Rama / Proceso
            </button>
            <button
              type="button"
              onClick={() => setGroupMode('category')}
              className={`px-3 py-1.5 font-mono text-[9px] font-black uppercase border border-[#1c1c19] flex items-center gap-1.5 ${
                groupMode === 'category'
                  ? 'bg-[#0f4369] text-white'
                  : 'bg-white text-[#1c1c19] hover:bg-gray-100'
              }`}
            >
              <Layers size={12} /> Categoría Revit
            </button>
            <button
              type="button"
              onClick={() => setGroupMode('sequence')}
              className={`px-3 py-1.5 font-mono text-[9px] font-black uppercase border border-[#1c1c19] flex items-center gap-1.5 ${
                groupMode === 'sequence'
                  ? 'bg-[#0f4369] text-white'
                  : 'bg-white text-[#1c1c19] hover:bg-gray-100'
              }`}
            >
              <ListOrdered size={12} /> Orden de Ejecución
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-2.5 py-1.5 font-mono text-[9px] font-bold bg-white border border-[#1c1c19]"
            >
              <option value="ALL">Todas las Categorías ({REVIT_CATEGORIES.length})</option>
              {REVIT_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>

            <select
              value={filterTool}
              onChange={(e) => setFilterTool(e.target.value)}
              className="px-2.5 py-1.5 font-mono text-[9px] font-bold bg-white border border-[#1c1c19]"
            >
              <option value="ALL">Todas las Herramientas ({REVIT_TOOLS.length})</option>
              {REVIT_TOOLS.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.icon} {t.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setShowJsonPanel(!showJsonPanel)}
              className={`px-3 py-1.5 font-mono text-[9px] font-black uppercase border border-[#1c1c19] flex items-center gap-1.5 ${
                showJsonPanel ? 'bg-[#1c1c19] text-white' : 'bg-white text-[#1c1c19]'
              }`}
            >
              <Code2 size={12} /> {showJsonPanel ? 'Ocultar JSON Receptor' : 'Ver JSON Receptor'}
            </button>
          </div>
        </div>

        {/* MAIN WORKSPACE GRID: ACTIONS LIST + LIVE PLUGIN JSON PREVIEW */}
        <div className={`grid grid-cols-1 ${showJsonPanel ? 'lg:grid-cols-12' : ''} gap-6`}>
          {/* LEFT / MAIN COLUMN: ORGANIZED ACTIONS */}
          <div className={showJsonPanel ? 'lg:col-span-8 space-y-6' : 'space-y-6'}>
            {groupedActions.length === 0 ? (
              <div className="bg-white border-2 border-dashed border-[#1c1c19]/40 p-12 text-center space-y-4">
                <Cpu size={40} className="mx-auto text-[#0f4369]" />
                <h3 className="text-lg font-black uppercase">
                  No hay acciones de Revit en este filtro / esquema
                </h3>
                <p className="text-xs text-[#72777f] max-w-md mx-auto">
                  Puedes convertir cualquier nodo del mapa en una Acción de Revit haciendo clic en el icono de chip (⚡), usar los botones de Proceso Tipo arriba, o inyectar un JSON generado con IA.
                </p>
              </div>
            ) : (
              groupedActions.map((group) => (
                <div
                  key={group.groupTitle}
                  className="bg-white border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,1)] overflow-hidden"
                >
                  {/* Group Header */}
                  <div className="bg-[#0f4369] text-white px-4 py-2.5 flex items-center justify-between border-b-2 border-[#1c1c19]">
                    <div className="flex items-center gap-2">
                      <FolderTree size={14} className="text-yellow-400" />
                      <h3 className="font-mono text-xs font-black uppercase tracking-wider">
                        {group.groupTitle}
                      </h3>
                    </div>
                    <span className="px-2 py-0.5 bg-white/15 font-mono text-[9px] font-black uppercase">
                      {group.items.length} ACCIÓN(ES)
                    </span>
                  </div>

                  {/* Group Action Cards */}
                  <div className="divide-y-2 divide-[#1c1c19]/15">
                    {group.items.map((item) => {
                      const catInfo =
                        REVIT_CATEGORIES.find((c) => c.id === item.category) || REVIT_CATEGORIES[0];
                      const toolInfo =
                        REVIT_TOOLS.find((t) => t.id === item.tool) || REVIT_TOOLS[0];

                      return (
                        <div
                          key={item.nodeId}
                          className={`p-4 transition-colors ${
                            item.enabled ? 'bg-white' : 'bg-gray-100 opacity-60'
                          }`}
                        >
                          {/* Top Row: Order, Toggle, Title, Category, Tool, Controls */}
                          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() =>
                                  handleUpdateAction(item, { enabled: !item.enabled })
                                }
                                className={`mt-0.5 p-1 border border-[#1c1c19] ${
                                  item.enabled
                                    ? 'bg-green-500 text-white'
                                    : 'bg-gray-200 text-gray-500'
                                }`}
                                title={
                                  item.enabled
                                    ? 'Habilitada para ejecutar en Revit'
                                    : 'Deshabilitada'
                                }
                              >
                                {item.enabled ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
                              </button>

                              <div>
                                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                  <span className="px-1.5 py-0.5 bg-[#1c1c19] text-yellow-400 font-mono text-[9px] font-black">
                                    PASO #{item.order}
                                  </span>
                                  <span className="px-2 py-0.5 bg-[#e0f2fe] text-[#0f4369] border border-[#0f4369]/30 font-mono text-[9px] font-black uppercase">
                                    {catInfo.icon} {catInfo.label}
                                  </span>
                                  <span className="px-2 py-0.5 bg-[#0f4369] text-white font-mono text-[9px] font-black uppercase">
                                    {toolInfo.icon} {toolInfo.label}
                                  </span>
                                  <span className="font-mono text-[8px] text-[#72777f]">
                                    Ruta: {item.fullPath}
                                  </span>
                                </div>
                                <h4 className="text-sm font-black uppercase tracking-tight">
                                  {item.nodeName}
                                </h4>
                                {item.description && (
                                  <p className="text-[11px] text-[#5a5d62] mt-0.5">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Action Card Controls */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleMoveOrder(item, -1)}
                                className="p-1.5 bg-[#fcf9f4] hover:bg-[#1c1c19] hover:text-white border border-[#1c1c19]"
                                title="Subir orden"
                              >
                                <ArrowUp size={12} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveOrder(item, 1)}
                                className="p-1.5 bg-[#fcf9f4] hover:bg-[#1c1c19] hover:text-white border border-[#1c1c19]"
                                title="Bajar orden"
                              >
                                <ArrowDown size={12} />
                              </button>
                              {onSwitchToCanvas && (
                                <button
                                  type="button"
                                  onClick={() => onSwitchToCanvas(item.nodeId)}
                                  className="px-2 py-1 bg-[#fcf9f4] hover:bg-[#0f4369] hover:text-white border border-[#1c1c19] font-mono text-[8px] font-black uppercase flex items-center gap-1"
                                  title="Ver nodo en el Mapa Visual"
                                >
                                  <Eye size={11} /> Mapa
                                </button>
                              )}
                              {onDeleteNode && (
                                <button
                                  type="button"
                                  onClick={() => onDeleteNode(item.nodeId)}
                                  className="p-1.5 text-red-600 hover:bg-red-600 hover:text-white border border-red-200"
                                  title="Eliminar acción del esquema"
                                >
                                  <Trash2 size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Inline Quick Editors: Category, Tool, Filters & Parameters */}
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 bg-[#f8fafc] p-3 border border-[#1c1c19]/20">
                            {/* Category & Tool Selectors */}
                            <div className="md:col-span-4 space-y-2">
                              <div>
                                <label className="block font-mono text-[7.5px] font-black uppercase text-[#72777f]">
                                  Categoría Revit
                                </label>
                                <select
                                  value={item.category}
                                  onChange={(e) =>
                                    handleUpdateAction(item, { category: e.target.value })
                                  }
                                  className="w-full px-2 py-1 text-[10px] font-mono font-bold bg-white border border-[#1c1c19]/40"
                                >
                                  {REVIT_CATEGORIES.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.icon} {c.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block font-mono text-[7.5px] font-black uppercase text-[#72777f]">
                                  Herramienta Revit
                                </label>
                                <select
                                  value={item.tool}
                                  onChange={(e) =>
                                    handleUpdateAction(item, { tool: e.target.value })
                                  }
                                  className="w-full px-2 py-1 text-[10px] font-mono font-bold bg-white border border-[#1c1c19]/40"
                                >
                                  {REVIT_TOOLS.map((t) => (
                                    <option key={t.id} value={t.id}>
                                      {t.icon} {t.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>

                            {/* Filters */}
                            <div className="md:col-span-4 space-y-1.5">
                              <span className="flex items-center gap-1 font-mono text-[8px] font-black uppercase text-[#0f4369]">
                                <Filter size={9} /> Filtros de Selección
                              </span>
                              <div className="grid grid-cols-2 gap-1">
                                <input
                                  type="text"
                                  value={item.filter?.type_name || ''}
                                  onChange={(e) =>
                                    handleUpdateAction(item, {
                                      filter: { ...item.filter, type_name: e.target.value }
                                    })
                                  }
                                  placeholder="Tipo..."
                                  className="px-1.5 py-1 text-[9px] font-mono bg-white border border-[#1c1c19]/30"
                                />
                                <input
                                  type="text"
                                  value={item.filter?.family_name || ''}
                                  onChange={(e) =>
                                    handleUpdateAction(item, {
                                      filter: { ...item.filter, family_name: e.target.value }
                                    })
                                  }
                                  placeholder="Familia..."
                                  className="px-1.5 py-1 text-[9px] font-mono bg-white border border-[#1c1c19]/30"
                                />
                                <input
                                  type="text"
                                  value={item.filter?.level_name || ''}
                                  onChange={(e) =>
                                    handleUpdateAction(item, {
                                      filter: { ...item.filter, level_name: e.target.value }
                                    })
                                  }
                                  placeholder="Nivel..."
                                  className="px-1.5 py-1 text-[9px] font-mono bg-white border border-[#1c1c19]/30"
                                />
                                <input
                                  type="text"
                                  value={item.filter?.search_text || ''}
                                  onChange={(e) =>
                                    handleUpdateAction(item, {
                                      filter: { ...item.filter, search_text: e.target.value }
                                    })
                                  }
                                  placeholder="Texto/Plano..."
                                  className="px-1.5 py-1 text-[9px] font-mono bg-white border border-[#1c1c19]/30"
                                />
                              </div>
                            </div>

                            {/* Parameters */}
                            <div className="md:col-span-4 space-y-1.5">
                              <span className="flex items-center gap-1 font-mono text-[8px] font-black uppercase text-[#0f4369]">
                                <Sliders size={9} /> Parámetros Objetivo
                              </span>
                              <div className="space-y-1 max-h-24 overflow-y-auto">
                                {Object.entries(item.parameters || {}).map(([pk, pv]) => (
                                  <div key={pk} className="flex items-center gap-1">
                                    <span className="px-1.5 py-0.5 bg-[#1c1c19] text-white font-mono text-[8px] font-bold truncate max-w-[90px]">
                                      {pk}
                                    </span>
                                    <input
                                      type="text"
                                      value={pv}
                                      onChange={(e) =>
                                        handleUpdateAction(item, {
                                          parameters: {
                                            ...item.parameters,
                                            [pk]: e.target.value
                                          }
                                        })
                                      }
                                      className="flex-1 px-1.5 py-0.5 text-[9px] font-mono bg-white border border-[#1c1c19]/30"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* RIGHT COLUMN: LIVE REVIT PLUGIN PAYLOAD & RECEIVER INSTRUCTIONS */}
          {showJsonPanel && (
            <div className="lg:col-span-4 space-y-4">
              <div className="bg-[#1c1c19] text-white border-[3px] border-[#1c1c19] shadow-[8px_8px_0_0_rgba(15,67,105,1)] p-5 sticky top-24">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-mono text-[8px] font-black uppercase text-yellow-400 tracking-widest">
                      SALIDA PARA REVIEW PLUGIN (.RVT)
                    </span>
                    <h3 className="text-sm font-black uppercase tracking-tight">
                      JSON de Cola de Acciones Revit
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyPluginJson}
                    className="px-3 py-1.5 bg-yellow-400 text-[#1c1c19] hover:bg-white font-mono text-[9px] font-black uppercase flex items-center gap-1"
                  >
                    {copiedPayload ? <Check size={12} /> : <Copy size={12} />}
                    {copiedPayload ? 'Copiado' : 'Copiar JSON'}
                  </button>
                </div>

                <p className="text-[10px] text-white/70 mb-3 leading-relaxed">
                  Pega este JSON directamente en la pestaña{' '}
                  <strong className="text-yellow-400">⚡ Esquemas & Acciones IA</strong> dentro del Plugin de Revit (o cárgalo desde la nube en el plugin) para simular y ejecutar toda la secuencia en tu modelo activo.
                </p>

                <pre className="w-full h-[420px] overflow-y-auto p-3 bg-black/70 text-green-300 font-mono text-[9.5px] border border-white/15 leading-relaxed">
                  {JSON.stringify(compiledPayload, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevitActionsTabView;
