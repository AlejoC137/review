import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Info, Edit2, Save, X, Calendar, User, Briefcase, FileText, 
  Layers, Package, Users, Target, ClipboardList, Loader2, CheckCircle2, PlayCircle, AlertCircle, 
  MapPin, HelpCircle, LayoutGrid, CheckSquare, Plus, Trash2, Award, Cpu, Database, Monitor, Star
} from 'lucide-react';
import { lifecycleService } from '../../services/lifecycleService';
import { projectService } from '../../services/projectService';
import { supabase } from '../../services/supabaseClient';
import LodTdiMatrix from './LodTdiMatrix';
import ProjectUnitsTab from './ProjectUnitsTab';
import ProjectObjectivesModule from './ProjectObjectivesModule';
import ProjectDeliveryScheduleTab from './ProjectDeliveryScheduleTab';

const defaultPebInfo = {
  client: 'Grupo Attia',
  code: 'CCWE-E2',
  location: 'Medellín, Antioquia',
  department: 'Antioquia',
  city: 'Medellín',
  scope: 'Desarrollo de diseños técnicos de la Etapa 2',
  typology: 'Uso Residencial',
  modules: ['Gimnasio', 'Zonas húmedas', 'Áreas sociales y de recreación'],
  lot_area: 5000.00,
  sales_area: 2500.00,
  built_area: 3500.00,
  circulation_area: 1000.00,
  additional_info: 'Proyecto piloto de resort turístico de lujo integrando técnicas tradicionales japonesas de madera con tecnología BIM moderna.',
  tdi_correlation: 'TDI_A (General Project Info)',
  oir_pir_compliance: 'Requisitos de Información Organizacional (OIR) y Requisitos de Información del Proyecto (PIR)',
  bim_uses: ['Coordinación 3D', 'Cuantificación 5D'],
  software_principal: 'Revit',
  version_software: '2025',
  uso_del_modelo: 'Coordinación 3D, Extracción de cantidades',
  entorno_comun_de_datos_cde: 'Autodesk Construction Cloud'
};

export default function ProjectDataModule({ project, onTabChange }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [projectData, setProjectData] = useState(project);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [subTab, setSubTab] = useState(searchParams.get('subtab') || 'resumen');

  useEffect(() => {
    const currentSubTab = searchParams.get('subtab');
    if (currentSubTab) {
      setSubTab(currentSubTab);
    }
  }, [searchParams]);

  const handleSubTabChange = (newSubTab) => {
    setSubTab(newSubTab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('subtab', newSubTab);
      return next;
    });
  };

  // Multi-Software List States
  const [softwareList, setSoftwareList] = useState([]);
  const [loadingSoftware, setLoadingSoftware] = useState(false);
  const [editingSoftwareId, setEditingSoftwareId] = useState(null); // null = not editing, 'new' = adding new
  const [softwareForm, setSoftwareForm] = useState({
    id: null,
    software_principal: '',
    version_software: '',
    uso_del_modelo: '',
    entorno_comun_de_datos_cde: '',
    formatos: '',
    politica_version: '',
    es_software_primario: false
  });

  const defaultSoftwareList = [
    {
      id: 'default-1',
      software_principal: 'Revit',
      version_software: '2025',
      uso_del_modelo: 'Modelado BIM — Arquitectura, Estructura, Instalaciones, Protección contra incendios y Seguridad',
      entorno_comun_de_datos_cde: 'Autodesk Construction Cloud (ACC)',
      formatos: '.RVT',
      politica_version: 'Versión previa a la actualmente vigente. El equipo técnico define el periodo anual de actualización.',
      es_software_primario: true,
      orden: 0
    },
    {
      id: 'default-2',
      software_principal: 'Navisworks Manage',
      version_software: '2025',
      uso_del_modelo: 'Coordinación 3D y Detección de interferencias (Clash Detection) — Equipo BIM y Coordinación Técnica',
      entorno_comun_de_datos_cde: 'Autodesk Construction Cloud (ACC)',
      formatos: '.NWC / .NWF / .NWD',
      politica_version: 'Versión previa a la actualmente vigente.',
      es_software_primario: false,
      orden: 1
    }
  ];

  // PEB General Info States
  const [pebInfo, setPebInfo] = useState(null);
  const [isEditingPeb, setIsEditingPeb] = useState(false);
  const [pebForm, setPebForm] = useState({
    client: '',
    code: '',
    location: '',
    department: '',
    city: '',
    scope: '',
    typology: '',
    modules: [],
    lot_area: 0,
    sales_area: 0,
    built_area: 0,
    circulation_area: 0,
    additional_info: '',
    tdi_correlation: '',
    oir_pir_compliance: '',
    bim_uses: []
  });

  // Array inputs temp state
  const [newModule, setNewModule] = useState('');
  const [newBimUse, setNewBimUse] = useState('');
  
  // Stats states
  const [stats, setStats] = useState({
    subProjects: 0,
    staff: 0,
    requirements: 0,
    protocols: 0,
    contacts: 0,
    tasks: 0
  });
  const [loadingStats, setLoadingStats] = useState(false);

  // Edit form state for general projects
  const [form, setForm] = useState({
    name: '',
    description: '',
    finished: 'active',
    responsible_party: '',
    start_date: '',
    end_date: ''
  });

  const fetchFreshData = async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      if (project.id === 'kengo-kuma') {
        // Fallback for static project demo
        setProjectData({
          id: 'kengo-kuma',
          name: 'KENGO KUMA RESORT',
          description: 'Proyecto piloto de resort turístico de lujo integrando técnicas tradicionales japonesas de madera con tecnología BIM moderna.',
          finished: 'active',
          responsible_party: 'Kengo Kuma Associates / Arq. Alejandro',
          start_date: '2026-01-10',
          end_date: '2027-12-15'
        });
        setLoading(false);
        return;
      }

      const projects = await lifecycleService.getProjects();
      const found = projects.find(p => p.id === project.id);
      if (found) {
        setProjectData(found);
      }
    } catch (err) {
      console.error("Error fetching project data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!project?.id) return;
    setLoadingStats(true);
    try {
      const [sp, staff, reqs, prot, cont, tasks] = await Promise.all([
        projectService.getSpaces(project.id).catch(() => []),
        projectService.getStaff().catch(() => []),
        projectService.getInformationRequirements(project.id).catch(() => []),
        projectService.getProtocols(project.id).catch(() => []),
        projectService.getDirectoryContacts(project.id).catch(() => []),
        projectService.getTasks(project.id).catch(() => [])
      ]);

      // Exclude reference requirements (project_id IS NULL) and Plantillas
      const projectReqs = (reqs || []).filter(r => r.project_id !== null && r.category !== 'Plantillas');

      setStats({
        subProjects: sp?.length || 0,
        staff: staff?.length || 0,
        requirements: projectReqs.length,
        protocols: prot?.length || 0,
        contacts: cont?.length || 0,
        tasks: tasks?.length || 0
      });
    } catch (err) {
      console.error("Error loading stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchPebInfo = async () => {
    if (!project?.id) return;
    const localKey = `peb_info_${project.id}`;
    const localSaved = localStorage.getItem(localKey);

    try {
      const { data, error } = await supabase
        .from('project_general_info')
        .select('*')
        .eq('project_id', project.id)
        .maybeSingle();

      if (error) throw error;
      if (data) {
        // Enforce department and city defaults if they came back null
        let dept = data.department;
        let cityVal = data.city;
        if (!dept && !cityVal && data.location && data.location.includes(',')) {
          const parts = data.location.split(',');
          cityVal = parts[0]?.trim() || '';
          dept = parts[1]?.trim() || '';
        }
        setPebInfo({
          ...data,
          department: dept || 'Antioquia',
          city: cityVal || 'Medellín',
          additional_info: data.additional_info || '',
          software_principal: data.software_principal || 'Revit',
          version_software: data.version_software || '2025',
          uso_del_modelo: data.uso_del_modelo || 'Coordinación 3D, Extracción de cantidades',
          entorno_comun_de_datos_cde: data.entorno_comun_de_datos_cde || 'Autodesk Construction Cloud'
        });
      } else if (localSaved) {
        setPebInfo(JSON.parse(localSaved));
      } else {
        setPebInfo({
          project_id: project.id,
          ...defaultPebInfo
        });
      }
    } catch (err) {
      console.warn("Using local fallback for PEB info:", err);
      if (localSaved) {
        setPebInfo(JSON.parse(localSaved));
      } else {
        setPebInfo({
          project_id: project.id,
          ...defaultPebInfo
        });
      }
    }
  };

  useEffect(() => {
    fetchFreshData();
    fetchStats();
    fetchPebInfo();
    fetchSoftwareList();
  }, [project?.id]);

  const startEdit = () => {
    setForm({
      name: projectData.name || '',
      description: projectData.description || '',
      finished: projectData.finished || 'active',
      responsible_party: projectData.responsible_party || '',
      start_date: projectData.start_date || '',
      end_date: projectData.end_date || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      if (projectData.id === 'kengo-kuma') {
        setProjectData({
          ...projectData,
          ...form
        });
        setIsEditing(false);
        alert("Datos de demostración actualizados localmente.");
        return;
      }

      const updated = await lifecycleService.updateProject(projectData.id, form);
      setProjectData({
        ...projectData,
        ...updated
      });
      setIsEditing(false);
      window.dispatchEvent(new CustomEvent('projectUpdated', { detail: updated }));
    } catch (err) {
      console.error("Error updating project:", err);
      alert("Error al actualizar los datos del proyecto.");
    } finally {
      setLoading(false);
    }
  };

  // ======================================================
  // MULTI-SOFTWARE CRUD FUNCTIONS
  // ======================================================

  const SOFT_LOCAL_KEY = () => `project_software_${project?.id}`;

  const fetchSoftwareList = async () => {
    if (!project?.id) return;
    setLoadingSoftware(true);
    const localKey = SOFT_LOCAL_KEY();
    try {
      const { data, error } = await supabase
        .from('project_software')
        .select('*')
        .eq('project_id', project.id)
        .order('orden', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        setSoftwareList(data);
        localStorage.setItem(localKey, JSON.stringify(data));
      } else {
        const local = localStorage.getItem(localKey);
        setSoftwareList(local ? JSON.parse(local) : defaultSoftwareList);
      }
    } catch (err) {
      console.warn('fetchSoftwareList fallback:', err);
      const local = localStorage.getItem(localKey);
      setSoftwareList(local ? JSON.parse(local) : defaultSoftwareList);
    } finally {
      setLoadingSoftware(false);
    }
  };

  const openAddSoftware = () => {
    setSoftwareForm({ id: null, software_principal: '', version_software: '', uso_del_modelo: '', entorno_comun_de_datos_cde: '', formatos: '', politica_version: '', es_software_primario: false });
    setEditingSoftwareId('new');
  };

  const openEditSoftware = (sw) => {
    setSoftwareForm({ ...sw });
    setEditingSoftwareId(sw.id);
  };

  const cancelSoftwareEdit = () => {
    setEditingSoftwareId(null);
  };

  const handleSaveSoftwareEntry = async () => {
    if (!softwareForm.software_principal.trim()) {
      alert('El campo "Software Principal" es obligatorio.');
      return;
    }
    setLoadingSoftware(true);
    const localKey = SOFT_LOCAL_KEY();
    const isNew = editingSoftwareId === 'new';
    const newId = isNew ? crypto.randomUUID() : editingSoftwareId;
    const entry = {
      ...softwareForm,
      id: newId,
      project_id: project.id,
      orden: isNew ? softwareList.length : (softwareForm.orden ?? softwareList.findIndex(s => s.id === editingSoftwareId))
    };

    let updatedList;
    if (isNew) {
      updatedList = [...softwareList, entry];
    } else {
      updatedList = softwareList.map(s => s.id === editingSoftwareId ? entry : s);
    }

    // Save locally immediately
    setSoftwareList(updatedList);
    localStorage.setItem(localKey, JSON.stringify(updatedList));
    setEditingSoftwareId(null);

    try {
      const { data, error } = await supabase
        .from('project_software')
        .upsert({ ...entry }, { onConflict: 'id' })
        .select();
      if (error) throw error;
    } catch (err) {
      console.warn('Software save fallback (localStorage):', err);
    } finally {
      setLoadingSoftware(false);
    }
  };

  const handleDeleteSoftware = async (id) => {
    if (!window.confirm('¿Eliminar este software de la lista?')) return;
    const localKey = SOFT_LOCAL_KEY();
    const updatedList = softwareList.filter(s => s.id !== id);
    setSoftwareList(updatedList);
    localStorage.setItem(localKey, JSON.stringify(updatedList));
    try {
      await supabase.from('project_software').delete().eq('id', id);
    } catch (err) {
      console.warn('Delete software fallback:', err);
    }
  };

  const handleMarkPrimary = async (id) => {
    const localKey = SOFT_LOCAL_KEY();
    const updatedList = softwareList.map(s => ({ ...s, es_software_primario: s.id === id }));
    setSoftwareList(updatedList);
    localStorage.setItem(localKey, JSON.stringify(updatedList));
    try {
      // Unmark all, then mark the selected one
      await supabase.from('project_software').update({ es_software_primario: false }).eq('project_id', project.id);
      await supabase.from('project_software').update({ es_software_primario: true }).eq('id', id);
    } catch (err) {
      console.warn('Mark primary fallback:', err);
    }
  };

  // ======================================================

  const startEditPeb = () => {
    let dept = pebInfo.department || '';
    let cityVal = pebInfo.city || '';
    if (!dept && !cityVal && pebInfo.location && pebInfo.location.includes(',')) {
      const parts = pebInfo.location.split(',');
      cityVal = parts[0]?.trim() || '';
      dept = parts[1]?.trim() || '';
    }

    setPebForm({
      client: pebInfo.client || '',
      code: pebInfo.code || '',
      location: pebInfo.location || '',
      department: dept || 'Antioquia',
      city: cityVal || 'Medellín',
      scope: pebInfo.scope || '',
      typology: pebInfo.typology || '',
      modules: pebInfo.modules || [],
      lot_area: pebInfo.lot_area || 0,
      sales_area: pebInfo.sales_area || 0,
      built_area: pebInfo.built_area || 0,
      circulation_area: pebInfo.circulation_area || 0,
      additional_info: pebInfo.additional_info || '',
      tdi_correlation: pebInfo.tdi_correlation || '',
      oir_pir_compliance: pebInfo.oir_pir_compliance || '',
      bim_uses: pebInfo.bim_uses || [],
      software_principal: pebInfo.software_principal || 'Revit',
      version_software: pebInfo.version_software || '2025',
      uso_del_modelo: pebInfo.uso_del_modelo || 'Coordinación 3D, Extracción de cantidades',
      entorno_comun_de_datos_cde: pebInfo.entorno_comun_de_datos_cde || 'Autodesk Construction Cloud'
    });
    setIsEditingPeb(true);
  };

  const handleSavePeb = async () => {
    const locationCombined = `${pebForm.city}, ${pebForm.department}`;
    const payload = {
      project_id: project.id,
      ...pebForm,
      location: locationCombined,
      updated_at: new Date().toISOString()
    };
    
    // Save locally
    localStorage.setItem(`peb_info_${project.id}`, JSON.stringify(payload));
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('project_general_info')
        .upsert(payload, { onConflict: 'project_id' })
        .select()
        .single();
        
      if (error) {
        console.warn("Supabase upsert failed, saving to localStorage as fallback:", error.message);
        setPebInfo(payload);
        alert("Los datos se guardaron en la memoria local del navegador (la tabla de Supabase aún no se ha creado o no hay permisos).");
      } else {
        // Enforce department and city defaults if they came back null
        let dept = data.department;
        let cityVal = data.city;
        if (!dept && !cityVal && data.location && data.location.includes(',')) {
          const parts = data.location.split(',');
          cityVal = parts[0]?.trim() || '';
          dept = parts[1]?.trim() || '';
        }
        setPebInfo({
          ...data,
          department: dept || 'Antioquia',
          city: cityVal || 'Medellín',
          additional_info: data.additional_info || '',
          software_principal: data.software_principal || 'Revit',
          version_software: data.version_software || '2025',
          uso_del_modelo: data.uso_del_modelo || 'Coordinación 3D, Extracción de cantidades',
          entorno_comun_de_datos_cde: data.entorno_comun_de_datos_cde || 'Autodesk Construction Cloud'
        });
        alert("Información General del PEB actualizada exitosamente.");
      }
      setIsEditingPeb(false);
    } catch (err) {
      console.error("Error saving PEB info:", err);
      setPebInfo(payload);
      alert("Guardado temporalmente en la memoria del navegador.");
      setIsEditingPeb(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAddModule = () => {
    if (!newModule.trim()) return;
    setPebForm(prev => ({
      ...prev,
      modules: [...prev.modules, newModule.trim()]
    }));
    setNewModule('');
  };

  const handleRemoveModule = (index) => {
    setPebForm(prev => ({
      ...prev,
      modules: prev.modules.filter((_, i) => i !== index)
    }));
  };

  const handleAddBimUse = () => {
    if (!newBimUse.trim()) return;
    setPebForm(prev => ({
      ...prev,
      bim_uses: [...prev.bim_uses, newBimUse.trim()]
    }));
    setNewBimUse('');
  };

  const handleRemoveBimUse = (index) => {
    setPebForm(prev => ({
      ...prev,
      bim_uses: prev.bim_uses.filter((_, i) => i !== index)
    }));
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-500 text-white text-[10px] font-black uppercase tracking-wider border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
            <CheckCircle2 size={12} strokeWidth={2.5} /> Completado
          </span>
        );
      case 'paused':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 text-white text-[10px] font-black uppercase tracking-wider border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
            <AlertCircle size={12} strokeWidth={2.5} /> Pausado
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 bg-[#0f4369] text-white text-[10px] font-black uppercase tracking-wider border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
            <PlayCircle size={12} strokeWidth={2.5} /> Activo
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white border-2 border-[#1c1c19] overflow-hidden relative">
      {/* Grid Pattern overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at center, rgba(28, 28, 25, 0.8) 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />

      {/* Header */}
      <div className="p-6 border-b-2 border-[#1c1c19] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#f6f3ee] z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(28,28,25,1)]">
            <Info size={20} />
          </div>
          <div>
            <span className="text-[7px] font-black text-[#72777f] uppercase tracking-[0.3em] mb-0.5 opacity-50 italic">
              PANEL_DE_INFORMACION / {projectData?.name?.toUpperCase()}
            </span>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">
              Datos del Proyecto
            </h2>
          </div>
        </div>

        {/* Sub-tab Selection */}
        <div className="flex bg-white border-2 border-[#1c1c19] p-0.5 shadow-[3px_3px_0_0_rgba(28,28,25,1)]">
          <button 
            onClick={() => handleSubTabChange('resumen')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${subTab === 'resumen' ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#f6f3ee]'}`}
          >
            Resumen Operativo
          </button>
          <button 
            onClick={() => handleSubTabChange('peb_info')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${subTab === 'peb_info' ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#f6f3ee]'}`}
          >
            Información General PEB
          </button>
          <button 
            onClick={() => handleSubTabChange('software')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${subTab === 'software' ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#f6f3ee]'}`}
          >
            Software y Plataformas
          </button>
          <button 
            onClick={() => handleSubTabChange('lod_tdi')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${subTab === 'lod_tdi' ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#f6f3ee]'}`}
          >
            Matriz LOD y TDI
          </button>
          <button 
            onClick={() => handleSubTabChange('objetivos')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${subTab === 'objetivos' ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#f6f3ee]'}`}
          >
            Objetivos del Proyecto
          </button>
          <button 
            onClick={() => handleSubTabChange('unidades')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${subTab === 'unidades' ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#f6f3ee]'}`}
          >
            Unidades y Formatos
          </button>
          <button 
            onClick={() => handleSubTabChange('cronograma')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${subTab === 'cronograma' ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#f6f3ee]'}`}
          >
            Cronograma Entregas
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 z-10">
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-50">
            <Loader2 className="animate-spin text-[#0f4369]" size={36} />
          </div>
        )}

        {subTab === 'resumen' ? (
          /* ========================================================================= */
          /* PESTAÑA 1: RESUMEN OPERATIVO */
          /* ========================================================================= */
          isEditing ? (
            /* Formulario de Edición General */
            <div className="max-w-3xl bg-[#f6f3ee] border-2 border-[#1c1c19] p-8 shadow-[8px_8px_0_0_rgba(28,28,25,1)] space-y-6">
              <div className="flex justify-between items-center border-b-2 border-[#1c1c19] pb-4">
                <h3 className="text-lg font-black uppercase tracking-tight italic">Modificar Información General</h3>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-2 border-2 border-[#1c1c19] bg-white hover:bg-gray-100 transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-black text-[10px] uppercase shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    <Save size={14} /> Guardar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-[#72777f] block mb-1">Nombre del Proyecto</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full p-3 bg-white border-2 border-[#1c1c19] text-sm font-bold uppercase tracking-wide focus:outline-none focus:border-[#0f4369]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-[#72777f] block mb-1">Responsable(s)</label>
                  <input
                    type="text"
                    value={form.responsible_party}
                    onChange={e => setForm({ ...form, responsible_party: e.target.value })}
                    placeholder="Ej. Ing. Juan Pérez / Arq. María García"
                    className="w-full p-3 bg-white border-2 border-[#1c1c19] text-sm font-bold focus:outline-none focus:border-[#0f4369]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-[#72777f] block mb-1">Estado</label>
                  <select
                    value={form.finished}
                    onChange={e => setForm({ ...form, finished: e.target.value })}
                    className="w-full p-3 bg-white border-2 border-[#1c1c19] text-sm font-bold uppercase focus:outline-none focus:border-[#0f4369]"
                  >
                    <option value="active">Activo</option>
                    <option value="completed">Completado</option>
                    <option value="paused">Pausado</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-[#72777f] block mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={form.start_date}
                    onChange={e => setForm({ ...form, start_date: e.target.value })}
                    className="w-full p-3 bg-white border-2 border-[#1c1c19] text-sm font-bold font-mono focus:outline-none focus:border-[#0f4369]"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-[#72777f] block mb-1">Fecha de Finalización</label>
                  <input
                    type="date"
                    value={form.end_date}
                    onChange={e => setForm({ ...form, end_date: e.target.value })}
                    className="w-full p-3 bg-white border-2 border-[#1c1c19] text-sm font-bold font-mono focus:outline-none focus:border-[#0f4369]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-[10px] font-black uppercase text-[#72777f] block mb-1">Descripción / Brief</label>
                  <textarea
                    value={form.description}
                    onChange={e => setForm({ ...form, description: e.target.value })}
                    rows={4}
                    className="w-full p-3 bg-white border-2 border-[#1c1c19] text-sm font-semibold focus:outline-none focus:border-[#0f4369] resize-none"
                    placeholder="Describa el alcance general del proyecto..."
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Vista de Detalles Generales */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Tarjeta Principal de Información */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border-2 border-[#1c1c19] p-8 shadow-[6px_6px_0_0_rgba(28,28,25,1)] relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#0f4369]/5 rounded-bl-full pointer-events-none" />
                  
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-[#1c1c19]/10 pb-4 mb-6">
                    <div className="space-y-1">
                      <span className="text-[9px] font-black tracking-widest text-[#72777f] uppercase font-mono">PROYECTO_ACTIVO</span>
                      <h3 className="text-3xl font-black uppercase tracking-tight text-[#1c1c19] leading-tight">
                        {projectData.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={startEdit}
                        className="flex items-center gap-1.5 px-3 py-1 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-black text-[9px] uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                      >
                        <Edit2 size={10} /> Editar
                      </button>
                      {getStatusBadge(projectData.finished)}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="p-4 bg-[#f6f3ee] border-2 border-[#1c1c19]/10 font-mono">
                      <div className="text-[8px] font-black uppercase tracking-wider text-[#72777f] mb-1.5 flex items-center gap-1.5">
                        <User size={10} className="text-[#0f4369]" /> Responsable del Proyecto
                      </div>
                      <div className="text-xs font-bold text-[#1c1c19] uppercase">
                        {projectData.responsible_party || 'Sin asignar'}
                      </div>
                    </div>

                    <div className="p-4 bg-[#f6f3ee] border-2 border-[#1c1c19]/10 font-mono">
                      <div className="text-[8px] font-black uppercase tracking-wider text-[#72777f] mb-1.5 flex items-center gap-1.5">
                        <Calendar size={10} className="text-[#0f4369]" /> Duración / Fechas
                      </div>
                      <div className="text-xs font-bold text-[#1c1c19] flex items-center gap-2">
                        <span>{projectData.start_date ? new Date(projectData.start_date).toLocaleDateString() : 'NO_INICIO'}</span>
                        <span className="opacity-55">•</span>
                        <span>{projectData.end_date ? new Date(projectData.end_date).toLocaleDateString() : 'NO_FINAL'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">Descripción del Proyecto</h4>
                    <p className="text-sm text-slate-700 leading-relaxed font-medium bg-[#fcf9f4] p-4 border border-[#1c1c19]/15">
                      {projectData.description || 'No hay una descripción registrada para este proyecto. Presione el botón "Editar Datos" para agregar información detallada sobre el alcance, objetivos y brief del proyecto.'}
                    </p>
                  </div>
                </div>

                {/* Template Lifecycle Details */}
                {projectData.lifecycles && (
                  <div className="bg-[#f6f3ee] border-2 border-[#1c1c19] p-6 shadow-[6px_6px_0_0_rgba(28,28,25,0.05)]">
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#72777f] mb-3">
                      <Layers size={14} className="text-[#0f4369]" /> Esquema de Ciclo de Vida Vinculado
                    </div>
                    <h4 className="text-lg font-black uppercase">{projectData.lifecycles.name}</h4>
                    {projectData.lifecycles.description && (
                      <p className="text-xs text-slate-600 mt-1">{projectData.lifecycles.description}</p>
                    )}
                    <button 
                      onClick={() => navigate(`/planner?projectId=${projectData.id}`)}
                      className="mt-4 px-4 py-1.5 bg-[#1c1c19] text-white text-[9px] font-black uppercase tracking-wider hover:bg-[#0f4369] transition-all flex items-center gap-2 border border-black"
                    >
                      Ver Gantt Cartesiano
                    </button>
                  </div>
                )}
              </div>

              {/* Panel de Estadísticas y Módulos del Proyecto */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#1c1c19] border-b-2 border-[#1c1c19] pb-2">
                  Resumen de Contenido
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => onTabChange('proyecto')}
                    className="p-4 bg-white border-2 border-[#1c1c19] hover:bg-[#f6f3ee] transition-all text-left shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <Layers className="text-[#0f4369] mb-2" size={18} />
                    <span className="text-[8px] font-black uppercase text-[#72777f] tracking-wider block">Sub Proyectos</span>
                    <span className="text-2xl font-black italic">{stats.subProjects}</span>
                  </button>

                  <button
                    onClick={() => onTabChange('equipo')}
                    className="p-4 bg-white border-2 border-[#1c1c19] hover:bg-[#f6f3ee] transition-all text-left shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <Users className="text-[#0f4369] mb-2" size={18} />
                    <span className="text-[8px] font-black uppercase text-[#72777f] tracking-wider block">Integrantes</span>
                    <span className="text-2xl font-black italic">{stats.staff}</span>
                  </button>

                  <button
                    onClick={() => onTabChange('requisitos')}
                    className="p-4 bg-white border-2 border-[#1c1c19] hover:bg-[#f6f3ee] transition-all text-left shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <ClipboardList className="text-[#0f4369] mb-2" size={18} />
                    <span className="text-[8px] font-black uppercase text-[#72777f] tracking-wider block">Requisitos</span>
                    <span className="text-2xl font-black italic">{stats.requirements}</span>
                  </button>

                  <button
                    onClick={() => onTabChange('protocolos')}
                    className="p-4 bg-white border-2 border-[#1c1c19] hover:bg-[#f6f3ee] transition-all text-left shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <FileText className="text-[#0f4369] mb-2" size={18} />
                    <span className="text-[8px] font-black uppercase text-[#72777f] tracking-wider block">Protocolos</span>
                    <span className="text-2xl font-black italic">{stats.protocols}</span>
                  </button>

                  <button
                    onClick={() => onTabChange('directorio')}
                    className="p-4 bg-white border-2 border-[#1c1c19] hover:bg-[#f6f3ee] transition-all text-left shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <Target className="text-[#0f4369] mb-2" size={18} />
                    <span className="text-[8px] font-black uppercase text-[#72777f] tracking-wider block">Directorio</span>
                    <span className="text-2xl font-black italic">{stats.contacts}</span>
                  </button>

                  <button
                    onClick={() => onTabChange('mes')}
                    className="p-4 bg-white border-2 border-[#1c1c19] hover:bg-[#f6f3ee] transition-all text-left shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <Calendar className="text-[#0f4369] mb-2" size={18} />
                    <span className="text-[8px] font-black uppercase text-[#72777f] tracking-wider block">Tareas Totales</span>
                    <span className="text-2xl font-black italic">{stats.tasks}</span>
                  </button>
                </div>

                <div className="p-5 border-2 border-dashed border-[#1c1c19] bg-[#fcf9f4]">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1c1c19] mb-2">BIM Core Integration</h4>
                  <p className="text-[10px] text-slate-600 leading-relaxed uppercase font-mono">
                    Esta pestaña concentra las propiedades operativas del proyecto. Los cambios en el nombre del proyecto se verán reflejados en todas las secciones y en la barra de navegación lateral.
                  </p>
                </div>
              </div>
            </div>
          )
        ) : subTab === 'peb_info' ? (
          /* ========================================================================= */
          /* PESTAÑA 2: INFORMACIÓN GENERAL PEB (SOLICITADO) */
          /* ========================================================================= */
          isEditingPeb ? (
            /* Formulario Edición de Información PEB */
            <div className="max-w-4xl bg-[#fcf9f4] border-2 border-[#1c1c19] p-8 shadow-[8px_8px_0_0_rgba(28,28,25,1)] space-y-6">
              <div className="flex justify-between items-center border-b-2 border-[#1c1c19] pb-4">
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-[#0f4369]" />
                  <h3 className="text-lg font-black uppercase tracking-tight italic">Editar Ficha de Información PEB</h3>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsEditingPeb(false)}
                    className="p-2 border-2 border-[#1c1c19] bg-white hover:bg-gray-100 transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)]"
                  >
                    <X size={16} />
                  </button>
                  <button
                    onClick={handleSavePeb}
                    className="flex items-center gap-2 px-4 py-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-black text-[10px] uppercase shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    <Save size={14} /> Guardar Ficha
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 1. GENERAL */}
                <div className="p-5 bg-white border-2 border-[#1c1c19] space-y-4">
                  <h4 className="text-xs font-black uppercase border-b-2 border-[#1c1c19]/10 pb-2">1. GENERAL</h4>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f]">Cliente</label>
                    <input 
                      type="text" 
                      value={pebForm.client} 
                      onChange={e => setPebForm({...pebForm, client: e.target.value})}
                      className="w-full p-2 border-2 border-[#1c1c19] font-bold text-xs" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f]">Nombre del Proyecto (Lectura)</label>
                    <input 
                      type="text" 
                      value={projectData.name} 
                      disabled
                      className="w-full p-2 border-2 border-[#1c1c19]/35 bg-gray-100 font-bold text-xs cursor-not-allowed uppercase" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f]">Código de Proyecto</label>
                    <input 
                      type="text" 
                      value={pebForm.code} 
                      onChange={e => setPebForm({...pebForm, code: e.target.value})}
                      className="w-full p-2 border-2 border-[#1c1c19] font-bold text-xs font-mono" 
                    />
                  </div>
                </div>

                {/* 2. UBICACIÓN */}
                <div className="p-5 bg-white border-2 border-[#1c1c19] space-y-4">
                  <h4 className="text-xs font-black uppercase border-b-2 border-[#1c1c19]/10 pb-2">2. UBICACIÓN</h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] font-black uppercase text-[#72777f]">Departamento</label>
                      <input 
                        type="text" 
                        value={pebForm.department} 
                        onChange={e => setPebForm({...pebForm, department: e.target.value})}
                        className="w-full p-2 border-2 border-[#1c1c19] font-bold text-xs" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-[#72777f]">Ciudad / Municipio</label>
                      <input 
                        type="text" 
                        value={pebForm.city} 
                        onChange={e => setPebForm({...pebForm, city: e.target.value})}
                        className="w-full p-2 border-2 border-[#1c1c19] font-bold text-xs" 
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f]">Alcance del Proyecto</label>
                    <textarea 
                      value={pebForm.scope} 
                      onChange={e => setPebForm({...pebForm, scope: e.target.value})}
                      rows={3}
                      className="w-full p-2 border-2 border-[#1c1c19] font-medium text-xs resize-none" 
                    />
                  </div>
                </div>

                {/* 3. DESCRIPCIÓN DEL PROYECTO */}
                <div className="p-5 bg-white border-2 border-[#1c1c19] space-y-4 md:col-span-2">
                  <h4 className="text-xs font-black uppercase border-b-2 border-[#1c1c19]/10 pb-2">3. DESCRIPCIÓN DEL PROYECTO</h4>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f]">Tipología de Uso</label>
                    <input 
                      type="text" 
                      value={pebForm.typology} 
                      onChange={e => setPebForm({...pebForm, typology: e.target.value})}
                      className="w-full p-2 border-2 border-[#1c1c19] font-bold text-xs" 
                    />
                  </div>
                  
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f] block mb-1">Módulos Arquitectónicos</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {pebForm.modules.map((m, i) => (
                        <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-[#f6f3ee] border-2 border-[#1c1c19] text-[10px] font-bold uppercase font-mono">
                          {m}
                          <button type="button" onClick={() => handleRemoveModule(i)} className="text-red-500 hover:text-red-700 ml-1">
                            <Trash2 size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Ej. Gimnasio" 
                        value={newModule} 
                        onChange={e => setNewModule(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddModule(); } }}
                        className="flex-1 p-2 border-2 border-[#1c1c19] text-xs font-bold" 
                      />
                      <button 
                        type="button" 
                        onClick={handleAddModule}
                        className="px-4 py-2 bg-[#1c1c19] text-white border-2 border-[#1c1c19] text-[10px] font-black uppercase hover:bg-[#0f4369]"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f]">Información Adicional</label>
                    <textarea 
                      value={pebForm.additional_info} 
                      onChange={e => setPebForm({...pebForm, additional_info: e.target.value})}
                      rows={3}
                      className="w-full p-2 border-2 border-[#1c1c19] font-medium text-xs resize-none" 
                      placeholder="Información adicional sobre el activo, su ciclo de vida o especificaciones..."
                    />
                  </div>
                </div>

                {/* 4. ÁREAS DEL PROYECTO */}
                <div className="p-5 bg-white border-2 border-[#1c1c19] space-y-4 md:col-span-2">
                  <h4 className="text-xs font-black uppercase border-b-2 border-[#1c1c19]/10 pb-2">4. ÁREAS DEL PROYECTO</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div>
                      <label className="text-[9px] font-black uppercase text-[#72777f]">Área del lote (m²)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={pebForm.lot_area} 
                        onChange={e => setPebForm({...pebForm, lot_area: parseFloat(e.target.value) || 0})}
                        className="w-full p-2 border-2 border-[#1c1c19] font-mono text-xs font-bold" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-[#72777f]">Área ventas (m²)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={pebForm.sales_area} 
                        onChange={e => setPebForm({...pebForm, sales_area: parseFloat(e.target.value) || 0})}
                        className="w-full p-2 border-2 border-[#1c1c19] font-mono text-xs font-bold" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-[#72777f]">Área construida (m²)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={pebForm.built_area} 
                        onChange={e => setPebForm({...pebForm, built_area: parseFloat(e.target.value) || 0})}
                        className="w-full p-2 border-2 border-[#1c1c19] font-mono text-xs font-bold" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-[#72777f]">Área circulaciones (m²)</label>
                      <input 
                        type="number" 
                        step="0.01"
                        value={pebForm.circulation_area} 
                        onChange={e => setPebForm({...pebForm, circulation_area: parseFloat(e.target.value) || 0})}
                        className="w-full p-2 border-2 border-[#1c1c19] font-mono text-xs font-bold" 
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase text-[#72777f]">Total (m² - Calculado)</label>
                      <input 
                        type="text" 
                        disabled
                        value={((parseFloat(pebForm.sales_area) || 0) + (parseFloat(pebForm.built_area) || 0) + (parseFloat(pebForm.circulation_area) || 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        className="w-full p-2 border-2 border-[#1c1c19]/30 bg-gray-50 font-mono text-xs font-black text-[#0f4369] cursor-not-allowed" 
                      />
                    </div>
                  </div>
                </div>

                {/* 5. Estrategia BIM */}
                <div className="p-5 bg-white border-2 border-[#1c1c19] space-y-4 md:col-span-2">
                  <h4 className="text-xs font-black uppercase border-b-2 border-[#1c1c19]/10 pb-2">5. Estrategia y Requisitos BIM</h4>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f]">Correlación con Parámetro / Entregable</label>
                    <input 
                      type="text" 
                      value={pebForm.tdi_correlation} 
                      onChange={e => setPebForm({...pebForm, tdi_correlation: e.target.value})}
                      className="w-full p-2 border-2 border-[#1c1c19] font-bold text-xs" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f]">Alineación de Requisitos del Cliente</label>
                    <input 
                      type="text" 
                      value={pebForm.oir_pir_compliance} 
                      onChange={e => setPebForm({...pebForm, oir_pir_compliance: e.target.value})}
                      className="w-full p-2 border-2 border-[#1c1c19] font-bold text-xs" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f] block mb-1">Usos BIM Soportados</label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {pebForm.bim_uses.map((use, i) => (
                        <span key={i} className="flex items-center gap-1 px-2.5 py-1 bg-[#e5e2dd] border border-[#1c1c19] text-[9px] font-black uppercase">
                          {use}
                          <button type="button" onClick={() => handleRemoveBimUse(i)} className="text-red-600 ml-1">
                            <X size={10} />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        placeholder="Ej. Coordinación 3D" 
                        value={newBimUse} 
                        onChange={e => setNewBimUse(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddBimUse(); } }}
                        className="flex-1 p-2 border-2 border-[#1c1c19] text-xs font-bold" 
                      />
                      <button 
                        type="button" 
                        onClick={handleAddBimUse}
                        className="px-4 py-2 bg-[#1c1c19] text-white border-2 border-[#1c1c19] text-[10px] font-black uppercase hover:bg-[#0f4369]"
                      >
                        Agregar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : pebInfo ? (
            /* Vista Detallada de la Información General PEB */
            <div className="space-y-8 max-w-6xl">
              {/* Controles de Ficha PEB */}
              <div className="flex justify-between items-center border-b-2 border-[#1c1c19] pb-4">
                <div className="flex items-center gap-2">
                  <Award size={20} className="text-[#0f4369]" />
                  <h3 className="text-xl font-black uppercase tracking-tight italic">Ficha de Información General del Proyecto (PEB)</h3>
                </div>
                <button
                  onClick={startEditPeb}
                  className="flex items-center gap-2 px-4 py-2 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-black text-[10px] uppercase shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  <Edit2 size={14} strokeWidth={2.5} /> Editar Ficha PEB
                </button>
              </div>

              {/* Grid 4 Categorías de Información */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Categoría 1: GENERAL */}
                <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[5px_5px_0_0_rgba(28,28,25,1)] space-y-4">
                  <div className="w-8 h-8 rounded-full bg-[#0f4369]/10 flex items-center justify-center border border-[#1c1c19]">
                    <LayoutGrid size={16} className="text-[#0f4369]" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1c1c19] border-b border-[#1c1c19]/10 pb-1">
                    1. GENERAL
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[8px] font-black text-[#72777f] uppercase block font-mono">Cliente</span>
                      <span className="text-xs font-bold text-[#1c1c19]">{pebInfo.client}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-[#72777f] uppercase block font-mono">Nombre del Proyecto</span>
                      <span className="text-xs font-bold text-[#1c1c19] uppercase">{projectData.name}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-[#72777f] uppercase block font-mono">Código del Proyecto</span>
                      <span className="text-xs font-bold font-mono bg-[#f6f3ee] px-1.5 py-0.5 border border-[#1c1c19]/10">{pebInfo.code}</span>
                    </div>
                  </div>
                </div>

                {/* Categoría 2: UBICACIÓN */}
                <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[5px_5px_0_0_rgba(28,28,25,1)] space-y-4">
                  <div className="w-8 h-8 rounded-full bg-[#0f4369]/10 flex items-center justify-center border border-[#1c1c19]">
                    <MapPin size={16} className="text-[#0f4369]" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1c1c19] border-b border-[#1c1c19]/10 pb-1">
                    2. UBICACIÓN
                  </h4>
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[8px] font-black text-[#72777f] uppercase block font-mono">Departamento</span>
                        <span className="text-xs font-bold text-[#1c1c19]">{pebInfo.department || (pebInfo.location && pebInfo.location.includes(',') ? pebInfo.location.split(',')[1].trim() : 'Antioquia')}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-[#72777f] uppercase block font-mono">Ciudad/Municipio</span>
                        <span className="text-xs font-bold text-[#1c1c19]">{pebInfo.city || (pebInfo.location && pebInfo.location.includes(',') ? pebInfo.location.split(',')[0].trim() : 'Medellín')}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-[#72777f] uppercase block font-mono">Alcance del Proyecto</span>
                      <span className="text-xs font-bold text-[#1c1c19] block leading-snug">{pebInfo.scope}</span>
                    </div>
                  </div>
                </div>

                {/* Categoría 3: DESCRIPCIÓN DEL PROYECTO */}
                <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[5px_5px_0_0_rgba(28,28,25,1)] space-y-4">
                  <div className="w-8 h-8 rounded-full bg-[#0f4369]/10 flex items-center justify-center border border-[#1c1c19]">
                    <Users size={16} className="text-[#0f4369]" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1c1c19] border-b border-[#1c1c19]/10 pb-1">
                    3. DESCRIPCIÓN
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[8px] font-black text-[#72777f] uppercase block font-mono">Tipología</span>
                      <span className="text-xs font-bold text-[#1c1c19]">{pebInfo.typology}</span>
                    </div>
                    <div>
                      <span className="text-[8px] font-black text-[#72777f] uppercase block font-mono mb-1">Módulos Arquitectónicos</span>
                      <div className="flex flex-wrap gap-1.5">
                        {pebInfo.modules && pebInfo.modules.map((m, idx) => (
                          <span key={idx} className="px-1.5 py-0.5 bg-[#f6f3ee] border border-[#1c1c19]/25 text-[8px] font-black uppercase font-mono tracking-tight">
                            {m}
                          </span>
                        ))}
                      </div>
                    </div>
                    {pebInfo.additional_info && (
                      <div>
                        <span className="text-[8px] font-black text-[#72777f] uppercase block font-mono">Información Adicional</span>
                        <span className="text-[10px] text-slate-600 block leading-snug max-h-16 overflow-y-auto font-medium">{pebInfo.additional_info}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Categoría 4: ÁREAS DEL PROYECTO */}
                <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[5px_5px_0_0_rgba(28,28,25,1)] space-y-4">
                  <div className="w-8 h-8 rounded-full bg-[#0f4369]/10 flex items-center justify-center border border-[#1c1c19]">
                    <Layers size={16} className="text-[#0f4369]" />
                  </div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1c1c19] border-b border-[#1c1c19]/10 pb-1">
                    4. ÁREAS DEL PROYECTO
                  </h4>
                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] font-black text-[#72777f] uppercase tracking-tighter">Área del Lote:</span>
                      <span className="font-bold text-[#1c1c19]">{parseFloat(pebInfo.lot_area || 0).toLocaleString()} m²</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] font-black text-[#72777f] uppercase tracking-tighter">Área Ventas:</span>
                      <span className="font-bold text-[#1c1c19]">{parseFloat(pebInfo.sales_area || 0).toLocaleString()} m²</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] font-black text-[#72777f] uppercase tracking-tighter">Área Construida:</span>
                      <span className="font-bold text-[#1c1c19]">{parseFloat(pebInfo.built_area || 0).toLocaleString()} m²</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-[9px] font-black text-[#72777f] uppercase tracking-tighter">Circulaciones:</span>
                      <span className="font-bold text-[#1c1c19]">{parseFloat(pebInfo.circulation_area || 0).toLocaleString()} m²</span>
                    </div>
                    <div className="border-t border-[#1c1c19]/10 pt-1.5 flex justify-between items-center text-xs font-black">
                      <span className="text-[9px] tracking-tighter text-[#1c1c19]">Total:</span>
                      <span className="text-[#0f4369]">{(parseFloat(pebInfo.sales_area || 0) + parseFloat(pebInfo.built_area || 0) + parseFloat(pebInfo.circulation_area || 0)).toLocaleString()} m²</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* El Contexto Mayor dentro del PEB */}
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19] border-b-2 border-[#1c1c19] pb-2">
                  El Contexto Mayor dentro del Plan de Ejecución BIM (PEB)
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Correlación Directa con TDI_A */}
                  <div className="p-6 bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.05)] space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#0f4369] text-white text-[8px] font-black font-mono">TDI_A</span>
                      <h5 className="font-black text-xs uppercase">Correlación con TDI_A</h5>
                    </div>
                    <p className="text-[10px] text-slate-700 leading-relaxed font-semibold">
                      La sección de información general sirve como aplicación práctica de la Ficha <strong className="text-[#0f4369] font-black">{pebInfo.tdi_correlation}</strong>. En la matriz LOD, estos parámetros básicos deben incorporarse desde LOD 100/200 y mantenerse en las fases posteriores.
                    </p>
                  </div>

                  {/* Requisitos del Cliente (OIR/PIR) */}
                  <div className="p-6 bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.05)] space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-[#493f36] text-white text-[8px] font-black font-mono">REQ</span>
                      <h5 className="font-black text-xs uppercase">Alineación OIR / PIR</h5>
                    </div>
                    <p className="text-[10px] text-slate-700 leading-relaxed font-semibold">
                      Garantiza el cumplimiento formal de los requisitos unificados del cliente, abarcando tanto los Requisitos Organizacionales (<strong className="text-[#0f4369]">OIR</strong>) como del Proyecto (<strong className="text-[#0f4369]">PIR</strong>) para guiar la entrega digital.
                    </p>
                  </div>

                  {/* Objetivos y Usos BIM */}
                  <div className="p-6 bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.05)] space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-green-600 text-white text-[8px] font-black font-mono">BIM</span>
                      <h5 className="font-black text-xs uppercase">Objetivos y Usos BIM</h5>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-700 leading-relaxed font-semibold">
                        Define los límites operacionales para actividades críticas en el modelado 3D, facilitando la extracción ordenada para:
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {pebInfo.bim_uses && pebInfo.bim_uses.map((use, idx) => (
                          <span key={idx} className="px-2 py-0.5 bg-white border border-[#1c1c19]/30 text-[8px] font-black uppercase text-[#0f4369]">
                            {use}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center p-8">
              <Loader2 className="animate-spin text-[#0f4369] mx-auto mb-4" size={32} />
              <span className="font-mono text-xs uppercase">Cargando información del PEB...</span>
            </div>
          )
        ) : subTab === 'software' ? (
          /* ========================================================================= */
          /* PESTAÑA 3: SOFTWARE Y PLATAFORMAS — MULTI-ENTRADA */
          /* ========================================================================= */
          <div className="space-y-6 max-w-5xl">
            {/* Header */}
            <div className="flex justify-between items-center border-b-2 border-[#1c1c19] pb-4">
              <div className="flex items-center gap-2">
                <Cpu size={20} className="text-[#0f4369]" />
                <div>
                  <span className="text-[8px] font-black text-[#72777f] uppercase tracking-widest block font-mono">SOFTWARE_LIST / {softwareList.length} ENTRADAS</span>
                  <h3 className="text-xl font-black uppercase tracking-tight italic">Software y Plataformas</h3>
                </div>
              </div>
              <button
                onClick={openAddSoftware}
                className="flex items-center gap-2 px-4 py-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-black text-[10px] uppercase shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <Plus size={14} /> Agregar Software
              </button>
            </div>

            {/* Inline Add/Edit Form */}
            {editingSoftwareId !== null && (
              <div className="bg-[#fcf9f4] border-2 border-[#0f4369] p-6 shadow-[6px_6px_0_0_rgba(15,67,105,0.3)] space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-black uppercase flex items-center gap-2">
                    <Cpu size={14} className="text-[#0f4369]" />
                    {editingSoftwareId === 'new' ? 'Nuevo Software' : 'Editar Software'}
                  </h4>
                  <button onClick={cancelSoftwareEdit} className="p-1.5 border-2 border-[#1c1c19] bg-white hover:bg-gray-100 transition-all">
                    <X size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f] block mb-1">Software Principal *</label>
                    <input
                      type="text"
                      value={softwareForm.software_principal}
                      onChange={e => setSoftwareForm({ ...softwareForm, software_principal: e.target.value })}
                      placeholder="Ej. Revit, Navisworks, AutoCAD..."
                      className="w-full p-2.5 bg-white border-2 border-[#1c1c19] text-xs font-bold focus:outline-none focus:border-[#0f4369]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f] block mb-1">Versión</label>
                    <input
                      type="text"
                      value={softwareForm.version_software}
                      onChange={e => setSoftwareForm({ ...softwareForm, version_software: e.target.value })}
                      placeholder="Ej. 2025, 2024.1..."
                      className="w-full p-2.5 bg-white border-2 border-[#1c1c19] text-xs font-bold font-mono focus:outline-none focus:border-[#0f4369]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f] block mb-1">Uso del Modelo</label>
                    <input
                      type="text"
                      value={softwareForm.uso_del_modelo}
                      onChange={e => setSoftwareForm({ ...softwareForm, uso_del_modelo: e.target.value })}
                      placeholder="Ej. Coordinación 3D, Clash Detection..."
                      className="w-full p-2.5 bg-white border-2 border-[#1c1c19] text-xs font-bold focus:outline-none focus:border-[#0f4369]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f] block mb-1">Entorno Común de Datos (CDE)</label>
                    <input
                      type="text"
                      value={softwareForm.entorno_comun_de_datos_cde}
                      onChange={e => setSoftwareForm({ ...softwareForm, entorno_comun_de_datos_cde: e.target.value })}
                      placeholder="Ej. Autodesk Construction Cloud, BIM 360..."
                      className="w-full p-2.5 bg-white border-2 border-[#1c1c19] text-xs font-bold focus:outline-none focus:border-[#0f4369]"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-[#72777f] block mb-1">Formatos de Archivo</label>
                    <input
                      type="text"
                      value={softwareForm.formatos}
                      onChange={e => setSoftwareForm({ ...softwareForm, formatos: e.target.value })}
                      placeholder="Ej. .RVT, .NWC, .NWF..."
                      className="w-full p-2.5 bg-white border-2 border-[#1c1c19] text-xs font-bold font-mono focus:outline-none focus:border-[#0f4369]"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-[9px] font-black uppercase text-[#72777f] block mb-1">Política de Versión</label>
                    <input
                      type="text"
                      value={softwareForm.politica_version}
                      onChange={e => setSoftwareForm({ ...softwareForm, politica_version: e.target.value })}
                      placeholder="Ej. Versión previa a la actualmente vigente..."
                      className="w-full p-2.5 bg-white border-2 border-[#1c1c19] text-xs font-bold focus:outline-none focus:border-[#0f4369]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={softwareForm.es_software_primario}
                      onChange={e => setSoftwareForm({ ...softwareForm, es_software_primario: e.target.checked })}
                      className="w-4 h-4 border-2 border-[#1c1c19] accent-[#0f4369]"
                    />
                    <span className="text-[10px] font-black uppercase">Marcar como Software Principal del Proyecto</span>
                  </label>
                  <button
                    onClick={handleSaveSoftwareEntry}
                    disabled={loadingSoftware}
                    className="flex items-center gap-2 px-5 py-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-black text-[10px] uppercase shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all disabled:opacity-50"
                  >
                    {loadingSoftware ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    {editingSoftwareId === 'new' ? 'Agregar' : 'Guardar'}
                  </button>
                </div>
              </div>
            )}

            {/* Software Cards List */}
            {loadingSoftware && softwareList.length === 0 ? (
              <div className="text-center p-12">
                <Loader2 className="animate-spin text-[#0f4369] mx-auto mb-3" size={28} />
                <span className="font-mono text-xs uppercase font-bold">Cargando lista de software...</span>
              </div>
            ) : softwareList.length === 0 ? (
              <div className="text-center p-12 border-2 border-dashed border-[#1c1c19] bg-[#fcf9f4]">
                <Cpu size={32} className="mx-auto mb-3 text-[#1c1c19]/25" />
                <p className="font-black text-sm uppercase tracking-wider">No hay software registrado</p>
                <p className="text-[10px] text-slate-500 mt-1">Haz clic en "Agregar Software" para comenzar.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {softwareList.map((sw, idx) => {
                  const colors = [
                    { bg: '#fff8f2', accent: '#e8702a', icon: '#e8702a' },
                    { bg: '#f0f6ff', accent: '#1e6091', icon: '#1e6091' },
                    { bg: '#f2fff5', accent: '#2d6a4f', icon: '#2d6a4f' },
                    { bg: '#fffdf0', accent: '#b58900', icon: '#b58900' },
                    { bg: '#fdf0ff', accent: '#7b2d8b', icon: '#7b2d8b' },
                    { bg: '#f0f9ff', accent: '#0369a1', icon: '#0369a1' },
                  ];
                  const c = colors[idx % colors.length];
                  return (
                    <div
                      key={sw.id}
                      className="border-2 border-[#1c1c19] p-5 shadow-[5px_5px_0_0_rgba(28,28,25,1)] relative group transition-all hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                      style={{ backgroundColor: c.bg }}
                    >
                      {/* Primary Badge */}
                      {sw.es_software_primario && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 bg-[#f5a623] border border-[#1c1c19] text-[8px] font-black uppercase">
                          <Star size={8} fill="currentColor" /> PRINCIPAL
                        </div>
                      )}

                      {/* Header row */}
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2.5 border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)] flex-shrink-0" style={{ backgroundColor: c.accent }}>
                          <Monitor size={18} className="text-white" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[8px] font-black uppercase tracking-widest block font-mono" style={{ color: c.accent }}>SW_{String(idx + 1).padStart(2, '0')}</span>
                          <h4 className="text-base font-black uppercase text-[#1c1c19] leading-tight truncate">{sw.software_principal}</h4>
                          <span className="text-[10px] font-bold font-mono text-[#72777f]">v{sw.version_software || '—'}</span>
                        </div>
                      </div>

                      {/* Fields */}
                      <div className="space-y-2.5 text-[10px]">
                        <div className="flex gap-2">
                          <Layers size={11} className="flex-shrink-0 mt-0.5" style={{ color: c.accent }} />
                          <div>
                            <span className="font-black uppercase text-[#72777f] block text-[8px] font-mono">Uso del Modelo</span>
                            <span className="font-semibold text-[#1c1c19]">{sw.uso_del_modelo || '—'}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Database size={11} className="flex-shrink-0 mt-0.5" style={{ color: c.accent }} />
                          <div>
                            <span className="font-black uppercase text-[#72777f] block text-[8px] font-mono">CDE</span>
                            <span className="font-semibold text-[#1c1c19]">{sw.entorno_comun_de_datos_cde || '—'}</span>
                          </div>
                        </div>
                        {sw.formatos && (
                          <div className="flex gap-2">
                            <FileText size={11} className="flex-shrink-0 mt-0.5" style={{ color: c.accent }} />
                            <div>
                              <span className="font-black uppercase text-[#72777f] block text-[8px] font-mono">Formatos</span>
                              <span className="font-black font-mono text-[#1c1c19] tracking-widest">{sw.formatos}</span>
                            </div>
                          </div>
                        )}
                        {sw.politica_version && (
                          <div className="mt-2 pt-2 border-t border-[#1c1c19]/10">
                            <span className="font-black uppercase text-[#72777f] block text-[8px] font-mono mb-0.5">Política de Versión</span>
                            <span className="font-medium text-[#493f36] italic">{sw.politica_version}</span>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2 mt-4 pt-3 border-t border-[#1c1c19]/10">
                        <button
                          onClick={() => openEditSoftware(sw)}
                          className="flex items-center gap-1 px-2.5 py-1 bg-white border-2 border-[#1c1c19] text-[9px] font-black uppercase hover:bg-[#f6f3ee] shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                        >
                          <Edit2 size={10} /> Editar
                        </button>
                        {!sw.es_software_primario && (
                          <button
                            onClick={() => handleMarkPrimary(sw.id)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-[#f5a623] border-2 border-[#1c1c19] text-[9px] font-black uppercase hover:bg-[#e8922a] shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                          >
                            <Star size={10} /> Principal
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteSoftware(sw.id)}
                          className="ml-auto flex items-center gap-1 px-2.5 py-1 bg-white border-2 border-red-400 text-red-600 text-[9px] font-black uppercase hover:bg-red-50 shadow-[2px_2px_0_0_rgba(220,38,38,0.3)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                        >
                          <Trash2 size={10} /> Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ─── Procesos de Integración BIM ─── */}
            <div className="border-2 border-[#1c1c19] bg-white shadow-[6px_6px_0_0_rgba(28,28,25,0.06)] overflow-hidden">
              <div className="bg-[#0f4369] text-white px-6 py-3 flex items-center gap-3">
                <Layers size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Procesos de Integración BIM / Infraestructura Tecnológica</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 divide-y-2 md:divide-y-0 md:divide-x-2 divide-[#1c1c19]/10">

                {/* CDE */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-[#0f4369] flex items-center justify-center flex-shrink-0">
                      <Database size={14} className="text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#1c1c19]">CDE — Autodesk Construction Cloud</span>
                  </div>
                  <p className="text-[10px] text-[#493f36] leading-relaxed font-medium">
                    La infraestructura central del proyecto es <strong className="text-[#0f4369]">Autodesk Construction Cloud (ACC)</strong>, que actúa como plataforma unificada para el intercambio de toda la información del proyecto entre disciplinas y partes.
                  </p>
                  <div className="mt-2 px-3 py-2 bg-[#f0f6ff] border border-[#0f4369]/20 text-[9px] font-mono text-[#0f4369] font-bold uppercase">
                    ACC → Collaborate Pro → Modelos .RVT → Coordinación
                  </div>
                </div>

                {/* Clash Detection */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-[#e8702a] flex items-center justify-center flex-shrink-0">
                      <Target size={14} className="text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#1c1c19]">Flujo de Clash Detection</span>
                  </div>
                  <p className="text-[10px] text-[#493f36] leading-relaxed font-medium">
                    Los modelos Revit se suben a ACC. El equipo usa los módulos <strong className="text-[#e8702a]">Collaborate Pro</strong> de Navisworks para generar, revisar y notificar interferencias a los diseñadores.
                  </p>
                  <ol className="mt-2 space-y-1 text-[9px] font-bold text-[#493f36] list-decimal pl-4">
                    <li>Carga de modelos .RVT → ACC</li>
                    <li>Generación de archivos .NWC en nube</li>
                    <li>Revisión en Navisworks (.NWF / .NWD)</li>
                    <li>Notificación a diseñadores de interferencias</li>
                  </ol>
                </div>

                {/* Coordenadas */}
                <div className="p-5 space-y-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 bg-[#2d6a4f] flex items-center justify-center flex-shrink-0">
                      <CheckSquare size={14} className="text-white" />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#1c1c19]">Coordinación de Coordenadas</span>
                  </div>
                  <p className="text-[10px] text-[#493f36] leading-relaxed font-medium">
                    Procedimiento obligatorio en Revit para garantizar referencia espacial unificada en todas las disciplinas del proyecto.
                  </p>
                  <ol className="mt-2 space-y-1 text-[9px] font-bold text-[#493f36] list-decimal pl-4">
                    <li>Insertar modelo Arquitectónico como vínculo</li>
                    <li>Método: <span className="font-mono text-[#2d6a4f]">Origin to Origin</span></li>
                    <li>Bloquear posición del vínculo</li>
                    <li>Ejecutar <span className="font-mono text-[#2d6a4f]">Acquire Coordinates</span></li>
                  </ol>
                </div>

              </div>
            </div>

            {/* Info footer */}
            <div className="p-5 border-2 border-dashed border-[#1c1c19] bg-[#fcf9f4] flex items-start gap-3">
              <Info size={16} className="text-[#0f4369] flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-600 font-medium leading-relaxed">
                Define todos los softwares autorizados para el proyecto. Marca uno como <strong className="text-[#0f4369]">Principal</strong> para resaltarlo. Los datos se guardan en Supabase (<code className="font-mono text-[9px] bg-[#e8e4df] px-1">project_software</code>) y localmente como respaldo automático.
              </p>
            </div>
          </div>
        ) : subTab === 'lod_tdi' ? (
          <LodTdiMatrix projectId={project.id} />
        ) : subTab === 'unidades' ? (
          <ProjectUnitsTab project={projectData} />
        ) : subTab === 'objetivos' ? (
          <ProjectObjectivesModule project={projectData} />
        ) : subTab === 'cronograma' ? (
          <ProjectDeliveryScheduleTab project={projectData} />
        ) : null}
      </div>
    </div>
  );
}
