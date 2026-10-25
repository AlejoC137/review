import React, { useState } from 'react';
import { X, Wand2, Zap, Copy, Plus, RefreshCw, Check, Eye, Cpu } from 'lucide-react';
import { generateBranchAiPrompt, extractJsonFromText, normalizeImportedRevitJson } from './schemaAiPrompt';

const NodeJsonOperationsModal = ({ node, mapData, onImport, onCancel }) => {
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'export'
  const [importJsonText, setImportJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [useRevitLayer, setUseRevitLayer] = useState(true);

  const contextualPrompt = generateBranchAiPrompt(
    mapData || { id: 'root', name: 'Esquema General', children: [] },
    node,
    useRevitLayer
  );

  const handleCopyContextualPrompt = () => {
    navigator.clipboard.writeText(contextualPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 3000);
  };

  const handleProcessImport = async (replaceBranch = false) => {
    if (!importJsonText.trim()) return;
    setIsImporting(true);
    try {
      const rawJson = extractJsonFromText(importJsonText);
      const normalizedJson = normalizeImportedRevitJson(rawJson, node.name);
      await onImport(normalizedJson, replaceBranch);
      onCancel();
    } catch (err) {
      console.error('JSON Import Error:', err);
      alert(
        'Error: El JSON no es válido. Asegúrate de pegar el bloque JSON completo generado por la IA ({ ... } o [ ... ]).'
      );
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopyNodeJson = () => {
    const cleanNode = (n) => {
      const {
        x,
        y,
        width,
        height,
        isTextExpanded,
        isBranchExpanded,
        depth,
        hasDescription,
        hasChildren,
        path,
        ...rest
      } = n;
      return {
        ...rest,
        children:
          n.children && Array.isArray(n.children) ? n.children.map(cleanNode) : []
      };
    };
    const jsonStr = JSON.stringify(cleanNode(node), null, 2);
    navigator.clipboard.writeText(jsonStr);
    alert('¡Estructura JSON copiada al portapapeles!');
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#fcf9f4] border-[3px] border-[#1c1c19] w-full max-w-2xl max-h-[90vh] shadow-[16px_16px_0_0_rgba(15,67,105,1)] flex flex-col transform animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1c1c19] p-5 text-white flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter">
              Operaciones JSON & IA (Rama / Acciones Revit)
            </h2>
            <p className="font-mono text-[10px] text-white/60 font-bold uppercase tracking-[0.2em] mt-1">
              Nodo Objetivo: <span className="text-yellow-400">{node.name}</span>
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-white/10 transition-all"
          >
            <X size={22} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-[#1c1c19] shrink-0">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex-1 py-3.5 font-black uppercase tracking-widest text-xs transition-all ${
              activeTab === 'import'
                ? 'bg-[#fcf9f4] text-[#1c1c19]'
                : 'bg-[#e5e2dd] text-[#1c1c19]/40 hover:text-[#1c1c19]'
            }`}
          >
            Inyectar / Generar con IA
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex-1 py-3.5 font-black uppercase tracking-widest text-xs transition-all ${
              activeTab === 'export'
                ? 'bg-[#fcf9f4] text-[#1c1c19]'
                : 'bg-[#e5e2dd] text-[#1c1c19]/40 hover:text-[#1c1c19]'
            }`}
          >
            Extraer Rama (Export)
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          {activeTab === 'import' ? (
            <>
              <div className="mb-5 bg-[#0f4369] p-4 border-l-8 border-[#1c1c19] text-white">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    <Wand2 size={18} className="text-yellow-400" />
                    <p className="text-xs font-black uppercase tracking-tight">
                      Generador Contextual con Capa Revit + Esquema
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setUseRevitLayer(!useRevitLayer)}
                      className={`px-2 py-1 text-[9px] font-mono font-black uppercase border flex items-center gap-1 transition-all ${
                        useRevitLayer
                          ? 'bg-yellow-400 text-[#1c1c19] border-[#1c1c19]'
                          : 'bg-white/10 text-white border-white/20'
                      }`}
                      title="Incluir herramientas y categorías ejecutables de Revit en el Prompt"
                    >
                      <Cpu size={11} />
                      {useRevitLayer ? 'Capa Revit: ACTIVA' : 'Solo Texto'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPromptPreview(!showPromptPreview)}
                      className="px-2 py-1 text-[9px] font-mono uppercase bg-white/10 hover:bg-white/20 text-white flex items-center gap-1 border border-white/20"
                    >
                      <Eye size={11} />
                      {showPromptPreview ? 'Ocultar Prompt' : 'Ver Prompt'}
                    </button>
                  </div>
                </div>
                <p className="text-[10px] opacity-90 leading-relaxed mb-3">
                  Este prompt incluye el árbol completo de{' '}
                  <strong>"{mapData?.name || 'Esquema'}"</strong>, el catálogo de{' '}
                  <strong>Categorías y Herramientas de Revit</strong> y le indica a la IA cómo desarrollar{' '}
                  <strong>"{node.name}"</strong> con acciones ejecutables en el Plugin de Revit.
                </p>

                {showPromptPreview && (
                  <pre className="w-full max-h-40 overflow-y-auto p-2.5 mb-3 bg-black/50 text-green-300 font-mono text-[9px] whitespace-pre-wrap border border-white/20">
                    {contextualPrompt}
                  </pre>
                )}

                <button
                  onClick={handleCopyContextualPrompt}
                  className={`w-full py-2.5 font-black text-[10px] uppercase tracking-widest border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2 ${
                    promptCopied
                      ? 'bg-green-400 text-[#1c1c19]'
                      : 'bg-white text-[#0f4369]'
                  }`}
                >
                  {promptCopied ? (
                    <>
                      <Check size={14} strokeWidth={3} />
                      ¡PROMPT REVIT + ESQUEMA COPIADO! PÉGALO EN TU IA
                    </>
                  ) : (
                    <>
                      <Copy size={13} />
                      COPIAR PROMPT CONTEXTUAL PARA IA (REVIT + ESQUEMA)
                    </>
                  )}
                </button>
              </div>

              <label className="block font-mono text-[9px] font-black mb-2 uppercase opacity-70">
                Pegar respuesta JSON de la IA o Cola de Acciones Revit (acepta árbol o lista de acciones)
              </label>
              <textarea
                autoFocus
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder={`{\n  "name": "${node.name}",\n  "description": "...",\n  "children": [\n    {\n      "name": "Acción Revit",\n      "blockType": "revit_action",\n      "revitAction": { "category": "Walls", "tool": "modify_parameters", "parameters": { "Comments": "OK" } }\n    }\n  ]\n}`}
                className="w-full h-44 p-3.5 font-mono text-[11px] bg-white border-2 border-[#1c1c19] focus:outline-none focus:border-[#0f4369] resize-none mb-5 shadow-inner"
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={onCancel}
                  className="py-3 border-2 border-[#1c1c19] font-black uppercase tracking-widest text-[10px] hover:bg-[#1c1c19] hover:text-white transition-all"
                >
                  CANCELAR
                </button>
                <button
                  onClick={() => handleProcessImport(false)}
                  disabled={isImporting || !importJsonText.trim()}
                  className="py-3 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isImporting ? (
                    <Zap size={14} className="animate-spin" />
                  ) : (
                    <Plus size={14} />
                  )}
                  AÑADIR SUB-NODOS
                </button>
                <button
                  onClick={() => handleProcessImport(true)}
                  disabled={isImporting || !importJsonText.trim()}
                  className="py-3 bg-[#e62020] text-white border-2 border-[#1c1c19] font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[4px_4px_0_0_rgba(15,67,105,0.3)]"
                >
                  {isImporting ? (
                    <Zap size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  REEMPLAZAR RAMA
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center text-center py-4">
              <div className="w-16 h-16 bg-[#e5e2dd] border-2 border-[#1c1c19] flex items-center justify-center mb-6 shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
                <Copy size={32} className="text-[#1c1c19]" />
              </div>
              <h3 className="text-lg font-black uppercase tracking-tighter mb-2">
                Exportar Rama Seleccionada
              </h3>
              <p className="font-mono text-[11px] text-[#72777f] uppercase tracking-widest mb-8 max-w-sm">
                Esto copiará toda la jerarquía de "{node.name}" (incluyendo sus acciones de Revit y sub-nodos) al portapapeles.
              </p>

              <button
                onClick={handleCopyNodeJson}
                className="w-full py-4 bg-[#1c1c19] text-white font-black uppercase tracking-[0.3em] text-[11px] border-2 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(15,67,105,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all flex items-center justify-center gap-3"
              >
                <Zap size={18} className="text-yellow-400" />
                COPIAR ESTRUCTURA JSON
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeJsonOperationsModal;
