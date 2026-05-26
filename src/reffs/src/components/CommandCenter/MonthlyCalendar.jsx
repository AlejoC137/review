import React, { useState, useMemo, useRef } from 'react';
import { handleNativePrint } from '../../utils/printUtils';
import { useDispatch, useSelector } from 'react-redux';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    parseISO,
    isSameDay
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Layers, Plus } from 'lucide-react';
import { setSelectedTask, clearSelection, initCreateTask } from '../../store/actions/appActions';
import { getTasks, getProjects, getStages } from '../../services/tasksService';
import { getStaffers } from '../../services/spacesService';
import { getProjectColor } from '../../utils/projectColors';
import CalendarFilterBar from './CalendarFilterBar';
import PrintButton from '../common/PrintButton';

const TaskEventCard = ({ task, type, onClick }) => {
    const colors = getProjectColor(task.proyecto?.id || 'default');
    return (
        <div
            onClick={(e) => { e.stopPropagation(); onClick(task); }}
            className={`
                px-1.5 py-1 text-[10px] rounded border border-l-4 mb-0.5 cursor-pointer
                hover:shadow-md transition-all shadow-sm
                bg-white border-gray-100
                ${type === 'start' ? 'border-l-green-500' : 'border-l-red-500'}
            `}
            style={{ borderLeftColor: type === 'start' ? '#22c55e' : '#ef4444' }}
        >
            <div className="flex items-center justify-between gap-1">
                <span className="font-bold text-gray-700 truncate">{task.task_description}</span>
                <span className={`text-[8px] font-extrabold px-1 rounded text-white ${type === 'start' ? 'bg-green-500' : 'bg-red-500'}`}>
                    {type === 'start' ? 'INICIO' : 'FINAL'}
                </span>
            </div>
            <div className="text-[8px] text-gray-400 truncate mt-0.5">
                {task.proyecto?.name}
            </div>
        </div>
    );
};

const MonthlyCalendar = () => {
    const dispatch = useDispatch();
    const [currentDate, setCurrentDate] = useState(new Date());
    const { selectedTask, panelMode, refreshCounter } = useSelector(state => state.app);

    // Get all days to display (including padding days from prev/next month)
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

    const [tasks, setTasks] = useState([]);
    const [staffers, setStaffers] = useState([]);
    const [projects, setProjects] = useState([]);
    const [stages, setStages] = useState([]);
    const [filters, setFilters] = useState({
        staffId: '',
        projectId: '',
        stageId: '',
        alejoPass: false,
        ronaldPass: false,
        wietPass: false,
        showConstruction: false // Default: Only show Idea, Dev, Muebles
    });

    // Layout and panel are now managed by MainContainer

    // Load tasks & metadata
    React.useEffect(() => {
        const loadJava = async () => {
            const [allTasks, allStaff, allProjects, allStages] = await Promise.all([
                getTasks(),
                getStaffers(),
                getProjects(),
                getStages()
            ]);
            setTasks(allTasks || []);
            setStaffers(allStaff || []);
            setProjects(allProjects || []);
            setStages(allStages || []);
        };
        loadJava();
    }, [currentDate, refreshCounter]);

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleClearFilters = () => {
        setFilters({
            staffId: '',
            projectId: '',
            stageId: '',
            alejoPass: false,
            ronaldPass: false,
            wietPass: false,
            showConstruction: false
        });
    };

    // Derived: Tasks events per day
    // We iterate days and find tasks.
    // Optimization: Create a map date -> events
    const eventsByDate = useMemo(() => {
        const map = {};

        // FILTER TASKS
        const filteredTasks = tasks.filter(t => {
            // Responsible Filter
            if (filters.staffId && t.staff_id != filters.staffId && t.asignado_a != filters.staffId) return false;
            // Project Filter
            if (filters.projectId && t.proyecto_id != filters.projectId && t.proyecto?.id != filters.projectId) return false;
            // Stage Filter
            if (filters.alejoPass && !t.AlejoPass) return false;
            if (filters.ronaldPass && !t.RonaldPass) return false;
            if (filters.wietPass && !t.WietPass) return false;

            // Construction Mode Filter (Mutually Exclusive)
            // Robust matching: Normalize string and check for keywords
            const stageName = (t.stage?.name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            const isDesignStage =
                stageName.includes('idea') ||
                stageName.includes('desarrollo') ||
                stageName.includes('muebles');

            if (filters.showConstruction) {
                // If Construction Mode is ON -> Hide Design Stages
                if (isDesignStage) return false;
            } else {
                // If Construction Mode is OFF -> Hide Non-Design (Construction) Stages
                if (!isDesignStage) return false;
            }
            // Note: specific stageId is ignored

            return true;
        });

        filteredTasks.forEach(task => {
            if (task.fecha_inicio) {
                const start = task.fecha_inicio.split('T')[0]; // Simple ISO date string
                if (!map[start]) map[start] = [];
                map[start].push({ type: 'start', task });
            }
            if (task.fecha_fin_estimada) {
                const end = task.fecha_fin_estimada.split('T')[0];
                if (!map[end]) map[end] = [];
                // Avoid Duplicate if start == end? The user said "INICIO" and "FINAL". 
                // If same day, maybe show both stacked or merged?
                // Visual preference: Show both lines so user sees it starts and ends.
                map[end].push({ type: 'end', task });
            }
        });
        return map;
    }, [tasks, filters]);

    const handleTaskClick = (task) => {
        dispatch(setSelectedTask(task));
    };

    const handleActionUpdated = () => {
        // Reload tasks?
        getTasks().then(setTasks);
    };

    const handleDayClick = (day) => {
        console.log('Day clicked:', format(day, 'yyyy-MM-dd'));
        // TODO: Show day details or create task
    };

    const handlePrevMonth = () => {
        setCurrentDate(subMonths(currentDate, 1));
    };

    const handleNextMonth = () => {
        setCurrentDate(addMonths(currentDate, 1));
    };

    const handleToday = () => {
        setCurrentDate(new Date());
    };

    const printRef = useRef(null);

    const handlePrint = () => {
        handleNativePrint('monthly-calendar-print-view', `Calendario_Mensual_${format(currentDate, 'yyyy-MM')}`);
    };

    return (
        <div id="monthly-calendar-print-view" ref={printRef} className="h-full flex flex-col bg-white print-container">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 print:border-none z-10">
                <div className="flex items-center gap-6">
                    <h2 className="text-xl font-bold text-gray-900 print:text-black whitespace-nowrap">
                        {format(currentDate, 'MMMM yyyy', { locale: es }).toUpperCase()}
                    </h2>

                    {/* Filters Relocated to Header */}
                    <div className="no-print">
                        <CalendarFilterBar
                            staffers={staffers}
                            projects={projects}
                            stages={stages}
                            filters={filters}
                            onFilterChange={handleFilterChange}
                            onClear={handleClearFilters}
                            showStageFilter={false} // Hidden to enforce grouped view via Toggle
                        />
                    </div>
                </div>

                <div className="flex items-center gap-3 no-print">
                    <PrintButton
                        onClick={handlePrint}
                    />
                    <div className="flex bg-gray-100 rounded-lg p-0.5">
                        <button
                            onClick={handlePrevMonth}
                            className="p-1 hover:bg-white rounded-md shadow-sm transition-all"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={handleToday}
                            className="px-3 text-xs font-medium hover:bg-white rounded-md transition-all"
                        >
                            Hoy
                        </button>
                        <button
                            onClick={handleNextMonth}
                            className="p-1 hover:bg-white rounded-md shadow-sm transition-all"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>


            {/* Filters Relocated - Removed */}

            {/* Calendar Grid */}
            <div className="flex-1 overflow-auto">
                {/* Weekday Headers */}
                <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((day) => (
                        <div key={day} className="py-2 text-center text-xs font-bold text-gray-600 uppercase">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 auto-rows-fr">
                    {days.map((day, idx) => {
                        const isCurrentMonth = isSameMonth(day, currentDate);
                        const isCurrentDay = isToday(day);
                        const dayNumber = format(day, 'd');

                        // Check if day is within selectedTask range
                        let isTaskInRange = false;
                        if (selectedTask?.fecha_inicio && selectedTask?.fecha_fin_estimada) {
                            const dayStr = format(day, 'yyyy-MM-dd');
                            const startStr = selectedTask.fecha_inicio.split('T')[0];
                            const endStr = selectedTask.fecha_fin_estimada.split('T')[0];
                            if (dayStr >= startStr && dayStr <= endStr) {
                                isTaskInRange = true;
                            }
                        }

                        return (
                            <div
                                key={idx}
                                onClick={() => handleDayClick(day)}
                                className={`
                                    min-h-[80px] border-r border-b border-gray-200 p-2 cursor-pointer
                                    hover:bg-blue-50 transition-colors group relative
                                    ${isTaskInRange ? 'bg-blue-100' : (!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white')}
                                    ${isCurrentDay && !isTaskInRange ? 'bg-blue-50/50' : ''}
                                `}
                            >
                                {/* Day Number */}
                                <div className={`
                                    text-sm font-bold mb-1
                                    ${isCurrentDay ? 'text-blue-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                                `}>
                                    {dayNumber}
                                </div>

                                {/* Add Task Button (Visible on Hover) */}
                                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            dispatch(initCreateTask({
                                                task_description: '',
                                                fecha_inicio: format(day, 'yyyy-MM-dd'),
                                                fecha_fin_estimada: format(day, 'yyyy-MM-dd'),
                                                proyecto_id: null,
                                                espacio_uuid: null,
                                            }));
                                        }}
                                        className="w-5 h-5 flex items-center justify-center bg-blue-600 text-white rounded shadow-sm hover:scale-110 transition-transform"
                                        title="Agregar Tarea"
                                    >
                                        <Plus size={12} strokeWidth={3} />
                                    </button>
                                </div>

                                {/* Tasks/Actions for this day - Scrollable Container */}
                                <div className="max-h-[80px] overflow-y-auto pr-0.5 space-y-0.5 custom-scrollbar">
                                    {(() => {
                                        const dateKey = format(day, 'yyyy-MM-dd');
                                        const dayEvents = eventsByDate[dateKey] || [];
                                        return dayEvents.map((evt, i) => (
                                            <TaskEventCard
                                                key={`${evt.task.id}_${evt.type}_${i}`}
                                                task={evt.task}
                                                type={evt.type}
                                                onClick={handleTaskClick}
                                            />
                                        ));
                                    })()}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div >
    );
};

export default MonthlyCalendar;
