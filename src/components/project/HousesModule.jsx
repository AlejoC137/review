import React, { useState, useEffect } from 'react';
import {
  Home, Plus, Search, ChevronRight, Trash2, MapPin, Clock,
  User, CheckCircle, Loader2, Activity, Calendar, X, AlertCircle,
  ExternalLink, FileText, Save, ListChecks, Layers, Building2, Box
} from 'lucide-react';
import { format } from 'date-fns';
import { projectService } from '../../services/projectService';
import { levelsService } from '../../services/levelsService';
import { useDispatch } from 'react-redux';
import { openInspector } from '../../store/uiSlice';
import SearchableSpaceSelector from '../common/SearchableSpaceSelector';
import HouseGanttModal from './HouseGanttModal';
import HouseReportModal from './HouseReportModal';
import SpacesView from '../../pages/SpacesView';
import ComponentsView from '../../pages/ComponentsView';

const Modal = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-[#1c1c19]/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border-2 border-[#1c1c19] w-full max-w-md shadow-[8px_8px_0_0_rgba(28,28,25,1)] animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-3 border-b-2 border-[#1c1c19] bg-[#f6f3ee]">
          <h3 className="text-[10px] font-black italic uppercase tracking-tighter">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-[#1c1c19] hover:text-white transition-colors border border-transparent hover:border-[#1c1c19]">
            <X size={14} strokeWidth={3} />
          </button>
        </div>
        <div className="p-4">
          {children}
        </div>
        {footer && (
          <div className="p-3 border-t-2 border-[#1c1c19] bg-[#f6f3ee] flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default function HousesModule({ project }) {
  const [selectedHouse, setSelectedHouse] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [houses, setHouses] = useState([]);
  const [houseTasks, setHouseTasks] = useState([]);
  const [stages, setStages] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState('proyecto');
  const [staffers, setStaffers] = useState([]);

  const [modals, setModals] = useState({
    addSpace: false,
    addTask: false,
    confirmDelete: null,
    gantt: false,
    report: false
  });

  const [detailForm, setDetailForm] = useState({
    name: '',
    responsable: '',
    etapa: '',
    materialesConstantes: [],
    presentacionesEspacio: [],
    hasChanges: false,
    saving: false
  });

  const [formData, setFormData] = useState({
    spaceName: '',
    taskTitle: '',
    submitting: false,
    error: null
  });

  const dispatch = useDispatch();

  const handleInspect = (item, type) => {
    dispatch(openInspector({ item, type }));
  };

  const loadData = async () => {
    if (!project?.id) return;
    try {
      setLoading(true);
      const [spacesData, stagesData, staffData, levelsData] = await Promise.all([
        projectService.getSpaces(project.id),
        projectService.getStages().catch(() => []),
        projectService.getStaff().catch(() => []),
        levelsService.getLevels(project.id).catch(() => [])
      ]);
      setHouses(spacesData || []);
      setStages(stagesData || []);
      setStaffers(staffData || []);
      setLevels(levelsData || []);
    } catch (error) {
      console.error("Error fetching project data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleUpdate = () => {
      loadData();
      if (selectedHouse?.id) {
        fetchSelectedHouseTasks(selectedHouse.id);
      }
    };
    window.addEventListener('taskUpdated', handleUpdate);
    return () => window.removeEventListener('taskUpdated', handleUpdate);
  }, [project?.id, selectedHouse?.id]);

  const fetchSelectedHouseTasks = async (houseId) => {
    if (!houseId) {
      setHouseTasks([]);
      return;
    }
    try {
      setTasksLoading(true);
      const tasks = await projectService.getTasksBySpace(houseId);
      setHouseTasks(tasks || []);
    } catch (error) {
      console.error("Error fetching house tasks:", error);
    } finally {
      setTasksLoading(false);
    }
  };

  useEffect(() => {
    fetchSelectedHouseTasks(selectedHouse?.id);

    if (selectedHouse) {
      let parsedDatos = {};
      try {
        parsedDatos = typeof selectedHouse.Datos === 'string' ? JSON.parse(selectedHouse.Datos) : (selectedHouse.Datos || {});
      } catch (e) { parsedDatos = {}; }

      setDetailForm({
        name: selectedHouse.name || '',
        responsable: selectedHouse.responsable || '',
        etapa: parsedDatos.etapa || 'Planificación',
        level_id: parsedDatos.level_id || '',
        materialesConstantes: parsedDatos.materialesConstantes || [],
        presentacionesEspacio: parsedDatos.presentacionesEspacio || [],
        hasChanges: false,
        saving: false
      });
    }
  }, [selectedHouse?.id]);

  const filteredHouses = houses.filter(h => h.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleDetailChange = (field, value) => {
    setDetailForm(prev => ({ ...prev, [field]: value, hasChanges: true }));
  };

  const handleAddMaterial = () => {
    setDetailForm(prev => ({
      ...prev,
      materialesConstantes: [...prev.materialesConstantes, { categoria: '', nombre: '', observaciones: '' }],
      hasChanges: true
    }));
  };

  const handleUpdateMaterial = (index, field, value) => {
    const updated = [...detailForm.materialesConstantes];
    updated[index] = { ...updated[index], [field]: value };
    setDetailForm(prev => ({ ...prev, materialesConstantes: updated, hasChanges: true }));
  };

  const handleRemoveMaterial = (index) => {
    setDetailForm(prev => ({
      ...prev,
      materialesConstantes: prev.materialesConstantes.filter((_, i) => i !== index),
      hasChanges: true
    }));
  };

  const handleAddLink = () => {
    setDetailForm(prev => ({
      ...prev,
      presentacionesEspacio: [...prev.presentacionesEspacio, { espacio: '', link: '', fechaActualizacion: '' }],
      hasChanges: true
    }));
  };

  const handleUpdateLink = (index, field, value) => {
    const updated = [...detailForm.presentacionesEspacio];
    updated[index] = { ...updated[index], [field]: value };
    setDetailForm(prev => ({ ...prev, presentacionesEspacio: updated, hasChanges: true }));
  };

  const handleRemoveLink = (index) => {
    setDetailForm(prev => ({
      ...prev,
      presentacionesEspacio: prev.presentacionesEspacio.filter((_, i) => i !== index),
      hasChanges: true
    }));
  };

  const handleSaveDetails = async () => {
    if (!selectedHouse?.id) return;
    try {
      setDetailForm(prev => ({ ...prev, saving: true }));
      const newDatos = {
        etapa: detailForm.etapa,
        level_id: detailForm.level_id,
        materialesConstantes: detailForm.materialesConstantes,
        presentacionesEspacio: detailForm.presentacionesEspacio
      };

      const updates = {
        name: detailForm.name,
        responsable: detailForm.responsable || null,
        Datos: JSON.stringify(newDatos)
      };

      await projectService.updateSpace(selectedHouse.id, updates);
      const updatedHouse = { ...selectedHouse, ...updates, stage: detailForm.etapa };
      setHouses(houses.map(h => h.id === selectedHouse.id ? updatedHouse : h));
      setSelectedHouse(updatedHouse);
      setDetailForm(prev => ({ ...prev, saving: false, hasChanges: false }));
    } catch (error) {
      console.error("Error saving details:", error);
      alert("Error al guardar cambios");
      setDetailForm(prev => ({ ...prev, saving: false }));
    }
  };

  const handleAddSpace = async () => {
    if (!formData.spaceName.trim()) return;
    try {
      setFormData({ ...formData, submitting: true, error: null });
      const newSpace = await projectService.createSpace({
        name: formData.spaceName,
        description: `${project.name} - Unidad ${formData.spaceName}`,
        espacios: [],
        Tasks: []
      });
      setHouses([...houses, newSpace]);
      setSelectedHouse(newSpace);
      setModals({ ...modals, addSpace: false });
      setFormData({ ...formData, spaceName: '', submitting: false });
    } catch (error) {
      console.error("Error creating sub-project:", error);
      setFormData({ ...formData, error: "No se pudo crear la unidad", submitting: false });
    }
  };

  const handleAddTask = async () => {
    if (!selectedHouse || !formData.taskTitle.trim()) return;
    try {
      setFormData({ ...formData, submitting: true, error: null });
      const newTask = await projectService.createTask({
        subproject_id: selectedHouse.id,
        description: formData.taskTitle,
        finished: false,
        priority: 'Media',
        progress: 0
      });
      setHouseTasks([newTask, ...houseTasks]);
      const updatedHouses = houses.map(h =>
        h.id === selectedHouse.id ? { ...h, tasks: (h.tasks || 0) + 1 } : h
      );
      setHouses(updatedHouses);
      setSelectedHouse({ ...selectedHouse, tasks: (selectedHouse.tasks || 0) + 1 });
      setModals({ ...modals, addTask: false });
      setFormData({ ...formData, taskTitle: '', submitting: false });
    } catch (error) {
      console.error("Error creating task:", error);
      setFormData({ ...formData, error: "No se pudo crear la tarea", submitting: false });
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("¿ELIMINAR ESTA TAREA?")) return;
    try {
      await projectService.deleteTask(taskId);
      setHouseTasks(houseTasks.filter(t => t.id !== taskId));
      const updatedHouses = houses.map(h =>
        h.id === selectedHouse.id ? { ...h, tasks: Math.max(0, (h.tasks || 0) - 1) } : h
      );
      setHouses(updatedHouses);
      setSelectedHouse({ ...selectedHouse, tasks: Math.max(0, (selectedHouse.tasks || 0) - 1) });
    } catch (error) {
      console.error("Error deleting task:", error);
      alert("Error al eliminar la tarea");
    }
  };

  const executeDelete = async () => {
    if (!modals.confirmDelete) return;
    try {
      setFormData({ ...formData, submitting: true });
      await projectService.deleteSpace(modals.confirmDelete);
      setHouses(houses.filter(h => h.id !== modals.confirmDelete));
      if (selectedHouse?.id === modals.confirmDelete) setSelectedHouse(null);
      setModals({ ...modals, confirmDelete: null });
    } catch (error) {
      console.error("Error deleting space:", error);
      setFormData({ ...formData, error: "Error al eliminar" });
      alert("No se pudo eliminar la unidad. Verifique si tiene tareas asociadas.");
    } finally {
      setFormData({ ...formData, submitting: false });
    }
  };

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#f6f3ee]">
      <Loader2 size={24} className="animate-spin text-[#0f4369]" />
    </div>
  );

  return (
    <div className="flex h-full bg-white overflow-hidden border-t border-[#1c1c19]/10 relative">
      {/* Sidebar - Extremedly Compact */}
      <div className="w-56 border-r border-[#1c1c19]/10 flex flex-col bg-[#fcf9f4]">
        <div className="p-2 border-b border-[#1c1c19]/10 bg-white">
          <div className="flex justify-between items-center mb-1.5">
            <h3 className="text-[9px] font-black uppercase tracking-widest opacity-40">SUB_PROYECTOS</h3>
            <button onClick={() => setModals({ ...modals, addSpace: true })} className="p-1 hover:bg-[#1c1c19] hover:text-white transition-all border border-[#1c1c19]/20">
              <Plus size={12} />
            </button>
          </div>
          <div className="relative">
            <Search size={10} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#72777f]" />
            <input
              type="text"
              placeholder="BUSCAR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-6 pr-2 py-1 bg-white border border-[#1c1c19]/20 text-[8px] font-mono uppercase focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredHouses.map(house => (
            <button
              key={house.id}
              onClick={() => setSelectedHouse(house)}
              className={`w-full text-left p-2.5 border-b border-[#1c1c19]/5 transition-all hover:bg-white flex items-center justify-between ${selectedHouse?.id === house.id ? 'bg-white border-r-4 border-r-[#0f4369] shadow-sm' : ''}`}
            >
              <span className="font-black text-[9px] uppercase truncate">{house.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Detail Panel - Maximized Space */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        {selectedHouse ? (
          <div className="relative h-full flex flex-col z-10">
            {/* Header Reducido al Mínimo */}
            <div className="px-4 py-3 border-b border-[#1c1c19]/10 bg-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">{selectedHouse.name}</h2>
                <div className="flex items-center gap-1">
                  <button onClick={() => setModals(prev => ({ ...prev, gantt: true }))} className="h-7 px-3 bg-white border border-[#1c1c19] text-[8px] font-black uppercase hover:bg-[#1c1c19] hover:text-white transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none min-w-[80px]">
                    CRONOGRAMA
                  </button>
                  <button onClick={() => setModals(prev => ({ ...prev, report: true }))} className="h-7 px-3 bg-white border border-[#1c1c19] text-[8px] font-black uppercase hover:bg-[#1c1c19] hover:text-white transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none min-w-[80px]">
                    INFORME
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleSaveDetails}
                  disabled={detailForm.saving || !detailForm.hasChanges}
                  className={`h-7 px-4 border border-[#1c1c19] font-black text-[8px] uppercase shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none transition-all flex items-center justify-center gap-2 min-w-[120px] ${detailForm.hasChanges ? 'bg-[#0f4369] text-white' : 'bg-gray-50 text-gray-400 opacity-40'}`}
                >
                  {detailForm.saving ? <Loader2 size={10} className="animate-spin" /> : <Save size={10} />}
                  GUARDAR_CAMBIOS
                </button>
                <button
                  onClick={() => setModals({ ...modals, confirmDelete: selectedHouse.id })}
                  className="h-7 w-7 border border-[#1c1c19] text-red-500 hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            <div className="px-4 border-b border-[#1c1c19]/10 flex gap-4">
              {[
                { id: 'proyecto', label: 'GENERAL', icon: <Layers size={10} /> },
                { id: 'tareas', label: 'ACTIVIDADES', icon: <ListChecks size={10} /> },
                { id: 'espacios', label: 'ESPACIOS', icon: <Building2 size={10} /> }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id)}
                  className={`py-2 px-1 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all relative ${activeSubTab === tab.id ? 'text-[#1c1c19]' : 'text-[#72777f] hover:text-[#1c1c19]'}`}
                >
                  {tab.icon} {tab.label}
                  {activeSubTab === tab.id && <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-[#1c1c19]" />}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto bg-[#fafafa]">
              {activeSubTab === 'espacios' ? (
                <SpacesView subProjectId={selectedHouse?.id} projectId={project?.id} />
              ) : activeSubTab === 'proyecto' ? (
                <div className="max-w-6xl mx-auto grid grid-cols-12 gap-3">
                  <div className="col-span-12 lg:col-span-4 space-y-3">
                    <div className="bg-white border border-[#1c1c19]/20 p-3 shadow-sm">
                      <h4 className="text-[8px] font-black text-[#1c1c19]/40 uppercase tracking-widest mb-2 italic">CONFIGURACIÓN</h4>
                      <div className="space-y-2">
                        <div>
                          <label className="block text-[7px] font-black text-[#72777f] uppercase mb-0.5">NOMBRE</label>
                          <input
                            type="text"
                             value={detailForm.name}
                             onChange={(e) => handleDetailChange('name', e.target.value)}
                             className="w-full px-2 py-1 text-[9px] font-black border border-[#1c1c19]/20 focus:border-[#1c1c19] outline-none italic"
                          />
                        </div>
                        <div>
                          <label className="block text-[7px] font-black text-[#72777f] uppercase mb-0.5">RESPONSABLE</label>
                          <select
                            value={detailForm.responsable}
                            onChange={(e) => handleDetailChange('responsable', e.target.value)}
                            className="w-full px-2 py-1 text-[9px] font-black border border-[#1c1c19]/20 focus:border-[#1c1c19] outline-none uppercase"
                          >
                            <option value="">NO_ASIGNADO</option>
                            {staffers.map(s => (
                              <option key={s.id} value={s.id}>{s.name || s.nombre}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[7px] font-black text-[#72777f] uppercase mb-0.5">ETAPA_ACTUAL</label>
                          <select
                            value={detailForm.etapa}
                            onChange={(e) => handleDetailChange('etapa', e.target.value)}
                            className="w-full px-2 py-1 text-[9px] font-black border border-[#1c1c19]/20 focus:border-[#1c1c19] outline-none uppercase"
                          >
                            <option value="Planificación">Planificación</option>
                            <option value="Obra Negra">Obra Negra</option>
                            <option value="Acabados">Acabados</option>
                            <option value="Entrega">Entrega</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[7px] font-black text-[#72777f] uppercase mb-0.5">NIVEL</label>
                          <select
                            value={detailForm.level_id}
                            onChange={(e) => handleDetailChange('level_id', e.target.value)}
                            className="w-full px-2 py-1 text-[9px] font-black border border-[#1c1c19]/20 focus:border-[#1c1c19] outline-none uppercase"
                          >
                            <option value="">SELECCIONAR_NIVEL</option>
                            {levels.map(l => (
                              <option key={l.id} value={l.id}>{l.nombre}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-[#1c1c19]/20 p-3 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[8px] font-black text-[#1c1c19]/40 uppercase tracking-widest italic">PRESENTACIONES</h4>
                        <button onClick={handleAddLink} className="p-1 text-[#0f4369] hover:bg-[#0f4369] hover:text-white transition-all border border-transparent">
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        {detailForm.presentacionesEspacio.map((pres, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 group">
                            <div className="w-1/2">
                              <SearchableSpaceSelector
                                value={pres.espacio}
                                onChange={(val) => handleUpdateLink(idx, 'espacio', val)}
                                spaces={selectedHouse.espacios || []}
                                className="h-[22px] text-[8px]"
                              />
                            </div>
                            <div className="flex-1 flex items-center gap-1">
                              <input
                                type="url"
                                value={pres.link}
                                onChange={(e) => handleUpdateLink(idx, 'link', e.target.value)}
                                placeholder="LINK..."
                                className="flex-1 px-1.5 py-0.5 text-[8px] font-mono border border-[#1c1c19]/10 outline-none"
                              />
                              <button onClick={() => handleRemoveLink(idx)} className="text-red-500 opacity-20 hover:opacity-100">
                                <Trash2 size={10} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="col-span-12 lg:col-span-8">
                    <div className="bg-white border border-[#1c1c19]/20 p-3">
                      <div className="flex items-center justify-between mb-2 pb-1 border-b border-[#1c1c19]/10">
                        <h4 className="text-[10px] font-black italic uppercase tracking-tighter">MATERIALES</h4>
                        <button onClick={handleAddMaterial} className="h-6 px-3 bg-[#1c1c19] text-white text-[7px] font-black uppercase italic transition-all flex items-center gap-1.5">
                          <Plus size={10} /> AGREGAR_ÍTEM
                        </button>
                      </div>
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-12 gap-2 px-1 text-[6px] font-black text-[#72777f] uppercase tracking-widest opacity-50">
                          <div className="col-span-3">CATEGORÍA</div>
                          <div className="col-span-5">ESPECIFICACIÓN_TÉCNICA</div>
                          <div className="col-span-4">OBSERVACIONES</div>
                        </div>
                        {detailForm.materialesConstantes.map((mat, idx) => (
                          <div key={idx} className="grid grid-cols-12 gap-2 group items-center">
                            <div className="col-span-3">
                              <input
                                type="text"
                                value={mat.categoria}
                                onChange={(e) => handleUpdateMaterial(idx, 'categoria', e.target.value.toUpperCase())}
                                className="w-full px-1.5 py-0.5 text-[8px] font-black border border-[#1c1c19]/10 outline-none italic bg-[#fcf9f4]"
                              />
                            </div>
                            <div className="col-span-5">
                              <input
                                type="text"
                                value={mat.nombre}
                                onChange={(e) => handleUpdateMaterial(idx, 'nombre', e.target.value.toUpperCase())}
                                className="w-full px-1.5 py-0.5 text-[8px] font-black border border-[#1c1c19]/10 outline-none"
                              />
                            </div>
                            <div className="col-span-3">
                              <input
                                type="text"
                                value={mat.observaciones}
                                onChange={(e) => handleUpdateMaterial(idx, 'observaciones', e.target.value.toUpperCase())}
                                className="w-full px-1.5 py-0.5 text-[8px] font-black border border-[#1c1c19]/10 outline-none italic opacity-50 focus:opacity-100"
                              />
                            </div>
                            <div className="col-span-1 flex justify-end">
                              <button onClick={() => handleRemoveMaterial(idx)} className="text-red-500 opacity-20 hover:opacity-100">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="max-w-6xl mx-auto">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-[#1c1c19]/10 pb-1.5">
                      <h4 className="text-[10px] font-black italic uppercase tracking-tighter">TAREAS</h4>
                      <button
                        onClick={() => setModals({ ...modals, addTask: true })}
                        className="h-6 px-3 bg-[#1c1c19] text-white text-[7px] font-black uppercase italic transition-all flex items-center gap-1.5"
                      >
                        <Plus size={10} /> NUEVA TAREA
                      </button>
                    </div>
                    <div className="space-y-2">
                      {tasksLoading ? (
                        <div className="py-4 flex justify-center"><Loader2 size={20} className="animate-spin text-[#0f4369]" /></div>
                      ) : (
                        <>
                          {/* Table Header */}
                          <div className="grid grid-cols-12 gap-4 px-3 py-2 bg-[#1c1c19] text-white text-[7px] font-black uppercase tracking-[0.2em] italic">
                            <div className="col-span-3">ACTIVIDAD / NOMBRE</div>
                            <div className="col-span-4">DESCRIPCIÓN TÉCNICA</div>
                            <div className="col-span-2">TIEMPO / DURACIÓN</div>
                            <div className="col-span-3 text-right">CRONOGRAMA_VITAL</div>
                          </div>

                          <div className="space-y-1">
                            {houseTasks.map((task, i) => {
                              const start = task.fecha_inicio ? new Date(task.fecha_inicio) : null;
                              const end = task.fecha_fin_estimada ? new Date(task.fecha_fin_estimada) : start;
                              const durationDays = (start && end) ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1 : 0;
                              
                              return (
                                <div
                                  key={task.id || i}
                                  onClick={() => handleInspect(task, 'TASK')}
                                  className="grid grid-cols-12 gap-4 items-center p-3 bg-white border border-[#1c1c19]/10 hover:border-[#1c1c19] transition-all cursor-pointer group hover:shadow-md"
                                >
                                  <div className="col-span-3 flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${task.finished ? 'bg-green-500' : 'bg-[#0f4369] shadow-[0_0_10px_rgba(15,67,105,0.3)] animate-pulse'}`} />
                                    <div>
                                      <p className="font-black text-[10px] leading-tight tracking-tighter">
                                        {task.name || "SIN_NOMBRE"}
                                      </p>
                                      <p className="text-[6px] font-bold text-[#72777f] uppercase opacity-50">
                                        REF: {task.id?.slice(0, 8)}
                                      </p>
                                    </div>
                                  </div>
                                  
                                  <div className="col-span-4">
                                    <p className="text-[9px] font-medium text-[#1c1c19]/80 line-clamp-2 leading-relaxed">
                                      {task.description || "NO_DESCRIPTION"}
                                    </p>
                                  </div>

                                  <div className="col-span-2">
                                    <div className="flex flex-col">
                                      <span className="text-[9px] font-black text-[#0f4369]">
                                        {durationDays} {durationDays === 1 ? 'DÍA' : 'DÍAS'}
                                      </span>
                                      <span className="text-[6px] font-bold text-[#72777f] uppercase tracking-widest">TIEMPO_ESTIMADO</span>
                                    </div>
                                  </div>

                                  <div className="col-span-3">
                                    <div className="flex flex-col items-end">
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[7px] font-black bg-[#f6f3ee] px-1.5 py-0.5 border border-[#1c1c19]/10">
                                          {start ? format(start, 'dd.MM.yy') : '--'}
                                        </span>
                                        <ChevronRight size={8} className="text-[#1c1c19]/30" />
                                        <span className="text-[7px] font-black bg-[#1c1c19] text-white px-1.5 py-0.5">
                                          {end ? format(end, 'dd.MM.yy') : '--'}
                                        </span>
                                      </div>
                                      <div className="w-full h-1 bg-[#f6f3ee] rounded-full overflow-hidden flex">
                                        <div className="h-full bg-[#0f4369]" style={{ width: `${Math.min(100, (durationDays / 30) * 100)}%` }}></div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-10">
            <h2 className="text-xl font-black italic uppercase tracking-tighter">SELECT_UNIT</h2>
          </div>
        )}
      </div>

      <Modal
        isOpen={modals.addSpace}
        onClose={() => setModals({ ...modals, addSpace: false })}
        title="NUEVA UNIDAD"
        footer={(
          <>
            <button onClick={() => setModals({ ...modals, addSpace: false })} className="px-3 py-1 font-black uppercase text-[8px] border border-[#1c1c19]">CANCELAR</button>
            <button onClick={handleAddSpace} disabled={formData.submitting || !formData.spaceName} className="px-3 py-1 font-black uppercase text-[8px] border border-[#1c1c19] bg-[#0f4369] text-white disabled:opacity-50 min-w-[80px]">CREAR</button>
          </>
        )}
      >
        <div>
          <label className="block text-[7px] font-black uppercase text-[#72777f] mb-1">ID_UNIDAD</label>
          <input
            type="text"
            placeholder="EJ: CASA-01"
            value={formData.spaceName}
            onChange={(e) => setFormData({ ...formData, spaceName: e.target.value.toUpperCase() })}
            className="w-full px-2 py-1.5 border border-[#1c1c19] font-black uppercase text-sm focus:bg-[#fcf9f4] outline-none"
            autoFocus
          />
        </div>
      </Modal>

      <Modal
        isOpen={modals.addTask}
        onClose={() => setModals({ ...modals, addTask: false })}
        title="NUEVA ACTIVIDAD"
        footer={(
          <>
            <button onClick={() => setModals({ ...modals, addTask: false })} className="px-3 py-1 font-black uppercase text-[8px] border border-[#1c1c19]">CANCELAR</button>
            <button onClick={handleAddTask} disabled={formData.submitting || !formData.taskTitle} className="px-3 py-1 font-black uppercase text-[8px] border border-[#1c1c19] bg-[#0f4369] text-white disabled:opacity-50 min-w-[80px]">GUARDAR</button>
          </>
        )}
      >
        <div>
          <label className="block text-[7px] font-black uppercase text-[#72777f] mb-1">DESCRIPCIÓN_TÉCNICA</label>
          <textarea
            rows={2}
            placeholder="ESPECIFIQUE..."
            value={formData.taskTitle}
            onChange={(e) => setFormData({ ...formData, taskTitle: e.target.value.toUpperCase() })}
            className="w-full px-2 py-1.5 border border-[#1c1c19] font-black uppercase text-[9px] focus:bg-[#fcf9f4] outline-none resize-none"
            autoFocus
          />
        </div>
      </Modal>

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <Modal
        isOpen={!!modals.confirmDelete}
        onClose={() => setModals({ ...modals, confirmDelete: null })}
        title="CONFIRMAR_ELIMINACIÓN"
        footer={(
          <>
            <button onClick={() => setModals({ ...modals, confirmDelete: null })} className="px-3 py-1 font-black uppercase text-[8px] border border-[#1c1c19]">CANCELAR</button>
            <button onClick={executeDelete} disabled={formData.submitting} className="px-3 py-1 font-black uppercase text-[8px] border border-[#1c1c19] bg-red-600 text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none min-w-[100px]">ELIMINAR_AHORA</button>
          </>
        )}
      >
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase italic text-red-600">¿ESTÁS SEGURO DE ELIMINAR ESTA UNIDAD?</p>
          <p className="text-[8px] font-bold text-[#72777f] uppercase leading-relaxed">Esta acción es permanente y eliminará todos los datos asociados a este sub-proyecto de la base de datos.</p>
        </div>
      </Modal>

      <HouseGanttModal isOpen={modals.gantt} onClose={() => setModals(m => ({ ...m, gantt: false }))} project={selectedHouse} tasks={houseTasks} />
      <HouseReportModal isOpen={modals.report} onClose={() => setModals(m => ({ ...m, report: false }))} project={selectedHouse} tasks={houseTasks} />
    </div>
  );
}
