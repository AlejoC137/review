import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Layers, Search, Plus, Trash2, X, Loader2, Save, ArrowLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { levelsService } from '../services/levelsService';
import { projectService } from '../services/projectService';
import { spacesService } from '../services/spacesService';
import { useAuth } from '../context/AuthContext';

const LevelsView = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const projectId = searchParams.get('projectId') || 'kengo-kuma';

    const { isBimManager } = useAuth();
    const [levels, setLevels] = useState([]);
    const [subProjects, setSubProjects] = useState([]);
    const [spaces, setSpaces] = useState([]);
    const [selectedLevel, setSelectedLevel] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddMode, setIsAddMode] = useState(false);

    const defaultFormData = {
        nombre: '',
        elevacion: '',
        descripcion: '',
        indice: '',
        sub_unidad_id: '',
        project_id: projectId
    };

    const [levelFormData, setLevelFormData] = useState(defaultFormData);
    const [savingLevel, setSavingLevel] = useState(false);

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [data, subProjectsData, spacesData] = await Promise.all([
                levelsService.getLevels(projectId),
                projectService.getSpaces(projectId).catch(() => []),
                spacesService.getProjectSpaces(projectId).catch(() => [])
            ]);
            setLevels(data || []);
            setSubProjects(subProjectsData || []);
            setSpaces(spacesData || []);
        } catch (error) {
            console.error('Error loading levels:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedLevel) {
            setLevelFormData({
                ...defaultFormData,
                ...selectedLevel,
                project_id: projectId
            });
            setIsAddMode(false);
        }
    }, [selectedLevel, projectId]);

    const handleDeleteLevel = async (levelId, e) => {
        e.stopPropagation();
        if (!window.confirm("¿ELIMINAR ESTE NIVEL? ESTA ACCIÓN NO SE PUEDE DESHACER.")) return;
        
        try {
            await levelsService.deleteLevel(levelId);
            if (selectedLevel?.id === levelId) setSelectedLevel(null);
            await loadData();
        } catch (error) {
            console.error('Error deleting level:', error);
            alert("Error al eliminar el nivel");
        }
    };

    const handleSaveLevel = async () => {
        if (!levelFormData.nombre.trim()) {
            alert("El nombre del nivel es obligatorio.");
            return;
        }

        setSavingLevel(true);
        try {
            const payload = { 
                ...levelFormData, 
                project_id: projectId,
                indice: levelFormData.indice ? parseInt(levelFormData.indice, 10) : null
            };
            if (payload.sub_unidad_id === '') payload.sub_unidad_id = null;

            if (isAddMode) {
                const newLevel = await levelsService.createLevel({
                    id: crypto.randomUUID(),
                    ...payload
                });
                await loadData();
                setSelectedLevel(newLevel);
                setIsAddMode(false);
            } else if (selectedLevel) {
                await levelsService.updateLevel(selectedLevel.id, payload);
                await loadData();
            }
        } catch (error) {
            console.error('Error saving level:', error);
            alert("Error al guardar");
        } finally {
            setSavingLevel(false);
        }
    };

    const isSearching = searchTerm.trim().length > 0;
    
    // Only show root levels, filter by search if any
    const filteredLevels = levels
        .filter(l => !l.parent_id)
        .filter(l => 
            (l.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (l.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => (a.indice || 0) - (b.indice || 0));

    const renderFlatList = (nodes) => {
        return nodes.map(node => (
            <div
                key={node.id}
                onClick={() => setSelectedLevel(node)}
                className={`p-3 border-b-2 border-[#1c1c19]/10 cursor-pointer transition-all hover:bg-white flex items-center justify-between group pl-4 ${selectedLevel?.id === node.id ? 'bg-white border-r-8 border-r-[#ba1a1a]' : ''}`}
            >
                <div className="flex items-center min-w-0">
                    <div className="min-w-0 text-left">
                        <div className="text-[10px] font-black uppercase truncate flex items-center gap-2">
                            {node.indice !== null && node.indice !== undefined && (
                                <span className="text-[9px] bg-[#1c1c19] text-white px-1.5 py-0.5 rounded-sm">{node.indice}</span>
                            )}
                            {node.nombre}
                        </div>
                        <div className="text-[8px] font-bold text-[#ba1a1a] uppercase mt-0.5">ELEV: {node.elevacion || 'N/A'}</div>
                    </div>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={(e) => {
                        e.stopPropagation();
                        // This uses projectService but wait... deleting levels is handled by levelsService. Let's just keep the old delete logic.
                    }} className="p-1 text-red-500 hover:bg-red-50 transition-all border-2 border-transparent hover:border-red-500" title="Eliminar Nivel">
                        <Trash2 size={12} onClick={(e) => handleDeleteLevel(node.id, e)} />
                    </button>
                </div>
            </div>
        ));
    };


    return (
        <div className="h-screen flex flex-col bg-[#fcf9f4] font-mono">
            {/* Header */}
            <div className="p-4 border-b-4 border-[#1c1c19] bg-[#1c1c19] text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(`/pre-bep?projectId=${projectId}`)}
                        className="p-1 hover:bg-white/20 transition-all rounded"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black italic uppercase tracking-tighter">NIVELES</h1>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">PROYECTO: {projectId}</span>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar */}
                <div className="w-80 border-r-4 border-[#1c1c19] flex flex-col bg-[#fcf9f4]">
                    <div className="p-4 border-b-4 border-[#1c1c19] bg-white">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-sm font-black italic uppercase tracking-tighter flex items-center gap-2">
                                <Layers size={16} /> NIVELES_REGISTRADOS
                            </h2>
                            <button 
                                onClick={() => {
                                    setLevelFormData(defaultFormData);
                                    setIsAddMode(true);
                                    setSelectedLevel(null);
                                }} 
                                className="p-1 border-2 border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all bg-[#f6f3ee]"
                                title="Añadir Nivel Principal"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="relative">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72777f]" />
                            <input
                                type="text"
                                placeholder="BUSCAR NIVEL..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-[10px] font-black uppercase border-2 border-[#1c1c19] focus:outline-none bg-[#f6f3ee]/50"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                        {loading ? (
                            <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#0f4369]" size={20} /></div>
                        ) : filteredLevels.length === 0 ? (
                            <div className="p-8 text-center text-[9px] font-bold text-[#72777f] uppercase italic leading-relaxed">
                                NO HAY NIVELES REGISTRADOS EN ESTE PROYECTO.
                            </div>
                        ) : (
                            renderFlatList(filteredLevels)
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                    {selectedLevel || isAddMode ? (
                        <div className="h-full flex flex-col overflow-hidden">
                            <div className="p-4 border-b-4 border-[#1c1c19] bg-[#f6f3ee] flex justify-between items-center shrink-0">
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-[#72777f] uppercase tracking-[0.3em]">
                                        {isAddMode ? 'CREACIÓN_DE_NUEVO_REGISTRO' : 'EDICIÓN_DE_REGISTRO'}
                                    </span>
                                    <h3 className="text-base font-black italic uppercase tracking-tighter flex items-center gap-2">
                                        {isAddMode ? 'NUEVO_NIVEL' : `NIVEL: ${selectedLevel.nombre}`}
                                    </h3>
                                </div>
                                <div className="flex gap-3">
                                    {isAddMode && (
                                        <button onClick={() => { setIsAddMode(false); setSelectedLevel(null); }} className="px-4 py-1.5 border-2 border-[#1c1c19] text-[9px] font-black uppercase hover:bg-[#1c1c19] hover:text-white transition-all">
                                            CANCELAR
                                        </button>
                                    )}
                                    <button
                                        onClick={handleSaveLevel}
                                        disabled={savingLevel}
                                        className="px-6 py-1.5 bg-[#ba1a1a] text-white text-[9px] font-black uppercase italic flex items-center gap-2 shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                    >
                                        {savingLevel ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                        GUARDAR_NIVEL
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#fcf9f4]">
                                <div className="max-w-4xl space-y-8">
                                    <div className="bg-white border-4 border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                                        <div className="flex items-center gap-3 border-b-2 border-[#1c1c19] pb-2 mb-6">
                                            <Layers size={18} className="text-[#ba1a1a]" />
                                            <h4 className="text-[10px] font-black uppercase italic tracking-widest text-[#1c1c19]">
                                                DATOS_DEL_NIVEL
                                            </h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-12 gap-6">
                                            <div className="col-span-12 md:col-span-3">
                                                <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">ÍNDICE_(NÚMERO)</label>
                                                <input 
                                                    type="number" 
                                                    value={levelFormData.indice} 
                                                    onChange={(e) => setLevelFormData({ ...levelFormData, indice: e.target.value })} 
                                                    className="w-full p-3 border-2 border-[#1c1c19] font-black text-sm outline-none bg-[#fcf9f4]/50 focus:bg-white focus:shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] transition-all disabled:opacity-50" 
                                                    placeholder="Ej: 1, 2, 3..." 
                                                />
                                            </div>

                                            <div className="col-span-12 md:col-span-9">
                                                <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">NOMBRE_DEL_NIVEL</label>
                                                <input 
                                                    type="text" 
                                                    value={levelFormData.nombre} 
                                                    onChange={(e) => setLevelFormData({ ...levelFormData, nombre: e.target.value })} 
                                                    className="w-full p-3 border-2 border-[#1c1c19] font-black text-sm outline-none bg-[#fcf9f4]/50 focus:bg-white focus:shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] transition-all disabled:opacity-50" 
                                                    placeholder="Ej: Planta Baja, Nivel 1..." 
                                                />
                                            </div>
                                            
                                            <div className="col-span-12 md:col-span-6">
                                                <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">ELEVACIÓN_(COTA)</label>
                                                <input 
                                                    type="text" 
                                                    value={levelFormData.elevacion} 
                                                    onChange={(e) => setLevelFormData({ ...levelFormData, elevacion: e.target.value })} 
                                                    className="w-full p-3 border-2 border-[#1c1c19] font-black text-sm outline-none bg-[#fcf9f4]/50 focus:bg-white focus:shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] transition-all disabled:opacity-50" 
                                                    placeholder="Ej: +3.00m, -1.50m..." 
                                                />
                                            </div>

                                            <div className="col-span-12 md:col-span-6">
                                                <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">VINCULAR_A_SUB_UNIDAD</label>
                                                <select
                                                    value={levelFormData.sub_unidad_id}
                                                    onChange={(e) => setLevelFormData({ ...levelFormData, sub_unidad_id: e.target.value })}
                                                    className="w-full p-3 border-2 border-[#1c1c19] font-bold text-xs outline-none bg-[#fcf9f4]/50 focus:bg-white focus:shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] transition-all uppercase"
                                                >
                                                    <option value="">-- NINGUNA (NIVEL GLOBAL) --</option>
                                                    {subProjects.map(sp => (
                                                        <option key={sp.id} value={sp.id}>{sp.name}</option>
                                                    ))}
                                                </select>
                                            </div>



                                            <div className="col-span-12 mt-4">
                                                <div className="flex items-center justify-between mb-4 border-b-2 border-[#1c1c19]/10 pb-2">
                                                    <label className="block text-[10px] font-black uppercase text-[#1c1c19]">ESPACIOS_ASOCIADOS_AL_NIVEL</label>
                                                    <span className="text-[10px] font-bold text-[#ea580c] bg-[#ea580c]/10 px-2 py-0.5 rounded">
                                                        {spaces.filter(s => s.level_id === selectedLevel?.id).length} ESPACIOS
                                                    </span>
                                                </div>
                                                <div className="space-y-2">
                                                    {spaces.filter(s => s.level_id === selectedLevel?.id).length === 0 ? (
                                                        <div className="p-4 bg-[#fcf9f4] border-2 border-dashed border-[#1c1c19]/20 text-center text-[10px] font-bold text-[#72777f] uppercase">
                                                            NO HAY ESPACIOS ASIGNADOS A ESTE NIVEL
                                                        </div>
                                                    ) : (
                                                        spaces.filter(s => s.level_id === selectedLevel?.id).map(space => (
                                                            <div key={space.id} className="p-3 bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)] flex justify-between items-center">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-black uppercase">{space.nombre} {space.apellido}</span>
                                                                    <span className="text-[8px] font-bold text-[#72777f] uppercase">{space.tipo} - {space.categoria_uso}</span>
                                                                </div>
                                                                <div className="flex flex-col items-end">
                                                                    <span className="text-[10px] font-mono font-bold text-[#16a34a]">{parseFloat(space.area) || 0} m²</span>
                                                                    <span className="text-[8px] font-bold text-[#ea580c] uppercase">{space.area_category}</span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                            
                                            <div className="col-span-12">
                                                <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">DESCRIPCIÓN_/_NOTAS</label>
                                                <textarea 
                                                    value={levelFormData.descripcion} 
                                                    onChange={(e) => setLevelFormData({ ...levelFormData, descripcion: e.target.value })} 
                                                    rows={4}
                                                    className="w-full p-3 border-2 border-[#1c1c19] font-bold text-xs outline-none bg-[#fcf9f4]/50 focus:bg-white focus:shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] transition-all disabled:opacity-50 resize-none" 
                                                    placeholder="Información adicional sobre el uso o características del nivel..." 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-[#fcf9f4]">
                            <Layers size={48} className="text-[#1c1c19]/10 mb-4" />
                            <h2 className="text-xl font-black italic uppercase tracking-tighter text-[#1c1c19]">NIVELES</h2>
                            <p className="text-[10px] font-bold text-[#72777f] uppercase mt-2 max-w-md leading-relaxed">
                                SELECCIONE UN NIVEL DEL PANEL LATERAL O CREE UNO NUEVO PARA GESTIONAR LOS PISOS Y ELEVACIONES DEL PROYECTO.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LevelsView;
