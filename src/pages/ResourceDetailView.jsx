import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useResources } from '../hooks/useResources';
import { useAuth } from '../context/AuthContext';
import ResourcePlaceholder from '../components/ui/ResourcePlaceholder';
import { 
  ArrowLeft, ExternalLink, Box, Database, Eye, X, 
  BookOpen, FileText, Download, Printer, Edit3, 
  ChevronDown, ChevronUp, Clock, Info, Compass, HelpCircle
} from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import ContentBlockEditor from '../components/modules/ContentBlockEditor';

// --- SUB-COMPONENT: INLINE SUB-DOCUMENT VIEWER ---
function InlineSubdocViewer({ resource }) {
  const { fetchResourceBlocks } = useResources();
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      const data = await fetchResourceBlocks(resource.id);
      if (isMounted) {
        if (data && data.length > 0) {
          setBlocks(data);
        } else if (resource.manual) {
          setBlocks([{ type: 'text', content: resource.manual, id: 'migrated-manual' }]);
        }
        setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [resource, fetchResourceBlocks]);

  if (loading) {
    return (
      <div className="p-12 text-center bg-[#fcf9f4] border-t-2 border-[#1c1c19] flex items-center justify-center gap-3">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#0f4369] border-t-transparent"></div>
        <span className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">Cargando Documento Inline...</span>
      </div>
    );
  }

  if (blocks.length === 0) {
    return (
      <div className="p-8 text-center text-[10px] italic text-[#72777f] uppercase bg-[#fcf9f4] border-t-2 border-[#1c1c19]">
        Este documento no contiene información estructurada aún.
      </div>
    );
  }

  return (
    <div className="bg-[#fcf9f4] px-6 py-8 border-t-2 border-[#1c1c19] animate-in fade-in duration-300">
      <ContentBlockEditor
        blocks={blocks}
        onChange={() => {}}
        onUploadImage={() => {}}
        isEditing={false}
        fontSize={14}
      />
    </div>
  );
}

// Helper: Estimate reading time
function estimateReadingTime(blocks, manualText) {
  let wordCount = 0;
  if (blocks && blocks.length > 0) {
    blocks.forEach(b => {
      if (b.type === 'text' && b.content) {
        wordCount += b.content.split(/\s+/).length;
      }
    });
  } else if (manualText) {
    wordCount = manualText.split(/\s+/).length;
  }
  
  const minutes = Math.ceil(wordCount / 200);
  return minutes > 0 ? `${minutes} min` : 'Lectura rápida';
}

export default function ResourceDetailView() {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const {
    fetchResourceById,
    fetchResourceBlocks
  } = useResources();
  const { isAdmin, isBimManager } = useAuth();
  const isUnlocked = isAdmin || isBimManager;

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [blocks, setBlocks] = useState([]);
  const [associatedEsquemas, setAssociatedEsquemas] = useState([]);
  
  // Hierarchy state
  const [subdocs, setSubdocs] = useState({ manuals: [], templates: [], requirements: [] });
  const [parentProtocol, setParentProtocol] = useState(null);
  const [siblingDocs, setSiblingDocs] = useState([]);
  const [expandedSubdocId, setExpandedSubdocId] = useState(null);
  const [tocHeadings, setTocHeadings] = useState([]);

  useEffect(() => {
    async function loadResource() {
      setLoading(true);
      const data = await fetchResourceById(resourceId);
      if (data) {
        // Security check
        if (!isAdmin && data.published === false) {
          navigate('/resources');
          return;
        }
        setResource(data);

        // Fetch blocks
        const blockData = await fetchResourceBlocks(resourceId);
        let activeBlocks = [];
        if (blockData && blockData.length > 0) {
          setBlocks(blockData);
          activeBlocks = blockData;
        } else if (data.manual) {
          const migrated = [{ type: 'text', content: data.manual, id: 'migrated-manual' }];
          setBlocks(migrated);
          activeBlocks = migrated;
        } else {
          setBlocks([]);
        }

        // Fetch Associated Esquemas
        fetchAssociatedEsquemas(data.id);

        // Fetch Hierarchy (Parent/Children/Siblings)
        if (data.category === 'Protocolo') {
          // Clear subdocument parent states
          setParentProtocol(null);
          setSiblingDocs([]);
          
          // Query child documents
          const { data: children, error: childErr } = await supabase
            .from('resources')
            .select('*')
            .eq('image_url', data.id)
            .order('sort_order', { ascending: true })
            .order('title', { ascending: true });
          
          if (!childErr && children) {
            setSubdocs({
              manuals: children.filter(c => c.category === 'Manual'),
              templates: children.filter(c => c.category === 'Plantilla'),
              requirements: children.filter(c => c.category === 'Requisito' || c.category === 'requisito'),
            });
          }
        } else if (['Manual', 'Plantilla', 'Requisito', 'manual', 'plantilla', 'requisito'].includes(data.category?.toLowerCase()) && data.image_url) {
          // Clear protocol child states
          setSubdocs({ manuals: [], templates: [], requirements: [] });
          
          // Fetch parent protocol
          const { data: parentData, error: parentErr } = await supabase
            .from('resources')
            .select('*')
            .eq('id', data.image_url)
            .single();
          
          if (!parentErr && parentData) {
            setParentProtocol(parentData);
          }

          // Fetch siblings
          const { data: siblings, error: sibErr } = await supabase
            .from('resources')
            .select('*')
            .eq('image_url', data.image_url)
            .order('sort_order', { ascending: true })
            .order('title', { ascending: true });
          
          if (!sibErr && siblings) {
            setSiblingDocs(siblings.filter(s => s.id !== data.id));
          }
        } else {
          // Plain resource
          setSubdocs({ manuals: [], templates: [], requirements: [] });
          setParentProtocol(null);
          setSiblingDocs([]);
        }

      } else {
        navigate('/');
      }
      setLoading(false);
    }
    loadResource();
  }, [resourceId, fetchResourceById, fetchResourceBlocks, navigate, isAdmin]);

  // Extract ToC Headings from blocks
  useEffect(() => {
    if (blocks && blocks.length > 0) {
      const headings = [];
      blocks.forEach((block, blockIdx) => {
        if (block.type === 'text' && block.content) {
          const lines = block.content.split('\n');
          lines.forEach(line => {
            const match = line.match(/^(#{2,4})\s+(.+)$/);
            if (match) {
              const level = match[1].length; // 2, 3, or 4
              const text = match[2].replace(/[_*`#]/g, '').trim();
              const id = text
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)/g, '');
              headings.push({ level, text, id });
            }
          });
        }
      });
      setTocHeadings(headings);
    } else {
      setTocHeadings([]);
    }
  }, [blocks]);

  const fetchAssociatedEsquemas = async (resId) => {
    const { data: assocData } = await supabase
      .from('esquema_nodes_resources')
      .select('node_id, esquema_id, esquemas ( id, name )')
      .eq('resource_id', resId);

    if (assocData && assocData.length > 0) {
      const nodeIds = assocData.map(link => link.node_id);
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

      const formatted = assocData.map(link => {
        const esq = link.esquemas;
        if (!esq) return null;

        const nodeName = nodeNameMap[link.node_id];
        if (!nodeName) return null; // Filter out legacy/deleted nodes in public view

        return {
          esquema_id: esq.id,
          esquema_name: esq.name,
          node_id: link.node_id,
          node_name: nodeName
        };
      }).filter(Boolean);

      setAssociatedEsquemas(formatted);
    } else {
      setAssociatedEsquemas([]);
    }
  };

  const handleScrollToHeading = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getCategoryLabel = (cat) => {
    switch (cat?.toLowerCase()) {
      case 'protocolo': return 'Protocolo Maestro';
      case 'manual': return 'Manual Secundario';
      case 'plantilla': return 'Plantilla de Descarga';
      case 'requisito': return 'Requisito de Información';
      default: return cat || 'Recurso Técnico';
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#0f4369] border-t-transparent"></div>
          <div className="font-display font-bold text-[#1c1c19] uppercase tracking-widest text-xs bg-[#f6f3ee] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] px-6 py-3">
            CARGANDO_RECURSO...
          </div>
        </div>
      </div>
    );
  }

  if (!resource) return null;

  const totalReadingTime = estimateReadingTime(blocks, resource.manual);
  const hasSubdocs = subdocs.manuals.length > 0 || subdocs.templates.length > 0 || subdocs.requirements.length > 0;

  return (
    <div className="container mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24 pt-6 px-4 lg:px-8">
      
      {/* Top Header Navigation Panel */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 pb-4 border-b border-[#1c1c19]/10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-[10px] font-display font-bold tracking-widest uppercase text-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all border-2 border-[#1c1c19] px-4 py-2 bg-[#fcf9f4] shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
        >
          <ArrowLeft className="mr-2" size={14} strokeWidth={2.5} />
          VOLVER
        </button>

        <div className="flex items-center gap-2 text-[10px] font-mono text-[#72777f] uppercase">
          <span>PROYECTO</span>
          <span>/</span>
          {parentProtocol ? (
            <>
              <Link to={`/resourceView/${parentProtocol.id}`} className="hover:text-[#0f4369] hover:underline font-bold transition-all">
                {parentProtocol.title.substring(0, 25)}{parentProtocol.title.length > 25 && '...'}
              </Link>
              <span>/</span>
            </>
          ) : (
            <>
              <span>PROTOCOLOS</span>
              <span>/</span>
            </>
          )}
          <span className="text-[#1c1c19] font-bold">{resource.title.substring(0, 30)}{resource.title.length > 30 && '...'}</span>
        </div>

        {isUnlocked && (
          <button
            onClick={() => navigate(`/admin/resourceEdit/${resource.id}`)}
            className="flex items-center gap-2 text-[10px] font-display font-bold tracking-widest uppercase text-white bg-[#0f4369] hover:bg-[#1c1c19] transition-all border-2 border-[#1c1c19] px-4 py-2 shadow-[3px_3px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]"
          >
            <Edit3 size={12} />
            EDITAR DOCUMENTO
          </button>
        )}
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Main content reader (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-8">
          
          <article className="w-full bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,0.15)] relative overflow-hidden p-6 md:p-12">
            
            {/* Ribbon Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 overflow-hidden pointer-events-none">
              <div className="absolute top-6 -right-10 bg-[#0f4369] text-white font-display font-bold text-[8px] py-1 px-12 rotate-45 tracking-[0.2em] uppercase text-center border-b border-[#1c1c19] shadow-[0_2px_4px_rgba(0,0,0,0.15)]">
                {resource.category}
              </div>
            </div>

            {/* Document Header Info */}
            <div className="flex flex-wrap items-center gap-2 mb-6">
              <span className="text-[9px] font-display font-black text-white bg-[#0f4369] border border-[#1c1c19] px-2 py-0.5 tracking-wider uppercase">
                {getCategoryLabel(resource.category)}
              </span>
              <span className="text-[#72777f] font-mono text-[9px]">//</span>
              <span className="text-[9px] font-mono text-[#72777f] uppercase">
                REF_ID: {resource.id.substring(0, 8)}
              </span>
              <span className="text-[#72777f] font-mono text-[9px]">//</span>
              <span className="text-[9px] font-mono text-[#72777f] flex items-center gap-1">
                <Clock size={10} /> {totalReadingTime}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-4xl text-[#1c1c19] tracking-tight font-display font-black mb-6 uppercase leading-none border-b-2 border-[#1c1c19] pb-4">
              {resource.title}
            </h1>

            {/* Description */}
            {resource.description && (
              <div className="border-l-4 border-[#0f4369] pl-5 py-1 mb-8">
                <p className="text-[#1c1c19]/80 text-sm md:text-base leading-relaxed font-sans italic">
                  {resource.description}
                </p>
              </div>
            )}

            {/* Cover Image if exists */}
            {resource.image_url && !['Manual', 'Plantilla', 'Requisito', 'manual', 'plantilla', 'requisito'].includes(resource.category?.toLowerCase()) && (
              <div className="mb-10 border-2 border-[#1c1c19] overflow-hidden max-h-96">
                <img 
                  src={resource.image_url} 
                  alt={resource.title} 
                  className="w-full h-full object-cover mix-blend-multiply opacity-90"
                />
              </div>
            )}

            {/* SUB-DOCUMENTS HIERARCHY SECTION (Only if Protocolo has children) */}
            {resource.category === 'Protocolo' && hasSubdocs && (
              <div className="mt-10 mb-12 border-2 border-[#1c1c19] bg-white p-6 md:p-8 shadow-[4px_4px_0_0_rgba(28,28,25,0.05)]">
                <h3 className="font-display font-black text-sm text-[#1c1c19] uppercase tracking-wider mb-6 pb-2 border-b border-[#1c1c19]/10 flex items-center gap-2">
                  <BookOpen size={16} className="text-[#0f4369]" />
                  ESTRUCTURA DE DOCUMENTOS RELACIONADOS
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Manuales Secundarios */}
                  <div>
                    <span className="block text-[9px] font-black text-[#72777f] uppercase tracking-widest mb-3 pb-1 border-b border-[#1c1c19]/5">
                      MANUALES SECUNDARIOS ({subdocs.manuals.length})
                    </span>
                    {subdocs.manuals.length === 0 ? (
                      <p className="text-[10px] text-[#72777f] italic uppercase">No hay manuales asociados</p>
                    ) : (
                      <div className="space-y-3">
                        {subdocs.manuals.map(m => (
                          <div 
                            key={m.id} 
                            className={`border-2 border-[#1c1c19] transition-all bg-white overflow-hidden shadow-[2px_2px_0_0_rgba(28,28,25,0.1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5`}
                          >
                            <div className="p-3 flex items-center justify-between gap-3">
                              <div 
                                className="flex-1 min-w-0 cursor-pointer flex items-center gap-2.5 group"
                                onClick={() => setExpandedSubdocId(expandedSubdocId === m.id ? null : m.id)}
                              >
                                <div className="w-7 h-7 bg-[#f6f3ee] border border-[#1c1c19] text-[#1c1c19] flex items-center justify-center shrink-0">
                                  <FileText size={12} />
                                </div>
                                <div className="truncate">
                                  <h4 className="text-[10px] font-bold text-[#1c1c19] uppercase truncate group-hover:text-[#0f4369] transition-colors">{m.title}</h4>
                                  <span className="text-[8px] text-[#72777f] uppercase font-mono block">
                                    {estimateReadingTime(null, m.manual)} // CLICK PARA LEER
                                  </span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => setExpandedSubdocId(expandedSubdocId === m.id ? null : m.id)}
                                  className="p-1 bg-[#f6f3ee] border border-[#1c1c19] text-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"
                                  title="Ver en línea"
                                >
                                  <ChevronDown size={12} className={`transition-transform duration-300 ${expandedSubdocId === m.id ? 'rotate-180' : ''}`} />
                                </button>
                                <button
                                  onClick={() => navigate(`/resourceView/${m.id}`)}
                                  className="p-1 bg-[#0f4369] border border-[#1c1c19] text-white hover:bg-[#1c1c19] transition-all"
                                  title="Ir a página de recurso"
                                >
                                  <Eye size={12} />
                                </button>
                              </div>
                            </div>

                            {/* Inline Content Block for secondary manual */}
                            {expandedSubdocId === m.id && (
                              <InlineSubdocViewer resource={m} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Plantillas de Descarga */}
                  <div className="space-y-6">
                    <div>
                      <span className="block text-[9px] font-black text-[#72777f] uppercase tracking-widest mb-3 pb-1 border-b border-[#1c1c19]/5">
                        PLANTILLAS Y RECURSOS ({subdocs.templates.length})
                      </span>
                      {subdocs.templates.length === 0 ? (
                        <p className="text-[10px] text-[#72777f] italic uppercase">No hay plantillas asociadas</p>
                      ) : (
                        <div className="space-y-3">
                          {subdocs.templates.map(t => (
                            <div 
                              key={t.id} 
                              className="border-2 border-[#1c1c19] bg-white shadow-[2px_2px_0_0_rgba(28,28,25,0.1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all p-3 flex items-center justify-between gap-3"
                            >
                              <div 
                                className="flex-1 min-w-0 cursor-pointer flex items-center gap-2.5"
                                onClick={() => navigate(`/resourceView/${t.id}`)}
                              >
                                <div className="w-7 h-7 bg-[#0f4369] text-white border border-[#1c1c19] flex items-center justify-center shrink-0">
                                  <Download size={12} />
                                </div>
                                <div className="truncate">
                                  <h4 className="text-[10px] font-bold text-[#1c1c19] uppercase truncate hover:text-[#0f4369] transition-colors">{t.title}</h4>
                                  <span className="text-[8px] text-[#72777f] uppercase block font-mono">PLANTILLA DESCARGABLE</span>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1.5">
                                {t.url ? (
                                  <a
                                    href={t.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1 bg-[#1c1c19] text-white hover:bg-[#333] border border-[#1c1c19] transition-all"
                                    title="Descargar plantilla"
                                  >
                                    <Download size={12} />
                                  </a>
                                ) : (
                                  <span className="text-[8px] bg-red-100 text-red-700 px-1 border border-red-200 font-mono">SIN URL</span>
                                )}
                                <button
                                  onClick={() => navigate(`/resourceView/${t.id}`)}
                                  className="p-1 bg-[#f6f3ee] border border-[#1c1c19] text-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"
                                  title="Ver detalles"
                                >
                                  <Eye size={12} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Requirements / Requisitos Normativos if any */}
                    {subdocs.requirements.length > 0 && (
                      <div>
                        <span className="block text-[9px] font-black text-[#72777f] uppercase tracking-widest mb-3 pb-1 border-b border-[#1c1c19]/5">
                          REQUISITOS ASOCIADOS ({subdocs.requirements.length})
                        </span>
                        <div className="space-y-3">
                          {subdocs.requirements.map(req => (
                            <div 
                              key={req.id} 
                              className="border-2 border-[#1c1c19] bg-white shadow-[2px_2px_0_0_rgba(28,28,25,0.1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                            >
                              <div className="p-3 flex items-center justify-between gap-3">
                                <div 
                                  className="flex-1 min-w-0 cursor-pointer flex items-center gap-2.5"
                                  onClick={() => setExpandedSubdocId(expandedSubdocId === req.id ? null : req.id)}
                                >
                                  <div className="w-7 h-7 bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                                    <FileText size={12} />
                                  </div>
                                  <div className="truncate">
                                    <h4 className="text-[10px] font-bold text-[#1c1c19] uppercase truncate hover:text-[#0f4369] transition-colors">{req.title}</h4>
                                    <span className="text-[8px] text-[#72777f] uppercase font-mono block">REQUISITO TÉCNICO</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => setExpandedSubdocId(expandedSubdocId === req.id ? null : req.id)}
                                    className="p-1 bg-[#f6f3ee] border border-[#1c1c19] text-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"
                                  >
                                    <ChevronDown size={12} className={`transition-transform duration-300 ${expandedSubdocId === req.id ? 'rotate-180' : ''}`} />
                                  </button>
                                  <button
                                    onClick={() => navigate(`/resourceView/${req.id}`)}
                                    className="p-1 bg-[#0f4369] border border-[#1c1c19] text-white hover:bg-[#1c1c19] transition-all"
                                  >
                                    <Eye size={12} />
                                  </button>
                                </div>
                              </div>
                              
                              {expandedSubdocId === req.id && (
                                <InlineSubdocViewer resource={req} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Document Content Blocks (Documentation) */}
            <div className="mt-8">
              {blocks.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-[#d8d3cc] bg-white/50">
                  <p className="text-[10px] font-display uppercase tracking-widest text-[#72777f] flex items-center justify-center gap-2">
                    <HelpCircle size={14} />
                    Este recurso no posee bloques de contenido documentados.
                  </p>
                </div>
              ) : (
                <div className="prose prose-slate max-w-none">
                  <div className="flex items-center gap-3 mb-8">
                    <div className="h-[1px] flex-1 bg-[#1c1c19]/10"></div>
                    <span className="text-[9px] font-display font-black text-[#1c1c19]/50 uppercase tracking-[0.3em]">
                      FIN_RESUMEN_INICIAL // COMIENZO_DE_LECTURA
                    </span>
                    <div className="h-[1px] flex-1 bg-[#1c1c19]/10"></div>
                  </div>
                  
                  {/* Render content blocks with 15px font size for optimized reading */}
                  <ContentBlockEditor
                    blocks={blocks}
                    onChange={() => { }}
                    onUploadImage={() => { }}
                    isEditing={false}
                    fontSize={15}
                  />
                </div>
              )}
            </div>

          </article>
        </div>

        {/* RIGHT COLUMN: Sticky Sidebar tools & metadata (lg:col-span-4) */}
        <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-6">
          
          {/* Quick Actions Card */}
          <div className="bg-[#fcf9f4] border-2 border-[#1c1c19] p-6 shadow-[4px_4px_0_0_rgba(28,28,25,0.1)]">
            <h3 className="font-display font-black text-[10px] text-[#1c1c19]/60 uppercase tracking-widest mb-4 pb-2 border-b border-[#1c1c19]/10 flex items-center gap-2">
              <Compass size={14} />
              ACCIONES_Y_ENLACES
            </h3>

            <div className="space-y-4">
              {/* Parent Protocol Link if it has one */}
              {parentProtocol && (
                <div className="p-3.5 bg-white border-2 border-[#1c1c19] flex flex-col gap-2">
                  <span className="text-[8px] font-black text-[#0f4369] uppercase tracking-widest flex items-center gap-1">
                    <Box size={10} /> PROTOCOLO MAESTRO PADRE
                  </span>
                  <Link 
                    to={`/resourceView/${parentProtocol.id}`}
                    className="text-[11px] font-black uppercase text-[#1c1c19] hover:text-[#0f4369] hover:underline leading-tight"
                  >
                    {parentProtocol.title}
                  </Link>
                </div>
              )}

              {/* Source/Drive URL */}
              {resource.url ? (
                <a
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full text-[10px] font-display font-black tracking-widest uppercase text-white bg-[#1c1c19] border-2 border-[#1c1c19] py-3 hover:bg-[#333] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all shadow-[3px_3px_0_0_rgba(15,67,105,1)]"
                >
                  <ExternalLink size={14} />
                  ABRIR ENLACE EXTERNO (DRIVE)
                </a>
              ) : (
                <div className="text-center p-3 text-[9px] font-bold text-[#72777f] bg-white border border-dashed border-[#d8d3cc] uppercase tracking-wider">
                  Sin enlace de Drive configurado
                </div>
              )}

              {/* Print Protocol Button */}
              {resource.category === 'Protocolo' && (
                <button
                  onClick={() => window.open(`/print/protocol/${resource.id}`, '_blank')}
                  className="flex items-center justify-center gap-2 w-full text-[10px] font-display font-bold tracking-widest uppercase text-[#1c1c19] bg-[#f6f3ee] border-2 border-[#1c1c19] py-3 hover:bg-[#1c1c19] hover:text-white transition-all"
                >
                  <Printer size={14} />
                  IMPRIMIR PROTOCOLO Y ANEXOS
                </button>
              )}
            </div>
          </div>

          {/* Sibling Manuals Navigation Card (Only for sub-documents) */}
          {siblingDocs.length > 0 && (
            <div className="bg-[#fcf9f4] border-2 border-[#1c1c19] p-6 shadow-[4px_4px_0_0_rgba(28,28,25,0.1)]">
              <h3 className="font-display font-black text-[10px] text-[#1c1c19]/60 uppercase tracking-widest mb-4 pb-2 border-b border-[#1c1c19]/10 flex items-center gap-2">
                <FileText size={14} />
                DOCUMENTOS DEL PROTOCOLO
              </h3>

              <div className="space-y-2">
                {/* Highlight current sub-document */}
                <div className="p-2.5 bg-[#0f4369] text-white border border-[#1c1c19] flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-white shrink-0"></div>
                  <span className="text-[10px] font-black uppercase truncate">{resource.title}</span>
                  <span className="text-[7px] font-mono ml-auto opacity-75">ACTUAL</span>
                </div>

                {/* Sibling navigation */}
                {siblingDocs.map(sib => (
                  <Link
                    key={sib.id}
                    to={`/resourceView/${sib.id}`}
                    className="p-2.5 bg-white border border-[#1c1c19] hover:bg-[#f6f3ee] flex items-center gap-2 group transition-all"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#72777f] group-hover:bg-[#0f4369] shrink-0"></div>
                    <span className="text-[10px] font-bold text-[#1c1c19] group-hover:text-[#0f4369] uppercase truncate transition-colors">
                      {sib.title}
                    </span>
                    <span className="text-[7px] font-mono ml-auto text-[#72777f] uppercase">
                      {sib.category}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Table of Contents (Outline) Card */}
          {tocHeadings.length > 0 && (
            <div className="bg-[#fcf9f4] border-2 border-[#1c1c19] p-6 shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] max-h-[400px] overflow-y-auto custom-scrollbar">
              <h3 className="font-display font-black text-[10px] text-[#1c1c19]/60 uppercase tracking-widest mb-4 pb-2 border-b border-[#1c1c19]/10 flex items-center gap-2">
                <Info size={14} />
                ÍNDICE DE LECTURA
              </h3>
              
              <nav className="space-y-1">
                {tocHeadings.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => handleScrollToHeading(h.id)}
                    className="w-full text-left py-1 px-2 border-l-2 hover:border-[#0f4369] border-[#1c1c19]/10 hover:bg-[#f6f3ee] text-[#1c1c19]/70 hover:text-[#0f4369] font-mono text-[9px] uppercase tracking-tight block transition-all"
                    style={{ paddingLeft: `${(h.level - 1) * 8}px` }}
                  >
                    <span className="text-[8px] opacity-40 mr-1.5">#</span>
                    {h.text}
                  </button>
                ))}
              </nav>
            </div>
          )}

          {/* Associated BIM Schemas Card */}
          <div className="bg-[#fcf9f4] border-2 border-[#1c1c19] p-6 shadow-[4px_4px_0_0_rgba(28,28,25,0.1)]">
            <h3 className="font-display font-black text-[10px] text-[#1c1c19]/60 uppercase tracking-widest mb-4 pb-2 border-b border-[#1c1c19]/10 flex items-center gap-2">
              <Database size={14} />
              VINCULACIÓN ESQUEMAS BIM
            </h3>

            {associatedEsquemas.length === 0 ? (
              <div className="p-4 border border-dashed border-[#d8d3cc] text-center bg-white/50 text-[9px] font-bold text-[#72777f] uppercase tracking-wider">
                Sin vinculaciones en el BEP
              </div>
            ) : (
              <div className="space-y-3">
                {associatedEsquemas.map((assoc, i) => (
                  <div 
                    key={i} 
                    className="p-3 bg-white border border-[#1c1c19] flex flex-col gap-1.5 hover:border-[#0f4369] transition-all"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[7px] font-mono bg-[#f6f3ee] text-[#0f4369] px-1.5 py-0.5 border border-[#1c1c19]/10 font-bold uppercase tracking-wider">
                        {assoc.esquema_name}
                      </span>
                      <button
                        onClick={() => navigate(`/esquemas/${assoc.esquema_id}?selectedNode=${assoc.node_id}`)}
                        className="text-[#0f4369] hover:text-[#1c1c19]"
                        title="Ver esquema completo"
                      >
                        <Eye size={12} />
                      </button>
                    </div>
                    <span className="text-[9px] font-bold text-[#1c1c19] uppercase leading-tight">
                      {assoc.node_name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
