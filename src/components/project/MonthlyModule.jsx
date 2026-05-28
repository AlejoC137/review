import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { openInspector } from '../../store/uiSlice';
import { parseISO, startOfDay, format, isSameDay, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Loader2, User } from 'lucide-react';
import { projectService } from '../../services/projectService';

export default function MonthlyModule({ project, onTabChange }) {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSubProjectId, setSelectedSubProjectId] = useState('all');
  const [subProjects, setSubProjects] = useState([]);
  const [hoveredTaskId, setHoveredTaskId] = useState(null);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

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
      console.error("Error loading monthly tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const getTasksForDay = (day) => {
    if (!day) return [];
    const current = startOfDay(new Date(year, month, day));

    return tasks.filter(task => {
      if (!task.fecha_inicio) return false;
      if (selectedSubProjectId !== 'all' && task.subproject_id !== selectedSubProjectId) return false;

      const start = startOfDay(parseISO(task.fecha_inicio));
      const end = task.fecha_fin_estimada ? startOfDay(parseISO(task.fecha_fin_estimada)) : start;

      return current >= start && current <= end;
    });
  };

  const handleTaskClick = (task) => {
    dispatch(openInspector({ item: task, type: 'TASK' }));
  };

  const handleDayClick = (day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    dispatch(openInspector({
      item: {
        id: 'new',
        name: `NUEVA_TAREA_${day}${month + 1}`,
        description: '',
        fecha_inicio: dateStr,
        fecha_fin_estimada: dateStr,
        finished: false,
        priority: 'NORMAL',
        project_id: project.id,
        subproject_id: selectedSubProjectId !== 'all' ? selectedSubProjectId : ''
      },
      type: 'TASK'
    }));
  };

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));

  // Calendar logic
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let i = 1; i <= daysInMonth; i++) calendarDays.push(i);
  const totalSlots = 42 - calendarDays.length;
  for (let i = 0; i < totalSlots; i++) calendarDays.push(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const visibleTasks = useMemo(() => {
    return tasks.filter(t => {
      const start = parseISO(t.fecha_inicio);
      const end = t.fecha_fin_estimada ? parseISO(t.fecha_fin_estimada) : start;
      const overlapsMonth = (start <= monthEnd && end >= monthStart);
      const matchesProject = selectedSubProjectId === 'all' || t.subproject_id === selectedSubProjectId;
      return overlapsMonth && matchesProject;
    });
  }, [tasks, monthStart, monthEnd, selectedSubProjectId]);

  return (
    <div className="flex flex-col h-full bg-white border-2 border-[#1c1c19] overflow-hidden">
      {/* Header Controls */}
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
                {format(currentDate, 'MMMM yyyy', { locale: es })}
              </h2>
            </div>
          </div>

          <div className="h-8 border-l-2 border-[#1c1c19]/10 mx-2" />

          <select
            value={selectedSubProjectId}
            onChange={(e) => setSelectedSubProjectId(e.target.value)}
            className="bg-[#fcf9f4] border-2 border-[#1c1c19] px-3 py-1 text-[10px] font-black uppercase italic outline-none focus:bg-white transition-all shadow-[4px_4px_0_0_rgba(0,0,0,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0"
          >
            <option value="all">TODOS_LOS_ESPACIOS</option>
            {subProjects.map(sp => (
              <option key={sp.id} value={sp.id}>{sp.name}</option>
            ))}
          </select>

          <div className="flex items-center gap-1 bg-white border-2 border-[#1c1c19] p-1 ml-2">
            <button onClick={prevMonth} className="p-1 hover:bg-[#f6f3ee] transition-all"><ChevronLeft size={16} /></button>
            <button onClick={nextMonth} className="p-1 hover:bg-[#f6f3ee] transition-all"><ChevronRight size={16} /></button>
          </div>

          <div className="flex bg-white border-2 border-[#1c1c19] p-0.5">
            <button className="px-4 py-1 bg-[#1c1c19] text-white text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0_0_rgba(15,67,105,0.5)]">Mes</button>
            <button
              onClick={() => onTabChange('semanal')}
              className="px-4 py-1 hover:bg-[#f6f3ee] text-[9px] font-black uppercase tracking-widest transition-all"
            >
              Semana
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {loading && <Loader2 className="animate-spin text-[#0f4369]" size={16} />}
          <button 
            onClick={() => setSearchParams({ tab: 'datos', subtab: 'cronograma' })}
            className="px-4 py-2.5 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-black text-[10px] uppercase shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
          >
            CRONOGRAMA ENTREGAS
          </button>
          <button className="px-6 py-2.5 bg-[#1c1c19] text-white font-black text-[10px] uppercase shadow-[6px_6px_0_0_rgba(15,67,105,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all">
            REPORTE_MENSUAL
          </button>
        </div>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="grid grid-cols-7 border-b-2 border-[#1c1c19] bg-white">
          {['DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'].map(d => (
            <div key={d} className="p-3 text-[9px] font-black text-center border-r-2 border-[#1c1c19] last:border-r-0 text-[#72777f] tracking-widest">
              {d}
            </div>
          ))}
        </div>

        <div className="flex-1 grid grid-cols-7 auto-rows-fr bg-[#f6f3ee]/30 overflow-y-auto">
          {calendarDays.map((day, i) => {
            const isTodayDay = day === new Date().getDate() && month === new Date().getMonth() && year === new Date().getFullYear();

            return (
              <div
                key={i}
                onClick={() => day && handleDayClick(day)}
                className={`
                    border-r-2 border-b-2 border-[#1c1c19]/10 transition-all relative group
                    ${day ? 'bg-white cursor-pointer hover:bg-[#fcf9f4]' : 'bg-[#f6f3ee]/50'}
                    ${isTodayDay ? 'ring-2 ring-inset ring-[#0f4369]/20' : ''}
                `}
              >
                {day && (
                  <div className="h-full flex flex-col p-2">
                    <div className="flex justify-between items-start mb-2 px-2">
                      <span className={`text-[11px] font-black font-mono ${isTodayDay ? 'bg-[#0f4369] text-white px-1.5 py-0.5' : 'text-[#72777f]'}`}>
                        {day < 10 ? `0${day}` : day}
                      </span>
                      {isTodayDay && <span className="text-[7px] font-black text-[#0f4369] uppercase italic tracking-widest">HOY</span>}
                    </div>

                    <div className="absolute top-[34px] left-0 right-0 flex flex-col py-1">
                      {visibleTasks.map((t, idx) => {
                        const start = startOfDay(parseISO(t.fecha_inicio));
                        const end = t.fecha_fin_estimada ? startOfDay(parseISO(t.fecha_fin_estimada)) : start;
                        const current = startOfDay(new Date(year, month, day));
                        
                        const isVisible = current >= start && current <= end;
                        
                        return (
                          <div 
                            key={t.id} 
                            className="h-6 w-full relative group/task"
                            onMouseEnter={() => isVisible && setHoveredTaskId(t.id)}
                            onMouseLeave={() => setHoveredTaskId(null)}
                            onClick={(e) => { if(isVisible) { e.stopPropagation(); handleTaskClick(t); } }}
                          >
                            {isVisible && (
                              <div className={`absolute inset-0 flex items-center transition-all ${t.finished ? 'opacity-30' : 'opacity-100'}`}>
                                <div 
                                  className={`absolute h-[3px] transition-all duration-200 ${hoveredTaskId === t.id ? 'h-[6px] opacity-100' : 'opacity-40'}`}
                                  style={{ 
                                    left: isSameDay(current, start) ? '12px' : '0',
                                    right: isSameDay(current, end) ? '12px' : '0',
                                    backgroundColor: getStaffColor(t),
                                    top: '50%',
                                    transform: 'translateY(-50%)'
                                  }}
                                />
                                {isSameDay(current, start) && (
                                  <div 
                                    className="absolute left-[8px] w-2.5 h-2.5 rounded-full border-2 border-[#1c1c19] z-10" 
                                    style={{ backgroundColor: getStaffColor(t), top: '50%', transform: 'translateY(-50%)' }} 
                                  />
                                )}
                                {isSameDay(current, end) && (
                                  <div 
                                    className="absolute right-[8px] w-2.5 h-2.5 rounded-full border-2 border-[#1c1c19] z-10" 
                                    style={{ backgroundColor: getStaffColor(t), top: '50%', transform: 'translateY(-50%)' }} 
                                  />
                                )}
                                {isSameDay(current, start) && (
                                  <div 
                                    className="absolute left-8 truncate text-[11px] font-black tracking-tighter bg-white/90 px-1 border border-[#1c1c19]/5 z-10 pointer-events-none whitespace-nowrap max-w-[200px]"
                                    style={{ top: '50%', transform: 'translateY(-50%)' }}
                                  >
                                    {t.name || t.description}
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
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
