import React, { useState, useEffect } from 'react';
import { X, Search, Plus, Trash2, Database, FileText, Save, Eye, Users, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { NODE_TYPES } from './constants';
import { useResources } from '../../hooks/useResources';
import ContentBlockEditor from '../../components/modules/ContentBlockEditor';

const EsquemaNodeModal = ({ node, activeEsquema, onClose, onSave, isAdmin, onAssociationsChanged }) => {
  console.group(`[NODO INSPECCIONADO] "${node.name}"`);
  console.log('📐 esquema_nodes (tabla: esquema_nodes)          →', { id: node.id, name: node.name, category: node.category, type: node.type, description: node.description });
  console.log('🔗 RECURSO_ID  (tabla: esquema_nodes.recurso_id) →', node.recurso_id || '(no guardado aún — dale Guardar Cambios)');
  console.log('🗂️  Nodo completo                                →', node);
  console.groupEnd();

  const navigate = useNavigate();
  const [name, setName] = useState(node.name || '');
  const [description, setDescription] = useState(node.description || '');
  const [roles, setRoles] = useState(node.roles || '');
  const [externalLinks, setExternalLinks] = useState(node.externalLinks || []);
  const [externalResources, setExternalResources] = useState(node.externalResources || []);
  const [type, setType] = useState(node.type || 'DOC');
  const [category, setCategory] = useState(node.category || '');

  const [newLink, setNewLink] = useState({ title: '', url: '' });
  const [newResource, setNewResource] = useState({ title: '', url: '' });

  // State for local associations lists using real DB records
  const [linkedModules, setLinkedModules] = useState([]);
  const [linkedResources, setLinkedResources] = useState([]);

  const [allModules, setAllModules] = useState([]);
  const [allResources, setAllResources] = useState([]);

  const [searchModule, setSearchModule] = useState('');
  const [isModuleSearchOpen, setIsModuleSearchOpen] = useState(false);

  const [searchResource, setSearchResource] = useState('');
  const [isResourceSearchOpen, setIsResourceSearchOpen] = useState(false);
  const [selectedPreviewId, setSelectedPreviewId] = useState(null);

  useEffect(() => {
    if (linkedResources.length > 0) {
      if (!selectedPreviewId || !linkedResources.includes(selectedPreviewId)) {
        setSelectedPreviewId(linkedResources[0]);
      }
    } else {
      setSelectedPreviewId(null);
    }
  }, [linkedResources, selectedPreviewId]);

  useEffect(() => {
    const fetchUniverse = async () => {
      const { data: mods } = await supabase.from('roadmap_modules').select('id, title');
      if (mods) setAllModules(mods);

      const { data: res } = await supabase.from('resources').select('id, title, category');
      if (res) setAllResources(res);
    };
    fetchUniverse();
  }, []);

  useEffect(() => {
    const loadAssociations = async () => {
      if (!activeEsquema) return;

      const { data: mLinks } = await supabase
        .from('esquema_nodes_modules')
        .select('module_id')
        .eq('esquema_id', activeEsquema.id)
        .eq('node_id', node.id);

      const { data: rLinks } = await supabase
        .from('esquema_nodes_resources')
        .select('resource_id')
        .eq('esquema_id', activeEsquema.id)
        .eq('node_id', node.id);

      let mIds = mLinks ? mLinks.map(l => l.module_id) : [];
      let rIds = rLinks ? rLinks.map(l => l.resource_id) : [];

      if (node.recurso_id && !rIds.includes(node.recurso_id)) {
        rIds.push(node.recurso_id);
      }

      setLinkedModules(mIds);
      setLinkedResources(rIds);
    };
    loadAssociations();
  }, [activeEsquema, node.id, node.recurso_id]);

  const handleLinkModule = async (moduleId) => {
    const { error } = await supabase.from('esquema_nodes_modules').insert([{
      esquema_id: activeEsquema.id,
      node_id: node.id,
      module_id: moduleId
    }]);
    if (!error) {
      setLinkedModules(prev => [...prev, moduleId]);
      if (onAssociationsChanged) onAssociationsChanged();
    }
    setIsModuleSearchOpen(false);
    setSearchModule('');
  };

  const handleUnlinkModule = async (moduleId) => {
    if (!window.confirm("¿Seguro que deseas desconectar este módulo de este nodo?")) return;
    const { error } = await supabase.from('esquema_nodes_modules')
      .delete()
      .eq('esquema_id', activeEsquema.id)
      .eq('node_id', node.id)
      .eq('module_id', moduleId);
    if (!error) {
      setLinkedModules(prev => prev.filter(id => id !== moduleId));
      if (onAssociationsChanged) onAssociationsChanged();
    }
  };

  const handleLinkResource = async (resourceId) => {
    const { error } = await supabase.from('esquema_nodes_resources').insert([{
      esquema_id: activeEsquema.id,
      node_id: node.id,
      resource_id: resourceId
    }]);
    if (!error) {
      await supabase.from('esquema_nodes').update({ recurso_id: resourceId }).eq('id', node.id);
      setLinkedResources(prev => [...prev, resourceId]);
      if (onAssociationsChanged) onAssociationsChanged();
    }
    setIsResourceSearchOpen(false);
    setSearchResource('');
  };

  const handleUnlinkResource = async (resourceId) => {
    if (!window.confirm("¿Seguro que deseas desconectar este recurso de este nodo?")) return;
    const { error } = await supabase.from('esquema_nodes_resources')
      .delete()
      .eq('esquema_id', activeEsquema.id)
      .eq('node_id', node.id)
      .eq('resource_id', resourceId);
    if (!error) {
      if (node.recurso_id === resourceId) {
        await supabase.from('esquema_nodes').update({ recurso_id: null }).eq('id', node.id);
      }
      setLinkedResources(prev => prev.filter(id => id !== resourceId));
      if (onAssociationsChanged) onAssociationsChanged();
    }
  };

  const handleSave = () => {
    const firstResource = displayLinkedResources[0] || null;

    console.group(`[GUARDAR NODO] "${name}"`);
    console.log(`📦 esquema_nodes (tabla: esquema_nodes)  →`, { name, description, roles, type, category });
    console.log(`🔗 RECURSO_ID (tabla: esquema_nodes.recurso_id)  →`, firstResource ? firstResource.id : null);
    console.log(`🧩 MÓDULOS (tabla: esquema_nodes_modules)  →`, linkedModules);
    console.groupEnd();

    onSave({
      ...node,
      name,
      description,
      roles,
      externalLinks,
      externalResources,
      type,
      category,
      recurso_id: firstResource ? firstResource.id : null,
      RECURSO: firstResource  // { id, title, category, url, ... }
    });
  };

  const addExternalLink = () => {
    if (!newLink.url) return;
    setExternalLinks([...externalLinks, { ...newLink }]);
    setNewLink({ title: '', url: '' });
  };

  const removeExternalLink = (index) => {
    setExternalLinks(externalLinks.filter((_, i) => i !== index));
  };

  const addExternalResource = () => {
    if (!newResource.url) return;
    setExternalResources([...externalResources, { ...newResource }]);
    setNewResource({ title: '', url: '' });
  };

  const removeExternalResource = (index) => {
    setExternalResources(externalResources.filter((_, i) => i !== index));
  };

  const displayLinkedModules = allModules.filter(m => linkedModules.includes(m.id));
  const displayLinkedResources = allResources.filter(r => linkedResources.includes(r.id));
  const filteredSearchModules = allModules.filter(m => !linkedModules.includes(m.id) && m.title?.toLowerCase().includes(searchModule.toLowerCase()));
  const filteredSearchResources = allResources.filter(r => !linkedResources.includes(r.id) && r.title?.toLowerCase().includes(searchResource.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#fcf9f4] w-full max-w-5xl h-[85vh] flex flex-col border-2 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(28,28,25,1)] font-sans">

        {/* Header Blueprint - Standardized */}
        <div className="bg-[#1c1c19] text-white p-4 flex justify-between items-center border-b-2 border-[#1c1c19]">
          <div className="flex items-center gap-4">
            <Database className="text-[#e5e2dd]" size={20} strokeWidth={3} />
            <div>
              <h2 className="text-lg font-black uppercase tracking-tighter">INSPECCIÓN_NODO_ISO: {node.id}</h2>
              <p className="font-mono text-[9px] text-white/50 tracking-[3px] uppercase opacity-70">REF_UUID: {node.id.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-red-600 transition-all border-2 border-transparent hover:border-white">
            <X size={20} strokeWidth={3} />
          </button>
        </div>

        {/* Split Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">

          {/* Left Column: Data Editor */}
          <div className="flex-1 p-6 flex flex-col gap-6 overflow-auto border-r-[3px] border-[#1c1c19] bg-white">
            <div>
              <label className="block font-mono text-[9px] font-black tracking-widest text-[#0f4369] mb-2 border-b-2 border-[#1c1c19]/10 pb-1 uppercase">TÍTULO DEL COMPONENTE</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full text-base font-bold border-2 border-[#1c1c19] bg-[#fcf9f4] p-3 focus:outline-none focus:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all uppercase"
              />
            </div>

            <div>
              <label className="block font-mono text-[9px] font-black tracking-widest text-[#0f4369] mb-2 border-b-2 border-[#1c1c19]/10 pb-1 uppercase">CATEGORÍA TÉCNICA</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: '', label: 'SIN CATEGORÍA' },
                  { value: 'Protocolo', label: 'PROTOCOLO' },
                  { value: 'Manual', label: 'MANUAL' },
                  { value: 'Plantilla', label: 'PLANTILLA' },
                  { value: 'Requisito', label: 'REQUISITO' }
                ].map(cType => (
                  <button
                    key={cType.value}
                    onClick={() => setCategory(cType.value)}
                    className={`px-4 py-2 text-[10px] font-black tracking-widest uppercase border-2 transition-all flex items-center gap-2 ${category === cType.value
                      ? 'bg-[#1c1c19] text-white border-[#1c1c19] shadow-[4px_4px_0_0_rgba(15,67,105,1)]'
                      : 'bg-white text-[#1c1c19] border-[#1c1c19]/20 hover:border-[#1c1c19]'
                      }`}
                  >
                    {cType.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-[9px] font-black tracking-widest text-[#0f4369] mb-2 border-b-2 border-[#1c1c19]/10 pb-1 uppercase">TIPO DE COMPONENTE</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(NODE_TYPES).map(tType => (
                  <button
                    key={tType}
                    onClick={() => setType(tType)}
                    className={`px-4 py-2 text-[10px] font-black tracking-widest uppercase border-2 transition-all flex items-center gap-2 ${type === tType
                      ? 'bg-[#1c1c19] text-white border-[#1c1c19] shadow-[4px_4px_0_0_rgba(15,67,105,1)]'
                      : 'bg-white text-[#1c1c19] border-[#1c1c19]/20 hover:border-[#1c1c19]'
                      }`}
                  >
                    {tType === '.RVT' && <span className="w-3 h-3 bg-blue-600 rounded-[1px] flex items-center justify-center text-[5px] font-black text-white">RVT</span>}
                    {tType === '.RTE' && <span className="w-3 h-3 bg-teal-600 rounded-[1px] flex items-center justify-center text-[5px] font-black text-white">RTE</span>}
                    {tType === '.RFA' && <span className="w-3 h-3 bg-purple-600 rounded-[1px] flex items-center justify-center text-[5px] font-black text-white">RFA</span>}
                    {tType === '.DWG' && <span className="w-3 h-3 bg-orange-500 rounded-[1px] flex items-center justify-center text-[5px] font-black text-white">DWG</span>}
                    {tType === '.PDF' && <span className="w-3 h-3 bg-red-500 rounded-[1px] flex items-center justify-center text-[5px] font-black text-white">PDF</span>}
                    {tType === '.DOC' && <span className="w-3 h-3 bg-blue-300 rounded-[1px] flex items-center justify-center text-[5px] font-black text-white">DOC</span>}
                    {tType === '.MD' && <span className="w-3 h-3 bg-yellow-800 rounded-[1px] flex items-center justify-center text-[5px] font-black text-white">MD</span>}
                    {tType}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <label className="block font-mono text-[10px] font-black tracking-widest text-[#0f4369] mb-2 border-b-2 border-[#1c1c19] pb-1 uppercase">DEFINICIÓN NORMATIVA (MARKDOWN ENABLED)</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="flex-1 w-full min-h-[150px] resize-none font-mono text-sm leading-relaxed border-2 border-[#1c1c19] bg-[#f6f3ee] p-4 focus:outline-none focus:ring-4 focus:ring-[#0f4369]/20 shadow-[inner_4px_4px_0_0_rgba(28,28,25,0.05)] transition-all"
                placeholder="Escribe la definición aquí..."
              />
            </div>

            {/* Roles Section */}
            <div>
              <label className="block font-mono text-[9px] font-black tracking-widest text-[#0f4369] mb-2 border-b-2 border-[#1c1c19]/10 pb-1 uppercase">ROLES ASOCIADOS (EJ: BIM MANAGER, COORDINADOR)</label>
              <div className="flex gap-2">
                <div className="bg-[#1c1c19] p-3 flex items-center justify-center text-white border-2 border-[#1c1c19]">
                  <Users size={18} />
                </div>
                <input
                  value={roles}
                  onChange={e => setRoles(e.target.value)}
                  placeholder="Especifique roles..."
                  className="w-full text-sm font-bold border-2 border-[#1c1c19] bg-[#fcf9f4] p-3 focus:outline-none focus:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all uppercase"
                />
              </div>
            </div>

            {/* External Links Section */}
            <div className="border-2 border-[#1c1c19] p-4 bg-[#fcf9f4]">
              <label className="block font-mono text-[9px] font-black tracking-widest text-[#0f4369] mb-4 border-b-2 border-[#1c1c19]/10 pb-1 uppercase">ENLACES EXTERNOS (LINK)</label>

              <div className="flex flex-col gap-2 mb-4">
                {externalLinks.map((link, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-white border-2 border-[#1c1c19] p-2 shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[10px] font-black uppercase truncate">{link.title || 'Sin Título'}</span>
                      <span className="text-[8px] font-mono opacity-50 truncate">{link.url}</span>
                    </div>
                    <button onClick={() => removeExternalLink(idx)} className="text-red-500 hover:bg-red-50 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {isAdmin && (
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <input
                      placeholder="Título (Opcional)"
                      value={newLink.title}
                      onChange={e => setNewLink({ ...newLink, title: e.target.value })}
                      className="text-[10px] uppercase font-bold p-2 border border-[#1c1c19] focus:outline-none"
                    />
                    <input
                      placeholder="URL (https://...)"
                      value={newLink.url}
                      onChange={e => setNewLink({ ...newLink, url: e.target.value })}
                      className="text-[10px] font-mono p-2 border border-[#1c1c19] focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={addExternalLink}
                    className="bg-[#0f4369] text-white px-4 flex items-center justify-center hover:bg-[#1c1c19] transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* External Resources Section */}
            <div className="border-2 border-dashed border-[#1c1c19]/30 p-4 bg-white">
              <label className="block font-mono text-[9px] font-black tracking-widest text-[#e62020] mb-4 border-b-2 border-[#1c1c19]/10 pb-1 uppercase">RECURSOS ADICIONALES (EXTERNOS)</label>

              <div className="flex flex-col gap-2 mb-4">
                {externalResources.map((res, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-[#f6f3ee] border border-[#1c1c19] p-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={12} className="text-[#0f4369]" />
                      <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] font-bold uppercase truncate">{res.title || 'Recurso'}</span>
                        <span className="text-[8px] font-mono opacity-50 truncate">{res.url}</span>
                      </div>
                    </div>
                    <button onClick={() => removeExternalResource(idx)} className="text-red-500 hover:bg-red-50 p-1">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {isAdmin && (
                <div className="flex gap-2">
                  <div className="flex-1 flex flex-col gap-1">
                    <input
                      placeholder="Nombre del Recurso"
                      value={newResource.title}
                      onChange={e => setNewResource({ ...newResource, title: e.target.value })}
                      className="text-[10px] uppercase font-bold p-2 border border-[#1c1c19] bg-[#fcf9f4] focus:outline-none"
                    />
                    <input
                      placeholder="URL del Recurso"
                      value={newResource.url}
                      onChange={e => setNewResource({ ...newResource, url: e.target.value })}
                      className="text-[10px] font-mono p-2 border border-[#1c1c19] bg-[#fcf9f4] focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={addExternalResource}
                    className="bg-[#e62020] text-white px-4 flex items-center justify-center hover:bg-red-800 transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)]"
                  >
                    <Plus size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Simulated Relational Tools */}
          <div className="w-full md:w-[400px] p-6 flex flex-col gap-8 overflow-auto bg-[#f6f3ee]">

            {/* Modules */}
            <section>
              <div className="flex justify-between items-end mb-4 border-b-2 border-[#1c1c19] pb-1 relative">
                <label className="block font-mono text-[10px] font-black tracking-widest text-[#1c1c19] uppercase">MÓDULOS ASOCIADOS</label>
                {isAdmin && (
                  <button
                    onClick={() => setIsModuleSearchOpen(!isModuleSearchOpen)}
                    className="text-[10px] font-bold text-[#0f4369] hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} strokeWidth={3} /> VINCULAR
                  </button>
                )}
              </div>

              {isModuleSearchOpen && isAdmin && (
                <div className="mb-4 bg-white border-2 border-[#0f4369] p-2 relative z-10 shadow-lg">
                  <div className="flex items-center border-b-2 border-[#1c1c19] pb-1 mb-2">
                    <Search size={14} className="text-[#0f4369] mr-2" />
                    <input
                      autoFocus
                      value={searchModule}
                      onChange={e => setSearchModule(e.target.value)}
                      placeholder="Buscar módulo..."
                      className="w-full text-xs font-bold bg-transparent outline-none uppercase"
                    />
                    <button onClick={() => setIsModuleSearchOpen(false)} className="text-[#e62020]"><X size={14} /></button>
                  </div>
                  <div className="max-h-[120px] overflow-auto flex flex-col gap-1">
                    {filteredSearchModules.map(m => (
                      <div
                        key={m.id}
                        onClick={() => handleLinkModule(m.id)}
                        className="text-xs font-bold cursor-pointer hover:bg-[#0f4369] hover:text-white p-1"
                      >
                        {m.title}
                      </div>
                    ))}
                    {filteredSearchModules.length === 0 && <div className="text-[10px] text-gray-500 p-1">No hay coincidencias.</div>}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {displayLinkedModules.map(m => (
                  <div key={m.id} className="bg-white border-2 border-[#1c1c19] p-2 group shadow-[2px_2px_0_0_rgba(28,28,25,1)] flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 flex items-center justify-center bg-[#1c1c19] text-white shrink-0">
                        <Database size={14} />
                      </div>
                      <p className="text-xs font-bold uppercase leading-tight truncate">{m.title}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => navigate(`/module/${m.id}`)}
                        className="p-1 px-2 border-2 border-[#1c1c19] text-[#1c1c19] bg-[#fcf9f4] hover:bg-[#1c1c19] hover:text-white transition-all text-[9px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                        title="View module"
                      >
                        <Eye size={12} /> VER
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => handleUnlinkModule(m.id)}
                          className="p-1 text-[#e62020] hover:bg-[#e62020]/10 transition-all"
                          title="Eliminar asociación"
                        >
                          <X size={14} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {displayLinkedModules.length === 0 && <p className="text-[10px] font-mono opacity-50 uppercase text-center py-4 bg-white/30 border-2 border-dashed border-[#1c1c19]/10">No hay módulos vinculados.</p>}
              </div>
            </section>

            {/* Resources */}
            <section>
              <div className="flex justify-between items-end mb-4 border-b-2 border-[#1c1c19] pb-1 relative">
                <label className="block font-mono text-[10px] font-black tracking-widest text-[#1c1c19] uppercase">RECURSOS TÉCNICOS VINCULADOS</label>
                {isAdmin && (
                  <button
                    onClick={() => setIsResourceSearchOpen(!isResourceSearchOpen)}
                    className="text-[10px] font-bold text-[#e62020] hover:underline flex items-center gap-1"
                  >
                    <Plus size={12} strokeWidth={3} /> VINCULAR
                  </button>
                )}
              </div>

              {isResourceSearchOpen && isAdmin && (
                <div className="mb-4 bg-white border-2 border-[#e62020] p-2 relative z-10 shadow-lg">
                  <div className="flex items-center border-b-2 border-[#1c1c19] pb-1 mb-2">
                    <Search size={14} className="text-[#e62020] mr-2" />
                    <input
                      autoFocus
                      value={searchResource}
                      onChange={e => setSearchResource(e.target.value)}
                      placeholder="Buscar recurso..."
                      className="w-full text-xs font-bold bg-transparent outline-none uppercase"
                    />
                    <button onClick={() => setIsResourceSearchOpen(false)} className="text-[#e62020]"><X size={14} /></button>
                  </div>
                  <div className="max-h-[120px] overflow-auto flex flex-col gap-1">
                    {filteredSearchResources.map(r => (
                      <div
                        key={r.id}
                        onClick={() => handleLinkResource(r.id)}
                        className="text-[11px] cursor-pointer hover:bg-[#e62020] hover:text-white p-1 flex justify-between"
                      >
                        <span className="font-bold truncate">{r.title}</span>
                        <span className="text-[9px] font-black opacity-70 ml-2 shrink-0">{r.category}</span>
                      </div>
                    ))}
                    {filteredSearchResources.length === 0 && <div className="text-[10px] text-gray-500 p-1">No hay coincidencias.</div>}
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {displayLinkedResources.map(r => (
                  <div key={r.id} className="bg-white border-2 border-[#1c1c19] p-2 flex items-center justify-between group transition-all shadow-[2px_2px_0_0_rgba(28,28,25,0.1)] hover:shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:-translate-y-0.5">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {['protocolo', 'manual', 'plantilla'].includes(r.category?.toLowerCase()) ? (
                        <BookOpen size={14} className="text-[#0f4369] shrink-0" />
                      ) : (
                        <FileText size={14} className="text-[#0f4369] shrink-0" />
                      )}
                      <p className="text-[11px] font-bold truncate pr-1">{r.title}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => navigate(
                          ['protocolo', 'manual', 'plantilla'].includes(r.category?.toLowerCase()) ? `/resourceView/${r.id}` : `/resource/${r.id}`
                        )}
                        className="p-1 px-2 border border-[#1c1c19] text-[#1c1c19] bg-[#fcf9f4] hover:bg-[#1c1c19] hover:text-white transition-all text-[8px] font-bold uppercase tracking-widest flex items-center gap-1.5"
                        title="Ver Documento"
                      >
                        <Eye size={10} /> VER
                      </button>
                      <span className="text-[7px] font-black bg-[#1c1c19] text-white px-1 py-0.5">
                        {['protocolo', 'manual', 'plantilla'].includes(r.category?.toLowerCase()) 
                          ? (r.category?.toUpperCase() || 'DOC') 
                          : (r.category?.substring(0, 3).toUpperCase() || 'DOC')}
                      </span>
                      {isAdmin && (
                        <button
                          onClick={() => handleUnlinkResource(r.id)}
                          className="p-0.5 text-[#e62020] hover:bg-[#e62020]/10 transition-all opacity-0 group-hover:opacity-100"
                          title="Eliminar asociación"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {displayLinkedResources.length === 0 && (
                  <p className="text-[10px] font-mono opacity-50 uppercase text-center py-4 bg-white/30 border-2 border-dashed border-[#1c1c19]/10">No hay recursos vinculados.</p>
                )}
              </div>
            </section>

            {/* Preview Section */}
            {displayLinkedResources.length > 0 && (
              <section className="mt-2 border-2 border-[#1c1c19] bg-white p-4 shadow-[4px_4px_0_0_rgba(28,28,25,1)] flex flex-col min-h-[300px] max-h-[450px]">
                <div className="flex justify-between items-center mb-3 border-b-2 border-[#1c1c19] pb-1 shrink-0">
                  <label className="block font-mono text-[10px] font-black tracking-widest text-[#1c1c19] uppercase">PREVISUALIZACIÓN DE RECURSO</label>
                </div>
                {/* Tabs if multiple */}
                {displayLinkedResources.length > 1 && (
                  <div className="flex gap-1 overflow-x-auto pb-2 border-b border-[#1c1c19]/10 mb-2 scrollbar-thin shrink-0">
                    {displayLinkedResources.map(r => (
                      <button
                        key={r.id}
                        onClick={() => setSelectedPreviewId(r.id)}
                        className={`px-2 py-1 text-[9px] font-bold uppercase border-2 truncate max-w-[120px] transition-all shrink-0 ${
                          selectedPreviewId === r.id
                            ? 'bg-[#1c1c19] text-white border-[#1c1c19]'
                            : 'bg-[#fcf9f4] text-[#1c1c19] border-[#1c1c19]/20 hover:border-[#1c1c19]'
                        }`}
                      >
                        {r.title}
                      </button>
                    ))}
                  </div>
                )}
                {/* Preview Content */}
                <ResourcePreviewPanel resourceId={selectedPreviewId || displayLinkedResources[0]?.id} />
              </section>
            )}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="bg-[#1c1c19] p-4 flex justify-end gap-4 border-t-4 border-[#1c1c19] shrink-0">
          <div className="flex gap-4">
            <button onClick={onClose} className="px-6 py-2 text-white font-bold tracking-widest text-sm hover:underline font-mono">
              CANCELAR
            </button>
            {isAdmin ? (
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-2 bg-[#e5e2dd] text-[#1c1c19] font-black tracking-widest text-sm uppercase shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] hover:bg-white transition-colors"
              >
                <Save size={16} strokeWidth={3} />
                GUARDAR CAMBIOS
              </button>
            ) : (
              <button className="px-8 py-2 bg-[#1c1c19] border-2 border-[#f6f3ee]/20 text-[#f6f3ee]/50 font-black tracking-widest text-sm uppercase cursor-not-allowed">
                SOLO LECTURA
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for displaying a compact preview of a linked resource
function ResourcePreviewPanel({ resourceId }) {
  const { fetchResourceBlocks, fetchResourceById } = useResources();
  const [blocks, setBlocks] = useState([]);
  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      if (!resourceId) return;
      setLoading(true);
      try {
        const resData = await fetchResourceById(resourceId);
        if (!isMounted) return;
        setResource(resData);

        const blockData = await fetchResourceBlocks(resourceId);
        if (!isMounted) return;

        if (blockData && blockData.length > 0) {
          setBlocks(blockData);
        } else if (resData?.manual) {
          setBlocks([{ type: 'text', content: resData.manual, id: 'migrated-manual' }]);
        } else {
          setBlocks([]);
        }
      } catch (err) {
        console.error("Error loading preview:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [resourceId, fetchResourceBlocks, fetchResourceById]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-12 text-[10px] font-black uppercase tracking-widest text-[#72777f]">
        <Loader2 size={16} className="animate-spin text-[#0f4369] mb-2" />
        CARGANDO PREVISUALIZACIÓN...
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex-1 flex items-center justify-center text-[10px] italic text-[#72777f] uppercase py-12">
        Error al cargar el recurso.
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Mini-header */}
      <div className="flex justify-between items-center mb-2 pb-1 border-b border-[#1c1c19]/10 shrink-0">
        <span className="text-[9px] font-black px-1.5 py-0.5 bg-[#0f4369] text-white uppercase tracking-wider">
          {resource.category || 'DOC'}
        </span>
        <span className="text-[8px] font-mono text-[#72777f]">
          ID: {resource.id.substring(0, 8)}
        </span>
      </div>

      {/* Description / Content scrollable area */}
      <div className="flex-1 overflow-auto bg-[#fcf9f4] border border-[#1c1c19]/20 p-3 text-[11px] leading-relaxed custom-scrollbar max-h-[300px]">
        {resource.description && (
          <div className="border-l-2 border-[#0f4369] pl-2 mb-3 text-[#1c1c19]/70 italic">
            {resource.description}
          </div>
        )}
        
        {blocks.length === 0 ? (
          <div className="text-center py-4 text-[9px] text-[#72777f] uppercase font-mono italic">
            Sin contenido documentado.
          </div>
        ) : (
          <div className="prose prose-sm max-w-none">
            <ContentBlockEditor
              blocks={blocks}
              onChange={() => {}}
              onUploadImage={() => {}}
              isEditing={false}
              fontSize={11}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default EsquemaNodeModal;
