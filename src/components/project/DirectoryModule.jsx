import React, { useState, useEffect } from 'react';
import { Search, Plus, User, Phone, Mail, MapPin, Building, Trash2, Edit2, ExternalLink, X, Save, Briefcase, Users } from 'lucide-react';
import { projectService } from '../../services/projectService';
import RolesModal from './RolesModal';
import SpecialtiesModal from './SpecialtiesModal';

export default function DirectoryModule({ project }) {
   const [contacts, setContacts] = useState([]);
   const [search, setSearch] = useState('');
   const [loading, setLoading] = useState(true);

   // Modal state
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [modalMode, setModalMode] = useState('create'); // 'create', 'edit'
   const [selectedContactId, setSelectedContactId] = useState(null);
   const [isRolesModalOpen, setIsRolesModalOpen] = useState(false);
   const [isSpecialtiesModalOpen, setIsSpecialtiesModalOpen] = useState(false);

   const [formData, setFormData] = useState({
      name: '',
      role: '',
      enterprise: '',
      phone: '',
      email: ''
   });

   useEffect(() => {
      fetchContacts();
   }, [project?.id]);

   const fetchContacts = async () => {
      try {
         setLoading(true);
         const data = await projectService.getDirectoryContacts(project?.id);
         setContacts(data || []);
      } catch (err) {
         console.error("Error fetching contacts:", err);
      } finally {
         setLoading(false);
      }
   };

   const filtered = contacts.filter(c => 
      c.name.toLowerCase().includes(search.toLowerCase()) || 
      (c.enterprise && c.enterprise.toLowerCase().includes(search.toLowerCase())) ||
      (c.role && c.role.toLowerCase().includes(search.toLowerCase()))
   );

   const openCreateModal = () => {
      setModalMode('create');
      setFormData({
         name: '',
         role: '',
         discipline: '',
         enterprise: '',
         phone: '',
         email: ''
      });
      setSelectedContactId(null);
      setIsModalOpen(true);
   };

   const openEditModal = (contact) => {
      setModalMode('edit');
      setFormData({
         name: contact.name || '',
         role: contact.role || '',
         discipline: contact.discipline || '',
         enterprise: contact.enterprise || '',
         phone: contact.phone || '',
         email: contact.email || ''
      });
      setSelectedContactId(contact.id);
      setIsModalOpen(true);
   };

   const handleDelete = async (id) => {
      if (window.confirm('¿Estás seguro de que quieres eliminar este contacto?')) {
         try {
            await projectService.deleteDirectoryContact(id);
            fetchContacts();
         } catch (err) {
            console.error("Error deleting contact:", err);
            alert("Error al eliminar el contacto.");
         }
      }
   };

   const handleSave = async () => {
      try {
         if (modalMode === 'create') {
            await projectService.createDirectoryContact({
               ...formData,
               project_id: project?.id || null
            });
         } else {
            await projectService.updateDirectoryContact(selectedContactId, formData);
         }
         setIsModalOpen(false);
         fetchContacts();
      } catch (err) {
         console.error("Error saving contact:", err);
         alert("Error al guardar el contacto.");
      }
   };

   return (
      <div className="h-full flex flex-col bg-white border-2 border-[#1c1c19] relative">
         <div className="p-8 border-b-2 border-[#1c1c19] bg-[#f6f3ee] flex justify-between items-end flex-none">
            <div>
               <h2 className="text-4xl font-black italic uppercase tracking-tighter leading-tight">Directorio Externo</h2>
               <p className="text-[10px] font-bold text-[#72777f] uppercase tracking-[0.3em] mt-2">Mando y Control // Contactos de Terceros</p>
            </div>
            <div className="flex gap-4">
               <div className="relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72777f]" />
                  <input
                     type="text"
                     placeholder="BUSCAR_CONTACTO..."
                     value={search}
                     onChange={(e) => setSearch(e.target.value)}
                     className="pl-10 pr-6 py-3 border-2 border-[#1c1c19] bg-white text-xs font-black uppercase outline-none w-64 shadow-[4px_4px_0_0_rgba(28,28,25,0.05)] focus:bg-[#fcf9f4] transition-colors"
                  />
               </div>
               <button 
                  onClick={openCreateModal}
                  className="px-6 py-3 bg-[#0f4369] text-white font-black text-xs uppercase shadow-[6px_6px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0 transition-all flex items-center gap-2"
               >
                  <Plus size={16} /> Crear Contacto
               </button>
            </div>
         </div>

         <div className="flex-1 p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto custom-scrollbar bg-[#fcf9f4]">
            {loading ? (
               <div className="col-span-full text-center p-12 text-[#72777f] font-mono text-xs uppercase animate-pulse">Cargando directorio...</div>
            ) : filtered.length === 0 ? (
               <div className="col-span-full text-center p-12 text-[#72777f] font-mono text-xs uppercase border-2 border-dashed border-[#1c1c19]/20">No se encontraron contactos en el directorio.</div>
            ) : (
               filtered.map(contact => (
                  <div key={contact.id} className="group p-6 bg-white border-2 border-[#1c1c19] shadow-[10px_10px_0_0_rgba(28,28,25,0.05)] hover:shadow-[10px_10px_0_0_rgba(15,67,105,0.2)] hover:-translate-y-1 transition-all relative overflow-hidden flex flex-col">
                     <div className="absolute top-0 right-0 w-2 h-full bg-[#1c1c19] group-hover:bg-[#0f4369] transition-all"></div>

                     <div className="flex justify-between items-start mb-6">
                        <div className="w-14 h-14 border-2 border-[#1c1c19] bg-[#f6f3ee] flex items-center justify-center text-[#1c1c19]">
                           <User size={32} />
                        </div>
                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                           <button 
                              onClick={() => openEditModal(contact)}
                              className="p-2 border-2 border-[#1c1c19] bg-white hover:bg-[#1c1c19] hover:text-white transition-all"
                              title="Editar Contacto"
                           >
                              <Edit2 size={12} />
                           </button>
                           <button 
                              onClick={() => handleDelete(contact.id)}
                              className="p-2 border-2 border-[#1c1c19] bg-white hover:bg-red-500 hover:text-white transition-all"
                              title="Eliminar Contacto"
                           >
                              <Trash2 size={12} />
                           </button>
                        </div>
                     </div>

                     <h3 className="text-xl font-black uppercase italic tracking-tighter mb-1 line-clamp-1" title={contact.name}>{contact.name}</h3>
                     <div className="flex gap-2 mb-4 flex-wrap">
                        <div className="text-[10px] font-black uppercase bg-[#0f4369] text-white px-2 py-0.5 inline-block tracking-widest">{contact.role || 'Rol no definido'}</div>
                        {contact.discipline && (
                           <div className="text-[10px] font-black uppercase bg-[#1c1c19] text-white px-2 py-0.5 inline-block tracking-widest">{contact.discipline}</div>
                        )}
                     </div>

                     <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3 text-xs font-bold text-[#1c1c19] uppercase tracking-tight">
                           <Building size={14} className="text-[#72777f] shrink-0" /> <span className="truncate" title={contact.enterprise}>{contact.enterprise || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-[#1c1c19] uppercase tracking-tight">
                           <Phone size={14} className="text-[#72777f] shrink-0" /> <span className="truncate">{contact.phone || 'N/A'}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-[#1c1c19] uppercase tracking-tight">
                           <Mail size={14} className="text-[#72777f] shrink-0" /> <span className="truncate" title={contact.email}>{contact.email || 'N/A'}</span>
                        </div>
                     </div>

                     <button className="w-full mt-6 py-3 border-2 border-[#1c1c19] font-black text-[10px] uppercase hover:bg-[#1c1c19] hover:text-white transition-all flex items-center justify-center gap-2 group/btn">
                        Abrir_Perfil_Vínculo <ExternalLink size={12} className="group-hover/btn:translate-x-1 transition-all" />
                     </button>
                  </div>
               ))
            )}
         </div>

         {/* Modal de Creación/Edición */}
         {isModalOpen && (
            <div className="fixed inset-0 bg-[#1c1c19]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white border-2 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(28,28,25,1)] w-full max-w-lg flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  
                  {/* Modal Header */}
                  <div className="flex-none p-6 border-b-2 border-[#1c1c19] flex justify-between items-center bg-[#fcf9f4]">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-[#1c1c19] text-white flex items-center justify-center">
                           <User size={20} />
                        </div>
                        <div>
                           <h3 className="text-xl font-black uppercase italic tracking-tighter">
                              {modalMode === 'edit' ? 'Editar Contacto' : 'Nuevo Contacto'}
                           </h3>
                           <p className="text-[10px] font-mono text-[#72777f] uppercase">
                              Directorio Externo
                           </p>
                        </div>
                     </div>
                     <button 
                        onClick={() => setIsModalOpen(false)}
                        className="p-2 hover:bg-[#e5e2dd] transition-colors border-2 border-transparent hover:border-[#1c1c19]"
                     >
                        <X size={20} />
                     </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-8 space-y-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[#72777f]">Nombre Completo</label>
                        <input 
                           type="text" 
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                           className="w-full p-3 border-2 border-[#1c1c19] font-bold uppercase text-sm outline-none focus:bg-[#f6f3ee]"
                           placeholder="Ej: JUAN PÉREZ"
                        />
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-[#72777f]">Rol / Cargo</label>
                           <div className="flex gap-2">
                              <input 
                                 type="text" 
                                 value={formData.role}
                                 onChange={(e) => setFormData({...formData, role: e.target.value})}
                                 className="flex-1 w-full p-3 border-2 border-[#1c1c19] font-mono text-xs uppercase outline-none focus:bg-[#f6f3ee]"
                                 placeholder="Ej: Ingeniero Civil"
                              />
                              <button type="button" onClick={() => setIsRolesModalOpen(true)} className="px-3 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] hover:bg-white transition-all flex items-center justify-center shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" title="Seleccionar del Catálogo de Roles">
                                 <Briefcase size={16} />
                              </button>
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-black uppercase text-[#72777f]">Disciplina</label>
                           <div className="flex gap-2">
                              <input 
                                 type="text" 
                                 value={formData.discipline}
                                 onChange={(e) => setFormData({...formData, discipline: e.target.value})}
                                 className="flex-1 w-full p-3 border-2 border-[#1c1c19] font-mono text-xs uppercase outline-none focus:bg-[#f6f3ee]"
                                 placeholder="Ej: Estructuras"
                              />
                              <button type="button" onClick={() => setIsSpecialtiesModalOpen(true)} className="px-3 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] hover:bg-white transition-all flex items-center justify-center shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]" title="Seleccionar del Catálogo de Especialidades">
                                 <Users size={16} />
                              </button>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[#72777f]">Empresa</label>
                        <input 
                           type="text" 
                           value={formData.enterprise}
                           onChange={(e) => setFormData({...formData, enterprise: e.target.value})}
                           className="w-full p-3 border-2 border-[#1c1c19] font-mono text-xs uppercase outline-none focus:bg-[#f6f3ee]"
                           placeholder="Ej: ARQ TVS"
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[#72777f]">Teléfono</label>
                        <input 
                           type="text" 
                           value={formData.phone}
                           onChange={(e) => setFormData({...formData, phone: e.target.value})}
                           className="w-full p-3 border-2 border-[#1c1c19] font-mono text-xs uppercase outline-none focus:bg-[#f6f3ee]"
                           placeholder="Ej: +57 300 000 0000"
                        />
                     </div>

                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-[#72777f]">Correo Electrónico</label>
                        <input 
                           type="email" 
                           value={formData.email}
                           onChange={(e) => setFormData({...formData, email: e.target.value})}
                           className="w-full p-3 border-2 border-[#1c1c19] font-mono text-xs outline-none focus:bg-[#f6f3ee]"
                           placeholder="ejemplo@empresa.com"
                        />
                     </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="flex-none p-6 border-t-2 border-[#1c1c19] bg-[#fcf9f4] flex justify-end gap-4">
                     <button 
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-3 border-2 border-[#1c1c19] font-black text-[10px] uppercase hover:bg-[#e5e2dd] transition-all"
                     >
                        Cancelar
                     </button>
                     <button 
                        onClick={handleSave}
                        disabled={!formData.name}
                        className="flex items-center gap-2 px-6 py-3 bg-[#0f4369] text-white font-black text-[10px] uppercase hover:bg-[#1c1c19] transition-all shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        <Save size={16} /> Guardar
                     </button>
                  </div>
               </div>
            </div>
         )}

         <RolesModal 
            isOpen={isRolesModalOpen} 
            onClose={() => setIsRolesModalOpen(false)} 
            onSelectRole={(role) => {
               setFormData(prev => ({ ...prev, role: role.name }));
               setIsRolesModalOpen(false);
            }}
         />
         <SpecialtiesModal 
            isOpen={isSpecialtiesModalOpen} 
            onClose={() => setIsSpecialtiesModalOpen(false)} 
            projectId={project.id}
            onSelectSpecialty={(spec) => {
               setFormData(prev => ({ ...prev, discipline: spec.name }));
               setIsSpecialtiesModalOpen(false);
            }}
         />
      </div>
   );
}
