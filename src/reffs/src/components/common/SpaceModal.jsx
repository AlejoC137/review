import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { createSpace, updateSpace, getSpaceDetails, getStages } from '../../services/spacesService';
import { getComponents } from '../../services/componentsService';
import { getProjects } from '../../services/projectsService';

const SpaceModal = ({ isOpen, onClose, onSuccess, editingSpace = null, defaultProjectId = null }) => {
    const [spaceFormData, setSpaceFormData] = useState({
        nombre: '',
        apellido: '',
        tipo: 'Espacio',
        piso: '',
        componentes: ''
    });
    const [savingSpace, setSavingSpace] = useState(false);
    const [loading, setLoading] = useState(false);

    // Dropdown options
    const [projectOptions, setProjectOptions] = useState([]);
    const [stageOptions, setStageOptions] = useState([]);
    const [componentOptions, setComponentOptions] = useState([]);

    useEffect(() => {
        if (isOpen) {
            loadDropdownOptions();
            if (editingSpace) {
                loadSpaceDetails(editingSpace._id);
            } else {
                setSpaceFormData({
                    nombre: '',
                    apellido: '',
                    tipo: 'Espacio',
                    piso: '',
                    componentes: ''
                });
            }
        }
    }, [isOpen, editingSpace, defaultProjectId]);

    const loadDropdownOptions = async () => {
        try {
            const comps = await getComponents();
            setComponentOptions(comps || []);
        } catch (error) {
            console.error('Error loading dropdown options:', error);
        }
    };

    const loadSpaceDetails = async (id) => {
        setLoading(true);
        try {
            const details = await getSpaceDetails(id);
            setSpaceFormData({
                nombre: details.nombre || '',
                apellido: details.apellido || '',
                tipo: details.tipo || 'Espacio',
                piso: details.piso || '',
                componentes: details.componentes || ''
            });
        } catch (error) {
            console.error('Error loading space details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSpace = async () => {
        if (!spaceFormData.nombre.trim()) {
            alert('El nombre es requerido');
            return;
        }

        setSavingSpace(true);
        try {
            const dataToSave = {
                ...spaceFormData
            };

            let saved;
            if (editingSpace) {
                saved = await updateSpace(editingSpace._id, dataToSave);
            } else {
                saved = await createSpace(dataToSave);
            }

            if (onSuccess) onSuccess(saved);
            onClose();
        } catch (error) {
            console.error('Error saving space:', error);
            alert('Error al guardar');
        } finally {
            setSavingSpace(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] overflow-y-auto py-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 sticky top-0 bg-white flex items-center justify-between z-10">
                    <h3 className="text-lg font-bold text-gray-900">
                        {editingSpace ? 'Editar' : 'Agregar'} Espacio/Elemento
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {loading ? (
                        <div className="text-center py-20 text-gray-500">Cargando detalles...</div>
                    ) : (
                        <>
                            {/* Nombre y Apellido */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        value={spaceFormData.nombre}
                                        onChange={(e) => setSpaceFormData({ ...spaceFormData, nombre: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ej: Cocina, Baño..."
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Apellido
                                    </label>
                                    <input
                                        type="text"
                                        value={spaceFormData.apellido}
                                        onChange={(e) => setSpaceFormData({ ...spaceFormData, apellido: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Identificador adicional..."
                                    />
                                </div>
                            </div>

                            {/* Tipo y Piso */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Tipo *
                                    </label>
                                    <select
                                        value={spaceFormData.tipo}
                                        onChange={(e) => setSpaceFormData({ ...spaceFormData, tipo: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="Espacio">Espacio</option>
                                        <option value="Elemento">Elemento</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Piso
                                    </label>
                                    <input
                                        type="text"
                                        value={spaceFormData.piso}
                                        onChange={(e) => setSpaceFormData({ ...spaceFormData, piso: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ej: 1, 2, Sótano..."
                                    />
                                </div>
                            </div>

                            {/* Proyecto y Etapa removed */}

                            {/* Componentes 
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Componentes
                                </label>
                                <div className="border border-gray-300 rounded-lg p-3 max-h-40 overflow-y-auto bg-gray-50">
                                    {componentOptions.length === 0 ? (
                                        <p className="text-sm text-gray-500 italic">No hay componentes disponibles</p>
                                    ) : (
                                        <div className="space-y-2">
                                            {componentOptions.map((comp) => {
                                                const selectedIds = spaceFormData.componentes ? spaceFormData.componentes.split(',').filter(Boolean) : [];
                                                const isSelected = selectedIds.includes(comp.id);
                                                return (
                                                    <label key={comp.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-1 rounded">
                                                        <input
                                                            type="checkbox"
                                                            checked={isSelected}
                                                            onChange={(e) => {
                                                                let newIds;
                                                                if (e.target.checked) {
                                                                    newIds = [...selectedIds, comp.id];
                                                                } else {
                                                                    newIds = selectedIds.filter(id => id !== comp.id);
                                                                }
                                                                setSpaceFormData({ ...spaceFormData, componentes: newIds.join(',') });
                                                            }}
                                                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                                                        />
                                                        <span className="text-sm text-gray-700">{comp.nombre}</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    {(spaceFormData.componentes?.split(',').filter(Boolean).length || 0)} componente(s) seleccionado(s)
                                </p>
                            </div>
*/}
                        </>
                    )}
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white z-10">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSaveSpace}
                        disabled={savingSpace || loading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {savingSpace ? (
                            <>Guardando...</>
                        ) : (
                            <>
                                <Check size={16} />
                                {editingSpace ? 'Guardar' : 'Crear'}
                            </>
                        )}
                    </button>
                </div>
            </div >
        </div >
    );
};

export default SpaceModal;
