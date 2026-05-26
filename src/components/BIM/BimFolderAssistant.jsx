import React, { useState, useMemo } from 'react';
import { 
    X, Folder, Cloud, HardDrive, Download, 
    ArrowRight, CheckCircle2, AlertTriangle, ChevronRight,
    Zap, Layout, ShieldCheck, Layers
} from 'lucide-react';

const BimFolderAssistant = ({ isOpen, onClose, mapData, planName, onDownloadBat, onDownloadCloud }) => {
    const [excludedModes, setExcludedModes] = useState(new Set());

    const structureStats = useMemo(() => {
        if (!mapData) return { counts: { LOCAL: 0, CLOUD: 0 } };
        
        const counts = { LOCAL: 0, CLOUD: 0 };
        const traverseCounts = (node, parentMode = 'LOCAL') => {
            const currentMode = !node.storage_mode || node.storage_mode === 'INHERIT' ? parentMode : node.storage_mode;
            
            if (currentMode === 'LOCAL' || currentMode === 'BOTH') counts.LOCAL++;
            if (currentMode === 'CLOUD' || currentMode === 'BOTH') counts.CLOUD++;
            
            if (node.children) node.children.forEach(child => traverseCounts(child, currentMode));
        };

        traverseCounts(mapData);
        return { counts };
    }, [mapData]);

    if (!isOpen) return null;

    const toggleMode = (mode) => {
        const newExcluded = new Set(excludedModes);
        if (newExcluded.has(mode)) newExcluded.delete(mode);
        else newExcluded.add(mode);
        setExcludedModes(newExcluded);
    };

    const filterOptions = [
        { id: 'LOCAL', label: 'LOCAL_STORAGE', icon: HardDrive, color: 'text-amber-600' },
        { id: 'CLOUD', label: 'CLOUD_NUBE', icon: Cloud, color: 'text-blue-500' }
    ];

    return (
        <div className="fixed inset-0 z-[500] bg-[#1c1c19]/90 backdrop-blur-md flex items-center justify-center p-4 font-mono">
            <div className="bg-[#fcf9f4] border-[4px] border-[#1c1c19] w-full max-w-4xl shadow-[24px_24px_0_0_rgba(15,67,105,0.4)] flex flex-col max-h-[90vh] overflow-hidden relative">
                
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 via-[#0f4369] to-blue-500" />
                
                <div className="bg-[#1c1c19] text-white p-6 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-amber-400 text-[#1c1c19] flex items-center justify-center shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]">
                            <Zap size={24} fill="currentColor" />
                        </div>
                        <div>
                            <h2 className="font-black uppercase tracking-[6px] text-xl">FOLDER_ASSISTANT_V2</h2>
                            <p className="text-[8px] tracking-[4px] text-amber-400/60 uppercase">MATERIALIZACIÓN_SELECTIVA: {planName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="hover:rotate-90 transition-transform p-2 border-2 border-white/10 rounded-full">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white/50 gap-12">
                    {/* THE 3 FILTER BUTTONS */}
                    <div className="grid grid-cols-3 gap-8 w-full max-w-4xl">
                        {filterOptions.map(opt => {
                            const isActive = !excludedModes.has(opt.id);
                            const count = structureStats.counts[opt.id];
                            return (
                                <button
                                    key={opt.id}
                                    onClick={() => toggleMode(opt.id)}
                                    className={`flex flex-col items-center gap-6 p-10 border-[4px] transition-all relative group ${
                                        isActive 
                                        ? 'bg-white border-[#1c1c19] shadow-[16px_16px_0_0_rgba(28,28,25,1)] hover:-translate-y-2' 
                                        : 'bg-gray-50 border-gray-200 text-gray-300 grayscale opacity-40 hover:opacity-60'
                                    }`}
                                >
                                    <opt.icon size={48} className={isActive ? opt.color : 'text-gray-200'} />
                                    <div className="flex flex-col items-center text-center">
                                        <span className="text-[42px] font-black leading-none mb-2">{count}</span>
                                        <span className="text-[12px] font-black uppercase tracking-[4px]">{opt.label}</span>
                                    </div>
                                    <div className={`absolute top-4 right-4 w-6 h-6 border-2 flex items-center justify-center ${isActive ? 'bg-[#1c1c19] border-[#1c1c19]' : 'border-gray-200'}`}>
                                        {isActive && <ArrowRight size={14} className="text-white" />}
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* THE 1 DOWNLOAD BUTTON */}
                    <div className="w-full max-w-2xl mt-4">
                        <button
                            onClick={() => { onDownloadBat(excludedModes); onClose(); }}
                            className="w-full bg-[#1c1c19] text-white p-10 flex items-center justify-center gap-6 shadow-[20px_20px_0_0_rgba(15,67,105,0.5)] group hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all border-[4px] border-[#1c1c19]"
                        >
                            <div className="w-16 h-16 bg-amber-400 text-[#1c1c19] flex items-center justify-center group-hover:scale-110 transition-transform shadow-[4px_4px_0_0_rgba(255,255,255,0.3)]">
                                <Download size={32} />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="text-[24px] font-black uppercase tracking-[8px]">MATERIALIZAR_ESTRUCTURA</span>
                                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-[4px]">GENERAR SCRIPT .BAT AUTOMATIZADO</span>
                            </div>
                        </button>
                    </div>

                    <p className="text-[9px] uppercase font-black opacity-30 tracking-[4px] mt-8">
                        * EL SCRIPT CREARÁ LA JERARQUÍA COMPLETA HASTA LOS NODOS SELECCIONADOS
                    </p>
                </div>

                <div className="bg-[#f6f3ee] border-t-4 border-[#1c1c19] p-4 flex justify-center shrink-0">
                    <button onClick={onClose} className="text-[10px] font-black uppercase tracking-[3px] opacity-40 hover:opacity-100 transition-opacity">
                        CERRAR_Y_CANCELAR
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BimFolderAssistant;
