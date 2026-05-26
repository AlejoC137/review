import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Filter, Plus, Loader2 } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { useDispatch } from 'react-redux';
import { openInspector } from '../../store/uiSlice';
import { format, addDays, startOfWeek, isSameDay, isToday, parseISO, startOfDay } from 'date-fns';

export default function CalendarModule({ project, onTabChange }) {
  const dispatch = useDispatch();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [subProjects, setSubProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredTaskId, setHoveredTaskId] = useState(null);

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  const weekEnd = addDays(weekStart, 6);

  const visibleTasks = useMemo(() => {
    return tasks.filter(t => {
      const start = parseISO(t.fecha_inicio);
      const end = t.fecha_fin_estimada ? parseISO(t.fecha_fin_estimada) : start;
      return (start <= weekEnd && end >= weekStart);
    });
  }, [tasks, weekStart, weekEnd]);

  useEffect(() => {
    loadData();
    const handleUpdate = () => loadData();
    window.addEventListener('taskUpdated', handleUpdate);
    return () => window.removeEventListener('taskUpdated', handleUpdate);
  }, [currentDate, project?.id]);

  const STAFF_COLORS = [
    '#FF5F5F', // Red
    '#FF9F43', // Orange
    '#FFD93D', // Yellow
    '#6BCB77', // Green
    '#4D96FF', // Blue
    '#B983FF', // Purple
    '#FF6FB5', // Pink
    '#48CAE4', // Cyan
  ];

  const getStaffColor = (task) => {
    if (task.staff?.color) return task.staff.color;
    if (!task.staff_id) return '#1c1c19';
    const cleanId = String(task.staff_id).replace(/[^0-9a-f]/gi, '');
    const hash = cleanId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return STAFF_COLORS[hash % STAFF_COLORS.length];
  };

  const loadData = async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const [tasksData, spData] = await Promise.all([
        projectService.getTasks(project.id),
        projectService.getSpaces()
      ]);
      setTasks(tasksData || []);
      setSubProjects(spData || []);
    } catch (error) {
      console.error("Error loading weekly calendar data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskClick = (task) => {
    dispatch(openInspector({ item: task, type: 'TASK' }));
  };

  const handleDayClick = (day, subProjectId) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    dispatch(openInspector({
      item: {
        id: 'new',
        description: `NUEVA_TAREA_${format(day, 'ddMM')}`,
        name: `NUEVA_TAREA_${format(day, 'ddMM')}`,
        fecha_inicio: dateStr,
        fecha_fin_estimada: dateStr,
        finished: false,
        priority: 'NORMAL',
        project_id: project.id,
        subproject_id: subProjectId || ''
      },
      type: 'TASK'
    }));
  };

  return (
    <div className="flex flex-col h-full bg-white border-2 border-[#1c1c19] overflow-hidden">
      {/* Header controls */}
      <div className="p-4 border-b-2 border-[#1c1c19] flex justify-between items-center bg-[#f6f3ee] z-20">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#1c1c19] text-white">
              <CalendarIcon size={20} />
            </div>
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-[#72777f] uppercase tracking-[0.3em] mb-0.5 opacity-50 italic">
                {project?.name?.toUpperCase() || 'PROJECT_ROOT'}
              </span>
              <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
                {format(weekStart, 'MMMM yyyy')}
              </h2>
            </div>
          </div>

          <div className="h-8 border-l-2 border-[#1c1c19]/10 mx-2" />

          <div className="flex items-center gap-1 bg-white border-2 border-[#1c1c19] p-1">
            <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1 hover:bg-[#f6f3ee] transition-all"><ChevronLeft size={16} /></button>
            <button onClick={() => setCurrentDate(new Date())} className="px-3 text-[9px] font-black uppercase hover:bg-[#f6f3ee] transition-all">Hoy</button>
            <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1 hover:bg-[#f6f3ee] transition-all"><ChevronRight size={16} /></button>
          </div>

          <div className="flex bg-white border-2 border-[#1c1c19] p-0.5">
            <button
              onClick={() => onTabChange('mes')}
              className="px-4 py-1 hover:bg-[#f6f3ee] text-[9px] font-black uppercase tracking-widest transition-all"
            >
              Mes
            </button>
            <button className="px-4 py-1 bg-[#1c1c19] text-white text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_rgba(15,67,105,0.5)]">
              Semana
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loading && <Loader2 className="animate-spin text-[#0f4369]" size={16} />}
          <button 
            onClick={() => handleDayClick(new Date())}
            className="px-6 py-2.5 bg-[#1c1c19] text-white font-black text-[10px] uppercase shadow-[6px_6px_0_0_rgba(15,67,105,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            NUEVA TAREA
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 overflow-auto bg-white relative">
        <div className="min-w-[1000px] h-full flex flex-col">
            {/* Days Header */}
            <div className="flex border-b-2 border-[#1c1c19] bg-white sticky top-0 z-20">
                <div className="w-48 shrink-0 border-r-2 border-[#1c1c19] p-3 text-[9px] font-black uppercase tracking-widest text-[#72777f] bg-[#f6f3ee]">
                    Sub-Proyectos / Unidades
                </div>
                <div className="flex-1 grid grid-cols-7 divide-x-2 divide-[#1c1c19]/10">
                    {weekDays.map(day => (
                        <div key={day.toString()} className={`p-3 text-center transition-colors ${isToday(day) ? 'bg-[#0f4369]/5' : ''}`}>
                            <div className={`text-[10px] font-black uppercase ${isToday(day) ? 'text-[#0f4369]' : 'text-[#72777f]'}`}>
                                {format(day, 'eee d')}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Rows by SubProject */}
            <div className="flex-1 divide-y-2 divide-[#1c1c19]/10">
                {subProjects.map(sp => (
                    <div key={sp.id} className="flex min-h-[80px] group hover:bg-[#fcf9f4] transition-colors">
                        <div className="w-48 shrink-0 border-r-2 border-[#1c1c19] p-4 bg-[#f6f3ee]/30 flex flex-col justify-center">
                            <span className="text-[10px] font-black uppercase italic tracking-tight">{sp.name}</span>
                            <span className="text-[7px] font-bold text-[#72777f] uppercase mt-1">{sp.responsable || 'SIN_ASIGNAR'}</span>
                        </div>
                        <div className="flex-1 grid grid-cols-7 divide-x-2 divide-[#1c1c19]/5 relative">
                            {weekDays.map((day, idx) => {
                                return (
                                    <div 
                                        key={idx} 
                                        className="py-1 px-0 relative flex flex-col min-h-[100px]"
                                        onClick={() => handleDayClick(day, sp.id)}
                                    >
                                        <div className="absolute top-0 left-0 right-0 flex flex-col py-1">
                                            {visibleTasks.filter(t => t.subproject_id === sp.id).map((task) => {
                                                const start = startOfDay(parseISO(task.fecha_inicio));
                                                const end = task.fecha_fin_estimada ? startOfDay(parseISO(task.fecha_fin_estimada)) : start;
                                                const current = startOfDay(day);
                                                
                                                const isVisible = current >= start && current <= end;

                                                return (
                                                    <div
                                                        key={task.id}
                                                        className="h-6 w-full relative group/task"
                                                        onMouseEnter={() => isVisible && setHoveredTaskId(task.id)}
                                                        onMouseLeave={() => setHoveredTaskId(null)}
                                                        onClick={(e) => { if(isVisible) { e.stopPropagation(); handleTaskClick(task); } }}
                                                    >
                                                        {isVisible && (
                                                          <div className={`absolute inset-0 flex items-center transition-all ${task.finished ? 'opacity-30' : 'opacity-100'}`}>
                                                            <div 
                                                              className={`absolute h-[3px] transition-all duration-200 ${hoveredTaskId === task.id ? 'h-[6px] opacity-100' : 'opacity-40'}`}
                                                              style={{ 
                                                                left: isSameDay(current, start) ? '12px' : '0',
                                                                right: isSameDay(current, end) ? '12px' : '0',
                                                                backgroundColor: getStaffColor(task),
                                                                top: '50%',
                                                                transform: 'translateY(-50%)'
                                                              }}
                                                            />
                                                            {isSameDay(current, start) && (
                                                              <div 
                                                                className="absolute left-[8px] w-2.5 h-2.5 rounded-full border-2 border-[#1c1c19] z-10" 
                                                                style={{ backgroundColor: getStaffColor(task), top: '50%', transform: 'translateY(-50%)' }} 
                                                              />
                                                            )}
                                                            {isSameDay(current, end) && (
                                                              <div 
                                                                className="absolute right-[8px] w-2.5 h-2.5 rounded-full border-2 border-[#1c1c19] z-10" 
                                                                style={{ backgroundColor: getStaffColor(task), top: '50%', transform: 'translateY(-50%)' }} 
                                                              />
                                                            )}
                                                            {isSameDay(current, start) && (
                                                              <div 
                                                                className="absolute left-8 truncate text-[11px] font-black tracking-tighter bg-white/90 px-1 border border-[#1c1c19]/5 z-10 pointer-events-none whitespace-nowrap max-w-[150px]"
                                                                style={{ top: '50%', transform: 'translateY(-50%)' }}
                                                              >
                                                                {task.name || task.description}
                                                              </div>
                                                            )}
                                                          </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                        <button className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 p-1 bg-[#1c1c19] text-white rounded-sm transition-opacity">
                                            <Plus size={10} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
}
