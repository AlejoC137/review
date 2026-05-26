import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { closeInspector } from '../../store/uiSlice';
import { projectService } from '../../services/projectService';
import { spacesService } from '../../services/spacesService';

// Sub-components
import InspectorHeader from './ActionInspector/InspectorHeader';
import TaskView from './ActionInspector/TaskView';

export default function ActionInspectorPanel() {
   const { isOpen, item, type } = useSelector((state) => state.ui.inspector);
   const dispatch = useDispatch();

   const [editItem, setEditItem] = useState(null);
   const [concatenatedActions, setConcatenatedActions] = useState([]);
   const [parallelActions, setParallelActions] = useState([]);
   const [loading, setLoading] = useState(false);
   const [saving, setSaving] = useState(false);
   const [isMinimized, setIsMinimized] = useState(false);
   const [isDraggingUI, setIsDraggingUI] = useState(null);
   const draggingIndexRef = useRef(null);
   const [draggedIndex, setDraggedIndex] = useState(null);
   const [draggedType, setDraggedType] = useState(null);

   // Dropdowns data
   const [staffers, setStaffers] = useState([]);
   const [subProjects, setSubProjects] = useState([]);
   const [projects, setProjects] = useState([]);
   const [espacios, setEspacios] = useState([]);

   useEffect(() => {
      if (isOpen) {
         loadInitialData();
      }
   }, [isOpen]);

   useEffect(() => {
      if (item) {
         setEditItem({ ...item });
         loadTaskActions(item.id);
      }
   }, [item]);

   const loadInitialData = async () => {
      setLoading(true);
      try {
         const [staffData, spacesData, projectsData, allEspacios] = await Promise.all([
            projectService.getStaff().catch(e => { console.error("Staff fetch error:", e); return []; }),
            projectService.getSpaces().catch(e => { console.error("Spaces fetch error:", e); return []; }),
            projectService.getProjects().catch(e => { console.error("Projects fetch error:", e); return []; }),
            spacesService.getAllSpacesAndElements().catch(e => { console.error("Espacios fetch error:", e); return []; })
         ]);
         setStaffers(staffData);
         setSubProjects(spacesData);
         setProjects(projectsData);
         setEspacios(allEspacios);
      } catch (err) {
         console.error("Error loading initial data:", err);
      } finally {
         setLoading(false);
      }
   };

   const loadTaskActions = async (taskId) => {
      if (!taskId || taskId === 'new') {
         setConcatenatedActions([]);
         setParallelActions([]);
         return;
      }
      try {
         const actions = await projectService.getTaskActions(taskId);
         const cActions = actions.filter(a => !a.es_paralela);
         const pActions = actions.filter(a => a.es_paralela);

         // Balance concatenated actions if they are invalid (sum is not 100 or they have nulls)
         const sum = cActions.reduce((acc, a) => acc + (a.porcentaje_duracion || 0), 0);
         if (cActions.length > 0 && (Math.abs(sum - 100) > 1 || cActions.some(a => !a.porcentaje_duracion))) {
            const share = 100 / cActions.length;
            cActions.forEach(a => { a.porcentaje_duracion = share; });
         }

         setConcatenatedActions(cActions);
         setParallelActions(pActions);
      } catch (err) {
         console.error("Error loading task actions:", err);
      }
   };

   const handleFieldChange = async (field, value) => {
      const updates = { [field]: value };

      // Optimistic local update
      setEditItem(prev => ({ ...prev, ...updates }));

      // Auto-save logic for specific fields
      if (editItem?.id && (field === 'finished' || field.toLowerCase() === 'priority')) {
         try {
            await projectService.updateTask(editItem.id, updates);
            window.dispatchEvent(new CustomEvent('taskUpdated'));
         } catch (err) {
            console.error("Auto-save error:", err);
            // Revert local state on failure
            setEditItem(prev => ({ ...prev, [field]: editItem[field] }));
         }
      }

      // Handle side effects for double-linking (condiciona_a / condicionada_por)
      if (editItem?.id && (field === 'condiciona_a' || field === 'condicionada_por')) {
         try {
            const oldTargetId = editItem[field];
            if (value) {
               // Link the new target back to us
               const backField = field === 'condiciona_a' ? 'condicionada_por' : 'condiciona_a';
               await projectService.updateTask(value, { [backField]: editItem.id });
            }
            if (oldTargetId && oldTargetId !== value) {
               // Unlink the old target
               const backField = field === 'condiciona_a' ? 'condicionada_por' : 'condiciona_a';
               await projectService.updateTask(oldTargetId, { [backField]: null });
            }
         } catch (err) {
            console.error("Dependency sync error:", err);
         }
      }
   };

   const handleSubActionChange = async (index, field, value, listType) => {
      const isParallel = listType === 'parallel';
      const list = isParallel ? parallelActions : concatenatedActions;
      const setter = isParallel ? setParallelActions : setConcatenatedActions;

      // Optimistic local update
      const newList = list.map((a, i) => i === index ? { ...a, [field]: value } : a);
      setter(newList);

      // Auto-save for completion only
      if (field === 'completed' && newList[index].id) {
         try {
            await projectService.updateAction(newList[index].id, { completed: value });
         } catch (err) {
            console.error("Action auto-save error:", err);
            // Revert on failure
            setter(list.map((a, i) => i === index ? { ...a, [field]: !value } : a));
         }
      }
   };

   const handleDeleteSubAction = async (index, listType) => {
      const isParallel = listType === 'parallel';
      const list = isParallel ? parallelActions : concatenatedActions;
      const setter = isParallel ? setParallelActions : setConcatenatedActions;
      const action = list[index];

      if (!action) return;

      if (action._isNew) {
         setter(prev => prev.filter((_, i) => i !== index));
         return;
      }

      if (window.confirm('¿Eliminar esta acción?')) {
         try {
            await projectService.deleteAction(action.id);
            setter(prev => prev.filter((_, i) => i !== index));
         } catch (error) {
            alert('Error al eliminar: ' + error.message);
         }
      }
   };

   // Resizing logic for concatenated actions
   const timelineContainerRef = useRef(null);
   const concatenatedActionsRef = useRef(concatenatedActions);
   const parallelActionsRef = useRef(parallelActions);

   // Keep refs in sync with state
   useEffect(() => { concatenatedActionsRef.current = concatenatedActions; }, [concatenatedActions]);
   useEffect(() => { parallelActionsRef.current = parallelActions; }, [parallelActions]);

   const handleResizeMove = useCallback((e) => {
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

         let prevTasksWidth = 0;
         for (let i = 0; i < index; i++) {
            prevTasksWidth += getPerc(i);
         }

         let newCurrentPercentage = (mouseX / containerWidth) * 100 - prevTasksWidth;

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
   }, []);

   const handleResizeUp = useCallback(() => {
      draggingIndexRef.current = null;
      setIsDraggingUI(null);
      document.body.style.cursor = 'default';
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeUp);
   }, [handleResizeMove]);

   const handleResizeStart = useCallback((index, e) => {
      e.preventDefault();
      draggingIndexRef.current = index;
      setIsDraggingUI(index);
      document.body.style.cursor = 'col-resize';
      document.addEventListener('mousemove', handleResizeMove);
      document.addEventListener('mouseup', handleResizeUp);
   }, [handleResizeMove, handleResizeUp]);

   const handleDragEnd = () => {
      setDraggedIndex(null);
      setDraggedType(null);
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
      // Use refs to get fresh list, not stale closure
      const list = isParallel ? [...parallelActionsRef.current] : [...concatenatedActionsRef.current];
      const setter = isParallel ? setParallelActions : setConcatenatedActions;

      const draggedItem = list[draggedIndex];
      list.splice(draggedIndex, 1);
      list.splice(targetIndex, 0, draggedItem);

      setter(list);
      setDraggedIndex(null);
      setDraggedType(null);

      // Persist order to DB
      try {
         const updates = list
            .map((action, idx) => ({ id: action.id, order: idx }))
            .filter(a => a.id);
         if (updates.length > 0) {
            await Promise.all(updates.map(u => projectService.updateAction(u.id, { order: u.order })));
         }
      } catch (err) {
         console.error("Error saving action order:", err);
      }
   };

   const handleSave = async () => {
      if (!editItem) return;
      setSaving(true);
      try {
         let taskId = editItem.id;

         // 1. Update/Create Task (Strict Schema Compliance)
         // Aggressively sanitize taskUpdates to match public.tasks schema exactly.
         const taskUpdates = { ...editItem };
         
         // Remove non-existent columns and UI-only props
         const forbiddenKeys = [
            'staff', 'subProjects', 'stages', 'espacios', 
            'date', 'title', 'id', 'created_at', 'stage_id',
            'links_de_interes', 'bitacora'
         ];
         forbiddenKeys.forEach(key => delete taskUpdates[key]);

         // Convert empty strings to null for optional UUID/Date fields to avoid DB syntax errors
         Object.keys(taskUpdates).forEach(key => {
            if (taskUpdates[key] === "") {
               taskUpdates[key] = null;
            }
         });

         // Handle legacy string statuses for the 'finished' boolean column
         const finishedVal = String(taskUpdates.finished);
         if (finishedVal === 'PENDIENTE' || finishedVal === 'pendiente') {
            taskUpdates.finished = false;
         } else if (finishedVal === 'TERMINADO' || finishedVal === 'terminado') {
            taskUpdates.finished = true;
         }

         // Ensure mandatory fields
         if (!taskUpdates.description && taskUpdates.name) {
            taskUpdates.description = taskUpdates.name;
         }
         if (!taskUpdates.description) {
            taskUpdates.description = "SIN_DESCRIPCIÓN";
         }

         if (taskId && taskId !== 'new') {
            await projectService.updateTask(taskId, taskUpdates);
         } else {
            const newTask = await projectService.createTask(taskUpdates);
            taskId = newTask.id;
         }

         // 2. Update Actions (that are new or modified)
         const allActions = [...concatenatedActions, ...parallelActions];
         const actionPromises = allActions.map((action, idx) => {
            const { _isNew, ...actionData } = action;
            
            // Sanitize action data
            const finalActionData = {
               ...actionData,
               task_id: taskId,
               order: idx,
               porcentaje_duracion: action.es_paralela ? 0 : (action.porcentaje_duracion || (100 / concatenatedActions.length))
            };

            // Clean up empty UUID fields
            if (!finalActionData.executor_id || finalActionData.executor_id === '') {
               delete finalActionData.executor_id;
            }
            if (!finalActionData.staff_id || finalActionData.staff_id === '') {
               delete finalActionData.staff_id;
            }
            // Clean empty strings for other fields
            Object.keys(finalActionData).forEach(key => {
               if (finalActionData[key] === '') {
                  finalActionData[key] = null;
               }
            });

            if (_isNew) {
               return projectService.createAction(finalActionData);
            } else if (action.id) {
               return projectService.updateAction(action.id, finalActionData);
            }
            return Promise.resolve();
         });

          await Promise.all(actionPromises);

          // Critical: reload actions from DB to replace _isNew flags with real IDs
          // This prevents duplicates on subsequent saves
          await loadTaskActions(taskId);

          window.dispatchEvent(new CustomEvent('taskUpdated'));
          alert("Cambios guardados con éxito.");
      } catch (err) {
         console.error("Error saving snapshot:", err);
         alert("Error al guardar cambios: " + err.message);
      } finally {
         setSaving(false);
      }
   };

   const handleDelete = async () => {
      if (!editItem?.id) return;
      if (!window.confirm("¿Confirmas la eliminación total de esta tarea y sus protocolos?")) return;

      setSaving(true);
       try {
          await projectService.deleteTask(editItem.id);
          window.dispatchEvent(new CustomEvent('taskUpdated'));
          dispatch(closeInspector());
      } catch (err) {
         console.error("Error deleting task:", err);
         alert("Error al eliminar: " + err.message);
      } finally {
         setSaving(false);
      }
   };

   if (!isOpen || !editItem) return null;

   return (
      <div
         className={`fixed bottom-0 left-0 right-0 bg-white border-t-8 border-[#1c1c19] shadow-[0_-30px_100px_rgba(0,0,0,0.4)] z-[250] transition-all duration-500 ease-in-out flex flex-col ${isMinimized ? 'h-14' : 'h-[400px]'}`}
      >
         <InspectorHeader
            type={type}
            editItem={editItem}
            staffers={staffers}
            projects={projects}
            onFieldChange={handleFieldChange}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={() => dispatch(closeInspector())}
            isMinimized={isMinimized}
            setIsMinimized={setIsMinimized}
            saving={saving}
         />

         {!isMinimized && (
            <div className="flex-1 overflow-hidden">
               {loading ? (
                  <div className="h-full flex items-center justify-center bg-[#fcf9f4]">
                     <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 border-8 border-[#1c1c19] border-t-[#0f4369] rounded-full animate-spin"></div>
                        <span className="text-sm font-black uppercase tracking-[0.3em] text-[#72777f]">Compilando Arquitectura...</span>
                     </div>
                  </div>
               ) : (
                   <TaskView
                     editItem={editItem}
                     onTaskChange={handleFieldChange}
                     staffers={staffers}
                     subProjects={subProjects}
                     projects={projects}
                     espacios={espacios}
                     concatenatedActions={concatenatedActions}
                     setConcatenatedActions={setConcatenatedActions}
                     parallelActions={parallelActions}
                     setParallelActions={setParallelActions}
                     onSubActionChange={handleSubActionChange}
                     onDeleteSubAction={handleDeleteSubAction}
                     loading={loading}
                     // DnD & Resizing
                     timelineContainerRef={timelineContainerRef}
                     isDraggingUI={isDraggingUI}
                     handleResizeStart={handleResizeStart}
                     handleDragStart={handleDragStart}
                     handleDragOver={handleDragOver}
                     handleDrop={handleDrop}
                  />
               )}
            </div>
         )}
      </div>
   );
}
