import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Users, User, Briefcase, Plus, X, Save, Loader2, Calendar, UserPlus, Pencil, Trash2, ChevronDown, ChevronUp, MessageSquare, Box } from 'lucide-react';
import { getStaffers, deleteStaff } from '../../services/spacesService';
import { getTasks, getProjects } from '../../services/tasksService';
import { getTaskActions } from '../../services/actionsService';
import { format } from 'date-fns';
import { setSelectedTask, initCreateTask } from '../../store/actions/appActions';
import AddMemberModal from './AddMemberModal';
import PrintButton from '../common/PrintButton';
import PDFModal from '../common/PDFModal';
import TeamReport from '../Reports/TeamReport';

// Sub-componente para cada fila de tarea con acordeón de acciones
const TaskRow = ({ task, project, onTaskClick }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [actions, setActions] = useState([]);
    const [loadingActions, setLoadingActions] = useState(false);

    const toggleActions = async (e) => {
        e.stopPropagation();
        const newExpanded = !isExpanded;
        setIsExpanded(newExpanded);

        if (newExpanded && actions.length === 0) {
            setLoadingActions(true);
            try {
                const data = await getTaskActions(task.id);
                setActions(data);
            } catch (error) {
                console.error("Error fetching actions:", error);
            } finally {
                setLoadingActions(false);
            }
        }
    };

    const latestNote = useMemo(() => {
        try {
            const notes = JSON.parse(task.notes || '[]');
            return Array.isArray(notes) && notes.length > 0 ? notes[0] : null;
        } catch (e) {
            return task.notes ? { text: task.notes, user: 'System', date: '-' } : null;
        }
    }, [task.notes]);

    const isOverdue = !task.finished && task.fecha_fin_estimada && new Date(task.fecha_fin_estimada) < new Date();

    return (
        <>
            <tr
                onClick={() => onTaskClick(task)}
                className={`hover:bg-blue-50/50 cursor-pointer transition-colors group ${isExpanded ? 'bg-blue-50/30' : ''}`}
            >
                <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                        {/* Single line: Project, Space, Description */}
                        <div className="flex items-center flex-wrap gap-2 leading-tight">
                            {(project || task.proyecto) && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 text-[9px] font-bold uppercase tracking-wider shrink-0">
                                    {project?.name || task.proyecto?.name}
                                </span>
                            )}
                            {task.espacio && (
                                <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 text-[9px] font-bold uppercase tracking-wider shrink-0">
                                    {task.espacio.nombre} {task.espacio.apellido || ''} {task.espacio.piso ? ` P${task.espacio.piso}` : ''}
                                </span>
                            )}
                            <span className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors text-xs truncate">
                                {task.task_description}
                            </span>
                        </div>

                        {/* Latest Bitácora */}
                        {latestNote && (
                            <div className="mt-1 flex items-start gap-1.5 bg-gray-50 p-1.5 rounded border border-gray-100">
                                <MessageSquare size={10} className="text-gray-400 mt-0.5 shrink-0" />
                                <div className="text-[10px] text-gray-600 leading-tight italic">
                                    <span className="font-bold text-gray-400 not-italic mr-1">{latestNote.user}:</span>
                                    {latestNote.text}
                                </div>
                            </div>
                        )}
                    </div>
                </td>

                <td className="px-4 py-3 text-gray-600 text-xs">
                    {task.fecha_fin_estimada ? (
                        <span className={isOverdue ? 'text-red-500 font-bold' : ''}>
                            {format(new Date(task.fecha_fin_estimada), 'dd/MM/yyyy')}
                        </span>
                    ) : '-'}
                </td>

                <td className="px-4 py-3">
                    {task.finished ? (
                        <span className="inline-flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Completada
                        </span>
                    ) : (
                        <span className="inline-flex items-center gap-1 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full text-[10px] font-bold">
                            Activa
                        </span>
                    )}
                </td>

                <td className="px-4 py-3 text-right">
                    <button
                        onClick={toggleActions}
                        className="p-1 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-blue-600"
                    >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                </td>
            </tr>

            {/* Actions Dropdown */}
            {isExpanded && (
                <tr className="bg-gray-50/50">
                    <td colSpan="4" className="px-12 py-3 border-b border-gray-100">
                        <div className="space-y-1 max-w-2xl">
                            <h5 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                <Box size={10} /> Acciones de esta Tarea
                            </h5>
                            {loadingActions ? (
                                <div className="flex items-center gap-2 text-[10px] text-gray-400 italic py-2">
                                    <Loader2 size={12} className="animate-spin" />
                                    Cargando acciones...
                                </div>
                            ) : actions.length === 0 ? (
                                <div className="text-[10px] text-gray-400 italic py-2">No hay acciones registradas para esta tarea</div>
                            ) : (
                                <div className="grid gap-1">
                                    {actions.map(action => (
                                        <div key={action.id} className="flex items-center justify-between py-1.5 border-b border-gray-100 last:border-0 hover:bg-white px-3 rounded-md transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full shadow-sm ${action.completed ? 'bg-green-500' : 'bg-blue-400 animate-pulse'}`} />
                                                <span className={`text-xs ${action.completed ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}>
                                                    {action.description}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-3 text-[10px] text-gray-400 font-medium">
                                                {action.executor_id && (
                                                    <span className="bg-gray-100 px-1.5 py-0.5 rounded">{action.executor_id}</span>
                                                )}
                                                {action.fecha_ejecucion && (
                                                    <span>{format(new Date(action.fecha_ejecucion), 'dd/MM/yyyy')}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </td>
                </tr>
            )}
        </>
    );
};

const TeamView = () => {
    const dispatch = useDispatch();
    const { panelMode, refreshCounter } = useSelector(state => state.app);

    const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState(null);

    // Layout and panel are now managed by MainContainer

    const [staffers, setStaffers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedStaffer, setSelectedStaffer] = useState(null);
    const [projectFilter, setProjectFilter] = useState('all');

    useEffect(() => {
        setProjectFilter('all');
    }, [selectedStaffer]);

    useEffect(() => {
        loadData();
    }, [refreshCounter]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [staffData, tasksData, projectsData] = await Promise.all([
                getStaffers(),
                getTasks(),
                getProjects()
            ]);
            setStaffers(staffData || []);
            setTasks(tasksData || []);
            setProjects(projectsData || []);

            // Re-select staffer if we were editing
            if (selectedStaffer) {
                const updated = (staffData || []).find(s => s.id === selectedStaffer.id);
                if (updated) setSelectedStaffer(updated);
                else setSelectedStaffer(null);
            }
        } catch (error) {
            console.error('Error loading team data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleActionUpdated = () => {
        loadData();
    };

    const handleTaskClick = (task) => {
        dispatch(setSelectedTask(task));
    };

    const handleCreateTask = () => {
        if (!selectedStaffer) return;

        dispatch(initCreateTask({
            task_description: '',
            proyecto_id: null,
            espacio_uuid: null,
            fecha_inicio: format(new Date(), 'yyyy-MM-dd'),
            fecha_fin_estimada: format(new Date(), 'yyyy-MM-dd'),
            staff_id: selectedStaffer.id
        }));
    };

    const handleEditStaffer = () => {
        setEditingMember(selectedStaffer);
        setIsAddMemberModalOpen(true);
    };

    const handleDeleteStaffer = async () => {
        if (!selectedStaffer) return;

        const confirmed = window.confirm(`¿Estás seguro de que deseas eliminar a ${selectedStaffer.name}? Esta acción no se puede deshacer.`);
        if (!confirmed) return;

        try {
            await deleteStaff(selectedStaffer.id);
            setSelectedStaffer(null);
            loadData();
        } catch (error) {
            alert('Error al eliminar integrante: ' + error.message);
        }
    };

    // Filter tasks for selected staffer
    const staffTasks = useMemo(() => {
        if (!selectedStaffer) return [];
        let filtered = tasks.filter(t =>
            t.staff_id === selectedStaffer.id ||
            t.asignado_a === selectedStaffer.name ||
            (t.asignado_a && t.asignado_a.includes(selectedStaffer.name)) // Loose match
        );

        if (projectFilter !== 'all') {
            filtered = filtered.filter(t => (t.project_id || t.proyecto?.id || t.proyecto_id)?.toString() === projectFilter);
        }

        return filtered.sort((a, b) => new Date(b.created_at || b.fecha_inicio) - new Date(a.created_at || a.fecha_inicio));
    }, [tasks, selectedStaffer, projectFilter]);

    // Stats
    const stats = useMemo(() => {
        const active = staffTasks.filter(t => !t.finished).length;
        const completed = staffTasks.filter(t => t.finished).length;
        return { active, completed, total: staffTasks.length };
    }, [staffTasks]);

    // PDF Report State
    const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);

    // Legacy Print handling replaced by React PDF
    const handlePrint = () => {
        setIsPDFModalOpen(true);
    };

    return (
        <div className="h-full flex flex-col bg-white overflow-hidden">
            <div className="flex-1 flex overflow-hidden">
                {/* LEFT: Team List */}
                <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50/30 no-print">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                                <Users size={20} className="text-blue-600" />
                                Equipo
                            </h2>
                            <p className="text-xs text-gray-500">
                                {staffers.length} integrantes
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                setEditingMember(null);
                                setIsAddMemberModalOpen(true);
                            }}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            title="Agregar Integrante"
                        >
                            <Plus size={16} strokeWidth={3} />
                        </button>
                    </div>

                    {/* Team Members List */}
                    <div className="flex-1 overflow-y-auto">
                        {loading && staffers.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
                        ) : staffers.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No hay integrantes del equipo
                            </div>
                        ) : (
                            staffers.map((staffer, idx) => (
                                <button
                                    key={staffer.id || idx}
                                    onClick={() => setSelectedStaffer(staffer)}
                                    className={`
                                        w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-white transition-all
                                        ${selectedStaffer?.id === staffer.id ? 'bg-white border-l-4 border-l-blue-600 shadow-sm z-10' : 'border-l-4 border-l-transparent'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${selectedStaffer?.id === staffer.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-200 text-gray-500'}`}>
                                            <User size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium text-sm truncate ${selectedStaffer?.id === staffer.id ? 'text-blue-700' : 'text-gray-700'}`}>
                                                {staffer.name} {staffer.apellido || ''}
                                            </div>
                                            {staffer.role_description && (
                                                <div className="text-xs text-gray-500 truncate mt-0.5">
                                                    {staffer.role_description}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT: Member Details */}
                <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                    {selectedStaffer ? (
                        <div id="team-view-print-view" className="flex-1 overflow-y-auto print-container">
                            {/* Header Banner */}
                            <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50/50 to-white print:border-none">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-16 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center">
                                            <User size={32} className="text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                                    {selectedStaffer.name} {selectedStaffer.apellido || ''}
                                                </h3>
                                                <div className="flex gap-1 no-print">
                                                    <PrintButton
                                                        onClick={handlePrint}
                                                    />
                                                    <button
                                                        onClick={handleEditStaffer}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                        title="Editar Integrante"
                                                    >
                                                        <Pencil size={14} />
                                                    </button>
                                                    <button
                                                        onClick={handleDeleteStaffer}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Eliminar Integrante"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                            {selectedStaffer.role_description && (
                                                <p className="text-sm text-gray-600 flex items-center gap-2">
                                                    <Briefcase size={14} />
                                                    {selectedStaffer.role_description}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleCreateTask}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-sm hover:shadow-md no-print"
                                    >
                                        <Plus size={16} />
                                        Agregar Tarea
                                    </button>
                                </div>
                            </div>

                            <div className="p-6 space-y-8">
                                {/* Details Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Role Info */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <User size={14} className="text-gray-500" />
                                            Información del Integrante
                                        </h4>
                                        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl">
                                            <p className="text-sm text-gray-600">
                                                <span className="font-semibold text-gray-700">Rol:</span> {selectedStaffer.role_description || 'Sin rol asignado'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Stats */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <Calendar size={14} className="text-gray-500" />
                                            Estadísticas
                                        </h4>
                                        <div className="grid grid-cols-3 gap-3">
                                            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl">
                                                <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
                                                <div className="text-[10px] font-bold text-blue-400 uppercase tracking-wide">Tareas Activas</div>
                                            </div>
                                            <div className="p-3 bg-green-50 border border-green-100 rounded-xl">
                                                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                                                <div className="text-[10px] font-bold text-green-500 uppercase tracking-wide">Completadas</div>
                                            </div>
                                            <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                                <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
                                                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Total</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Tasks List */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                            <Briefcase size={14} className="text-gray-500" />
                                            Tareas Asignadas
                                        </h4>
                                        <div className="flex items-center gap-2 no-print">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Proyecto:</span>
                                            <select
                                                value={projectFilter}
                                                onChange={(e) => setProjectFilter(e.target.value)}
                                                className="text-xs border-gray-200 rounded-lg bg-gray-50 text-gray-700 focus:ring-blue-500 focus:border-blue-500 py-1 pl-2 pr-8"
                                            >
                                                <option value="all">Todos los proyectos</option>
                                                {projects.map(p => (
                                                    <option key={p.id} value={p.id}>{p.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {staffTasks.length === 0 ? (
                                        <div className="text-center py-8 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/50">
                                            <p className="text-sm text-gray-500 mb-2">No hay tareas asignadas</p>
                                            <button
                                                onClick={handleCreateTask}
                                                className="text-xs text-blue-600 font-medium hover:underline"
                                            >
                                                Crear primera tarea
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-bold border-b border-gray-100">
                                                        <tr>
                                                            <th className="px-4 py-3">Información de la Tarea</th>
                                                            <th className="px-4 py-3 w-32">Fecha Fin</th>
                                                            <th className="px-4 py-3 w-24">Estado</th>
                                                            <th className="px-4 py-3 w-10"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {staffTasks.map(task => {
                                                            const projectId = task.project_id || task.proyecto?.id || task.proyecto_id;
                                                            const project = projects.find(p => p.id === projectId);

                                                            return (
                                                                <TaskRow
                                                                    key={task.id}
                                                                    task={task}
                                                                    project={project}
                                                                    onTaskClick={handleTaskClick}
                                                                />
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <div className="text-center">
                                <Users size={48} className="mx-auto mb-3 opacity-20" />
                                <p className="text-sm font-medium">Selecciona un integrante para ver detalles</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            {/* ADD MEMBER MODAL */}
            <AddMemberModal
                isOpen={isAddMemberModalOpen}
                onClose={() => {
                    setIsAddMemberModalOpen(false);
                    setEditingMember(null);
                }}
                onMemberAdded={loadData}
                member={editingMember}
            />

            {/* PDF Report Modal */}
            <PDFModal
                isOpen={isPDFModalOpen}
                onClose={() => setIsPDFModalOpen(false)}
                title={`Reporte de Equipo: ${selectedStaffer?.name}`}
            >
                <TeamReport
                    staffer={selectedStaffer}
                    stats={stats}
                    tasks={staffTasks}
                    projects={projects}
                />
            </PDFModal>
        </div>
    );
};

export default TeamView;

