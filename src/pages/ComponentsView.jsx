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
        element_name: '',
        discipline: 'Arquitectura',
        lod: 100,
        tdi: '',
        notes: '',
        acabado: '',
        construccion: '',
        description: '',
        nivel_id: ''
    });
    const [saving, setSaving] = useState(false);
    const [levels, setLevels] = useState([]);

    useEffect(() => {
        loadComponents();
        loadLevels();
    }, []);

    useEffect(() => {
        if (selectedComponent) {
            setFormData({
                element_name: selectedComponent.element_name || '',
                discipline: selectedComponent.discipline || 'Arquitectura',
                lod: selectedComponent.lod || 100,
                tdi: (selectedComponent.tdi || []).join(', '),
                notes: selectedComponent.notes || '',
                acabado: selectedComponent.acabado || '',
                construccion: selectedComponent.construccion || '',
                description: selectedComponent.description || selectedComponent.descripcion || '',
                nivel_id: selectedComponent.nivel_id || ''
            });
            setIsAddMode(false);
        }
    }, [selectedComponent]);

    const loadLevels = async () => {
        const { data } = await supabase.from('project_levels').select('id, nombre');
        if (data) setLevels(data);
    };

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
        if (!formData.element_name.trim()) return;
        setSaving(true);
        const payload = {
            ...formData,
            tdi: formData.tdi ? formData.tdi.split(',').map(s => s.trim()) : [],
            nivel_id: formData.nivel_id || null,
            descripcion: formData.description
        };
        delete payload.description;

        try {
            if (isAddMode) {
                await componentsService.createComponent({
                    id: crypto.randomUUID(),
                    ...payload
                });
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
        (c.element_name || c.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())
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
                            setFormData({ element_name: '', discipline: 'Arquitectura', lod: 100, tdi: '', notes: '', acabado: '', construccion: '', description: '', nivel_id: '' });
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
                            const disc = c.discipline || 'GENERAL / SIN DISCIPLINA';
                            if (!acc[disc]) acc[disc] = [];
                            acc[disc].push(c);
                            return acc;
                        }, {});

                        return Object.entries(grouped).sort().map(([discipline, comps]) => (
                            <div key={discipline} className="mb-2">
                                <h5 className="text-[8px] font-black uppercase tracking-widest text-[#1c1c19] mb-1 bg-[#e0dcd3] p-1.5 px-3 border-y-2 border-[#1c1c19]">
                                    {discipline}
                                </h5>
                                <div>
                                    {comps.sort((a, b) => (a.element_name || a.nombre || '').localeCompare(b.element_name || b.nombre || '')).map((comp) => (
                                        <div
                                            key={comp.id}
                                            onClick={() => setSelectedComponent(comp)}
                                            className={`p-3 border-b-2 border-[#1c1c19]/10 cursor-pointer transition-all hover:bg-white flex items-center justify-between group ${selectedComponent?.id === comp.id ? 'bg-white border-r-8 border-r-[#0f4369]' : ''}`}
                                        >
                                            <div className="min-w-0 text-left">
                                                <div className="text-[10px] font-black uppercase truncate">{comp.element_name || comp.nombre}</div>
                                                <div className="text-[7px] font-bold text-[#72777f] uppercase truncate">
                                                    {levels.find(l => l.id === comp.nivel_id)?.nombre || 'GLOBAL'} | LOD {comp.lod || 100}
                                                </div>
                                            </div>
                                            <button onClick={(e) => handleDelete(comp.id, e)} className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 transition-all">
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
                                {isAddMode ? 'NUEVO_COMPONENTE' : `EDITANDO: ${selectedComponent.element_name || selectedComponent.nombre}`}
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
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">NOMBRE_DEL_ELEMENTO</label>
                                            <input type="text" value={formData.element_name} onChange={(e) => setFormData({ ...formData, element_name: e.target.value })} className="w-full p-2 border-2 border-[#1c1c19] font-black text-sm outline-none bg-[#f6f3ee]/30 focus:bg-white" />
                                        </div>

                                        <div className="col-span-2 lg:col-span-1">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">DISCIPLINA</label>
                                            <input type="text" value={formData.discipline} onChange={(e) => setFormData({ ...formData, discipline: e.target.value })} className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none" />
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">LOD</label>
                                            <select value={formData.lod} onChange={(e) => setFormData({ ...formData, lod: parseInt(e.target.value) })} className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none bg-white">
                                                <option value={100}>LOD 100</option>
                                                <option value={200}>LOD 200</option>
                                                <option value={300}>LOD 300</option>
                                                <option value={350}>LOD 350</option>
                                                <option value={400}>LOD 400</option>
                                            </select>
                                        </div>

                                        <div className="col-span-1">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">NIVEL</label>
                                            <select value={formData.nivel_id} onChange={(e) => setFormData({ ...formData, nivel_id: e.target.value })} className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none bg-white">
                                                <option value="">(SIN ASIGNAR / GLOBAL)</option>
                                                {levels.map(l => (
                                                    <option key={l.id} value={l.id}>{l.nombre}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">TDI (SEPARADOS POR COMA)</label>
                                            <input type="text" value={formData.tdi} onChange={(e) => setFormData({ ...formData, tdi: e.target.value })} className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none bg-[#f6f3ee]/30 focus:bg-white" placeholder="Ej: TDI_A, TDI_B" />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">ACABADO</label>
                                            <textarea value={formData.acabado} onChange={(e) => setFormData({ ...formData, acabado: e.target.value })} rows={2} className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none resize-none" />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">SISTEMA_CONSTRUCTIVO</label>
                                            <textarea value={formData.construccion} onChange={(e) => setFormData({ ...formData, construccion: e.target.value })} rows={2} className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none resize-none" />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">DESCRIPCIÓN_DETALLADA</label>
                                            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows={4} className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none resize-none" />
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
