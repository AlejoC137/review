import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Building2, Box, Search, Plus, Trash2, X, Loader2, Layers, Save, Package, Lock, Edit3 } from 'lucide-react';
import { spacesService } from '../services/spacesService';
import { componentsService } from '../services/componentsService';
import { getMaterials, createMaterial } from '../services/materialsService';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { levelsService } from '../services/levelsService';
import SpaceForm from '../components/spaces/SpaceForm';
import ElementForm from '../components/spaces/ElementForm';
import ComponentPickerModal from '../components/common/ComponentPickerModal';

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
    const [isAddingNewMaterial, setIsAddingNewMaterial] = useState(false);
    const [newMatName, setNewMatName] = useState('');
    const [editingComp, setEditingComp] = useState(null);
    const [editCompData, setEditCompData] = useState({ subcomponente: '', categoria_revit: '' });
    const [selectedCategory, setSelectedCategory] = useState('TODAS');

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
        subProject_id: subProjectId,
        phase: 'Nueva Construcción',
        parent_espacio_id: ''
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
                subProject_id: selectedSpace.subProject_id || subProjectId,
                phase: selectedSpace.phase || 'Nueva Construcción',
                parent_espacio_id: selectedSpace.parent_espacio_id || ''
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
            subProject_id: subProjectId,
            phase: template.phase || 'Nueva Construcción',
            parent_espacio_id: filterType === 'Elemento' && selectedSpace?.tipo === 'Espacio' ? selectedSpace.id : (template.parent_espacio_id || '')
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

    const handleCreateCatalogComponent = async (name, category = 'NUEVO_SUBCOMPONENTE', descripcion = '', es_principal = false) => {
        if (!name.trim()) return;
        try {
            const newComp = await componentsService.createComponent({
                subcomponente: name.trim(),
                categoria_revit: category || 'NUEVO_SUBCOMPONENTE',
                descripcion: descripcion,
                es_principal: es_principal
            });
            if (newComp) {
                setAllComponents(prev => [...prev, newComp]);
            }
        } catch (error) {
            console.error('Error creating component:', error);
            alert('Error al crear el subcomponente');
        }
    };

    const handleCreateMaterial = async () => {
        if (!newMatName.trim()) return;
        try {
            const newMat = await createMaterial({ 
                Nombre: newMatName.trim(), 
                globalMaterial: true, 
                categoria: 'SIN CATEGORÍA'
            });
            if (newMat) {
                setAllMaterials(prev => [...prev, newMat]);
                setNewMatName('');
                setIsAddingNewMaterial(false);
            }
        } catch (error) {
            console.error('Error creating material:', error);
            alert('Error al crear el material');
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

    const handleUpdateCatalogComponent = async (compId, data) => {
        if (!compId || !isBimManager) return;
        try {
            await componentsService.updateComponent(compId, data);
            const compsData = await componentsService.getComponents();
            setAllComponents(compsData || []);
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
                subProject_id: asTemplate ? null : (subProjectId === "" ? null : subProjectId),
                level_id: spaceFormData.level_id === "" ? null : spaceFormData.level_id,
                parent_espacio_id: spaceFormData.parent_espacio_id === "" ? null : spaceFormData.parent_espacio_id
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
                                            setSpaceFormData({ 
                                                nombre: '', apellido: '', tipo: filterType === 'Elemento' ? 'Elemento' : 'Espacio', 
                                                piso: '', level_id: '', area: 0, area_category: 'Construida', componentes: [], 
                                                subProject_id: null, phase: 'Nueva Construcción', parent_espacio_id: '' 
                                            });
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
                                        setSpaceFormData({ 
                                            nombre: '', apellido: '', tipo: filterType === 'Elemento' ? 'Elemento' : 'Espacio', 
                                            piso: '', level_id: '', area: 0, area_category: 'Construida', componentes: [], 
                                            subProject_id: subProjectId, phase: 'Nueva Construcción', parent_espacio_id: '' 
                                        });
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

                        {isBimManager && (
                            <div className="p-4 border-t-4 border-[#1c1c19] bg-white">
                                {isAddingNewMaterial ? (
                                    <div className="flex gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newMatName}
                                            onChange={(e) => setNewMatName(e.target.value)}
                                            placeholder="NOMBRE DEL NUEVO MATERIAL..."
                                            className="flex-1 p-2 border-2 border-[#1c1c19] text-[10px] font-black uppercase outline-none focus:bg-[#f6f3ee]"
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateMaterial()}
                                        />
                                        <button onClick={handleCreateMaterial} className="px-4 py-2 bg-[#1c1c19] text-white text-[9px] font-black uppercase hover:bg-[#0f4369] transition-all">AGREGAR</button>
                                        <button onClick={() => setIsAddingNewMaterial(false)} className="px-4 py-2 border-2 border-[#1c1c19] text-[9px] font-black uppercase hover:bg-gray-100 transition-all">X</button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => setIsAddingNewMaterial(true)}
                                        className="w-full py-2 border-2 border-dashed border-[#1c1c19] text-[9px] font-black uppercase hover:bg-[#f6f3ee] transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus size={14} /> REGISTRAR_NUEVO_ACABADO_O_MATERIAL
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Component Picker Modal */}
            <ComponentPickerModal
                isOpen={showComponentPicker}
                onClose={() => {
                    setShowComponentPicker(false);
                    setActiveCompIdx(null);
                }}
                allComponents={allComponents}
                onSelect={(comp) => {
                    handleUpdateAssignedComponent(activeCompIdx, 'component_id', comp.id);
                }}
                isBimManager={isBimManager}
                onUpdateComponent={handleUpdateCatalogComponent}
                onDeleteComponent={(id) => handleDeleteCatalogComponent(id, { stopPropagation: () => {} })}
                onCreateComponent={handleCreateCatalogComponent}
            />

            {/* Sidebar */}
            <div className="w-72 border-r-4 border-[#1c1c19] flex flex-col bg-[#fcf9f4]">
                <div className="p-4 border-b-4 border-[#1c1c19] bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-black italic uppercase tracking-tighter flex items-center gap-2">
                            <Layers size={16} /> {subProjectId ? 'ESPACIOS_UNIDAD' : 'PLANTILLAS_GLOBALES'}
                        </h2>
                        {/* Allowed for all if in unit context, or if BIM manager */}
                        {(subProjectId || isBimManager) && (
                            <button onClick={() => {
                                if (subProjectId) {
                                    setShowTemplatePicker(true);
                                } else {
                                    setIsAddMode(true);
                                    setSelectedSpace(null);
                                    setSpaceFormData({ 
                                        nombre: '', apellido: '', tipo: filterType === 'Elemento' ? 'Elemento' : 'Espacio', 
                                        categoria_uso: 'General', piso: '', level_id: '', area: 0, area_category: 'Construida', 
                                        componentes: [], subProject_id: null, phase: 'Nueva Construcción', parent_espacio_id: '' 
                                    });
                                }
                            }} className="p-1 border-2 border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all">
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
                                    onClick={() => {
                                        setFilterType(t);
                                        setSelectedSpace(null);
                                        setIsAddMode(false);
                                    }}
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
                                {spaceFormData.tipo === 'Espacio' ? (
                                    <SpaceForm
                                        spaceFormData={spaceFormData}
                                        setSpaceFormData={setSpaceFormData}
                                        isBimManager={isBimManager}
                                        levels={levels}
                                        spaces={spaces}
                                        selectedSpace={selectedSpace}
                                        setFilterType={setFilterType}
                                        setIsAddMode={setIsAddMode}
                                        setSelectedSpace={setSelectedSpace}
                                        setShowTemplatePicker={setShowTemplatePicker}
                                        onReloadRequired={loadInitialData}
                                    />
                                ) : (
                                    <ElementForm
                                        spaceFormData={spaceFormData}
                                        setSpaceFormData={setSpaceFormData}
                                        isBimManager={isBimManager}
                                        spaces={spaces}
                                        selectedSpace={selectedSpace}
                                        allComponents={allComponents}
                                        allMaterials={allMaterials}
                                        handleAddComponent={handleAddComponent}
                                        handleRemoveComponent={handleRemoveComponent}
                                        handleUpdateAssignedComponent={handleUpdateAssignedComponent}
                                        setActiveCompIdx={setActiveCompIdx}
                                        setShowComponentPicker={setShowComponentPicker}
                                        setShowMaterialPicker={setShowMaterialPicker}
                                    />
                                )}
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
