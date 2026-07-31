import React, { useState } from 'react';
import { Box, Search, X, Edit3, Trash2, Plus } from 'lucide-react';

export default function ComponentPickerModal({
    isOpen,
    onClose,
    allComponents,
    onSelect,
    isBimManager = false,
    // Optional handlers if you want edit capabilities
    onUpdateComponent,
    onDeleteComponent,
    onCreateComponent
}) {
    const [compSearch, setCompSearch] = useState('');
    const [editingComp, setEditingComp] = useState(null);
    const [editCompData, setEditCompData] = useState({ subcomponente: '', categoria_revit: '' });
    const [isAddingNewComponent, setIsAddingNewComponent] = useState(false);
    const [newCompName, setNewCompName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('TODAS');
    const [customCategories, setCustomCategories] = useState([]);
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    if (!isOpen) return null;

    const handleSelect = (c) => {
        if (onSelect) onSelect(c);
        setCompSearch('');
        onClose();
    };

    return (
        <div className="absolute inset-0 z-[200] bg-[#1c1c19]/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white border-4 border-[#1c1c19] w-full max-w-2xl shadow-[12px_12px_0_0_rgba(0,0,0,1)] flex flex-col max-h-[85vh]">
                <div className="p-4 border-b-4 border-[#1c1c19] bg-[#1c1c19] text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Box size={18} />
                        <h3 className="text-sm font-black italic uppercase tracking-widest">CATÁLOGO_MAESTRO_DE_COMPONENTES</h3>
                    </div>
                    <button onClick={() => { onClose(); setCompSearch(''); setIsAddingNewComponent(false); }} className="p-1 hover:bg-white hover:text-[#1c1c19] transition-all"><X size={20} /></button>
                </div>

                <div className="p-4 bg-[#f6f3ee] border-b-2 border-[#1c1c19]">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72777f]" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="BUSCAR COMPONENTE..."
                            value={compSearch}
                            onChange={(e) => setCompSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 text-[11px] font-black uppercase border-2 border-[#1c1c19] focus:outline-none bg-white shadow-[4px_4px_0_0_rgba(0,0,0,0.1)]"
                        />
                    </div>
                </div>

                <div className="flex-1 min-h-0 overflow-hidden flex flex-col bg-[#fcf9f4]">
                    {editingComp && onUpdateComponent ? (
                        <div className="p-4 bg-white border-2 border-[#1c1c19] space-y-4 m-2 overflow-y-auto">
                            <h4 className="text-[10px] font-black uppercase italic border-b-2 border-[#1c1c19] pb-1">EDITAR_COMPONENTE_DEL_CATÁLOGO</h4>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[7px] font-black text-[#72777f] uppercase mb-0.5">SUBCOMPONENTE</label>
                                    <input
                                        type="text"
                                        value={editCompData.subcomponente}
                                        onChange={(e) => setEditCompData({ ...editCompData, subcomponente: e.target.value })}
                                        className="w-full p-2 border-2 border-[#1c1c19] text-[10px] font-black uppercase outline-none focus:bg-[#f6f3ee]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[7px] font-black text-[#72777f] uppercase mb-0.5">CATEGORÍA REVIT</label>
                                    <input
                                        type="text"
                                        value={editCompData.categoria_revit}
                                        onChange={(e) => setEditCompData({ ...editCompData, categoria_revit: e.target.value })}
                                        className="w-full p-2 border-2 border-[#1c1c19] text-[10px] font-black uppercase outline-none focus:bg-[#f6f3ee]"
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button onClick={() => { onUpdateComponent(editingComp.id, editCompData); setEditingComp(null); }} className="flex-1 py-2 bg-[#1c1c19] text-white text-[9px] font-black uppercase hover:bg-[#0f4369] transition-all">GUARDAR_CAMBIOS</button>
                                    <button onClick={() => setEditingComp(null)} className="px-4 py-2 border-2 border-[#1c1c19] text-[9px] font-black uppercase hover:bg-gray-100 transition-all">CANCELAR</button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-1 min-h-0 w-full">
                            {/* Categorías Sidebar */}
                            <div className="w-1/3 min-w-[150px] border-r-2 border-[#1c1c19] flex flex-col bg-white">
                                <div className="p-2 bg-[#f6f3ee] border-b-2 border-[#1c1c19] text-[9px] font-black uppercase tracking-widest text-[#1c1c19]">
                                    Filtro de Categorías
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                                        {(() => {
                                        const derivedCategories = (allComponents || []).map(c => c.categoria_revit || 'SIN CATEGORÍA REVIT');
                                        const uniqueCategories = ['TODAS', ...new Set([...derivedCategories, ...customCategories])].sort();
                                        return uniqueCategories.map(cat => (
                                            <button
                                                key={cat}
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`w-full text-left p-2.5 text-[9px] font-black uppercase transition-all border-b-2 border-[#1c1c19]/5 ${selectedCategory === cat ? 'bg-[#1c1c19] text-white border-l-4 border-l-[#0f4369]' : 'hover:bg-[#f6f3ee] text-[#72777f]'}`}
                                            >
                                                {cat}
                                            </button>
                                        ));
                                    })()}
                                </div>
                                {isBimManager && (
                                    <div className="p-2 border-t-2 border-[#1c1c19] bg-[#f6f3ee]">
                                        {isAddingCategory ? (
                                            <div className="flex flex-col gap-2">
                                                <input
                                                    autoFocus
                                                    type="text"
                                                    value={newCategoryName}
                                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                                    placeholder="NUEVA CATEGORÍA..."
                                                    className="w-full p-2 border-2 border-[#1c1c19] text-[9px] font-black uppercase outline-none focus:bg-white"
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' && newCategoryName.trim()) {
                                                            const catName = newCategoryName.trim().toUpperCase();
                                                            setCustomCategories(prev => [...prev, catName]);
                                                            setSelectedCategory(catName);
                                                            setNewCategoryName('');
                                                            setIsAddingCategory(false);
                                                        }
                                                    }}
                                                />
                                                <div className="flex gap-1">
                                                    <button 
                                                        onClick={() => {
                                                            if (newCategoryName.trim()) {
                                                                const catName = newCategoryName.trim().toUpperCase();
                                                                setCustomCategories(prev => [...prev, catName]);
                                                                setSelectedCategory(catName);
                                                            }
                                                            setNewCategoryName('');
                                                            setIsAddingCategory(false);
                                                        }}
                                                        className="flex-1 py-1.5 bg-[#1c1c19] text-white text-[8px] font-black uppercase hover:bg-[#0f4369] transition-all"
                                                    >
                                                        AGREGAR
                                                    </button>
                                                    <button onClick={() => setIsAddingCategory(false)} className="px-2 py-1.5 border-2 border-[#1c1c19] text-[8px] font-black uppercase hover:bg-white transition-all">X</button>
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setIsAddingCategory(true)}
                                                className="w-full py-2 border-2 border-dashed border-[#1c1c19] text-[#1c1c19] text-[8px] font-black uppercase hover:bg-white transition-all flex items-center justify-center gap-1"
                                            >
                                                <Plus size={12} /> NUEVA CATEGORÍA
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Componentes List */}
                            <div className="w-2/3 flex flex-col bg-[#fcf9f4]">
                                <div className="p-2 bg-[#e0dcd3] border-b-2 border-[#1c1c19] text-[9px] font-black uppercase tracking-widest text-[#1c1c19]">
                                    Mostrando: {selectedCategory}
                                </div>
                                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                    {(() => {
                                        const filtered = (allComponents || []).filter(c => {
                                            const matchesSearch = (c.subcomponente || '').toLowerCase().includes(compSearch.toLowerCase()) || 
                                                                  (c.categoria_revit || '').toLowerCase().includes(compSearch.toLowerCase());
                                            const matchesCategory = selectedCategory === 'TODAS' || (c.categoria_revit || 'SIN CATEGORÍA REVIT') === selectedCategory;
                                            return matchesSearch && matchesCategory;
                                        }).sort((a, b) => (a.subcomponente || '').localeCompare(b.subcomponente || ''));

                                        if (filtered.length === 0) {
                                            return <div className="p-4 text-center text-[10px] font-bold text-[#72777f] uppercase">No se encontraron componentes en esta categoría.</div>;
                                        }

                                        return filtered.map(c => (
                                            <div key={c.id} className="flex gap-1 group">
                                                <button
                                                    onClick={() => handleSelect(c)}
                                                    className={`flex-1 p-2 border-2 transition-all flex items-center justify-between ${c.es_principal ? 'border-[#1c1c19] bg-[#ffe815] text-[#1c1c19] hover:bg-white' : 'border-[#1c1c19] bg-white hover:bg-[#1c1c19] hover:text-white'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black uppercase tracking-tight">{c.subcomponente}</span>
                                                    </div>
                                                    <span className="text-[7px] font-bold opacity-40 uppercase truncate max-w-[120px]">{c.descripcion}</span>
                                                </button>
                                                {isBimManager && onUpdateComponent && onDeleteComponent && (
                                                    <>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingComp(c);
                                                                setEditCompData({ subcomponente: c.subcomponente, categoria_revit: c.categoria_revit });
                                                            }}
                                                            className="px-2 border-2 border-[#1c1c19] text-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all bg-white"
                                                        >
                                                            <Edit3 size={12} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                onDeleteComponent(c.id);
                                                            }}
                                                            className="px-2 border-2 border-[#1c1c19] text-red-500 hover:bg-red-500 hover:text-white transition-all bg-white"
                                                        >
                                                            <Trash2 size={12} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        ));
                                    })()}

                                    {isBimManager && onCreateComponent && (
                                        <div className="mt-4 p-3 border-2 border-dashed border-[#1c1c19] bg-white">
                                            {isAddingNewComponent ? (
                                                <div className="space-y-2">
                                                    <div>
                                                        <label className="block text-[7px] font-black text-[#72777f] uppercase mb-0.5">SUBCOMPONENTE</label>
                                                        <input
                                                            autoFocus
                                                            type="text"
                                                            value={newCompName}
                                                            onChange={(e) => setNewCompName(e.target.value)}
                                                            placeholder={`NUEVO EN ${selectedCategory === 'TODAS' ? 'CATÁLOGO' : selectedCategory}...`}
                                                            className="w-full p-2 border-2 border-[#1c1c19] text-[10px] font-black uppercase outline-none focus:bg-[#f6f3ee]"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[7px] font-black text-[#72777f] uppercase mb-0.5">DESCRIPCIÓN</label>
                                                        <input
                                                            type="text"
                                                            value={editCompData.descripcion || ''}
                                                            onChange={(e) => setEditCompData({ ...editCompData, descripcion: e.target.value })}
                                                            placeholder="DESCRIPCIÓN DEL COMPONENTE..."
                                                            className="w-full p-2 border-2 border-[#1c1c19] text-[10px] font-black uppercase outline-none focus:bg-[#f6f3ee]"
                                                        />
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            id="es_principal_new"
                                                            checked={editCompData.es_principal || false}
                                                            onChange={(e) => setEditCompData({ ...editCompData, es_principal: e.target.checked })}
                                                            className="w-3 h-3 accent-[#1c1c19]"
                                                        />
                                                        <label htmlFor="es_principal_new" className="text-[9px] font-black uppercase cursor-pointer">ES PRINCIPAL</label>
                                                    </div>
                                                    <div className="flex gap-2 pt-2">
                                                        <button 
                                                            onClick={() => { 
                                                                onCreateComponent(newCompName, selectedCategory === 'TODAS' ? '' : selectedCategory, editCompData.descripcion, editCompData.es_principal); 
                                                                setNewCompName(''); 
                                                                setEditCompData({ subcomponente: '', categoria_revit: '', descripcion: '', es_principal: false });
                                                                setIsAddingNewComponent(false); 
                                                            }} 
                                                            className="flex-1 py-2 bg-[#1c1c19] text-white text-[9px] font-black uppercase hover:bg-[#0f4369] transition-all"
                                                        >
                                                            AGREGAR
                                                        </button>
                                                        <button onClick={() => setIsAddingNewComponent(false)} className="px-4 py-2 border-2 border-[#1c1c19] text-[9px] font-black uppercase hover:bg-gray-100 transition-all">CANCELAR</button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => { 
                                                        setIsAddingNewComponent(true);
                                                        setEditCompData({ subcomponente: '', categoria_revit: '', descripcion: '', es_principal: false });
                                                    }}
                                                    className="w-full py-2 border-2 border-[#1c1c19] text-[9px] font-black uppercase hover:bg-[#f6f3ee] transition-all flex items-center justify-center gap-2"
                                                >
                                                    <Plus size={14} /> AÑADIR NUEVO A {selectedCategory === 'TODAS' ? 'CATÁLOGO' : selectedCategory}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
