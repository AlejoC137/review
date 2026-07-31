import React from 'react';
import { Box, Plus, Trash2, Package } from 'lucide-react';

export default function ElementForm({
    spaceFormData,
    setSpaceFormData,
    isBimManager,
    spaces,
    selectedSpace,
    allComponents,
    allMaterials,
    handleAddComponent,
    handleRemoveComponent,
    handleUpdateAssignedComponent,
    setActiveCompIdx,
    setShowComponentPicker,
    setShowMaterialPicker
}) {
    return (
        <div className="space-y-6">
            <div className="bg-white border-4 border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(28,28,25,1)] transition-all">
                <div className="border-b-2 border-[#1c1c19] pb-2 mb-6 flex items-center gap-3">
                    <Box size={18} />
                    <h3 className="text-[10px] font-black italic uppercase tracking-widest">DEFINICIÓN_DE_ELEMENTO</h3>
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
                            placeholder="Ej: Puerta Principal"
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
                            placeholder="Ej: Acceso Sur"
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

                    <div className="col-span-12 md:col-span-5">
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

                    <div className="col-span-12 md:col-span-5">
                        <label className="block text-[8px] font-black text-[#72777f] uppercase mb-1">ESPACIO PADRE (ANIDACIÓN)</label>
                        <select
                            disabled={!isBimManager && spaceFormData.subProject_id === null}
                            value={spaceFormData.parent_espacio_id || ''}
                            onChange={(e) => setSpaceFormData({ ...spaceFormData, parent_espacio_id: e.target.value })}
                            className="w-full p-2 border-2 border-[#1c1c19] font-black text-xs outline-none disabled:opacity-50"
                        >
                            <option value="">(SIN ESPACIO PADRE)</option>
                            {spaces.filter(s => s.tipo === 'Espacio' && s.id !== selectedSpace?.id).map(s => (
                                <option key={s.id} value={s.id}>{s.nombre} {s.apellido}</option>
                            ))}
                        </select>
                    </div>
                </div>
                {spaceFormData.subProject_id === null && (
                    <div className="mt-4 p-2 bg-orange-50 border-2 border-orange-200 text-[8px] font-black text-orange-700 uppercase tracking-widest">
                        ⚠ ESTÁS EDITANDO UNA PLANTILLA MAESTRA. LOS CAMBIOS AQUÍ NO SE RELEJARÁN EN INSTANCIAS YA CREADAS, SOLO EN NUEVAS CLONACIONES.
                    </div>
                )}
            </div>

            {/* COMPONENTES Y ACABADOS (MATERIALES) */}
            <div className="bg-white border-4 border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(15,67,105,0.1)]">
                <div className="flex justify-between items-center border-b-2 border-[#1c1c19] pb-2 mb-6">
                    <div className="flex items-center gap-3">
                        <Box size={18} />
                        <h4 className="text-[10px] font-black uppercase italic tracking-widest">COMPONENTES_Y_ACABADOS_PERSONALIZADOS</h4>
                    </div>
                    {(spaceFormData.subProject_id !== null || isBimManager) && (
                        <button onClick={handleAddComponent} className="h-8 px-4 bg-[#1c1c19] text-white text-[9px] font-black uppercase italic flex items-center gap-2 hover:bg-[#0f4369] transition-all">
                            <Plus size={14} /> ASIGNAR_COMPONENTE
                        </button>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="grid grid-cols-12 gap-4 px-2 text-[7px] font-black text-[#72777f] uppercase tracking-widest opacity-60">
                        <div className="col-span-4">COMPONENTE_DEL_CATÁLOGO</div>
                        <div className="col-span-4">ACABADO_/_MATERIAL_ESPECÍFICO</div>
                        <div className="col-span-3">NOTAS_DE_INSTALACIÓN</div>
                        <div className="col-span-1"></div>
                    </div>

                    {spaceFormData.componentes.length === 0 ? (
                        <div className="text-[9px] font-bold text-[#72777f] italic py-10 text-center border-4 border-dashed border-[#1c1c19]/5 bg-[#fcf9f4]">
                            NO HAY COMPONENTES ASIGNADOS A ESTA UNIDAD. HAGA CLIC EN "ASIGNAR_COMPONENTE" PARA EMPEZAR.
                        </div>
                    ) : spaceFormData.componentes.map((item, idx) => (
                        <div key={idx} className="grid grid-cols-12 gap-4 items-center p-3 border-2 border-[#1c1c19] bg-white group hover:bg-[#f6f3ee]/30 transition-all">
                            <div className="col-span-4">
                                {(() => {
                                    const selectedComp = allComponents.find(c => c.id === item.component_id);
                                    return (
                                        <button
                                            disabled={!isBimManager && spaceFormData.subProject_id === null}
                                            onClick={() => {
                                                setActiveCompIdx(idx);
                                                setShowComponentPicker(true);
                                            }}
                                            className="w-full p-2 border-2 border-[#1c1c19]/20 font-black text-[10px] outline-none focus:border-[#1c1c19] bg-white flex flex-col items-start transition-all hover:border-[#1c1c19] disabled:opacity-50"
                                        >
                                            {selectedComp ? (
                                                <>
                                                    <span className="uppercase truncate w-full flex items-center gap-2">
                                                        {selectedComp.es_principal && <span className="w-1.5 h-1.5 bg-[#0f4369] rounded-full inline-block"></span>}
                                                        {selectedComp.subcomponente || selectedComp.element_name || selectedComp.nombre}
                                                    </span>
                                                    <span className="text-[6.5px] font-bold text-[#72777f] uppercase opacity-60">
                                                        {selectedComp.categoria_revit || selectedComp.discipline || 'SIN CATEGORÍA'}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-[#72777f] uppercase">SELECCIONAR_COMPONENTE...</span>
                                            )}
                                        </button>
                                    );
                                })()}
                            </div>
                            <div className="col-span-4">
                                {(() => {
                                    const selectedMat = allMaterials.find(m => m.id === item.material_id);
                                    return (
                                        <button
                                            disabled={!isBimManager && spaceFormData.subProject_id === null}
                                            onClick={() => {
                                                setActiveCompIdx(idx);
                                                setShowMaterialPicker(true);
                                            }}
                                            className="w-full p-2 border-2 border-[#1c1c19]/20 font-black text-[10px] outline-none focus:border-[#1c1c19] bg-white flex flex-col items-start transition-all hover:border-[#1c1c19] disabled:opacity-50"
                                        >
                                            {selectedMat ? (
                                                <>
                                                    <span className="uppercase truncate w-full">{selectedMat.Nombre}</span>
                                                    <span className="text-[6.5px] font-bold text-[#0f4369] uppercase opacity-60">
                                                        {selectedMat.categoria} | {selectedMat.proveedor || 'S.P'}
                                                    </span>
                                                </>
                                            ) : (
                                                <span className="text-[#72777f] uppercase">SELECCIONAR_ACABADO...</span>
                                            )}
                                        </button>
                                    );
                                })()}
                            </div>
                            <div className="col-span-3">
                                <input
                                    disabled={!isBimManager && spaceFormData.subProject_id === null}
                                    type="text"
                                    value={item.notas}
                                    onChange={(e) => handleUpdateAssignedComponent(idx, 'notas', e.target.value)}
                                    placeholder="NOTAS..."
                                    className="w-full p-2 border-2 border-[#1c1c19]/20 font-black text-[10px] outline-none focus:border-[#1c1c19] bg-transparent disabled:opacity-50"
                                />
                            </div>
                            <div className="col-span-1 flex justify-end">
                                {(spaceFormData.subProject_id !== null || isBimManager) && (
                                    <button onClick={() => handleRemoveComponent(idx)} className="p-2 text-red-500 hover:bg-red-500 hover:text-white border-2 border-transparent hover:border-[#1c1c19] transition-all">
                                        <Trash2 size={14} />
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {spaceFormData.componentes.length > 0 && (
                    <div className="mt-6 p-4 border-2 border-[#1c1c19] bg-[#0f4369]/5 flex items-center gap-4">
                        <Package size={16} className="text-[#0f4369]" />
                        <p className="text-[8px] font-bold text-[#0f4369] uppercase leading-tight">
                            LOS MATERIALES SELECCIONADOS AQUÍ SOBREESCREBEN EL ACABADO POR DEFECTO DEL COMPONENTE SOLO PARA ESTE ESPACIO.
                            ESTO PERMITE QUE UN MISMO COMPONENTE (EJ: PUERTA) TENGA DIFERENTES ACABADOS SEGÚN SU UBICACIÓN.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
