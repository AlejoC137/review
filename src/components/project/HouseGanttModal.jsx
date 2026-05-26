import React, { useMemo, useRef, useState, useEffect } from 'react';
import { X, Calendar, User, ZoomIn, ZoomOut, Activity } from 'lucide-react';

const COLUMN_WIDTH = 35;
const HEADER_HEIGHT = 50;
const ROW_HEIGHT = 32;
const SIDEBAR_WIDTH = 420;

const HouseGanttModal = ({ isOpen, onClose, project, tasks }) => {
    if (!isOpen || !project) return null;

    const [zoom, setZoom] = useState(1);
    const scrollContainerRef = useRef(null);
    const pixelPerDay = COLUMN_WIDTH * zoom;

    // Helper: format date as dd/MM/yy
    const formatDate = (date) => {
        if (!date) return '-';
        const d = new Date(date);
        if (isNaN(d.getTime())) return '-';
        return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getFullYear()).slice(-2)}`;
    };

    // Helper: difference in days
    const diffInDays = (d1, d2) => {
        const t1 = new Date(d1).getTime();
        const t2 = new Date(d2).getTime();
        return Math.floor((t1 - t2) / (1000 * 60 * 60 * 24));
    };

    // Helper: add days
    const addDays = (date, days) => {
        const d = new Date(date);
        d.setDate(d.getDate() + days);
        return d;
    };

    // 1. Process Data & Calculate Bounds
    const { processedTasks, timelineStart, totalDays } = useMemo(() => {
        let filteredTasks = tasks.filter(t => t.fecha_inicio);

        if (filteredTasks.length === 0) {
            const today = new Date();
            today.setHours(0,0,0,0);
            return {
                processedTasks: [],
                timelineStart: addDays(today, -5),
                totalDays: 35
            };
        }

        const sorted = [...filteredTasks].sort((a, b) => new Date(a.fecha_inicio) - new Date(b.fecha_inicio));
        
        let minDate = new Date(sorted[0].fecha_inicio);
        let maxDate = new Date(sorted[0].fecha_inicio);

        sorted.forEach(t => {
            const start = new Date(t.fecha_inicio);
            const end = t.fecha_fin_estimada ? new Date(t.fecha_fin_estimada) : start;
            if (start < minDate) minDate = start;
            if (end > maxDate) maxDate = end;
        });

        minDate = addDays(minDate, -7);
        maxDate = addDays(maxDate, 14);
        const days = diffInDays(maxDate, minDate) + 1;

        return {
            processedTasks: sorted,
            timelineStart: minDate,
            totalDays: days
        };
    }, [tasks]);

    const daysArray = useMemo(() => {
        return Array.from({ length: totalDays }, (_, i) => addDays(timelineStart, i));
    }, [timelineStart, totalDays]);

    // Simple Months array
    const months = useMemo(() => {
        const monthsData = [];
        let current = new Date(timelineStart);
        current.setDate(1);
        
        const end = new Date(timelineStart);
        end.setDate(end.getDate() + totalDays);

        while (current <= end) {
            const mStart = current < timelineStart ? new Date(timelineStart) : new Date(current);
            const mEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
            const actualEnd = mEnd > end ? end : mEnd;

            if (mStart <= actualEnd) {
                const daysInSpan = diffInDays(actualEnd, mStart) + 1;
                monthsData.push({
                    label: current.toLocaleString('es', { month: 'long', year: 'numeric' }),
                    width: daysInSpan * pixelPerDay
                });
            }
            current.setMonth(current.getMonth() + 1);
            current.setDate(1);
        }
        return monthsData;
    }, [timelineStart, totalDays, pixelPerDay]);

    useEffect(() => {
        if (isOpen && scrollContainerRef.current) {
            const today = new Date();
            const diff = diffInDays(today, timelineStart);
            if (diff > 0) {
                const scrollPos = (diff * pixelPerDay) - 200;
                scrollContainerRef.current.scrollLeft = scrollPos > 0 ? scrollPos : 0;
            }
        }
    }, [isOpen, timelineStart, pixelPerDay]);

    return (
        <div className="fixed inset-0 bg-[#1c1c19]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-[98vw] h-[95vh] border-4 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(0,0,0,1)] flex flex-col overflow-hidden">
                
                {/* Header Panel */}
                <div className="px-6 py-4 border-b-4 border-[#1c1c19] bg-[#f6f3ee] flex items-center justify-between flex-shrink-0 z-50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[#1c1c19] text-white flex items-center justify-center shadow-[4px_4px_0_0_rgba(15,67,105,1)]">
                            <Calendar size={24} strokeWidth={3} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Cronograma Maestro</h2>
                            <div className="flex items-center gap-3 mt-1 text-[10px] font-black text-[#72777f] uppercase tracking-widest">
                                <span>{project.name}</span>
                                <span className="w-1 h-1 bg-[#1c1c19] rounded-full"></span>
                                <span>{processedTasks.length} Actividades</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white border-2 border-[#1c1c19] p-0.5 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                            <button onClick={() => setZoom(Math.max(0.3, zoom - 0.2))} className="p-1 hover:bg-[#f6f3ee]"><ZoomOut size={16} strokeWidth={3} /></button>
                            <span className="text-[10px] font-black w-10 text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(Math.min(1.5, zoom + 0.2))} className="p-1 hover:bg-[#f6f3ee]"><ZoomIn size={16} strokeWidth={3} /></button>
                        </div>

                        <button onClick={onClose} className="p-2 bg-red-500 text-white border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
                            <X size={24} strokeWidth={3} />
                        </button>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-auto custom-scrollbar relative bg-white select-none" ref={scrollContainerRef}>
                    <div className="inline-block relative min-w-full" style={{ height: (processedTasks.length * ROW_HEIGHT) + HEADER_HEIGHT }}>
                        
                        {/* HEADER STICKY */}
                        <div className="sticky top-0 left-0 z-50 h-[50px] bg-[#f6f3ee] border-b-2 border-[#1c1c19] flex items-center" style={{ width: `${SIDEBAR_WIDTH}px` }}>
                            <div className="w-[240px] px-4 text-[10px] font-black text-[#1c1c19] uppercase tracking-widest border-r-2 border-[#1c1c19] h-full flex items-center italic">Actividad Técnica</div>
                            <div className="w-[50px] px-1 text-[9px] font-black text-[#1c1c19] uppercase border-r-2 border-[#1c1c19] h-full flex items-center justify-center text-center">Días</div>
                            <div className="w-[130px] px-1 text-[9px] font-black text-[#1c1c19] uppercase h-full flex items-center justify-center text-center italic">Ventana Temporal</div>
                        </div>

                        {/* Timeline Headers */}
                        <div className="sticky top-0 z-40 bg-white h-[50px] flex border-b-2 border-[#1c1c19]" style={{ paddingLeft: `${SIDEBAR_WIDTH}px`, marginTop: '-50px', width: 'fit-content' }}>
                            <div className="flex flex-col h-full">
                                <div className="h-[24px] flex border-b-2 border-[#1c1c19] bg-[#1c1c19] text-white">
                                    {months.map((m, i) => (
                                        <div key={i} className="flex items-center px-3 border-r border-white/20 text-[9px] font-black uppercase italic tracking-widest whitespace-nowrap overflow-hidden" style={{ width: m.width }}>
                                            {m.label}
                                        </div>
                                    ))}
                                </div>
                                <div className="h-[26px] flex bg-white">
                                    {daysArray.map((day, i) => (
                                        <div
                                            key={i}
                                            className={`flex-shrink-0 flex items-center justify-center text-[8px] border-r border-gray-100 font-black ${day.getDay() === 0 || day.getDay() === 6 ? 'bg-gray-50' : ''} ${day.toDateString() === new Date().toDateString() ? 'bg-red-500 text-white' : 'text-[#72777f]'}`}
                                            style={{ width: pixelPerDay }}
                                        >
                                            {day.getDate()}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* BODY */}
                        <div className="sticky left-0 z-30 bg-white border-r-2 border-[#1c1c19] shadow-[10px_0_20px_rgba(0,0,0,0.05)]" style={{ width: `${SIDEBAR_WIDTH}px`, float: 'left', minHeight: 'calc(100% - 50px)' }}>
                            {processedTasks.map((task, index) => {
                                const start = new Date(task.fecha_inicio);
                                const end = task.fecha_fin_estimada ? new Date(task.fecha_fin_estimada) : start;
                                const duration = diffInDays(end, start) + 1;

                                return (
                                    <div key={task.id} className="h-[32px] flex items-center border-b border-gray-200 bg-white hover:bg-[#fcf9f4] transition-colors group cursor-pointer">
                                        <div className="w-[240px] px-4 text-[10px] font-black uppercase italic border-r border-gray-100 h-full flex items-center truncate">
                                            <span className={task.finished === 'completed' ? 'line-through opacity-40' : ''}>{task.task_description}</span>
                                        </div>
                                        <div className="w-[50px] px-1 text-[9px] font-mono font-bold text-[#72777f] border-r border-gray-100 h-full flex items-center justify-center">{duration}D</div>
                                        <div className="w-[130px] px-1 text-[8px] font-mono font-bold text-[#72777f] h-full flex items-center justify-center gap-1">
                                            <span>{formatDate(start)}</span>
                                            <span className="opacity-30">→</span>
                                            <span>{formatDate(end)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* BARS GRID */}
                        <div className="relative z-10" style={{ paddingLeft: `${SIDEBAR_WIDTH}px`, width: 'fit-content' }}>
                            <div className="absolute inset-0 z-0 flex pointer-events-none">
                                {daysArray.map((day, i) => (
                                    <div key={i} className={`flex-shrink-0 h-full border-r ${day.getDay() === 1 ? 'border-gray-300' : 'border-gray-50'}`} style={{ width: pixelPerDay }}></div>
                                ))}
                            </div>

                            {/* Today Line */}
                            <div className="absolute top-0 bottom-0 w-1 bg-red-500 z-20 pointer-events-none" style={{ left: (diffInDays(new Date(), timelineStart) * pixelPerDay) + SIDEBAR_WIDTH }}></div>

                            {/* Bars */}
                            {processedTasks.map((task, index) => {
                                const start = new Date(task.fecha_inicio);
                                const end = task.fecha_fin_estimada ? new Date(task.fecha_fin_estimada) : start;
                                const left = diffInDays(start, timelineStart) * pixelPerDay;
                                const width = Math.max(pixelPerDay, (diffInDays(end, start) + 1) * pixelPerDay);

                                let colorClass = 'bg-[#0f4369]';
                                if (task.finished === 'completed') colorClass = 'bg-green-500 opacity-40';

                                return (
                                    <div key={task.id} className="h-[32px] border-b border-gray-100 relative flex items-center group">
                                        <div
                                            className={`h-5 border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(0,0,0,1)] rounded-sm flex items-center px-2 text-[8px] font-black text-white uppercase italic whitespace-nowrap overflow-hidden transition-all group-hover:scale-[1.02] ${colorClass}`}
                                            style={{ left: left, width: width, position: 'absolute' }}
                                        >
                                            {width > 40 && task.task_description}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HouseGanttModal;
