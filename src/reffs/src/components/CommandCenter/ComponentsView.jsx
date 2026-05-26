import React, { useState, useEffect } from 'react';
import { Box, Search, Save, Loader2 } from 'lucide-react';
import { getComponents, updateComponent } from '../../services/componentsService';

const ComponentsView = () => {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedComponent, setSelectedComponent] = useState(null);

    // Inline editing state
    const [formData, setFormData] = useState({
        nombre: '',
        acabado: '',
        construcción: '',
        description: '',
        espacio_elemento: ''
    });
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadComponents();
    }, []);

    // Load form data when component is selected
    useEffect(() => {
        if (selectedComponent) {
            setFormData({
                nombre: selectedComponent.nombre || '',
                acabado: selectedComponent.acabado || '',
                construcción: selectedComponent.construcción || '',
                description: selectedComponent.description || '',
                espacio_elemento: selectedComponent.espacio_elemento || ''
            });
            setHasChanges(false);
        }
    }, [selectedComponent]);

    const loadComponents = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getComponents();
            setComponents(data || []);
        } catch (error) {
            console.error('Error loading components:', error);
            setError(error.message || 'Error al cargar componentes');
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!selectedComponent?.id) return;

        setSaving(true);
        try {
            const updated = await updateComponent(selectedComponent.id, formData);
            setComponents(prev => prev.map(c => c.id === selectedComponent.id ? { ...c, ...formData } : c));
            setSelectedComponent({ ...selectedComponent, ...formData });
            setHasChanges(false);
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error al guardar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const filteredComponents = components.filter(component => {
        return component.nombre?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    return (
        <div className="h-full flex bg-white">
            {/* LEFT: Components List - ENRICHED SIDEBAR */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Box size={20} className="text-blue-600" />
                        Catálogo de Componentes
                    </h2>

                    {/* Search */}
                    <div className="relative mb-3">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar componentes..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <p className="text-xs text-gray-600">
                        {filteredComponents.length} componentes
                    </p>
                </div>

                {/* Components List - ENRICHED CARDS */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
                    ) : error ? (
                        <div className="p-4 text-center">
                            <div className="text-sm text-red-600 mb-2">❌ Error</div>
                            <button onClick={loadComponents} className="text-xs text-blue-600 hover:underline">
                                Reintentar
                            </button>
                        </div>
                    ) : filteredComponents.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                            No hay componentes
                        </div>
                    ) : (
                        filteredComponents.map((component) => (
                            <button
                                key={component.id}
                                onClick={() => setSelectedComponent(component)}
                                className={`
                                    w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors
                                    ${selectedComponent?.id === component.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}
                                `}
                            >
                                <div className="flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <Box size={20} className="text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        {/* Name - Bold */}
                                        <div className="font-medium text-sm text-gray-900 truncate">
                                            {component.nombre}
                                        </div>
                                        {/* Acabado - Secondary */}
                                        {component.acabado && (
                                            <div className="text-xs text-gray-500 truncate mt-0.5">
                                                {component.acabado}
                                            </div>
                                        )}
                                        {/* Espacio badge */}
                                        {component.espacio_elemento && (
                                            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] font-medium bg-purple-100 text-purple-700 rounded-full">
                                                {component.espacio_elemento}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT: INLINE EDITOR PANEL */}
            <div className="flex-1 flex flex-col">
                {selectedComponent ? (
                    <>
                        {/* Header with Save Button */}
                        <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <Box size={24} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">
                                        {formData.nombre || 'Sin nombre'}
                                    </h3>
                                    <p className="text-xs text-gray-500">Componente del catálogo</p>
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving || !hasChanges}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${hasChanges
                                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {saving ? (
                                    <><Loader2 size={16} className="animate-spin" /> Guardando...</>
                                ) : (
                                    <><Save size={16} /> Guardar</>
                                )}
                            </button>
                        </div>

                        {/* Inline Edit Form */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="max-w-2xl space-y-5">
                                {/* Nombre */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                                        Nombre
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.nombre}
                                        onChange={(e) => handleFieldChange('nombre', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Acabado */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                                        Acabado
                                    </label>
                                    <textarea
                                        value={formData.acabado}
                                        onChange={(e) => handleFieldChange('acabado', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        placeholder="Describe el acabado del componente..."
                                    />
                                </div>

                                {/* Construcción */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                                        Construcción
                                    </label>
                                    <textarea
                                        value={formData.construcción}
                                        onChange={(e) => handleFieldChange('construcción', e.target.value)}
                                        rows={3}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        placeholder="Describe el método de construcción..."
                                    />
                                </div>

                                {/* Descripción */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                                        Descripción
                                    </label>
                                    <textarea
                                        value={formData.description}
                                        onChange={(e) => handleFieldChange('description', e.target.value)}
                                        rows={4}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                                        placeholder="Descripción detallada del componente..."
                                    />
                                </div>

                                {/* Espacio/Elemento */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-600 uppercase tracking-wide mb-1">
                                        Espacio / Elemento
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.espacio_elemento}
                                        onChange={(e) => handleFieldChange('espacio_elemento', e.target.value)}
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Ej: Habitación, Baño, Cocina..."
                                    />
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <Box size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Selecciona un componente para editar</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComponentsView;
