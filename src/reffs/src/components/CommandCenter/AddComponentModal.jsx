import React, { useState, useEffect } from 'react';
import { X, Plus, Loader2 } from 'lucide-react';
import { getComponents } from '../../services/componentsService';

const AddComponentModal = ({ espacioId, isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [catalogComponents, setCatalogComponents] = useState([]);

    // Form state
    const [selectedComponentId, setSelectedComponentId] = useState('');
    const [cantidad, setCantidad] = useState(1);
    const [estado, setEstado] = useState('Pendiente');
    const [notas, setNotas] = useState('');

    useEffect(() => {
        if (isOpen) {
            loadCatalog();
            resetForm();
        }
    }, [isOpen]);

    const loadCatalog = async () => {
        setLoading(true);
        try {
            const data = await getComponents();
            setCatalogComponents(data || []);
        } catch (err) {
            console.error('Error loading components:', err);
            setError('Error al cargar catálogo de componentes');
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setSelectedComponentId('');
        setCantidad(1);
        setEstado('Pendiente');
        setNotas('');
        setError(null);
    };

    const handleSave = async () => {
        if (!selectedComponentId) {
            setError('Selecciona un componente');
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const newComponent = {
                espacio_id: espacioId,
                componente_id: selectedComponentId,
                cantidad: parseInt(cantidad, 10) || 1,
                estado,
                notas,
            };
            await onSave(newComponent);
            onClose();
        } catch (err) {
            setError(err.message || 'Error al agregar componente');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Agregar Componente</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* Component Select */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Componente del Catálogo *
                        </label>
                        {loading ? (
                            <div className="text-sm text-gray-500">Cargando catálogo...</div>
                        ) : (
                            <select
                                value={selectedComponentId}
                                onChange={(e) => setSelectedComponentId(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="">Selecciona un componente...</option>
                                {catalogComponents.map(comp => (
                                    <option key={comp.id} value={comp.id}>
                                        {comp.nombre}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    {/* Cantidad and Estado */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Cantidad
                            </label>
                            <input
                                type="number"
                                value={cantidad}
                                onChange={(e) => setCantidad(e.target.value)}
                                min="1"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Estado
                            </label>
                            <select
                                value={estado}
                                onChange={(e) => setEstado(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Proceso">En Proceso</option>
                                <option value="completed">completed</option>
                            </select>
                        </div>
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Notas
                        </label>
                        <textarea
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder="Observaciones adicionales..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={saving}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !selectedComponentId}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                Agregar
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddComponentModal;
