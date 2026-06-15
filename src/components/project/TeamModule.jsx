import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Users, User, Search, Plus, Mail, Phone, Calendar, CheckCircle, Clock, Briefcase, ChevronDown, ChevronUp, Loader2, Edit2, Save, X, Trash2 } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { openInspector } from '../../store/uiSlice';
import RolesModal from './RolesModal';
import SpecialtiesModal from './SpecialtiesModal';
import BepTeamModule from './BepTeamModule';
import TeamTableModule from './TeamTableModule';
import SpecialtiesProjectTab from './SpecialtiesProjectTab';
import { useAuth } from '../../context/AuthContext';
import { projectService } from '../../services/projectService';

export default function TeamModule({ project }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSubTab = searchParams.get('subtab') || 'directorio';

  const handleSubTabChange = (subtab) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('subtab', subtab);
      return next;
    });
  };

  const [selectedMember, setSelectedMember] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
  const [isSpecialtiesModalOpen, setIsSpecialtiesModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', role_description: '', especialidad: '', compania: '', email: '', phone: '' });
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    role_description: '',
    especialidad: '',
    compania: '',
    email: '',
    phone: '',
    color: '#0f4369'
  });
  const dispatch = useDispatch();
  const { isAdmin, isBimManager } = useAuth();
  
  const canEdit = isAdmin || isBimManager;

  const handleInspect = (item, type) => {
    dispatch(openInspector({ item, type }));
  };

  const [memberTasks, setMemberTasks] = useState([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true);
        const data = await projectService.getStaff();
        setMembers(data || []);
      } catch (error) {
        console.error("Error fetching staff:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStaff();
  }, []);

  useEffect(() => {
    if (selectedMember) {
      const fetchMemberTasks = async () => {
        try {
          setLoadingTasks(true);
          // Buscamos tareas del staff en este proyecto (o todos si se prefiere)
          const data = await projectService.getTasks(project?.id, selectedMember.id);
          setMemberTasks(data || []);
        } catch (error) {
          console.error("Error fetching member tasks:", error);
        } finally {
          setLoadingTasks(false);
        }
      };
      fetchMemberTasks();
    }
  }, [selectedMember, project?.id]);

  const filteredMembers = members.filter(m => (m.name || m.nombre || '').toLowerCase().includes(searchQuery.toLowerCase()));

  const handleAddMember = () => {
    setNewStaffForm({
      name: '',
      role_description: '',
      especialidad: '',
      compania: '',
      email: '',
      phone: '',
      color: '#0f4369'
    });
    setIsAddingStaff(true);
    setSelectedMember(null);
    setIsEditingProfile(false);
  };

  const handleCreateStaff = async (e) => {
    if (e) e.preventDefault();
    if (!newStaffForm.name.trim()) {
      alert("El nombre es obligatorio");
      return;
    }
    try {
      setLoading(true);
      const newStaff = await projectService.createStaff(newStaffForm);
      setMembers(prev => [...prev, newStaff].sort((a, b) => {
        const nameA = (a.name || a.nombre || '').toLowerCase();
        const nameB = (b.name || b.nombre || '').toLowerCase();
        return nameA.localeCompare(nameB);
      }));
      setSelectedMember(newStaff);
      setIsAddingStaff(false);
    } catch (error) {
      console.error("Error creating staff:", error);
      alert("Error al crear el integrante: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setEditForm({
      name: selectedMember.name || selectedMember.nombre || '',
      role_description: selectedMember.role_description || '',
      especialidad: selectedMember.especialidad || '',
      compania: selectedMember.compania || '',
      email: selectedMember.email || '',
      phone: selectedMember.phone || ''
    });
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    try {
      const updated = await projectService.updateStaff(selectedMember.id, editForm);
      setSelectedMember(updated);
      setMembers(members.map(m => m.id === updated.id ? updated : m));
      setIsEditingProfile(false);
    } catch (err) {
      console.error("Error updating profile:", err);
      alert("Error al actualizar perfil");
    }
  };

  const handleDeleteStaff = async (id) => {
    if (!window.confirm("¿Seguro que deseas eliminar a este integrante del equipo? Se removerá de todas las asignaciones.")) return;
    try {
      setLoading(true);
      await projectService.deleteStaff(id);
      const updatedMembers = members.filter(m => m.id !== id);
      setMembers(updatedMembers);
      setSelectedMember(updatedMembers[0] || null);
    } catch (err) {
      console.error("Error deleting staff member:", err);
      alert("Error al eliminar el integrante: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const completedTasks = Array.isArray(memberTasks) ? memberTasks.filter(t => t?.finished).length : 0;
  const activeTasksCount = Array.isArray(memberTasks) ? (memberTasks.length - completedTasks) : 0;

  if (loading) return (
    <div className="flex-1 flex items-center justify-center bg-[#f6f3ee]">
      <Loader2 size={40} className="animate-spin text-[#0f4369]" />
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white border-2 border-[#1c1c19] overflow-hidden relative">
      {/* Header with Tabs */}
      <div className="flex-none p-4 border-b-2 border-[#1c1c19] bg-[#f6f3ee] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(28,28,25,1)]">
            <Users size={18} />
          </div>
          <div>
            <span className="text-[7px] font-black text-[#72777f] uppercase tracking-[0.3em] mb-0.5 opacity-50 italic">
              GESTION_DE_EQUIPO / {project?.name?.toUpperCase()}
            </span>
            <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">
              Equipo del Proyecto
            </h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-white border-2 border-[#1c1c19] p-0.5 shadow-[3px_3px_0_0_rgba(28,28,25,1)]">
          <button 
            onClick={() => handleSubTabChange('directorio')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${activeSubTab === 'directorio' ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#f6f3ee]'}`}
          >
            Directorio de Staff
          </button>
          <button 
            onClick={() => handleSubTabChange('roles')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${activeSubTab === 'roles' ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#f6f3ee]'}`}
          >
            Roles y Responsabilidades PEB
          </button>
          <button 
            onClick={() => handleSubTabChange('tabla')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${activeSubTab === 'tabla' ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#f6f3ee]'}`}
          >
            Tabla de Datos
          </button>
          <button 
            onClick={() => handleSubTabChange('especialidades')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${activeSubTab === 'especialidades' ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#f6f3ee]'}`}
          >
            Especialidades
          </button>
          <button 
            onClick={() => setSearchParams({ tab: 'datos', subtab: 'cronograma' })}
            className="px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all bg-[#0f4369] text-white hover:bg-[#0a2e49] ml-1"
          >
            CRONOGRAMA ENTREGAS
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeSubTab === 'roles' ? (
          <BepTeamModule project={project} />
        ) : activeSubTab === 'tabla' ? (
          <TeamTableModule project={project} />
        ) : activeSubTab === 'especialidades' ? (
          <SpecialtiesProjectTab project={project} />
        ) : (
          <div className="flex h-full overflow-hidden">
            {/* Sidebar - Team List */}
            <div className="w-80 border-r-2 border-[#1c1c19] flex flex-col bg-[#f6f3ee]">
              <div className="p-6 border-b-2 border-[#1c1c19] bg-white">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-black italic uppercase tracking-tighter">Equipo</h3>
            {canEdit && (
              <button
                onClick={handleAddMember}
                className="p-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <Plus size={16} strokeWidth={3} />
              </button>
            )}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72777f]" />
            <input
              type="text"
              placeholder="BUSCAR_INTEGRANTE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#1c1c19] text-[10px] font-mono uppercase focus:outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {members.length === 0 ? (
            <div className="p-8 text-center opacity-30 font-mono text-[10px] uppercase">No hay integrantes registrados</div>
          ) : filteredMembers.map(member => (
            <button
              key={member.id}
              onClick={() => {
                setSelectedMember(member);
                setIsEditingProfile(false);
                setIsAddingStaff(false);
              }}
              className={`w-full text-left p-4 border-b-2 border-[#1c1c19]/10 transition-all hover:bg-white flex items-center gap-4 ${!isAddingStaff && selectedMember?.id === member.id ? 'bg-white border-l-4 border-l-[#0f4369] shadow-sm' : ''}`}
            >
              <div className="w-10 h-10 rounded-full border-2 border-[#1c1c19] flex items-center justify-center bg-white overflow-hidden">
                <User size={20} className="text-[#0f4369]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-black text-sm uppercase">{member.name || member.nombre}</div>
                <div className="text-[10px] font-bold text-[#72777f] uppercase truncate">{member.role_description || 'ARQ_COL'}</div>
                {member.especialidad && <div className="text-[9px] font-mono text-[#0f4369] uppercase truncate pt-1">{member.especialidad}</div>}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Panel */}
      <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at center, rgba(28, 28, 25, 0.1) 1px, transparent 1px)',
          backgroundSize: '20px 20px'
        }} />

        {isAddingStaff ? (
          <div className="relative h-full flex flex-col z-10 overflow-y-auto p-8">
            <div className="w-full max-w-2xl mx-auto bg-white border-2 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)] p-6 space-y-6">
              <div className="flex justify-between items-center border-b-2 border-[#1c1c19] pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(28,28,25,1)]">
                    <User size={18} />
                  </div>
                  <div>
                    <span className="text-[7px] font-black text-[#72777f] uppercase tracking-[0.3em] mb-0.5 opacity-50 italic">
                      REGISTRO_NUEVO_INTEGRANTE
                    </span>
                    <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">
                      Agregar Staff
                    </h2>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddingStaff(false)}
                  className="p-2 border-2 border-[#1c1c19] hover:bg-[#f6f3ee] transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleCreateStaff} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={newStaffForm.name}
                      onChange={e => {
                        const val = e.target.value;
                        const defaultEmail = `${val.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '.')}@ark-tvs.com`;
                        setNewStaffForm({ ...newStaffForm, name: val, email: newStaffForm.email === '' || newStaffForm.email.endsWith('@ark-tvs.com') ? defaultEmail : newStaffForm.email });
                      }}
                      placeholder="Ej: Alejandro Gomez"
                      className="w-full p-3 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none focus:border-[#0f4369]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Cargo / Rol</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newStaffForm.role_description}
                        onChange={e => setNewStaffForm({ ...newStaffForm, role_description: e.target.value })}
                        placeholder="Ej: Coordinador Técnico"
                        className="flex-1 p-3 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none focus:border-[#0f4369]"
                      />
                      <button
                        type="button"
                        onClick={() => setIsRolesModalOpen(true)}
                        className="px-3 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] hover:bg-white transition-all flex items-center justify-center shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                        title="Seleccionar del Catálogo de Roles"
                      >
                        <Briefcase size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Especialidad / Área</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newStaffForm.especialidad}
                        onChange={e => setNewStaffForm({ ...newStaffForm, especialidad: e.target.value })}
                        placeholder="Ej: Estructuras"
                        className="flex-1 p-3 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none focus:border-[#0f4369]"
                      />
                      <button
                        type="button"
                        onClick={() => setIsSpecialtiesModalOpen(true)}
                        className="px-3 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] hover:bg-white transition-all flex items-center justify-center shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                        title="Seleccionar del Catálogo de Especialidades"
                      >
                        <Users size={16} />
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Compañía</label>
                    <input
                      type="text"
                      value={newStaffForm.compania}
                      onChange={e => setNewStaffForm({ ...newStaffForm, compania: e.target.value })}
                      placeholder="Ej: Bioclimática"
                      className="w-full p-3 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none focus:border-[#0f4369]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Email</label>
                    <input
                      type="email"
                      value={newStaffForm.email}
                      onChange={e => setNewStaffForm({ ...newStaffForm, email: e.target.value })}
                      placeholder="correo@ejemplo.com"
                      className="w-full p-3 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none focus:border-[#0f4369]"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Teléfono</label>
                    <input
                      type="text"
                      value={newStaffForm.phone}
                      onChange={e => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                      placeholder="+57 300 000 0000"
                      className="w-full p-3 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none focus:border-[#0f4369]"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Color Asignado</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={newStaffForm.color}
                        onChange={e => setNewStaffForm({ ...newStaffForm, color: e.target.value })}
                        className="w-16 h-12 bg-white border-2 border-[#1c1c19] p-0.5 cursor-pointer"
                      />
                      <span className="text-xs font-mono font-bold uppercase">{newStaffForm.color}</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t-2 border-[#1c1c19] border-dashed">
                  <button
                    type="button"
                    onClick={() => setIsAddingStaff(false)}
                    className="px-6 py-2.5 border-2 border-[#1c1c19] text-sm font-black uppercase hover:bg-gray-100 transition-all shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-[#0f4369] text-white border-2 border-[#1c1c19] text-sm font-black uppercase hover:bg-[#0a2e49] transition-all flex items-center gap-2 shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
                  >
                    <Save size={16} /> Registrar Miembro
                  </button>
                </div>
              </form>
            </div>
          </div>
        ) : selectedMember ? (
          <div className="relative h-full flex flex-col z-10 overflow-y-auto">
            {/* Profiler Header */}
            <div className="p-8 border-b-2 border-[#1c1c19] bg-white">
              <div className="flex items-start gap-8">
                <div className="flex flex-col gap-4">
                  <div
                    onClick={() => handleInspect(selectedMember, 'staff')}
                    className="w-24 h-24 border-2 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)] flex items-center justify-center bg-[#f6f3ee] cursor-pointer hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0 transition-all"
                  >
                    <User size={48} className="text-[#0f4369]" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[7px] font-black uppercase tracking-widest text-[#72777f]">Color_Asignado</label>
                    <input 
                      type="color" 
                      value={selectedMember.color || '#0f4369'} 
                      disabled={!canEdit}
                      onChange={async (e) => {
                        if (!canEdit) return;
                        const newColor = e.target.value;
                        try {
                          const updated = await projectService.updateStaff(selectedMember.id, { color: newColor });
                          setSelectedMember(updated);
                          setMembers(members.map(m => m.id === updated.id ? updated : m));
                        } catch (err) {
                          console.error("Error updating staff color:", err);
                        }
                      }}
                      className={`w-full h-6 bg-white border-2 border-[#1c1c19] p-0.5 ${canEdit ? 'cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                    />
                  </div>
                </div>
                <div className="flex-1">
                  {isEditingProfile ? (
                    <div className="w-full space-y-4">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-black uppercase">Editar Perfil</h2>
                        <div className="flex gap-2">
                          <button onClick={() => setIsEditingProfile(false)} className="p-2 border-2 border-[#1c1c19] hover:bg-gray-100 transition-all"><X size={16}/></button>
                          <button onClick={handleSaveProfile} className="p-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] hover:bg-[#0a2e49] flex items-center gap-2 transition-all"><Save size={16}/> GUARDAR</button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black uppercase text-[#72777f]">Nombre</label>
                          <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none focus:border-[#0f4369]" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-[#72777f]">Cargo/Rol</label>
                          <div className="flex gap-2">
                            <input type="text" value={editForm.role_description} onChange={e => setEditForm({...editForm, role_description: e.target.value})} className="flex-1 w-full p-2 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none focus:border-[#0f4369]" />
                            <button type="button" onClick={() => setIsRolesModalOpen(true)} className="px-3 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] hover:bg-white transition-all flex items-center justify-center shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" title="Seleccionar del Catálogo de Roles">
                              <Briefcase size={16} />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-[#72777f]">Especialidad / Área</label>
                          <div className="flex gap-2">
                            <input type="text" value={editForm.especialidad} onChange={e => setEditForm({...editForm, especialidad: e.target.value})} className="flex-1 w-full p-2 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none focus:border-[#0f4369]" />
                            <button type="button" onClick={() => setIsSpecialtiesModalOpen(true)} className="px-3 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] hover:bg-white transition-all flex items-center justify-center shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" title="Seleccionar del Catálogo de Especialidades">
                              <Users size={16} />
                            </button>
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-[#72777f]">Compañía</label>
                          <input type="text" value={editForm.compania} onChange={e => setEditForm({...editForm, compania: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none focus:border-[#0f4369]" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-[#72777f]">Email</label>
                          <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none focus:border-[#0f4369]" />
                        </div>
                        <div>
                          <label className="text-[10px] font-black uppercase text-[#72777f]">Teléfono</label>
                          <input type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full p-2 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none focus:border-[#0f4369]" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full">
                      <div className="flex justify-between items-start">
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter mb-2">{selectedMember.name || selectedMember.nombre}</h2>
                        {canEdit && (
                          <div className="flex gap-2">
                            <button onClick={startEditing} className="p-2 border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all bg-white" title="Editar Información">
                              <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteStaff(selectedMember.id)} className="p-2 border-2 border-red-600 text-red-600 bg-white shadow-[3px_3px_0_0_rgba(220,38,38,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all" title="Eliminar Integrante">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#72777f]">
                          <Briefcase size={12} /> {selectedMember.role_description || 'NO_SET'}
                        </div>
                        {selectedMember.compania && (
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#1c1c19]">
                            <Briefcase size={12} /> {selectedMember.compania}
                          </div>
                        )}
                        {selectedMember.especialidad && (
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#0f4369]">
                            <Users size={12} /> {selectedMember.especialidad}
                          </div>
                        )}
                        {selectedMember.email && (
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#72777f]">
                            <Mail size={12} /> {selectedMember.email}
                          </div>
                        )}
                        {selectedMember.phone && (
                          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#72777f]">
                            <Phone size={12} /> {selectedMember.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content Statistics */}
            <div className="p-8 space-y-8">
              <div className="grid grid-cols-3 gap-6">
                <div className="p-6 bg-[#f6f3ee] border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,0.05)]">
                  <span className="text-[9px] font-black text-[#72777f] uppercase block mb-2 tracking-[4px]">Tareas Activas</span>
                  <div className="text-4xl font-black italic text-[#0f4369]">{activeTasksCount || 0}</div>
                </div>
                <div className="p-6 bg-[#f6f3ee] border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,0.05)]">
                  <span className="text-[9px] font-black text-[#72777f] uppercase block mb-2 tracking-[4px]">Completadas</span>
                  <div className="text-4xl font-black italic text-[#493f36]">{completedTasks || 0}</div>
                </div>
                <div className="p-6 bg-[#f6f3ee] border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,0.05)]">
                  <span className="text-[9px] font-black text-[#72777f] uppercase block mb-2 tracking-[4px]">Total</span>
                  <div className="text-4xl font-black italic text-[#1c1c19]">{memberTasks?.length || 0}</div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-black italic uppercase italic tracking-widest border-b-2 border-[#1c1c19] pb-2">Bitácora de Actividad</h3>
                <div className="space-y-2">
                  {loadingTasks ? (
                    <div className="flex items-center justify-center p-8">
                      <Loader2 size={24} className="animate-spin text-[#0f4369]" />
                    </div>
                  ) : memberTasks.length === 0 ? (
                    <div className="p-8 text-center opacity-30 font-mono text-[10px] uppercase border-2 border-dashed border-[#1c1c19]">No hay tareas registradas</div>
                  ) : memberTasks.map((task) => (
                    <div 
                      key={task.id} 
                      onClick={() => handleInspect(task, 'TASK')}
                      className="flex items-center justify-between p-4 bg-white border-2 border-[#1c1c19] hover:-translate-y-1 transition-all cursor-pointer shadow-[4px_4px_0_0_rgba(28,28,25,1)]"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-8 h-8 flex items-center justify-center border-2 border-[#1c1c19] ${task.finished ? 'bg-green-500 text-white' : 'bg-white'}`}>
                          {task.finished ? <CheckCircle size={14} /> : <Clock size={14} />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {task.subProjects?.name && (
                              <span className="text-[8px] font-black bg-[#0f4369] text-white px-1.5 py-0.5">{task.subProjects.name}</span>
                            )}
                            <h4 className="font-black text-xs uppercase tracking-tight">{task.name || task.description}</h4>
                          </div>
                          <p className="text-[10px] font-mono text-[#72777f] mt-1">
                            {task.fecha_inicio ? new Date(task.fecha_inicio).toLocaleDateString() : 'SIN_FECHA'}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 border-4 border-dashed border-[#1c1c19]/20 flex items-center justify-center mb-6">
              <Users size={40} className="text-[#1c1c19]/20" />
            </div>
            <h2 className="text-2xl font-black italic uppercase italic tracking-widest text-[#1c1c19]/30">Directorio de Equipo</h2>
            <p className="text-xs font-mono uppercase text-[#72777f] max-w-xs mt-2">
              Seleccione un integrante del equipo en el panel lateral para ver su carga de trabajo, bitácora y contacto.
            </p>
          </div>
        )}
      </div>

      </div>
    )}
  </div>

      <RolesModal 
        isOpen={isRolesModalOpen} 
        onClose={() => setIsRolesModalOpen(false)} 
        onSelectRole={(role) => {
          if (isAddingStaff) {
            setNewStaffForm(prev => ({ ...prev, role_description: role.name }));
          } else {
            setEditForm(prev => ({ ...prev, role_description: role.name }));
          }
          setIsRolesModalOpen(false);
        }}
      />
      <SpecialtiesModal 
        isOpen={isSpecialtiesModalOpen} 
        onClose={() => setIsSpecialtiesModalOpen(false)} 
        projectId={project.id}
        onSelectSpecialty={(specialty) => {
          if (isAddingStaff) {
            setNewStaffForm(prev => ({ ...prev, especialidad: specialty.name }));
          } else {
            setEditForm(prev => ({ ...prev, especialidad: specialty.name }));
          }
          setIsSpecialtiesModalOpen(false);
        }}
      />
    </div>
  );
}
