import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Building2, Box, Search, Plus, Trash2, X, Loader2, Layers, Save, Package, Lock, Edit3 } from 'lucide-react';
import { spacesService } from '../services/spacesService';
import { componentsService } from '../services/componentsService';
import { getMaterials } from '../services/materialsService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { levelsService } from '../services/levelsService';


const SpacesView = ({ subProjectId = null, projectId: propProjectId = null }) => {
    const { projectId: urlProjectId } = useParams();
    const [searchParams] = useSearchParams();
    const queryProjectId = searchParams.get('projectId');
    const projectId = propProjectId || urlProjectId || queryProjectId || '';
    
    console.log("SpacesView Debug - propProjectId:", propProjectId);
    console.log("SpacesView Debug - urlProjectId:", urlProjectId);
    console.log("SpacesView Debug - queryProjectId:", queryProjectId);
    console.log("SpacesView Debug - Final projectId:", projectId);

    const { isBimManager } = useAuth();
    const [spaces, setSpaces] = useState([]);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [isAddMode, setIsAddMode] = useState(false);

    // Catalog Data
    const [allComponents, setAllComponents] = useState([]);
    const [allMaterials, setAllMaterials] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [levels, setLevels] = useState([]);
    const [showTemplatePicker, setShowTemplatePicker] = useState(false);
    const [showMaterialPicker, setShowMaterialPicker] = useState(false);
    const [showComponentPicker, setShowComponentPicker] = useState(false);
    const [activeCompIdx, setActiveCompIdx] = useState(null);
    const [matSearch, setMatSearch] = useState('');
    const [compSearch, setCompSearch] = useState('');
    const [isAddingNewComponent, setIsAddingNewComponent] = useState(false);
    const [newCompName, setNewCompName] = useState('');
    const [editingComp, setEditingComp] = useState(null);
    const [editCompData, setEditCompData] = useState({ element_name: '' });

    const [spaceFormData, setSpaceFormData] = useState({
        nombre: '',
        apellido: '',
        tipo: 'Espacio',
        categoria_uso: 'General',
        piso: '',
        level_id: '',
        area: 0,
        area_category: 'Construida',
        componentes: [],
        subProject_id: subProjectId
    });
    const [savingSpace, setSavingSpace] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, [subProjectId, projectId]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [spacesData, compsData, matsData, templatesData] = await Promise.all([
                spacesService.getAllSpacesAndElements(subProjectId),
                componentsService.getComponents(),
                getMaterials(),
                spacesService.getTemplates()
            ]);
            setSpaces(spacesData || []);
            setAllComponents(compsData || []);
            setAllMaterials(matsData || []);
            setTemplates(templatesData || []);
            
            if (projectId) {
                const levelsData = await levelsService.getLevels(projectId);
                setLevels(levelsData || []);
            }
        } catch (error) {
            console.error('Error loading initial data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedSpace) {
            let parsedComps = [];
            try {
                parsedComps = typeof selectedSpace.componentes === 'string'
                    ? JSON.parse(selectedSpace.componentes)
                    : (selectedSpace.componentes || []);
            } catch (e) { parsedComps = []; }

            setSpaceFormData({
                nombre: selectedSpace.nombre || '',
                apellido: selectedSpace.apellido || '',
                tipo: selectedSpace.tipo || 'Espacio',
                categoria_uso: selectedSpace.categoria_uso || 'General',
                piso: selectedSpace.piso || '',
                level_id: selectedSpace.level_id || '',
                area: selectedSpace.area || 0,
                area_category: selectedSpace.area_category || 'Construida',
                componentes: Array.isArray(parsedComps) ? parsedComps : [],
                subProject_id: selectedSpace.subProject_id || subProjectId
            });
            setIsAddMode(false);
        }
    }, [selectedSpace]);

    const handleCloneTemplate = (template) => {
        let parsedComps = [];
        try {
            parsedComps = typeof template.componentes === 'string'
                ? JSON.parse(template.componentes)
                : (template.componentes || []);
        } catch (e) { parsedComps = []; }

        setSpaceFormData({
            nombre: template.nombre,
            apellido: template.apellido || '',
            tipo: template.tipo || 'Espacio',
            categoria_uso: template.categoria_uso || 'General',
            piso: template.piso || '',
            level_id: template.level_id || '',
            area: template.area || 0,
            area_category: template.area_category || 'Construida',
            componentes: Array.isArray(parsedComps) ? parsedComps : [],
            subProject_id: subProjectId
        });
        setShowTemplatePicker(false);
        setIsAddMode(true);
    };

    const handleDeleteTemplate = async (templateId, e) => {
        e.stopPropagation();
        if (!isBimManager) {
            alert("Acción reservada para BIM Manager");
            return;
        }
        if (!window.confirm("¿ELIMINAR ESTA PLANTILLA GLOBAL? (ESTO NO AFECTARÁ A LOS ESPACIOS YA CLONADOS)")) return;
        try {
            await spacesService.deleteSpace(templateId);
            const templatesData = await spacesService.getTemplates();
            setTemplates(templatesData || []);
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    const handleDeleteSpace = async (spaceId, e) => {
        e.stopPropagation();
        // Check if it's a template or a unit space
        const spaceToDelete = spaces.find(s => s.id === spaceId);
        if (!spaceToDelete) return;

        if (spaceToDelete.subProject_id === null && !isBimManager) {
            alert("Solo el BIM Manager puede eliminar plantillas globales.");
            return;
        }

        if (!window.confirm("¿ELIMINAR ESTE REGISTRO?")) return;
        try {
            await spacesService.deleteSpace(spaceId);
            if (selectedSpace?.id === spaceId) setSelectedSpace(null);
            const updatedSpaces = await spacesService.getAllSpacesAndElements(subProjectId);
            setSpaces(updatedSpaces);
        } catch (error) {
            console.error('Error deleting space:', error);
        }
    };

    const handleCreateCatalogComponent = async () => {
        if (!newCompName.trim() || !isBimManager) return;
        try {
            await componentsService.createComponent({
                id: crypto.randomUUID(),
                element_name: newCompName
            });
            const compsData = await componentsService.getComponents();
            setAllComponents(compsData || []);
            setNewCompName('');
            setIsAddingNewComponent(false);
        } catch (error) {
            console.error('Error creating catalog component:', error);
        }
    };

    const handleDeleteCatalogComponent = async (compId, e) => {
        e.stopPropagation();
        if (!isBimManager) return;
        if (!window.confirm("¿ELIMINAR ESTE COMPONENTE DEL CATÁLOGO GLOBAL? (NO AFECTARÁ A LOS ESPACIOS QUE YA LO USAN)")) return;
        try {
            await componentsService.deleteComponent(compId);
            const compsData = await componentsService.getComponents();
            setAllComponents(compsData || []);
        } catch (error) {
            console.error('Error deleting catalog component:', error);
        }
    };

    const handleUpdateCatalogComponent = async () => {
        if (!editingComp || !isBimManager) return;
        try {
            await componentsService.updateComponent(editingComp.id, editCompData);
            const compsData = await componentsService.getComponents();
            setAllComponents(compsData || []);
            setEditingComp(null);
        } catch (error) {
            console.error('Error updating catalog component:', error);
        }
    };

    const handleSaveSpace = async (asTemplate = false) => {
        if (!spaceFormData.nombre.trim()) return;

        // Security check
        if (asTemplate && !isBimManager) {
            alert("No tienes permisos para crear o modificar plantillas globales.");
            return;
        }

        setSavingSpace(true);
        try {
            const payload = {
                ...spaceFormData,
                componentes: JSON.stringify(spaceFormData.componentes),
                subProject_id: asTemplate ? null : subProjectId
            };

            if (isAddMode) {
                const newSpace = await spacesService.createSpace({
                    id: crypto.randomUUID(),
                    ...payload
                });

                if (asTemplate) {
                    const templatesData = await spacesService.getTemplates();
                    setTemplates(templatesData || []);
                    alert("Plantilla global creada exitosamente");
                } else {
                    const updatedSpaces = await spacesService.getAllSpacesAndElements(subProjectId);
                    setSpaces(updatedSpaces);
                    setSelectedSpace(newSpace);
                }
                setIsAddMode(false);
            } else if (selectedSpace) {
                await spacesService.updateSpace(selectedSpace.id, payload);
                if (selectedSpace.subProject_id === null) {
                    const templatesData = await spacesService.getTemplates();
                    setTemplates(templatesData || []);
                } else {
                    const updatedSpaces = await spacesService.getAllSpacesAndElements(subProjectId);
                    setSpaces(updatedSpaces);
                }
            }
        } catch (error) {
            console.error('Error saving space:', error);
            alert("Error al guardar");
        } finally {
            setSavingSpace(false);
        }
    };

    const handleAddComponent = () => {
        setSpaceFormData(prev => ({
            ...prev,
            componentes: [...prev.componentes, { component_id: '', material_id: '', notas: '' }]
        }));
    };

    const handleUpdateAssignedComponent = (index, field, value) => {
        const updated = [...spaceFormData.componentes];
        updated[index] = { ...updated[index], [field]: value };
        setSpaceFormData(prev => ({ ...prev, componentes: updated }));
    };

    const handleRemoveComponent = (index) => {
        setSpaceFormData(prev => ({
            ...prev,
            componentes: prev.componentes.filter((_, i) => i !== index)
        }));
    };

    const filteredSpaces = spaces.filter(s => {
        const matchesSearch = (s.nombre || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || s.tipo === filterType;
        const matchesCategory = filterCategory === 'all' || s.categoria_uso === filterCategory;
        return matchesSearch && matchesType && matchesCategory;
    });

    return (
        <div className="h-full flex bg-white font-mono overflow-hidden border-t-4 border-[#1c1c19] relative">
            {/* Template Picker Modal */}
            {showTemplatePicker && (
                <div className="absolute inset-0 z-[100] bg-[#1c1c19]/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-[#1c1c19] w-full max-w-2xl shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex flex-col max-h-[80vh]">
                        <div className="p-4 border-b-4 border-[#1c1c19] bg-[#f6f3ee] flex justify-between items-center">
                            <h3 className="text-sm font-black italic uppercase tracking-widest">GESTOR_DE_PLANTILLAS_GLOBALES</h3>
                            <button onClick={() => setShowTemplatePicker(false)} className="p-1 hover:bg-[#1c1c19] hover:text-white transition-all"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-1 custom-scrollbar bg-[#fcf9f4]">
                            {(() => {
                                const filteredTemplates = filterType === 'all'
                                    ? templates
                                    : templates.filter(t => t.tipo === filterType);

                                if (filteredTemplates.length === 0) {
                                    return <p className="text-[10px] font-bold text-[#72777f] text-center py-10 uppercase">NO HAY PLANTILLAS DISPONIBLES {filterType !== 'all' ? `PARA ${filterType.toUpperCase()}` : ''}</p>;
                                }

                                return filteredTemplates.map(t => (
                                    <div key={t.id} className="flex gap-1">
                                        <button
                                            onClick={() => handleCloneTemplate(t)}
                                            className="flex-1 py-1 px-3 border-2 border-[#1c1c19] hover:bg-[#0f4369] hover:text-white transition-all flex items-center justify-between group bg-white"
                                        >
                                            <div className="text-left w-full">
                                                <div className="text-[10px] font-black uppercase tracking-tight flex items-center gap-2">
                                                    <span className="text-[#1c1c19] group-hover:text-white transition-colors">{t.nombre}</span>
                                                    <span className="text-[#0f4369] group-hover:text-white/80 transition-colors opacity-80">{t.apellido}</span>
                                                    <span className="text-[8px] font-bold text-[#72777f] group-hover:text-white/60 transition-colors ml-auto border-l-2 border-[#1c1c19]/10 pl-2">
                                                        {t.tipo}
                                                    </span>
                                                </div>
                                            </div>
                                            <Plus size={14} className="opacity-0 group-hover:opacity-100 transition-all" />
                                        </button>
                                        {isBimManager && (
                                            <button
                                                onClick={(e) => handleDeleteTemplate(t.id, e)}
                                                className="px-3 border-2 border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-all bg-white"
                                                title="Eliminar plantilla global"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ));
                            })()}
                        </div>
                        <div className="p-4 border-t-4 border-[#1c1c19] bg-white flex justify-between items-center">
                            <div className="flex gap-2">
                                {isBimManager && (
                                    <button
                                        onClick={() => {
                                            setIsAddMode(true);
                                            setSelectedSpace(null);
                                            setSpaceFormData({ nombre: '', apellido: '', tipo: 'Espacio', piso: '', level_id: '', area: 0, area_category: 'Construida', componentes: [], subProject_id: null });
                                            setShowTemplatePicker(false);
                                        }}
                                        className="px-4 py-1.5 border-2 border-[#1c1c19] text-[9px] font-black uppercase bg-[#f6f3ee] hover:bg-[#1c1c19] hover:text-white transition-all"
                                    >
                                        NUEVA_PLANTILLA_GLOBAL
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        setIsAddMode(true);
                                        setSelectedSpace(null);
                                        setSpaceFormData({ nombre: '', apellido: '', tipo: 'Espacio', piso: '', level_id: '', area: 0, area_category: 'Construida', componentes: [], subProject_id: subProjectId });
                                        setShowTemplatePicker(false);
                                    }}
                                    className="px-4 py-1.5 border-2 border-[#1c1c19] text-[9px] font-black uppercase hover:bg-[#1c1c19] hover:text-white transition-all"
                                >
                                    CREAR_SOLO_PARA_ESTA_UNIDAD
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Material Picker Modal */}
            {showMaterialPicker && (
                <div className="absolute inset-0 z-[110] bg-[#1c1c19]/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-[#1c1c19] w-full max-w-3xl shadow-[12px_12px_0_0_rgba(15,67,105,1)] flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b-4 border-[#1c1c19] bg-[#0f4369] text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Package size={18} />
                                <h3 className="text-sm font-black italic uppercase tracking-widest">SELECTOR_DE_ACABADOS_Y_MATERIALES</h3>
                            </div>
                            <button onClick={() => setShowMaterialPicker(false)} className="p-1 hover:bg-white hover:text-[#0f4369] transition-all"><X size={20} /></button>
                        </div>

                        <div className="p-4 bg-[#f6f3ee] border-b-2 border-[#1c1c19]">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72777f]" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="BUSCAR MATERIAL POR NOMBRE, CATEGORÍA O PROVEEDOR..."
                                    value={matSearch}
                                    onChange={(e) => setMatSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 text-[11px] font-black uppercase border-2 border-[#1c1c19] focus:outline-none bg-white shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-2 custom-scrollbar bg-[#fcf9f4]">
                            {allMaterials
                                .filter(m =>
                                    (m.Nombre || '').toLowerCase().includes(matSearch.toLowerCase()) ||
                                    (m.categoria || '').toLowerCase().includes(matSearch.toLowerCase()) ||
                                    (m.proveedor || '').toLowerCase().includes(matSearch.toLowerCase())
                                )
                                .map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => {
                                            handleUpdateAssignedComponent(activeCompIdx, 'material_id', m.id);
                                            setShowMaterialPicker(false);
                                            setMatSearch('');
                                        }}
                                        className="w-full py-1 px-3 border-2 border-[#1c1c19] bg-white hover:bg-[#0f4369] hover:text-white transition-all flex items-center gap-3 text-left group overflow-hidden"
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-tight whitespace-nowrap">{m.Nombre}</span>
                                        <span className="text-[10px] font-black text-[#0f4369] group-hover:text-white/80 transition-colors uppercase opacity-80 border-l-2 border-[#1c1c19]/10 pl-2 whitespace-nowrap">
                                            {m.categoria}
                                        </span>
                                        <span className="text-[8px] font-bold text-[#72777f] group-hover:text-white/60 transition-colors uppercase truncate max-w-[100px]">
                                            {m.proveedor || 'S.P'}
                                        </span>
                                        <span className="text-[8px] font-bold text-[#72777f] group-hover:text-white/60 transition-colors uppercase italic truncate max-w-[150px]">
                                            {m.uso_recomendado || 'USO_GRAL'}
                                        </span>
                                        <span className="text-[10px] font-black ml-auto border-l-2 border-[#1c1c19]/10 pl-3">
                                            {m.precio_COP ? `$${Number(m.precio_COP).toLocaleString()}` : '---'}
                                        </span>
                                    </button>
                                ))
                            }
                        </div>
                    </div>
                </div>
            )}

            {/* Component Picker Modal */}
            {showComponentPicker && (
                <div className="absolute inset-0 z-[120] bg-[#1c1c19]/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white border-4 border-[#1c1c19] w-full max-w-2xl shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex flex-col max-h-[85vh]">
                        <div className="p-4 border-b-4 border-[#1c1c19] bg-[#1c1c19] text-white flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <Box size={18} />
                                <h3 className="text-sm font-black italic uppercase tracking-widest">CATÁLOGO_MAESTRO_DE_COMPONENTES</h3>
                            </div>
                            <button onClick={() => { setShowComponentPicker(false); setCompSearch(''); setIsAddingNewComponent(false); }} className="p-1 hover:bg-white hover:text-[#1c1c19] transition-all"><X size={20} /></button>
                        </div>

                        <div className="p-4 bg-[#f6f3ee] border-b-2 border-[#1c1c19]">
                            <div className="relative">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72777f]" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="BUSCAR COMPONENTE..."
                                    value={compSearch}
                                    onChange={(e) => setCompSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 text-[11px] font-black uppercase border-2 border-[#1c1c19] focus:outline-none bg-white shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-[#fcf9f4]">
                            {editingComp ? (
                                <div className="p-4 bg-white border-2 border-[#1c1c19] space-y-4">
                                    <h4 className="text-[10px] font-black uppercase italic border-b-2 border-[#1c1c19] pb-1">EDITAR_COMPONENTE_DEL_CATÁLOGO</h4>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-[7px] font-black text-[#72777f] uppercase mb-0.5">NOMBRE_DEL_COMPONENTE</label>
                                            <input
                                                type="text"
                                                value={editCompData.element_name}
                                                onChange={(e) => setEditCompData({ ...editCompData, element_name: e.target.value })}
                                                className="w-full p-2 border-2 border-[#1c1c19] text-[10px] font-black uppercase outline-none focus:bg-[#f6f3ee]"
                                            />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={handleUpdateCatalogComponent} className="flex-1 py-2 bg-[#1c1c19] text-white text-[9px] font-black uppercase hover:bg-[#0f4369] transition-all">GUARDAR_CAMBIOS</button>
                                            <button onClick={() => setEditingComp(null)} className="px-4 py-2 border-2 border-[#1c1c19] text-[9px] font-black uppercase hover:bg-gray-100 transition-all">CANCELAR</button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                (() => {
                                    const filtered = allComponents.filter(c => (c.element_name || c.nombre || '').toLowerCase().includes(compSearch.toLowerCase()));
                                    const grouped = filtered.reduce((acc, c) => {
                                        const disc = c.discipline || 'GENERAL / SIN DISCIPLINA';
                                        if (!acc[disc]) acc[disc] = [];
                                        acc[disc].push(c);
                                        return acc;
                                    }, {});

                                    return Object.entries(grouped).sort().map(([discipline, comps]) => (
                                        <div key={discipline} className="mb-4">
                                            <h5 className="text-[8px] font-black uppercase tracking-widest text-[#1c1c19] mb-2 bg-[#f6f3ee] p-1.5 border-l-4 border-[#1c1c19]">
                                                {discipline}
                                            </h5>
                                            <div className="space-y-1 pl-2 border-l-2 border-[#1c1c19]/10">
                                                {comps.sort((a, b) => (a.element_name || a.nombre || '').localeCompare(b.element_name || b.nombre || '')).map(c => (
                                                    <div key={c.id} className="flex gap-1 group">
                                                        <button
                                                            onClick={() => {
                                                                handleUpdateAssignedComponent(activeCompIdx, 'component_id', c.id);
                                                                setShowComponentPicker(false);
                                                                setCompSearch('');
                                                            }}
                                                            className="flex-1 p-3 border-2 border-[#1c1c19] bg-white hover:bg-[#1c1c19] hover:text-white transition-all flex items-center justify-between"
                                                        >
                                                            <span className="text-[10px] font-black uppercase tracking-tight">{c.element_name || c.nombre}</span>
                                                            <span className="text-[7px] font-bold opacity-40 uppercase">LOD {c.lod || 100}</span>
                                                        </button>
                                                        {isBimManager && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingComp(c);
                                                                        setEditCompData({ element_name: c.element_name || c.nombre });
                                                                    }}
                                                                    className="px-3 border-2 border-[#1c1c19] text-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all bg-white"
                                                                >
                                                                    <Edit3 size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDeleteCatalogComponent(c.id, e)}
                                                                    className="px-3 border-2 border-[#1c1c19] text-red-500 hover:bg-red-500 hover:text-white transition-all bg-white"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ));
                                })()
                            )}
                        </div>

                        {isBimManager && (
                            <div className="p-4 border-t-4 border-[#1c1c19] bg-white">
                                {isAddingNewComponent ? (
                                    <div className="flex gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newCompName}
                                            onChange={(e) => setNewCompName(e.target.value)}
                                            placeholder="NOMBRE DEL NUEVO COMPONENTE..."
                                            className="flex-1 p-2 border-2 border-[#1c1c19] text-[10px] font-black uppercase outline-none focus:bg-[#f6f3ee]"
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateCatalogComponent()}
                                        />
                                        <button onClick={handleCreateCatalogComponent} className="px-4 py-2 bg-[#1c1c19] text-white text-[9px] font-black uppercase hover:bg-[#0f4369] transition-all">AGREGAR</button>
                                        <button onClick={() => setIsAddingNewComponent(false)} className="px-4 py-2 border-2 border-[#1c1c19] text-[9px] font-black uppercase hover:bg-gray-100 transition-all">X</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsAddingNewComponent(true)}
                                        className="w-full py-2 border-2 border-dashed border-[#1c1c19] text-[9px] font-black uppercase hover:bg-[#f6f3ee] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> REGISTRAR_NUEVO_COMPONENTE_EN_CATÁLOGO
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <div className="w-72 border-r-4 border-[#1c1c19] flex flex-col bg-[#fcf9f4]">
                <div className="p-4 border-b-4 border-[#1c1c19] bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-black italic uppercase tracking-tighter flex items-center gap-2">
                            <Layers size={16} /> {subProjectId ? 'ESPACIOS_UNIDAD' : 'PLANTILLAS_GLOBALES'}
                        </h2>
                        {/* Allowed for all if in unit context, or if BIM manager */}
                        {(subProjectId || isBimManager) && (
                            <button onClick={() => subProjectId ? setShowTemplatePicker(true) : setIsAddMode(true)} className="p-1 border-2 border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all">
                                <Plus size={16} />
                            </button>
                        )}
                    </div>
                    <div className="relative mb-3">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72777f]" />
                        <input
                            type="text"
                            placeholder="BUSCAR..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-[10px] font-black uppercase border-2 border-[#1c1c19] focus:outline-none bg-[#f6f3ee]/50"
                        />
                    </div>
                    <div className="flex flex-col gap-2 mb-2">
                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full p-2 text-[9px] font-black uppercase border-2 border-[#1c1c19] focus:outline-none bg-white"
                        >
                            <option value="all">TODAS LAS CATEGORÍAS</option>
                            <option value="Residencial">RESIDENCIAL</option>
                            <option value="Comercial/Oficinas">COMERCIAL / OFICINAS</option>
                            <option value="Industrial/Fábricas">INDUSTRIAL / FÁBRICAS</option>
                            <option value="Científico/Laboratorios">CIENTÍFICO / LABORATORIOS</option>
                            <option value="Educacional">EDUCACIONAL</option>
                            <option value="Salud/Hospitalario">SALUD / HOSPITALARIO</option>
                            <option value="Exteriores/Urbanismo">EXTERIORES / URBANISMO</option>
                            <option value="General">GENERAL / OTROS</option>
                        </select>
                        <div className="flex gap-1">
                            {['all', 'Espacio', 'Elemento'].map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setFilterType(t)}
                                    className={`flex-1 py-1 text-[8px] font-black uppercase border-2 border-[#1c1c19] transition-all ${filterType === t ? 'bg-[#1c1c19] text-white shadow-[2px_2px_0_0_rgba(15,67,105,1)]' : 'bg-white hover:bg-[#f6f3ee]'}`}
                                >
                                    {t === 'all' ? 'TODOS' : t}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-[#0f4369]" size={20} /></div>
                    ) : filteredSpaces.length === 0 ? (
                        <div className="p-8 text-center text-[9px] font-bold text-[#72777f] uppercase italic leading-relaxed">
                            {subProjectId ? 'NO HAY ESPACIOS ASIGNADOS A ESTA UNIDAD. PULSE "+" PARA AGREGAR DESDE PLANTILLAS.' : 'NO HAY PLANTILLAS GLOBALES CONFIGURADAS.'}
                        </div>
                    ) : filteredSpaces.map((space) => (
                        <div
                            key={space.id}
                            onClick={() => setSelectedSpace(space)}
                            className={`p-3 border-b-2 border-[#1c1c19]/10 cursor-pointer transition-all hover:bg-white flex items-center justify-between group ${selectedSpace?.id === space.id ? 'bg-white border-r-8 border-r-[#0f4369]' : ''}`}
                        >
                            <div className="min-w-0 text-left">
                                <div className="text-[10px] font-black uppercase truncate">{space.nombre} {space.apellido}</div>
                                <div className="flex items-center gap-2 mt-1 text-[8px] font-bold text-[#72777f] uppercase">
                                    <Layers size={10} />
                                    <span>{space.tipo}</span>
                                    <span>•</span>
                                    <span>{space.categoria_uso}</span>
                                    {space.level_id && (
                                        <>
                                            <span>•</span>
                                            <span className="text-[#0f4369]">NIVEL: {levels.find(l => l.id === space.level_id)?.nombre || space.level_id}</span>
                                        </>
                                    )}
                                    {space.area > 0 && (
                                        <>
                                            <span>•</span>
                                            <span className={space.area_category === 'Construida' ? 'text-[#16a34a]' : 'text-[#ea580c]'}>
                                                {space.area} m² ({space.area_category})
                                            </span>
                                        </>
                                    )}
                                    {!space.level_id && space.piso && <span>• PISO {space.piso}</span>}
                                </div>
                            </div>
                            {(subProjectId || isBimManager) && (
                                <button onClick={(e) => handleDeleteSpace(space.id, e)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 transition-all border-2 border-transparent hover:border-red-500">
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col bg-white overflow-hidden">
                {selectedSpace || isAddMode ? (
                    <div className="h-full flex flex-col overflow-hidden">
                        <div className="p-4 border-b-4 border-[#1c1c19] bg-[#f6f3ee] flex justify-between items-center shrink-0">
                            <div className="flex flex-col">
                                <span className="text-[8px] font-black text-[#72777f] uppercase tracking-[0.3em]">
                                    {spaceFormData.subProject_id === null ? 'GLOBAL_TEMPLATE_ENGINE' : 'UNIT_INSTANCE_MODE'}
                                    {(!isBimManager && spaceFormData.subProject_id === null) && ' // READ_ONLY'}
                                </span>
                                <h3 className="text-base font-black italic uppercase tracking-tighter">
                                    {isAddMode ? 'NUEVO_REGISTRO_ARQUITECTÓNICO' : `ELEMENTO: ${selectedSpace.nombre}`}
                                </h3>
                            </div>
                            <div className="flex gap-3">
                                {isAddMode && <button onClick={() => { setIsAddMode(false); setSelectedSpace(null); }} className="px-4 py-1.5 border-2 border-[#1c1c19] text-[9px] font-black uppercase hover:bg-[#1c1c19] hover:text-white transition-all">CANCELAR</button>}
                                {(spaceFormData.subProject_id !== null || isBimManager) ? (
                                    <button
                                        onClick={() => handleSaveSpace(spaceFormData.subProject_id === null)}
                                        disabled={savingSpace}
                                        className="px-6 py-1.5 bg-[#1c1c19] text-white text-[9px] font-black uppercase italic flex items-center gap-2 shadow-[4px_4px_0_0_rgba(15,67,105,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                                    >
                                        {savingSpace ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                                        {spaceFormData.subProject_id === null ? 'GUARDAR_PLANTILLA_GLOBAL' : 'GUARDAR_CONFIGURACIÓN'}
                                    </button>
                                ) : (
                                    <div className="px-6 py-1.5 border-2 border-[#1c1c19]/20 text-[#72777f] text-[9px] font-black uppercase italic flex items-center gap-2 bg-[#fcf9f4]">
                                        <Lock size={12} /> MODO_LECTURA_PLANTILLA
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#fcf9f4]">
                            <div className="max-w-6xl space-y-8">
                                {/* DATOS GENERALES */}
                                <div className="bg-white border-4 border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                                    <div className="flex items-center gap-3 border-b-2 border-[#1c1c19] pb-2 mb-6">
                                        <Building2 size={18} />
                                        <h4 className="text-[10px] font-black uppercase italic tracking-widest">
                                            {spaceFormData.subProject_id === null ? 'DATOS_MAESTROS_DE_PLANTILLA' : 'DEFINICIÓN_DE_ESPACIO_/_ELEMENTO'}
                                        </h4>
                                    </div>
                                    <div className="grid grid-cols-12 gap-6">
                                        <div className="col-span-12 lg:col-span-4">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">NOMBRE_IDENTIFICADOR</label>
                                            <input disabled={!isBimManager && spaceFormData.subProject_id === null} type="text" value={spaceFormData.nombre} onChange={(e) => setSpaceFormData({ ...spaceFormData, nombre: e.target.value })} className="w-full p-2 border-2 border-[#1c1c19] font-black text-sm outline-none bg-[#fcf9f4]/50 focus:bg-white focus:shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] transition-all disabled:opacity-50" />
                                        </div>
                                        <div className="col-span-12 lg:col-span-4">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">DESCRIPCIÓN_/_APELLIDO</label>
                                            <input disabled={!isBimManager && spaceFormData.subProject_id === null} type="text" value={spaceFormData.apellido} onChange={(e) => setSpaceFormData({ ...spaceFormData, apellido: e.target.value })} className="w-full p-2 border-2 border-[#1c1c19] font-black text-sm outline-none bg-[#fcf9f4]/50 focus:bg-white focus:shadow-[4px_4px_0_0_rgba(0,0,0,0.05)] transition-all disabled:opacity-50" />
                                        </div>
                                        <div className="col-span-12 lg:col-span-4">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">CATEGORÍA_DE_USO</label>
                                            <select disabled={!isBimManager && spaceFormData.subProject_id === null} value={spaceFormData.categoria_uso} onChange={(e) => setSpaceFormData({ ...spaceFormData, categoria_uso: e.target.value })} className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none bg-white disabled:opacity-50">
                                                <option value="General">GENERAL / OTROS</option>
                                                <option value="Residencial">RESIDENCIAL</option>
                                                <option value="Comercial/Oficinas">COMERCIAL / OFICINAS</option>
                                                <option value="Industrial/Fábricas">INDUSTRIAL / FÁBRICAS</option>
                                                <option value="Científico/Laboratorios">CIENTÍFICO / LABORATORIOS</option>
                                                <option value="Educacional">EDUCACIONAL</option>
                                                <option value="Salud/Hospitalario">SALUD / HOSPITALARIO</option>
                                                <option value="Exteriores/Urbanismo">EXTERIORES / URBANISMO</option>
                                            </select>
                                        </div>
                                        <div className="col-span-6 lg:col-span-2">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">TIPO_REGISTRO</label>
                                            <select disabled={!isBimManager && spaceFormData.subProject_id === null} value={spaceFormData.tipo} onChange={(e) => setSpaceFormData({ ...spaceFormData, tipo: e.target.value })} className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none bg-white disabled:opacity-50">
                                                <option value="Espacio">ESPACIO</option>
                                                <option value="Elemento">ELEMENTO</option>
                                            </select>
                                        </div>
                                        <div className="col-span-12 md:col-span-4">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">NIVEL_ASOCIADO</label>
                                            <select 
                                                disabled={!isBimManager && spaceFormData.subProject_id === null} 
                                                value={spaceFormData.level_id} 
                                                onChange={(e) => setSpaceFormData({ ...spaceFormData, level_id: e.target.value })} 
                                                className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none disabled:opacity-50"
                                            >
                                                <option value="">(SIN NIVEL)</option>
                                                {levels.filter(l => !l.parent_id).map(l => (
                                                    <option key={l.id} value={l.id}>{l.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="col-span-6 md:col-span-4">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">ÁREA (m²)</label>
                                            <input 
                                                disabled={!isBimManager && spaceFormData.subProject_id === null} 
                                                type="number" step="0.01" 
                                                value={spaceFormData.area} 
                                                onChange={(e) => setSpaceFormData({ ...spaceFormData, area: e.target.value })} 
                                                className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none disabled:opacity-50" 
                                                placeholder="Ej: 25.5" 
                                            />
                                        </div>
                                        <div className="col-span-6 md:col-span-4">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">CATEGORÍA DE ÁREA</label>
                                            <select 
                                                disabled={!isBimManager && spaceFormData.subProject_id === null} 
                                                value={spaceFormData.area_category} 
                                                onChange={(e) => setSpaceFormData({ ...spaceFormData, area_category: e.target.value })} 
                                                className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none disabled:opacity-50"
                                            >
                                                <option value="Construida">CONSTRUIDA / CUBIERTA</option>
                                                <option value="Descubierta">DESCUBIERTA</option>
                                            </select>
                                        </div>
                                    </div>
                                    {spaceFormData.subProject_id === null && (
                                        <div className="mt-4 p-2 bg-orange-50 border-2 border-orange-200 text-[8px] font-black text-orange-700 uppercase tracking-widest">
                                            ⚠ ESTÁS EDITANDO UNA PLANTILLA MAESTRA. LOS CAMBIOS AQUÍ NO SE RELEJARÁN EN INSTANCIAS YA CREADAS, SOLO EN NUEVAS CLONACIONES.
                                        </div>
                                    )}
                                </div>

                                {/* COMPONENTES Y ACABADOS (MATERIALES) */}
                                <div className="bg-white border-4 border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(15,67,105,0.1)]">
                                    <div className="flex justify-between items-center border-b-2 border-[#1c1c19] pb-2 mb-6">
                                        <div className="flex items-center gap-3">
                                            <Box size={18} />
                                            <h4 className="text-[10px] font-black uppercase italic tracking-widest">COMPONENTES_Y_ACABADOS_PERSONALIZADOS</h4>
                                        </div>
                                        {(spaceFormData.subProject_id !== null || isBimManager) && (
                                            <button onClick={handleAddComponent} className="h-8 px-4 bg-[#1c1c19] text-white text-[9px] font-black uppercase italic flex items-center gap-2 hover:bg-[#0f4369] transition-all">
                                                <Plus size={14} /> ASIGNAR_COMPONENTE
                                            </button>
                                        )}
                                    </div>

                                    <div className="space-y-3">
                                        <div className="grid grid-cols-12 gap-4 px-2 text-[7px] font-black text-[#72777f] uppercase tracking-widest opacity-60">
                                            <div className="col-span-4">COMPONENTE_DEL_CATÁLOGO</div>
                                            <div className="col-span-4">ACABADO_/_MATERIAL_ESPECÍFICO</div>
                                            <div className="col-span-3">NOTAS_DE_INSTALACIÓN</div>
                                            <div className="col-span-1"></div>
                                        </div>

                                        {spaceFormData.componentes.length === 0 ? (
                                            <div className="text-[9px] font-bold text-[#72777f] italic py-10 text-center border-4 border-dashed border-[#1c1c19]/5 bg-[#fcf9f4]">
                                                NO HAY COMPONENTES ASIGNADOS A ESTA UNIDAD. HAGA CLIC EN "ASIGNAR_COMPONENTE" PARA EMPEZAR.
                                            </div>
                                        ) : spaceFormData.componentes.map((item, idx) => (
                                            <div key={idx} className="grid grid-cols-12 gap-4 items-center p-3 border-2 border-[#1c1c19] bg-white group hover:bg-[#f6f3ee]/30 transition-all">
                                                <div className="col-span-4">
                                                    {(() => {
                                                        const selectedComp = allComponents.find(c => c.id === item.component_id);
                                                        return (
                                                            <button
                                                                disabled={!isBimManager && spaceFormData.subProject_id === null}
                                                                onClick={() => {
                                                                    setActiveCompIdx(idx);
                                                                    setShowComponentPicker(true);
                                                                }}
                                                                className="w-full p-2 border-2 border-[#1c1c19]/20 font-black text-[10px] outline-none focus:border-[#1c1c19] bg-white flex flex-col items-start transition-all hover:border-[#1c1c19] disabled:opacity-50"
                                                            >
                                                                {selectedComp ? (
                                                                    <>
                                                                        <span className="uppercase truncate w-full">{selectedComp.element_name || selectedComp.nombre}</span>
                                                                        <span className="text-[6.5px] font-bold text-[#72777f] uppercase opacity-60">
                                                                            {selectedComp.discipline} | LOD {selectedComp.lod || 100}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-[#72777f] uppercase">SELECCIONAR_COMPONENTE...</span>
                                                                )}
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="col-span-4">
                                                    {(() => {
                                                        const selectedMat = allMaterials.find(m => m.id === item.material_id);
                                                        return (
                                                            <button
                                                                disabled={!isBimManager && spaceFormData.subProject_id === null}
                                                                onClick={() => {
                                                                    setActiveCompIdx(idx);
                                                                    setShowMaterialPicker(true);
                                                                }}
                                                                className="w-full p-2 border-2 border-[#1c1c19]/20 font-black text-[10px] outline-none focus:border-[#1c1c19] bg-white flex flex-col items-start transition-all hover:border-[#1c1c19] disabled:opacity-50"
                                                            >
                                                                {selectedMat ? (
                                                                    <>
                                                                        <span className="uppercase truncate w-full">{selectedMat.Nombre}</span>
                                                                        <span className="text-[6.5px] font-bold text-[#0f4369] uppercase opacity-60">
                                                                            {selectedMat.categoria} | {selectedMat.proveedor || 'S.P'}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span className="text-[#72777f] uppercase">SELECCIONAR_ACABADO...</span>
                                                                )}
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="col-span-3">
                                                    <input
                                                        disabled={!isBimManager && spaceFormData.subProject_id === null}
                                                        type="text"
                                                        value={item.notas}
                                                        onChange={(e) => handleUpdateAssignedComponent(idx, 'notas', e.target.value)}
                                                        placeholder="NOTAS..."
                                                        className="w-full p-2 border-2 border-[#1c1c19]/20 font-black text-[10px] outline-none focus:border-[#1c1c19] bg-transparent disabled:opacity-50"
                                                    />
                                                </div>
                                                <div className="col-span-1 flex justify-end">
                                                    {(spaceFormData.subProject_id !== null || isBimManager) && (
                                                        <button onClick={() => handleRemoveComponent(idx)} className="p-2 text-red-500 hover:bg-red-500 hover:text-white border-2 border-transparent hover:border-[#1c1c19] transition-all">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {spaceFormData.componentes.length > 0 && (
                                        <div className="mt-6 p-4 border-2 border-[#1c1c19] bg-[#0f4369]/5 flex items-center gap-4">
                                            <Package size={16} className="text-[#0f4369]" />
                                            <p className="text-[8px] font-bold text-[#0f4369] uppercase leading-tight">
                                                LOS MATERIALES SELECCIONADOS AQUÍ SOBREESCREBEN EL ACABADO POR DEFECTO DEL COMPONENTE SOLO PARA ESTE ESPACIO.
                                                ESTO PERMITE QUE UN MISMO COMPONENTE (EJ: PUERTA) TENGA DIFERENTES ACABADOS SEGÚN SU UBICACIÓN.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-10 p-20 text-center">
                        <Building2 size={120} strokeWidth={1} />
                        <h2 className="text-3xl font-black italic uppercase tracking-tighter mt-6">SELECCIONE_UN_REGISTRO</h2>
                        <p className="text-xs font-bold uppercase tracking-[0.2em] mt-2">PROJECT_CORE_MANAGEMENT_INTERFACE</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpacesView;
