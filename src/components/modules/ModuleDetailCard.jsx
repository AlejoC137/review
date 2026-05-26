import React, { useState, useEffect, useRef } from 'react';
import ResourceList from './ResourceList';

import { Layers, FileText, Edit2, Save, Link as LinkIcon, Unlink, ExternalLink, ArrowRight, Image as ImageIcon, Bold, Italic, Type, List, Eye, Code, Search, Trash2, Database } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRoadmapProgress } from '../../hooks/useRoadmapProgress';
import { useResources } from '../../hooks/useResources';
import { useNavigate } from 'react-router-dom';
import MarkdownEditor from '../ui/MarkdownEditor';
import ContentBlockEditor from './ContentBlockEditor';
import { BROLL_IMAGES } from '../../services/brollImages';
import { useRoadmap } from '../../context/RoadmapContext';
import { supabase } from '../../services/supabaseClient';


export default function ModuleDetailCard({ moduleData: initialData }) {
  const { user, isAdmin } = useAuth();

  const { updateModule, updateModuleBlocks, uploadModuleImage } = useRoadmap();
  const {
    moduleResources,
    fetchResourcesForModule,
    linkResourceToModule,
    unlinkResourceFromModule,
    createResource,
    loading: resourcesLoading
  } = useResources();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [moduleData, setModuleData] = useState(initialData);
  const [blocks, setBlocks] = useState(initialData.blocks || []);

  // Solo inicializar blocks al montar o cambiar de módulo
  useEffect(() => {
    // IMPORTANTE: Si ya estamos editando, no queremos que un refresco de fondo
    // nos borre lo que estamos haciendo (ej. una subida de imagen en curso)
    if (isEditing) return;

    if (initialData.blocks && initialData.blocks.length > 0) {
      setBlocks(initialData.blocks);
    } else if (initialData.parameters) {
      setBlocks([{ type: 'text', content: initialData.parameters, id: 'initial-migration' }]);
    } else {
      setBlocks([]);
    }
  }, [initialData.id, initialData.blocks, isEditing]);
  const [showResourceAggregator, setShowResourceAggregator] = useState(false);
  const [showExternalLinkForm, setShowExternalLinkForm] = useState(false);
  const [showSchemaExternalLinkForm, setShowSchemaExternalLinkForm] = useState(false);
  const [externalLinkData, setExternalLinkData] = useState({ title: '', url: '' });
  const [isCreatingLink, setIsCreatingLink] = useState(false);
  
  const [aggregatorTab, setAggregatorTab] = useState('resources'); // 'resources' | 'esquemas'
  const [allEsquemaNodes, setAllEsquemaNodes] = useState([]);
  const [searchEsquema, setSearchEsquema] = useState('');
  
  const [associatedEsquemas, setAssociatedEsquemas] = useState([]);

  useEffect(() => {
    if (moduleData?.id) {
      fetchResourcesForModule(moduleData.id);
      
      const fetchAssociatedEsquemas = async () => {
          const { data, error } = await supabase
              .from('esquema_nodes_modules')
              .select('node_id, esquema_id, esquemas ( id, name )')
              .eq('module_id', moduleData.id);
              
          if (data && data.length > 0) {
              const nodeIds = data.map(link => link.node_id);
              const { data: nodesData } = await supabase
                  .from('esquema_nodes')
                  .select('id, name')
                  .in('id', nodeIds);
                  
              const nodeNameMap = {};
              if (nodesData) {
                  nodesData.forEach(n => {
                      nodeNameMap[n.id] = n.name;
                  });
              }

              const formatted = data.map(link => {
                  const esq = link.esquemas;
                  if (!esq) return null;
                  
                  return {
                      esquema_id: esq.id,
                      esquema_name: esq.name,
                      node_id: link.node_id,
                      node_name: nodeNameMap[link.node_id] || `[ELIMINADO] ${link.node_id}`
                  };
              }).filter(Boolean);
              
              setAssociatedEsquemas(formatted);
          } else {
              setAssociatedEsquemas([]);
          }
      };
      
      fetchAssociatedEsquemas();

      // Also fetch all schemas to flatten them for the aggregator
      const fetchAllNodes = async () => {
          const { data } = await supabase
              .from('esquema_nodes')
              .select('id, name, esquema_id, esquemas ( name )');
          if (data) {
              const flattened = data.map(node => ({
                  esquema_id: node.esquema_id,
                  esquema_name: node.esquemas?.name || 'Esquema',
                  node_id: node.id,
                  node_name: node.name
              }));
              setAllEsquemaNodes(flattened);
          }
      };
      fetchAllNodes();
    }
  }, [moduleData?.id, fetchResourcesForModule]);

  const handleLinkEsquemaNode = async (node) => {
    // Prevent duplicated linking
    if (associatedEsquemas.find(a => a.esquema_id === node.esquema_id && a.node_id === node.node_id)) {
        alert("This node is already associated with this module.");
        return;
    }

    const { error } = await supabase.from('esquema_nodes_modules').insert([{
        esquema_id: node.esquema_id,
        node_id: node.node_id,
        module_id: moduleData.id
    }]);

    if (!error) {
        setAssociatedEsquemas(prev => [...prev, node]);
        setSearchEsquema('');
    }
  };

  const handleUnlinkEsquemaNode = async (esquemaId, nodeId) => {
    if (!window.confirm("¿Seguro que deseas desconectar este esquema de este módulo?")) return;
    const { error } = await supabase
        .from('esquema_nodes_modules')
        .delete()
        .eq('esquema_id', esquemaId)
        .eq('node_id', nodeId)
        .eq('module_id', moduleData.id);

    if (!error) {
        setAssociatedEsquemas(prev => prev.filter(a => !(a.esquema_id === esquemaId && a.node_id === nodeId)));
    }
  };

  const handleSave = async () => {
    setIsEditing(false);
    try {
      await updateModule(moduleData.id, {
        title: moduleData.title,
        description: moduleData.description,
        parameters: blocks.filter(b => b.type === 'text').map(b => b.content).join('\n\n'), // Mantener parámetros como resumen
        notes: moduleData.notes,
        sort_order: moduleData.sort_order,
        image_url: moduleData.image_url
      });
      await updateModuleBlocks(moduleData.id, blocks);
    } catch (err) {
      console.error("Error saving module:", err);
      alert("Error al guardar los cambios.");
    }
  };

  const handleLinkResource = async (resource) => {
    // Prevent linking if already linked
    if (moduleResources.find(r => r.id === resource.id)) {
      alert("This resource is already linked to the module.");
      return;
    }

    await linkResourceToModule(moduleData.id, resource.id);
    setShowResourceAggregator(false);
  };

  const handleCreateExternalLink = async () => {
    if (!externalLinkData.title || !externalLinkData.url) {
      alert("Por favor ingresa un título y una URL.");
      return;
    }

    setIsCreatingLink(true);
    try {
      const newResource = await createResource({
        title: externalLinkData.title,
        url: externalLinkData.url,
        category: 'Documentos',
        description: `Link externo agregado a ${moduleData.title}`,
        sort_order: (moduleResources.length > 0) ? Math.max(...moduleResources.map(r => r.sort_order || 0)) + 1 : 0
      });

      if (newResource?.id) {
        await linkResourceToModule(moduleData.id, newResource.id);
        setExternalLinkData({ title: '', url: '' });
        setShowExternalLinkForm(false);
      }
    } catch (err) {
      console.error(err);
      alert("Error al crear el enlace.");
    } finally {
      setIsCreatingLink(false);
    }
  };

  if (!moduleData) return null;

  return (
    <>
      <div className="w-full bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,0.2)] relative overflow-visible">

        {/* Tape/Detail annotation */}
        <div className="absolute -top-4 -right-2 sm:-right-6 bg-[#493f36] border-2 border-[#1c1c19] text-white font-display font-bold text-[8px] sm:text-[10px] py-0.5 sm:py-1 px-4 sm:px-8 rotate-12 tracking-[0.2em] uppercase shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] z-20">
          SPEC_SHEET
        </div>

        <div className="border-b-2 border-[#1c1c19] p-4 md:px-12 md:py-6 relative z-10 bg-[#f6f3ee] flex justify-between items-center">
          <div className="flex items-center gap-2 md:gap-3 overflow-hidden">
            <Layers size={14} className="text-[#0f4369] md:size-4 shrink-0" />
            <span className="text-[10px] md:text-xs font-display font-bold text-[#0f4369] tracking-widest uppercase truncate">{moduleData.phaseTitle || "INTRODUCTION"}</span>
            <span className="text-[#72777f] shrink-0">//</span>
            <span className="text-[10px] md:text-xs font-display font-bold text-[#1c1c19] tracking-widest uppercase truncate">MODULE_{moduleData.id}</span>
          </div>

          {isAdmin && (
            <button
              onClick={() => isEditing ? handleSave() : setIsEditing(true)}
              className={`p-1.5 sm:px-4 flex items-center gap-2 border-2 border-[#1c1c19] font-display text-[10px] sm:text-xs font-bold tracking-widest uppercase transition-all active:translate-y-[1px] shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-y-[1px] ${isEditing ? 'bg-[#0f4369] text-white border-[#0f4369]' : 'bg-[#e5e2dd] text-[#1c1c19] hover:bg-[#1c1c19] hover:text-white'}`}
            >
              {isEditing ? <><Save size={14} className="sm:size-4" /> <span className="hidden sm:inline">Save Edits</span></> : <><Edit2 size={14} className="sm:size-4" /> <span className="hidden sm:inline">Admin Edit</span></>}
            </button>
          )}
        </div>


          <div className="p-5 md:p-12 pb-6 md:pb-8 relative z-10">
            {isEditing ? (
              <input
                type="text"
                value={moduleData.title}
                onChange={(e) => setModuleData({ ...moduleData, title: e.target.value })}
                className="w-full bg-white border-2 border-[#0f4369] p-3 text-2xl md:text-5xl text-[#1c1c19] tracking-wide font-display font-bold mb-6 focus:outline-none uppercase leading-[1.1]"
              />
            ) : (
              <h1 className="text-2xl md:text-5xl text-[#1c1c19] tracking-wide font-display font-bold mb-6 max-w-4xl uppercase leading-[1.1]">
                {moduleData.title}
              </h1>
            )}

            {isEditing ? (
              <textarea
                value={moduleData.description || `Detailed overview of the "${moduleData.title}" module requirements...`}
                onChange={(e) => setModuleData({ ...moduleData, description: e.target.value })}
                className="w-full h-32 bg-white border-2 border-[#0f4369] p-3 text-[#1c1c19] text-sm font-sans mb-6 focus:outline-none"
              />
            ) : (
              <p className="text-[#1c1c19]/80 text-sm md:text-base tracking-wide max-w-3xl leading-relaxed font-sans mb-6 md:mb-10 border-l-2 border-[#0f4369] pl-4 md:pl-5">
                {moduleData.description || `Detailed overview of the "${moduleData.title}" module requirements...`}
              </p>
            )}

            {isEditing && (
              <div className="flex flex-col gap-4 mb-10 border-l-2 border-[#ba1a1a] pl-5">
                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-display font-bold text-[#ba1a1a] tracking-widest uppercase">Internal Drafting Note (Bottom Accent)</label>
                  <textarea
                    value={moduleData.notes || ''}
                    onChange={(e) => setModuleData({ ...moduleData, notes: e.target.value })}
                    placeholder="E.g. Ensure 0px precision across all coordinate planes."
                    className="w-full h-20 bg-white border-2 border-[#1c1c19] p-3 text-xs font-display tracking-widest uppercase focus:outline-none"
                  />
                </div>

                <div className="flex items-center bg-white border-2 border-[#0f4369] p-3 text-sm w-fit">
                  <span className="font-display font-bold text-[#1c1c19] mr-3 uppercase tracking-widest">SORT_ORDER:</span>
                  <input
                    type="number"
                    value={moduleData.sort_order || 0}
                    onChange={(e) => setModuleData({ ...moduleData, sort_order: parseInt(e.target.value, 10) || 0 })}
                    className="w-16 focus:outline-none font-sans text-center bg-transparent"
                    min="0"
                  />
                </div>

                <div className="flex flex-col gap-2 mt-4">
                  <label className="text-[10px] font-display font-bold text-[#ba1a1a] tracking-widest uppercase">Background Image Selection</label>
                  <div className="flex gap-2 flex-wrap bg-white border-2 border-[#1c1c19] p-4">
                    <button
                      onClick={() => setModuleData({ ...moduleData, image_url: null })}
                      className={`w-16 h-10 border-2 transition-all flex items-center justify-center text-[10px] font-bold ${!moduleData.image_url ? 'border-[#0f4369] bg-[#e5e2dd]' : 'border-[#1c1c19]/20 bg-[#fcf9f4] hover:border-[#1c1c19]'}`}
                    >
                      NONE
                    </button>
                    {BROLL_IMAGES.map((img) => (
                      <button
                        key={img}
                        onClick={() => setModuleData({ ...moduleData, image_url: img })}
                        className={`w-16 h-10 border-2 transition-all overflow-hidden relative ${moduleData.image_url === img ? 'border-[#0f4369] scale-105 shadow-md' : 'border-[#1c1c19]/20 hover:border-[#1c1c19]'}`}
                      >
                        <img src={img} className="w-full h-full object-cover" alt="Broll" />
                        {moduleData.image_url === img && <div className="absolute inset-0 bg-[#0f4369]/20"></div>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        

        <div className="p-6 md:p-12 relative z-10 flex flex-col bg-[#fcf9f4]">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* Associated BIM Schemas */}
            <div className="w-full">
              <div className="flex justify-between items-center border-b-2 border-[#1c1c19] pb-3 mb-6">
                <h3 className="text-sm font-display font-bold text-[#1c1c19] tracking-widest flex items-center uppercase">
                  <Database size={16} strokeWidth={2.5} className="mr-3 text-[#1c1c19]" />
                  Associated BIM Schemas
                </h3>
                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 md:mt-0">
                    <button
                      onClick={() => {
                        setAggregatorTab('esquemas');
                        setShowResourceAggregator(true);
                        setShowSchemaExternalLinkForm(false);
                      }}
                      className="text-[9px] md:text-[10px] font-display font-bold uppercase tracking-widest flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 border-2 border-[#0f4369] text-[#0f4369] hover:bg-[#0f4369] hover:text-white transition-all"
                    >
                      <LinkIcon size={12} /> Link Schema
                    </button>
                    <button
                      onClick={() => {
                        setShowSchemaExternalLinkForm(!showSchemaExternalLinkForm);
                        setShowResourceAggregator(false);
                      }}
                      className={`text-[9px] md:text-[10px] font-display font-bold uppercase tracking-widest flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 border-2 transition-all ${showSchemaExternalLinkForm ? 'bg-[#ba1a1a] text-white border-[#ba1a1a]' : 'text-[#ba1a1a] border-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white'}`}
                    >
                      <ExternalLink size={12} /> {showSchemaExternalLinkForm ? "Cancel" : "External Link"}
                    </button>
                  </div>
                )}
              </div>

              {showSchemaExternalLinkForm && isAdmin && (
                <div className="mb-8 p-6 bg-white border-2 border-[#ba1a1a] shadow-[4px_4px_0_0_rgba(186,26,26,0.1)] animate-in fade-in slide-in-from-top-2 duration-300">
                  <h4 className="text-[10px] font-display font-bold text-[#ba1a1a] tracking-widest uppercase mb-4 flex items-center gap-2">
                    <ExternalLink size={14} /> Create External Link for Schema
                  </h4>
                  <div className="flex flex-col gap-4">
                    <div className="w-full">
                      <label className="text-[9px] font-display font-bold text-[#72777f] uppercase tracking-widest block mb-1">Reference Title</label>
                      <input 
                        type="text"
                        value={externalLinkData.title}
                        onChange={(e) => setExternalLinkData({...externalLinkData, title: e.target.value})}
                        placeholder="e.g. Complementary Technical Standard"
                        className="w-full bg-[#f6f3ee] border-2 border-[#1c1c19]/10 p-2 text-xs focus:border-[#ba1a1a] outline-none transition-colors"
                      />
                    </div>
                    <div className="w-full">
                      <label className="text-[9px] font-display font-bold text-[#72777f] uppercase tracking-widest block mb-1">URL / Link</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={externalLinkData.url}
                          onChange={(e) => setExternalLinkData({...externalLinkData, url: e.target.value})}
                          placeholder="https://..."
                          className="w-full bg-[#f6f3ee] border-2 border-[#1c1c19]/10 p-2 text-xs focus:border-[#ba1a1a] outline-none transition-colors"
                        />
                        <button 
                          onClick={handleCreateExternalLink}
                          disabled={isCreatingLink}
                          className="bg-[#ba1a1a] text-white px-4 py-2 text-[10px] font-display font-bold uppercase tracking-widest hover:bg-[#1c1c19] transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {isCreatingLink ? "SAVING..." : "ADD"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="space-y-8">
                {associatedEsquemas.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-[#d8d3cc] text-center bg-white/50">
                    <p className="text-xs font-display uppercase tracking-widest text-[#72777f]">No BIM schemas linked to this module.</p>
                  </div>
                ) : (
                  <>
                    {/* Unique Schemas List */}
                    <div className="space-y-3">
                        <span className="text-[9px] font-black tracking-widest uppercase text-[#0f4369]/60 mb-2 block">Ecosistemas BIM Vinculados</span>
                        <div className="flex flex-wrap gap-3">
                            {Array.from(new Set(associatedEsquemas.map(a => a.esquema_id))).map(id => {
                                const esq = associatedEsquemas.find(a => a.esquema_id === id);
                                return (
                                    <button 
                                        key={id}
                                        onClick={() => navigate(`/esquemas/${id}`)}
                                        className="bg-[#1c1c19] text-white px-4 py-2 border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(15,67,105,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center gap-3 group"
                                    >
                                        <Database size={14} className="text-[#0f4369]" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter">{esq.esquema_name}</span>
                                        <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="h-[2px] bg-[#1c1c19]/5 w-1/3 my-6"></div>

                    {/* Specific Nodes List */}
                    <div className="space-y-4">
                        <span className="text-[9px] font-black tracking-widest uppercase text-[#0f4369]/60 mb-2 block">Puntos de Información Específicos</span>
                        {associatedEsquemas.map((assoc, i) => (
                          <div key={i} className="group relative bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] p-3 flex flex-col md:flex-row md:items-center gap-4">
                            <div className="flex items-center gap-4 flex-1 min-w-0">
                                <div className="w-10 h-10 shrink-0 bg-[#e5e2dd] border-2 border-[#1c1c19] flex items-center justify-center">
                                <Database size={18} className="text-[#0f4369]" />
                                </div>
                                <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className="text-[8px] font-display font-bold tracking-[0.2em] uppercase text-[#0f4369]">
                                    {assoc.esquema_name}
                                    </span>
                                </div>
                                <h4 className="font-display font-bold text-[11px] text-[#1c1c19] uppercase truncate">
                                    {assoc.node_name}
                                </h4>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button 
                                onClick={() => navigate(`/esquemas/${assoc.esquema_id}?selectedNode=${assoc.node_id}`)}
                                className="bg-[#0f4369] text-white p-1.5 hover:bg-[#1c1c19] transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-y-0 active:translate-y-0.5"
                                title="View this schema"
                                >
                                <Eye size={14} />
                                </button>
                                {isAdmin && (
                                <button 
                                    onClick={() => handleUnlinkEsquemaNode(assoc.esquema_id, assoc.node_id)}
                                    className="bg-white border-2 border-[#ba1a1a] text-[#ba1a1a] p-1.5 opacity-0 group-hover:opacity-100 hover:bg-[#ba1a1a] hover:text-white transition-all shadow-[2px_2px_0_0_rgba(186,26,26,1)] hover:shadow-none translate-y-0 active:translate-y-0.5"
                                    title="Remove association"
                                >
                                    <Trash2 size={14} />
                                </button>
                                )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Module Resources */}
            <div className="w-full">
              <div className="flex justify-between items-center border-b-2 border-[#1c1c19] pb-3 mb-6">
                <h3 className="text-sm font-display font-bold text-[#1c1c19] tracking-widest flex items-center uppercase">
                  <FileText size={16} strokeWidth={2.5} className="mr-3 text-[#1c1c19]" />
                  Module Resources
                </h3>
                {isAdmin && (
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 mt-2 md:mt-0">
                    <button
                      onClick={() => {
                        setAggregatorTab('resources');
                        setShowResourceAggregator(!showResourceAggregator);
                        setShowExternalLinkForm(false);
                      }}
                      className={`text-[9px] md:text-[10px] font-display font-bold uppercase tracking-widest flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 border-2 transition-all ${showResourceAggregator && aggregatorTab === 'resources' ? 'bg-[#0f4369] text-white border-[#0f4369]' : 'text-[#0f4369] border-[#0f4369] hover:bg-[#0f4369] hover:text-white'}`}
                    >
                      <LinkIcon size={12} /> {showResourceAggregator && aggregatorTab === 'resources' ? "Close" : "Internal Link"}
                    </button>
                    <button
                      onClick={() => {
                        setShowExternalLinkForm(!showExternalLinkForm);
                        setShowResourceAggregator(false);
                      }}
                      className={`text-[9px] md:text-[10px] font-display font-bold uppercase tracking-widest flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 border-2 transition-all ${showExternalLinkForm ? 'bg-[#ba1a1a] text-white border-[#ba1a1a]' : 'text-[#ba1a1a] border-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white'}`}
                    >
                      <ExternalLink size={12} /> {showExternalLinkForm ? "Cancel" : "External Link"}
                    </button>
                  </div>
                )}
              </div>

              {showExternalLinkForm && isAdmin && (
                <div className="mb-8 p-6 bg-white border-2 border-[#ba1a1a] shadow-[4px_4px_0_0_rgba(186,26,26,0.1)] animate-in fade-in slide-in-from-top-2 duration-300">
                  <h4 className="text-[10px] font-display font-bold text-[#ba1a1a] tracking-widest uppercase mb-4 flex items-center gap-2">
                    <ExternalLink size={14} /> Create Loose External Link
                  </h4>
                  <div className="flex flex-col gap-4">
                    <div className="w-full">
                      <label className="text-[9px] font-display font-bold text-[#72777f] uppercase tracking-widest block mb-1">Resource Title</label>
                      <input 
                        type="text"
                        value={externalLinkData.title}
                        onChange={(e) => setExternalLinkData({...externalLinkData, title: e.target.value})}
                        placeholder="e.g. Advanced ISO Standard"
                        className="w-full bg-[#f6f3ee] border-2 border-[#1c1c19]/10 p-2 text-xs focus:border-[#ba1a1a] outline-none transition-colors"
                      />
                    </div>
                    <div className="w-full">
                      <label className="text-[9px] font-display font-bold text-[#72777f] uppercase tracking-widest block mb-1">URL (Drive, Web, etc)</label>
                      <div className="flex gap-2">
                        <input 
                          type="text"
                          value={externalLinkData.url}
                          onChange={(e) => setExternalLinkData({...externalLinkData, url: e.target.value})}
                          placeholder="https://drive.google.com/..."
                          className="w-full bg-[#f6f3ee] border-2 border-[#1c1c19]/10 p-2 text-xs focus:border-[#ba1a1a] outline-none transition-colors"
                        />
                        <button 
                          onClick={handleCreateExternalLink}
                          disabled={isCreatingLink}
                          className="bg-[#ba1a1a] text-white px-4 py-2 text-[10px] font-display font-bold uppercase tracking-widest hover:bg-[#1c1c19] transition-colors disabled:opacity-50 whitespace-nowrap"
                        >
                          {isCreatingLink ? "SAVING..." : "ADD"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                {resourcesLoading ? (
                  <div className="text-xs font-display uppercase tracking-widest text-[#72777f]">Loading Resources...</div>
                ) : moduleResources.length === 0 ? (
                  <div className="p-6 border-2 border-dashed border-[#d8d3cc] text-center">
                    <p className="text-xs font-display uppercase tracking-widest text-[#72777f]">No resources linked to this module.</p>
                  </div>
                ) : (
                  moduleResources.map(res => (
                    <div key={res.id} className="group relative bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] hover:shadow-[6px_6px_0_0_rgba(28,28,25,0.15)] transition-all p-3 flex flex-col md:flex-row md:items-center gap-4">
                      
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 shrink-0 bg-[#e5e2dd] border-2 border-[#1c1c19] flex items-center justify-center overflow-hidden">
                          {res.image_url ? (
                            <img src={res.image_url} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                          ) : (
                            <FileText size={18} className="text-[#0f4369]" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[8px] font-display font-bold tracking-[0.2em] uppercase text-[#0f4369]">
                              {res.category}
                            </span>
                            <span className="text-[#d8d3cc] text-[10px]">//</span>
                            <h4 className="font-display font-bold text-[11px] text-[#1c1c19] uppercase truncate">
                              {res.title}
                            </h4>
                          </div>
                          <p className="text-[10px] font-sans text-[#493f36]/60 truncate italic">
                            {res.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                        <button
                          onClick={() => {
                            if (res.project_id) {
                              navigate(`/project/${res.project_id}?tab=protocolos&resourceId=${res.id}`);
                            } else {
                              navigate(`/resource/${res.id}`);
                            }
                          }}
                          className="inline-flex items-center gap-1.5 text-[9px] font-display font-bold tracking-[0.1em] uppercase text-[#fcf9f4] bg-[#1c1c19] border-2 border-[#1c1c19] px-3 py-1.5 hover:bg-[#333] transition-colors"
                        >
                          <ArrowRight size={10} strokeWidth={2.5} /> View
                        </button>
                        {res.url && (
                          <a
                            href={res.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-[9px] font-display font-bold tracking-[0.1em] uppercase text-[#1c1c19] border-2 border-[#1c1c19] px-3 py-1.5 hover:bg-[#e5e2dd] transition-colors"
                          >
                            <ExternalLink size={10} strokeWidth={2.5} /> Drive
                          </a>
                        )}
                        
                        {isAdmin && (
                          <button
                            onClick={() => unlinkResourceFromModule(moduleData.id, res.id)}
                            className="text-[#72777f] hover:text-[#ba1a1a] transition-colors p-1.5 border-2 border-transparent hover:border-[#ba1a1a]/20 ml-2"
                            title="Unlink from Module"
                          >
                            <Unlink size={13} strokeWidth={2.5} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {showResourceAggregator && isAdmin && (
            <div className="fixed inset-0 z-[100] flex flex-col bg-[#fcf9f4]">
              <div className="bg-[#e5e2dd] border-b-2 border-[#1c1c19] p-4 md:p-6 sticky top-0 z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-4 shadow-[0_4px_0_0_rgba(28,28,25,0.1)]">
                <div>
                  <h2 className="font-display font-bold text-[#1c1c19] tracking-widest uppercase text-lg md:text-xl">Internal Link Aggregator</h2>
                  <p className="font-sans text-xs md:text-sm text-[#72777f] mt-1">Select an existing global resource or BIM Schema node to link to MODULE_{moduleData.id}</p>
                </div>
                
                <div className="flex bg-[#fcf9f4] border-2 border-[#1c1c19] p-1 gap-1">
                    <button 
                      onClick={() => setAggregatorTab('resources')}
                      className={`px-4 py-1.5 text-[10px] font-display font-bold uppercase tracking-widest transition-all ${aggregatorTab === 'resources' ? 'bg-[#0f4369] text-white shadow-[2px_2px_0_0_rgba(15,67,105,0.3)]' : 'text-[#72777f] hover:bg-[#1c1c19]/5'}`}
                    >
                        Resources
                    </button>
                    <button 
                      onClick={() => setAggregatorTab('esquemas')}
                      className={`px-4 py-1.5 text-[10px] font-display font-bold uppercase tracking-widest transition-all ${aggregatorTab === 'esquemas' ? 'bg-[#0f4369] text-white shadow-[2px_2px_0_0_rgba(15,67,105,0.3)]' : 'text-[#72777f] hover:bg-[#1c1c19]/5'}`}
                    >
                        BIM Schemas
                    </button>
                </div>

                <button
                  onClick={() => setShowResourceAggregator(false)}
                  className="bg-[#1c1c19] text-[#fcf9f4] w-full md:w-auto px-4 py-2 font-display font-bold tracking-widest text-[11px] uppercase border-2 border-transparent hover:bg-[#333] transition-colors"
                >
                  Close Aggregator
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
                {aggregatorTab === 'resources' ? (
                    <ResourceList moduleMode={true} moduleId={moduleData.id} onSelectResource={handleLinkResource} />
                ) : (
                    <div className="flex flex-col gap-6">
                        <div className="bg-white border-2 border-[#1c1c19] p-4 flex items-center gap-4 shadow-[4px_4px_0_0_rgba(15,67,105,1)]">
                            <Search size={20} className="text-[#0f4369]" />
                            <input 
                              autoFocus
                              value={searchEsquema}
                              onChange={e => setSearchEsquema(e.target.value)}
                              placeholder="SEARCH SCHEMA NODE... (e.g. ISO, MEP, LOD)"
                              className="flex-1 bg-transparent border-none focus:ring-0 font-display font-bold text-sm tracking-widest uppercase outline-none"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                            {allEsquemaNodes
                              .filter(n => n.node_name.toLowerCase().includes(searchEsquema.toLowerCase()) || n.esquema_name.toLowerCase().includes(searchEsquema.toLowerCase()))
                              .map((node, i) => {
                                  const isLinked = associatedEsquemas.some(a => a.esquema_id === node.esquema_id && a.node_id === node.node_id);
                                  return (
                                      <div 
                                          key={`${node.esquema_id}-${node.node_id}-${i}`}
                                          className={`bg-white border-2 p-4 flex flex-col justify-between transition-all group ${isLinked ? 'border-[#0f4369]/20 opacity-50' : 'border-[#1c1c19] hover:translate-y-[-2px] hover:shadow-[4px_4px_0_0_rgba(28,28,25,1)]'}`}
                                      >
                                          <div className="mb-4">
                                              <div className="flex items-center gap-2 mb-1">
                                                  <Database size={12} className="text-[#0f4369]" />
                                                  <span className="text-[10px] font-display font-bold text-[#0f4369] tracking-widest uppercase truncate">{node.esquema_name}</span>
                                              </div>
                                              <h4 className="font-display font-bold text-xs text-[#1c1c19] uppercase line-clamp-2">{node.node_name}</h4>
                                          </div>
                                          <button 
                                              disabled={isLinked}
                                              onClick={() => handleLinkEsquemaNode(node)}
                                              className={`w-full py-2 font-display font-bold text-[10px] tracking-widest uppercase border-2 transition-all ${isLinked ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-[#1c1c19] bg-[#fcf9f4] hover:bg-[#1c1c19] hover:text-white'}`}
                                          >
                                              {isLinked ? 'LINKED' : 'LINK COMPONENT'}
                                          </button>
                                      </div>
                                  );
                              })}
                        </div>
                    </div>
                )}
              </div>
            </div>
          )}

        </div> {/* End of card content flex-col bottom area */}
      </div> {/* End of main blueprint card div */}

      {/* NEWS ARTICLE STYLE EXECUTION PARAMETERS - BROKEN OUT */}
      <div className="mt-20 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        <div className=" mx-auto">
          <div className="flex items-center justify-center mb-12">
            <div className="h-[1px] flex-1 bg-[#1c1c19]/10"></div>
            <div className="mx-6 flex flex-col items-center">
              <div className="w-12 h-[1px] bg-[#1c1c19] mb-2"></div>
              <h3 className="font-display font-bold text-[12px] text-[#1c1c19] uppercase tracking-[0.4em]">
                Execution_Parameters_Sheet
              </h3>
            </div>
            <div className="h-[1px] flex-1 bg-[#1c1c19]/10"></div>
          </div>

          <div className="w-full bg-white/50 backdrop-blur-sm py-6 md:py-20 shadow-[0_0_50px_rgba(0,0,0,0.03)] border-x border-[#1c1c19]/5 relative overflow-hidden">
            <div className="absolute -left-3 top-20 text-[#493f36]/30 font-display text-[8px] md:text-[10px] -rotate-90 tracking-[0.5em] uppercase whitespace-nowrap hidden sm:block">
              -- OFFICIAL_PROCEDURE --
            </div>

            <div className="w-full">
              <ContentBlockEditor
                blocks={blocks}
                onChange={setBlocks}
                onUploadImage={uploadModuleImage}
                isEditing={isEditing}
              />
            </div>

            {/* Hand-drawn drafting note accent */}
            <div className="mt-8 md:mt-16 pt-6 md:pt-10 border-t-2 border-dashed border-[#1c1c19]/10 text-[#493f36] font-display text-[11px] md:text-sm tracking-widest flex items-start bg-[#f6f3ee]/50 p-4 md:p-8">
              <span className="text-xl md:text-2xl mr-3 md:author-4 mt-[-4px]">✍</span>
              <div>
                <span className="block font-bold mb-1 opacity-50 text-[9px] md:text-[10px] uppercase tracking-widest">Internal drafting note:</span>
                {moduleData.notes || "Ensure 0px precision across all coordinate planes."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
