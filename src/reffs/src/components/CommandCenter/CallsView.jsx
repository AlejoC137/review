import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getCallsWithDetails, updateCall } from '../../services/callsService';
import { format } from 'date-fns';
import { setSelectedTask, fetchPendingCallsCount } from '../../store/actions/appActions';
import { Bell, User, Briefcase, Calendar, Phone, Users, AlertCircle, CheckCircle2, Circle, Eye, EyeOff, Book } from 'lucide-react';

const CallsView = () => {
    const dispatch = useDispatch();
    const { panelMode, refreshCounter } = useSelector(state => state.app);

    const [calls, setCalls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedStafferId, setSelectedStafferId] = useState(null);
    const [hideAttended, setHideAttended] = useState(true);

    // Layout and panel are now managed by MainContainer

    useEffect(() => {
        loadCalls();
    }, [refreshCounter]);

    const loadCalls = async () => {
        setLoading(true);
        try {
            const data = await getCallsWithDetails();
            setCalls(data || []);

            if (data.length > 0 && !selectedStafferId) {
                // Select first one by default if not set
                const grouped = groupCalls(data);
                const firstId = Object.keys(grouped)[0];
                if (firstId) setSelectedStafferId(firstId);
            }
        } catch (error) {
            console.error('Error loading calls:', error);
        } finally {
            setLoading(false);
        }
    };

    const groupCalls = (allCalls) => {
        const grouped = {};
        allCalls.forEach(call => {
            // Apply filtering: if hideAttended is on, only include non-attended
            if (hideAttended && call.atendido) return;

            const staffId = call.llamado_id;
            const staffName = call.llamado?.name || 'Desconocido';

            if (!grouped[staffId]) {
                grouped[staffId] = {
                    id: staffId,
                    name: staffName,
                    calls: [],
                    pendingCount: 0
                };
            }
            grouped[staffId].calls.push(call);
            if (!call.atendido) grouped[staffId].pendingCount++;
        });
        return grouped;
    };

    const handleToggleAtendido = async (callId, currentStatus) => {
        try {
            const newStatus = !currentStatus;
            const newAtendidoAt = newStatus ? new Date().toISOString() : null;

            await updateCall(callId, {
                atendido: newStatus,
                atendido_at: newAtendidoAt
            });

            // Refresh local state
            setCalls(prev => prev.map(c =>
                c.id === callId
                    ? { ...c, atendido: newStatus, atendido_at: newAtendidoAt }
                    : c
            ));

            // Refresh global count
            dispatch(fetchPendingCallsCount());
        } catch (error) {
            alert("Error al actualizar llamado: " + error.message);
        }
    };

    const groupedData = useMemo(() => groupCalls(calls), [calls, hideAttended]);

    const staffList = useMemo(() => {
        return Object.values(groupedData).sort((a, b) => b.calls.length - a.calls.length);
    }, [groupedData]);

    const selectedStafferData = selectedStafferId ? groupedData[selectedStafferId] : null;

    const handleTaskClick = (task) => {
        // Ensure the task has full details if possible, or just dispatch
        dispatch(setSelectedTask(task));
    };

    const handleRefresh = () => {
        loadCalls();
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: People Called List */}
                <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/30">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <div className="flex flex-col gap-2">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <Bell size={20} className="text-purple-600" />
                                Llamados
                            </h2>
                            <button
                                onClick={() => setHideAttended(!hideAttended)}
                                className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold transition-all border ${hideAttended ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'}`}
                            >
                                {hideAttended ? <EyeOff size={12} /> : <Eye size={12} />}
                                {hideAttended ? 'Ocultando Atendidos' : 'Mostrando Todos'}
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loading && calls.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
                        ) : staffList.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No hay llamados registrados
                            </div>
                        ) : (
                            staffList.map((staffer) => (
                                <button
                                    key={staffer.id}
                                    onClick={() => setSelectedStafferId(staffer.id)}
                                    className={`
                                        w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-white transition-all relative
                                        ${selectedStafferId === staffer.id ? 'bg-white border-l-4 border-l-purple-600 shadow-sm z-10' : 'border-l-4 border-l-transparent'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selectedStafferId === staffer.id ? 'bg-purple-100 text-purple-600' : 'bg-gray-200 text-gray-500'}`}>
                                            <User size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium text-sm truncate ${selectedStafferId === staffer.id ? 'text-purple-700' : 'text-gray-700'}`}>
                                                {staffer.name}
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-0.5">
                                                {staffer.pendingCount} pendientes
                                            </div>
                                        </div>
                                        {staffer.pendingCount > 0 && (
                                            <div className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center shadow-sm">
                                                {staffer.pendingCount}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: Tasks for selected person */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                    {selectedStafferData ? (
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Header Banner */}
                            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50/50 to-white">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                                        <Bell size={32} className="text-purple-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1">
                                            Llamados para {selectedStafferData.name}
                                        </h3>
                                        <p className="text-sm text-gray-600 flex items-center gap-2">
                                            <AlertCircle size={14} className="text-red-500" />
                                            {selectedStafferData.pendingCount} tareas requieren atención inmediata
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 p-6 overflow-y-auto">
                                <div className="grid grid-cols-1 gap-4">
                                    {selectedStafferData.calls.map((call, idx) => {
                                        const task = call.tarea;
                                        if (!task) return null;
                                        const isPaused = task.finished === 'Pausada';

                                        return (
                                            <div
                                                key={call.id || idx}
                                                onClick={() => handleTaskClick(task)}
                                                className={`
                                                    group p-4 bg-white border rounded-xl cursor-pointer transition-all hover:shadow-md
                                                    ${isPaused ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}
                                                `}
                                            >
                                                <div className="flex items-start justify-between gap-4">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded text-white uppercase ${isPaused ? 'bg-red-500' : 'bg-blue-500'}`}>
                                                                {task.finished}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-gray-400">
                                                                {format(new Date(call.created_at), 'dd/MM HH:mm')}
                                                                {call.atendido_at && ` • Atendido: ${format(new Date(call.atendido_at), 'dd/MM HH:mm')}`}
                                                            </span>
                                                        </div>
                                                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                                                            {task.task_description}
                                                        </h4>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <div className="flex items-center gap-1 text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                                                                <Briefcase size={10} />
                                                                {task.proyecto?.name || 'Sin Proyecto'}
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[10px] text-purple-600 bg-purple-50 px-2 py-0.5 rounded font-bold">
                                                                <User size={10} />
                                                                Llamado por: {call.llamador_name || 'Sistema'}
                                                            </div>
                                                        </div>

                                                        {/* Call Comments */}
                                                        {call.Comments && (
                                                            <div className="mt-2 p-2 bg-blue-50 border-l-2 border-blue-400 text-[11px] text-blue-700 italic">
                                                                "{call.Comments}"
                                                            </div>
                                                        )}

                                                        {/* Last Bitácora Entry */}
                                                        {task.notes && (
                                                            <div className="mt-2 bg-gray-50 rounded-lg p-2 border border-gray-100">
                                                                <div className="text-[9px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                                                                    <Book size={10} /> Última Bitácora
                                                                </div>
                                                                <div className="text-[11px] text-gray-600 line-clamp-2">
                                                                    {(() => {
                                                                        try {
                                                                            const notes = JSON.parse(task.notes);
                                                                            if (Array.isArray(notes) && notes.length > 0) {
                                                                                const lastEntry = notes[notes.length - 1];
                                                                                return lastEntry.text;
                                                                            }
                                                                        } catch (e) { }
                                                                        return task.notes;
                                                                    })()}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col items-end gap-2">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleToggleAtendido(call.id, call.atendido);
                                                            }}
                                                            className={`p-2 rounded-lg transition-all ${call.atendido ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400 hover:text-green-600 hover:bg-green-50'}`}
                                                            title={call.atendido ? "Marcar como pendiente" : "Marcar como atendido"}
                                                        >
                                                            {call.atendido ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                                        </button>
                                                        <button className="p-2 bg-purple-100 text-purple-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                                                            <Phone size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <Bell size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">Selecciona una persona para ver sus llamados</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default CallsView;
