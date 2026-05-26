import React, { useState, useMemo, useEffect, useRef } from 'react';
import { handleNativePrint } from '../../utils/printUtils';
import { Home, MapPin, Save, Loader2, ExternalLink, Plus, Trash2, Calendar, CheckCircle, Clock, User, Search, X, ChevronDown, FileText } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getHouses, getParcels, updateProject, createProject, deleteProject } from '../../services/projectsService';
import { getTasksByProject, getStages } from '../../services/tasksService';
import { getSpaces, getStaffers, createSpace } from '../../services/spacesService';
import { setSelectedTask } from '../../store/actions/appActions';
import CalendarFilterBar from './CalendarFilterBar';
import PrintButton from '../common/PrintButton';
import HouseGanttModal from './ProjectTimeline/HouseGanttModal';
import HouseReportModal from '../Reports/HouseReportModal';
import SearchableSpaceSelector from '../common/SearchableSpaceSelector';

const HousesView = ({ mode }) => {
    const dispatch = useDispatch();
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { refreshCounter } = useSelector(state => state.app);
    // Determine view mode from prop or URL (fallback)
    const propertyView = mode || (location.pathname.startsWith('/parcels') ? 'parcels' : 'houses');
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [spaces, setSpaces] = useState([]);
    const [staffers, setStaffers] = useState([]);
    const [stages, setStages] = useState([]);
    const [projectTasks, setProjectTasks] = useState([]);
    const [loadingTasks, setLoadingTasks] = useState(false);
    const [taskSearch, setTaskSearch] = useState(''); // Search filter for tasks
    const [showGantt, setShowGantt] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [filters, setFilters] = useState({
        staffId: '',
        stageId: '',
        alejoPass: false,
        ronaldPass: false,
        wietPass: false,
        showConstruction: false // Default: No Construction
    });

    // Inline editing state
    const [formData, setFormData] = useState({
        name: '',
        responsable: '',
        finished: '',
        etapa: '',
        materialesConstantes: [],
        presentacionesEspacio: []
    });
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const printRef = useRef(null);
    const handlePrint = () => {
        handleNativePrint('houses-view-print-view', `Casa_${formData.name}`);
    };

    useEffect(() => {
        loadProjects();
        loadSpaces();
        loadFilterData();
    }, [propertyView]);

    const loadSpaces = async () => {
        try {
            const spacesData = await getSpaces();
            setSpaces(spacesData || []);
        } catch (error) {
            console.error('Error loading spaces:', error);
        }
    };

    const loadFilterData = async () => {
        try {
            const [staffData, stagesData] = await Promise.all([
                getStaffers(),
                getStages()
            ]);
            setStaffers(staffData || []);
            setStages(stagesData || []);
        } catch (error) { console.error(error); }
    };

    // URL Sync Effect: Handle Deep Linking
    useEffect(() => {
        if (!loading && projects.length > 0) {
            if (id) {
                const found = projects.find(p => p.id == id);
                if (found) {
                    setSelectedProject(found);
                    if (location.pathname.endsWith('/cronograma')) {
                        setShowGantt(true);
                    } else if (location.pathname.endsWith('/informe')) {
                        setShowReport(true);
                    }
                }
            } else {
                setSelectedProject(null);
            }
        }
    }, [id, projects, loading, location.pathname]);

    // Update URL when project is selected (Internal navigation)
    const handleProjectSelect = (project) => {
        const basePath = propertyView === 'parcels' ? '/parcels' : '/houses';
        navigate(`${basePath}/${project.id}`);
    };

    const handleOpenGantt = () => {
        const basePath = propertyView === 'parcels' ? '/parcels' : '/houses';
        if (selectedProject) {
            navigate(`${basePath}/${selectedProject.id}/cronograma`);
            setShowGantt(true);
        }
    };

    const handleOpenReport = () => {
        const basePath = propertyView === 'parcels' ? '/parcels' : '/houses';
        if (selectedProject) {
            navigate(`${basePath}/${selectedProject.id}/informe`);
            setShowReport(true);
        }
    };

    const handleCloseReport = () => {
        const basePath = propertyView === 'parcels' ? '/parcels' : '/houses';
        if (selectedProject) {
            navigate(`${basePath}/${selectedProject.id}`);
            setShowReport(false);
        }
    };

    const handleCloseGantt = () => {
        const basePath = propertyView === 'parcels' ? '/parcels' : '/houses';
        if (selectedProject) {
            navigate(`${basePath}/${selectedProject.id}`);
            setShowGantt(false);
        }
    };

    // Load form data when project is selected
    useEffect(() => {
        if (selectedProject) {
            const datos = parseData(selectedProject.Datos);

            // Resolve Responsable: Check if it's a UUID or Name on load
            let responsableId = selectedProject.responsable || '';

            // If it's a Name (not UUID), try to find ID from staffers list
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(responsableId);
            if (responsableId && !isUuid && staffers.length > 0) {
                const foundStaff = staffers.find(s => s.name === responsableId || s.nombre === responsableId);
                if (foundStaff) {
                    responsableId = foundStaff.id;
                }
            }

            setFormData({
                name: selectedProject.name || '',
                responsable: responsableId,
                finished: selectedProject.finished || '',
                etapa: datos?.etapa || '',
                materialesConstantes: datos?.materialesConstantes || [],
                presentacionesEspacio: datos?.presentacionesEspacio || []
            });
            setHasChanges(false);
            loadProjectTasks(selectedProject.id);
        }
    }, [selectedProject, refreshCounter, staffers]); // Added staffers dependency

    const loadProjectTasks = async (projectId) => {
        setLoadingTasks(true);
        try {
            const tasks = await getTasksByProject(projectId);
            setProjectTasks(tasks || []);
        } catch (error) {
            console.error('Error loading project tasks:', error);
        } finally {
            setLoadingTasks(false);
        }
    };

    const parseData = (datos) => {
        if (!datos) return {};
        try {
            return typeof datos === 'string' ? JSON.parse(datos) : datos;
        } catch {
            return {};
        }
    };

    const loadProjects = async () => {
        setLoading(true);
        try {
            if (propertyView === 'parcels') {
                const parcelData = await getParcels();
                setProjects(parcelData ? [parcelData] : []);
            } else {
                const housesData = await getHouses();
                setProjects(housesData || []);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!selectedProject?.id) return;

        setSaving(true);
        try {
            // Build update payload
            const existingDatos = parseData(selectedProject.Datos);
            const newDatos = {
                ...existingDatos,
                etapa: formData.etapa,
                materialesConstantes: formData.materialesConstantes,
                presentacionesEspacio: formData.presentacionesEspacio
            };

            const updates = {
                name: formData.name,
                // Explicitly handle UUID/FK fields to avoid sending "" to a UUID column
                responsable: (formData.responsable && formData.responsable.trim() !== '') ? formData.responsable : null,
                finished: (formData.finished && formData.finished.trim() !== '') ? formData.finished : null,
                Datos: newDatos
            };

            console.log("Saving Project Updates:", updates);

            await updateProject(selectedProject.id, updates);

            // Update local state
            const updatedProject = { ...selectedProject, ...updates };
            setProjects(prev => prev.map(p => p.id === selectedProject.id ? updatedProject : p));
            setSelectedProject(updatedProject);
            setHasChanges(false);
        } catch (error) {
            console.error('Error saving:', error);
            alert('Error al guardar: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCreateNewProject = async () => {
        const name = prompt('Nombre de la nueva casa:');
        if (!name || !name.trim()) return;

        setLoading(true);
        try {
            const newProj = await createProject({
                name: name.trim(),
                finished: 'Activo',
                Datos: { etapa: 'Planificación' }
            });
            setProjects(prev => [...prev, newProj].sort((a, b) => a.name.localeCompare(b.name)));
            setSelectedProject(newProj);
        } catch (error) {
            console.error('Error creating project:', error);
            alert('Error al crear casa: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async () => {
        if (!selectedProject?.id) return;
        if (!confirm(`¿Estás seguro de que deseas eliminar "${selectedProject.name}"? Esta acción no se puede deshacer.`)) return;

        setSaving(true);
        try {
            await deleteProject(selectedProject.id);
            setProjects(prev => prev.filter(p => p.id !== selectedProject.id));
            setSelectedProject(null);
        } catch (error) {
            console.error('Error deleting project:', error);
            alert('Error al eliminar casa: ' + error.message);
        } finally {
            setSaving(false);
        }
    };

    const getProjectEtapa = (project) => {
        const datos = parseData(project.Datos);
        return datos?.etapa || 'Sin etapa';
    };

    const getEtapaColor = (etapa) => {
        const colors = {
            'Planificación': 'bg-yellow-100 text-yellow-800',
            'Obra Negra': 'bg-gray-200 text-gray-800',
            'Acabados': 'bg-blue-100 text-blue-800',
            'Entrega': 'bg-green-100 text-green-800'
        };
        return colors[etapa] || 'bg-gray-100 text-gray-600';
    };

    // Materiales handlers
    const handleAddMaterial = () => {
        setFormData(prev => ({
            ...prev,
            materialesConstantes: [...prev.materialesConstantes, { categoria: '', nombre: '', observaciones: '' }]
        }));
        setHasChanges(true);
    };

    const handleUpdateMaterial = (index, field, value) => {
        setFormData(prev => {
            const updated = [...prev.materialesConstantes];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, materialesConstantes: updated };
        });
        setHasChanges(true);
    };

    const handleRemoveMaterial = (index) => {
        setFormData(prev => ({
            ...prev,
            materialesConstantes: prev.materialesConstantes.filter((_, i) => i !== index)
        }));
        setHasChanges(true);
    };

    // Canva Links handlers
    const handleAddLink = () => {
        setFormData(prev => ({
            ...prev,
            presentacionesEspacio: [...prev.presentacionesEspacio, { espacio: '', link: '', fechaActualizacion: '' }]
        }));
        setHasChanges(true);
    };

    const handleUpdateLink = (index, field, value) => {
        setFormData(prev => {
            const updated = [...prev.presentacionesEspacio];
            updated[index] = { ...updated[index], [field]: value };
            return { ...prev, presentacionesEspacio: updated };
        });
        setHasChanges(true);
    };

    const handleRemoveLink = (index) => {
        setFormData(prev => ({
            ...prev,
            presentacionesEspacio: prev.presentacionesEspacio.filter((_, i) => i !== index)
        }));
        setHasChanges(true);
    };

    const handleTaskClick = (task) => {
        dispatch(setSelectedTask(task));
    };

    return (
        <div className="h-full flex bg-white">
            {/* LEFT: SIDEBAR */}
            <div className="w-64 border-r border-gray-200 flex flex-col no-print">
                {/* Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
                            {propertyView === 'parcels' ? (
                                <><MapPin size={20} className="text-blue-600" /> Parcelación</>
                            ) : (
                                <><Home size={20} className="text-blue-600" /> Casas del Proyecto</>
                            )}
                        </h2>
                        <p className="text-xs text-gray-600">
                            {projects.length} {propertyView === 'parcels' ? 'proyecto' : 'casas'}
                        </p>
                    </div>
                    {propertyView !== 'parcels' && (
                        <button
                            onClick={handleCreateNewProject}
                            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            title="Nueva Casa"
                        >
                            <Plus size={16} strokeWidth={3} />
                        </button>
                    )}
                </div>

                {/* Projects List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-4 text-center text-sm text-gray-500">Cargando...</div>
                    ) : projects.length === 0 ? (
                        <div className="p-4 text-center text-sm text-gray-500">No hay proyectos</div>
                    ) : (
                        projects.map((project) => {
                            const etapa = getProjectEtapa(project);
                            return (
                                <button
                                    key={project.id}
                                    onClick={() => handleProjectSelect(project)}
                                    className={`
                                        w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-blue-50 transition-colors
                                        ${selectedProject?.id === project.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''}
                                    `}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                                            {propertyView === 'parcels' ? <MapPin size={20} className="text-blue-600" /> : <Home size={20} className="text-blue-600" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-sm text-gray-900 truncate">{project.name}</div>
                                            <span className={`inline-block mt-1 px-2 py-0.5 text-[10px] font-medium rounded-full ${getEtapaColor(etapa)}`}>
                                                {etapa}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* RIGHT: EDITOR PANEL */}
            <div id="houses-view-print-view" ref={printRef} className="flex-1 flex flex-col overflow-hidden bg-gray-50/30 print-container">
                {selectedProject ? (
                    <>
                        {/* Header Compacto */}
                        <div className="px-6 py-3 border-b border-gray-200 bg-white flex items-center justify-between flex-shrink-0 shadow-sm z-10">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-lg bg-blue-100/50 text-blue-600 flex items-center justify-center shadow-sm">
                                    <Home size={20} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-bold text-gray-900 leading-tight">{formData.name || 'Sin nombre'}</h3>
                                        <div className="flex items-center gap-1 no-print">
                                            <PrintButton
                                                onClick={handlePrint}
                                            />
                                            {propertyView !== 'parcels' && (
                                                <button
                                                    onClick={handleDeleteProject}
                                                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                                                    title="Eliminar Casa"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className={`inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded border ${getEtapaColor(formData.etapa)} bg-opacity-50 border-opacity-20`}>
                                            {formData.etapa || 'Sin etapa'}
                                        </span>
                                        <span className="text-[10px] text-gray-400">|</span>
                                        <span className="text-[10px] text-gray-500">{projectTasks.length} tareas</span>
                                        <span className="text-[10px] text-gray-400">|</span>
                                        <button
                                            onClick={handleOpenGantt}
                                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                                        >
                                            <Calendar size={10} /> Ver Cronograma
                                        </button>
                                        <span className="text-[10px] text-gray-400">|</span>
                                        <button
                                            onClick={handleOpenReport}
                                            className="text-[10px] font-bold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                                        >
                                            <FileText size={10} /> Informe
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving || !hasChanges}
                                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all shadow-sm no-print ${hasChanges ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow transform hover:-translate-y-0.5' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                            >
                                {saving ? <><Loader2 size={14} className="animate-spin" /> Guardando...</> : <><Save size={14} /> Guardar Cambios</>}
                            </button>
                        </div>

                        {/* Editor Form */}
                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="max-w-6xl mx-auto grid grid-cols-12 gap-6">
                                {/* Form Section */}
                                <div className="col-span-12 lg:col-span-7 space-y-6">
                                    {/* Info Grid - High Density */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-100 pb-2">Información General</h4>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                                            <div className="col-span-1">
                                                <label className="block text-[9px] font-bold text-gray-600 uppercase mb-1">Nombre del Proyecto</label>
                                                <input
                                                    type="text"
                                                    value={formData.name}
                                                    onChange={(e) => handleFieldChange('name', e.target.value)}
                                                    className="w-full px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50/50 focus:bg-white"
                                                />
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-[9px] font-bold text-gray-600 uppercase mb-1">Responsable</label>
                                                <select
                                                    value={formData.responsable}
                                                    onChange={(e) => handleFieldChange('responsable', e.target.value)}
                                                    className="w-full px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50/50 focus:bg-white"
                                                >
                                                    <option value="">- Seleccionar Responsable -</option>
                                                    {staffers.map(s => (
                                                        <option key={s.id} value={s.id}>{s.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-[9px] font-bold text-gray-600 uppercase mb-1">Etapa Actual</label>
                                                <select
                                                    value={formData.etapa}
                                                    onChange={(e) => handleFieldChange('etapa', e.target.value)}
                                                    className="w-full px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50/50 focus:bg-white"
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    <option value="Planificación">Planificación</option>
                                                    <option value="Obra Negra">Obra Negra</option>
                                                    <option value="Acabados">Acabados</option>
                                                    <option value="Entrega">Entrega</option>
                                                </select>
                                            </div>
                                            <div className="col-span-1">
                                                <label className="block text-[9px] font-bold text-gray-600 uppercase mb-1">Estado del Proyecto</label>
                                                <select
                                                    value={formData.finished}
                                                    onChange={(e) => handleFieldChange('finished', e.target.value)}
                                                    className="w-full px-2.5 py-1.5 text-xs font-medium border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50/50 focus:bg-white"
                                                >
                                                    <option value="">Seleccionar...</option>
                                                    <option value="Activo">Activo</option>
                                                    <option value="Pausado">Pausado</option>
                                                    <option value="completed">completed</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Canva Links */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Presentaciones (Canva)</h4>
                                            <button onClick={handleAddLink} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-100">
                                                <Plus size={12} strokeWidth={3} /> AGREGAR LINK
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {formData.presentacionesEspacio.map((pres, idx) => (
                                                <div key={idx} className="group flex items-center gap-2">
                                                    <div className="w-[45%]">
                                                        <SearchableSpaceSelector
                                                            value={pres.espacio}
                                                            onChange={(newVal) => handleUpdateLink(idx, 'espacio', newVal)}
                                                            projectId={selectedProject.id}
                                                            spaces={spaces}
                                                            onSpaceCreated={loadSpaces} // Reload spaces after creation
                                                        />
                                                    </div>
                                                    <div className="flex-1 flex items-center gap-2">
                                                        <input
                                                            type="url"
                                                            value={pres.link}
                                                            onChange={(e) => handleUpdateLink(idx, 'link', e.target.value)}
                                                            placeholder="Pegar link de Canva..."
                                                            className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors bg-gray-50/30 focus:bg-white"
                                                        />
                                                        {pres.link && (
                                                            <a href={pres.link} target="_blank" rel="noopener noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Abrir link">
                                                                <ExternalLink size={14} />
                                                            </a>
                                                        )}
                                                        <button onClick={() => handleRemoveLink(idx)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" title="Eliminar fila">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            {formData.presentacionesEspacio.length === 0 && (
                                                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                                    <p className="text-xs text-gray-400">No hay presentaciones vinculadas</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Materiales */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100">
                                            <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Materiales Constantes</h4>
                                            <button onClick={handleAddMaterial} className="flex items-center gap-1.5 px-2 py-1 text-[10px] font-bold text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-transparent hover:border-blue-100">
                                                <Plus size={12} strokeWidth={3} /> AGREGAR MATERIAL
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {formData.materialesConstantes.map((mat, idx) => (
                                                <div key={idx} className="group flex items-center gap-2">
                                                    <input
                                                        type="text"
                                                        value={mat.categoria}
                                                        onChange={(e) => handleUpdateMaterial(idx, 'categoria', e.target.value)}
                                                        placeholder="Categoría"
                                                        className="w-24 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/30 focus:bg-white transition-colors"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={mat.nombre}
                                                        onChange={(e) => handleUpdateMaterial(idx, 'nombre', e.target.value)}
                                                        placeholder="Nombre del material"
                                                        className="flex-1 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/30 focus:bg-white transition-colors"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={mat.observaciones}
                                                        onChange={(e) => handleUpdateMaterial(idx, 'observaciones', e.target.value)}
                                                        placeholder="Observaciones..."
                                                        className="w-32 px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-gray-50/30 focus:bg-white transition-colors"
                                                    />
                                                    <button onClick={() => handleRemoveMaterial(idx)} className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {formData.materialesConstantes.length === 0 && (
                                                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                                    <p className="text-xs text-gray-400">No hay materiales definidos</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Tasks Section Sidebar */}
                                <div className="col-span-12 lg:col-span-5 space-y-4">
                                    <div className="flex items-center justify-between gap-4">
                                        <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-widest flex items-center gap-2 flex-shrink-0">
                                            <Calendar size={12} className="text-blue-600" /> Tareas de la Casa
                                        </h4>
                                        <div className="relative flex-1 max-w-[200px]">
                                            <Search size={12} className="absolute left-2 top-1.5 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Buscar tarea..."
                                                value={taskSearch}
                                                onChange={(e) => setTaskSearch(e.target.value)}
                                                className="w-full pl-7 pr-2 py-1 text-[10px] border border-gray-200 rounded-md focus:outline-none focus:border-blue-300 bg-white"
                                            />
                                            {taskSearch && (
                                                <button
                                                    onClick={() => setTaskSearch('')}
                                                    className="absolute right-2 top-1.5 text-gray-400 hover:text-gray-600"
                                                >
                                                    <X size={10} />
                                                </button>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full flex-shrink-0">
                                            {projectTasks.filter(t => t.task_description?.toLowerCase().includes(taskSearch.toLowerCase())).length}
                                        </span>
                                    </div>



                                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                        <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-50 custom-scrollbar">
                                            {loadingTasks ? (
                                                <div className="p-8 text-center text-xs text-gray-500 flex flex-col items-center gap-2">
                                                    <Loader2 size={24} className="animate-spin text-blue-600" />
                                                    Cargando tareas...
                                                </div>
                                            ) : projectTasks.length === 0 ? (
                                                <div className="p-8 text-center text-xs text-gray-400 italic">No hay tareas para esta casa</div>
                                            ) : (
                                                projectTasks
                                                    .filter(task =>
                                                        !taskSearch ||
                                                        task.task_description?.toLowerCase().includes(taskSearch.toLowerCase())
                                                    )
                                                    .map(task => (
                                                        <button
                                                            key={task.id}
                                                            onClick={() => handleTaskClick(task)}
                                                            className="w-full text-left p-3 hover:bg-blue-50/50 transition-all group relative border-l-2 border-transparent hover:border-blue-500"
                                                        >
                                                            <div className="flex flex-col gap-1">
                                                                <div className={`font-medium text-xs text-gray-800 line-clamp-1 group-hover:text-blue-700 ${task.finished ? 'line-through text-gray-400' : ''}`}>
                                                                    {task.task_description}
                                                                </div>
                                                                <div className="flex items-center justify-between">
                                                                    <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                                                        <span className="flex items-center gap-1"><Clock size={10} /> {task.fecha_inicio}</span>
                                                                        {task.staff?.name && (
                                                                            <span className="flex items-center gap-1"><User size={10} /> {task.staff.name}</span>
                                                                        )}
                                                                    </div>
                                                                    {task.finished && <CheckCircle size={12} className="text-green-500" />}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Render Modal */}
                        {showGantt && (
                            <HouseGanttModal
                                isOpen={showGantt}
                                onClose={handleCloseGantt}
                                project={selectedProject}
                                tasks={projectTasks}
                            />
                        )}

                        {showReport && (
                            <HouseReportModal
                                isOpen={showReport}
                                onClose={handleCloseReport}
                                project={selectedProject}
                                tasks={projectTasks}
                            />
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        <div className="text-center p-8 border-2 border-dashed border-gray-100 rounded-3xl">
                            <Home size={64} className="mx-auto mb-4 opacity-10" />
                            <h3 className="text-xl font-bold text-gray-300 mb-1 tracking-tight">Gestión de Casas</h3>
                            <p className="text-sm max-w-xs">{propertyView === 'parcels' ? 'Selecciona la parcelación en la barra lateral para editar los detalles generales del proyecto.' : 'Selecciona una casa o crea una nueva para comenzar a gestionar sus detalles y tareas.'}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HousesView;
