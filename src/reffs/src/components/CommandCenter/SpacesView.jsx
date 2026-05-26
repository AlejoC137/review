import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Building2, Box, Search, Plus, Edit2, Trash2, X, Check } from 'lucide-react';
import { getSpaces, createSpace, updateSpace, deleteSpace, getAllSpacesAndElements, getStages, getSpaceDetails } from '../../services/spacesService';
import { getSpaceComponents, createSpaceComponent, getComponents } from '../../services/componentsService';
import { getProjects } from '../../services/projectsService';
import AddComponentModal from './AddComponentModal';
import { openSpaceModal } from '../../store/actions/appActions';

const SpacesView = () => {
    const dispatch = useDispatch();
    const { refreshCounter } = useSelector(state => state.app);
    const [spaces, setSpaces] = useState([]);
    const [selectedSpace, setSelectedSpace] = useState(null);
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all'); // 'all' | 'Espacio' | 'Elemento'
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // CRUD states for spaces
    const [editingSpace, setEditingSpace] = useState(null);
    const [spaceFormData, setSpaceFormData] = useState({
        nombre: '',
        apellido: '',
        tipo: 'Espacio',
        piso: '',
        componentes: ''
    });
    const [savingSpace, setSavingSpace] = useState(false);

    // Dropdown options
    const [projectOptions, setProjectOptions] = useState([]);
    const [stageOptions, setStageOptions] = useState([]);
    const [componentOptions, setComponentOptions] = useState([]);

    useEffect(() => {
        loadSpaces();
        loadDropdownOptions();
    }, [refreshCounter]);

    const loadDropdownOptions = async () => {
        try {
            const comps = await getComponents();
            setComponentOptions(comps || []);
        } catch (error) {
            console.error('Error loading dropdown options:', error);
        }
    };

    useEffect(() => {
        if (selectedSpace) {
            loadComponents(selectedSpace._id);
        }
    }, [selectedSpace]);

    const loadSpaces = async () => {
        setLoading(true);
        try {
            const data = await getAllSpacesAndElements();
            setSpaces(data || []);
        } catch (error) {
            console.error('Error loading spaces:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadComponents = async (spaceId) => {
        setLoading(true);
        try {
            const data = await getSpaceComponents(spaceId);
            setComponents(data || []);
        } catch (error) {
            console.error('Error loading components:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddComponent = async (newComponentData) => {
        const saved = await createSpaceComponent(newComponentData);
        // Reload components after adding
        if (selectedSpace) {
            await loadComponents(selectedSpace._id);
        }
        return saved;
    };

    // Handle space selection - loads details for inline editing
    const handleSelectSpace = async (space) => {
        setSelectedSpace(space);
        // Load full details for the inline editor
        try {
            const details = await getSpaceDetails(space._id);
            setSpaceFormData({
                nombre: details.nombre || '',
                apellido: details.apellido || '',
                tipo: details.tipo || 'Espacio',
                piso: details.piso || '',
                componentes: details.componentes || ''
            });
            setEditingSpace(details);
        } catch (error) {
            console.error('Error loading space details:', error);
        }
    };

    // CRUD handlers for spaces
    const handleOpenAddModal = () => {
        dispatch(openSpaceModal({
            onSuccess: loadSpaces
        }));
    };

    const handleSaveSpace = async () => {
        if (!spaceFormData.nombre.trim()) {
            alert('El nombre es requerido');
            return;
        }

        setSavingSpace(true);
        try {
            // Convert empty strings to null for UUID fields
            const dataToSave = {
                ...spaceFormData
            };

            if (editingSpace) {
                await updateSpace(editingSpace._id, dataToSave);
            }
            // Reload spaces list to update sidebar
            await loadSpaces();
            // Update selectedSpace with new data for inline view
            if (editingSpace && selectedSpace) {
                setSelectedSpace({ ...selectedSpace, ...dataToSave });
            }
        } catch (error) {
            console.error('Error saving space:', error);
            alert('Error al guardar');
        } finally {
            setSavingSpace(false);
        }
    };

    const handleDeleteSpace = async (space, e) => {
        e.stopPropagation();
        if (!window.confirm(`¿Eliminar "${space.nombre}"?`)) return;

        try {
            await deleteSpace(space._id);
            if (selectedSpace?._id === space._id) {
                setSelectedSpace(null);
                setComponents([]);
            }
            await loadSpaces();
        } catch (error) {
            console.error('Error deleting space:', error);
            alert('Error al eliminar');
        }
    };

    const filteredSpaces = spaces.filter(space => {
        const matchesSearch = space.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || space.tipo === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <div className="h-full flex bg-white">
            {/* LEFT: Spaces List */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Building2 size={20} className="text-blue-600" />
                            Espacios y Elementos
                        </h2>
                        <button
                            onClick={handleOpenAddModal}
                            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                            title="Agregar Espacio/Elemento"
                        >
                            <Plus size={14} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative mb-3">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Filter */}
                    <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
                        {['all', 'Espacio', 'Elemento'].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFilterType(type)}
                                className={`
                                    flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all
                                    ${filterType === type
                                        ? 'bg-white text-gray-900 shadow-sm'
                                        : 'text-gray-600 hover:text-gray-900'
                                    }
                                `}
                            >
                                {type === 'all' ? 'Todos' : type}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Spaces List */}
                <div className="flex-1 overflow-y-auto">
                    {loading && !selectedSpace ? (
                        <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
                    ) : filteredSpaces.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No hay espacios</div>
                    ) : (
                        filteredSpaces.map((space) => (
                            <div
                                key={space._id}
                                onClick={() => handleSelectSpace(space)}
                                className={`
                                    w-full text-left px-3 py-2.5 border-b border-gray-100 hover:bg-blue-50 transition-colors cursor-pointer group
                                    ${selectedSpace?._id === space._id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}
                                `}
                            >
                                <div className="flex items-start gap-2">
                                    {space.tipo === 'Espacio' ? (
                                        <Building2 size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <Box size={14} className="text-purple-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-gray-900 truncate">
                                            {space.nombre}{space.apellido ? ` ${space.apellido}` : ''}
                                        </div>
                                        <div className="flex flex-wrap gap-x-2 text-[10px] text-gray-500 mt-0.5">
                                            <span className={`
                                                ${space.tipo === 'Espacio' ? 'text-blue-600' : 'text-purple-600'}
                                            `}>
                                                {space.tipo}
                                            </span>
                                            {/* Removed project name indicator */}
                                            {space.piso && (
                                                <span className="bg-blue-100 text-blue-600 px-1 rounded">P{space.piso}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={(e) => handleDeleteSpace(space, e)}
                                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 size={12} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT: Inline Editor + Components */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {selectedSpace ? (
                    <>
                        {/* Inline Editor Section - Collapsible */}
                        <div className="border-b border-gray-200 bg-gray-50">
                            <div className="p-3 flex items-center justify-between">
                                <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                    <Edit2 size={14} className="text-blue-600" />
                                    {selectedSpace.nombre}{selectedSpace.apellido ? ` ${selectedSpace.apellido}` : ''}{selectedSpace.piso ? ` P${selectedSpace.piso}` : ''}
                                    <span className={`text-xs px-1.5 py-0.5 rounded ${selectedSpace.tipo === 'Espacio' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                                        {selectedSpace.tipo}
                                    </span>
                                </h3>
                                <button
                                    onClick={handleSaveSpace}
                                    disabled={savingSpace}
                                    className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                    {savingSpace ? 'Guardando...' : <><Check size={12} /> Guardar</>}
                                </button>
                            </div>

                            {/* Compact Inline Form */}
                            <div className="px-3 pb-3 grid grid-cols-4 gap-2 text-xs">
                                <div>
                                    <label className="block text-gray-600 mb-0.5">Nombre</label>
                                    <input
                                        type="text"
                                        value={spaceFormData.nombre}
                                        onChange={(e) => setSpaceFormData({ ...spaceFormData, nombre: e.target.value })}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-600 mb-0.5">Apellido</label>
                                    <input
                                        type="text"
                                        value={spaceFormData.apellido}
                                        onChange={(e) => setSpaceFormData({ ...spaceFormData, apellido: e.target.value })}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-gray-600 mb-0.5">Tipo</label>
                                    <select
                                        value={spaceFormData.tipo}
                                        onChange={(e) => setSpaceFormData({ ...spaceFormData, tipo: e.target.value })}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Espacio">Espacio</option>
                                        <option value="Elemento">Elemento</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-gray-600 mb-0.5">Piso</label>
                                    <input
                                        type="text"
                                        value={spaceFormData.piso}
                                        onChange={(e) => setSpaceFormData({ ...spaceFormData, piso: e.target.value })}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="1, 2..."
                                    />
                                </div>
                                {/* Removed Proyecto, Etapa, and Tareas fields as requested */}
                            </div>
                        </div>

                        {/* Components Section */}
                        <div className="flex-1 overflow-y-auto p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                    <Box size={14} />
                                    Componentes ({components.length})
                                </h4>
                                <button
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                                >
                                    <Plus size={12} />
                                    Agregar
                                </button>
                            </div>

                            {loading ? (
                                <div className="text-center py-8 text-xs text-gray-500">Cargando componentes...</div>
                            ) : components.length === 0 ? (
                                <div className="text-center py-8 text-xs text-gray-500">
                                    No hay componentes en este espacio
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {components.map((comp) => (
                                        <div
                                            key={comp.id}
                                            className="p-2 bg-white border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="font-medium text-xs text-gray-900">
                                                        {comp.nombre || comp.componente?.nombre || `Componente ${comp.componente_id?.slice(0, 8)}`}
                                                    </div>
                                                    <div className="text-[10px] text-gray-500 mt-0.5">
                                                        Estado: <span className="font-medium text-blue-600">{comp.estado || 'Pendiente'}</span>
                                                        {comp.cantidad && <span className="ml-2">Qty: {comp.cantidad}</span>}
                                                    </div>
                                                    {comp.notas && (
                                                        <div className="text-[10px] text-gray-600 mt-1 italic truncate">
                                                            {comp.notas}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <Building2 size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Selecciona un espacio para editar y ver sus componentes</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Component Modal */}
            <AddComponentModal
                espacioId={selectedSpace?._id}
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleAddComponent}
            />
        </div>
    );
};

export default SpacesView;

