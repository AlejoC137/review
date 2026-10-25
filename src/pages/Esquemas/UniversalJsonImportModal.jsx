import React, { useState } from 'react';
import { X, Wand2, Zap, Check, Copy, Eye, Plus, RefreshCw, Cpu } from 'lucide-react';
import { generateFullSchemaAiPrompt, extractJsonFromText, normalizeImportedRevitJson } from './schemaAiPrompt';

const UniversalJsonImportModal = ({
  isOpen,
  onClose,
  onImport,
  currentTitle = '',
  mapData = null
}) => {
  const [topicInput, setTopicInput] = useState(currentTitle || '');
  const [jsonText, setJsonText] = useState('');
  const [promptCopied, setPromptCopied] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [useRevitLayer, setUseRevitLayer] = useState(true);

  if (!isOpen) return null;

  const generatedPrompt = generateFullSchemaAiPrompt(topicInput, mapData, useRevitLayer);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 3000);
  };

  const handleInject = async (replaceAll = true) => {
    if (!jsonText.trim()) return;
    setIsImporting(true);
    try {
      const rawParsed = extractJsonFromText(jsonText);
      const parsed = normalizeImportedRevitJson(rawParsed, topicInput || currentTitle || 'Proceso BIM Revit');
      await onImport(parsed, replaceAll);
      setJsonText('');
      onClose();
    } catch (err) {
      console.error('Universal JSON import error:', err);
      alert(
        'Error al leer el JSON: Asegúrate de pegar un objeto o arreglo JSON válido ({ ... } o [ ... ]).'
      );
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#fcf9f4] border-[3px] border-[#1c1c19] w-full max-w-2xl max-h-[92vh] shadow-[16px_16px_0_0_rgba(15,67,105,1)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-[#1c1c19] p-5 text-white flex justify-between items-start shrink-0">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tighter">
              Constructor IA & Inyector JSON de Esquemas Revit
            </h2>
            <p className="font-mono text-[10px] text-white/60 font-bold uppercase tracking-[0.2em] mt-1">
              Genera Esquemas con Capa de Acciones Revit o inyecta cualquier JSON de Acciones
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 transition-all"
          >
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Step 1: Prompt Builder */}
          <div className="bg-[#0f4369] p-4 border-l-8 border-[#1c1c19] text-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wand2 size={18} className="text-yellow-400" />
                <span className="text-xs font-black uppercase tracking-tight">
                  1. Generar Prompt Maestro para IA (Revit + Esquema)
                </span>
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

            <div>
              <label className="block font-mono text-[9px] uppercase text-white/80 mb-1">
                Proceso o flujo de acciones en Revit a estructurar:
              </label>
              <input
                type="text"
                value={topicInput}
                onChange={(e) => setTopicInput(e.target.value)}
                placeholder="Ej. Auditoría de muros, despiece de ladrillos, creación de tablas y láminas ISO 19650..."
                className="w-full px-3 py-2 text-xs font-bold text-[#1c1c19] bg-white border-2 border-[#1c1c19] focus:outline-none"
              />
            </div>

            {showPromptPreview && (
              <pre className="w-full max-h-40 overflow-y-auto p-2.5 bg-black/50 text-green-300 font-mono text-[9px] whitespace-pre-wrap border border-white/20">
                {generatedPrompt}
              </pre>
            )}

            <button
              type="button"
              onClick={handleCopyPrompt}
              className={`w-full py-2.5 font-black text-[10px] uppercase tracking-widest border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(0,0,0,0.3)] hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2 ${
                promptCopied
                  ? 'bg-green-400 text-[#1c1c19]'
                  : 'bg-white text-[#0f4369]'
              }`}
            >
              {promptCopied ? (
                <>
                  <Check size={14} strokeWidth={3} />
                  ¡PROMPT COPIADO AL PORTAPAPELES! PÉGALO EN TU IA
                </>
              ) : (
                <>
                  <Copy size={13} />
                  COPIAR PROMPT PARA IA (ESQUEMA + ACCIONES REVIT)
                </>
              )}
            </button>
          </div>

          {/* Step 2: Paste JSON */}
          <div>
            <label className="block font-mono text-[9px] font-black mb-2 uppercase text-[#1c1c19]/70">
              2. Pegar el código JSON (Esquema jerárquico o Lista de Acciones Revit)
            </label>
            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder={`{\n  "name": "Proceso BIM Revit",\n  "description": "Automatización de modelo",\n  "children": [\n    {\n      "name": "Codificar Muros",\n      "blockType": "revit_action",\n      "revitAction": {\n        "category": "Walls",\n        "tool": "modify_parameters",\n        "filter": { "type_name": "15" },\n        "parameters": { "Comments": "AUDITADO" }\n      }\n    }\n  ]\n}`}
              className="w-full h-48 p-3.5 font-mono text-[11px] bg-white border-2 border-[#1c1c19] focus:outline-none focus:border-[#0f4369] resize-none shadow-inner"
            />
          </div>

          {/* Step 3: Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-3 border-2 border-[#1c1c19] font-black uppercase tracking-widest text-[10px] hover:bg-[#1c1c19] hover:text-white transition-all"
            >
              CANCELAR
            </button>
            <button
              type="button"
              onClick={() => handleInject(false)}
              disabled={isImporting || !jsonText.trim()}
              className="py-3 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus size={14} />
              AÑADIR AL MAPA ACTUAL
            </button>
            <button
              type="button"
              onClick={() => handleInject(true)}
              disabled={isImporting || !jsonText.trim()}
              className="py-3 bg-[#e62020] text-white border-2 border-[#1c1c19] font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-[4px_4px_0_0_rgba(15,67,105,0.3)]"
            >
              {isImporting ? (
                <Zap size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              REEMPLAZAR ESQUEMA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UniversalJsonImportModal;
