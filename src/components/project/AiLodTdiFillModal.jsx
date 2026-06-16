import React, { useState } from 'react';
import { X, Sparkles, Check, Copy, AlertCircle, Loader2, Save } from 'lucide-react';
import { projectService } from '../../services/projectService';

export default function AiLodTdiFillModal({ isOpen, onClose, projectId, onComplete }) {
  const [jsonInput, setJsonInput] = useState('');
  const [error, setError] = useState(null);
  const [isPopulating, setIsPopulating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewData, setPreviewData] = useState(null);

  if (!isOpen) return null;

  const promptTemplate = `Genera un JSON con los elementos de la matriz LOD y TDI para este proyecto.
El JSON debe ser un arreglo de objetos, donde cada objeto represente un elemento con el siguiente formato estricto:

[
  {
    "discipline": "Estructura",
    "element": "Columnas",
    "abbreviation": "CLM",
    "esquema": { "aem": "ARQ", "lod": 200 },
    "anteproyecto": { "aem": "ARQ", "lod": 300 },
    "finales": { "aem": "EST", "lod": 350 },
    "notes": "Notas adicionales del elemento"
  }
]

Devuelve SOLO un bloque de código JSON válido, sin explicaciones ni texto adicional.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(promptTemplate).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleValidate = () => {
    setError(null);
    setPreviewData(null);
    try {
      let cleanJson = jsonInput.trim();
      if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/```json/g, '').trim();
      if (cleanJson.endsWith('```')) cleanJson = cleanJson.replace(/```/g, '').trim();
      
      const parsed = JSON.parse(cleanJson);
      
      if (!Array.isArray(parsed)) {
        throw new Error("El JSON debe ser un arreglo (array) de objetos.");
      }
      
      if (parsed.length === 0) {
        throw new Error("El arreglo JSON está vacío.");
      }

      // Check format of first item to ensure it's roughly correct
      const first = parsed[0];
      if (!first.discipline || !first.element) {
        throw new Error("Cada objeto debe contener al menos 'discipline' y 'element'.");
      }

      setPreviewData(parsed);
    } catch (err) {
      setError("Error al parsear JSON. Asegúrate de copiar solo el formato JSON válido. Detalles: " + err.message);
    }
  };

  const handleSave = async () => {
    if (!previewData || previewData.length === 0) return;
    setIsPopulating(true);
    setError(null);
    try {
      const elementsToSave = previewData.map(item => {
        const notesObj = {
          esquema: item.esquema || { aem: '', lod: '' },
          anteproyecto: item.anteproyecto || { aem: '', lod: '' },
          finales: item.finales || { aem: '', lod: '' },
          text: item.notes || '',
          abbreviation: item.abbreviation || ''
        };

        const maxLod = Math.max(
          parseInt(notesObj.esquema.lod) || 0,
          parseInt(notesObj.anteproyecto.lod) || 0,
          parseInt(notesObj.finales.lod) || 0
        );

        return {
          discipline: item.discipline,
          element_name: item.element,
          lod: maxLod === 0 ? 100 : maxLod,
          tdi: [],
          notes: JSON.stringify(notesObj)
        };
      });

      await projectService.saveLodTdiMatrixBatch(projectId, elementsToSave);
      
      if (onComplete) {
        await onComplete();
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError("Error al guardar en base de datos: " + err.message);
    } finally {
      setIsPopulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#fcf9f4]/95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border-4 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(28,28,25,0.2)] w-full max-w-4xl my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b-2 border-[#1c1c19] bg-[#0f4369] text-white flex justify-between items-center flex-none">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-yellow-400 animate-pulse" />
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">CO-PILOTO IA: IMPORTAR MATRIZ LOD/TDI</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:rotate-90 transition-transform">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
          
          {/* Step 1: Prompt */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-2">
              <span className="bg-[#1c1c19] text-white font-black text-xs px-2 py-1">PASO 1</span>
              <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">Copiar Prompt Base</h4>
            </div>
            
            <p className="text-[10px] uppercase font-bold text-[#72777f] leading-normal font-sans">
              Copia este prompt y úsalo en tu IA para generar los elementos con el formato correcto.
            </p>

            <div className="relative">
              <textarea
                readOnly
                value={promptTemplate}
                className="w-full bg-[#f6f3ee] border-2 border-[#1c1c19] p-4 text-[9px] font-mono focus:outline-none min-h-[150px] max-h-[250px] custom-scrollbar"
              />
              <button
                onClick={handleCopyPrompt}
                className={`absolute right-3 bottom-3 px-4 py-2 border-2 font-display font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all ${copied ? 'bg-green-600 text-white border-green-800' : 'bg-[#1c1c19] text-white border-[#1c1c19] hover:bg-[#0f4369]'}`}
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? 'COPIADO' : 'COPIAR PROMPT'}
              </button>
            </div>
          </div>

          {/* Step 2: Paste JSON */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-2">
              <span className="bg-[#1c1c19] text-white font-black text-xs px-2 py-1">PASO 2</span>
              <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">Pegar JSON Generado</h4>
            </div>

            <p className="text-[10px] uppercase font-bold text-[#72777f] leading-normal font-sans">
              Pega aquí la respuesta en formato JSON de la IA.
            </p>

            <textarea
              value={jsonInput}
              onChange={(e) => {
                setJsonInput(e.target.value);
                setError(null);
                setPreviewData(null);
              }}
              placeholder="Pega el JSON aquí..."
              className={`w-full bg-white border-2 p-4 text-[10px] font-mono focus:outline-none min-h-[200px] max-h-[400px] custom-scrollbar transition-colors ${error ? 'border-red-500' : 'border-[#1c1c19] focus:border-[#0f4369]'}`}
            />

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 border border-red-200 text-xs font-bold font-mono">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <button
              onClick={handleValidate}
              disabled={!jsonInput.trim()}
              className="w-full flex justify-center items-center gap-2 py-3 bg-[#f6f3ee] border-2 border-[#1c1c19] text-[#1c1c19] font-black text-xs uppercase tracking-widest hover:bg-[#1c1c19] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Validar JSON
            </button>
          </div>

          {/* Step 3: Confirmation */}
          {previewData && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-2">
                <span className="bg-green-600 text-white font-black text-xs px-2 py-1">PASO 3</span>
                <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">Confirmar Importación</h4>
              </div>

              <div className="bg-green-50 border-2 border-green-600 p-4">
                <p className="text-xs font-bold text-green-800 mb-2">¡JSON Validado Correctamente!</p>
                <p className="text-[10px] text-green-700">Se detectaron <strong>{previewData.length}</strong> elementos para importar.</p>
                <ul className="list-disc pl-4 mt-2 text-[10px] text-green-700 font-mono">
                  {previewData.slice(0, 3).map((item, idx) => (
                    <li key={idx}>{item.discipline} - {item.element}</li>
                  ))}
                  {previewData.length > 3 && <li>...y {previewData.length - 3} más</li>}
                </ul>
              </div>

              <button
                onClick={handleSave}
                disabled={isPopulating}
                className="w-full flex justify-center items-center gap-2 py-4 bg-[#00ff9d] border-2 border-[#1c1c19] text-[#1c1c19] font-black text-sm uppercase tracking-widest shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
              >
                {isPopulating ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Guardando matriz...
                  </>
                ) : (
                  <>
                    <Save size={18} />
                    Importar Elementos
                  </>
                )}
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
