import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Loader2, ExternalLink } from 'lucide-react';
import { updateProject } from '../../services/projectsService';

const STATUS_OPTIONS = ['En Diseño', 'En Obra', 'Terminado'];

const ProjectEditModal = ({ project, isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Campos directos
    const [name, setName] = useState('');
    const [responsable, setResponsable] = useState('');
    const [finished, setStatus] = useState('');

    // Campos JSON (Datos)
    const [etapa, setEtapa] = useState('');
    const [materialesConstantes, setMaterialesConstantes] = useState([]);
    const [presentacionesEspacio, setPresentacionesEspacio] = useState([]);

    useEffect(() => {
        if (project && isOpen) {
            // Campos directos
            setName(project.name || '');
            setResponsable(project.responsable || '');
            setStatus(project.finished || '');

            // Parsear datos JSON
            const datos = typeof project.Datos === 'string'
                ? JSON.parse(project.Datos || '{}')
                : (project.Datos || {});

            setEtapa(datos.etapa || '');
            setMaterialesConstantes(datos.materialesConstantes || []);
            setPresentacionesEspacio(datos.presentacionesEspacio || []);
            setError(null);
        }
    }, [project, isOpen]);

    // --- Handlers para Materiales Constantes ---
    const addMaterialConstante = () => {
        setMaterialesConstantes([
            ...materialesConstantes,
            { categoria: '', nombre: '', observaciones: '' }
        ]);
    };

    const updateMaterialConstante = (index, field, value) => {
        const updated = [...materialesConstantes];
        updated[index] = { ...updated[index], [field]: value };
        setMaterialesConstantes(updated);
    };

    const removeMaterialConstante = (index) => {
        setMaterialesConstantes(materialesConstantes.filter((_, i) => i !== index));
    };

    // --- Handlers para Presentaciones ---
    const updatePresentacion = (index, field, value) => {
        const updated = [...presentacionesEspacio];
        updated[index] = { ...updated[index], [field]: value };
        setPresentacionesEspacio(updated);
    };

    // --- Guardar ---
    const handleSave = async () => {
        setLoading(true);
        setError(null);
        try {
            const updatedProject = await updateProject(project.id, {
                name,
                responsable,
                finished,
                Datos: {
                    etapa,
                    materialesConstantes,
                    presentacionesEspacio,
                }
            });
            onSave(updatedProject);
            onClose();
        } catch (err) {
            setError(err.message || 'Error al guardar el proyecto');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">Editar Proyecto</h2>
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

                    {/* SECCIÓN 1: Cabecera */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            Información General
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Nombre del Proyecto
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ej: Casa Norte"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Responsable
                                </label>
                                <input
                                    type="text"
                                    value={responsable}
                                    onChange={(e) => setResponsable(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Nombre del responsable"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Estado
                                </label>
                                <select
                                    value={finished}
                                    onChange={(e) => setStatus(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                >
                                    <option value="">Seleccionar...</option>
                                    {STATUS_OPTIONS.map(opt => (
                                        <option key={opt} value={opt}>{opt}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </section>

                    {/* SECCIÓN 2: Configuración Avanzada (Datos JSON) */}
                    <section>
                        <h3 className="text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            Configuración Avanzada
                        </h3>

                        {/* Etapa */}
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                Etapa del Proyecto
                            </label>
                            <input
                                type="text"
                                value={etapa}
                                onChange={(e) => setEtapa(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: Acabados, Estructura, Cimentación"
                            />
                        </div>

                        {/* Materiales Constantes */}
                        <div className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <label className="block text-xs font-medium text-gray-600">
                                    Materiales Constantes
                                </label>
                                <button
                                    type="button"
                                    onClick={addMaterialConstante}
                                    className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    <Plus size={14} />
                                    Agregar
                                </button>
                            </div>
                            {materialesConstantes.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No hay materiales constantes definidos.</p>
                            ) : (
                                <div className="space-y-2">
                                    {materialesConstantes.map((mat, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                                            <input
                                                type="text"
                                                value={mat.categoria || ''}
                                                onChange={(e) => updateMaterialConstante(index, 'categoria', e.target.value)}
                                                placeholder="Categoría"
                                                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                value={mat.nombre || ''}
                                                onChange={(e) => updateMaterialConstante(index, 'nombre', e.target.value)}
                                                placeholder="Nombre"
                                                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                            />
                                            <input
                                                type="text"
                                                value={mat.observaciones || ''}
                                                onChange={(e) => updateMaterialConstante(index, 'observaciones', e.target.value)}
                                                placeholder="Observaciones"
                                                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removeMaterialConstante(index)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Presentaciones (Canva) */}
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-2">
                                Presentaciones (Canva)
                            </label>
                            {presentacionesEspacio.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No hay presentaciones definidas.</p>
                            ) : (
                                <div className="space-y-2">
                                    {presentacionesEspacio.map((pres, index) => (
                                        <div key={index} className="flex items-center gap-2 bg-gray-50 p-3 rounded-lg">
                                            <input
                                                type="text"
                                                value={pres.espacio || pres.nombre || ''}
                                                readOnly
                                                className="w-32 px-2 py-1.5 text-xs border border-gray-200 rounded bg-gray-100 text-gray-600"
                                                title="Nombre del espacio (solo lectura)"
                                            />
                                            <input
                                                type="url"
                                                value={pres.link || ''}
                                                onChange={(e) => updatePresentacion(index, 'link', e.target.value)}
                                                placeholder="https://canva.com/..."
                                                className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                            />
                                            {pres.link && (
                                                <a
                                                    href={pres.link}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition-colors"
                                                >
                                                    <ExternalLink size={14} />
                                                </a>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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

export default ProjectEditModal;
