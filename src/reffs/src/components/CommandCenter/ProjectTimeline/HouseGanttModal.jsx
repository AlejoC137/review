import React, { useMemo, useRef, useState, useEffect } from 'react';
import { X, Calendar, User, ZoomIn, ZoomOut } from 'lucide-react';
import { format, parseISO, isValid, differenceInDays, addDays, startOfDay, isSameDay, min, max, getDaysInMonth, startOfMonth, endOfMonth, isWithinInterval, isMonday } from 'date-fns';
import { es } from 'date-fns/locale';
import { handleNativePrint } from '../../../utils/printUtils';
import PrintButton from '../../common/PrintButton';

const COLUMN_WIDTH = 35; // Compacted width
const HEADER_HEIGHT = 50; // Compacted header
const ROW_HEIGHT = 32; // Compacted row
const SIDEBAR_WIDTH = 420; // Compacted for columns

const HouseGanttModal = ({ isOpen, onClose, project, tasks }) => {
    if (!isOpen || !project) return null;

    const [zoom, setZoom] = useState(1);
    const [activeFilters, setActiveFilters] = useState({
        idea: true,
        desarrollo: true,
        muebles: true,
        obra: false
    });
    const scrollContainerRef = useRef(null);
    const pixelPerDay = COLUMN_WIDTH * zoom;

    // 1. Process Data & Calculate Bounds
    const { processedTasks, timelineStart, timelineEnd, totalDays } = useMemo(() => {
        // Base valid tasks
        let baseTasks = tasks.filter(t => t.fecha_inicio && isValid(parseISO(t.fecha_inicio)));

        // Filtering Logic
        let filteredTasks = baseTasks.filter(task => {
            const stageName = (task.stage?.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

            const isIdea = stageName.includes('idea') || stageName.includes('diseño'); // "Diseño" alias for Idea
            const isDesarrollo = stageName.includes('desarrollo');
            const isMuebles = stageName.includes('muebles');
            const isDesignGroup = isIdea || isDesarrollo || isMuebles;
            const isObra = !isDesignGroup;

            if (isIdea && activeFilters.idea) return true;
            if (isDesarrollo && activeFilters.desarrollo) return true;
            if (isMuebles && activeFilters.muebles) return true;
            if (isObra && activeFilters.obra) return true;

            return false;
        });

        if (filteredTasks.length === 0) {
            const today = startOfDay(new Date());
            return {
                processedTasks: [],
                timelineStart: addDays(today, -5),
                timelineEnd: addDays(today, 30),
                totalDays: 35
            };
        }

        // Sort by Start Date Ascending
        const sorted = filteredTasks.sort((a, b) => parseISO(a.fecha_inicio) - parseISO(b.fecha_inicio));

        // Find Min/Max dates
        const startDates = sorted.map(t => parseISO(t.fecha_inicio));
        const endDates = sorted.map(t => t.fecha_fin_estimada && isValid(parseISO(t.fecha_fin_estimada)) ? parseISO(t.fecha_fin_estimada) : parseISO(t.fecha_inicio));

        let minDate = min(startDates);
        let maxDate = max(endDates);

        // Add padding for display
        minDate = addDays(minDate, -7);
        maxDate = addDays(maxDate, 14);

        const days = differenceInDays(maxDate, minDate) + 1;

        return {
            processedTasks: sorted,
            timelineStart: minDate,
            timelineEnd: maxDate,
            totalDays: days
        };
    }, [tasks, activeFilters]);

    // 2. Generate Time Helpers
    const daysArray = useMemo(() => {
        return Array.from({ length: totalDays }, (_, i) => addDays(timelineStart, i));
    }, [timelineStart, totalDays]);

    const months = useMemo(() => {
        const monthsData = [];
        let currentMonth = startOfMonth(timelineStart);
        const end = endOfMonth(timelineEnd);

        while (currentMonth <= end) {
            const monthStart = currentMonth < timelineStart ? timelineStart : currentMonth;
            const monthEndRaw = endOfMonth(currentMonth);
            const monthEnd = monthEndRaw > timelineEnd ? timelineEnd : monthEndRaw;

            if (monthStart <= monthEnd) {
                const daysInSpan = differenceInDays(monthEnd, monthStart) + 1;
                monthsData.push({
                    date: currentMonth,
                    label: format(currentMonth, 'MMMM yyyy', { locale: es }),
                    width: daysInSpan * pixelPerDay
                });
            }
            currentMonth = startOfMonth(addDays(endOfMonth(monthStart), 1));
        }
        return monthsData;
    }, [timelineStart, timelineEnd, pixelPerDay]);


    // 3. Scroll to Today on Initial Load
    useEffect(() => {
        if (isOpen && scrollContainerRef.current) {
            const today = new Date();
            const diff = differenceInDays(today, timelineStart);
            if (diff > 0) {
                const scrollPos = (diff * pixelPerDay) - 100;
                scrollContainerRef.current.scrollLeft = scrollPos > 0 ? scrollPos : 0;
            }
        }
    }, [isOpen, timelineStart, pixelPerDay]); // Re-run when timelineStart changes (which happens on toggle)


    const handlePrint = () => {
        handleNativePrint('gantt-chart-container', `Cronograma_${project.name}_${new Date().toISOString()}`);
    };

    const handleTaskScroll = (dateStr) => {
        if (!dateStr || !scrollContainerRef.current) return;
        const taskDate = parseISO(dateStr);
        if (!isValid(taskDate)) return;

        const diff = differenceInDays(taskDate, timelineStart);
        if (diff >= 0) {
            // Scroll to the task start minus some padding (e.g. 100px) so it's not at the very edge
            const scrollPos = (diff * pixelPerDay) - 250;
            scrollContainerRef.current.scrollTo({
                left: Math.max(0, scrollPos),
                behavior: 'smooth'
            });
        }
    };



    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-[98vw] h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">

                {/* Header Control Panel */}
                <div className="px-4 py-3 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0 z-50 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-md">
                            <Calendar size={16} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 leading-tight">Cronograma de proyecto</h2>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="font-medium">{project.name}</span>
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                <span>{processedTasks.length} Tareas</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Filter Toolbar */}
                        <div className="flex items-center gap-2 mr-4">
                            <button
                                onClick={() => setActiveFilters(prev => ({ ...prev, idea: !prev.idea }))}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded border transition-colors ${activeFilters.idea
                                    ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                                    : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-sm">💡</span>
                                <span className="text-[10px] font-bold">Idea</span>
                            </button>

                            <button
                                onClick={() => setActiveFilters(prev => ({ ...prev, desarrollo: !prev.desarrollo }))}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded border transition-colors ${activeFilters.desarrollo
                                    ? 'bg-blue-100 text-blue-700 border-blue-200'
                                    : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-sm">📐</span>
                                <span className="text-[10px] font-bold">Desarrollo</span>
                            </button>

                            <button
                                onClick={() => setActiveFilters(prev => ({ ...prev, muebles: !prev.muebles }))}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded border transition-colors ${activeFilters.muebles
                                    ? 'bg-purple-100 text-purple-700 border-purple-200'
                                    : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-sm">🪑</span>
                                <span className="text-[10px] font-bold">Muebles</span>
                            </button>

                            <button
                                onClick={() => setActiveFilters(prev => ({ ...prev, obra: !prev.obra }))}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded border transition-colors ${activeFilters.obra
                                    ? 'bg-orange-100 text-orange-700 border-orange-200'
                                    : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <span className="text-sm">🏗️</span>
                                <span className="text-[10px] font-bold">Obra</span>
                            </button>
                        </div>

                        {/* Legend */}
                        <div className="hidden xl:flex items-center gap-3 mr-4 text-[10px] font-medium text-gray-600">
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Terminado</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span>En Curso</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span>Pausado</div>
                        </div>

                        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                            <button onClick={() => setZoom(Math.max(0.3, zoom - 0.2))} className="p-1 hover:bg-white rounded text-gray-600 transition-all" title="Alejar"><ZoomOut size={14} /></button>
                            <span className="text-[10px] font-bold text-gray-500 px-1.5 min-w-[32px] text-center">{Math.round(zoom * 100)}%</span>
                            <button onClick={() => setZoom(Math.min(1.5, zoom + 0.2))} className="p-1 hover:bg-white rounded text-gray-600 transition-all" title="Acercar"><ZoomIn size={14} /></button>
                        </div>

                        <div className="h-5 w-px bg-gray-200 mx-1"></div>
                        <PrintButton onClick={handlePrint} size={18} />
                        <button onClick={onClose} className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-full transition-colors"><X size={20} /></button>
                    </div>
                </div>

                {/* Main Content: Unified Scroll Container */}
                <div id="gantt-chart-container" className="flex-1 overflow-auto custom-scrollbar relative bg-white" ref={scrollContainerRef}>

                    {/* The Layout Container */}
                    <div className="inline-block relative min-w-full" style={{ height: (processedTasks.length * ROW_HEIGHT) + HEADER_HEIGHT }}>

                        {/* --- HEADER --- */}
                        {/* Top-Left Corner (Sticky Fix) */}
                        <div
                            className="sticky top-0 left-0 z-50 h-[50px] bg-gray-50 border-r border-b border-gray-200 flex items-center shadow-[2px_2px_5px_rgba(0,0,0,0.02)]"
                            style={{ width: `${SIDEBAR_WIDTH}px` }}
                        >
                            <div className="w-[240px] px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-r border-gray-200 h-full flex items-center">
                                Actividad
                            </div>
                            <div className="w-[50px] px-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-r border-gray-200 h-full flex items-center justify-center text-center">
                                Dur.
                            </div>
                            <div className="w-[65px] px-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest border-r border-gray-200 h-full flex items-center justify-center text-center">
                                Inicio
                            </div>
                            <div className="w-[65px] px-1 text-[10px] font-bold text-gray-400 uppercase tracking-widest h-full flex items-center justify-center text-center">
                                Final
                            </div>
                        </div>

                        {/* Timeline Headers (Month/Day) - Sticky Top */}
                        <div className="sticky top-0 z-40 bg-white h-[50px] flex border-b border-gray-200" style={{ paddingLeft: `${SIDEBAR_WIDTH}px`, marginTop: '-50px', width: 'fit-content' }}>
                            <div className="flex flex-col h-full">
                                {/* Months Row */}
                                <div className="h-[24px] flex border-b border-gray-300 bg-gray-50/90 backdrop-blur-sm">
                                    {months.map((m, i) => (
                                        <div key={i} className="flex items-center px-2 border-r border-gray-300 text-[10px] font-bold text-gray-600 uppercase whitespace-nowrap overflow-hidden" style={{ width: m.width }}>
                                            {m.label}
                                        </div>
                                    ))}
                                </div>
                                {/* Days Row */}
                                <div className="h-[26px] flex bg-white">
                                    {daysArray.map((day, i) => (
                                        <div
                                            key={i}
                                            className={`flex-shrink-0 flex items-center justify-center text-[9px] border-r border-gray-100 font-medium ${isSameDay(day, new Date()) ? 'bg-red-50 text-red-600 font-bold' : 'text-gray-400'}`}
                                            style={{ width: pixelPerDay }}
                                        >
                                            {format(day, 'd')}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* --- BODY --- */}
                        {/* Task Column - Sticky Left */}
                        <div className="sticky left-0 z-30 bg-white border-r border-gray-300 shadow-[4px_0_10px_-4px_rgba(0,0,0,0.05)]" style={{ width: `${SIDEBAR_WIDTH}px`, marginTop: '0px', float: 'left', minHeight: 'calc(100% - 50px)' }}>
                            {processedTasks.map((task, index) => {
                                const startDate = parseISO(task.fecha_inicio);
                                const endDate = task.fecha_fin_estimada && isValid(parseISO(task.fecha_fin_estimada)) ? parseISO(task.fecha_fin_estimada) : startDate;
                                const duration = differenceInDays(endDate, startDate) + 1;

                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => handleTaskScroll(task.fecha_inicio)}
                                        className="h-[32px] flex items-center border-b border-gray-300 bg-white hover:bg-blue-50 transition-colors group cursor-pointer"
                                        title="Clic para ir a la tarea"
                                    >
                                        <div className="w-[240px] px-3 text-[11px] font-medium leading-none truncate group-hover:text-blue-700 border-r border-gray-100 h-full flex items-center">
                                            <span className={task.finished ? 'line-through text-gray-400' : 'text-gray-700'}>
                                                {task.task_description}
                                            </span>
                                        </div>
                                        <div className="w-[50px] px-1 text-[10px] text-gray-600 border-r border-gray-100 h-full flex items-center justify-center font-mono">
                                            {duration}d
                                        </div>
                                        <div className="w-[65px] px-1 text-[10px] text-gray-600 border-r border-gray-100 h-full flex items-center justify-center font-mono">
                                            {isValid(startDate) ? format(startDate, 'dd/MM/yy') : '-'}
                                        </div>
                                        <div className="w-[65px] px-1 text-[10px] text-gray-600 h-full flex items-center justify-center font-mono">
                                            {isValid(endDate) ? format(endDate, 'dd/MM/yy') : '-'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Bars Grid */}
                        <div className="relative z-10" style={{ paddingLeft: `${SIDEBAR_WIDTH}px`, width: 'fit-content' }}>
                            {/* Background Lines */}
                            <div className="absolute inset-0 z-0 flex pointer-events-none">
                                {daysArray.map((day, i) => (
                                    <div
                                        key={i}
                                        className={`flex-shrink-0 h-full border-r ${isMonday(day) ? 'border-gray-300' : 'border-gray-50'}`}
                                        style={{ width: pixelPerDay }}
                                    ></div>
                                ))}
                            </div>

                            {/* Today Line */}
                            <div
                                className="absolute top-0 bottom-0 w-px bg-red-400 z-0 pointer-events-none"
                                style={{ left: (differenceInDays(new Date(), timelineStart) * pixelPerDay) + (pixelPerDay / 2) + SIDEBAR_WIDTH }}
                            ></div>

                            {/* DEPENDENCY LINES (SVG Layer) */}
                            <svg className="absolute inset-0 w-full h-full z-20 pointer-events-none overflow-visible">
                                <defs>
                                    <marker id="gantt-arrowhead-unique" markerWidth="6" markerHeight="7" refX="0" refY="3.5" orient="auto">
                                        <polygon points="0 0, 6 3.5, 0 7" fill="#F97316" />
                                    </marker>
                                </defs>
                                {processedTasks.map((task, index) => {
                                    if (!task.condicionada_por) return null;

                                    // Find Parent
                                    const parentIndex = processedTasks.findIndex(t => t.id === task.condicionada_por);

                                    if (parentIndex === -1) return null;
                                    const parentTask = processedTasks[parentIndex];

                                    // Logic Coords (Child)
                                    const childStart = parseISO(task.fecha_inicio);
                                    const childLeft = differenceInDays(childStart, timelineStart) * pixelPerDay;
                                    const childY = (index * ROW_HEIGHT) + (ROW_HEIGHT / 2);

                                    // Logic Coords (Parent)
                                    const parentStart = parseISO(parentTask.fecha_inicio);
                                    const parentEnd = parentTask.fecha_fin_estimada && isValid(parseISO(parentTask.fecha_fin_estimada)) ? parseISO(parentTask.fecha_fin_estimada) : parentStart;
                                    // Add 1 day for end of bar visual
                                    const parentRight = (differenceInDays(parentEnd, timelineStart) + 1) * pixelPerDay;
                                    const parentY = (parentIndex * ROW_HEIGHT) + (ROW_HEIGHT / 2);

                                    // Draw Path (Stepped)
                                    // M = Parent Right, Parent Y
                                    // L = Mid X, Parent Y
                                    // L = Mid X, Child Y
                                    // L = Child Left, Child Y

                                    // Coords with Sidebar Offset
                                    const x1 = parentRight + SIDEBAR_WIDTH;
                                    const y1 = parentY;
                                    const x4 = childLeft + SIDEBAR_WIDTH;
                                    const y4 = childY;

                                    let path = '';
                                    if (x4 < x1) {
                                        // Overlap: Direct Vertical Drop 
                                        path = `M ${x4} ${y1} L ${x4} ${y4}`;
                                    } else {
                                        // Waterfall: Simple L-Shape (Gamma)
                                        path = `M ${x1} ${y1} L ${x4} ${y1} L ${x4} ${y4}`;
                                    }



                                    return (
                                        <path
                                            key={`dep-${task.id}`}
                                            d={path}
                                            stroke="#F97316"
                                            strokeWidth="2"
                                            fill="none"
                                            markerEnd="url(#gantt-arrowhead-unique)"
                                            opacity="1"
                                        />
                                    );
                                })}
                            </svg>

                            {/* Task Bars */}
                            {processedTasks.map((task, index) => {
                                const startDate = parseISO(task.fecha_inicio);
                                const endDate = task.fecha_fin_estimada && isValid(parseISO(task.fecha_fin_estimada)) ? parseISO(task.fecha_fin_estimada) : startDate;

                                const startOffsetDays = differenceInDays(startDate, timelineStart);
                                const durationDays = Math.max(0, differenceInDays(endDate, startDate)) + 1;

                                const left = startOffsetDays * pixelPerDay;
                                const width = Math.max(pixelPerDay, durationDays * pixelPerDay);

                                let barClass = 'bg-blue-400 border-blue-500';
                                if (task.finished) barClass = 'bg-green-400 border-green-500 opacity-80';
                                else if (task.finished === 'Pausada') barClass = 'bg-red-300 border-red-400';

                                return (
                                    <div key={task.id} className="h-[32px] border-b border-gray-300 relative flex items-center hover:bg-gray-50 transition-colors pointer-events-none">
                                        <div
                                            className={`h-[18px] rounded-sm shadow-sm border text-[9px] text-white font-bold flex items-center px-1.5 whitespace-nowrap overflow-hidden ${barClass}`}
                                            style={{ left: left, width: width, position: 'absolute' }}
                                            title={`${task.task_description} (${differenceInDays(endDate, startDate) + 1} días)`}
                                        >
                                            {width > 30 && task.task_description}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Removed as per request */}
            </div>
        </div>
    );
};

export default HouseGanttModal;
