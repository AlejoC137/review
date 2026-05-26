import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, User, Phone, Briefcase } from 'lucide-react';
import { createContact, updateContact } from '../../services/directoryService';

const ContactModal = ({ contact, isOpen, onClose, onSave }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [nombre, setNombre] = useState('');
    const [cargo, setCargo] = useState('');
    const [contacto, setContacto] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (contact) {
                setNombre(contact.Nombre || '');
                setCargo(contact.Cargo || '');
                setContacto(contact.Contacto || '');
            } else {
                setNombre('');
                setCargo('');
                setContacto('');
            }
            setError(null);
        }
    }, [contact, isOpen]);

    const handleSave = async () => {
        if (!nombre.trim()) {
            setError('El nombre es obligatorio');
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const contactData = {
                Nombre: nombre,
                Cargo: cargo,
                Contacto: contacto
            };

            let savedContact;
            if (contact?.id) {
                savedContact = await updateContact(contact.id, contactData);
            } else {
                savedContact = await createContact(contactData);
            }

            onSave(savedContact);
            onClose();
        } catch (err) {
            setError(err.message || 'Error al guardar el contacto');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-200">
                    <h2 className="text-xl font-bold text-gray-900">
                        {contact ? 'Editar Contacto' : 'Nuevo Contacto'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Nombre <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Nombre completo"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Cargo / Rol
                        </label>
                        <div className="relative">
                            <Briefcase size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                value={cargo}
                                onChange={(e) => setCargo(e.target.value)}
                                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Ej: Arquitecto, Proveedor, Cliente"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                            Información de Contacto
                        </label>
                        <div className="relative">
                            <Phone size={16} className="absolute left-3 top-3 text-gray-400" />
                            <textarea
                                value={contacto}
                                onChange={(e) => setContacto(e.target.value)}
                                rows={4}
                                className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Teléfono, email, dirección, etc."
                            />
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-200 bg-gray-50 rounded-b-xl">
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
                                {contact ? 'Actualizar' : 'Guardar'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContactModal;
