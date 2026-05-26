import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { updateCatalogComponent } from '../../services/componentsService';

const ComponentEditModal = ({ component, isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form state
    const [nombre, setNombre] = useState('');
    const [acabado, setAcabado] = useState('');
    const [construccion, setConstruccion] = useState('');
    const [description, setdescription] = useState('');

    useEffect(() => {
        if (component && isOpen) {
            setNombre(component.nombre || '');
            setAcabado(component.acabado || '');
            setConstruccion(component.construcción || '');
            setdescription(component.description || '');
            setError(null);
        }
    }, [component, isOpen]);

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            const updatedComponent = await updateCatalogComponent(component.id, {
                nombre,
                acabado,
                construcción: construccion,
                description,
            });
            onSave(updatedComponent);
            onClose();
        } catch (err) {
            setError(err.message || 'Error al guardar el componente');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Editar Componente</h2>
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

                    {/* Nombre */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Nombre del Componente
                        </label>
                        <input
                            type="text"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Nombre del componente"
                        />
                    </div>

                    {/* Acabado */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Acabado
                        </label>
                        <textarea
                            value={acabado}
                            onChange={(e) => setAcabado(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder="Descripción de acabados: pintura, textura, materiales de superficie..."
                        />
                    </div>

                    {/* Construcción */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Construcción / Estructura
                        </label>
                        <textarea
                            value={construccion}
                            onChange={(e) => setConstruccion(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder="Materiales estructurales, sistema constructivo, especificaciones técnicas..."
                        />
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Descripción General
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setdescription(e.target.value)}
                            rows={2}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder="Información adicional del componente..."
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                Guardar Cambios
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ComponentEditModal;
