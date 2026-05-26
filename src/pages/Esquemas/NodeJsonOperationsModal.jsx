import React, { useState } from 'react';
import { X, Wand2, Zap, Copy, Plus, RefreshCw } from 'lucide-react';

const NodeJsonOperationsModal = ({ node, onImport, onCancel, onCopyPrompt }) => {
  const [activeTab, setActiveTab] = useState('import'); // 'import' | 'export'
  const [importJsonText, setImportJsonText] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  const handleProcessImport = async (replaceBranch = false) => {
    if (!importJsonText.trim()) return;
    setIsImporting(true);
    try {
      // Robust parsing: strip markdown code fences if present
      let cleanedJson = importJsonText.trim();
      if (cleanedJson.startsWith('```')) {
        cleanedJson = cleanedJson.replace(/^```[a-z]*\n/i, '').replace(/\n```$/m, '');
      }
      
      console.log('--- ATTEMPTING JSON IMPORT ---', { replaceBranch, text: cleanedJson.substring(0, 100) + '...' });
      
      const jsonData = JSON.parse(cleanedJson);
      console.log('JSON parsed successfully:', jsonData);
      
      await onImport(jsonData, replaceBranch);
      console.log('onImport finished successfully');
      onCancel();
    } catch (err) {
      console.error('JSON Import Error:', err);
      alert("Error: El JSON no es válido. Asegúrate de copiar solo el bloque de código entre llaves { }.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleCopyNodeJson = () => {
    // We export a clean version (no UI state)
    const cleanNode = (n) => {
        const { x, y, width, height, isTextExpanded, isBranchExpanded, depth, hasDescription, hasChildren, ...rest } = n;
        return {
            ...rest,
            children: n.children && Array.isArray(n.children) ? n.children.map(cleanNode) : []
        };
    };
    const jsonStr = JSON.stringify(cleanNode(node), null, 2);
    navigator.clipboard.writeText(jsonStr);
    alert("¡Estructura JSON copiada al portapapeles!");
  };

  return (
    <div className="fixed inset-0 z-[350] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#fcf9f4] border-[3px] border-[#1c1c19] w-full max-w-xl shadow-[16px_16px_0_0_rgba(15,67,105,1)] flex flex-col transform animate-in zoom-in-95 duration-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#1c1c19] p-6 text-white flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-black uppercase tracking-tighter">Operaciones JSON</h2>
            <p className="font-mono text-[10px] text-white/60 font-bold uppercase tracking-[0.2em] mt-1">
              Nodo: <span className="text-yellow-400">{node.name}</span>
            </p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-white/10 transition-all"><X size={24} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b-2 border-[#1c1c19]">
            <button 
                onClick={() => setActiveTab('import')}
                className={`flex-1 py-4 font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'import' ? 'bg-[#fcf9f4] text-[#1c1c19]' : 'bg-[#e5e2dd] text-[#1c1c19]/40 hover:text-[#1c1c19]'}`}
            >
                Inyectar Estructura
            </button>
            <button 
                onClick={() => setActiveTab('export')}
                className={`flex-1 py-4 font-black uppercase tracking-widest text-xs transition-all ${activeTab === 'export' ? 'bg-[#fcf9f4] text-[#1c1c19]' : 'bg-[#e5e2dd] text-[#1c1c19]/40 hover:text-[#1c1c19]'}`}
            >
                Extraer Rama (Export)
            </button>
        </div>

        <div className="p-8">
            {activeTab === 'import' ? (
                <>
                    <div className="mb-6 bg-[#0f4369] p-4 border-l-8 border-[#1c1c19] text-white">
                        <div className="flex items-center gap-3 mb-2">
                            <Wand2 size={18} className="text-yellow-400" />
                            <p className="text-xs font-bold uppercase tracking-tight">¿No tienes el JSON?</p>
                        </div>
                        <p className="text-[10px] opacity-80 leading-relaxed mb-3">
                            Copia el Paquete AI estructurado. Pídele que genere el CONTENIDO REALISTA (matrices, tablas, protocolos) para "{node.name}" y pega el JSON resultante aquí abajo.
                        </p>
                        <button 
                            onClick={onCopyPrompt}
                            className="w-full py-2 bg-white text-[#0f4369] font-black text-[10px] uppercase tracking-widest border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(0,0,0,0.2)] hover:translate-y-0.5 hover:shadow-none transition-all"
                        >
                            COPIAR PROMPT PARA AI
                        </button>
                    </div>

                    <label className="block font-mono text-[9px] font-black mb-2 uppercase opacity-60">Pegar Código JSON del sub-árbol</label>
                    <textarea
                        autoFocus
                        value={importJsonText}
                        onChange={(e) => setImportJsonText(e.target.value)}
                        placeholder={`{ "children": [...] }`}
                        className="w-full h-48 p-4 font-mono text-[11px] bg-white border-2 border-[#1c1c19] focus:outline-none focus:border-[#0f4369] resize-none mb-6 shadow-inner"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button onClick={onCancel} className="py-3 border-2 border-[#1c1c19] font-black uppercase tracking-widest text-[10px] hover:bg-[#1c1c19] hover:text-white transition-all">CANCELAR</button>
                        <button 
                            onClick={() => handleProcessImport(false)}
                            disabled={isImporting || !importJsonText.trim()}
                            className="py-3 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-black uppercase tracking-widest text-[10px] hover:bg-gray-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {isImporting ? <Zap size={14} className="animate-spin" /> : <Plus size={14} />}
                            AÑADIR SUB-NODOS
                        </button>
                        <button 
                            onClick={() => handleProcessImport(true)}
                            disabled={isImporting || !importJsonText.trim()}
                            className="py-3 bg-[#e62020] text-white border-2 border-[#1c1c19] font-black uppercase tracking-widest text-[10px] hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-[4px_4px_0_0_rgba(15,67,105,0.3)]"
                        >
                            {isImporting ? <Zap size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                            REEMPLAZAR TODO
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center text-center py-4">
                    <div className="w-16 h-16 bg-[#e5e2dd] border-2 border-[#1c1c19] flex items-center justify-center mb-6 shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
                        <Copy size={32} className="text-[#1c1c19]" />
                    </div>
                    <h3 className="text-lg font-black uppercase tracking-tighter mb-2">Exportar Rama Seleccionada</h3>
                    <p className="font-mono text-[11px] text-[#72777f] uppercase tracking-widest mb-8 max-w-sm">
                        Esto copiará toda la jerarquía de "{node.name}" (incluyendo todos sus sub-nodos hijos) al portapapeles.
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
