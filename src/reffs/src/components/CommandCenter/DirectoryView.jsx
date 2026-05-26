import React, { useState, useEffect } from 'react';
import { BookOpen, User, Phone, Briefcase, Search, Edit, Plus } from 'lucide-react';
import { getContacts } from '../../services/directoryService';
import ContactModal from './ContactModal';

const DirectoryView = () => {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContact, setSelectedContact] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState(null);

    useEffect(() => {
        loadContacts();
    }, []);

    const loadContacts = async () => {
        setLoading(true);
        try {
            const data = await getContacts();
            setContacts(data || []);
        } catch (error) {
            console.error('Error loading contacts:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredContacts = contacts.filter(contact => {
        const searchLower = searchTerm.toLowerCase();
        return (
            contact.Nombre?.toLowerCase().includes(searchLower) ||
            contact.Cargo?.toLowerCase().includes(searchLower) ||
            contact.Contacto?.toLowerCase().includes(searchLower)
        );
    });

    const handleAddContact = () => {
        setEditingContact(null);
        setIsModalOpen(true);
    };

    const handleEditContact = (contact) => {
        setEditingContact(contact);
        setIsModalOpen(true);
    };

    const handleSaveContact = (savedContact) => {
        loadContacts(); // Recargar la lista completa
        if (selectedContact?.id === savedContact.id) {
            setSelectedContact(savedContact);
        }
    };

    return (
        <div className="h-full flex bg-white">
            {/* LEFT: Contacts List */}
            <div className="w-80 border-r border-gray-200 flex flex-col">
                {/* Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <BookOpen size={20} className="text-blue-600" />
                            Directorio
                        </h2>
                        <button
                            onClick={handleAddContact}
                            className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            title="Nuevo Contacto"
                        >
                            <Plus size={18} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative mb-3">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar contactos..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>

                    <p className="text-xs text-gray-600">
                        {filteredContacts.length} contactos
                    </p>
                </div>

                {/* Contacts List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
                    ) : filteredContacts.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">
                            No se encontraron contactos
                        </div>
                    ) : (
                        filteredContacts.map((contact) => (
                            <button
                                key={contact.id}
                                onClick={() => setSelectedContact(contact)}
                                className={`
                                    w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors
                                    ${selectedContact?.id === contact.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                                        <User size={20} className="text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm text-gray-900 truncate">
                                            {contact.Nombre}
                                        </div>
                                        {contact.Cargo && (
                                            <div className="text-xs text-gray-500 truncate">
                                                {contact.Cargo}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </button>
                        ))
                    )}
                </div>
            </div>

            {/* RIGHT: Contact Details */}
            <div className="flex-1 flex flex-col">
                {selectedContact ? (
                    <>
                        {/* Header */}
                        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-white">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-4 flex-1">
                                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                                        <User size={32} className="text-blue-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                            {selectedContact.Nombre}
                                        </h3>
                                        {selectedContact.Cargo && (
                                            <p className="text-sm text-gray-600 flex items-center gap-2">
                                                <Briefcase size={14} />
                                                {selectedContact.Cargo}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleEditContact(selectedContact)}
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
                                {/* Contact Info */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-700 mb-3">Información de Contacto</h4>
                                    <div className="space-y-3">
                                        {selectedContact.Contacto && (
                                            <div className="flex items-start gap-3">
                                                <Phone size={16} className="text-gray-400 mt-0.5" />
                                                <div className="flex-1">
                                                    <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                                        {selectedContact.Contacto}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        {!selectedContact.Contacto && (
                                            <p className="text-sm text-gray-500 italic">
                                                No hay información de contacto disponible
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Role/Position */}
                                {selectedContact.Cargo && (
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 mb-3">Cargo/Rol</h4>
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <p className="text-sm text-gray-700">
                                                {selectedContact.Cargo}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center">
                            <BookOpen size={48} className="mx-auto mb-3 opacity-50" />
                            <p className="text-sm">Selecciona un contacto para ver detalles</p>
                        </div>
                    </div>
                )}
            </div>

            <ContactModal
                isOpen={isModalOpen}
                contact={editingContact}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveContact}
            />
        </div>
    );
};

export default DirectoryView;
