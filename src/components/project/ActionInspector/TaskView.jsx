import React, { useRef, Fragment } from 'react';
import {
    Plus, GripVertical, Check,
    AlertCircle, Calendar, Info, Activity, ChevronRight, ChevronLeft, Trash2, Save
} from 'lucide-react';
import SearchableSpaceSelector from '../../common/SearchableSpaceSelector';
import SearchableStaffSelector from '../../common/SearchableStaffSelector';
import EvidenceUploader from '../../common/EvidenceUploader';
import ConcatenatedActionCard from './ConcatenatedActionCard';
import ParallelActionCard from './ParallelActionCard';
import { format, differenceInDays, parseISO } from 'date-fns';
import { projectService } from '../../../services/projectService';

export default function TaskView({
    editItem,
    onTaskChange,
    staffers,
    stages,
    subProjects,
    projects,
    espacios,
    concatenatedActions,
    setConcatenatedActions,
    parallelActions,
    setParallelActions,
    loading,
    onSubActionChange,
    onDeleteSubAction,
    // DnD & Resizing props
    timelineContainerRef,
    isDraggingUI,
    handleResizeStart,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDrop
}) {
    // Helpers for calculating total days
    const calculateDays = () => {
        if (!editItem.fecha_inicio || !editItem.fecha_fin_estimada) return 0;
        const start = new Date(editItem.fecha_inicio);
        const end = new Date(editItem.fecha_fin_estimada);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays > 0 ? diffDays : 0;
    };

    const totalDays = calculateDays();

    return (
        <div className="grid grid-cols-12 h-full bg-[#f6f3ee] overflow-hidden">
            {/* LEFT: Task Form (3 cols) with Technical Sidebar */}
            <div className="col-span-3 border-r-4 border-[#1c1c19] bg-white flex h-full overflow-hidden">
                {/* SIDEBAR - High Priority Visibility */}
                <div
                    className="w-[40px] min-w-[40px] border-r-2 border-[#1c1c19] bg-[#f0ede8] flex flex-col items-center py-4 gap-6 shrink-0 z-10"
                >

                    {/* Completion Toggle */}
                    <div className="flex flex-col items-center gap-2">
                        <button
                            onClick={() => onTaskChange('finished', !editItem.finished)}
                            className="w-5 h-5 border-2 border-[#1c1c19] rounded-sm flex items-center justify-center bg-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
                        >
                            {editItem.finished && <Check size={14} strokeWidth={4} />}
                        </button>
                        <span style={{ writingMode: 'vertical-lr' }} className="rotate-180 text-[7px] font-black text-[#72777f] uppercase tracking-widest mt-1">
                            Terminado
                        </span>
                    </div>

                    <div className="flex-1" />

                    {/* Vertical Label */}
                    <span style={{ writingMode: 'vertical-lr' }} className="rotate-180 text-[9px] font-black text-[#1c1c19] uppercase tracking-[0.2em] opacity-50 pb-6">
                        DATOS DE TAREA
                    </span>
                </div>

                {/* FORM CONTENT */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar bg-white">
                    <div className="space-y-3">
                        {/* Row 1: Catalog Selectors */}
                        <div className="grid grid-cols-12 gap-2 items-end">
                            {/* Row 1: Sub-Proyecto -> Space */}
                            <div className="col-span-6">
                                <label className="block text-[7px] font-black text-[#72777f] uppercase tracking-widest mb-0.5">Sub-Proyecto</label>
                                <div className="h-7">
                                    <SearchableSpaceSelector
                                        value={editItem.subproject_id}
                                        onChange={(val) => {
                                            onTaskChange('subproject_id', val);
                                            onTaskChange('espacio_uuid', '');
                                        }}
                                        spaces={subProjects}
                                        placeholder="- SUB-PROYECTO -"
                                    />
                                </div>
                            </div>

                            <div className="col-span-6">
                                <label className="block text-[7px] font-black text-[#72777f] uppercase tracking-widest mb-0.5">Espacio</label>
                                <div className="h-7">
                                    <SearchableSpaceSelector
                                        value={editItem.espacio_uuid}
                                        onChange={(val) => onTaskChange('espacio_uuid', val)}
                                        spaces={espacios.filter(e => !editItem.subproject_id || e.subProject_id === editItem.subproject_id)}
                                        placeholder="- ESPACIO -"
                                    />
                                </div>
                            </div>

                            {/* Row 2: Staff -> Priority */}
                            <div className="col-span-8">
                                <label className="block text-[7px] font-black text-[#72777f] uppercase tracking-widest mb-0.5">Responsable</label>
                                <div className="h-7">
                                    <SearchableStaffSelector
                                        staffers={staffers}
                                        value={editItem.staff_id}
                                        onChange={(val) => onTaskChange('staff_id', val)}
                                        placeholder="- RESPONSABLE -"
                                        showIcon={true}
                                    />
                                </div>
                            </div>

                            <div className="col-span-4">
                                <label className="block text-[7px] font-black text-[#72777f] uppercase tracking-widest mb-0.5">Prioridad</label>
                                <select
                                    value={editItem.priority || 'NORMAL'}
                                    onChange={(e) => onTaskChange('priority', e.target.value)}
                                    style={{ height: '28px' }}
                                    className="w-full bg-white border-2 border-[#1c1c19] px-1.5 py-0 text-[9px] font-bold uppercase outline-none"
                                >
                                    <option value="BAJA">BAJA</option>
                                    <option value="NORMAL">NORMAL</option>
                                    <option value="ALTA">ALTA</option>
                                </select>
                            </div>
                        </div>

                        {/* Row 2: Description */}
                        <div className="space-y-0.5">
                            <label className="block text-[7px] font-black text-[#72777f] uppercase tracking-widest">Descripción</label>
                            <textarea
                                value={editItem.description || ''}
                                onChange={(e) => onTaskChange('description', e.target.value)}
                                className="w-full bg-white border-2 border-[#1c1c19] p-2 text-[13px] font-black italic outline-none focus:bg-[#fcf9f4] min-h-[50px]"
                                placeholder="Descripción de la tarea técnica..."
                            />
                        </div>

                        {/* Row 3: Evidence */}
                        <div className="mt-2 scale-95 origin-top-left">
                            <EvidenceUploader
                                currentUrl={editItem.evidence_url}
                                onUpload={(url) => onTaskChange('evidence_url', url)}
                                pathPrefix="task"
                                label="Evidencia"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* RIGHT: Task Actions (9 cols) */}
            <div className="col-span-9 flex flex-col overflow-hidden relative">
                {/* Timeline Header */}
                <div className="flex flex-col sticky top-0 bg-[#fcf9f4] z-10 border-b-4 border-[#1c1c19] shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between p-2 px-4">
                        <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black text-[#72777f] uppercase tracking-widest">Inicio:</span>
                            <div className="relative">
                                <Calendar size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[#0f4369]" />
                                <input
                                    type="date"
                                    value={editItem.fecha_inicio || ''}
                                    onChange={(e) => onTaskChange('fecha_inicio', e.target.value)}
                                    className="bg-white border-2 border-[#1c1c19] pl-6 pr-1 py-0.5 text-[10px] font-black text-[#0f4369] outline-none"
                                />
                            </div>
                        </div>

                        <div className="px-4 py-1 bg-[#0f4369] text-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(0,0,0,1)] text-[9px] font-black uppercase tracking-widest italic">
                            {totalDays} Días Totales
                        </div>

                        <div className="flex items-center gap-1.5">
                            <span className="text-[8px] font-black text-[#72777f] uppercase tracking-widest">Fin:</span>
                            <div className="relative">
                                <Calendar size={10} className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[#0f4369]" />
                                <input
                                    type="date"
                                    value={editItem.fecha_fin_estimada || ''}
                                    onChange={(e) => onTaskChange('fecha_fin_estimada', e.target.value)}
                                    className="bg-white border-2 border-[#1c1c19] pl-6 pr-1 py-0.5 text-[10px] font-black text-[#0f4369] outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Timeline Grid (Visual Guide) */}
                    <div className="h-4 flex relative border-t-2 border-[#1c1c19] bg-white">
                        <div className="w-6 shrink-0 border-r-2 border-[#1c1c19] bg-gray-100"></div>
                        <div className="flex-1 flex overflow-hidden">
                            {totalDays > 0 && Array.from({ length: Math.min(totalDays, 31) }).map((_, i) => (
                                <div key={i} className="h-full border-r border-gray-200 flex items-center justify-center" style={{ width: `${100 / Math.min(totalDays, 31)}%` }}>
                                    <span className="text-[7px] font-bold text-gray-400">{i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Sub-Actions Content */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {/* CRONOGRAMA */}
                    <div className="flex gap-1.5">
                        <div className="w-6 flex flex-col items-center py-2 bg-[#1c1c19] text-white rounded-l-md gap-3 shrink-0">
                            <button
                                onClick={() => {
                                    setConcatenatedActions(prev => {
                                        const count = prev.length + 1;
                                        const share = Number((100 / count).toFixed(4));
                                        const newAction = {
                                            description: '',
                                            executor_id: '',
                                            completed: false,
                                            es_paralela: false,
                                            porcentaje_duracion: share,
                                            color_ui: '#0f4369',
                                            _isNew: true
                                        };
                                        if (prev.length === 0) return [newAction];
                                        const factor = (100 - share) / 100;
                                        return [...prev.map(a => ({ ...a, porcentaje_duracion: Number(((a.porcentaje_duracion || 100 / prev.length) * factor).toFixed(4)) })), newAction];
                                    });
                                }}
                                className="w-4 h-4 flex items-center justify-center bg-white text-[#1c1c19] hover:bg-[#0f4369] hover:text-white transition-all shadow-[1px_1px_0_0_rgba(255,255,255,0.3)]"
                            >
                                <Plus size={12} strokeWidth={4} />
                            </button>
                            <h4 className="text-[8px] font-black uppercase tracking-widest [writing-mode:vertical-rl] rotate-180 italic opacity-80">Cronograma</h4>
                        </div>

                        <div className="flex-1 flex gap-1 overflow-hidden">
                            {/* Side Title */}

                            <div
                                ref={timelineContainerRef}
                                className="flex-1 flex w-full min-h-[100px] bg-white rounded-r-lg shadow-sm border border-gray-200 overflow-hidden relative select-none"
                            >
                                {concatenatedActions.length === 0 ? (
                                    <div className="flex-1 flex items-center justify-center text-[9px] text-gray-300 italic">No hay acciones concatenadas</div>
                                ) : (
                                    concatenatedActions.map((action, idx) => (
                                        <Fragment key={action.id || `c-${idx}`}>
                                            <ConcatenatedActionCard
                                                action={action}
                                                widthPercentage={action.porcentaje_duracion || (100 / concatenatedActions.length)}
                                                totalTaskDays={totalDays}
                                                color={action.color_ui || '#3b82f6'}
                                                staffers={staffers}
                                                isDragging={isDraggingUI !== null}
                                                index={idx}
                                                onDragStart={(e, i) => handleDragStart(e, i, 'concatenated')}
                                                onDragEnd={handleDragEnd}
                                                onDragOver={handleDragOver}
                                                onDrop={(e, i) => handleDrop(e, i, 'concatenated')}
                                                onChange={(field, value) => onSubActionChange(idx, field, value, 'concatenated')}
                                                onDelete={() => onDeleteSubAction(idx, 'concatenated')}
                                            />
                                            {idx < concatenatedActions.length - 1 && (
                                                <div
                                                    className="w-4 hover:w-6 -ml-2 -mr-2 z-10 cursor-col-resize flex items-center justify-center group/resizer"
                                                    onMouseDown={(e) => handleResizeStart(idx, e)}
                                                >
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
                    </div>

                    {/* PARALELAS */}
                    <div className="flex gap-1.5">
                        <div className="w-6 flex flex-col items-center py-2 bg-[#d1a457] text-[#1c1c19] rounded-l-md gap-3 shrink-0">
                            <button
                                onClick={() => {
                                    const newAction = {
                                        description: '',
                                        executor_id: '',
                                        completed: false,
                                        es_paralela: true,
                                        _isNew: true
                                    };
                                    setParallelActions([...parallelActions, newAction]);
                                }}
                                className="w-4 h-4 flex items-center justify-center bg-white text-[#1c1c19] hover:bg-[#0f4369] hover:text-white transition-all shadow-[1px_1px_0_0_rgba(0,0,0,1)]"
                            >
                                <Plus size={12} strokeWidth={4} />
                            </button>
                            <h4 className="text-[8px] font-black uppercase tracking-widest [writing-mode:vertical-rl] rotate-180 italic opacity-80">Paralelas</h4>
                        </div>
                        <div className="flex-1 flex flex-col gap-1.5">
                            {parallelActions.length === 0 ? (
                                <div className="h-full flex items-center justify-center border-2 border-dashed border-[#1c1c19]/20 text-[9px] font-black uppercase italic text-gray-300 py-6">Sin acciones paralelas</div>
                            ) : (
                                parallelActions.map((action, idx) => (
                                    <ParallelActionCard
                                        key={idx}
                                        action={action}
                                        staffers={staffers}
                                        index={idx}
                                        onDragStart={(e) => handleDragStart(e, idx, 'parallel')}
                                        onDragEnd={handleDragEnd}
                                        onDragOver={(e) => handleDragOver(e, idx)}
                                        onDrop={(e) => handleDrop(e, idx, 'parallel')}
                                        onChange={(field, value) => onSubActionChange(idx, field, value, 'parallel')}
                                        onDelete={() => onDeleteSubAction(idx, 'parallel')}
                                    />
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
