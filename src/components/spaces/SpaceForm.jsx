import React, { useState } from 'react';
import { Layers, Plus, Edit3, Save, X } from 'lucide-react';
import { spacesService } from '../../services/spacesService';

export default function SpaceForm({
    spaceFormData,
    setSpaceFormData,
    isBimManager,
    levels,
    spaces,
    selectedSpace,
    setFilterType,
    setIsAddMode,
    setSelectedSpace,
    setShowTemplatePicker,
    onReloadRequired
}) {
    const [showAssignRow, setShowAssignRow] = useState(false);
    const [elementToAssign, setElementToAssign] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);

    const handleAssignExistingElement = async () => {
        if (!elementToAssign) return;
        setIsAssigning(true);
        try {
            await spacesService.updateSpace(elementToAssign, { parent_espacio_id: selectedSpace.id });
            if (onReloadRequired) {
                await onReloadRequired();
            }
        } catch (error) {
            console.error('Error assigning element:', error);
            alert('Error al asignar el elemento');
        }
        setIsAssigning(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-white border-4 border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(28,28,25,1)] transition-all">
                <div className="border-b-2 border-[#1c1c19] pb-2 mb-6 flex items-center gap-3">
                    <Layers size={18} />
                    <h3 className="text-[10px] font-black italic uppercase tracking-widest">DEFINICIÓN_DE_ESPACIO</h3>
                </div>
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12 md:col-span-4">
                        <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">NOMBRE_IDENTIFICADOR</label>
                        <input
                            disabled={!isBimManager && spaceFormData.subProject_id === null}
                            type="text"
                            value={spaceFormData.nombre}
                            onChange={(e) => setSpaceFormData({ ...spaceFormData, nombre: e.target.value })}
                            className="w-full p-2 border-2 border-[#1c1c19] font-black text-sm outline-none focus:bg-[#f6f3ee] transition-colors disabled:opacity-50"
                            placeholder="Ej: Sala de Juntas A"
                        />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                        <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">DESCRIPCIÓN_/_APELLIDO</label>
                        <input
                            disabled={!isBimManager && spaceFormData.subProject_id === null}
                            type="text"
                            value={spaceFormData.apellido}
                            onChange={(e) => setSpaceFormData({ ...spaceFormData, apellido: e.target.value })}
                            className="w-full p-2 border-2 border-[#1c1c19] font-black text-sm outline-none focus:bg-[#f6f3ee] transition-colors disabled:opacity-50"
                            placeholder="Ej: Nivel 1 - Ala Norte"
                        />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                        <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">CATEGORÍA_DE_USO</label>
                        <select
                            disabled={!isBimManager && spaceFormData.subProject_id === null}
                            value={spaceFormData.categoria_uso}
                            onChange={(e) => setSpaceFormData({ ...spaceFormData, categoria_uso: e.target.value })}
                            className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none disabled:opacity-50"
                        >
                            <option value="Residencial">RESIDENCIAL</option>
                            <option value="Comercial/Oficinas">COMERCIAL / OFICINAS</option>
                            <option value="Industrial/Fábricas">INDUSTRIAL / FÁBRICAS</option>
                            <option value="Científico/Laboratorios">CIENTÍFICO / LABORATORIOS</option>
                            <option value="Educacional">EDUCACIONAL</option>
                            <option value="Salud/Hospitalario">SALUD / HOSPITALARIO</option>
                            <option value="Exteriores/Urbanismo">EXTERIORES / URBANISMO</option>
                            <option value="General">GENERAL / OTROS</option>
                        </select>
                    </div>
                    
                    <div className="col-span-6 lg:col-span-2">
                        <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">TIPO_REGISTRO</label>
                        <select disabled={!isBimManager && spaceFormData.subProject_id === null} value={spaceFormData.tipo} onChange={(e) => setSpaceFormData({ ...spaceFormData, tipo: e.target.value })} className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none bg-white disabled:opacity-50">
                            <option value="Espacio">ESPACIO</option>
                            <option value="Elemento">ELEMENTO</option>
                        </select>
                    </div>
                    <div className="col-span-12 md:col-span-4">
                        <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">NIVEL_ASOCIADO</label>
                        <select
                            disabled={!isBimManager && spaceFormData.subProject_id === null}
                            value={spaceFormData.level_id}
                            onChange={(e) => setSpaceFormData({ ...spaceFormData, level_id: e.target.value })}
                            className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none disabled:opacity-50"
                        >
                            <option value="">(SIN NIVEL)</option>
                            {levels.filter(l => !l.parent_id).map(l => (
                                <option key={l.id} value={l.id}>{l.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <div className="col-span-6 md:col-span-4">
                        <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">ÁREA (m²)</label>
                        <input
                            disabled={!isBimManager && spaceFormData.subProject_id === null}
                            type="number" step="0.01"
                            value={spaceFormData.area}
                            onChange={(e) => setSpaceFormData({ ...spaceFormData, area: e.target.value })}
                            className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none disabled:opacity-50"
                            placeholder="Ej: 25.5"
                        />
                    </div>
                    <div className="col-span-12 md:col-span-4">
                        <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">CATEGORÍA DE ÁREA</label>
                        <select
                            disabled={!isBimManager && spaceFormData.subProject_id === null}
                            value={spaceFormData.area_category}
                            onChange={(e) => setSpaceFormData({ ...spaceFormData, area_category: e.target.value })}
                            className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none disabled:opacity-50"
                        >
                            <option value="Construida">CONSTRUIDA / CUBIERTA</option>
                            <option value="Descubierta">DESCUBIERTA</option>
                        </select>
                    </div>
                    <div className="col-span-12 md:col-span-6">
                        <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">FASE (REVIT)</label>
                        <select
                            disabled={!isBimManager && spaceFormData.subProject_id === null}
                            value={spaceFormData.phase}
                            onChange={(e) => setSpaceFormData({ ...spaceFormData, phase: e.target.value })}
                            className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none disabled:opacity-50"
                        >
                            <option value="Existente">EXISTENTE</option>
                            <option value="Demolición">DEMOLICIÓN</option>
                            <option value="Nueva Construcción">NUEVA CONSTRUCCIÓN</option>
                        </select>
                    </div>
                </div>
                {spaceFormData.subProject_id === null && (
                    <div className="mt-4 p-2 bg-orange-50 border-2 border-orange-200 text-[8px] font-black text-orange-700 uppercase tracking-widest">
                        ⚠ ESTÁS EDITANDO UNA PLANTILLA MAESTRA. LOS CAMBIOS AQUÍ NO SE RELEJARÁN EN INSTANCIAS YA CREADAS, SOLO EN NUEVAS CLONACIONES.
                    </div>
                )}
            </div>

            {/* ELEMENTOS DEL ESPACIO (SOLO PARA ESPACIOS) */}
            {selectedSpace?.id && (
                <div className="bg-white border-4 border-[#1c1c19] p-6 mt-6 shadow-[8px_8px_0_0_rgba(15,67,105,0.1)]">
                    <div className="flex justify-between items-center border-b-2 border-[#1c1c19] pb-2 mb-6">
                        <div className="flex items-center gap-3">
                            <Layers size={18} />
                            <h4 className="text-[10px] font-black uppercase italic tracking-widest">ELEMENTOS_DEL_ESPACIO</h4>
                        </div>
                        {(spaceFormData.subProject_id !== null || isBimManager) && (
                            <button onClick={() => setShowAssignRow(!showAssignRow)} className="h-8 px-4 bg-[#1c1c19] text-white text-[9px] font-black uppercase italic flex items-center gap-2 hover:bg-[#0f4369] transition-all">
                                <Plus size={14} /> AGREGAR_ELEMENTO
                            </button>
                        )}
                    </div>

                    {showAssignRow && (
                        <div className="mb-4 p-4 border-2 border-[#1c1c19] bg-[#f6f3ee] flex gap-2 items-center">
                            <select
                                value={elementToAssign}
                                onChange={(e) => setElementToAssign(e.target.value)}
                                className="flex-1 p-2 border-2 border-[#1c1c19] font-black text-[10px] uppercase outline-none bg-white"
                            >
                                <option value="">-- SELECCIONAR ELEMENTO EXISTENTE --</option>
                                {spaces.filter(s => s.tipo === 'Elemento' && !s.parent_espacio_id && s.id !== selectedSpace?.id).map(el => (
                                    <option key={el.id} value={el.id}>{el.nombre} {el.apellido}</option>
                                ))}
                            </select>
                            <button 
                                onClick={handleAssignExistingElement} 
                                disabled={!elementToAssign || isAssigning}
                                className="px-4 py-2 bg-[#1c1c19] text-white text-[9px] font-black uppercase flex items-center gap-2 hover:bg-[#0f4369] transition-all disabled:opacity-50"
                            >
                                {isAssigning ? 'ASIGNANDO...' : <Save size={14} />}
                                VINCULAR
                            </button>
                            <button onClick={() => setShowAssignRow(false)} className="p-2 border-2 border-[#1c1c19] bg-white hover:bg-gray-100 transition-all">
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    <div className="space-y-2">
                        {(() => {
                            const childElements = spaces.filter(s => s.tipo === 'Elemento' && s.parent_espacio_id === selectedSpace.id);
                            if (childElements.length === 0) {
                                return (
                                    <div className="text-[9px] font-bold text-[#72777f] italic py-10 text-center border-4 border-dashed border-[#1c1c19]/5 bg-[#fcf9f4]">
                                        NO HAY ELEMENTOS ASIGNADOS A ESTE ESPACIO.
                                    </div>
                                );
                            }
                            return childElements.map(el => (
                                <div key={el.id} className="flex justify-between items-center p-3 border-2 border-[#1c1c19] bg-white group hover:bg-[#f6f3ee]/30 transition-all cursor-pointer" onClick={() => {
                                    let parsedComps = [];
                                    try {
                                        parsedComps = typeof el.componentes === 'string'
                                            ? JSON.parse(el.componentes)
                                            : (el.componentes || []);
                                    } catch (e) { parsedComps = []; }
                                    
                                    setSelectedSpace(el);
                                    setSpaceFormData({ ...el, componentes: Array.isArray(parsedComps) ? parsedComps : [] });
                                    setIsAddMode(false);
                                    setFilterType('Elemento');
                                }}>
                                    <div className="flex items-center gap-3">
                                        <div className="w-2 h-2 rounded-full bg-[#0f4369]"></div>
                                        <div>
                                            <div className="text-[10px] font-black uppercase">{el.nombre} {el.apellido}</div>
                                            <div className="text-[7px] font-bold text-[#72777f] uppercase">
                                                {el.componentes?.length || 0} COMPONENTES ASIGNADOS
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-[#0f4369] opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit3 size={14} />
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
