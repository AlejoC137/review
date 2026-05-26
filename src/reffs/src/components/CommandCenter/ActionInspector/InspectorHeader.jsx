import React from 'react';
import { createPortal } from 'react-dom';
import { X, Save, ArrowUp, ArrowDown, Trash2, Phone } from 'lucide-react';
import BitacoraManager from './BitacoraManager';
import LinksManager from './LinksManager';
import SearchableStaffSelector from '../../common/SearchableStaffSelector';
import PrintButton from '../../common/PrintButton';

const InspectorHeader = ({
    panelMode,
    projects,
    spaces,
    taskForm,
    staffers,
    handleTaskChange,
    showCallDropdown,
    setShowCallDropdown,
    callerId,
    setCallerId,
    calledStaffId,
    setCalledStaffId,
    callComment,
    setCallComment,
    handleCallResponsible,
    loading,
    saving,
    handlePrint,
    isCollapsed,
    handleToggleCollapse,
    handleDeleteTask,
    handleSaveAction,
    handleClose,
    selectedTask,
    selectedAction,
    selectedDate,
    showPanel
}) => {
    return (
        <div className="grid grid-cols-12 items-center border-b border-gray-100 dark:border-zinc-800 bg-gray-50/50 no-print">
            {/* LEFT HEADER: Matches Task Form Column */}
            <div className="col-span-4 px-4 py-1.5 flex items-center gap-2 border-r border-gray-100 overflow-hidden min-h-[36px]">
                <div className="flex flex-col justify-center">
                    {panelMode === 'createTask' ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Nueva Tarea</span>
                    ) : panelMode === 'task' ? (
                        <>
                            <span className="text-[8px] font-bold uppercase text-gray-400 leading-none">Editar Tarea:</span>
                            <div className="flex items-center gap-1.5 text-[14px] font-bold text-gray-800 uppercase leading-tight max-w-3xl overflow-hidden">
                                {(() => {
                                    const proj = projects.find(p => p.id === taskForm.proyecto_id) || taskForm.proyecto;
                                    const spc = spaces.find(s => s._id === taskForm.espacio_uuid || s.id === taskForm.espacio_uuid) || taskForm.espacio;

                                    return (
                                        <>
                                            {proj?.name && (
                                                <span className="text-blue-600 shrink-0">{proj.name}</span>
                                            )}
                                            {spc?.nombre && (
                                                <span className="text-gray-400 font-medium shrink-0">/</span>
                                            )}
                                            {spc?.nombre && (
                                                <span className="text-orange-600 shrink-0">
                                                    {spc.nombre}{spc.apellido ? ` ${spc.apellido}` : ''}{spc.piso ? ` P${spc.piso}` : ''}
                                                </span>
                                            )}
                                            {(proj?.name || spc?.nombre) && (
                                                <span className="text-gray-300 mx-1 shrink-0">|</span>
                                            )}
                                            <span className="truncate" title={taskForm?.task_description}>
                                                {taskForm?.task_description || '...'}
                                            </span>
                                        </>
                                    );
                                })()}
                            </div>
                        </>
                    ) : panelMode === 'day' ? (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Tareas del Día: {selectedDate}</span>
                    ) : (
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Detalles</span>
                    )}
                </div>
                {(loading || saving) && <span className="text-[9px] text-blue-500 animate-pulse shrink-0">{saving ? 'Guardando...' : 'Cargando...'}</span>}
            </div>

            {/* RIGHT HEADER: Toolbar and Controls */}
            <div className="col-span-8 flex items-center justify-between px-4 py-1.5 gap-4">
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
                    {(panelMode === 'task' || panelMode === 'createTask') && (
                        <>
                            <BitacoraManager
                                notesStr={taskForm.notes}
                                onChange={(newVal) => handleTaskChange('notes', newVal)}
                                staffers={staffers}
                            />

                            <LinksManager
                                linksStr={taskForm.links_de_interes}
                                onChange={(newVal) => handleTaskChange('links_de_interes', newVal)}
                            />

                            {/* Calling Dropdown Section */}
                            <div className="relative border-l border-gray-200 pl-3">
                                <button
                                    onClick={() => setShowCallDropdown(!showCallDropdown)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded transition-all text-[10px] font-bold ${showCallDropdown ? 'bg-blue-100 text-blue-700 shadow-inner' : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'}`}
                                >
                                    <Phone size={12} />
                                    <span>LLAMADA</span>
                                    {calledStaffId && callerId && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse ml-1" />
                                    )}
                                </button>

                                {showCallDropdown && createPortal(
                                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowCallDropdown(false)}>
                                        <div
                                            className="bg-white border border-gray-200 shadow-2xl rounded-2xl w-full max-w-sm flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                        <Phone size={18} />
                                                    </div>
                                                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest">
                                                        Registro de Llamada
                                                    </h4>
                                                </div>
                                                <button onClick={() => setShowCallDropdown(false)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                    <X size={18} />
                                                </button>
                                            </div>

                                            <div className="p-6 space-y-4">
                                                <SearchableStaffSelector
                                                    label="Yo soy:"
                                                    staffers={staffers}
                                                    value={callerId}
                                                    onChange={setCallerId}
                                                    placeholder="Mi nombre..."
                                                />
                                                <SearchableStaffSelector
                                                    label="Llamar a:"
                                                    staffers={staffers}
                                                    value={calledStaffId}
                                                    onChange={setCalledStaffId}
                                                    placeholder="Seleccionar..."
                                                />
                                                <div className="flex flex-col gap-1">
                                                    <label className="text-[9px] font-bold text-gray-400 uppercase">Comentario / Motivo:</label>
                                                    <textarea
                                                        value={callComment}
                                                        onChange={(e) => setCallComment(e.target.value)}
                                                        placeholder="Escribe el motivo del llamado..."
                                                        className="w-full text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 min-h-[80px] resize-none transition-all"
                                                    />
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        handleCallResponsible();
                                                        setShowCallDropdown(false);
                                                    }}
                                                    disabled={!callerId || !calledStaffId}
                                                    className={`w-full flex items-center justify-center gap-2 py-3 text-white rounded-xl font-bold text-xs transition-all shadow-lg active:scale-[0.95] ${!callerId || !calledStaffId ? 'bg-gray-300 cursor-not-allowed opacity-50' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                                                >
                                                    <Phone size={16} fill="currentColor" />
                                                    REALIZAR LLAMADA
                                                </button>
                                            </div>
                                        </div>
                                    </div>,
                                    document.body
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* Window Controls */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {showPanel && (panelMode === 'task' || panelMode === 'action' || panelMode === 'day') && (
                        <PrintButton
                            onClick={handlePrint}
                        />
                    )}
                    <button
                        onClick={handleToggleCollapse}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-zinc-800 text-gray-500 rounded transition-colors mr-1"
                        title={isCollapsed ? "Expandir" : "Contraer"}
                    >
                        {isCollapsed ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    </button>

                    {(panelMode === 'task' || panelMode === 'createTask') && (
                        <button
                            onClick={handleDeleteTask}
                            disabled={saving || !selectedTask?.id}
                            className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                            title="Eliminar Tarea"
                        >
                            <Trash2 size={14} />
                        </button>
                    )}

                    {showPanel && (
                        <button
                            onClick={handleSaveAction}
                            disabled={saving}
                            className="flex items-center gap-1.5 px-3 py-1 bg-green-50 border border-green-200 text-green-700 hover:bg-green-100 rounded text-[10px] font-bold transition-colors disabled:opacity-50"
                            title="Guardar"
                        >
                            <Save size={12} />
                            Guardar
                        </button>
                    )}
                    <button onClick={handleClose} className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded transition-colors">
                        <X size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InspectorHeader;
