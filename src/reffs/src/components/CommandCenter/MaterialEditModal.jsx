import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { updateMaterial } from '../../services/materialsService';

const MaterialEditModal = ({ material, isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Identificación
    const [nombre, setNombre] = useState('');
    const [proveedor, setProveedor] = useState('');
    const [categoria, setCategoria] = useState('');
    const [tipo, setTipo] = useState('');
    const [unidad, setUnidad] = useState('');

    // Costos
    const [precioCOP, setPrecioCOP] = useState('');
    const [precioPorM2, setPrecioPorM2] = useState('');
    const [stock, setStock] = useState('');

    // Dimensiones
    const [altoMm, setAltoMm] = useState('');
    const [anchoMm, setAnchoMm] = useState('');
    const [espesorMm, setEspesorMm] = useState('');

    // Notas
    const [notas, setNotas] = useState('');

    useEffect(() => {
        if (material && isOpen) {
            setNombre(material.Nombre || '');
            setProveedor(material.proveedor || '');
            setCategoria(material.categoria || '');
            setTipo(material.tipo || '');
            setUnidad(material.unidad || '');
            setPrecioCOP(material.precio_COP ?? '');
            setPrecioPorM2(material.precio_por_m2 ?? '');
            setStock(material.stock ?? '');
            setAltoMm(material.alto_mm ?? '');
            setAnchoMm(material.ancho_mm ?? '');
            setEspesorMm(material.espesor_mm ?? '');
            setNotas(material.notas || '');
            setError(null);
        }
    }, [material, isOpen]);

    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            const updatedMaterial = await updateMaterial(material.id, {
                Nombre: nombre,
                proveedor,
                categoria,
                tipo,
                unidad,
                precio_COP: precioCOP,
                precio_por_m2: precioPorM2,
                stock,
                alto_mm: altoMm,
                ancho_mm: anchoMm,
                espesor_mm: espesorMm,
                notas,
            });
            onSave(updatedMaterial);
            onClose();
        } catch (err) {
            setError(err.message || 'Error al guardar el material');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Edición Rápida de Material</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    {/* SECCIÓN 1: Identificación */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            Identificación
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Nombre Comercial
                                </label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={(e) => setNombre(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nombre del material"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Proveedor
                                </label>
                                <input
                                    type="text"
                                    value={proveedor}
                                    onChange={(e) => setProveedor(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nombre del proveedor"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Categoría
                                </label>
                                <input
                                    type="text"
                                    value={categoria}
                                    onChange={(e) => setCategoria(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ej: Madera, Metal"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Unidad
                                </label>
                                <input
                                    type="text"
                                    value={unidad}
                                    onChange={(e) => setUnidad(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ej: m², unidad, kg"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 2: Costos y Dimensiones */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            Costos y Stock
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Precio COP
                                </label>
                                <input
                                    type="number"
                                    value={precioCOP}
                                    onChange={(e) => setPrecioCOP(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0"
                                    min="0"
                                    step="100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Precio por m²
                                </label>
                                <input
                                    type="number"
                                    value={precioPorM2}
                                    onChange={(e) => setPrecioPorM2(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0"
                                    min="0"
                                    step="100"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Stock
                                </label>
                                <input
                                    type="number"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0"
                                    min="0"
                                    step="1"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 3: Dimensiones */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            Dimensiones (mm)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Alto (mm)
                                </label>
                                <input
                                    type="number"
                                    value={altoMm}
                                    onChange={(e) => setAltoMm(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Ancho (mm)
                                </label>
                                <input
                                    type="number"
                                    value={anchoMm}
                                    onChange={(e) => setAnchoMm(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Espesor (mm)
                                </label>
                                <input
                                    type="number"
                                    value={espesorMm}
                                    onChange={(e) => setEspesorMm(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="0"
                                    min="0"
                                    step="0.1"
                                />
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 4: Notas */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            Notas
                        </h3>
                        <textarea
                            value={notas}
                            onChange={(e) => setNotas(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                            placeholder="Observaciones adicionales..."
                        />
                    </section>
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

export default MaterialEditModal;
