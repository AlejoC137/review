import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, User, Plus, Trash2, Edit2, Save, X, Loader2, 
  ShieldAlert, FolderOpen, Workflow, ClipboardList, CheckCircle, 
  HelpCircle, ChevronRight, PlusCircle, Check, Table, Columns
} from 'lucide-react';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';

// 5 Roles Semilla del PEB (Click Clack Wellnest Edition Etapa 2)
const seedBepRoles = [
  {
    role_name: 'Gerencia y Dirección del Proyecto',
    organization: 'Grupo Attia',
    responsibilities: 'Encabezados por el Grupo Attia (con figuras como Natalia Ruiz y Daniel Castro), son responsables de la comunicación directa con el promotor y la interventoría. Definen el alcance, tiempo y costos, planifican los recursos, y supervisan el avance general y la calidad de los entregables.',
    bim_uses: 'Supervisión de costos (Uso 5D), planificación macro y control de entregables clave.',
    lod_tdi: 'Valida que los entregables cumplan con el LOD contractual antes de ser aprobados.',
    cde_collaboration: 'Acceso de Lectura/Validación en la carpeta SHARED y PUBLICABLES de Autodesk Construction Cloud.',
    staff_ids: ['80000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000002']
  },
  {
    role_name: 'Coordinador del Proyecto y BIM Manager',
    organization: 'Bioclimática',
    responsibilities: 'Liderado por Jorge Preciado (de la empresa Bioclimática), este rol es el motor de la estrategia tecnológica. Sus responsabilidades incluyen proponer y hacer cumplir el PEB, gestionar los perfiles de acceso a la información y liderar la coordinación técnica.',
    bim_uses: 'Lidera la definición del PEB, gestiona perfiles de modelado y dirige la integración multidisciplinaria.',
    lod_tdi: 'Define las exigencias de LOD (ej. LOD 200 a 300) y las plantillas TDI para cada disciplina.',
    cde_collaboration: 'Administrador del Entorno Común de Datos (CDE). Valida y aprueba la promoción de archivos.',
    staff_ids: ['80000000-0000-0000-0000-000000000003']
  },
  {
    role_name: 'Coordinador BIM',
    organization: 'Bioclimática / Interno',
    responsibilities: 'Trabaja de la mano con el BIM Manager para llevar a cabo el control de calidad. Su tarea principal es revisar la correcta parametrización, cruzar los modelos para prever conflictos (detección de interferencias), conciliar soluciones entre disciplinas y auditar la calidad de los entregables de los modeladores.',
    bim_uses: 'Coordinación 3D en Navisworks. Detección de interferencias y conciliación espacial.',
    lod_tdi: 'Auditor de datos: valida que los modelos alcancen el LOD requerido y contengan los campos TDI correctos.',
    cde_collaboration: 'Revisa, audita y promueve los archivos desde TRABAJO EN PROGRESO (WIP) a la carpeta de COMPARTIDOS.',
    staff_ids: []
  },
  {
    role_name: 'Especialistas BIM (Diseñadores/Modeladores)',
    organization: 'PLAN B (Arq.), Click Clack Equipo Creativo (Int.), CNI Ingenieros (Est.)',
    responsibilities: 'Responsables técnicos de su respectiva disciplina. Encargados de modelar la geometría y los datos, así como de realizar chequeos de calidad internos antes de entregar la información.',
    bim_uses: 'Desarrollo de modelos tridimensionales (Uso 3D) y extracción de cantidades de obra (Uso 5D).',
    lod_tdi: 'Operativamente responsable de modelar la geometría con el LOD exigido y llenar los TDI (A a la O).',
    cde_collaboration: 'Crea, edita y publica información exclusivamente en su carpeta dedicada de TRABAJO EN PROGRESO (WIP).',
    staff_ids: []
  },
  {
    role_name: 'Interventoría',
    organization: 'Interventoría Externa',
    responsibilities: 'Actúa como supervisor externo para asegurar que se cumplan los requerimientos del cliente, gestionando la comunicación con la gerencia y aprobando cambios en el proyecto.',
    bim_uses: 'Supervisión y control externo de estándares de calidad solicitados por el cliente.',
    lod_tdi: 'Revisa y audita reportes de cumplimiento de LOD e interferencias.',
    cde_collaboration: 'Acceso de Auditoría y Lectura general en las carpetas COMPARTIDOS y PUBLICABLES.',
    staff_ids: []
  }
];

export default function BepTeamModule({ project }) {
  const { isAdmin, isBimManager } = useAuth();
  const canEdit = isAdmin || isBimManager;

  const [bepRoles, setBepRoles] = useState([]);
  const [generalStaff, setGeneralStaff] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [isFallbackActive, setIsFallbackActive] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [viewMode, setViewMode] = useState('table');

  // Form states
  const [roleForm, setRoleForm] = useState({
    role_name: '',
    organization: '',
    responsibilities: '',
    bim_uses: '',
    lod_tdi: '',
    cde_collaboration: ''
  });
  const [editForm, setEditForm] = useState({
    organization: '',
    responsibilities: '',
    bim_uses: '',
    lod_tdi: '',
    cde_collaboration: ''
  });

  // Assign staff dropdown state
  const [showAssignDropdown, setShowAssignDropdown] = useState(false);

  // Load General Staff directory
  const fetchStaffDirectory = async () => {
    try {
      const data = await projectService.getStaff();
      // Ensure seed staff exist in general staff list for local fallback rendering if necessary
      const seedStaffList = [
        { id: '80000000-0000-0000-0000-000000000001', name: 'Natalia Ruiz', role_description: 'Gerencia (Grupo Attia)', color: '#e11d48', email: 'natalia.ruiz@attia.com' },
        { id: '80000000-0000-0000-0000-000000000002', name: 'Daniel Castro', role_description: 'Dirección (Grupo Attia)', color: '#ea580c', email: 'daniel.castro@attia.com' },
        { id: '80000000-0000-0000-0000-000000000003', name: 'Jorge Preciado', role_description: 'Coordinador / BIM Manager', color: '#0f4369', email: 'jorge.preciado@bioclimatica.com' }
      ];

      const mergedStaff = [...(data || [])];
      seedStaffList.forEach(seed => {
        if (!mergedStaff.some(s => s.id === seed.id)) {
          mergedStaff.push(seed);
        }
      });

      setGeneralStaff(mergedStaff);
      return mergedStaff;
    } catch (err) {
      console.error('Error fetching staff:', err);
      return [];
    }
  };

  // Load BEP Team Roles
  const loadBepRoles = useCallback(async (staffList) => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const data = await projectService.getBepTeam(project.id);
      
      // If table is empty, we seed it locally or push defaults if user has database
      if (!data || data.length === 0) {
        throw new Error('empty_table');
      }

      setBepRoles(data);
      setIsFallbackActive(false);

      // Select first role by default
      if (data.length > 0) {
        // Keep selection if previously selected, otherwise select first
        const currentSelected = selectedRole ? data.find(r => r.id === selectedRole.id) : null;
        setSelectedRole(currentSelected || data[0]);
      }
    } catch (err) {
      // Fallback if table doesn't exist in Supabase yet, or if it is empty
      console.warn('Fallback to LocalStorage active for BEP Team:', err.message);
      setIsFallbackActive(true);

      const localKey = `bep_team_local_${project.id}`;
      const savedData = localStorage.getItem(localKey);
      if (savedData) {
        const parsed = JSON.parse(savedData);
        setBepRoles(parsed);
        if (parsed.length > 0) {
          const currentSelected = selectedRole ? parsed.find(r => r.role_name === selectedRole.role_name) : null;
          setSelectedRole(currentSelected || parsed[0]);
        }
      } else {
        // Initialize with default seed roles
        const initialRoles = seedBepRoles.map((r, i) => ({
          id: `local-role-${i}`,
          project_id: project.id,
          ...r
        }));
        localStorage.setItem(localKey, JSON.stringify(initialRoles));
        setBepRoles(initialRoles);
        setSelectedRole(initialRoles[0]);
      }
    } finally {
      setLoading(false);
    }
  }, [project?.id, selectedRole]);

  useEffect(() => {
    const initialize = async () => {
      const staffList = await fetchStaffDirectory();
      await loadBepRoles(staffList);
    };
    initialize();
  }, [project?.id]);

  // Helper to get staff details by ID
  const getStaffDetail = (id) => {
    return generalStaff.find(s => s.id === id);
  };

  // Handle Save (Edit Role Organization or Responsibilities)
  const handleSaveEdit = async () => {
    if (!selectedRole) return;
    try {
      setLoading(true);
      const updates = {
        organization: editForm.organization,
        responsibilities: editForm.responsibilities,
        bim_uses: editForm.bim_uses,
        lod_tdi: editForm.lod_tdi,
        cde_collaboration: editForm.cde_collaboration,
        updated_at: new Date().toISOString()
      };

      if (isFallbackActive) {
        // LocalStorage fallback update
        const updatedRoles = bepRoles.map(r => 
          r.role_name === selectedRole.role_name ? { ...r, ...updates } : r
        );
        localStorage.setItem(`bep_team_local_${project.id}`, JSON.stringify(updatedRoles));
        setBepRoles(updatedRoles);
        setSelectedRole({ ...selectedRole, ...updates });
        setIsEditing(false);
      } else {
        // Database update
        const updated = await projectService.updateBepRole(selectedRole.id, updates);
        setBepRoles(bepRoles.map(r => r.id === updated.id ? updated : r));
        setSelectedRole(updated);
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating BEP role:', err);
      alert('Error al actualizar el rol.');
    } finally {
      setLoading(false);
    }
  };

  // Toggle staff assignment
  const handleToggleStaff = async (staffId) => {
    if (!selectedRole) return;
    if (!isBimManager) {
      alert("Solo el BIM Manager puede editar las asignaciones de integrantes.");
      return;
    }
    try {
      const currentStaffIds = selectedRole.staff_ids || [];
      const isAssigning = !currentStaffIds.includes(staffId);
      
      let newStaffIds = [];
      if (isAssigning) {
        newStaffIds = [...currentStaffIds, staffId];
      } else {
        newStaffIds = currentStaffIds.filter(id => id !== staffId);
      }

      const updates = {
        staff_ids: newStaffIds,
        updated_at: new Date().toISOString()
      };

      if (isFallbackActive) {
        // LocalStorage fallback update
        const updatedRoles = bepRoles.map(r => 
          r.role_name === selectedRole.role_name ? { ...r, ...updates } : r
        );
        localStorage.setItem(`bep_team_local_${project.id}`, JSON.stringify(updatedRoles));
        setBepRoles(updatedRoles);
        setSelectedRole({ ...selectedRole, ...updates });
        
        // Also update local generalStaff
        if (isAssigning) {
          setGeneralStaff(generalStaff.map(s => s.id === staffId ? { ...s, role_description: selectedRole.role_name, compania: selectedRole.organization } : s));
        } else {
          setGeneralStaff(generalStaff.map(s => s.id === staffId && s.role_description === selectedRole.role_name ? { ...s, role_description: '' } : s));
        }
      } else {
        // Database update
        const updated = await projectService.updateBepRole(selectedRole.id, updates);
        setBepRoles(bepRoles.map(r => r.id === updated.id ? updated : r));
        setSelectedRole(updated);
        
        // Sincronizar con el perfil del staff
        try {
          if (isAssigning) {
            await projectService.updateStaff(staffId, { role_description: selectedRole.role_name, compania: selectedRole.organization });
            setGeneralStaff(generalStaff.map(s => s.id === staffId ? { ...s, role_description: selectedRole.role_name, compania: selectedRole.organization } : s));
          } else {
            await projectService.updateStaff(staffId, { role_description: '' });
            setGeneralStaff(generalStaff.map(s => s.id === staffId && s.role_description === selectedRole.role_name ? { ...s, role_description: '' } : s));
          }
        } catch (e) {
          console.error('Error syncing staff role:', e);
        }
      }
    } catch (err) {
      console.error('Error toggling staff assignment:', err);
      alert('Error al actualizar asignaciones del staff.');
    }
  };

  // Handle Add custom role
  const handleAddRole = async () => {
    if (!roleForm.role_name.trim() || !roleForm.organization.trim()) {
      alert('Nombre del rol y organización son requeridos.');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        project_id: project.id,
        role_name: roleForm.role_name.trim(),
        organization: roleForm.organization.trim(),
        responsibilities: roleForm.responsibilities.trim() || 'Sin responsabilidades definidas.',
        bim_uses: roleForm.bim_uses.trim(),
        lod_tdi: roleForm.lod_tdi.trim(),
        cde_collaboration: roleForm.cde_collaboration.trim(),
        staff_ids: []
      };

      if (isFallbackActive) {
        // Local fallback
        const newRole = {
          id: `local-role-${Date.now()}`,
          ...payload
        };
        const updatedRoles = [...bepRoles, newRole];
        localStorage.setItem(`bep_team_local_${project.id}`, JSON.stringify(updatedRoles));
        setBepRoles(updatedRoles);
        setSelectedRole(newRole);
        setIsAdding(false);
        setRoleForm({ role_name: '', organization: '', responsibilities: '', bim_uses: '', lod_tdi: '', cde_collaboration: '' });
      } else {
        // Database save
        const newRole = await projectService.createBepRole(payload);
        setBepRoles([...bepRoles, newRole]);
        setSelectedRole(newRole);
        setIsAdding(false);
        setRoleForm({ role_name: '', organization: '', responsibilities: '', bim_uses: '', lod_tdi: '', cde_collaboration: '' });
      }
    } catch (err) {
      console.error('Error creating custom role:', err);
      alert('Error al guardar el nuevo rol en la base de datos.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Delete custom role
  const handleDeleteRole = async (roleId) => {
    if (!window.confirm('¿Seguro que deseas eliminar este rol del equipo del PEB?')) return;
    try {
      setLoading(true);
      if (isFallbackActive) {
        const updatedRoles = bepRoles.filter(r => r.id !== roleId);
        localStorage.setItem(`bep_team_local_${project.id}`, JSON.stringify(updatedRoles));
        setBepRoles(updatedRoles);
        setSelectedRole(updatedRoles[0] || null);
      } else {
        await projectService.deleteBepRole(roleId);
        const updatedRoles = bepRoles.filter(r => r.id !== roleId);
        setBepRoles(updatedRoles);
        setSelectedRole(updatedRoles[0] || null);
      }
    } catch (err) {
      console.error('Error deleting role:', err);
      alert('Error al eliminar el rol.');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (roleToEdit = selectedRole) => {
    if (!roleToEdit) return;
    const defaultStrategy = getBimStrategyContext(roleToEdit.role_name);
    setEditForm({
      organization: roleToEdit.organization || '',
      responsibilities: roleToEdit.responsibilities || '',
      bim_uses: roleToEdit.bim_uses || defaultStrategy.uses,
      lod_tdi: roleToEdit.lod_tdi || defaultStrategy.lod,
      cde_collaboration: roleToEdit.cde_collaboration || defaultStrategy.cde
    });
    setIsEditing(true);
  };

  // Helper to extract how each role connects to the BIM Strategy
  const getBimStrategyContext = (roleName) => {
    const normName = (roleName || '').toLowerCase();
    if (normName.includes('gerencia') || normName.includes('dirección') || normName.includes('director')) {
      return {
        uses: 'Supervisión de costos (Uso 5D), planificación macro y control de entregables clave.',
        lod: 'Valida que los entregables cumplan con el LOD contractual antes de ser aprobados.',
        cde: 'Acceso de Lectura/Validación en la carpeta SHARED y PUBLICABLES de Autodesk Construction Cloud.'
      };
    } else if (normName.includes('manager') || normName.includes('coordinador del proyecto')) {
      return {
        uses: 'Lidera la definición del PEB, gestiona perfiles de modelado y dirige la integración multidisciplinaria.',
        lod: 'Define las exigencias de LOD (ej. LOD 200 a 300) y las plantillas TDI para cada disciplina.',
        cde: 'Administrador del Entorno Común de Datos (CDE). Valida y aprueba la promoción de archivos.'
      };
    } else if (normName.includes('coordinador bim')) {
      return {
        uses: 'Coordinación 3D en Navisworks. Detección de interferencias y conciliación espacial.',
        lod: 'Auditor de datos: valida que los modelos alcancen el LOD requerido y contengan los campos TDI correctos.',
        cde: 'Revisa, audita y promueve los archivos desde TRABAJO EN PROGRESO (WIP) a la carpeta de COMPARTIDOS.'
      };
    } else if (normName.includes('especialista') || normName.includes('diseñador') || normName.includes('modelador')) {
      return {
        uses: 'Desarrollo de modelos tridimensionales (Uso 3D) y extracción de cantidades de obra (Uso 5D).',
        lod: 'Operativamente responsable de modelar la geometría con el LOD exigido y llenar los TDI (A a la O).',
        cde: 'Crea, edita y publica información exclusivamente en su carpeta dedicada de TRABAJO EN PROGRESO (WIP).'
      };
    } else if (normName.includes('interventoría')) {
      return {
        uses: 'Supervisión y control externo de estándares de calidad solicitados por el cliente.',
        lod: 'Revisa y audita reportes de cumplimiento de LOD e interferencias.',
        cde: 'Acceso de Auditoría y Lectura general en las carpetas COMPARTIDOS y PUBLICABLES.'
      };
    } else {
      // Custom role defaults
      return {
        uses: 'Ejecución y soporte en usos BIM correspondientes a su disciplina técnica.',
        lod: 'Cumplimiento del LOD y TDI asignados en la Matriz de Requisitos.',
        cde: 'Acceso a carpetas del CDE según privilegios asignados por el BIM Manager.'
      };
    }
  };

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden border-0 relative">
      {/* Persistent Top Bar for View Toggle */}
      <div className="p-3 border-b-2 border-[#1c1c19] bg-[#fcf9f4] flex justify-between items-center shrink-0 shadow-[0_2px_10px_rgba(28,28,25,0.05)] z-20 relative">
        <h3 className="text-sm font-black italic uppercase tracking-tighter text-[#1c1c19]">
          Vista Actual: <span className="text-[#0f4369]">{viewMode === 'table' ? 'Tabla de Responsabilidades' : 'Detalles de Roles'}</span>
        </h3>
        <div className="flex gap-1 bg-white border-2 border-[#1c1c19] p-1 shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
          <button
            onClick={() => setViewMode('split')}
            className={`px-3 py-1.5 flex items-center gap-2 text-[10px] font-black uppercase transition-all ${viewMode === 'split' ? 'bg-[#0f4369] text-white shadow-inner' : 'text-[#72777f] hover:text-[#1c1c19] hover:bg-[#f6f3ee]'}`}
            title="Ver Perfiles"
          >
            <Columns size={14} strokeWidth={3} /> Perfiles
          </button>
          <div className="w-[2px] bg-[#1c1c19]/10"></div>
          <button
            onClick={() => setViewMode('table')}
            className={`px-3 py-1.5 flex items-center gap-2 text-[10px] font-black uppercase transition-all ${viewMode === 'table' ? 'bg-[#0f4369] text-white shadow-inner' : 'text-[#72777f] hover:text-[#1c1c19] hover:bg-[#f6f3ee]'}`}
            title="Ver Tabla General"
          >
            <Table size={14} strokeWidth={3} /> Tabla
          </button>
        </div>
      </div>

      {viewMode === 'table' ? (
        <div className="flex-1 overflow-y-auto p-8 relative bg-white">
          <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
            backgroundImage: 'radial-gradient(circle at center, rgba(28, 28, 25, 0.8) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
          <div className="border-2 border-[#1c1c19] bg-white shadow-[4px_4px_0_0_rgba(28,28,25,1)] z-10 relative">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#f6f3ee] border-b-2 border-[#1c1c19]">
                  <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19] w-1/4">Rol</th>
                  <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19]">Responsabilidad y Obligaciones</th>
                  <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] border-r-2 border-[#1c1c19] w-1/5">Usos BIM</th>
                  <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] w-1/5">Matriz LOD y TDI</th>
                  {canEdit && <th className="p-3 text-[10px] font-black uppercase text-[#1c1c19] w-10"></th>}
                </tr>
              </thead>
              <tbody>
                {bepRoles.length === 0 ? (
                  <tr><td colSpan={canEdit ? "5" : "4"} className="p-4 text-center text-xs font-mono opacity-50 uppercase">No hay roles registrados</td></tr>
                ) : bepRoles.map((role) => (
                  <tr key={role.id} className="border-b border-[#1c1c19]/20 hover:bg-[#f6f3ee]/50 transition-colors group">
                    <td className="p-3 text-xs font-bold text-[#1c1c19] border-r-2 border-[#1c1c19]/20 align-top uppercase">
                      {role.role_name}
                      <div className="text-[9px] text-[#72777f] mt-1 font-bold">{role.organization}</div>
                    </td>
                    <td className="p-3 text-xs font-medium text-gray-700 whitespace-pre-wrap align-top leading-relaxed">{role.responsibilities}</td>
                    <td className="p-3 text-[10px] font-medium text-gray-700 whitespace-pre-wrap align-top border-r-2 border-[#1c1c19]/20">{role.bim_uses || getBimStrategyContext(role.role_name).uses}</td>
                    <td className="p-3 text-[10px] font-medium text-gray-700 whitespace-pre-wrap align-top">{role.lod_tdi || getBimStrategyContext(role.role_name).lod}</td>
                    {canEdit && (
                      <td className="p-3 text-center align-top opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setSelectedRole(role);
                            startEdit(role);
                            setViewMode('split');
                          }}
                          className="p-1.5 bg-[#1c1c19] text-white hover:bg-[#0f4369] transition-colors shadow-sm"
                          title="Editar Rol"
                        >
                          <Edit2 size={12} strokeWidth={3} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* 1. Sidebar - Roles List */}
          <div className="w-80 border-r-2 border-[#1c1c19] flex flex-col bg-[#f6f3ee]">
        <div className="p-6 border-b-2 border-[#1c1c19] bg-white">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-black italic uppercase tracking-tighter">Roles del PEB</h3>
            <div className="flex gap-2">
              {canEdit && (
                <button
                  onClick={() => {
                    setRoleForm({ role_name: '', organization: '', responsibilities: '' });
                    setIsAdding(true);
                    setIsEditing(false);
                  }}
                  className="p-1.5 bg-[#0f4369] text-white border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  title="Añadir Rol Personalizado"
                >
                  <Plus size={16} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
          <span className="text-[7px] font-black text-[#72777f] uppercase tracking-widest block opacity-60">
            EQUIPO_Y_RESPONSABILIDADES
          </span>
        </div>

        {/* DB Sync status warning */}
        {isFallbackActive && (
          <div className="px-4 py-3 bg-amber-50 border-b-2 border-[#1c1c19] flex gap-2 items-start text-[#493f36]">
            <ShieldAlert size={16} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-[8px] font-mono uppercase leading-tight">
              <span className="font-bold text-amber-700 block mb-0.5">MODO LOCAL (SQL PENDIENTE)</span>
              Los cambios se guardan localmente en el navegador. Corre el script <code className="bg-amber-100 px-0.5 text-amber-900 font-bold">supabase_bep_team.sql</code> para sincronizar.
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {loading && bepRoles.length === 0 ? (
            <div className="p-8 flex justify-center">
              <Loader2 className="animate-spin text-[#0f4369]" size={24} />
            </div>
          ) : bepRoles.length === 0 ? (
            <div className="p-8 text-center opacity-30 font-mono text-[9px] uppercase">No hay roles registrados</div>
          ) : bepRoles.map(role => (
            <button
              key={role.id || role.role_name}
              onClick={() => {
                setSelectedRole(role);
                setIsEditing(false);
                setIsAdding(false);
                setShowAssignDropdown(false);
              }}
              className={`w-full text-left p-4 border-b-2 border-[#1c1c19]/10 transition-all hover:bg-white flex items-center justify-between ${selectedRole?.role_name === role.role_name ? 'bg-white border-l-4 border-l-[#0f4369] shadow-sm' : ''}`}
            >
              <div className="flex-1 min-w-0 pr-2">
                <div className="font-black text-xs uppercase tracking-tight truncate">{role.role_name}</div>
                <div className="text-[9px] font-bold text-[#72777f] uppercase truncate">{role.organization}</div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="flex -space-x-1 overflow-hidden">
                  {(role.staff_ids || []).slice(0, 3).map(id => {
                    const staff = getStaffDetail(id);
                    return staff ? (
                      <div 
                        key={id} 
                        style={{ backgroundColor: staff.color || '#0f4369' }}
                        className="w-4 h-4 rounded-full border border-white flex items-center justify-center text-[6px] font-black text-white uppercase"
                        title={staff.name}
                      >
                        {staff.name.substring(0, 1)}
                      </div>
                    ) : null;
                  })}
                  {(role.staff_ids || []).length > 3 && (
                    <div className="w-4 h-4 rounded-full bg-[#1c1c19] border border-white flex items-center justify-center text-[5px] font-black text-white">
                      +{(role.staff_ids || []).length - 3}
                    </div>
                  )}
                </div>
                <ChevronRight size={12} className="text-[#72777f]" />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 2. Main Content Panel */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none opacity-[0.02]" style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(28, 28, 25, 0.8) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />

        {isAdding ? (
          /* Formulario para Añadir Rol Personalizado */
          <div className="relative h-full flex flex-col z-10 p-8 overflow-y-auto max-w-3xl space-y-6">
            <div className="border-b-2 border-[#1c1c19] pb-4">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-1">Añadir Rol Personalizado</h2>
              <p className="text-[10px] font-mono uppercase text-[#72777f]">Crea un nuevo grupo funcional para el Plan de Ejecución BIM (PEB)</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Nombre del Rol / Grupo Funcional *</label>
                <input 
                  type="text" 
                  value={roleForm.role_name}
                  onChange={e => setRoleForm({ ...roleForm, role_name: e.target.value })}
                  placeholder="Ej. Coordinador de Instalaciones (MEP)"
                  className="w-full p-3 border-2 border-[#1c1c19] text-xs font-bold uppercase tracking-wide focus:outline-none focus:border-[#0f4369]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Organización / Empresa Responsable *</label>
                <input 
                  type="text" 
                  value={roleForm.organization}
                  onChange={e => setRoleForm({ ...roleForm, organization: e.target.value })}
                  placeholder="Ej. CNI Ingenieros o PLAN B"
                  className="w-full p-3 border-2 border-[#1c1c19] text-xs font-bold focus:outline-none focus:border-[#0f4369]"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Responsabilidades Clave</label>
                <textarea 
                  value={roleForm.responsibilities}
                  onChange={e => setRoleForm({ ...roleForm, responsibilities: e.target.value })}
                  placeholder="Describa brevemente las obligaciones y tareas de este rol dentro del proyecto..."
                  rows={4}
                  className="w-full p-3 border-2 border-[#1c1c19] text-xs font-medium focus:outline-none focus:border-[#0f4369] resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t-2 border-[#1c1c19]/10">
              <button 
                onClick={() => setIsAdding(false)}
                className="px-4 py-2 border-2 border-[#1c1c19] text-xs font-black uppercase hover:bg-gray-100 transition-all shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                Cancelar
              </button>
              <button 
                onClick={handleAddRole}
                className="px-5 py-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] text-xs font-black uppercase hover:bg-[#0a2e49] transition-all shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
              >
                Guardar Rol
              </button>
            </div>
          </div>
        ) : selectedRole ? (
          /* Panel del Detalle del Rol Seleccionado */
          <div className="relative h-full flex flex-col z-10 overflow-y-auto">
            {/* Header */}
            <div className="p-8 border-b-2 border-[#1c1c19] bg-white">
              <div className="flex justify-between items-start mb-2">
                <div className="space-y-1">
                  <span className="text-[8px] font-black text-[#0f4369] uppercase tracking-widest font-mono block">
                    GRUPO_FUNCIONAL_PEB
                  </span>
                  <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">
                    {selectedRole.role_name}
                  </h2>
                </div>

                <div className="flex gap-2">
                  {canEdit && !isEditing && (
                    <>
                      <button 
                        onClick={startEdit}
                        className="p-2 border-2 border-[#1c1c19] bg-white shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                        title="Editar Rol"
                      >
                        <Edit2 size={14} />
                      </button>
                      {/* Delete button only for custom roles (roles that do not belong to the initial seed) */}
                      {!seedBepRoles.some(s => s.role_name === selectedRole.role_name) && (
                        <button 
                          onClick={() => handleDeleteRole(selectedRole.id)}
                          className="p-2 border-2 border-red-600 text-red-600 bg-white shadow-[3px_3px_0_0_rgba(220,38,38,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                          title="Eliminar Rol"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </>
                  )}
                  {isEditing && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setIsEditing(false)}
                        className="p-2 border-2 border-[#1c1c19] bg-white"
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                      <button 
                        onClick={handleSaveEdit}
                        className="px-4 py-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] text-[10px] font-black uppercase hover:bg-[#0a2e49]"
                      >
                        <Save size={12} className="inline mr-1" /> Guardar
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Organization */}
              {isEditing ? (
                <div className="mt-4">
                  <label className="text-[8px] font-black uppercase text-[#72777f] block mb-1">Organización Responsable</label>
                  <input 
                    type="text" 
                    value={editForm.organization}
                    onChange={e => setEditForm({ ...editForm, organization: e.target.value })}
                    className="p-2 border-2 border-[#1c1c19] w-full text-xs font-bold focus:outline-none"
                  />
                </div>
              ) : (
                <div className="inline-block bg-[#f6f3ee] border border-[#1c1c19] px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-[#0f4369]">
                  Organización: <span className="text-[#1c1c19]">{selectedRole.organization}</span>
                </div>
              )}
            </div>

            {/* Body Info */}
            <div className="p-8 grid grid-cols-1 xl:grid-cols-3 gap-8">
              {/* Col 1 & 2: Responsibilities & Staff */}
              <div className="xl:col-span-2 space-y-8">
                {/* 1. Responsibilities Card */}
                <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[5px_5px_0_0_rgba(28,28,25,0.05)] space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[#72777f] border-b border-[#1c1c19]/10 pb-2 flex items-center gap-2">
                    <ClipboardList size={14} className="text-[#0f4369]" /> Responsabilidades y Obligaciones
                  </h3>
                  {isEditing ? (
                    <textarea 
                      value={editForm.responsibilities}
                      onChange={e => setEditForm({ ...editForm, responsibilities: e.target.value })}
                      rows={5}
                      className="w-full p-3 border-2 border-[#1c1c19] text-xs font-medium focus:outline-none resize-none"
                    />
                  ) : (
                    <p className="text-sm text-slate-700 leading-relaxed font-medium bg-[#fcf9f4] p-4 border border-[#1c1c19]/10">
                      {selectedRole.responsibilities}
                    </p>
                  )}
                </div>

                {/* 2. Staff Assigned Card */}
                <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[5px_5px_0_0_rgba(28,28,25,0.05)] space-y-4">
                  <div className="flex justify-between items-center border-b border-[#1c1c19]/10 pb-2">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#72777f] flex items-center gap-2">
                      <Users size={14} className="text-[#0f4369]" /> Integrantes Asignados
                    </h3>

                    {/* Dropdown triggers */}
                    {isBimManager && (
                      <div className="relative">
                        <button 
                          onClick={() => setShowAssignDropdown(!showAssignDropdown)}
                          className="flex items-center gap-1.5 px-3 py-1 bg-white border-2 border-[#1c1c19] text-[9px] font-black uppercase shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                        >
                          <PlusCircle size={12} /> Asignar Integrante
                        </button>

                        {showAssignDropdown && (
                          <div className="absolute right-0 mt-2 w-64 bg-white border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,1)] z-50 max-h-60 overflow-y-auto">
                            <div className="p-2 border-b border-[#1c1c19] bg-[#f6f3ee] text-[8px] font-mono uppercase font-black tracking-widest text-[#72777f] flex justify-between items-center">
                              <span>SELECCIONAR STAFF</span>
                              <button onClick={() => setShowAssignDropdown(false)}><X size={10} /></button>
                            </div>
                            <div className="divide-y divide-gray-100">
                              {generalStaff.length === 0 ? (
                                <div className="p-4 text-center text-[10px] font-mono uppercase opacity-40">No hay staff registrado</div>
                              ) : generalStaff.map(staff => {
                                const isAssignedToCurrent = (selectedRole.staff_ids || []).includes(staff.id);
                                const assignedRole = bepRoles.find(r => (r.staff_ids || []).includes(staff.id));
                                const isOccupiedByOther = assignedRole && assignedRole.id !== selectedRole.id;
                                
                                return (
                                  <button
                                    key={staff.id}
                                    onClick={() => {
                                      if (!isOccupiedByOther) handleToggleStaff(staff.id);
                                    }}
                                    disabled={isOccupiedByOther}
                                    className={`w-full text-left px-3 py-2 flex flex-col justify-center hover:bg-[#f6f3ee] ${isOccupiedByOther ? 'opacity-50 cursor-not-allowed bg-gray-50' : ''}`}
                                  >
                                    <div className="flex items-center justify-between w-full">
                                      <div className="flex items-center gap-2 truncate">
                                        <div style={{ backgroundColor: staff.color || '#0f4369' }} className="w-2.5 h-2.5 rounded-full shrink-0" />
                                        <span className="text-[11px] font-bold truncate">{staff.name}</span>
                                      </div>
                                      {isAssignedToCurrent && <Check size={12} className="text-green-600 shrink-0 font-bold" />}
                                    </div>
                                    {assignedRole && (
                                      <span className="text-[8px] text-[#72777f] font-mono uppercase truncate mt-0.5 ml-4">
                                        {isAssignedToCurrent ? 'Asignado aquí' : `En: ${assignedRole.role_name}`}
                                      </span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* List of assigned people */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(selectedRole.staff_ids || []).length === 0 ? (
                      <div className="md:col-span-2 p-6 border-2 border-dashed border-[#1c1c19]/20 text-center text-xs font-mono uppercase text-[#72777f]">
                        No hay integrantes asignados a este rol.
                      </div>
                    ) : (
                      selectedRole.staff_ids.map(id => {
                        const staff = getStaffDetail(id);
                        if (!staff) return null;
                        return (
                          <div 
                            key={id} 
                            className="p-4 bg-[#fcf9f4] border-2 border-[#1c1c19] flex items-center justify-between shadow-[3px_3px_0_0_rgba(28,28,25,0.05)]"
                          >
                            <div className="flex items-center gap-3">
                              <div 
                                style={{ backgroundColor: staff.color || '#0f4369' }} 
                                className="w-8 h-8 rounded-full border-2 border-[#1c1c19] flex items-center justify-center text-white font-black uppercase text-xs shadow-sm"
                              >
                                {staff.name.substring(0, 1)}
                              </div>
                              <div>
                                <h4 className="font-black text-xs uppercase">{staff.name}</h4>
                                <p className="text-[8px] font-mono uppercase tracking-tight text-[#72777f]">{staff.role_description || 'Integrante'}</p>
                              </div>
                            </div>

                            {isBimManager && (
                              <button 
                                onClick={() => handleToggleStaff(id)}
                                className="p-1 text-red-500 hover:bg-white hover:border border-red-500 rounded transition-all"
                                title="Desasignar"
                              >
                                <X size={12} />
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>

              {/* Col 3: BIM Strategy Integration */}
              <div className="space-y-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-[#1c1c19] border-b-2 border-[#1c1c19] pb-2">
                  Estrategia BIM del Rol
                </h3>

                {/* Uses & Strategy */}
                <div className="bg-[#fcf9f4] border-2 border-[#1c1c19] p-5 shadow-[4px_4px_0_0_rgba(28,28,25,0.05)] space-y-4">
                  <div className="space-y-1">
                    <div className="text-[7px] font-black uppercase tracking-wider text-[#72777f] flex items-center gap-1.5">
                      <Workflow size={10} className="text-[#0f4369]" /> Ejecución de Usos BIM
                    </div>
                    {isEditing ? (
                      <textarea
                        value={editForm.bim_uses}
                        onChange={e => setEditForm({ ...editForm, bim_uses: e.target.value })}
                        rows={3}
                        className="w-full p-2 border-2 border-[#1c1c19] text-[10px] font-mono uppercase focus:outline-none resize-none"
                      />
                    ) : (
                      <p className="text-[10px] font-semibold text-[#1c1c19] leading-relaxed uppercase font-mono">
                        {selectedRole.bim_uses || getBimStrategyContext(selectedRole.role_name).uses}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 border-t border-[#1c1c19]/10 pt-3">
                    <div className="text-[7px] font-black uppercase tracking-wider text-[#72777f] flex items-center gap-1.5">
                      <ClipboardList size={10} className="text-[#0f4369]" /> Matriz LOD y TDI
                    </div>
                    {isEditing ? (
                      <textarea
                        value={editForm.lod_tdi}
                        onChange={e => setEditForm({ ...editForm, lod_tdi: e.target.value })}
                        rows={3}
                        className="w-full p-2 border-2 border-[#1c1c19] text-[10px] font-mono uppercase focus:outline-none resize-none"
                      />
                    ) : (
                      <p className="text-[10px] font-semibold text-[#1c1c19] leading-relaxed uppercase font-mono">
                        {selectedRole.lod_tdi || getBimStrategyContext(selectedRole.role_name).lod}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 border-t border-[#1c1c19]/10 pt-3">
                    <div className="text-[7px] font-black uppercase tracking-wider text-[#72777f] flex items-center gap-1.5">
                      <FolderOpen size={10} className="text-[#0f4369]" /> Colaboración en CDE (ACC)
                    </div>
                    {isEditing ? (
                      <textarea
                        value={editForm.cde_collaboration}
                        onChange={e => setEditForm({ ...editForm, cde_collaboration: e.target.value })}
                        rows={3}
                        className="w-full p-2 border-2 border-[#1c1c19] text-[10px] font-mono uppercase focus:outline-none resize-none"
                      />
                    ) : (
                      <p className="text-[10px] font-semibold text-[#1c1c19] leading-relaxed uppercase font-mono">
                        {selectedRole.cde_collaboration || getBimStrategyContext(selectedRole.role_name).cde}
                      </p>
                    )}
                  </div>
                </div>

                {/* Explicación de los engranajes BIM */}
                <div className="p-4 border border-[#1c1c19]/15 bg-white space-y-2">
                  <h4 className="text-[9px] font-black uppercase tracking-widest text-[#1c1c19] flex items-center gap-1">
                    <HelpCircle size={10} /> Flujo Colaborativo
                  </h4>
                  <p className="text-[8px] text-slate-500 leading-normal uppercase font-mono">
                    La definición del equipo es el engranaje operativo para aplicar el LOD y TDI de los modelos en Autodesk Construction Cloud. Asegura que los Especialistas trabajen en WIP y la Coordinación valide hacia SHARED.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Empty selection state */
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 border-4 border-dashed border-[#1c1c19]/20 flex items-center justify-center mb-6">
              <Users size={36} className="text-[#1c1c19]/20" />
            </div>
            <h2 className="text-xl font-black italic uppercase tracking-widest text-[#1c1c19]/30">Roles del PEB</h2>
            <p className="text-[10px] font-mono uppercase text-[#72777f] max-w-xs mt-2">
              Seleccione un rol del panel lateral para ver sus responsabilidades, empresas asociadas, staff asignado y alineación con la estrategia BIM.
            </p>
          </div>
        )}
          </div>
        </div>
      )}
    </div>
  );
}
