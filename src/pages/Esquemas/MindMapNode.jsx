import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  ChevronRight,
  ChevronDown,
  FileJson,
  Trash2,
  Eye,
  EyeOff,
  Type,
  Image as ImageIcon,
  ExternalLink,
  RefreshCw,
  Upload,
  Check,
  Edit3,
  Cpu,
  Layers,
  Sliders,
  Filter,
  Wrench
} from 'lucide-react';
import { REVIT_CATEGORIES, REVIT_TOOLS, DEFAULT_REVIT_ACTION } from './constants';

const NODE_PALETTE = [
  { name: 'Blanco', value: '#ffffff' },
  { name: 'Crema', value: '#fcf9f4' },
  { name: 'Amarillo', value: '#fef9c3' },
  { name: 'Verde', value: '#dcfce7' },
  { name: 'Azul', value: '#e0f2fe' },
  { name: 'Rosa', value: '#fce7f3' },
  { name: 'Morado', value: '#f3e8ff' },
  { name: 'Naranja', value: '#ffedd5' }
];

const ContentBlockEditor = ({ node, allSchemas = [], onNavigateSchema, onSaveContent }) => {
  const getInitialType = () => {
    if (node.blockType) return node.blockType;
    if (node.revitAction) return 'revit_action';
    if (Array.isArray(node.blocks) && node.blocks.length > 0) {
      return node.blocks[0].type || 'text';
    }
    if (node.description && node.description.trim()) return 'text';
    return 'unselected';
  };

  const getInitialValue = () => {
    if (Array.isArray(node.blocks) && node.blocks.length > 0 && !node.description) {
      return node.blocks[0].value || '';
    }
    return node.description || '';
  };

  const getInitialRevitAction = () => {
    if (node.revitAction && typeof node.revitAction === 'object') {
      return {
        ...DEFAULT_REVIT_ACTION,
        ...node.revitAction,
        filter: {
          ...DEFAULT_REVIT_ACTION.filter,
          ...(node.revitAction.filter || {})
        },
        parameters: {
          ...(node.revitAction.parameters || {})
        }
      };
    }
    return { ...DEFAULT_REVIT_ACTION };
  };

  const [blockType, setBlockType] = useState(getInitialType);
  const [content, setContent] = useState(getInitialValue);
  const [revitAction, setRevitAction] = useState(getInitialRevitAction);
  const [newParamKey, setNewParamKey] = useState('');
  const [newParamVal, setNewParamVal] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setBlockType(getInitialType());
    setContent(getInitialValue());
    setRevitAction(getInitialRevitAction());
    setIsDirty(false);
  }, [node.id, node.description, node.blockType, node.revitAction]);

  const commitSave = (nextType, nextValue, nextRevitAction = revitAction) => {
    setIsDirty(false);
    onSaveContent(node.id, {
      blockType: nextType,
      description: nextValue,
      revitAction: nextType === 'revit_action' ? nextRevitAction : null
    });
  };

  const handleSelectType = (newType) => {
    setBlockType(newType);
    if (newType === 'unselected') {
      setContent('');
      commitSave('unselected', '', null);
    } else if (newType === 'revit_action') {
      const initialRa = node.revitAction ? getInitialRevitAction() : { ...DEFAULT_REVIT_ACTION };
      setRevitAction(initialRa);
      commitSave('revit_action', content, initialRa);
    } else {
      commitSave(newType, content, null);
    }
  };

  const handleImageFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setContent(dataUrl);
      commitSave('image', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const updateRevitField = (field, value) => {
    const updated = { ...revitAction, [field]: value };
    setRevitAction(updated);
    commitSave('revit_action', content, updated);
  };

  const updateRevitFilter = (filterKey, value) => {
    const updated = {
      ...revitAction,
      filter: {
        ...(revitAction.filter || {}),
        [filterKey]: value
      }
    };
    setRevitAction(updated);
    setIsDirty(true);
  };

  const updateRevitParam = (key, value) => {
    const updatedParams = { ...(revitAction.parameters || {}) };
    if (value === null) {
      delete updatedParams[key];
    } else {
      updatedParams[key] = value;
    }
    const updated = { ...revitAction, parameters: updatedParams };
    setRevitAction(updated);
    commitSave('revit_action', content, updated);
  };

  const handleAddParam = () => {
    const k = newParamKey.trim();
    if (!k) return;
    updateRevitParam(k, newParamVal);
    setNewParamKey('');
    setNewParamVal('');
  };

  const handleSelectToolPreset = (toolId) => {
    const toolObj = REVIT_TOOLS.find((t) => t.id === toolId);
    const currentParams = revitAction.parameters || {};
    const hasExistingParams = Object.keys(currentParams).length > 0;
    const nextParams = hasExistingParams
      ? currentParams
      : { ...(toolObj?.defaultParameters || { Comments: 'ACTUALIZADO BIM' }) };

    const updated = {
      ...revitAction,
      tool: toolId,
      parameters: nextParams
    };
    setRevitAction(updated);
    commitSave('revit_action', content, updated);
  };

  const currentCategoryInfo = REVIT_CATEGORIES.find((c) => c.id === revitAction.category) || REVIT_CATEGORIES[0];
  const currentToolInfo = REVIT_TOOLS.find((t) => t.id === revitAction.tool) || REVIT_TOOLS[0];

  return (
    <div
      className="px-4 py-3 border-t-2 border-[#1c1c19]/15 bg-white/85 backdrop-blur-sm space-y-2.5 cursor-default"
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top Bar: Current Type + Switch Option */}
      <div className="flex items-center justify-between">
        <span className="font-mono text-[8px] font-black uppercase tracking-widest text-[#0f4369]">
          {blockType === 'unselected' && 'SELECCIONAR FORMATO DE NODO'}
          {blockType === 'text' && '📝 TEXTO / NOTA TÉCNICA'}
          {blockType === 'image' && '🖼️ IMAGEN / DIAGRAMA'}
          {blockType === 'vease' && '🔗 VÉASE (IR A ESQUEMA)'}
          {blockType === 'revit_action' && '⚡ ACCIÓN / PROCESO REVIT'}
        </span>

        {blockType !== 'unselected' && (
          <div className="flex items-center gap-1.5">
            {blockType !== 'revit_action' && (
              <button
                type="button"
                onClick={() => handleSelectType('revit_action')}
                className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono font-black uppercase bg-[#0f4369] text-white border border-[#1c1c19] hover:bg-[#e62020] transition-colors"
                title="Convertir este nodo en una Acción de Revit"
              >
                <Cpu size={9} /> + CAPA REVIT
              </button>
            )}
            <button
              type="button"
              onClick={() => setBlockType('unselected')}
              className="flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-mono font-black uppercase text-[#72777f] hover:text-[#1c1c19] hover:bg-black/5 border border-transparent hover:border-[#1c1c19]/20 transition-colors"
              title="Cambiar tipo de contenido"
            >
              <RefreshCw size={9} /> Cambiar tipo
            </button>
          </div>
        )}
      </div>

      {/* OPTION SELECTOR (4 exclusive options including REVIT ACTION) */}
      {blockType === 'unselected' && (
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => handleSelectType('revit_action')}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] hover:bg-[#1c1c19] font-mono text-[8px] font-black uppercase transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none"
          >
            <Cpu size={14} className="text-yellow-400" />
            <span>Acción Revit</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectType('text')}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-[#fcf9f4] hover:bg-[#0f4369] hover:text-white text-[#1c1c19] border-2 border-[#1c1c19] font-mono text-[8px] font-black uppercase transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none"
          >
            <Type size={14} />
            <span>Texto / Proceso</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectType('image')}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-[#fcf9f4] hover:bg-[#0f4369] hover:text-white text-[#1c1c19] border-2 border-[#1c1c19] font-mono text-[8px] font-black uppercase transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none"
          >
            <ImageIcon size={14} />
            <span>Imagen</span>
          </button>
          <button
            type="button"
            onClick={() => handleSelectType('vease')}
            className="flex flex-col items-center justify-center gap-1 py-2.5 px-2 bg-[#fcf9f4] hover:bg-amber-400 text-[#1c1c19] border-2 border-[#1c1c19] font-mono text-[8px] font-black uppercase transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none"
          >
            <ExternalLink size={14} />
            <span>Véase</span>
          </button>
        </div>
      )}

      {/* OPTION 1: TEXT */}
      {blockType === 'text' && (
        <div className="space-y-1.5">
          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              setIsDirty(true);
            }}
            onBlur={() => {
              if (isDirty) commitSave('text', content);
            }}
            placeholder="Escribe el contenido o protocolo técnico de este nodo..."
            rows={Math.min(8, Math.max(3, (content || '').split('\n').length))}
            className="w-full p-2 text-[11px] font-medium text-[#1c1c19] bg-white border border-[#1c1c19]/30 focus:border-[#0f4369] focus:outline-none resize-y leading-relaxed"
          />
          {isDirty && (
            <button
              type="button"
              onClick={() => commitSave('text', content)}
              className="w-full py-1 bg-green-600 text-white font-mono text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1 border border-[#1c1c19]"
            >
              <Check size={11} /> Guardar Texto
            </button>
          )}
        </div>
      )}

      {/* OPTION 2: IMAGE */}
      {blockType === 'image' && (
        <div className="space-y-2">
          <div className="flex gap-1">
            <input
              type="text"
              value={content?.startsWith('data:image') ? '' : content}
              onChange={(e) => {
                setContent(e.target.value);
                setIsDirty(true);
              }}
              onBlur={() => {
                if (isDirty) commitSave('image', content);
              }}
              placeholder="Pega URL de imagen (https://...)"
              className="flex-1 px-2 py-1.5 text-[10px] font-mono bg-white border border-[#1c1c19]/30 focus:border-[#0f4369] focus:outline-none"
            />
            <label className="px-2.5 py-1.5 bg-[#0f4369] text-white font-mono text-[9px] font-black uppercase cursor-pointer hover:bg-[#1c1c19] transition-colors flex items-center gap-1 border border-[#1c1c19]">
              <Upload size={11} />
              <span>Subir</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageFileUpload}
                className="hidden"
              />
            </label>
          </div>
          {content && (
            <div className="overflow-hidden border border-[#1c1c19]/20 bg-[#fcf9f4] p-1">
              <img
                src={content}
                alt={node.name}
                className="w-full max-h-44 object-contain bg-white"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* OPTION 3: VEASE */}
      {blockType === 'vease' && (
        <div className="space-y-2">
          <select
            value={content}
            onChange={(e) => {
              const val = e.target.value;
              setContent(val);
              commitSave('vease', val);
            }}
            className="w-full px-2 py-1.5 text-[10px] font-mono font-bold bg-[#fef9c3] border border-[#1c1c19]/40 text-[#1c1c19] focus:outline-none"
          >
            <option value="">— Seleccionar esquema destino —</option>
            {allSchemas.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>

          {content && (
            <button
              type="button"
              onClick={() => onNavigateSchema && onNavigateSchema(content)}
              className="w-full flex items-center justify-between px-2.5 py-1.5 bg-[#1c1c19] text-white hover:bg-[#0f4369] font-mono text-[9px] font-black uppercase tracking-wider transition-colors"
            >
              <span className="truncate">
                Ir a: {allSchemas.find((s) => String(s.id) === String(content))?.title || 'Esquema vinculado'}
              </span>
              <ExternalLink size={11} />
            </button>
          )}
        </div>
      )}

      {/* OPTION 4: REVIT ACTION LAYER */}
      {blockType === 'revit_action' && (
        <div className="space-y-2.5 bg-[#f8fafc] border-2 border-[#0f4369]/30 p-2.5">
          {/* Row 1: Category & Tool */}
          <div className="grid grid-cols-1 gap-2">
            <div>
              <label className="flex items-center gap-1 font-mono text-[8px] font-black uppercase text-[#0f4369] mb-0.5">
                <Layers size={10} /> Categoría Revit (BuiltInCategory)
              </label>
              <select
                value={revitAction.category || 'Walls'}
                onChange={(e) => updateRevitField('category', e.target.value)}
                className="w-full px-2 py-1.5 text-[10px] font-mono font-bold bg-white border border-[#1c1c19] text-[#1c1c19] focus:outline-none focus:border-[#0f4369]"
              >
                {REVIT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.label} [{cat.id}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-1 font-mono text-[8px] font-black uppercase text-[#0f4369] mb-0.5">
                <Wrench size={10} /> Herramienta / Acción del Plugin
              </label>
              <select
                value={revitAction.tool || 'modify_parameters'}
                onChange={(e) => handleSelectToolPreset(e.target.value)}
                className="w-full px-2 py-1.5 text-[10px] font-mono font-bold bg-[#0f4369] text-white border border-[#1c1c19] focus:outline-none"
              >
                {REVIT_TOOLS.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.icon} {tool.label}
                  </option>
                ))}
              </select>
              <p className="text-[9px] text-[#72777f] mt-0.5 leading-snug">
                {currentToolInfo?.description}
              </p>
            </div>
          </div>

          {/* Row 2: Order & Phase */}
          <div className="grid grid-cols-3 gap-1.5">
            <div>
              <label className="block font-mono text-[7px] font-black uppercase text-[#72777f]">
                Orden #
              </label>
              <input
                type="number"
                min="1"
                value={revitAction.order || 1}
                onChange={(e) => updateRevitField('order', Number(e.target.value) || 1)}
                className="w-full px-1.5 py-1 text-[10px] font-mono font-black bg-white border border-[#1c1c19]/40"
              />
            </div>
            <div className="col-span-2">
              <label className="block font-mono text-[7px] font-black uppercase text-[#72777f]">
                Fase / Etapa
              </label>
              <input
                type="text"
                value={revitAction.phase || ''}
                onChange={(e) => updateRevitField('phase', e.target.value)}
                placeholder="Ej. Fase 1: Normalización"
                className="w-full px-2 py-1 text-[10px] font-mono bg-white border border-[#1c1c19]/40"
              />
            </div>
          </div>

          {/* Row 3: Selection Filters */}
          <div className="border-t border-[#1c1c19]/15 pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 font-mono text-[8px] font-black uppercase text-[#1c1c19]">
                <Filter size={9} /> Filtro de Elementos en Revit
              </span>
              <span className="font-mono text-[7px] text-[#72777f] uppercase">
                Vacío = Todos en {revitAction.category}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <input
                type="text"
                value={revitAction.filter?.type_name || ''}
                onChange={(e) => updateRevitFilter('type_name', e.target.value)}
                onBlur={() => isDirty && commitSave('revit_action', content, revitAction)}
                placeholder="Tipo contiene (ej. 15cm)"
                className="px-1.5 py-1 text-[9px] font-mono bg-white border border-[#1c1c19]/30 focus:border-[#0f4369] focus:outline-none"
              />
              <input
                type="text"
                value={revitAction.filter?.family_name || ''}
                onChange={(e) => updateRevitFilter('family_name', e.target.value)}
                onBlur={() => isDirty && commitSave('revit_action', content, revitAction)}
                placeholder="Familia contiene..."
                className="px-1.5 py-1 text-[9px] font-mono bg-white border border-[#1c1c19]/30 focus:border-[#0f4369] focus:outline-none"
              />
              <input
                type="text"
                value={revitAction.filter?.level_name || ''}
                onChange={(e) => updateRevitFilter('level_name', e.target.value)}
                onBlur={() => isDirty && commitSave('revit_action', content, revitAction)}
                placeholder="Nivel (ej. Nivel 1)"
                className="px-1.5 py-1 text-[9px] font-mono bg-white border border-[#1c1c19]/30 focus:border-[#0f4369] focus:outline-none"
              />
              <input
                type="text"
                value={revitAction.filter?.search_text || ''}
                onChange={(e) => updateRevitFilter('search_text', e.target.value)}
                onBlur={() => isDirty && commitSave('revit_action', content, revitAction)}
                placeholder="Texto libre / Plano..."
                className="px-1.5 py-1 text-[9px] font-mono bg-white border border-[#1c1c19]/30 focus:border-[#0f4369] focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Parameters Key-Value Editor */}
          <div className="border-t border-[#1c1c19]/15 pt-2">
            <div className="flex items-center justify-between mb-1">
              <span className="flex items-center gap-1 font-mono text-[8px] font-black uppercase text-[#0f4369]">
                <Sliders size={9} /> Parámetros / Configuración de Acción
              </span>
            </div>

            {/* Quick Suggested Parameter Pills */}
            {currentCategoryInfo?.sampleParams && (
              <div className="flex flex-wrap gap-1 mb-1.5">
                {currentCategoryInfo.sampleParams.slice(0, 4).map((paramName) => (
                  <button
                    key={paramName}
                    type="button"
                    onClick={() => {
                      if (!(paramName in (revitAction.parameters || {}))) {
                        updateRevitParam(paramName, '');
                      }
                    }}
                    className="px-1.5 py-0.5 bg-[#e0f2fe] hover:bg-[#0f4369] hover:text-white text-[#0f4369] font-mono text-[7px] font-bold border border-[#0f4369]/30 transition-colors"
                    title={`Añadir parámetro ${paramName}`}
                  >
                    + {paramName}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
              {Object.entries(revitAction.parameters || {}).map(([pKey, pVal]) => (
                <div key={pKey} className="flex items-center gap-1">
                  <span className="px-1.5 py-1 bg-[#1c1c19] text-white font-mono text-[8px] font-bold min-w-[85px] truncate" title={pKey}>
                    {pKey}
                  </span>
                  <input
                    type="text"
                    value={pVal}
                    onChange={(e) => {
                      const nextParams = { ...(revitAction.parameters || {}), [pKey]: e.target.value };
                      setRevitAction({ ...revitAction, parameters: nextParams });
                      setIsDirty(true);
                    }}
                    onBlur={() => isDirty && commitSave('revit_action', content, revitAction)}
                    placeholder="Valor..."
                    className="flex-1 px-1.5 py-1 text-[9px] font-mono bg-white border border-[#1c1c19]/30 focus:border-[#0f4369] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => updateRevitParam(pKey, null)}
                    className="p-1 text-red-600 hover:bg-red-50"
                    title="Eliminar parámetro"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new custom parameter */}
            <div className="flex items-center gap-1 mt-1.5">
              <input
                type="text"
                value={newParamKey}
                onChange={(e) => setNewParamKey(e.target.value)}
                placeholder="Parámetro (ej. Comments)"
                className="w-2/5 px-1.5 py-1 text-[8px] font-mono bg-white border border-[#1c1c19]/30"
              />
              <input
                type="text"
                value={newParamVal}
                onChange={(e) => setNewParamVal(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddParam()}
                placeholder="Valor a inyectar..."
                className="flex-1 px-1.5 py-1 text-[8px] font-mono bg-white border border-[#1c1c19]/30"
              />
              <button
                type="button"
                onClick={handleAddParam}
                className="px-2 py-1 bg-[#0f4369] text-white font-mono text-[8px] font-black uppercase hover:bg-[#1c1c19]"
              >
                +
              </button>
            </div>
          </div>

          {/* Optional note */}
          <div>
            <input
              type="text"
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setIsDirty(true);
              }}
              onBlur={() => isDirty && commitSave('revit_action', content, revitAction)}
              placeholder="Nota o protocolo de esta acción..."
              className="w-full px-2 py-1 text-[9px] font-mono bg-white border border-[#1c1c19]/25 text-[#5a5d62]"
            />
          </div>
        </div>
      )}
    </div>
  );
};

const MindMapNode = ({
  node,
  onSelect,
  onToggleText,
  onToggleBranch,
  onStartConnect,
  onCompleteConnect,
  onStartDrag,
  onContextMenu,
  onQuickAdd,
  onDeleteNode,
  onOpenJsonModal,
  onSaveNodeContent,
  onNodeResize,
  allSchemas = [],
  onNavigateSchema,
  isSelected,
  isIsolated,
  isCreatorMode,
  isHighlighterActive,
  isConnecting = false,
  isAdmin
}) => {
  const isRoot = node.id === 'root';
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(node.name || '');
  const cardRef = useRef(null);

  useEffect(() => {
    setTitleInput(node.name || '');
  }, [node.name]);

  // Measure actual rendered height so layoutTree never overlaps expanded nodes
  useEffect(() => {
    if (!cardRef.current || !onNodeResize) return;
    const el = cardRef.current;

    const reportSize = () => {
      const width = el.offsetWidth;
      const height = el.offsetHeight;
      if (width > 0 && height > 0) {
        onNodeResize(node.id, { width, height });
      }
    };

    reportSize();
    const observer = new ResizeObserver(reportSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, [node.id, node.isTextExpanded, node.description, node.blockType, node.revitAction, onNodeResize]);

  const handleSaveTitle = () => {
    setIsEditingTitle(false);
    const trimmed = titleInput.trim();
    if (trimmed && trimmed !== node.name && onSaveNodeContent) {
      onSaveNodeContent(node.id, { name: trimmed });
    } else {
      setTitleInput(node.name || '');
    }
  };

  const handleColorSelect = (e, colorValue) => {
    e.stopPropagation();
    if (onSaveNodeContent) {
      onSaveNodeContent(node.id, { bgColor: colorValue });
    }
  };

  const customBg = node.bgColor || null;
  const isRevitNode = node.blockType === 'revit_action' || !!node.revitAction;
  const revitCat = isRevitNode
    ? REVIT_CATEGORIES.find((c) => c.id === node.revitAction?.category)
    : null;
  const revitTool = isRevitNode
    ? REVIT_TOOLS.find((t) => t.id === (node.revitAction?.tool || node.revitAction?.action))
    : null;

  const getHeaderStyles = () => {
    if (isSelected) return 'bg-[#0f4369] text-white ring-4 ring-[#0f4369]/20';
    if (isRoot) return 'bg-[#1c1c19] text-white';
    if (isRevitNode) return 'bg-[#f0f9ff] text-[#1c1c19]';
    if (node.depth === 1) return 'bg-white text-[#1c1c19]';
    return 'bg-[#fcf9f4] text-[#1c1c19]';
  };

  const getBorderStyles = () => {
    if (isSelected) return 'border-[3px] border-[#0f4369] shadow-[8px_8px_0_0_rgba(15,67,105,1)]';
    if (isRoot) return 'border-[3px] border-[#0f4369] shadow-[8px_8px_0_0_rgba(15,67,105,0.4)]';
    if (isRevitNode) return 'border-[2.5px] border-[#0284c7] shadow-[6px_6px_0_0_rgba(2,132,199,0.85)]';
    if (node.depth === 1) return 'border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,1)]';
    return 'border border-[#1c1c19]/30 shadow-[4px_4px_0_0_rgba(28,28,25,0.08)]';
  };

  const handlePortMouseDown = (e, portSide) => {
    e.stopPropagation();
    e.preventDefault();
    let startPos = { x: node.x + node.width, y: node.y + node.height / 2 };
    if (portSide === 'left') startPos = { x: node.x, y: node.y + node.height / 2 };
    if (portSide === 'top') startPos = { x: node.x + node.width / 2, y: node.y };
    if (portSide === 'bottom') startPos = { x: node.x + node.width / 2, y: node.y + node.height };
    onStartConnect(e, node.id, startPos, portSide);
  };

  return (
    <div
      style={{
        left: `${node.x}px`,
        top: `${node.y}px`,
        width: `${node.width}px`
      }}
      onContextMenu={(e) => onContextMenu(e, node)}
      onMouseDown={(e) => {
        if (e.button !== 0) return;
        onStartDrag(e, node);
      }}
      onMouseUp={(e) => {
        if (isConnecting && onCompleteConnect) {
          e.stopPropagation();
          onCompleteConnect(node.id);
        }
      }}
      className={`absolute select-none transition-shadow duration-200 group ${
        isSelected ? 'z-30' : 'z-10'
      } ${isHighlighterActive ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
    >
      {/* 4-SIDED CONNECTION PORTS (Right, Left, Top, Bottom) */}
      {/* RIGHT PORT */}
      <div
        onMouseDown={(e) => handlePortMouseDown(e, 'right')}
        onMouseUp={(e) => {
          if (isConnecting && onCompleteConnect) {
            e.stopPropagation();
            onCompleteConnect(node.id, 'right');
          }
        }}
        className={`absolute -right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#0f4369] border-2 border-white shadow-md cursor-crosshair z-50 flex items-center justify-center transition-all hover:scale-125 hover:bg-[#e62020] ${
          isConnecting || isCreatorMode
            ? 'opacity-100 scale-110'
            : 'opacity-0 group-hover:opacity-100'
        }`}
        title="Arrastra para conectar cable a la derecha"
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full pointer-events-none" />
      </div>

      {/* LEFT PORT */}
      <div
        onMouseDown={(e) => handlePortMouseDown(e, 'left')}
        onMouseUp={(e) => {
          if (isConnecting && onCompleteConnect) {
            e.stopPropagation();
            onCompleteConnect(node.id, 'left');
          }
        }}
        className={`absolute -left-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#0f4369] border-2 border-white shadow-md cursor-crosshair z-50 flex items-center justify-center transition-all hover:scale-125 hover:bg-[#e62020] ${
          isConnecting || isCreatorMode
            ? 'opacity-100 scale-110'
            : 'opacity-0 group-hover:opacity-100'
        }`}
        title="Arrastra para conectar cable a la izquierda"
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full pointer-events-none" />
      </div>

      {/* TOP PORT */}
      <div
        onMouseDown={(e) => handlePortMouseDown(e, 'top')}
        onMouseUp={(e) => {
          if (isConnecting && onCompleteConnect) {
            e.stopPropagation();
            onCompleteConnect(node.id, 'top');
          }
        }}
        className={`absolute left-1/2 -top-3 -translate-x-1/2 w-4 h-4 rounded-full bg-[#0f4369] border-2 border-white shadow-md cursor-crosshair z-50 flex items-center justify-center transition-all hover:scale-125 hover:bg-[#e62020] ${
          isConnecting ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-90'
        }`}
        title="Conectar desde arriba"
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full pointer-events-none" />
      </div>

      {/* BOTTOM PORT */}
      <div
        onMouseDown={(e) => handlePortMouseDown(e, 'bottom')}
        onMouseUp={(e) => {
          if (isConnecting && onCompleteConnect) {
            e.stopPropagation();
            onCompleteConnect(node.id, 'bottom');
          }
        }}
        className={`absolute left-1/2 -bottom-3 -translate-x-1/2 w-4 h-4 rounded-full bg-[#0f4369] border-2 border-white shadow-md cursor-crosshair z-50 flex items-center justify-center transition-all hover:scale-125 hover:bg-[#e62020] ${
          isConnecting ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-90'
        }`}
        title="Conectar desde abajo"
      >
        <div className="w-1.5 h-1.5 bg-white rounded-full pointer-events-none" />
      </div>

      {/* FLOATING MINI PALETTE + QUICK ACTIONS ON HOVER */}
      <div
        onMouseDown={(e) => e.stopPropagation()}
        className="absolute -top-8 right-0 flex items-center gap-1 bg-[#1c1c19] text-white px-2 py-1 border border-white/20 shadow-md opacity-0 group-hover:opacity-100 transition-opacity z-40"
      >
        {/* Color Dots */}
        <div className="flex items-center gap-1 pr-1.5 mr-1 border-r border-white/20">
          {NODE_PALETTE.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={(e) => handleColorSelect(e, c.value)}
              className="w-3 h-3 rounded-full border border-white/40 hover:scale-125 transition-transform"
              style={{ backgroundColor: c.value }}
              title={`Color: ${c.name}`}
            />
          ))}
        </div>

        {/* Toggle Revit Layer on this Node */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (!onSaveNodeContent) return;
            if (isRevitNode) {
              onSaveNodeContent(node.id, {
                blockType: 'text',
                revitAction: null
              });
            } else {
              onSaveNodeContent(node.id, {
                blockType: 'revit_action',
                revitAction: { ...DEFAULT_REVIT_ACTION },
                isTextExpanded: true
              });
            }
          }}
          className={`p-0.5 transition-colors ${
            isRevitNode ? 'text-cyan-300 hover:text-white' : 'text-white/70 hover:text-cyan-300'
          }`}
          title={isRevitNode ? 'Quitar Capa de Acción Revit' : 'Activar Capa de Acción Revit en este nodo'}
        >
          <Cpu size={12} />
        </button>

        {/* Rename Title Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsEditingTitle(true);
          }}
          className="p-0.5 hover:text-yellow-400 transition-colors"
          title="Editar título del nodo"
        >
          <Edit3 size={11} />
        </button>

        {/* JSON / AI Branch Modal */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenJsonModal(node);
          }}
          className="p-0.5 hover:text-yellow-400 transition-colors"
          title="Operaciones JSON / IA de esta rama (Esquema + Revit)"
        >
          <FileJson size={12} />
        </button>

        {/* Quick Add Child Right */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAdd(node, 'right');
          }}
          className="p-0.5 hover:text-green-400 transition-colors"
          title="Añadir sub-nodo"
        >
          <Plus size={13} strokeWidth={3} />
        </button>

        {/* Delete Node */}
        {!isRoot && onDeleteNode && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteNode(node.id);
            }}
            className="p-0.5 hover:text-red-400 transition-colors"
            title="Eliminar nodo"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* MAIN CARD CONTAINER */}
      <div
        ref={cardRef}
        style={
          node.highlightColor
            ? { backgroundColor: node.highlightColor }
            : customBg && !isSelected && !isRoot
            ? { backgroundColor: customBg }
            : {}
        }
        onClick={(e) => {
          e.stopPropagation();
          onSelect(node.id, e.shiftKey || e.ctrlKey || e.metaKey);
        }}
        className={`flex flex-col transition-all duration-200 ${getHeaderStyles()} ${getBorderStyles()} ${
          isIsolated ? 'ring-4 ring-amber-400' : ''
        }`}
      >
        {/* REVIT ACTION TOP STRIP BADGE (when node has Revit Layer) */}
        {isRevitNode && (
          <div className="bg-[#0f4369] text-white px-3 py-1 flex items-center justify-between border-b border-[#1c1c19]/20">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="px-1.5 py-0.2 bg-yellow-400 text-[#1c1c19] font-mono text-[8px] font-black uppercase">
                #{node.revitAction?.order || 1}
              </span>
              <span className="font-mono text-[8px] font-black uppercase tracking-wider truncate">
                {revitCat?.icon || '🧱'} {node.revitAction?.category || 'Walls'}
              </span>
            </div>
            <span className="px-1.5 py-0.5 bg-white/15 text-cyan-200 font-mono text-[7.5px] font-black uppercase tracking-widest">
              {revitTool?.shortLabel || node.revitAction?.tool || 'MOD_PARAMS'}
            </span>
          </div>
        )}

        {/* Header Content */}
        <div className="p-3.5 flex items-center justify-between gap-2">
          <div className="flex flex-col flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className={`font-mono text-[7px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-sm ${
                  isSelected || isRoot
                    ? 'bg-white/20 text-white'
                    : 'bg-[#1c1c19]/10 text-[#72777f]'
                }`}
              >
                {isRoot ? 'ORIGEN' : `NIVEL 0${node.depth}`}
              </span>
              {node.blockType === 'vease' && (
                <span className="font-mono text-[7px] font-black uppercase px-1.5 py-0.5 bg-amber-300 text-[#1c1c19]">
                  VÉASE
                </span>
              )}
              {isRevitNode && (
                <span className="font-mono text-[7px] font-black uppercase px-1.5 py-0.5 bg-cyan-500 text-white">
                  REVIT API
                </span>
              )}
            </div>

            {isEditingTitle ? (
              <input
                type="text"
                autoFocus
                value={titleInput}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveTitle();
                  if (e.key === 'Escape') {
                    setTitleInput(node.name || '');
                    setIsEditingTitle(false);
                  }
                }}
                className="w-full px-1.5 py-0.5 text-xs font-black uppercase tracking-tight bg-white text-[#1c1c19] border-2 border-[#0f4369] focus:outline-none"
              />
            ) : (
              <h4
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  setIsEditingTitle(true);
                }}
                className={`font-black tracking-tight leading-snug break-words ${
                  isRoot
                    ? 'text-base uppercase'
                    : node.depth === 1
                    ? 'text-xs uppercase'
                    : 'text-[11px]'
                }`}
                title="Doble clic para renombrar título"
              >
                {node.name}
              </h4>
            )}

            {/* Compact summary of Revit Parameters when collapsed */}
            {isRevitNode && !node.isTextExpanded && node.revitAction?.parameters && (
              <div className="mt-1.5 flex flex-wrap gap-1">
                {Object.entries(node.revitAction.parameters)
                  .slice(0, 2)
                  .map(([k, v]) => (
                    <span
                      key={k}
                      className="px-1.5 py-0.5 bg-[#0f4369]/10 text-[#0f4369] border border-[#0f4369]/20 font-mono text-[7.5px] font-bold truncate max-w-[140px]"
                    >
                      {k}: {String(v)}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {/* Content Editor Expand/Collapse Toggle */}
            <button
              onMouseDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                onToggleText(node.id);
              }}
              className={`w-6 h-6 flex items-center justify-center rounded border transition-all ${
                node.isTextExpanded
                  ? 'bg-[#1c1c19] text-white border-white/20'
                  : 'bg-black/5 text-[#1c1c19] border-transparent hover:border-[#1c1c19]/20'
              }`}
              title={
                node.isTextExpanded
                  ? 'Ocultar configuración / contenido'
                  : 'Abrir configuración Revit / contenido'
              }
            >
              {node.isTextExpanded ? <EyeOff size={11} /> : <Eye size={11} />}
            </button>

            {/* Branch Expansion Toggle */}
            {node.hasChildren && (
              <button
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleBranch(node.id);
                }}
                className={`w-6 h-6 flex items-center justify-center rounded border transition-all ${
                  node.isBranchExpanded
                    ? 'bg-[#0f4369] text-white border-white/20'
                    : 'bg-white text-[#0f4369] border-[#0f4369]'
                }`}
                title={node.isBranchExpanded ? 'Contraer sub-rama' : 'Expandir sub-rama'}
              >
                {node.isBranchExpanded ? (
                  <ChevronDown size={13} strokeWidth={3} />
                ) : (
                  <ChevronRight size={13} strokeWidth={3} />
                )}
              </button>
            )}
          </div>
        </div>

        {/* EXPANDED INLINE CONTENT EDITOR (TEXT / IMAGE / VEASE / REVIT_ACTION) */}
        {node.isTextExpanded && (
          <ContentBlockEditor
            node={node}
            allSchemas={allSchemas}
            onNavigateSchema={onNavigateSchema}
            onSaveContent={(nodeId, payload) => {
              if (onSaveNodeContent) onSaveNodeContent(nodeId, payload);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default MindMapNode;
