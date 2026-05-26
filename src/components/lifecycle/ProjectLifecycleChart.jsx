import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, ArrowUp, ChevronLeft, User, Calendar, Save, Edit2, ChevronRight, Trash2 } from 'lucide-react';
import LifecycleItem from './LifecycleItem';
import { lifecycleService } from '../../services/lifecycleService';

function ProjectLifecycleChart() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [stages, setStages] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [totalRows, setTotalRows] = useState(8);
  const [isResizingHeight, setIsResizingHeight] = useState(false);

  const [project, setProject] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedProject, setEditedProject] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projects = await lifecycleService.getProjects();
        const currentProject = projects.find(p => p.id === projectId);
        if (!currentProject) {
          navigate(-1);
          return;
        }
        setProject(currentProject);
        // El total_rows viene del objeto lifecycles unido
        const initialRows = currentProject.lifecycles?.total_rows || 8;
        setTotalRows(initialRows);

        setEditedProject({
          name: currentProject.name,
          responsible_party: currentProject.responsible_party || '',
          start_date: currentProject.start_date || '',
          end_date: currentProject.end_date || ''
        });

        const [stagesData, activitiesData] = await Promise.all([
          lifecycleService.getStages(currentProject.lifecycle_id),
          lifecycleService.getActivities(projectId)
        ]);
        setStages(stagesData);
        setActivities(activitiesData);
      } catch (err) {
        console.error("Error al cargar datos:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [projectId, navigate]);

  const handleSaveProjectMetadata = async () => {
    setIsSaving(true);
    try {
      const updated = await lifecycleService.updateProject(projectId, editedProject);
      setProject(updated);
      setEditMode(false);
    } catch (err) {
      alert("Error al guardar cambios");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateStage = async () => {
    const name = window.prompt("Nombre de la nueva etapa:", "Nueva Etapa");
    if (!name) return;
    try {
      const newStage = await lifecycleService.createStage({
        lifecycle_id: project.lifecycle_id,
        name: name,
        order_index: stages.length,
        estimated_days: 14
      });
      setStages([...stages, newStage]);
    } catch (err) {
      console.error("Error al crear etapa:", err);
    }
  };

  const handleUpdateStage = async (id, updates) => {
    try {
      const updated = await lifecycleService.updateStage(id, updates);
      setStages(stages.map(s => s.id === id ? updated : s));
    } catch (err) {
      console.error("Error al actualizar etapa:", err);
    }
  };

  const handleDeleteStage = async (stageToDelete, idx) => {
    if (!window.confirm(`¿Seguro que quieres eliminar "${stageToDelete.name}"? Las actividades se ajustarán.`)) return;
    try {
      await lifecycleService.deleteStage(stageToDelete.id);

      // Ajustar actividades: remover de esta etapa y desplazar indices posteriores
      const updatedActivities = activities.map(a => {
        let newStart = a.start_stage_index;
        let newEnd = a.end_stage_index;

        if (a.start_stage_index === idx && a.end_stage_index === idx) {
          // Estaba solo en esta etapa -> Borrar o mover a previa? 
          // Borraremos por ahora para simplificar logic o mover a la anterior si existe
          return { ...a, _toDelete: true };
        }

        if (a.start_stage_index > idx) newStart--;
        if (a.end_stage_index >= idx) newEnd--;
        if (newEnd < newStart) newEnd = newStart;

        return { ...a, start_stage_index: newStart, end_stage_index: newEnd };
      });

      // Borrar huérfanas
      const toDeleteIds = updatedActivities.filter(a => a._toDelete).map(a => a.id);
      await Promise.all(toDeleteIds.map(id => lifecycleService.deleteActivity(id)));

      const finalActivities = updatedActivities.filter(a => !a._toDelete);
      await lifecycleService.updateActivitiesBatch(finalActivities);

      // Reorderar etapas locales
      const remainingStages = stages.filter(s => s.id !== stageToDelete.id)
        .map((s, i) => ({ ...s, order_index: i }));

      setStages(remainingStages);
      setActivities(finalActivities);
    } catch (err) {
      console.error("Error al eliminar etapa:", err);
    }
  };

  const handleMoveStage = async (idx, direction) => {
    const newIdx = idx + direction;
    if (newIdx < 0 || newIdx >= stages.length) return;

    try {
      const newStages = [...stages];
      const [movedStage] = newStages.splice(idx, 1);
      newStages.splice(newIdx, 0, movedStage);

      const finalStages = newStages.map((s, i) => ({ ...s, order_index: i }));

      // Actualizar actividades sincronizadamente
      const updatedActivities = activities.map(a => {
        let ns = a.start_stage_index;
        let ne = a.end_stage_index;

        // Si la actividad estaba en la etapa i paseada a i+1:
        const swapStage = (val) => {
          if (val === idx) return newIdx;
          if (val === newIdx) return idx;
          return val;
        }

        return { ...a, start_stage_index: swapStage(ns), end_stage_index: swapStage(ne) };
      });

      setStages(finalStages);
      setActivities(updatedActivities);

      // Persistir
      await Promise.all([
        lifecycleService.updateActivitiesBatch(updatedActivities),
        ...finalStages.map(s => lifecycleService.updateStage(s.id, { order_index: s.order_index }))
      ]);
    } catch (err) {
      console.error("Error al mover etapa:", err);
    }
  };

  const handleDeleteActivity = async (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar esta actividad?")) return;
    try {
      await lifecycleService.deleteActivity(id);
      setActivities(activities.filter(a => a.id !== id));
    } catch (err) {
      console.error("Error al eliminar actividad:", err);
    }
  };

  const handleUpdateActivity = async (id, updates) => {
    try {
      const updated = await lifecycleService.updateActivity(id, updates);
      setActivities(activities.map(a => a.id === id ? updated : a));
    } catch (err) {
      console.error("Error al actualizar actividad:", err);
    }
  };

  const handleTotalRowsChange = async (newVal) => {
    const val = parseInt(newVal);
    setTotalRows(val);
    try {
      await lifecycleService.updateLifecycle(project.lifecycle_id, { total_rows: val });
    } catch (err) {
      console.error("Error al guardar número de filas:", err);
    }
  };

  const handleResizeHeightDown = (e) => {
    e.stopPropagation();
    setIsResizingHeight(true);

    const startY = e.clientY;
    const initialRows = totalRows;
    const rowHeight = 55;
    let finalRows = initialRows; // Rastrear el valor más reciente

    const onMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const extraRows = Math.round(deltaY / rowHeight);
      const nextRows = Math.max(4, Math.min(24, initialRows + extraRows));
      finalRows = nextRows;
      setTotalRows(nextRows);
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setIsResizingHeight(false);
      // Persistir el valor final rastreado
      handleTotalRowsChange(finalRows);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleAddActivity = async (stageIndex = 0) => {
    const name = window.prompt("Nombre de la nueva actividad:");
    if (!name) return;
    try {
      const newActivity = await lifecycleService.createActivity({
        project_id: projectId,
        lifecycle_id: project.lifecycle_id,
        name: name,
        start_stage_index: stageIndex,
        end_stage_index: stageIndex,
        specificity_level: 1
      });
      setActivities([...activities, newActivity]);
    } catch (err) {
      console.error("Error al crear actividad:", err);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#fcf9f4] flex flex-col items-center justify-center font-mono text-[#1c1c19] italic font-black animate-pulse">
      CALIBRATING_INSTRUMENTS...
    </div>
  );

  return (
    <div className="relative bg-[#fcf9f4] flex flex-col font-sans text-[#1c1c19]">
      <div className="fixed inset-0 pointer-events-none opacity-40" style={{
        backgroundImage: 'radial-gradient(circle at center, rgba(28, 28, 25, 0.1) 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }} />

      <header className="relative z-40 bg-[#fcf9f4] border-b-2 border-[#1c1c19] p-6 shadow-[0_4px_0_0_rgba(28,28,25,0.05)]">
        <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="flex items-start gap-6">
            <button onClick={() => navigate(-1)} className="bg-white border-2 border-[#1c1c19] p-2 hover:bg-[#e5e2dd] shadow-[4px_4px_0_0_rgba(28,28,25,1)] transition-all">
              <ChevronLeft size={24} strokeWidth={3} />
            </button>
            <div className="flex flex-col gap-1">
              {editMode ? (
                <input className="text-4xl font-black italic tracking-tighter uppercase bg-transparent border-b-2 border-black focus:outline-none" value={editedProject.name} onChange={e => setEditedProject({ ...editedProject, name: e.target.value })} />
              ) : (
                <h1 className="text-4xl font-black italic tracking-tighter uppercase italic">{project?.name}</h1>
              )}
              <span className="font-mono text-[9px] font-black tracking-widest bg-[#1c1c19] text-white px-2 py-0.5 w-fit uppercase">INFRA_ID: {project?.id}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 bg-[#f6f3ee] border-2 border-[#1c1c19] p-4 shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
            <div className="flex flex-col gap-1 pr-6 border-r-2 border-[#1c1c19]/10">
              <div className="flex items-center gap-2 text-[10px] font-black text-[#0f4369] uppercase font-mono"><User size={12} strokeWidth={3} /> RESPONSABLES</div>
              {editMode ? <input className="text-xs font-bold bg-white border border-black/20 p-1" value={editedProject.responsible_party} onChange={e => setEditedProject({ ...editedProject, responsible_party: e.target.value })} /> : <div className="text-xs font-bold uppercase truncate max-w-[200px]">{project?.responsible_party || 'S_ASSIGN'}</div>}
            </div>
            <div className="flex flex-col gap-1 pr-6 border-r-2 border-[#1c1c19]/10">
              <div className="flex items-center gap-2 text-[10px] font-black text-[#0f4369] uppercase font-mono"><Calendar size={12} strokeWidth={3} /> INICIO</div>
              {editMode ? <input type="date" className="text-xs font-bold bg-white border border-black/20 p-1" value={editedProject.start_date} onChange={e => setEditedProject({ ...editedProject, start_date: e.target.value })} /> : <div className="text-xs font-bold uppercase">{project?.start_date || 'YYYY-MM-DD'}</div>}
            </div>
            <div className="flex flex-col gap-1 pr-4">
              <div className="flex items-center gap-2 text-[10px] font-black text-[#0f4369] uppercase font-mono"><Calendar size={12} strokeWidth={3} /> FINAL</div>
              {editMode ? <input type="date" className="text-xs font-bold bg-white border border-black/20 p-1" value={editedProject.end_date} onChange={e => setEditedProject({ ...editedProject, end_date: e.target.value })} /> : <div className="text-xs font-bold uppercase">{project?.end_date || 'YYYY-MM-DD'}</div>}
            </div>
            <button onClick={editMode ? handleSaveProjectMetadata : () => setEditMode(true)} className="ml-auto bg-[#0f4369] text-white p-2.5 hover:bg-[#1c1c19] transition-all">
              {isSaving ? <div className="animate-spin text-white">...</div> : editMode ? <Save size={20} /> : <Edit2 size={20} />}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 relative p-12 overflow-x-auto overflow-y-visible" style={{ minWidth: '1200px' }}>
        <div className="absolute left-6 top-0 bottom-0 flex flex-col justify-between py-24 z-10 pointer-events-none opacity-20">
          <ArrowUp className="text-[#1c1c19]" strokeWidth={3} />
          <div className="[writing-mode:vertical-lr] rotate-180 text-[10px] font-black font-mono uppercase tracking-[6px]">SPECIFICITY_LOD</div>
        </div>

        <div
          className="relative border-[3px] border-[#1c1c19] bg-white shadow-[12px_12px_0_0_rgba(28,28,25,0.05)] transition-all duration-300"
          style={{ width: 'max-content', minWidth: '100%', height: `${totalRows * 55 + 100}px` }}
        >
          <div className="absolute inset-0 pointer-events-none" style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, 250px)`, gridTemplateRows: `repeat(${totalRows * 2}, 1fr)`, padding: '24px', columnGap: '16px', rowGap: '0' }}>
            {stages.map((_, i) => <div key={`v-${i}`} className="border-r border-[#1c1c19]/60 h-full" style={{ gridRow: `1 / span ${totalRows * 2}` }} />)}
            {Array.from({ length: totalRows }).map((_, i) => <div key={`h-${i}`} className="border-b border-[#1c1c19]/60 w-full" style={{ gridRow: (i + 1) * 2 }} />)}

            {/* Patrón de puntos ultra-visibles sincronizados con sub-niveles (27.5px de alto) */}
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, rgba(15,67,105,0.8) 1.5px, transparent 1.5px)',
              backgroundSize: '24px 27.5px',
              backgroundPosition: '0 13.75px' 
            }} />
          </div>

          <div className="relative h-full w-full" style={{ display: 'grid', gridTemplateColumns: `repeat(${stages.length}, 250px)`, gridTemplateRows: `repeat(${totalRows * 2}, 1fr)`, padding: '24px', columnGap: '16px', rowGap: '0' }}>
            {/* BOTÓN "+" DESLIGADO Y PEQUEÑO (Fuera del flujo de etapas principales) */}
            <div
              onClick={handleCreateStage}
              className="absolute -right-4 top-8 flex items-center justify-center w-8 h-8 rounded-full border-2 border-dashed border-[#1c1c19]/30 hover:border-[#1c1c19] hover:bg-white cursor-pointer transition-all text-[#1c1c19]/40 hover:text-[#1c1c19] shadow-sm hover:shadow-md z-50 bg-[#fcf9f4]"
              title="Añadir nueva etapa"
            >
              <Plus size={14} strokeWidth={4} />
            </div>

            {stages.map((stage, idx) => (
              <div key={stage.id} style={{ gridColumn: idx + 1, gridRow: 1 }} className="group relative flex flex-col items-stretch justify-start">
                {/* TÍTULO COMPACTO (REDUCCIÓN DE ESCALA) */}
                <div className="relative z-10 bg-white border-[2px] border-[#1c1c19] p-4 shadow-[4px_4px_0_0_rgba(28,28,25,1)] mb-2 transition-transform hover:-translate-x-1 hover:-translate-y-1">
                  {/* CONTROLES DE ETAPA */}
                  <div className="absolute -top-3 -right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white border-2 border-black p-1 shadow-[2px_2px_0_0_rgba(0,0,0,1)]">
                    <button onClick={(e) => { e.stopPropagation(); handleMoveStage(idx, -1); }} disabled={idx === 0} className="p-1 hover:bg-[#1c1c19] hover:text-white rounded disabled:opacity-20"><ChevronLeft size={10} strokeWidth={3} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleMoveStage(idx, 1); }} disabled={idx === stages.length - 1} className="p-1 hover:bg-[#1c1c19] hover:text-white rounded disabled:opacity-20"><ChevronRight size={10} strokeWidth={3} /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteStage(stage, idx); }} className="p-1 text-red-600 hover:bg-red-600 hover:text-white rounded"><Trash2 size={10} /></button>
                  </div>

                  <h2
                    onClick={() => { const newName = window.prompt("Nombre de etapa:", stage.name); if (newName) handleUpdateStage(stage.id, { name: newName }); }}
                    className="text-lg font-black italic uppercase tracking-tighter cursor-pointer hover:text-[#0f4369] leading-none"
                  >
                    {stage.name}
                  </h2>
                </div>

                {/* BARRA NEGRA AÑADIR COMPACTA */}
                <button
                  onClick={() => handleAddActivity(idx)}
                  className="flex items-center justify-center gap-2 bg-[#1c1c19] text-white py-2 border-[2px] border-[#1c1c19] hover:bg-[#0f4369] transition-all shadow-[2px_2px_0_0_rgba(28,28,25,0.2)]"
                >
                  <span className="text-[14px] font-black">+</span>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em]">AÑADIR</span>
                </button>
              </div>
            ))}

            {activities.map(activity => (
              <LifecycleItem key={activity.id} activity={activity} stagesCount={stages.length} totalRows={totalRows} onUpdate={handleUpdateActivity} onDelete={handleDeleteActivity} />
            ))}

            {/* TIRADOR PARA AJUSTAR ALTO (RESIZER) - INFERIOR */}
            <div
              onMouseDown={handleResizeHeightDown}
              className="absolute bottom-0 left-0 right-0 h-6 cursor-ns-resize group/resizer flex items-center justify-center -mb-3 z-[60]"
            >
              <div className="w-24 h-1 bg-[#1c1c19]/20 group-hover/resizer:bg-[#0f4369] transition-all rounded-full" />
              {isResizingHeight && (
                <div className="absolute top-8 bg-[#1c1c19] text-white px-3 py-1 text-[10px] font-black font-mono uppercase tracking-widest shadow-[6px_6px_0_0_rgba(209,164,87,1)]">
                  EXPANDING_GRID_LOD_{totalRows}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-between items-center px-4 font-mono text-[10px] font-black opacity-30 text-[#1c1c19] tracking-[6px] uppercase">
          <span>SYSTEM_TIMELINE_STAGES</span>
          <ArrowRight strokeWidth={3} />
        </div>
      </main>

    </div>
  );
}

export default ProjectLifecycleChart;
