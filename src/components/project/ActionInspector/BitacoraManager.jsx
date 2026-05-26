import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Book, X, Lock, Unlock, Edit3, Trash2, Image as ImageIcon, Plus, Save, Loader2, CheckCircle } from 'lucide-react';
import SearchableStaffSelector from '../../common/SearchableStaffSelector';

const BitacoraManager = ({ notesStr, onChange, staffers = [] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [newEntry, setNewEntry] = useState('');
    const [selectedAuthorId, setSelectedAuthorId] = useState('');
    const [entries, setEntries] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [showAdminInput, setShowAdminInput] = useState(false);
    const [adminCodeInput, setAdminCodeInput] = useState('');

    useEffect(() => {
        try {
            const parsed = JSON.parse(notesStr || '[]');
            setEntries(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
            setEntries([]);
        }
    }, [notesStr]);

    const handleAdd = () => {
        if (!newEntry.trim() || !selectedAuthorId) return;
        const author = staffers.find(s => s.id === selectedAuthorId)?.name || 'Sistema';
        const entry = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            user: author,
            text: newEntry,
        };
        const updated = [entry, ...entries];
        onChange(JSON.stringify(updated));
        setNewEntry('');
    };

    const handleDeleteEntry = (id) => {
        if (!isAdminMode) return;
        const updated = entries.filter(e => e.id !== id);
        onChange(JSON.stringify(updated));
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`h-8 px-4 border-2 border-[#1c1c19] flex items-center gap-2 transition-all shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 font-black uppercase text-[10px] tracking-widest ${isOpen ? 'bg-[#0f4369] text-white' : 'bg-white text-[#1c1c19]'}`}
            >
                <Book size={14} />
                <span>Bitácora</span>
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setIsOpen(false)}>
                    <div
                        className="bg-white border-4 border-[#1c1c19] shadow-[12px_12px_0_0_rgba(0,0,0,1)] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center px-6 py-4 border-b-4 border-[#1c1c19] bg-[#fcf9f4]">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#1c1c19] text-white">
                                    <Book size={20} />
                                </div>
                                <h4 className="text-lg font-black text-[#1c1c19] uppercase italic tracking-tighter">
                                    Historial Operativo de Bitácora
                                </h4>
                            </div>

                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => isAdminMode ? setIsAdminMode(false) : setShowAdminInput(true)}
                                    className={`text-[9px] flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#1c1c19] font-black uppercase tracking-widest transition-all ${isAdminMode ? 'bg-red-600 text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]' : 'bg-white text-gray-500 hover:bg-[#f6f3ee]'}`}
                                >
                                    {isAdminMode ? <Unlock size={14} /> : <Lock size={14} />}
                                    <span>{isAdminMode ? "Admin_Activo" : "Admin"}</span>
                                </button>
                                
                                <button onClick={() => setIsOpen(false)} className="hover:text-red-600 transition-all">
                                    <X size={32} strokeWidth={3} />
                                </button>
                            </div>
                        </div>

                        {showAdminInput && (
                            <div className="p-4 bg-[#1c1c19] text-white flex gap-4 items-center animate-in slide-in-from-top duration-300">
                                <span className="text-[10px] font-black uppercase tracking-widest">Código de Acceso:</span>
                                <input 
                                    type="password"
                                    value={adminCodeInput}
                                    onChange={(e) => setAdminCodeInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && adminCodeInput === '2024') {
                                            setIsAdminMode(true);
                                            setShowAdminInput(false);
                                            setAdminCodeInput('');
                                        }
                                    }}
                                    className="bg-white/10 border-2 border-white/30 px-3 py-1 text-sm font-bold outline-none focus:border-white"
                                    placeholder="****"
                                />
                                <button onClick={() => setShowAdminInput(false)} className="text-[9px] font-bold underline">Cerrar</button>
                            </div>
                        )}

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#f6f3ee]">
                            {entries.length === 0 && (
                                <div className="text-center py-16 text-[#72777f] font-black uppercase italic tracking-[0.2em] opacity-40">
                                    <Book size={64} className="mx-auto mb-4" />
                                    Sin registros técnicos
                                </div>
                            )}

                            {entries.map((e, idx) => (
                                <div key={idx} className="bg-white border-2 border-[#1c1c19] p-5 shadow-[4px_4px_0_0_rgba(28,28,25,1)] relative group">
                                    <div className="flex justify-between items-start mb-3 border-b-2 border-gray-100 pb-2">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-[#72777f] uppercase tracking-tighter">{e.date}</span>
                                            <span className="text-xs font-black text-[#0f4369] uppercase italic">{e.user}</span>
                                        </div>
                                        {isAdminMode && (
                                            <button
                                                onClick={() => handleDeleteEntry(e.id)}
                                                className="p-1 text-red-500 hover:bg-red-50 rounded transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                    <p className="text-sm text-[#1c1c19] font-medium leading-relaxed">{e.text}</p>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="p-6 bg-white border-t-4 border-[#1c1c19]">
                            <div className="space-y-4">
                                <SearchableStaffSelector
                                    staffers={staffers}
                                    value={selectedAuthorId}
                                    onChange={setSelectedAuthorId}
                                    placeholder="Responsable del Reporte"
                                    label="Validación de Usuario"
                                />
                                <div className="flex gap-4">
                                    <textarea
                                        value={newEntry}
                                        onChange={(e) => setNewEntry(e.target.value)}
                                        placeholder="Escriba el avance técnico o incidencia..."
                                        className="flex-1 text-sm border-2 border-[#1c1c19] p-4 font-bold focus:bg-[#fcf9f4] outline-none min-h-[100px] resize-none"
                                    />
                                    <button
                                        onClick={handleAdd}
                                        disabled={!newEntry.trim() || !selectedAuthorId}
                                        className="bg-[#1c1c19] text-white w-20 flex flex-col items-center justify-center gap-2 hover:bg-[#0f4369] transition-all disabled:opacity-30 disabled:grayscale"
                                    >
                                        <Plus size={32} strokeWidth={3} />
                                        <span className="text-[8px] font-black uppercase">Añadir</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default BitacoraManager;
