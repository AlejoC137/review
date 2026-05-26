import React, { Fragment } from 'react';
import { PlayCircle, PauseCircle, Check, AlertCircle, Plus, GripVertical } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import SearchableSpaceSelector from '../../common/SearchableSpaceSelector';
import EvidenceUploader from '../../common/EvidenceUploader';
import ConcatenatedActionCard from './ConcatenatedActionCard';
import ParallelActionCard from './ParallelActionCard';
import { deleteAction } from '../../../services/actionsService';

const TaskView = ({
    panelMode,
    taskForm,
    handleTaskChange,
    handleTaskCompletionToggle,
    projects,
    spaces,
    setSpaces,
    stages,
    staffers,
    loading,
    concatenatedActions,
    setConcatenatedActions,
    parallelActions,
    setParallelActions,
    selectedTask,
    timelineContainerRef,
    isDraggingUI,
    handleResizeStart,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleSubActionChange
}) => {
    return (
        <div className="grid grid-cols-12 h-full text-xs">
            {/* LEFT: Task Form */}
            <div className="col-span-4 border-r border-gray-100 flex overflow-hidden">
                <div className="w-6 flex flex-col items-center py-3 bg-gray-50/50 border-r border-gray-100 gap-4 shrink-0">
                    <button
                        onClick={() => handleTaskChange('finished', taskForm.finished === 'Pausada' ? 'Activa' : 'Pausada')}
                        className={`w-4 h-4 flex items-center justify-center rounded-full transition-colors ${taskForm.finished === 'Pausada' ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-green-100 text-green-600 hover:bg-green-200'}`}
                        title={taskForm.finished === 'Pausada' ? 'Reanudar Tarea' : 'Pausar Tarea'}
                    >
                        {taskForm.finished === 'Pausada' ? <PlayCircle size={10} strokeWidth={3} /> : <PauseCircle size={10} strokeWidth={3} />}
                    </button>

                    <div className="flex flex-col items-center gap-1 group">
                        <button
                            onClick={handleTaskCompletionToggle}
                            className={`w-4 h-4 flex items-center justify-center rounded border transition-colors ${taskForm.finished ? 'bg-green-500 border-green-600 text-white' : 'bg-white border-gray-300 text-gray-300 hover:border-green-400'}`}
                            title={taskForm.finished ? "Marcar como Pendiente" : "Marcar como Terminado"}
                        >
                            <Check size={10} strokeWidth={4} />
                        </button>
                        <span className="text-[7px] font-black text-gray-400 uppercase [writing-mode:vertical-rl] rotate-180">TERMINADO</span>
                    </div>

                    <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">DATOS DE TAREA</h4>
                </div>

                <div className="flex-1 p-2 overflow-y-auto space-y-1.5 custom-scrollbar">
                    <div className="grid grid-cols-12 gap-1.5 items-end">
                        <div className="col-span-2">
                            <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Proyecto</label>
                            <select
                                value={taskForm.proyecto_id || ''}
                                onChange={(e) => handleTaskChange('proyecto_id', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded px-1.5 py-1 text-[10px] focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 appearance-none transition-colors"
                            >
                                <option value="">- Proyecto -</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-4">
                            <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Espacio</label>
                            <SearchableSpaceSelector
                                value={taskForm.espacio_uuid}
                                onChange={(val) => handleTaskChange('espacio_uuid', val)}
                                spaces={spaces}
                                onSpaceCreated={() => {
                                    import('../../../services/spacesService').then(m => m.getSpaces().then(setSpaces));
                                }}
                                placeholder="Seleccionar Espacio..."
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Etapa (Stage)</label>
                            <select
                                value={taskForm.stage_id || ''}
                                onChange={(e) => handleTaskChange('stage_id', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded px-1.5 py-1 text-[10px] focus:ring-1 focus:ring-blue-500 appearance-none"
                            >
                                <option value="">- Etapa -</option>
                                {stages.map(s => <option key={s.id} value={s.id}>{s.name || s.id}</option>)}
                            </select>
                        </div>

                        <div className="col-span-3">
                            <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5 truncate">Responsable</label>
                            <select
                                value={taskForm.staff_id || ''}
                                onChange={(e) => handleTaskChange('staff_id', e.target.value)}
                                className="w-full text-[10px] bg-white border border-gray-200 rounded px-1.5 py-1 focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 transition-colors h-[26px]"
                            >
                                <option value="">- Resp -</option>
                                {staffers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name || s.nombre}</option>
                                ))}
                            </select>
                        </div>

                        <div className="col-span-1">
                            <label className="block text-[8px] font-bold text-gray-400 uppercase mb-0.5">Prio.</label>
                            <select
                                value={taskForm.Priority || '1'}
                                onChange={(e) => handleTaskChange('Priority', e.target.value)}
                                className="w-full bg-white border border-gray-200 rounded px-1.5 py-1 text-[10px] focus:ring-1 focus:ring-blue-500 appearance-none h-[26px]"
                            >
                                {[1, 2, 3, 4, 5].map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5">
                        <div>
                            <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">Descripción</label>
                            <input
                                type="text"
                                value={taskForm.task_description || ''}
                                onChange={(e) => handleTaskChange('task_description', e.target.value)}
                                className="w-full text-[10px] bg-white border border-gray-200 rounded px-1.5 py-1 focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                                placeholder="Descripción de la tarea..."
                            />
                        </div>
                    </div>

                    {taskForm.finished === 'Pausada' && (
                        <div className="mb-2 transition-all">
                            <label className="block text-[8px] font-bold text-red-500 uppercase mb-0.5 flex items-center gap-1">
                                <AlertCircle size={8} /> Razón de Pausa
                            </label>

                            <div className="bg-red-50 border border-red-200 rounded p-1 mb-1">
                                {(() => {
                                    try {
                                        const entries = JSON.parse(taskForm.notes || '[]');
                                        if (!Array.isArray(entries) || entries.length === 0) {
                                            return <span className="text-[9px] text-gray-400 italic">Sin razón registrada.</span>;
                                        }
                                        const latest = entries[0];
                                        return (
                                            <div className="text-[9px]">
                                                <div className="flex justify-between font-bold text-red-700 opacity-70 text-[8px] mb-0.5">
                                                    <span>{latest.date}</span>
                                                    <span>{latest.user}</span>
                                                </div>
                                                <p className="text-gray-700 leading-tight whitespace-pre-wrap">{latest.text}</p>
                                            </div>
                                        );
                                    } catch (e) {
                                        return <p className="text-[9px] text-gray-700 whitespace-pre-wrap">{taskForm.notes || 'Sin razón especificada.'}</p>;
                                    }
                                })()}
                            </div>
                        </div>
                    )}

                    <div className="mt-2">
                        <EvidenceUploader
                            currentUrl={taskForm.evidence_url}
                            onUpload={(url) => handleTaskChange('evidence_url', url)}
                            pathPrefix="task"
                            label="Evidencia de Tarea"
                        />
                    </div>
                </div>
            </div>

            {/* RIGHT: Task Actions (Timeline View) */}
            <div className="col-span-8 bg-gray-50/50 flex flex-col overflow-hidden relative">
                <div className="flex flex-col sticky top-0 bg-gray-50 z-10 border-b border-gray-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-1.5 px-3">
                        <div className="flex items-center gap-1 bg-white/60 border border-gray-100 rounded px-1.5">
                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">INICIO:</span>
                            <input
                                type="date"
                                value={taskForm.fecha_inicio || ''}
                                onChange={(e) => handleTaskChange('fecha_inicio', e.target.value)}
                                className="bg-transparent border-none text-[10px] font-bold text-blue-600 p-0 focus:ring-0 w-24 cursor-pointer"
                            />
                        </div>

                        {taskForm.fecha_inicio && taskForm.fecha_fin_estimada && (
                            <div className="text-[9px] font-black text-blue-700 bg-blue-50 px-3 py-0.5 rounded-full border border-blue-100 shadow-sm">
                                {differenceInDays(parseISO(taskForm.fecha_fin_estimada), parseISO(taskForm.fecha_inicio)) + 1} DÍAS TOTALES
                            </div>
                        )}

                        <div className="flex items-center gap-1 bg-white/60 border border-gray-100 rounded px-1.5">
                            <span className="text-[7px] font-black text-gray-400 uppercase tracking-tighter">FIN:</span>
                            <input
                                type="date"
                                value={taskForm.fecha_fin_estimada || ''}
                                onChange={(e) => handleTaskChange('fecha_fin_estimada', e.target.value)}
                                className="bg-transparent border-none text-[10px] font-bold text-blue-600 p-0 focus:ring-0 w-24 cursor-pointer text-right"
                            />
                        </div>
                    </div>

                    {taskForm.fecha_inicio && taskForm.fecha_fin_estimada && (
                        <div className="h-4 flex relative border-t border-gray-400 bg-white" style={{ paddingLeft: '34px', paddingRight: '6px' }}>
                            {(() => {
                                const start = parseISO(taskForm.fecha_inicio);
                                const end = parseISO(taskForm.fecha_fin_estimada);
                                const days = differenceInDays(end, start) + 1;
                                if (days <= 0 || days > 365) return null;
                                return Array.from({ length: days }).map((_, i) => (
                                    <div key={i} className="h-full border-l border-gray-400 relative flex flex-col justify-end" style={{ width: `${100 / days}%` }}>
                                        {(i % 5 === 0 || days <= 15) && (
                                            <span className="absolute bottom-0 left-0.5 text-[9px] font-black text-gray-600">{i + 1}</span>
                                        )}
                                    </div>
                                ));
                            })()}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto p-1.5 space-y-2">
                    {loading ? (
                        <div className="text-center py-10 text-[9px] text-gray-400">Cargando acciones...</div>
                    ) : (
                        <>
                            {/* CONCATENATED ACTIONS */}
                            <div className="flex-1 flex gap-1 overflow-hidden">
                                <div className="w-6 flex flex-col items-center py-2 bg-gray-50/50 border-r border-gray-100 rounded-l-lg gap-2">
                                    <button
                                        onClick={() => {
                                            setConcatenatedActions(prev => {
                                                const count = prev.length + 1;
                                                const share = 100 / count;
                                                const newAction = {
                                                    description: '', executor_id: '',
                                                    fecha_ejecucion: selectedTask?.fecha_inicio || format(new Date(), 'yyyy-MM-dd'),
                                                    fecha_fin: selectedTask?.fecha_inicio || format(new Date(), 'yyyy-MM-dd'),
                                                    requiere_aprobacion_ronald: false, requiere_aprobacion_wiet: false, requiere_aprobacion_alejo: false,
                                                    completed: false, task_id: selectedTask?.id, es_paralela: false, porcentaje_duracion: share, color_ui: '#3b82f6', _isNew: true
                                                };
                                                const factor = (100 - share) / 100;
                                                return [...prev.map(a => ({ ...a, porcentaje_duracion: (a.porcentaje_duracion || 100 / (prev.length || 1)) * factor })), newAction];
                                            });
                                        }}
                                        className="w-4 h-4 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                                        title="Añadir Acción al Cronograma"
                                    >
                                        <Plus size={10} strokeWidth={4} />
                                    </button>
                                    <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">CRONOGRAMA</h4>
                                </div>

                                <div ref={timelineContainerRef} className="flex-1 flex w-full min-h-[100px] bg-white rounded-r-lg shadow-sm border border-gray-200 overflow-hidden relative select-none">
                                    {concatenatedActions.length === 0 ? (
                                        <div className="flex-1 flex items-center justify-center text-[9px] text-gray-300 italic">No hay acciones concatenadas</div>
                                    ) : (
                                        concatenatedActions.map((action, idx) => (
                                            <Fragment key={action.id || `c-${idx}`}>
                                                <ConcatenatedActionCard
                                                    action={action}
                                                    widthPercentage={action.porcentaje_duracion || (100 / concatenatedActions.length)}
                                                    totalTaskDays={taskForm.fecha_inicio && taskForm.fecha_fin_estimada ? differenceInDays(parseISO(taskForm.fecha_fin_estimada), parseISO(taskForm.fecha_inicio)) + 1 : 0}
                                                    color={action.color_ui || '#3b82f6'}
                                                    staffers={staffers}
                                                    isDragging={isDraggingUI !== null}
                                                    index={idx}
                                                    onDragStart={(e, i) => handleDragStart(e, i, 'concatenated')}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e, i) => handleDrop(e, i, 'concatenated')}
                                                    onChange={(field, value) => handleSubActionChange(idx, field, value, 'concatenated')}
                                                    onDelete={async () => {
                                                        if (action._isNew) {
                                                            setConcatenatedActions(prev => prev.filter((_, i) => i !== idx));
                                                        } else if (confirm('¿Eliminar esta acción parcial?')) {
                                                            try {
                                                                await deleteAction(action.id);
                                                                setConcatenatedActions(prev => prev.filter(a => a.id !== action.id));
                                                            } catch (error) { alert('Error al eliminar: ' + error.message); }
                                                        }
                                                    }}
                                                />
                                                {idx < concatenatedActions.length - 1 && (
                                                    <div className="w-4 hover:w-6 -ml-2 -mr-2 z-10 cursor-col-resize flex items-center justify-center group/resizer" onMouseDown={(e) => handleResizeStart(idx, e)}>
                                                        <div className="h-1/2 w-0.5 bg-gray-200 group-hover/resizer:bg-blue-500 rounded-full transition-all flex items-center justify-center">
                                                            <GripVertical size={10} className="text-transparent group-hover/resizer:text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </Fragment>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* PARALLEL ACTIONS */}
                            <div className="flex gap-1">
                                <div className="w-6 flex flex-col items-center py-2 bg-gray-50/50 border-r border-gray-100 rounded-l-lg gap-2">
                                    <button
                                        onClick={() => {
                                            const newAction = {
                                                description: '', executor_id: '',
                                                fecha_ejecucion: selectedTask?.fecha_inicio || format(new Date(), 'yyyy-MM-dd'),
                                                fecha_fin: selectedTask?.fecha_inicio || format(new Date(), 'yyyy-MM-dd'),
                                                requiere_aprobacion_ronald: false, requiere_aprobacion_wiet: false, requiere_aprobacion_alejo: false,
                                                completed: false, task_id: selectedTask?.id, es_paralela: true, _isNew: true
                                            };
                                            setParallelActions(prev => [...prev, newAction]);
                                        }}
                                        className="w-4 h-4 flex items-center justify-center bg-indigo-100 text-indigo-600 rounded-full hover:bg-indigo-200 transition-colors"
                                        title="Añadir Acción Paralela"
                                    >
                                        <Plus size={10} strokeWidth={4} />
                                    </button>
                                    <h4 className="text-[9px] font-black text-gray-500 uppercase tracking-widest [writing-mode:vertical-rl] rotate-180">PARALELAS</h4>
                                </div>
                                <div className="flex-1 bg-white border border-dashed border-gray-200 rounded-r-lg p-1 overflow-hidden">
                                    <div className="flex flex-col gap-1.5">
                                        {parallelActions.length === 0 ? (
                                            <div className="text-center py-4 text-[9px] text-gray-300 italic">Sin acciones paralelas</div>
                                        ) : (
                                            parallelActions.map((action, idx) => (
                                                <ParallelActionCard
                                                    key={action.id || `p-${idx}`}
                                                    action={action} staffers={staffers} index={idx}
                                                    onDragStart={(e, i) => handleDragStart(e, i, 'parallel')}
                                                    onDragOver={handleDragOver} onDrop={(e, i) => handleDrop(e, i, 'parallel')}
                                                    onChange={(field, value) => handleSubActionChange(idx, field, value, 'parallel')}
                                                    onDelete={async () => {
                                                        if (action._isNew) {
                                                            setParallelActions(prev => prev.filter((_, i) => i !== idx));
                                                        } else if (confirm('¿Eliminar esta acción paralela?')) {
                                                            try {
                                                                await deleteAction(action.id);
                                                                setParallelActions(prev => prev.filter(a => a.id !== action.id));
                                                            } catch (error) { alert('Error al eliminar: ' + error.message); }
                                                        }
                                                    }}
                                                />
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TaskView;
