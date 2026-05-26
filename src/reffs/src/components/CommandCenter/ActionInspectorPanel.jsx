import React, { useRef, useEffect, useState, Fragment } from 'react';
import { createPortal } from 'react-dom';
import { handleNativePrint } from '../../utils/printUtils';
import { useDispatch, useSelector } from 'react-redux';
import { clearSelection, setSelectedAction, setSelectedTask, fetchPendingCallsCount, toggleInspectorCollapse, incrementRefreshCounter } from '../../store/actions/appActions';
import { updateAction, createAction, getTaskActions, updateActionsOrder, deleteAction } from '../../services/actionsService';
import { getSpaceComponents, updateComponent } from '../../services/componentsService';
import { getSpaces, getSpaceDetails, updateSpace, getStaffers } from '../../services/spacesService';
import { createTask, updateTask, getProjects, deleteTask, getTasksByDate, getStages, getTaskById } from '../../services/tasksService';
import { createCall, createMultipleCalls } from '../../services/callsService';
import TaskDependencySelector from './TaskDependencySelector'; // Import Selector
import { X, Save, CheckCircle, User, MapPin, Layers, Box, Edit3, Briefcase, Trash2, ArrowUp, ArrowDown, GripVertical, Calendar, Plus, AlertCircle, PlayCircle, PauseCircle, Book, Check, Phone, Users, Image as ImageIcon, Loader2, Lock, Unlock } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';
import PrintButton from '../common/PrintButton';
import EvidenceUploader from '../common/EvidenceUploader';
import SearchableSpaceSelector from '../common/SearchableSpaceSelector';
import SearchableStaffSelector from '../common/SearchableStaffSelector';
import InspectorHeader from './ActionInspector/InspectorHeader';
import TaskView from './ActionInspector/TaskView';
import ActionView from './ActionInspector/ActionView';
import DayView from './ActionInspector/DayView';
import ApprovalRow from './ActionInspector/ApprovalRow';
import ParallelActionCard from './ActionInspector/ParallelActionCard';
import ConcatenatedActionCard from './ActionInspector/ConcatenatedActionCard';
import BitacoraManager from './ActionInspector/BitacoraManager';
import LinksManager from './ActionInspector/LinksManager';


const ActionInspectorPanel = ({ onActionUpdated, onCollapseChange }) => {
    const dispatch = useDispatch();
    const { selectedAction, selectedTask, selectedDate, panelMode, isInspectorCollapsed: isCollapsed, refreshCounter } = useSelector(state => state.app);

    // Local state for Action form
    const [actionForm, setActionForm] = useState({});

    // Local state for Task form
    const [taskForm, setTaskForm] = useState({});

    // Local state for Task Components (Actions)
    const [parallelActions, setParallelActions] = useState([]);
    const [concatenatedActions, setConcatenatedActions] = useState([]);
    const [isDraggingUI, setIsDraggingUI] = useState(null);
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [draggedType, setDraggedType] = useState(null); // 'parallel' or 'concatenated'
    const draggingIndexRef = useRef(null);
    const actionsRef = useRef([]); // To keep a fresh copy for calculations if needed

    // Local state for Day Tasks
    const [dayTasks, setDayTasks] = useState([]);

    // Dropdown options
    const [spaces, setSpaces] = useState([]);
    const [projects, setProjects] = useState([]);
    const [staffers, setStaffers] = useState([]);
    const [stages, setStages] = useState([]);
    const [callerId, setCallerId] = useState('');
    const [calledStaffId, setCalledStaffId] = useState('');
    const [callComment, setCallComment] = useState('');

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showCallDropdown, setShowCallDropdown] = useState(false);

    // DnD State


    const printRef = useRef(null);
    const handlePrint = () => {
        handleNativePrint('action-inspector-print-view', `Detalle_${panelMode}_${selectedTask?.task_description || selectedAction?.description || selectedDate}`);
    };

    // Load dropdown data on mount
    useEffect(() => {
        getSpaces().then(setSpaces).catch(console.error);
        getProjects().then(setProjects).catch(console.error);
        getStaffers().then(setStaffers).catch(console.error);
        getStages().then(setStages).catch(console.error);
    }, []);

    // Load Action Data
    useEffect(() => {
        if (panelMode === 'action' && selectedAction) {
            setActionForm({
                ...selectedAction,
                fecha_fin: selectedAction.fecha_fin || selectedAction.fecha_ejecucion,
                executor_id: selectedAction.executor_id || '',
                evidence_url: selectedAction.evidence_url || ''
            });
        } else if (panelMode === 'create') {
            const today = format(new Date(), 'yyyy-MM-dd');
            setActionForm({
                description: '',
                fecha_ejecucion: today,
                fecha_fin: today,
                executor_id: '',
                finished: false, // Initial state
                requiere_aprobacion_ronald: false,
                estado_aprobacion_ronald: false,
                requiere_aprobacion_wiet: false,
                estado_aprobacion_wiet: false,
                requiere_aprobacion_alejo: false,
                estado_aprobacion_alejo: false,
                evidence_url: ''
            });
        }
    }, [selectedAction, panelMode]);

    // Load Task Form Data
    useEffect(() => {
        if (panelMode === 'createTask' && selectedTask) {
            setTaskForm({
                ...selectedTask,
                task_description: selectedTask.task_description || '',
                fecha_inicio: selectedTask.fecha_inicio || format(new Date(), 'yyyy-MM-dd'),
                fecha_fin_estimada: selectedTask.fecha_fin_estimada || format(new Date(), 'yyyy-MM-dd'),
                espacio_uuid: selectedTask.espacio_uuid || null,
                proyecto_id: selectedTask.proyecto_id || null,
                finished: selectedTask.finished || false,
                staff_id: selectedTask.staff_id || selectedTask.staff?.id || '',
                Priority: selectedTask.Priority || '1',
                stage_id: selectedTask.stage?.id || selectedTask.stage_id || '',
                finished: selectedTask.finished || 'Activa',
                notes: selectedTask.notes || '',
                RonaldPass: selectedTask.RonaldPass || false,
                WietPass: selectedTask.WietPass || false,
                AlejoPass: selectedTask.AlejoPass || false,
                evidence_url: selectedTask.evidence_url || ''
            });
            // Load draft fullActions if present (for JSON Importer)
            if (selectedTask.fullActions) {
                const actions = selectedTask.fullActions.map((a, i) => ({ ...a, order: i, _isNew: true }));
                setParallelActions(actions.filter(a => a.es_paralela));
                setConcatenatedActions(actions.filter(a => !a.es_paralela));
            } else {
                setParallelActions([]);
                setConcatenatedActions([]);
            }
        } else if (panelMode === 'task' && selectedTask) {
            // Load existing task data into taskForm for editing

            // NOTE: condiciona_a is a REAL column in the database (Image Confirmed).
            // We map it directly, but we also kept the "condiciona_a_task" join for the Label in the selector.

            setTaskForm({
                ...selectedTask,
                task_description: selectedTask.task_description || '',
                fecha_inicio: selectedTask.fecha_inicio || (selectedTask.created_at ? selectedTask.created_at.split('T')[0] : format(new Date(), 'yyyy-MM-dd')),
                fecha_fin_estimada: selectedTask.fecha_fin_estimada || format(new Date(), 'yyyy-MM-dd'),
                espacio_uuid: selectedTask.espacio ? (selectedTask.espacio._id || selectedTask.espacio.id) : (selectedTask.espacio_uuid || null),
                proyecto_id: selectedTask.proyecto ? selectedTask.proyecto.id : (selectedTask.proyecto_id || null),
                finished: selectedTask.finished || false,
                staff_id: selectedTask.staff_id || selectedTask.staff?.id || '',
                Priority: selectedTask.Priority || '1',
                stage_id: selectedTask.stage?.id || selectedTask.stage_id || '',
                finished: selectedTask.finished || 'Activa',
                notes: selectedTask.notes || '',
                WietPass: selectedTask.WietPass || false,
                AlejoPass: selectedTask.AlejoPass || false,
                RonaldPass: selectedTask.RonaldPass || false,
                condicionada_por: selectedTask.condicionada_por || null, // Direct Column
                condiciona_a: selectedTask.condiciona_a || null, // Direct Column mapping
                condicionada_por_task: selectedTask.condicionada_por_task || null,
                condiciona_a_task: selectedTask.condiciona_a_task || null,
                links_de_interes: selectedTask.links_de_interes || '',
                fullActions: [],
                evidence_url: selectedTask.evidence_url || ''
            });
        }
    }, [selectedTask?.id, panelMode, refreshCounter]); // Refetch if refreshCounter increments

    // Load Task Data (Actions)
    useEffect(() => {
        if (panelMode === 'task' && selectedTask?.id) {
            setParallelActions([]);
            setConcatenatedActions([]);
            setLoading(true);
            getTaskActions(selectedTask.id)
                .then(data => {
                    const actions = data || [];
                    setParallelActions(actions.filter(a => a.es_paralela));
                    setConcatenatedActions(actions.filter(a => !a.es_paralela));
                })
                .catch(err => console.error(err))
                .finally(() => setLoading(false));

        } else if (panelMode === 'day' && selectedDate) {
            setLoading(true);
            setDayTasks([]); // Clear previous day tasks
            getTasksByDate(selectedDate)
                .then(setDayTasks)
                .catch(console.error)
                .finally(() => setLoading(false));

        } else if (panelMode !== 'createTask') {
            // Only clear if NOT in create/preview mode
            setParallelActions([]);
            setConcatenatedActions([]);
            setDayTasks([]);
        }
    }, [selectedTask?.id, selectedDate, panelMode, refreshCounter]); // Refetch if refreshCounter increments

    const handleActionChange = (field, value) => {
        setActionForm(prev => {
            const updates = { ...prev, [field]: value };
            if (field === 'fecha_ejecucion' && updates.fecha_fin < value) {
                updates.fecha_fin = value;
            }
            if (field === 'fecha_fin' && updates.fecha_ejecucion > value) {
                updates.fecha_ejecucion = value;
            }
            return updates;
        });
    };

    const handleNavToTask = async (targetTaskId) => {
        if (!targetTaskId) return;
        try {
            const targetTask = await getTaskById(targetTaskId);
            if (targetTask) {
                // If we are in a 'dirty' state, we might want to warn? 
                // For now, simpler is just jump.
                dispatch(setSelectedTask(targetTask));
                // Ensure panel is open and in task mode (should be already if we are here)
                if (!showPanel) dispatch(toggleInspector(true));
            }
        } catch (err) {
            console.error("Error navigating to task:", err);
            alert("Error al abrir la tarea vinculada.");
        }
    };

    const handleTaskChange = (field, value) => {
        setTaskForm(prev => {
            const updates = { ...prev, [field]: value };
            if (field === 'fecha_inicio' && updates.fecha_fin_estimada < value) {
                updates.fecha_fin_estimada = value;
            }
            if (field === 'fecha_fin_estimada' && updates.fecha_inicio > value) {
                updates.fecha_inicio = value;
            }
            return updates;
        });
    };

    // AUTO-SAVE for Task Completion
    const handleTaskCompletionToggle = async (e) => {
        const checked = e.target.checked;
        // Optimistic update
        setTaskForm(prev => ({ ...prev, finished: checked }));

        if (panelMode === 'task' && selectedTask?.id) {
            try {
                await updateTask(selectedTask.id, { finished: checked });
                // Update Redux to reflect change in UI
                dispatch(setSelectedTask({ ...selectedTask, finished: checked }));
                if (onActionUpdated) onActionUpdated(); // Refresh calendar
            } catch (error) {
                console.error("Error auto-saving task completion:", error);
                // Revert on error
                setTaskForm(prev => ({ ...prev, finished: !checked }));
                alert("Error al actualizar estado: " + error.message);
            }
        }
    };

    const handlePassToggle = async (field, checked) => {
        // Optimistic update
        setTaskForm(prev => ({ ...prev, [field]: checked }));

        if (panelMode === 'task' && selectedTask?.id) {
            try {
                const updatedTask = await updateTask(selectedTask.id, { [field]: checked });
                // Update Redux to reflect change in UI using the FRESH data from server
                if (updatedTask) {
                    dispatch(setSelectedTask(updatedTask));
                }
                if (onActionUpdated) onActionUpdated(); // Refresh calendar
                dispatch(incrementRefreshCounter()); // Global refresh
            } catch (error) {
                console.error(`Error auto-saving ${field}:`, error);
                // Revert on error
                setTaskForm(prev => ({ ...prev, [field]: !checked }));
                alert("Error al actualizar: " + error.message);
            }
        }
    };

    // AUTO-SAVE for Main Action Completion
    const handleActionCompletionToggle = async (e) => {
        const checked = e.target.checked;
        // Optimistic update
        setActionForm(prev => ({ ...prev, completed: checked }));

        if (panelMode === 'action' && selectedAction?.id) {
            try {
                await updateAction(selectedAction.id, { completed: checked });
                // Update Redux
                dispatch(setSelectedAction({ ...selectedAction, completed: checked })); // Use completed consistently for actions
                if (onActionUpdated) onActionUpdated({ ...selectedAction, completed: checked });
            } catch (error) {
                console.error("Error auto-saving action completion:", error);
                setActionForm(prev => ({ ...prev, completed: !checked }));
                alert("Error al actualizar estado: " + error.message);
            }
        }
    };

    // AUTO-SAVE for Sub-Action in List
    const handleSubActionChange = async (index, field, value, type = 'concatenated') => {
        const setActions = type === 'parallel' ? setParallelActions : setConcatenatedActions;
        const actions = type === 'parallel' ? parallelActions : concatenatedActions;

        // Special handling for completion
        if (field === 'completed') {
            const action = actions[index];
            const newStatus = value; // Checkbox value

            // Optimistic Update
            setActions(prev => prev.map((a, i) => i === index ? { ...a, completed: newStatus } : a));

            if (!action._isNew && action.id) {
                try {
                    await updateAction(action.id, { completed: newStatus });
                    if (onActionUpdated) onActionUpdated();
                } catch (error) {
                    console.error("Error auto-saving sub-action:", error);
                    // Revert
                    setActions(prev => prev.map((a, i) => i === index ? { ...a, completed: !newStatus } : a));
                }
            }
        } else {
            // Normal field update (wait for save)
            setActions(prev => prev.map((a, i) =>
                i === index ? { ...a, [field]: value } : a
            ));
        }
    };

    // Resizing logic for concatenated actions
    const timelineContainerRef = useRef(null);

    const handleResizeMove = (e) => {
        const index = draggingIndexRef.current;
        if (index === null || !timelineContainerRef.current) return;

        const containerRect = timelineContainerRef.current.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const mouseX = e.clientX - containerRect.left;

        setConcatenatedActions(prev => {
            const newTasks = [...prev];
            if (!newTasks[index] || !newTasks[index + 1]) return prev;

            const n = prev.length;
            const getPerc = (idx) => newTasks[idx].porcentaje_duracion || (100 / n);

            // Calculate cumulative percentage of PREVIOUS tasks
            let prevTasksWidth = 0;
            for (let i = 0; i < index; i++) {
                prevTasksWidth += getPerc(i);
            }

            let newCurrentPercentage = (mouseX / containerWidth) * 100 - prevTasksWidth;

            // Constraints (Min 5%)
            if (newCurrentPercentage < 5) newCurrentPercentage = 5;

            const totalPairPercentage = getPerc(index) + getPerc(index + 1);
            let newNextPercentage = totalPairPercentage - newCurrentPercentage;

            if (newNextPercentage < 5) {
                newNextPercentage = 5;
                newCurrentPercentage = totalPairPercentage - 5;
            }

            newTasks[index].porcentaje_duracion = newCurrentPercentage;
            newTasks[index + 1].porcentaje_duracion = newNextPercentage;
            return newTasks;
        });
    };

    const handleResizeUp = () => {
        draggingIndexRef.current = null;
        setIsDraggingUI(null);
        document.body.style.cursor = 'default';
        document.removeEventListener('mousemove', handleResizeMove);
        document.removeEventListener('mouseup', handleResizeUp);
    };

    const handleResizeStart = (index, e) => {
        e.preventDefault();
        draggingIndexRef.current = index;
        setIsDraggingUI(index);
        document.body.style.cursor = 'col-resize';
        document.addEventListener('mousemove', handleResizeMove);
        document.addEventListener('mouseup', handleResizeUp);
    };


    // Drag and Drop Handlers
    const handleDragStart = (e, index, type = 'parallel') => {
        setDraggedIndex(index);
        setDraggedType(type);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
    };

    const handleDrop = async (e, targetIndex, type = 'parallel') => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === targetIndex || draggedType !== type) return;

        const isParallel = type === 'parallel';
        const list = isParallel ? parallelActions : concatenatedActions;
        const setter = isParallel ? setParallelActions : setConcatenatedActions;

        const newItems = [...list];
        const draggedItem = newItems[draggedIndex];

        newItems.splice(draggedIndex, 1);
        newItems.splice(targetIndex, 0, draggedItem);

        setter(newItems);
        setDraggedIndex(null);
        setDraggedType(null);

        try {
            const updates = newItems.map((action, idx) => ({
                id: action.id,
                order: idx
            })).filter(a => a.id);

            if (updates.length > 0) {
                await updateActionsOrder(updates);
            }
        } catch (error) {
            console.error('Error reordering:', error);
        }
    };


    const handleSaveAction = async (e) => {
        if (e) e.preventDefault();
        if (saving) return; // RE-ENTRATION GUARD
        setSaving(true);

        try {
            if (panelMode === 'action' && selectedAction?.id) {
                console.log("Mode: ACTION UPDATE");
                const { tarea, ...updates } = actionForm;

                // Sanitize dates
                if (updates.fecha_ejecucion === "") updates.fecha_ejecucion = null;
                if (updates.fecha_fin === "") updates.fecha_fin = null;

                await updateAction(selectedAction.id, updates);
                dispatch(setSelectedAction({ ...selectedAction, ...updates }));
                if (onActionUpdated) onActionUpdated({ ...selectedAction, ...updates });

            } else if (panelMode === 'task' && selectedTask?.id) {
                // console.log("Mode: TASK & ACTIONS UPDATE");

                // 1. UPDATE TASK
                const updates = {};
                if (taskForm.task_description !== selectedTask.task_description) updates.task_description = taskForm.task_description;
                if (taskForm.fecha_inicio !== selectedTask.fecha_inicio) updates.fecha_inicio = taskForm.fecha_inicio;
                if (taskForm.fecha_fin_estimada !== selectedTask.fecha_fin_estimada) updates.fecha_fin_estimada = taskForm.fecha_fin_estimada;
                if (taskForm.finished !== selectedTask.finished) updates.finished = taskForm.finished;
                if (taskForm.staff_id !== selectedTask.staff_id) updates.staff_id = taskForm.staff_id || null;

                // Loose equality for IDs (string vs number)
                if (taskForm.proyecto_id && taskForm.proyecto_id != (selectedTask.proyecto?.id || selectedTask.project_id)) updates.project_id = taskForm.proyecto_id;
                if (taskForm.espacio_uuid && taskForm.espacio_uuid != (selectedTask.espacio?._id || selectedTask.espacio_uuid)) updates.espacio_uuid = taskForm.espacio_uuid;

                console.log("Task Updates:", updates);

                if (taskForm.finished !== selectedTask.finished) updates.finished = taskForm.finished;
                if (taskForm.staff_id !== (selectedTask.staff_id || selectedTask.asignado_a)) updates.staff_id = taskForm.staff_id || null;

                // New Fields Updates
                if (taskForm.Priority !== selectedTask.Priority) updates.Priority = taskForm.Priority;
                if (taskForm.stage_id !== selectedTask.stage_id) updates.stage_id = taskForm.stage_id || null;
                if (taskForm.finished !== selectedTask.finished) updates.finished = taskForm.finished;
                if (taskForm.notes !== selectedTask.notes) updates.notes = taskForm.notes;
                if (taskForm.RonaldPass !== selectedTask.RonaldPass) updates.RonaldPass = taskForm.RonaldPass;
                if (taskForm.WietPass !== selectedTask.WietPass) updates.WietPass = taskForm.WietPass;
                if (taskForm.AlejoPass !== selectedTask.AlejoPass) updates.AlejoPass = taskForm.AlejoPass;
                if (taskForm.condicionada_por !== selectedTask.condicionada_por) updates.condicionada_por = taskForm.condicionada_por || null;
                if (taskForm.condiciona_a !== selectedTask.condiciona_a) updates.condiciona_a = taskForm.condiciona_a || null; // SAVE DIRECTLY
                if (taskForm.links_de_interes !== selectedTask.links_de_interes) updates.links_de_interes = taskForm.links_de_interes;
                if (taskForm.evidence_url !== selectedTask.evidence_url) updates.evidence_url = taskForm.evidence_url;

                let updatedTaskData = selectedTask;
                if (Object.keys(updates).length > 0) {
                    updatedTaskData = await updateTask(selectedTask.id, updates);

                    // NEW: Automatic call if finished is "Pausada"
                    if (updates.finished === 'Pausada') {
                        // We use a small timeout to ensure state/db is updated or just call the logic
                        console.log("Automatic call triggered for Paused finished");
                        // We need to ensure we have the IDs for seguimiento or just call handleCallSeguimiento
                        // handleCallSeguimiento depends on taskForm and selectedTask being correct
                        setTimeout(() => handleCallSeguimiento(false), 500);
                    }
                }

                // 1.5 UPDATE DEPENDENTS (Side Effects for Double-Linking)

                // SIDE EFFECT 1: If "Condiciona A" changed, update the Target's "Condicionada Por"
                if (taskForm.condiciona_a !== selectedTask.condiciona_a) {
                    console.log(`DEBUG: Cambio detectado en Condiciona A.\nAnterior: ${selectedTask.condiciona_a}\nNuevo: ${taskForm.condiciona_a}`);
                    try {
                        // New Target
                        if (taskForm.condiciona_a) {
                            console.log(`Syncing: Task ${taskForm.condiciona_a} is now conditioned by ${selectedTask.id}`);
                            await updateTask(taskForm.condiciona_a, { condicionada_por: selectedTask.id });
                        }
                        // Old Target (Clear it)
                        if (selectedTask.condiciona_a && selectedTask.condiciona_a !== taskForm.condiciona_a) {
                            console.log(`Syncing: Task ${selectedTask.condiciona_a} is no longer conditioned by ${selectedTask.id}`);
                            await updateTask(selectedTask.condiciona_a, { condicionada_por: null });
                        }
                    } catch (err) {
                        console.error("Error syncing Condiciona A:", err);
                    }
                } else {
                    console.log(`DEBUG: NO se detectó cambio en Condiciona A.\nForm: ${taskForm.condiciona_a}\nOrig: ${selectedTask.condiciona_a}`);
                }

                // SIDE EFFECT 2: If "Condicionada Por" changed, update the Target's "Condiciona A"
                if (taskForm.condicionada_por !== selectedTask.condicionada_por) {
                    console.log(`DEBUG: Cambio detectado en Condicionada Por.\nAnterior: ${selectedTask.condicionada_por}\nNuevo: ${taskForm.condicionada_por}`);
                    try {
                        // New Parent
                        if (taskForm.condicionada_por) {
                            console.log(`Syncing: Task ${taskForm.condicionada_por} conditions ${selectedTask.id}`);
                            await updateTask(taskForm.condicionada_por, { condiciona_a: selectedTask.id });
                        }
                        // Old Parent (Clear it)
                        if (selectedTask.condicionada_por && selectedTask.condicionada_por !== taskForm.condicionada_por) {
                            console.log(`Syncing: Task ${selectedTask.condicionada_por} no longer conditions ${selectedTask.id}`);
                            await updateTask(selectedTask.condicionada_por, { condiciona_a: null });
                        }
                    } catch (err) {
                        console.error("Error syncing Condicionada Por:", err);
                    }
                } else {
                    console.log(`DEBUG: NO se detectó cambio en Condicionada Por.\nForm: ${taskForm.condicionada_por}\nOrig: ${selectedTask.condicionada_por}`);
                }

                // 2. UPDATE/CREATE ACTIONS
                const allActions = [...parallelActions, ...concatenatedActions];
                const actionPromises = allActions.map(async (action, index) => {
                    const actionPayload = {
                        description: action.description,
                        executor_id: action.executor_id,
                        ejecutor_texto: action.ejecutor_texto,
                        fecha_ejecucion: action.fecha_ejecucion || null,
                        fecha_fin: action.fecha_fin || null,
                        requiere_aprobacion_ronald: action.requiere_aprobacion_ronald,
                        requiere_aprobacion_wiet: action.requiere_aprobacion_wiet,
                        requiere_aprobacion_alejo: action.requiere_aprobacion_alejo,
                        es_paralela: action.es_paralela || false,
                        porcentaje_duracion: action.porcentaje_duracion || 0,
                        color_ui: action.color_ui || '#3b82f6',
                        order: index
                    };

                    if (action._isNew) {
                        return createAction({
                            ...actionPayload,
                            task_id: selectedTask.id,
                            completed: action.completed || false
                        });
                    } else {
                        return updateAction(action.id, actionPayload);
                    }
                });

                await Promise.all(actionPromises);

                // RE-FETCH FRESH DATA (Critical for relationships like 'condiciona_a' which are external)
                try {
                    const freshTask = await getTaskById(selectedTask.id);
                    dispatch(setSelectedTask(freshTask));
                } catch (fetchErr) {
                    console.error("Error reloading task:", fetchErr);
                    // Fallback to local update if fetch fails
                    dispatch(setSelectedTask(updatedTaskData));
                }

                if (onActionUpdated) onActionUpdated(); // Refresh calendar/list
                dispatch(incrementRefreshCounter()); // Global refresh
                alert("Guardado correctamente");

            } else if (panelMode === 'create') {
                const { id, ...createData } = actionForm;

                // Sanitize dates
                if (createData.fecha_ejecucion === "") createData.fecha_ejecucion = null;
                if (createData.fecha_fin === "") createData.fecha_fin = null;

                const res = await createAction(createData);
                const newAction = res && res[0] ? res[0] : res;
                if (onActionUpdated) onActionUpdated(newAction);
                dispatch(setSelectedAction(newAction));
                dispatch(incrementRefreshCounter()); // Global refresh

            } else if (panelMode === 'createTask') {
                const { id, proyecto, espacio, quickActions, fullActions, proyecto_id, ...createData } = taskForm;
                const taskPayload = {
                    ...createData,
                    project_id: proyecto_id || null,
                    espacio_uuid: taskForm.espacio_uuid || null,
                    finished: taskForm.finished || false,
                    staff_id: taskForm.staff_id || null,
                    Priority: taskForm.Priority || '1',
                    stage_id: taskForm.stage_id || null,
                    finished: taskForm.finished || 'Activa',
                    notes: taskForm.notes || '',
                    links_de_interes: taskForm.links_de_interes || '',
                    evidence_url: taskForm.evidence_url || ''
                };
                const newTask = await createTask(taskPayload);

                // Create full actions from parallelActions and concatenatedActions
                const allActions = [...parallelActions, ...concatenatedActions];
                if (allActions.length > 0) {
                    const actionPromises = allActions.map((fa, index) =>
                        createAction({
                            task_id: newTask.id,
                            description: fa.description,
                            fecha_ejecucion: fa.fecha_ejecucion || null,
                            fecha_fin: fa.fecha_fin || null,
                            executor_id: fa.executor_id || '',
                            ejecutor_texto: fa.ejecutor_texto || '',
                            completed: fa.completed || false,
                            requiere_aprobacion_ronald: fa.requiere_aprobacion_ronald || false,
                            requiere_aprobacion_wiet: fa.requiere_aprobacion_wiet || false,
                            requiere_aprobacion_alejo: fa.requiere_aprobacion_alejo || false,
                            es_paralela: fa.es_paralela || false,
                            porcentaje_duracion: fa.porcentaje_duracion || 0,
                            color_ui: fa.color_ui || '#3b82f6',
                            order: index
                        })
                    );
                    await Promise.all(actionPromises);
                }

                dispatch(setSelectedTask(newTask));
                if (onActionUpdated) onActionUpdated(); // Trigger calendar refresh
                dispatch(incrementRefreshCounter()); // Global refresh
                dispatch(clearSelection()); // Close panel after creation
            }
        } catch (error) {
            console.error(error);
            alert("Error al guardar: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteTask = async () => {
        if (!selectedTask?.id) return;
        if (!confirm('¿Eliminar esta tarea y todas sus acciones asociadas?')) return;

        setSaving(true);
        try {
            await deleteTask(selectedTask.id);
            dispatch(clearSelection());
            if (onActionUpdated) onActionUpdated(); // Refresh calendar
            dispatch(incrementRefreshCounter()); // Global refresh
        } catch (error) {
            alert('Error al eliminar tarea: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        dispatch(clearSelection());
        // Clean local state explicitly
        setTaskForm({});
        setParallelActions([]);
        setConcatenatedActions([]);
        setDayTasks([]);
        setIsCollapsed(false);
    };

    const handleCreateTaskForDay = () => {
        if (!selectedDate) return;
        // setTaskForm will happen in useEffect when the panel mode changes to createTask
        dispatch(setSelectedTask({
            task_description: '',
            fecha_inicio: selectedDate,
            fecha_fin_estimada: selectedDate,
            espacio_uuid: null,
            proyecto_id: null,
        }));
        // dispatch(initCreateTask(...)) - check if this action exists or just use panelMode?
        // Note: dispatching setSelectedTask with a draft should trigger the panel if panelMode is correct.
    };

    const handleSelectTask = (task) => {
        dispatch(setSelectedTask(task));
    };

    // Duplicate handler removed

    const handleCallResponsible = async () => {
        const caller = staffers.find(s => s.id === callerId);
        const called = staffers.find(s => s.id === calledStaffId);

        if (!selectedTask?.id) {
            alert("No hay una tarea seleccionada.");
            return;
        }

        if (!callerId || !calledStaffId) {
            alert("Por favor selecciona quién llama y a quién se llama.");
            return;
        }

        try {
            setSaving(true);
            await createCall({
                task_id: selectedTask.id,
                llamado_id: calledStaffId,
                llamador_name: caller?.name || 'Usuario',
                proyecto_id: taskForm.proyecto_id || (selectedTask.proyecto?.id),
                Comments: callComment
            });
            alert(`Llamado a ${called?.name} registrado.`);
            setCallComment('');
            dispatch(fetchPendingCallsCount());
        } catch (error) {
            alert("Error al registrar llamado: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCallSeguimiento = async (forceAll = false) => {
        // This function might be deprecated or updated to use the new logic
        // For now, let's keep it but it will use the comment field if available
        if (!selectedTask?.id) return;

        const targets = [];
        if (taskForm.AlejoPass) targets.push('112973d6-7f9e-4b48-b484-73eca526b905');
        if (taskForm.RonaldPass) targets.push('8971b42e-2856-4a92-9fdf-25e50b82ce43');
        if (taskForm.WietPass) targets.push('421e8b2b-881b-4664-9c27-8ea0e5b40284');

        if (targets.length === 0) {
            if (!forceAll) alert("No hay encargados de seguimiento seleccionados (Alejo, Ronald, Wiet).");
            return;
        }

        try {
            setSaving(true);
            const caller = staffers.find(s => s.id === callerId);
            const calls = targets.map(id => ({
                task_id: selectedTask.id,
                llamado_id: id,
                llamador_name: caller?.name || 'Sistema',
                proyecto_id: taskForm.proyecto_id || (selectedTask.proyecto?.id),
                Comments: callComment
            }));
            await createMultipleCalls(calls);
            alert(`Llamado a seguimiento registrado (${targets.length} personas).`);
            setCallComment('');
            dispatch(fetchPendingCallsCount());
        } catch (error) {
            alert("Error al registrar llamados: " + error.message);
        } finally {
            setSaving(false);
        }
    };

    const showPanel = ['action', 'task', 'create', 'createTask', 'day'].includes(panelMode);

    // Determine visibility and height classes
    // If not showing panel (no selection): translate-y-full (hidden)
    // If showing but collapsed: h-10 (header only)
    // If showing and open: h-[300px] 
    const isHidden = !showPanel;

    const containerClasses = `
        fixed bottom-0 left-0 right-0 
        bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] 
        z-50 flex flex-col transition-all duration-300 ease-in-out
        ${isHidden ? 'translate-y-full' : 'translate-y-0'}
        ${isCollapsed ? 'h-12' : 'h-[300px]'}
    `;

    return (
        <div className={containerClasses}>
            <InspectorHeader
                panelMode={panelMode}
                projects={projects}
                spaces={spaces}
                taskForm={taskForm}
                staffers={staffers}
                handleTaskChange={handleTaskChange}
                showCallDropdown={showCallDropdown}
                setShowCallDropdown={setShowCallDropdown}
                callerId={callerId}
                setCallerId={setCallerId}
                calledStaffId={calledStaffId}
                setCalledStaffId={setCalledStaffId}
                callComment={callComment}
                setCallComment={setCallComment}
                handleCallResponsible={handleCallResponsible}
                loading={loading}
                saving={saving}
                handlePrint={handlePrint}
                isCollapsed={isCollapsed}
                handleToggleCollapse={() => {
                    const newState = !isCollapsed;
                    dispatch(toggleInspectorCollapse(newState));
                    if (onCollapseChange) onCollapseChange(newState);
                }}
                handleDeleteTask={handleDeleteTask}
                handleSaveAction={handleSaveAction}
                handleClose={handleClose}
                selectedTask={selectedTask}
                selectedAction={selectedAction}
                selectedDate={selectedDate}
                showPanel={showPanel}
            />

            <div className="flex-1 overflow-hidden">
                {!showPanel ? (
                    <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                        Selecciona una acción o tarea
                    </div>
                ) : (
                    <div id="action-inspector-print-view" ref={printRef} className="h-full print-container">
                        {(panelMode === 'task' || panelMode === 'createTask') && (
                            <TaskView
                                panelMode={panelMode}
                                taskForm={taskForm}
                                handleTaskChange={handleTaskChange}
                                handleTaskCompletionToggle={handleTaskCompletionToggle}
                                projects={projects}
                                spaces={spaces}
                                setSpaces={setSpaces}
                                stages={stages}
                                staffers={staffers}
                                loading={loading}
                                concatenatedActions={concatenatedActions}
                                setConcatenatedActions={setConcatenatedActions}
                                parallelActions={parallelActions}
                                setParallelActions={setParallelActions}
                                selectedTask={selectedTask}
                                timelineContainerRef={timelineContainerRef}
                                isDraggingUI={isDraggingUI}
                                handleResizeStart={handleResizeStart}
                                handleDragStart={handleDragStart}
                                handleDragOver={handleDragOver}
                                handleDrop={handleDrop}
                                handleSubActionChange={handleSubActionChange}
                            />
                        )}

                        {panelMode === 'day' && (
                            <DayView
                                selectedDate={selectedDate}
                                dayTasks={dayTasks}
                                loading={loading}
                                handleCreateTaskForDay={handleCreateTaskForDay}
                                handleSelectTask={handleSelectTask}
                            />
                        )}

                        {(panelMode === 'action' || panelMode === 'create') && (
                            <ActionView
                                panelMode={panelMode}
                                actionForm={actionForm}
                                handleActionChange={handleActionChange}
                                handleActionCompletionToggle={handleActionCompletionToggle}
                                staffers={staffers}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ActionInspectorPanel;
