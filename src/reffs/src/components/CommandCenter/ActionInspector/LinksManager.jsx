import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Layers, X, Plus } from 'lucide-react';

const LinksManager = ({ linksStr, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [links, setLinks] = useState([]);
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');

    useEffect(() => {
        try {
            const parsed = JSON.parse(linksStr || '[]');
            setLinks(Array.isArray(parsed) ? parsed : []);
        } catch (e) {
            setLinks([]);
        }
    }, [linksStr]);

    const handleAdd = () => {
        if (!newName.trim() || !newUrl.trim()) return;

        // Simple URL validation prefix
        let formattedUrl = newUrl.trim();
        if (!/^https?:\/\//i.test(formattedUrl)) {
            formattedUrl = 'https://' + formattedUrl;
        }

        const newLinkObj = {
            nombre: newName.trim(),
            link: formattedUrl
        };

        const updated = [...links, newLinkObj];
        onChange(JSON.stringify(updated));

        setNewName('');
        setNewUrl('');
    };

    const handleDelete = (index) => {
        const updated = links.filter((_, i) => i !== index);
        onChange(JSON.stringify(updated));
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`h-6 px-2 rounded flex items-center gap-1.5 transition-colors border ${isOpen ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-600'}`}
                title="Links de Interés"
            >
                <Layers size={12} />
                <span className="text-[9px] font-bold uppercase">Links</span>
            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setIsOpen(false)}>
                    <div
                        className="bg-white border border-gray-200 shadow-2xl rounded-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                                    <Layers size={18} />
                                </div>
                                <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                                    Links de Interés
                                </h4>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto p-4 space-y-2">
                            {links.length === 0 && (
                                <div className="py-8 text-center text-gray-400 italic flex flex-col items-center gap-2">
                                    <Layers size={32} className="opacity-20" />
                                    <p className="text-xs font-medium">No hay links vinculados.</p>
                                </div>
                            )}
                            {links.map((li, idx) => (
                                <div key={idx} className="flex items-center justify-between group bg-white hover:bg-gray-50 px-3 py-2 rounded-xl border border-gray-100 hover:border-indigo-200 transition-all shadow-sm">
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <a
                                            href={li.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-xs text-indigo-600 hover:text-indigo-800 font-bold truncate transition-colors"
                                            title={li.link}
                                        >
                                            {li.nombre}
                                        </a>
                                        <span className="text-[9px] text-gray-400 truncate mt-0.5">{li.link}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(idx)}
                                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all ml-2"
                                        title="Eliminar link"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-white border-t border-gray-50 space-y-3">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">Título</label>
                                <input
                                    type="text"
                                    placeholder="Ej: Planos de la obra"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full text-xs border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-1">URL / Link</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="drive.google.com/..."
                                        value={newUrl}
                                        onChange={(e) => setNewUrl(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
                                        className="flex-1 text-xs border border-gray-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-gray-300"
                                    />
                                    <button
                                        onClick={handleAdd}
                                        disabled={!newName.trim() || !newUrl.trim()}
                                        className="bg-indigo-600 text-white rounded-xl px-4 hover:bg-indigo-700 disabled:opacity-30 transition-all shadow-lg shadow-indigo-200 active:scale-90 flex items-center justify-center"
                                    >
                                        <Plus size={20} />
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

export default LinksManager;
