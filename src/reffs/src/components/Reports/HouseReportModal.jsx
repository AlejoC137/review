import React, { useMemo } from 'react';
import { X, FileText, Printer, CheckCircle, Clock, Layout, PenTool, HardHat, Sparkles } from 'lucide-react';
import { format, parseISO, isValid, startOfWeek, endOfWeek, addWeeks, isWithinInterval, startOfMonth, endOfMonth, eachWeekOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { handleNativePrint } from '../../utils/printUtils';
import PrintButton from '../common/PrintButton';

const HouseReportModal = ({ isOpen, onClose, project, tasks }) => {
    if (!isOpen || !project) return null;

    // Helper to get stage info
    const getStageInfo = (task) => {
        const stageName = (task.stage?.name || task.stage_name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (stageName.includes('idea') || stageName.includes('diseno')) {
            return { label: 'Idea Básica', icon: <Sparkles size={10} />, color: 'bg-yellow-50 text-yellow-700 border-yellow-100' };
        }
        if (stageName.includes('desarrollo')) {
            return { label: 'Desarrollo Técnico', icon: <PenTool size={10} />, color: 'bg-blue-50 text-blue-700 border-blue-100' };
        }
        if (stageName.includes('muebles')) {
            return { label: 'Muebles', icon: <Layout size={10} />, color: 'bg-purple-50 text-purple-700 border-purple-100' };
        }
        return { label: 'Obra', icon: <HardHat size={10} />, color: 'bg-orange-50 text-orange-700 border-orange-100' };
    };

    const weeks = useMemo(() => {
        // 1. Focus on current month
        const now = new Date();
        const monthStart = startOfMonth(now);
        const monthEnd = endOfMonth(now);

        // 2. Generate weeks for current month
        const weekStarts = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });

        // 3. Filter and group tasks
        const validTasks = (tasks || []).map(t => {
            const endDate = t.fecha_fin_estimada && isValid(parseISO(t.fecha_fin_estimada))
                ? parseISO(t.fecha_fin_estimada)
                : (t.fecha_inicio && isValid(parseISO(t.fecha_inicio)) ? parseISO(t.fecha_inicio) : null);
            return { ...t, resolvedEndDate: endDate };
        }).filter(t => t.resolvedEndDate !== null);

        return weekStarts.map((wStart, idx) => {
            const wEnd = endOfWeek(wStart, { weekStartsOn: 1 });

            const tasksInWeek = validTasks.filter(t =>
                isWithinInterval(t.resolvedEndDate, { start: wStart, end: wEnd })
            );

            return {
                number: idx + 1,
                start: wStart,
                end: wEnd,
                tasks: tasksInWeek
            };
        });
    }, [tasks]);

    const handlePrint = () => {
        handleNativePrint('house-report-container', `Informe_${project.name}_${format(new Date(), 'yyyy-MM-dd')}`);
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2 animate-in fade-in duration-200">
            <div className="bg-white w-full max-w-7xl h-[95vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-gray-200">

                {/* Header Compact - No Print */}
                <div className="px-5 py-2 border-b border-gray-100 bg-white flex items-center justify-between flex-shrink-0 z-10 no-print">
                    <div className="flex items-center gap-2">
                        <FileText size={12} className="text-blue-600" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Informe Mensual de Entregas</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <PrintButton onClick={handlePrint} size={16} />
                        <button
                            onClick={onClose}
                            className="p-1 hover:bg-gray-100 text-gray-400 hover:text-gray-600 rounded-full transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Content - High Density */}
                <div id="house-report-container" className="flex-1 overflow-y-auto p-6 bg-gray-50/20 print:bg-white print:p-0">
                    <div className="max-w-6xl mx-auto space-y-4">

                        {/* Summary Header Refined */}
                        <div className="border-b-2 border-gray-900 pb-2 mb-6 flex justify-between items-end">
                            <div>
                                <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                                    {project.name} <span className="text-blue-600">/</span> {format(new Date(), 'MMMM yyyy', { locale: es })}
                                </h1>
                                <div className="flex gap-3 mt-1 text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                    <span>Actividades: {tasks.length}</span>
                                    <span>•</span>
                                    <span>Control de Entregas Semanales</span>
                                </div>
                            </div>
                            <div className="text-[9px] text-gray-400 font-bold uppercase text-right leading-tight">
                                Arq.tvs Proyectos<br />Documento de Control Interno
                            </div>
                        </div>

                        {weeks.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                                <FileText size={32} className="mx-auto text-gray-200 mb-2" />
                                <p className="text-xs text-gray-500 font-medium">No hay actividades programadas para este mes.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {weeks.map((week) => (
                                    <div key={week.number} className="flex gap-4">
                                        {/* Week Label Sidebar Compact */}
                                        <div className="w-20 flex-shrink-0">
                                            <div className="bg-blue-600 text-white px-2 py-1.5 rounded-lg shadow-sm text-center">
                                                <span className="block text-[8px] uppercase font-black tracking-tight opacity-80">Sem</span>
                                                <span className="block text-xl font-black leading-none">{week.number}</span>
                                            </div>
                                            <div className="mt-1 text-[8px] text-gray-400 font-bold text-center uppercase leading-tight">
                                                {format(week.start, 'dd MMM', { locale: es })}<br />{format(week.end, 'dd MMM', { locale: es })}
                                            </div>
                                        </div>

                                        {/* Tasks List Dense */}
                                        <div className="flex-1 bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:border-blue-100 transition-colors">
                                            <div className="flex justify-between items-center mb-3 pb-1.5 border-b border-gray-50">
                                                <h3 className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Pendientes de entrega</h3>
                                                <span className="bg-gray-50 text-gray-500 text-[8px] font-bold px-1.5 py-0.5 rounded border border-gray-100">
                                                    {week.tasks.length} {week.tasks.length === 1 ? 'ACT.' : 'ACTS.'}
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-2">
                                                {week.tasks.length === 0 ? (
                                                    <span className="text-[10px] text-gray-300 italic">Sin entregas programadas</span>
                                                ) : (
                                                    week.tasks.map((task) => {
                                                        const stage = getStageInfo(task);
                                                        return (
                                                            <div key={task.id} className="flex items-start gap-2 py-1 border-b border-gray-50/50 last:border-0">
                                                                <div className="mt-0.5 flex-shrink-0">
                                                                    {task.finished ? (
                                                                        <CheckCircle size={10} className="text-green-500" />
                                                                    ) : (
                                                                        <div className="w-2.5 h-2.5 rounded-full border border-blue-400" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-[11px] font-bold text-gray-800 leading-tight truncate-2-lines mb-1 ${task.finished ? 'line-through text-gray-400' : ''}`}>
                                                                        {task.task_description}
                                                                    </p>
                                                                    <div className="flex items-center flex-wrap gap-1.5">
                                                                        <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border flex items-center gap-1 uppercase ${stage.color}`}>
                                                                            {stage.icon} {stage.label}
                                                                        </span>
                                                                        <span className="text-[8px] font-bold text-gray-400 uppercase flex items-center gap-0.5">
                                                                            <Clock size={8} /> {format(task.resolvedEndDate, 'eee dd', { locale: es })}
                                                                        </span>
                                                                        {task.staff?.name && (
                                                                            <span className="text-[8px] font-bold text-blue-500/70 uppercase">
                                                                                • {task.staff.name.split(' ')[0]}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Dense */}
                <div className="px-5 py-2 bg-gray-50 border-t border-gray-100 text-[8px] text-gray-400 font-bold uppercase tracking-widest flex justify-between items-center no-print">
                    <span>Generado: {format(new Date(), 'dd/MM/yyyy HH:mm')}</span>
                    <span>Arq.tvs Proyectos • Control de Entregas</span>
                </div>
            </div>

            <style>{`
                .truncate-2-lines {
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    #house-report-container, #house-report-container * {
                        visibility: visible;
                    }
                    #house-report-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white !important;
                        padding: 0 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                }
            `}</style>
        </div>
    );
};

export default HouseReportModal;
