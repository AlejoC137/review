import React, { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Check, Save } from 'lucide-react';

export default function AiMarketingFillModal({ isOpen, onClose, materialType, materialTitle, currentData, onImport }) {
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setGeneratedPrompt(buildAiPrompt());
      setJsonInput('');
      setPreviewData(null);
      setError(null);
    }
  }, [isOpen, materialType, materialTitle]);

  const buildAiPrompt = () => {
    return `Actúa como un diseñador experto y genera la estructura JSON para un material de marketing de tipo "${materialType}" titulado "${materialTitle}".

### FORMATO REQUERIDO:
Debes devolver estrictamente un objeto JSON con esta estructura exacta, no añadas comillas de markdown (\`\`\`) ni texto introductorio:

{
  "width_cm": "8.5",
  "height_cm": "5.5",
  "sides": {
    "A": {
      "bg_color": "#ffffff",
      "bg_image": "",
      "bg_size": "cover",
      "elements": [
        {
          "id": "texto_1",
          "type": "text",
          "content": "TITULO PRINCIPAL",
          "x": 20,
          "y": 30,
          "width": 200,
          "height": 40,
          "fontSize": 24,
          "fontWeight": "900",
          "color": "#1c1c19",
          "textAlign": "left",
          "fontFamily": "sans-serif"
        }
      ]
    },
    "B": {
      "bg_color": "#0f4369",
      "bg_image": "",
      "bg_size": "cover",
      "elements": []
    }
  }
}

### INSTRUCCIONES:
1. Adapta el "width_cm" y "height_cm" a medidas estándar apropiadas para el formato (${materialType}).
2. El lado A suele ser la cara principal (título, eslogan, logo/nombre).
3. El lado B suele ser la información de contacto o detalles.
4. Distribuye correctamente las coordenadas (x, y) asumiendo una resolución aproximada de 40 píxeles por centímetro.
5. Utiliza tipografías con pesos "300", "400", "700" o "900".
6. Utiliza códigos hexadecimales (ej. #0f4369) para "bg_color" y "color".
7. Inventa textos atractivos de ejemplo basados en el título "${materialTitle}".`;
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt).then(() => {
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
      
      if (!parsed.sides || !parsed.sides.A || !parsed.width_cm) {
        throw new Error("El JSON debe contener la estructura correcta con 'width_cm', 'height_cm' y 'sides'.");
      }
      
      // Asegurar que los IDs son únicos para evitar conflictos
      const generateId = () => Math.random().toString(36).substr(2, 9);
      if (parsed.sides.A.elements) parsed.sides.A.elements.forEach(el => el.id = generateId());
      if (parsed.sides.B && parsed.sides.B.elements) parsed.sides.B.elements.forEach(el => el.id = generateId());

      setPreviewData(parsed);
    } catch (err) {
      setError("Error al parsear JSON. Asegúrate de copiar solo el formato JSON válido. Detalles: " + err.message);
    }
  };

  const handleApply = () => {
    if (previewData && onImport) {
      onImport(previewData);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#fcf9f4]/95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border-4 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(28,28,25,0.2)] w-full max-w-4xl my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b-2 border-[#1c1c19] bg-[#0f4369] text-white flex justify-between items-center flex-none">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-yellow-400 animate-pulse" />
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">CO-PILOTO IA: GENERAR DISEÑO</h3>
              <p className="text-[9px] text-white/70 uppercase tracking-widest font-mono">
                {materialTitle} ({materialType})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:rotate-90 transition-transform">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
          
          {/* Step 1 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-2">
              <span className="bg-[#1c1c19] text-white font-black text-xs px-2 py-1">PASO 1</span>
              <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">Copiar Prompt de Generación</h4>
            </div>
            <div className="relative">
              <textarea
                readOnly
                value={generatedPrompt}
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

          {/* Step 2 */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-2">
              <span className="bg-[#1c1c19] text-white font-black text-xs px-2 py-1">PASO 2</span>
              <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">Pegar y Validar Formato JSON</h4>
            </div>

            <div className="space-y-2">
              <textarea
                value={jsonInput}
                onChange={e => { setJsonInput(e.target.value); setPreviewData(null); setError(null); }}
                placeholder="{ ... }"
                className="w-full bg-[#1c1c19] text-green-400 font-mono border-2 border-[#1c1c19] p-4 text-[10px] focus:outline-none min-h-[150px] custom-scrollbar"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 text-xs font-bold uppercase border-l-4 border-red-500 font-sans">
                {error}
              </div>
            )}

            {!previewData ? (
              <button
                onClick={handleValidate}
                disabled={!jsonInput.trim()}
                className="w-full py-3 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] font-display font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#e5e2dd] disabled:opacity-50 transition-colors"
              >
                <Check size={16} /> VALIDAR JSON
              </button>
            ) : (
              <div className="bg-[#f6f3ee] border-2 border-[#1c1c19] p-6 space-y-4">
                <h5 className="text-[10px] font-black uppercase bg-[#1c1c19] text-white px-2 py-1 inline-block">VISTA_PREVIA_DEL_DISEÑO</h5>
                
                <div className="border border-[#1c1c19]/10 bg-white p-3 space-y-1">
                  <div className="text-[8px] font-mono text-[#72777f] uppercase font-black">TAMAÑO</div>
                  <div className="text-xs font-bold">{previewData.width_cm}cm x {previewData.height_cm}cm</div>
                  <div className="text-[9px] font-mono text-blue-600 bg-blue-50 border border-blue-100 p-2 mt-2 uppercase font-black">
                    ✓ Contiene {(previewData.sides.A?.elements?.length || 0) + (previewData.sides.B?.elements?.length || 0)} elementos detectados.
                  </div>
                </div>

                <div className="pt-2 border-t border-[#1c1c19]/10">
                  <button
                    onClick={handleApply}
                    className="w-full py-4 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-display font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#1c1c19] transition-colors shadow-[6px_6px_0_0_rgba(28,28,25,0.15)]"
                  >
                    <Save size={16} /> APLICAR DISEÑO AL CANVAS
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
