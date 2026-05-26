import React, { useState, useEffect } from 'react';
import {
  FileText, FilePlus, Layers, Eye, Plus, Edit3, X, Save, RefreshCw, Trash2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { projectService } from '../../services/projectService';
import { supabase } from '../../services/supabaseClient';
import { buildTreeFromFlatNodes } from '../../utils/schemaUtils';

export default function RequirementsModule({ project }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState('Todos');
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState([]);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'view'
  const [selectedReq, setSelectedReq] = useState(null);

  const [formData, setFormData] = useState({
    id: null,
    req_code: '',
    name: '',
    format_type: '.DOC',
    roles: '',
    description: '',
    category: 'Iniciales'
  });

  const categories = ['Todos', 'Iniciales', 'Operativos', 'Gestión', 'Entregables Finales', 'Plantillas'];

  useEffect(() => {
    fetchRequirements();
  }, [project?.id]);

  const fetchRequirements = async () => {
    try {
      setLoading(true);
      const data = await projectService.getInformationRequirements(project?.id);
      setRequirements(data || []);
      
      const staff = await projectService.getStaff();
      setStaffList(staff || []);
    } catch (err) {
      console.error("Error fetching requirements or staff:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredData = activeTab === 'Todos' 
    ? requirements.filter(req => req.category !== 'Plantillas')
    : requirements.filter(req => req.category === activeTab);

  const totalInstancias = requirements.filter(r => r.category !== 'Plantillas').length;

  const getRoleColor = (role) => {
    if (!role) return 'bg-gray-50 text-gray-700 border-gray-200';
    if (role.includes('Appointing Party')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (role.includes('Lead Appointed Party')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (role.includes('Task Teams')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  const getTypeIcon = (type) => {
    if (type === '.DOC') return <FileText size={14} />;
    if (type === '.FORM') return <Edit3 size={14} />;
    return <FileText size={14} />;
  };

  const openCreateModal = (template = null) => {
    setModalMode('create');
    if (template) {
      setFormData({
        id: null,
        req_code: template.req_code,
        name: `Copia de ${template.name}`,
        format_type: template.format_type || '.DOC',
        roles: template.roles || '',
        description: template.description || '',
        category: template.category === 'Plantillas' ? 'Iniciales' : (template.category || 'Iniciales')
      });
    } else {
      setFormData({
        id: null,
        req_code: '',
        name: '',
        format_type: '.DOC',
        roles: '',
        description: '',
        category: 'Iniciales'
      });
    }
    setIsModalOpen(true);
  };

  const openEditModal = (req) => {
    setModalMode('edit');
    setSelectedReq(req);
    setFormData({
      id: req.id,
      req_code: req.req_code || '',
      name: req.name || '',
      format_type: req.format_type || '.DOC',
      roles: req.roles || '',
      description: req.description || '',
      category: req.category || 'Iniciales'
    });
    setIsModalOpen(true);
  };

  const openViewModal = (req) => {
    setModalMode('view');
    setSelectedReq(req);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (modalMode === 'edit') {
        const { id, ...updates } = formData;
        await projectService.updateInformationRequirement(id, updates);
      } else {
        await projectService.createInformationRequirement({
          ...formData,
          project_id: project?.id || null
        });
      }
      setIsModalOpen(false);
      fetchRequirements();
    } catch (err) {
      console.error("Error saving requirement:", err);
      alert("Error al guardar el requisito.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este requisito de información?")) {
      try {
        await projectService.deleteInformationRequirement(id);
        fetchRequirements();
      } catch (err) {
        console.error("Error deleting requirement:", err);
        alert("Error al eliminar el requisito.");
      }
    }
  };

  const handleSyncBep = async () => {
    if (!project?.id) return;
    setIsSyncing(true);
    try {
      console.log(`[Sync] Iniciando sincronización de Requisitos del BEP...`);
      // 1. Fetch BEP schema for this project
      const { data: schemas, error: schemaError } = await supabase
        .from('esquemas')
        .select('id')
        .eq('project', project.id)
        .limit(1);

      if (schemaError || !schemas || schemas.length === 0) {
        alert("No se encontró un esquema BEP asociado a este proyecto.");
        setIsSyncing(false);
        return;
      }

      // Fetch all nodes for this schema
      const { data: nodes, error: nodesErr } = await supabase
        .from('esquema_nodes')
        .select('*')
        .eq('esquema_id', schemas[0].id);

      if (nodesErr || !nodes || nodes.length === 0) {
        alert("No se encontraron nodos en esquema_nodes para este esquema.");
        setIsSyncing(false);
        return;
      }

      const mapData = buildTreeFromFlatNodes(nodes);
      if (!mapData || !mapData.children || mapData.children.length === 0) {
        alert("El esquema BEP está vacío o no tiene la estructura esperada.");
        setIsSyncing(false);
        return;
      }

      const newRequirements = [];

      // 2. Traverse mapData recursively to gather all nodes with category === 'Requisito'
      const processNodeAsync = async (node) => {
        if (node.category === 'Requisito') {
          console.log(`[Sync] Procesando requisito (como plantilla) encontrado en el esquema: "${node.name}" (${node.category})`);
          
          // Check if requirement with this name already exists in the current list
          const exists = requirements.some(r => r.name.toLowerCase() === node.name.toLowerCase());
          
          if (!exists) {
            console.log(`[Sync]   -> No existe. Agregando a la lista de creación...`);
            newRequirements.push({
              req_code: 'TPL',
              name: node.name,
              format_type: '.DOC',
              roles: node.roles || '',
              description: node.description || `Plantilla base sincronizada desde el Esquema BEP.`,
              category: 'Plantillas',
              project_id: project.id
            });
          } else {
             console.log(`[Sync]   -> Ya existe. Ignorando para evitar duplicados.`);
          }
        }

        if (node.children && node.children.length > 0) {
           for (const child of node.children) {
              await processNodeAsync(child);
           }
        }
      };

      await processNodeAsync(mapData);

      if (newRequirements.length > 0) {
        console.log(`[Sync] Insertando ${newRequirements.length} requisitos nuevos en la base de datos...`);
        const { error: insErr } = await supabase.from('information_requirements').insert(newRequirements);
        if (insErr) {
          console.error(`[Sync Error] Error al crear requisitos:`, insErr);
          alert("Ocurrió un error al crear los requisitos en la base de datos.");
        } else {
          console.log(`[Sync] ¡Sincronización de requisitos finalizada con éxito!`);
          alert(`¡${newRequirements.length} Requisitos de Información sincronizados con éxito!`);
          fetchRequirements();
        }
      } else {
        console.log(`[Sync] No se encontraron nuevos requisitos para sincronizar.`);
        alert("No hay nuevos requisitos para sincronizar. Todos los etiquetados ya existen.");
      }

    } catch (err) {
      console.error("Error syncing requirements:", err);
      alert("Ocurrió un error al sincronizar los requisitos del BEP.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDeleteAllTemplates = async () => {
    if (!window.confirm("¿Estás seguro de ELIMINAR TODAS LAS PLANTILLAS? (No afectará las instancias creadas).")) {
      return;
    }
    
    try {
      setLoading(true);
      const { error } = await supabase
        .from('information_requirements')
        .delete()
        .eq('project_id', project.id)
        .eq('category', 'Plantillas');
        
      if (error) throw error;
      
      alert("Se eliminaron todas las plantillas. Puedes volver a sincronizar para restaurarlas.");
      fetchRequirements();
    } catch (err) {
      console.error("Error al eliminar plantillas:", err);
      alert("Error al intentar eliminar las plantillas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col overflow-hidden relative">
      
      {/* Header Section */}
      <div className="flex-none flex justify-between items-end mb-4 border-b-2 border-[#1c1c19] pb-4">
        <div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-3">
            <Layers size={24} className="text-[#0f4369]" /> Requisitos de Información
          </h2>
          <p className="text-[10px] font-mono uppercase text-[#72777f] mt-1 tracking-widest">
            Gestión documental y protocolos normativos ISO 19650
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleDeleteAllTemplates}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-red-500 text-red-500 font-black text-[10px] uppercase shadow-[4px_4px_0_0_rgba(239,68,68,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0 transition-all"
            title="Eliminar todas las plantillas"
          >
            <Trash2 size={14} /> PURGAR PLANTILLAS
          </button>
          <button 
            onClick={handleSyncBep}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#1c1c19] text-[#1c1c19] font-black text-[10px] uppercase shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0 transition-all disabled:opacity-50"
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} /> {isSyncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR PLANTILLAS'}
          </button>
          <button 
            onClick={() => openCreateModal()}
            className="flex items-center gap-2 px-4 py-2 bg-[#0f4369] text-white font-black text-[10px] uppercase shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] hover:translate-x-0 hover:translate-y-0 transition-all"
          >
            <Plus size={14} /> Crear Nuevo
          </button>
        </div>
      </div>



      {/* Tabs */}
      <div className="flex-none flex gap-2 mb-6">
        {categories.map(cat => {
          const count = cat === 'Todos' ? totalInstancias : requirements.filter(r => r.category === cat).length;
          return (
            <button 
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={`flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest border-2 transition-all ${activeTab === cat ? 'bg-[#1c1c19] text-white border-[#1c1c19]' : 'bg-transparent text-[#72777f] border-transparent hover:border-[#1c1c19]/30 hover:text-[#1c1c19]'}`}
            >
              {cat} <span className="text-[11px] font-bold italic opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Grid of Requirements */}
      <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-8">
        {loading ? (
          <div className="text-center p-12 text-[#72777f] font-mono text-xs uppercase animate-pulse">Cargando requisitos...</div>
        ) : filteredData.length === 0 ? (
          <div className="text-center p-12 text-[#72777f] font-mono text-xs uppercase border-2 border-dashed border-[#1c1c19]/20">No hay requisitos registrados en esta categoría.</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredData.map(req => (
              <div key={req.id} className="group relative bg-white border-2 border-[#1c1c19] p-4 hover:-translate-y-1 transition-all shadow-[6px_6px_0_0_rgba(28,28,25,0.05)] flex flex-col justify-between min-h-[160px]">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 flex items-center justify-center border-2 border-[#1c1c19] bg-[#fcf9f4]">
                      <span className="font-black italic text-lg tracking-tighter text-[#0f4369]">{req.req_code}</span>
                    </div>
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-tight text-[#1c1c19] leading-tight max-w-[250px]">
                        {req.name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[9px] font-mono font-black uppercase px-2 py-1 border-2 border-[#1c1c19] bg-[#f6f3ee] flex items-center gap-1">
                      {getTypeIcon(req.format_type)} {req.format_type}
                    </span>
                    <span className="text-[8px] font-black uppercase tracking-widest text-[#72777f]">
                      {req.category}
                    </span>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 mb-3">
                  <p className="text-xs text-[#493f36] line-clamp-2 leading-relaxed">
                    {req.description}
                  </p>
                </div>

                {/* Footer */}
                <div className="flex justify-between items-end border-t border-[#1c1c19]/10 pt-3 mt-auto">
                  <div>
                    <span className="text-[8px] font-black uppercase text-[#72777f] block mb-1">Responsable:</span>
                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 border rounded-sm inline-block ${getRoleColor(req.roles)}`}>
                      {req.roles}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => openViewModal(req)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f6f3ee] border border-[#1c1c19]/20 hover:border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"
                      title="Ver Detalles"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      onClick={() => openEditModal(req)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f6f3ee] border border-[#1c1c19]/20 hover:border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"
                      title="Editar requisito"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      onClick={() => openCreateModal(req)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f6f3ee] border border-[#1c1c19]/20 hover:border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"
                      title="Crear instancia basada en esto"
                    >
                      <FilePlus size={14} />
                    </button>
                    <button 
                      onClick={() => handleDelete(req.id)}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-[#f6f3ee] border border-red-500/20 text-red-500 hover:border-red-500 hover:bg-red-500 hover:text-white transition-all ml-1"
                      title="Eliminar requisito"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .md-editor table { border-collapse: collapse; width: 100%; margin-bottom: 1.5rem; background: white; }
        .md-editor th, .md-editor td { border: 2px solid #1c1c19; padding: 10px 14px; text-align: left; font-size: 0.85rem; }
        .md-editor th { background-color: #f6f3ee; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
        .md-editor tr:hover td { background-color: #fcf9f4; }
        .md-editor h1 { font-size: 2.2em; font-weight: 900; margin-top: 2rem; margin-bottom: 1rem; text-transform: uppercase; font-style: italic; letter-spacing: -0.02em; border-bottom: 4px solid #1c1c19; padding-bottom: 0.5rem;}
        .md-editor h2 { font-size: 1.6em; font-weight: 900; margin-top: 1.8rem; margin-bottom: 0.8rem; text-transform: uppercase; color: #0f4369;}
        .md-editor h3 { font-size: 1.3em; font-weight: bold; margin-top: 1.5rem; margin-bottom: 0.5rem; }
        .md-editor ul { list-style-type: square; margin-left: 1.5rem; margin-bottom: 1rem; }
        .md-editor ol { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 1rem; font-weight: bold; }
        .md-editor ol li span { font-weight: normal; }
        .md-editor p { margin-bottom: 1rem; line-height: 1.7; font-size: 0.95rem; }
        .md-editor strong { font-weight: 900; }
        .md-editor blockquote { border-left: 4px solid #0f4369; padding-left: 1rem; font-style: italic; color: #493f36; background: #f6f3ee; padding: 1rem; margin-bottom: 1rem;}
      `}</style>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1c1c19]/60 backdrop-blur-md z-50 flex items-center justify-center p-4 lg:p-8">
          <div className="bg-white border-4 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(28,28,25,1)] w-full max-w-7xl h-[95vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex-none p-6 border-b-4 border-[#1c1c19] flex justify-between items-center bg-[#fcf9f4]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#1c1c19] text-white flex items-center justify-center shadow-[4px_4px_0_0_rgba(15,67,105,1)]">
                  {modalMode === 'view' ? <Eye size={24} /> : (modalMode === 'edit' ? <Edit3 size={24} /> : <FilePlus size={24} />)}
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {modalMode === 'view' ? 'Documento de Requisito' : (modalMode === 'edit' ? 'Editar Documento' : 'Nuevo Documento')}
                  </h3>
                  <p className="text-[10px] font-mono text-[#72777f] uppercase font-bold tracking-widest mt-1">
                    {modalMode === 'view' ? selectedReq?.req_code : 'Editor de Especificación Técnica'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-3 bg-white border-2 border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-colors shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-hidden bg-white flex">
              {modalMode === 'view' && selectedReq ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 lg:p-12">
                  <div className="max-w-4xl mx-auto space-y-8">
                    {/* Header Doc */}
                    <div className="border-4 border-[#1c1c19] p-8 bg-[#fcf9f4] relative">
                      <div className="absolute top-0 right-0 bg-[#1c1c19] text-white px-4 py-2 font-black uppercase text-xs tracking-widest">
                        {selectedReq.category}
                      </div>
                      <div className="flex gap-8 items-end">
                        <div className="text-6xl font-black italic text-[#0f4369]">{selectedReq.req_code}</div>
                        <div className="flex-1">
                          <h1 className="text-3xl font-black uppercase tracking-tight text-[#1c1c19] leading-none mb-2">{selectedReq.name}</h1>
                          <div className="flex gap-4 mt-4">
                            <span className="text-[10px] font-black uppercase px-3 py-1 border-2 border-[#1c1c19] bg-white flex items-center gap-2">
                              {getTypeIcon(selectedReq.format_type)} FORMATO: {selectedReq.format_type}
                            </span>
                            <span className={`text-[10px] font-black uppercase px-3 py-1 border-2 border-[#1c1c19] ${getRoleColor(selectedReq.roles).split(' ')[0]} bg-white`}>
                              RESPONSABLE: {selectedReq.roles || 'NO DEFINIDO'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Markdown Content */}
                    <div className="md-editor">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {selectedReq.description}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                  {/* Edit Form / Left Pane */}
                  <div className="w-full lg:w-1/2 flex flex-col border-b-2 lg:border-b-0 lg:border-r-4 border-[#1c1c19] overflow-y-auto bg-white custom-scrollbar">
                    <div className="p-8 space-y-6">
                      {modalMode === 'create' && (
                        <div className="space-y-2 mb-6">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">Plantilla Base (Opcional)</label>
                          <select 
                            onChange={(e) => {
                              const templateId = e.target.value;
                              if (!templateId) return;
                              const template = requirements.find(r => r.id === templateId);
                              if (template) {
                                setFormData({
                                  ...formData,
                                  req_code: template.req_code,
                                  name: template.name,
                                  format_type: template.format_type || '.DOC',
                                  roles: template.roles || '',
                                  description: template.description || '',
                                });
                              }
                            }}
                            className="w-full p-4 border-2 border-dashed border-[#0f4369] font-black text-sm uppercase outline-none focus:bg-[#fcf9f4] transition-colors appearance-none cursor-pointer bg-white text-[#0f4369]"
                          >
                            <option value="">-- SELECCIONAR PLANTILLA DE ESQUEMA --</option>
                            {requirements.filter(r => r.category === 'Plantillas').map(tpl => (
                              <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                            ))}
                          </select>
                        </div>
                      )}
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">Código de Documento</label>
                          <input 
                            type="text" 
                            value={formData.req_code}
                            onChange={(e) => setFormData({...formData, req_code: e.target.value})}
                            placeholder="EJ: PEB, AIR, EIR"
                            className="w-full p-4 border-2 border-[#1c1c19] font-black text-lg uppercase outline-none focus:bg-[#fcf9f4] transition-colors"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">Formato</label>
                          <select 
                            value={formData.format_type}
                            onChange={(e) => setFormData({...formData, format_type: e.target.value})}
                            className="w-full p-4 border-2 border-[#1c1c19] font-black text-lg uppercase outline-none focus:bg-[#fcf9f4] transition-colors appearance-none cursor-pointer"
                          >
                            <option value=".DOC">.DOC (Documento / PEB)</option>
                            <option value=".FORM">.FORM (Formulario)</option>
                            <option value=".XLS">.XLS (Hoja de cálculo)</option>
                          </select>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">Título del Documento</label>
                        <input 
                          type="text" 
                          value={formData.name}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          placeholder="Ej: Plan de Ejecución BIM"
                          className="w-full p-4 border-2 border-[#1c1c19] font-black text-xl uppercase outline-none focus:bg-[#fcf9f4] transition-colors"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">Roles / Autores</label>
                          <select 
                            value={formData.roles}
                            onChange={(e) => setFormData({...formData, roles: e.target.value})}
                            className="w-full p-4 border-2 border-[#1c1c19] font-bold text-xs uppercase outline-none focus:bg-[#fcf9f4] transition-colors appearance-none cursor-pointer"
                          >
                            <option value="">-- Seleccionar Autor / Rol --</option>
                            {staffList.map(s => (
                              <option key={s.id} value={s.name}>{s.name} {s.role ? `(${s.role})` : ''}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">Categoría Estratégica</label>
                          <select 
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                            className="w-full p-4 border-2 border-[#1c1c19] font-bold text-xs uppercase outline-none focus:bg-[#fcf9f4] transition-colors appearance-none cursor-pointer"
                          >
                            <option value="Iniciales">Iniciales</option>
                            <option value="Operativos">Operativos</option>
                            <option value="Gestión">Gestión</option>
                            <option value="Entregables Finales">Entregables Finales</option>
                            <option value="Plantillas">Plantillas</option>
                          </select>
                        </div>
                      </div>

                      <div className="space-y-2 flex-1 flex flex-col">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">Contenido del Documento (Soporta Markdown)</label>
                          <span className="text-[10px] font-bold bg-[#f6f3ee] px-2 py-1 border border-[#1c1c19]/20">Markdown Enabled</span>
                        </div>
                        <textarea 
                          value={formData.description}
                          onChange={(e) => setFormData({...formData, description: e.target.value})}
                          placeholder="Escribe aquí el contenido del documento usando Markdown (# Título, - Lista, | Tabla |...)"
                          className="w-full flex-1 min-h-[400px] p-6 border-2 border-[#1c1c19] text-sm outline-none focus:bg-[#fcf9f4] font-mono leading-relaxed resize-none custom-scrollbar shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Preview Form / Right Pane */}
                  <div className="hidden lg:flex w-1/2 flex-col bg-[#fcf9f4] overflow-hidden">
                    <div className="flex-none p-4 border-b-2 border-[#1c1c19]/20 bg-[#f6f3ee] flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#1c1c19] flex items-center gap-2">
                        <Eye size={14} /> Vista Previa en Tiempo Real
                      </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                      <div className="md-editor max-w-full">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {formData.description || '*El documento está vacío. Escribe en el editor para ver los cambios aquí.*'}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex-none p-6 border-t-4 border-[#1c1c19] bg-[#fcf9f4] flex justify-end gap-4 relative z-10">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-8 py-4 bg-white border-2 border-[#1c1c19] font-black text-xs uppercase hover:bg-[#e5e2dd] transition-all shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
              >
                Cerrar
              </button>
              {(modalMode === 'create' || modalMode === 'edit') && (
                <button 
                  onClick={handleSave}
                  className="flex items-center gap-3 px-8 py-4 bg-[#0f4369] text-white font-black text-xs uppercase hover:bg-[#1c1c19] transition-all shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1"
                >
                  <Save size={18} /> {modalMode === 'edit' ? 'Guardar Cambios' : 'Crear Documento'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      
    </div>
  );
}
