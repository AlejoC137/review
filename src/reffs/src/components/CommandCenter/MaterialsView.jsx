import React, { useState, useEffect } from 'react';
import { Package, Search, DollarSign, Building2, Edit } from 'lucide-react';
import { getMaterials, getMaterialCategories } from '../../services/materialsService';
import MaterialEditModal from './MaterialEditModal';

const MaterialsView = () => {
    const [materials, setMaterials] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [selectedMaterial, setSelectedMaterial] = useState(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);

    const handleMaterialSave = (updatedMaterial) => {
        setMaterials(prev => prev.map(m => m.id === updatedMaterial.id ? updatedMaterial : m));
        setSelectedMaterial(updatedMaterial);
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [materialsData, categoriesData] = await Promise.all([
                getMaterials(),
                getMaterialCategories()
            ]);
            setMaterials(materialsData || []);
            setCategories(categoriesData || []);
            if (materialsData.length === 0) {
                console.warn('⚠️  No se encontraron materiales en la base de datos');
            }
        } catch (error) {
            console.error('Error loading materials:', error);
            setError(error.message || 'Error al cargar materiales');
        } finally {
            setLoading(false);
        }
    };

    const filteredMaterials = materials.filter(material => {
        const matchesSearch = material.Nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            material.tipo?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || material.categoria === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const formatPrice = (price) => {
        if (!price) return 'N/A';
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0
        }).format(price);
    };

    return (
        <div className="h-full flex bg-white">
            {/* LEFT: Materials List */}
            <div className="w-96 border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                        <Package size={20} className="text-blue-600" />
                        Gestión de Materiales
                    </h2>

                    {/* Search */}
                    <div className="relative mb-3">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar materiales..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    {/* Category Filter */}
                    <div className="mb-2">
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">Todas las categorías</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <p className="text-xs text-gray-600">
                        {filteredMaterials.length} materiales
                    </p>
                </div>

                {/* Materials List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
                    ) : error ? (
                        <div className="p-4 text-center">
                            <div className="text-sm text-red-600 mb-2">❌ Error al cargar materiales</div>
                            <div className="text-xs text-gray-500">{error}</div>
                            <button
                                onClick={loadData}
                                className="mt-3 text-xs text-blue-600 hover:underline"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : filteredMaterials.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                            {materials.length === 0 ? '⚠️  No hay materiales en la base de datos' : 'No se encontraron materiales'}
                        </div>
                    ) : (
                        filteredMaterials.map((material) => (
                            <button
                                key={material.id}
                                onClick={() => setSelectedMaterial(material)}
                                className={`
                                    w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors
                                    ${selectedMaterial?.id === material.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}
                                `}
                            >
                                <div className="font-medium text-sm text-gray-900 truncate">
                                    {material.Nombre || 'Sin nombre'}
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <span className="text-xs text-gray-500">
                                        {material.categoria || material.tipo || 'Sin categoría'}
                                    </span>
                                    {material.precio_COP && (
                                        <span className="text-xs font-medium text-blue-600">
                                            {formatPrice(material.precio_COP)}
                                        </span>
                                    )}
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT: Material Details */}
            <div className="flex-1 flex flex-col">
                {selectedMaterial ? (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center">
                                        <Package size={32} className="text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                            {selectedMaterial.Nombre || 'Sin nombre'}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {selectedMaterial.categoria || selectedMaterial.tipo || 'Sin categoría'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsEditModalOpen(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                                >
                                    <Edit size={16} />
                                    Editar
                                </button>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="space-y-6">
                                {/* Price Info */}
                                {selectedMaterial.precio_COP && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-3">Información de Precio</h4>
                                        <div className="bg-green-50 p-4 rounded-lg">
                                            <div className="flex items-center gap-2 mb-1">
                                                <DollarSign size={16} className="text-green-600" />
                                                <span className="text-xs text-gray-600">Precio</span>
                                            </div>
                                            <div className="text-2xl font-bold text-green-600">
                                                {formatPrice(selectedMaterial.precio_COP)}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Provider Info */}
                                {selectedMaterial.proveedor && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-3">Proveedor</h4>
                                        <div className="flex items-center gap-3 text-sm">
                                            <Building2 size={16} className="text-gray-400" />
                                            <span className="text-gray-700">{selectedMaterial.proveedor}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Technical Details */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">Detalles Técnicos</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        {selectedMaterial.categoria && (
                                            <div className="text-sm">
                                                <span className="text-gray-500">Categoría:</span>
                                                <span className="ml-2 text-gray-900">{selectedMaterial.categoria}</span>
                                            </div>
                                        )}
                                        {selectedMaterial.tipo && (
                                            <div className="text-sm">
                                                <span className="text-gray-500">Tipo:</span>
                                                <span className="ml-2 text-gray-900">{selectedMaterial.tipo}</span>
                                            </div>
                                        )}
                                        {selectedMaterial.unidad && (
                                            <div className="text-sm">
                                                <span className="text-gray-500">Unidad:</span>
                                                <span className="ml-2 text-gray-900">{selectedMaterial.unidad}</span>
                                            </div>
                                        )}
                                        {selectedMaterial.stock && (
                                            <div className="text-sm">
                                                <span className="text-gray-500">Stock:</span>
                                                <span className="ml-2 text-gray-900">{selectedMaterial.stock}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Notes */}
                                {selectedMaterial.notas && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-3">Notas</h4>
                                        <p className="text-sm text-gray-600 italic">
                                            {selectedMaterial.notas}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <Package size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Selecciona un material para ver detalles</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Material Edit Modal */}
            <MaterialEditModal
                material={selectedMaterial}
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onSave={handleMaterialSave}
            />
        </div>
    );
};

export default MaterialsView;
