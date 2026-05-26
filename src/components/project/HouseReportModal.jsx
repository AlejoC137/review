import React, { useMemo } from 'react';
import { X, FileText, CheckCircle, Clock, Layout, PenTool, HardHat, Sparkles } from 'lucide-react';

const HouseReportModal = ({ isOpen, onClose, project, tasks }) => {
    if (!isOpen || !project) return null;

    // Helper: format date as "Lun 12"
    const formatDay = (date) => {
        const d = new Date(date);
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        return `${days[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}`;
    };

    const getStageInfo = (task) => {
        const stageName = (task.stage?.name || task.stage_name || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        if (stageName.includes('idea') || stageName.includes('diseno')) {
            return { label: 'Idea Básica', icon: <Sparkles size={10} />, color: 'bg-yellow-100 text-yellow-800 border-yellow-300' };
        }
        if (stageName.includes('desarrollo')) {
            return { label: 'Técnico', icon: <PenTool size={10} />, color: 'bg-blue-100 text-blue-800 border-blue-300' };
        }
        if (stageName.includes('muebles')) {
            return { label: 'Muebles', icon: <Layout size={10} />, color: 'bg-purple-100 text-purple-800 border-purple-300' };
        }
        return { label: 'Obra', icon: <HardHat size={10} />, color: 'bg-orange-100 text-orange-800 border-orange-300' };
    };

    const weeks = useMemo(() => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const weekStarts = [];
        let curr = new Date(start);
        // Find first Monday
        while (curr.getDay() !== 1) curr.setDate(curr.getDate() - 1);
        
        while (curr <= end) {
            weekStarts.push(new Date(curr));
            curr.setDate(curr.getDate() + 7);
        }

        return weekStarts.map((wStart, idx) => {
            const wEnd = new Date(wStart);
            wEnd.setDate(wEnd.getDate() + 6);

            const tasksInWeek = tasks.filter(t => {
                const date = t.fecha_fin_estimada ? new Date(t.fecha_fin_estimada) : (t.fecha_inicio ? new Date(t.fecha_inicio) : null);
                return date && date >= wStart && date <= wEnd;
            });

            return {
                number: idx + 1,
                start: wStart,
                end: wEnd,
                tasks: tasksInWeek
            };
        });
    }, [tasks]);

    const currentMonthLabel = new Date().toLocaleString('es', { month: 'long', year: 'numeric' });

    return (
        <div className="fixed inset-0 bg-[#1c1c19]/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-7xl h-[95vh] border-4 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(0,0,0,1)] flex flex-col overflow-hidden">
                
                {/* Header - No Print */}
                <div className="px-6 py-3 border-b-4 border-[#1c1c19] bg-[#f6f3ee] flex items-center justify-between flex-shrink-0 z-10 no-print">
                    <div className="flex items-center gap-3">
                        <FileText size={20} className="text-[#0f4369]" strokeWidth={3} />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-[#1c1c19]">Informe Mensual de Control</span>
                    </div>
                    <button onClick={onClose} className="p-2 bg-white border-2 border-[#1c1c19] hover:bg-red-500 hover:text-white transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none">
                        <X size={20} strokeWidth={3} />
                    </button>
                </div>

                {/* Content */}
                <div id="house-report-container" className="flex-1 overflow-y-auto p-12 bg-white print:p-0">
                    <div className="max-w-5xl mx-auto space-y-12">
                        
                        {/* Summary Header */}
                        <div className="border-b-8 border-[#1c1c19] pb-4 mb-12 flex justify-between items-end">
                            <div>
                                <h1 className="text-5xl font-black italic uppercase tracking-tighter leading-none mb-2">
                                    {project.name} <span className="text-[#0f4369]">/</span> <span className="opacity-40">{currentMonthLabel}</span>
                                </h1>
                                <div className="flex gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-[#72777f]">
                                    <span>Plan de Entregas Semanales</span>
                                    <span>•</span>
                                    <span>{tasks.length} Hitos Programados</span>
                                </div>
                            </div>
                            <div className="text-[10px] font-black uppercase text-right leading-relaxed italic opacity-60">
                                ARQ.TVS_CORE_ENGINE<br />INTERNAL_PROTOCOL_DOC
                            </div>
                        </div>

                        {weeks.length === 0 ? (
                            <div className="text-center py-20 border-4 border-dashed border-gray-100 italic opacity-30 uppercase font-black tracking-widest text-lg">
                                No se registran hitos para el periodo actual
                            </div>
                        ) : (
                            <div className="space-y-10">
                                {weeks.map((week) => (
                                    <div key={week.number} className="flex gap-8">
                                        {/* Week Marker */}
                                        <div className="w-24 flex-shrink-0">
                                            <div className="bg-[#1c1c19] text-white p-4 shadow-[6px_6px_0_0_rgba(15,67,105,1)]">
                                                <span className="block text-[8px] font-black uppercase opacity-60 mb-1">Semana</span>
                                                <span className="block text-4xl font-black italic leading-none">{week.number}</span>
                                            </div>
                                            <div className="mt-3 text-[9px] font-black text-[#72777f] text-center uppercase tracking-tighter leading-tight italic">
                                                {week.start.getDate()} {week.start.toLocaleString('es', { month: 'short' })}<br/>
                                                <span className="opacity-30">AL</span><br/>
                                                {week.end.getDate()} {week.end.toLocaleString('es', { month: 'short' })}
                                            </div>
                                        </div>

                                        {/* Tasks Area */}
                                        <div className="flex-1 bg-[#fcf9f4] border-2 border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(0,0,0,0.05)]">
                                            <div className="flex justify-between items-center mb-6 border-b-2 border-[#1c1c19]/10 pb-2">
                                                <h3 className="text-[10px] font-black text-[#1c1c19] uppercase tracking-widest italic opacity-50">Entregables y Avances</h3>
                                                <span className="text-[10px] font-black bg-white border border-[#1c1c19] px-3 py-0.5 rounded-full">
                                                    {week.tasks.length} HITOS
                                                </span>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-4">
                                                {week.tasks.length === 0 ? (
                                                    <span className="text-[10px] font-black uppercase italic opacity-20">Periodo sin entregas</span>
                                                ) : (
                                                    week.tasks.map((task) => {
                                                        const stage = getStageInfo(task);
                                                        const date = task.fecha_fin_estimada ? new Date(task.fecha_fin_estimada) : (task.fecha_inicio ? new Date(task.fecha_inicio) : null);
                                                        
                                                        return (
                                                            <div key={task.id} className="flex items-start gap-3 py-2 border-b-2 border-black/5 last:border-0 hover:bg-white transition-all px-2 -mx-2">
                                                                <div className="mt-1">
                                                                    {task.finished === 'completed' ? (
                                                                        <CheckCircle size={14} className="text-green-600" />
                                                                    ) : (
                                                                        <div className="w-3 h-3 border-2 border-[#1c1c19]" />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <p className={`text-xs font-black uppercase italic leading-tight mb-2 ${task.finished === 'completed' ? 'line-through opacity-30' : 'text-[#1c1c19]'}`}>
                                                                        {task.description || task.task_description}
                                                                    </p>
                                                                    <div className="flex items-center flex-wrap gap-2">
                                                                        <span className={`text-[8px] font-black px-2 py-0.5 border-2 border-[#1c1c19] flex items-center gap-1 uppercase italic ${stage.color}`}>
                                                                            {stage.icon} {stage.label}
                                                                        </span>
                                                                        <span className="text-[8px] font-black text-[#72777f] uppercase flex items-center gap-1 bg-white border border-[#1c1c19]/10 px-2 py-0.5 rounded">
                                                                            <Clock size={8} /> {date ? formatDay(date) : '-'}
                                                                        </span>
                                                                        {task.staff?.name && (
                                                                            <span className="text-[8px] font-black text-[#0f4369] uppercase italic opacity-60">
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

                {/* Footer */}
                <div className="px-6 py-3 bg-[#1c1c19] text-white text-[8px] font-black uppercase tracking-[0.4em] flex justify-between items-center no-print">
                    <span>Generated: {new Date().toLocaleString()}</span>
                    <span>Arq.tvs Control System • internal_use_only</span>
                </div>
            </div>

            <style>{`
                @media print {
                    body * { visibility: hidden; }
                    #house-report-container, #house-report-container * { visibility: visible; }
                    #house-report-container {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                        background: white !important;
                        padding: 0 !important;
                    }
                    .no-print { display: none !important; }
                }
            `}</style>
        </div>
    );
};

export default HouseReportModal;
