import React, { useState, useEffect } from 'react';
import { Box, Search, Save, Loader2, Plus, Trash2, Edit3 } from 'lucide-react';
import { componentsService } from '../services/componentsService';
import { supabase } from '../services/supabaseClient';



const ComponentsView = () => {
    const [components, setComponents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [isAddMode, setIsAddMode] = useState(false);

    const [formData, setFormData] = useState({
        categoria_revit: 'Arquitectura',
        subcomponente: '',
        es_principal: false,
        descripcion: ''
    });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadComponents();
    }, []);

    useEffect(() => {
        if (selectedComponent) {
            setFormData({
                categoria_revit: selectedComponent.categoria_revit || 'Arquitectura',
                subcomponente: selectedComponent.subcomponente || selectedComponent.element_name || selectedComponent.nombre || '',
                es_principal: selectedComponent.es_principal || false,
                descripcion: selectedComponent.descripcion || selectedComponent.description || ''
            });
            setIsAddMode(false);
        }
    }, [selectedComponent]);

    const loadComponents = async () => {
        setLoading(true);
        try {
            const data = await componentsService.getComponents();
            setComponents(data || []);
        } catch (error) {
            console.error('Error loading components:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.subcomponente.trim()) return;
        setSaving(true);
        
        try {
            // Note: If componentsService.createComponent still expects old fields in project_element_lod_tdi,
            // we should ideally update it. Assuming we map it properly or backend handles it.
            const payload = {
                categoria_revit: formData.categoria_revit,
                subcomponente: formData.subcomponente,
                es_principal: formData.es_principal,
                descripcion: formData.descripcion
            };

            if (isAddMode) {
                await componentsService.createComponent(payload);
            } else if (selectedComponent) {
                await componentsService.updateComponent(selectedComponent.id, payload);
            }
            await loadComponents();
            setIsAddMode(false);
        } catch (error) {
            console.error('Error saving component:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        if (!window.confirm("¿ELIMINAR ESTE COMPONENTE DEL CATÁLOGO?")) return;
        try {
            await componentsService.deleteComponent(id);
            if (selectedComponent?.id === id) setSelectedComponent(null);
            await loadComponents();
        } catch (error) {
            console.error('Error deleting component:', error);
        }
    };

    const filteredComponents = components.filter(c =>
        (c.subcomponente || c.element_name || c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.categoria_revit || c.discipline || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="h-full flex bg-white font-mono overflow-hidden">
            {/* Sidebar */}
            <div className="w-72 border-r-4 border-[#1c1c19] flex flex-col bg-[#fcf9f4]">
                <div className="p-4 border-b-4 border-[#1c1c19] bg-white">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-black italic uppercase tracking-tighter flex items-center gap-2">
                            <Box size={16} /> CATÁLOGO_COMP
                        </h2>
                        <button onClick={() => {
                            setSelectedComponent(null);
                            setFormData({ categoria_revit: 'Arquitectura', subcomponente: '', es_principal: false, descripcion: '' });
                            setIsAddMode(true);
                        }} className="p-1 border-2 border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all">
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72777f]" />
                        <input
                            type="text"
                            placeholder="BUSCAR..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-[10px] font-black uppercase border-2 border-[#1c1c19] focus:outline-none"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="animate-spin" size={20} /></div>
                    ) : (() => {
                        const grouped = filteredComponents.reduce((acc, c) => {
                            const disc = c.categoria_revit || c.discipline || 'SIN CATEGORÍA REVIT';
                            if (!acc[disc]) acc[disc] = [];
                            acc[disc].push(c);
                            return acc;
                        }, {});

                        return Object.entries(grouped).sort().map(([categoria, comps]) => (
                            <div key={categoria} className="mb-2">
                                <h5 className="text-[8px] font-black uppercase tracking-widest text-[#1c1c19] mb-1 bg-[#e0dcd3] p-1.5 px-3 border-y-2 border-[#1c1c19]">
                                    {categoria}
                                </h5>
                                <div>
                                    {comps.sort((a, b) => (a.subcomponente || a.element_name || a.nombre || '').localeCompare(b.subcomponente || b.element_name || b.nombre || '')).map((comp) => (
                                        <div
                                            key={comp.id}
                                            onClick={() => setSelectedComponent(comp)}
                                            className={`p-3 border-b-2 border-[#1c1c19]/10 cursor-pointer transition-all hover:bg-white flex items-center justify-between group ${selectedComponent?.id === comp.id ? 'bg-white border-r-8 border-r-[#0f4369]' : ''}`}
                                        >
                                            <div className="min-w-0 text-left w-full flex items-center gap-2">
                                                {comp.es_principal && <span className="w-1.5 h-1.5 bg-[#0f4369] rounded-full inline-block"></span>}
                                                <div className="text-[10px] font-black uppercase truncate flex-1">
                                                    {comp.subcomponente || comp.element_name || comp.nombre}
                                                </div>
                                            </div>
                                            <button onClick={(e) => handleDelete(comp.id, e)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 transition-all ml-2">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ));
                    })()}
                </div>
            </div>

            {/* Main Editor */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedComponent || isAddMode ? (
                    <div className="h-full flex flex-col">
                        <div className="p-4 border-b-4 border-[#1c1c19] bg-[#f6f3ee] flex justify-between items-center">
                            <h3 className="text-base font-black italic uppercase tracking-tighter">
                                {isAddMode ? 'NUEVO_COMPONENTE' : `EDITANDO: ${selectedComponent.subcomponente || selectedComponent.element_name || selectedComponent.nombre}`}
                            </h3>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-1.5 bg-[#1c1c19] text-white text-[9px] font-black uppercase italic flex items-center gap-2 shadow-[4px_4px_0_0_rgba(15,67,105,1)] hover:shadow-none transition-all"
                            >
                                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} GUARDAR_CATÁLOGO
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#fcf9f4]">
                            <div className="max-w-3xl space-y-6">
                                <div className="bg-white border-4 border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)]">
                                    <h4 className="text-[10px] font-black uppercase border-b-2 border-[#1c1c19] pb-2 mb-6 italic tracking-widest">ESPECIFICACIONES_TÉCNICAS</h4>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2 lg:col-span-1">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">CATEGORÍA REVIT</label>
                                            <input type="text" value={formData.categoria_revit} onChange={(e) => setFormData({ ...formData, categoria_revit: e.target.value })} className="w-full p-2 border-2 border-[#1c1c19] font-black text-sm outline-none bg-white" placeholder="Ej: Puertas, Muros, Mobiliario" />
                                        </div>

                                        <div className="col-span-2 lg:col-span-1">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">SUBCOMPONENTE</label>
                                            <input type="text" value={formData.subcomponente} onChange={(e) => setFormData({ ...formData, subcomponente: e.target.value })} className="w-full p-2 border-2 border-[#1c1c19] font-black text-sm outline-none bg-[#f6f3ee]/30 focus:bg-white" placeholder="Ej: Puerta Simple de Madera" />
                                        </div>
                                        
                                        <div className="col-span-2">
                                            <label className="flex items-center gap-2 cursor-pointer border-2 border-[#1c1c19] p-3 hover:bg-[#f6f3ee] transition-colors">
                                                <input type="checkbox" checked={formData.es_principal} onChange={(e) => setFormData({ ...formData, es_principal: e.target.checked })} className="w-4 h-4 accent-[#0f4369]" />
                                                <span className="text-[10px] font-black uppercase text-[#1c1c19]">ES COMPONENTE PRINCIPAL (Relevante para el presupuesto o modelo estructural)</span>
                                            </label>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">DESCRIPCIÓN</label>
                                            <textarea value={formData.descripcion} onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })} rows={4} className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none resize-none" placeholder="Descripción detallada del componente..." />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-10">
                        <Box size={80} />
                        <h2 className="text-2xl font-black italic uppercase tracking-tighter mt-4">CATÁLOGO_DE_COMPONENTES</h2>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ComponentsView;
