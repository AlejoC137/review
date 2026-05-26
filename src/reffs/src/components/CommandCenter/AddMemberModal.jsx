import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, User, Briefcase } from 'lucide-react';
import { createStaff, updateStaff } from '../../services/spacesService';

const AddMemberModal = ({ isOpen, onClose, onMemberAdded, member = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        role_description: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isEditing = !!member;

    useEffect(() => {
        if (member) {
            setFormData({
                name: member.name || '',
                role_description: member.role_description || ''
            });
        } else {
            setFormData({ name: '', role_description: '' });
        }
    }, [member, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            setError('El nombre es requerido');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            if (isEditing) {
                await updateStaff(member.id, {
                    name: formData.name,
                    role_description: formData.role_description
                });
            } else {
                await createStaff({
                    name: formData.name,
                    role_description: formData.role_description
                });
            }
            onMemberAdded();
            onClose();
            if (!isEditing) setFormData({ name: '', role_description: '' });
        } catch (err) {
            setError(err.message || `Error al ${isEditing ? 'actualizar' : 'crear'} integrante`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md m-4 scale-100 animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <User size={20} className="text-blue-600" />
                        {isEditing ? 'Editar Integrante' : 'Nuevo Integrante del Equipo'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                            <span className="font-bold">Error:</span> {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                            Nombre Completo *
                        </label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                placeholder="Ej: Juan Pérez"
                                autoFocus
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">
                            Rol / Cargo
                        </label>
                        <div className="relative">
                            <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={formData.role_description}
                                onChange={(e) => setFormData(prev => ({ ...prev, role_description: e.target.value }))}
                                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all outline-none"
                                placeholder="Ej: Arquitecto Senior"
                            />
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50/50 rounded-b-xl">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transition-all disabled:opacity-50"
                    >
                        {loading ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                {isEditing ? 'Actualizando...' : 'Guardando...'}
                            </>
                        ) : (
                            <>
                                <Save size={16} />
                                {isEditing ? 'Guardar Cambios' : 'Guardar Integrante'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AddMemberModal;
