import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { format } from 'date-fns';
import { Book, X, Lock, Unlock, Edit3, Trash2, Image as ImageIcon, Plus, Save, Loader2, CheckCircle } from 'lucide-react';
import SearchableStaffSelector from '../../common/SearchableStaffSelector';

const BitacoraManager = ({ notesStr, onChange, staffers = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newEntry, setNewEntry] = useState('');
    const [selectedAuthorId, setSelectedAuthorId] = useState('');
    const [entries, setEntries] = useState([]);

    // Image State
    const [attachedImage, setAttachedImage] = useState(null); // URL string for NEW upload
    const [uploading, setUploading] = useState(false);

    // Preview State (for viewing existing images)
    const [previewImageUrl, setPreviewImageUrl] = useState(null);

    // Admin Mode
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [showAdminInput, setShowAdminInput] = useState(false);
    const [adminCodeInput, setAdminCodeInput] = useState('');

    const handleAdminLogin = () => {
        if (isAdminMode) {
            setIsAdminMode(false);
            setEditModeIndex(null);
            return;
        }
        setShowAdminInput(true);
        setAdminCodeInput('');
    };

    const confirmAdminLogin = () => {
        if (adminCodeInput === import.meta.env.VITE_BITACORA_ADMING_CODE) {
            setIsAdminMode(true);
            setShowAdminInput(false);
        } else {
            alert("Código incorrecto");
        }
        setAdminCodeInput('');
    };

    // Admin Edit/Delete Logic
    const [editModeIndex, setEditModeIndex] = useState(null);
    const [editData, setEditData] = useState({});

    const handleStartEdit = (index, entry) => {
        setEditModeIndex(index);
        setEditData({ ...entry });
    };

    const handleCancelEdit = () => {
        setEditModeIndex(null);
        setEditData({});
    };

    const handleSaveEdit = (index) => {
        const updatedEntries = [...entries];
        updatedEntries[index] = editData;

        setEntries(updatedEntries);
        onChange(JSON.stringify(updatedEntries));
        setEditModeIndex(null);
        setEditData({});
    };

    const handleDeleteEntry = async (index) => {
        if (!confirm('¿Eliminar esta entrada permanentemente?')) return;

        try {
            const entry = entries[index];
            if (entry.imageUrl) {
                const { deleteEvidence } = await import('../../../services/storageService');
                await deleteEvidence(entry.imageUrl);
            }

            const updatedEntries = entries.filter((_, i) => i !== index);
            setEntries(updatedEntries);
            onChange(JSON.stringify(updatedEntries));
        } catch (error) {
            console.error(error);
            alert("Error al eliminar entrada: " + error.message);
        }
    };

    const handleUpdateEntryImage = async (index, file) => {
        try {
            const { uploadBitacoraEvidence } = await import('../../../services/storageService');

            // If we are replacing an existing image in the entry
            const currentEntry = editModeIndex === index ? editData : entries[index];
            if (currentEntry.imageUrl) {
                const { deleteEvidence } = await import('../../../services/storageService');
                await deleteEvidence(currentEntry.imageUrl);
            }

            const url = await uploadBitacoraEvidence(file);

            if (editModeIndex === index) {
                setEditData(prev => ({ ...prev, imageUrl: url }));
            } else {
                const updatedEntries = [...entries];
                updatedEntries[index] = { ...updatedEntries[index], imageUrl: url };
                setEntries(updatedEntries);
                onChange(JSON.stringify(updatedEntries));
            }
        } catch (error) {
            console.error(error);
            alert("Error al actualizar imagen: " + error.message);
        }
    };

    const handleDeleteEntryImage = async (index) => {
        if (!confirm('¿Eliminar imagen de esta entrada?')) return;

        try {
            const entry = editModeIndex === index ? editData : entries[index];
            if (entry.imageUrl) {
                const { deleteEvidence } = await import('../../../services/storageService');
                await deleteEvidence(entry.imageUrl);
            }

            if (editModeIndex === index) {
                const newEditData = { ...editData };
                delete newEditData.imageUrl;
                setEditData(newEditData);
            } else {
                const updatedEntries = [...entries];
                const updatedEntry = { ...updatedEntries[index] };
                delete updatedEntry.imageUrl;
                updatedEntries[index] = updatedEntry;

                setEntries(updatedEntries);
                onChange(JSON.stringify(updatedEntries));
            }
        } catch (error) {
            console.error(error);
            alert("Error al eliminar imagen: " + error.message);
        }
    };

    useEffect(() => {
        try {
            const parsed = JSON.parse(notesStr || '[]');
            setEntries(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
            // Legacy text support
            if (notesStr && typeof notesStr === 'string' && notesStr.trim()) {
                setEntries([{ date: '-', user: 'System', text: notesStr }]);
            } else {
                setEntries([]);
            }
        }
    }, [notesStr]);

    const handleImageSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            setUploading(true);
            const { uploadBitacoraEvidence } = await import('../../../services/storageService');
            const url = await uploadBitacoraEvidence(file);
            setAttachedImage(url);
        } catch (error) {
            console.error(error);
            alert("Error al subir imagen: " + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleAdd = () => {
        if ((!newEntry.trim() && !attachedImage) || !selectedAuthorId) return;

        const author = staffers.find(s => s.id === selectedAuthorId)?.name || 'Unknown';

        const entry = {
            date: format(new Date(), 'dd/MM/yyyy HH:mm'),
            user: author,
            text: newEntry,
            imageUrl: attachedImage // Save URL if exists
        };
        const updated = [entry, ...entries];
        onChange(JSON.stringify(updated));

        // Reset form
        setNewEntry('');
        setAttachedImage(null);
    };

    return (
        <div className="relative">
            <button
                onClick={() => {
                    setIsOpen(!isOpen);
                    if (isOpen) setPreviewImageUrl(null); // Close preview when closing bitacora
                }}
                className={`h-6 px-2 rounded flex items-center gap-1.5 transition-colors border ${isOpen ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                title="Abrir Bitácora"
            >
                <Book size={12} />
                <span className="text-[9px] font-bold uppercase">Bitácora</span>
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => { setIsOpen(false); setPreviewImageUrl(null); }}>
                    {/* Main Bitacora Panel */}
                    <div
                        className="bg-white border border-gray-200 shadow-2xl rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                    <Book size={20} />
                                </div>
                                <h4 className="text-base font-bold text-gray-800 uppercase tracking-wide">
                                    Historial de Bitácora
                                </h4>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={handleAdminLogin}
                                    className={`text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all relative ${isAdminMode ? 'bg-green-100 text-green-700 font-bold border border-green-200' : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700'}`}
                                    title="Modo Administrador"
                                >
                                    {isAdminMode ? <Unlock size={14} /> : <Lock size={14} />}
                                    <span>{isAdminMode ? "Admin Activo" : "Admin"}</span>
                                </button>

                                {/* Password Input Popover - Adjusted for modal */}
                                {showAdminInput && (
                                    <div className="absolute top-16 right-16 bg-white shadow-2xl border border-gray-200 rounded-xl p-4 z-[110] flex flex-col gap-3 w-56 animate-in slide-in-from-top-2 duration-200">
                                        <p className="text-xs font-bold text-gray-700">Acceso Administrador:</p>
                                        <input
                                            type="password"
                                            autoFocus
                                            value={adminCodeInput}
                                            onChange={(e) => setAdminCodeInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && confirmAdminLogin()}
                                            className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                            placeholder="Código..."
                                        />
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setShowAdminInput(false)} className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200 transition-colors">Cancelar</button>
                                            <button onClick={confirmAdminLogin} className="text-xs px-3 py-1.5 bg-blue-600 rounded-lg text-white hover:bg-blue-700 transition-colors">Entrar</button>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => { setIsOpen(false); setPreviewImageUrl(null); }}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Modal Body - Scrollable Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/30">
                            {entries.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-12 text-gray-400 italic">
                                    <Book size={48} className="mb-3 opacity-20" />
                                    <p className="text-sm">No hay registros aún.</p>
                                </div>
                            )}

                            {entries.map((e, idx) => (
                                <div key={idx} className={`bg-white p-4 rounded-xl shadow-sm border transition-all ${editModeIndex === idx ? 'border-blue-400 ring-4 ring-blue-50' : 'border-gray-100 hover:border-gray-200'}`}>
                                    {editModeIndex === idx ? (
                                        // EDIT MODE
                                        <div className="flex flex-col gap-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha/Hora</label>
                                                    <input
                                                        type="text"
                                                        value={editData.date}
                                                        onChange={(ev) => setEditData({ ...editData, date: ev.target.value })}
                                                        className="text-xs border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Usuario</label>
                                                    <input
                                                        type="text"
                                                        value={editData.user}
                                                        onChange={(ev) => setEditData({ ...editData, user: ev.target.value })}
                                                        className="text-xs border border-gray-200 rounded-lg px-3 py-2 w-full focus:ring-2 focus:ring-blue-500 transition-all outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="space-y-1">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nota descriptiva</label>
                                                <textarea
                                                    value={editData.text}
                                                    onChange={(ev) => setEditData({ ...editData, text: ev.target.value })}
                                                    className="w-full text-sm border border-gray-200 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none min-h-[100px] transition-all"
                                                    rows={4}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                                <div className="flex items-center gap-2">
                                                    {editData.imageUrl ? (
                                                        <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                                            <ImageIcon size={14} className="text-blue-500" />
                                                            <span className="text-[10px] font-bold text-blue-700 uppercase">Imagen adjunta</span>
                                                            <button
                                                                onClick={() => handleDeleteEntryImage(idx)}
                                                                className="text-red-500 hover:bg-red-100 rounded-full p-1 transition-colors"
                                                                title="Eliminar imagen"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="relative">
                                                            <input
                                                                type="file"
                                                                id={`edit-mode-img-${idx}`}
                                                                className="hidden"
                                                                accept="image/*"
                                                                onChange={(evt) => evt.target.files[0] && handleUpdateEntryImage(idx, evt.target.files[0])}
                                                            />
                                                            <label htmlFor={`edit-mode-img-${idx}`} className="flex items-center gap-2 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-blue-100 transition-all uppercase">
                                                                <Plus size={14} /> Adjuntar Imagen
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button onClick={handleCancelEdit} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-lg hover:bg-gray-50 transition-all uppercase">Cancelar</button>
                                                    <button onClick={() => handleSaveEdit(idx)} className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-all uppercase shadow-md active:scale-95">
                                                        <Save size={14} /> Guardar Cambios
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        // VIEW MODE
                                        <>
                                            <div className="flex justify-between items-start mb-2 border-b border-gray-50 pb-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">{e.date}</span>
                                                    <span className="text-xs font-black text-blue-600 uppercase mt-0.5 tracking-tight">{e.user}</span>
                                                </div>
                                                {isAdminMode && (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => handleStartEdit(idx, e)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                            title="Editar entrada"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteEntry(idx)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                            title="Eliminar entrada"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-medium">{e.text}</p>

                                            {e.imageUrl && (
                                                <div className="mt-3">
                                                    <button
                                                        onClick={() => setPreviewImageUrl(previewImageUrl === e.imageUrl ? null : e.imageUrl)}
                                                        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${previewImageUrl === e.imageUrl ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white hover:bg-blue-50 border-blue-100 text-blue-600 uppercase'}`}
                                                    >
                                                        <ImageIcon size={14} />
                                                        {previewImageUrl === e.imageUrl ? 'Cerrar Vista Previa' : 'Ver Imagen Adjunta'}
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Modal Footer - New Entry Form */}
                        <div className="p-6 bg-white border-t border-gray-100 shadow-[0_-10px_20px_-15px_rgba(0,0,0,0.1)]">
                            <div className="max-w-xl mx-auto space-y-3">
                                <SearchableStaffSelector
                                    staffers={staffers}
                                    value={selectedAuthorId}
                                    onChange={setSelectedAuthorId}
                                    placeholder="¿Quién está registrando?"
                                    label="Responsable del Registro"
                                />

                                <div className="flex gap-3 items-end">
                                    <div className="flex-1">
                                        <textarea
                                            value={newEntry}
                                            onChange={(e) => setNewEntry(e.target.value)}
                                            placeholder="Describa el avance o incidencia..."
                                            rows={2}
                                            className="w-full text-sm border border-gray-200 rounded-xl p-3 focus:ring-2 focus:ring-blue-500 bg-gray-50/50 outline-none transition-all placeholder:text-gray-400"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleAdd();
                                                }
                                            }}
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <input
                                            type="file"
                                            id="bitacora-img-upload"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleImageSelect}
                                            disabled={uploading}
                                        />
                                        <label
                                            htmlFor="bitacora-img-upload"
                                            className={`flex items-center justify-center h-10 w-10 rounded-xl border-2 transition-all cursor-pointer ${attachedImage ? 'bg-green-50 border-green-200 text-green-600' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50'}`}
                                            title={attachedImage ? "Imagen seleccionada" : "Adjuntar foto"}
                                        >
                                            {uploading ? <Loader2 size={18} className="animate-spin" /> : attachedImage ? <CheckCircle size={18} /> : <ImageIcon size={20} />}
                                        </label>

                                        <button
                                            onClick={handleAdd}
                                            disabled={(!newEntry.trim() && !attachedImage) || !selectedAuthorId || uploading}
                                            className="flex items-center justify-center h-10 w-10 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-30 disabled:grayscale transition-all shadow-lg active:scale-90"
                                            title="Registrar Nota"
                                        >
                                            <Plus size={24} />
                                        </button>
                                    </div>
                                </div>
                                {attachedImage && (
                                    <div className="flex items-center justify-between bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 animate-in fade-in slide-in-from-left-2 duration-200">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[10px] font-bold text-green-700 uppercase">Foto lista para subir</span>
                                        </div>
                                        <button onClick={() => setAttachedImage(null)} className="p-1 text-red-500 hover:bg-red-100 rounded-full transition-colors"><X size={12} /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Side Preview Panel - Adjusted for centered layout */}
                    {previewImageUrl && createPortal(
                        <div
                            className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-md p-8"
                            onClick={() => setPreviewImageUrl(null)}
                        >
                            <div
                                className="relative bg-white rounded-2xl overflow-hidden shadow-2xl max-w-5xl max-h-full flex flex-col"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-white">
                                    <h4 className="text-xs font-black text-gray-800 uppercase flex items-center gap-2">
                                        <ImageIcon size={16} className="text-blue-500" /> Detalle de Evidencia
                                    </h4>
                                    <button
                                        onClick={() => setPreviewImageUrl(null)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>
                                <div className="p-2 bg-zinc-900 rounded-b-2xl overflow-hidden">
                                    <img
                                        src={previewImageUrl}
                                        alt="Evidence Full View"
                                        className="max-w-full max-h-[80vh] object-contain shadow-2xl"
                                    />
                                </div>
                            </div>
                        </div>,
                        document.body
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

export default BitacoraManager;
