import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useResources } from '../hooks/useResources';
import { useAuth } from '../context/AuthContext';
import ResourcePlaceholder from '../components/ui/ResourcePlaceholder';
import { ArrowLeft, ExternalLink, Image as ImageIcon, Box, Edit2, Save, X, Trash2, Database, Link as LinkIcon, Search, Eye, Sparkles, Copy, Check, Loader2 } from 'lucide-react';
import { RESOURCE_CATEGORIES } from '../services/sareNames';
import ContentBlockEditor from '../components/modules/ContentBlockEditor';
import { buildTreeFromFlatNodes } from '../utils/schemaUtils';
import { supabase } from '../services/supabaseClient';
// --- SUB-COMPONENT: BLOCKS AI IMPORT MODAL ---
const BlocksAiImportModal = ({ isOpen, onClose, onImport, resourceTitle, associatedEsquemas }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const buildSchemaTreeMarkdown = (node, depth = 0) => {
    if (!node) return '';
    let md = '  '.repeat(depth) + '- ' + (node.name || 'Nodo sin nombre') + '\n';
    if (node.description) {
      md += '  '.repeat(depth + 1) + '* Descripción: ' + node.description.replace(/\n/g, ' ') + '\n';
    }
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        md += buildSchemaTreeMarkdown(child, depth + 1);
      });
    }
    return md;
  };

  const handleCopyPrompt = async () => {
    let schemaContext = '1. Toma como referencia la estructura estándar de un BEP (BIM Execution Plan) para organizar la información.';
    if (associatedEsquemas && associatedEsquemas.length > 0) {
      schemaContext = '1. Toma como referencia la siguiente estructura del esquema BIM de nuestro entorno para contextualizar y organizar la información:\n';
      const uniqueEsquemas = [];
      associatedEsquemas.forEach(a => {
        if (!uniqueEsquemas.find(e => e.esquema_id === a.esquema_id)) {
           uniqueEsquemas.push(a);
        }
      });
      for (const esq of uniqueEsquemas) {
        const { data: nodes } = await supabase
          .from('esquema_nodes')
          .select('*')
          .eq('esquema_id', esq.esquema_id);

        if (nodes && nodes.length > 0) {
          const tree = buildTreeFromFlatNodes(nodes);
          if (tree) {
             schemaContext += buildSchemaTreeMarkdown(tree, 1);
          }
        }
      }
    }

    const masterPrompt = `Eres un experto técnico y BIM Manager. Tu objetivo es redactar el contenido para un documento BIM oficial titulado: "${resourceTitle}".

Instrucciones:
${schemaContext}
2. Genera SOLAMENTE la definición del documento y lineamientos generales. Ten en cuenta el contenido global y la existencia de manuales secundarios para cada uno de estos protocolos (los detalles operativos irán en los manuales, no aquí. Solo descríbelos de manera general).
3. NO incluyas fuentes bibliográficas ni enlaces externos.

Tu tarea es responder ÚNICA y EXCLUSIVAMENTE con un objeto JSON válido, sin Markdown extra (nada de \`\`\`json), siguiendo exactamente este esquema:

{
  "blocks": [
    {
      "type": "text",
      "content": "Contenido del bloque en formato Markdown (usa # para títulos, listas, negritas, etc.)"
    }
  ]
}

Genera los bloques que consideres necesarios para separar estas secciones generales. Recuerda escapar correctamente las comillas dobles y saltos de línea en el JSON.`;

    navigator.clipboard.writeText(masterPrompt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleValidate = () => {
    setError(null);
    setPreviewData(null);
    try {
      let cleanJson = jsonInput.trim();
      if (cleanJson.startsWith('```json')) cleanJson = cleanJson.replace(/```json/g, '').trim();
      if (cleanJson.endsWith('```')) cleanJson = cleanJson.replace(/```/g, '').trim();
      
      const parsed = JSON.parse(cleanJson);
      
      if (!parsed.blocks || !Array.isArray(parsed.blocks)) {
        throw new Error("El JSON debe contener un arreglo 'blocks'.");
      }
      
      const validatedBlocks = parsed.blocks.map((b, i) => ({
        type: b.type || 'text',
        content: b.content || '',
        id: `ai-${Date.now()}-${i}`
      }));

      setPreviewData({ blocks: validatedBlocks });
    } catch (err) {
      setError("Error al parsear JSON. Asegúrate de copiar solo el formato JSON válido. Detalles: " + err.message);
    }
  };

  const handleImport = () => {
    onImport(previewData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#fcf9f4]/95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border-4 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(28,28,25,0.2)] w-full max-w-3xl my-8 flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b-2 border-[#1c1c19] bg-[#0f4369] text-white flex justify-between items-center flex-none">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-yellow-400" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">IMPORTADOR_CONTENIDO_IA</h3>
          </div>
          <button onClick={onClose} className="text-white hover:rotate-90 transition-transform"><X size={24} /></button>
        </div>
        
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
          <div className="space-y-4">
             <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-2">
                <span className="bg-[#1c1c19] text-white font-black text-xs px-2 py-1">PASO 1</span>
                <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">Generar y Copiar Prompt</h4>
             </div>
             
             <div className="space-y-2 p-4 bg-[#f6f3ee] border-2 border-[#1c1c19]">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">La IA desarrollará el contenido basado en este título:</p>
                <p className="text-sm font-bold uppercase text-[#0f4369]">{resourceTitle}</p>
             </div>
             
             <button 
                onClick={handleCopyPrompt}
                className={`w-full py-3 border-2 font-display font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${copied ? 'bg-green-600 text-white border-green-800' : 'bg-[#1c1c19] text-white border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'}`}
             >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'PROMPT COPIADO AL PORTAPAPELES' : 'COPIAR PROMPT DE CONTENIDO'}
             </button>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-2">
                <span className="bg-[#1c1c19] text-white font-black text-xs px-2 py-1">PASO 2</span>
                <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">Pegar y Validar Resultado</h4>
             </div>
             
             <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#72777f]">Pega el JSON generado por la IA aquí:</label>
                <textarea 
                  value={jsonInput}
                  onChange={e => { setJsonInput(e.target.value); setPreviewData(null); setError(null); }}
                  placeholder="{ ... }"
                  className="w-full bg-[#1c1c19] text-green-400 font-mono border-2 border-[#1c1c19] p-4 text-[10px] focus:outline-none min-h-[150px] custom-scrollbar"
                />
             </div>

             {error && <div className="p-3 bg-red-100 text-red-700 text-xs font-bold uppercase border-l-4 border-red-500">{error}</div>}

             {!previewData ? (
                <button 
                  onClick={handleValidate}
                  disabled={!jsonInput.trim()}
                  className="w-full py-3 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] font-display font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#e5e2dd] disabled:opacity-50"
                >
                  <Check size={16} /> VALIDAR JSON
                </button>
             ) : (
                <div className="bg-[#f6f3ee] border-2 border-[#1c1c19] p-4 space-y-3">
                   <h5 className="text-[10px] font-black uppercase bg-[#1c1c19] text-white px-2 py-1 inline-block mb-2">VISTA_PREVIA</h5>
                   <div className="text-[10px] text-[#72777f] font-bold">Se encontraron {previewData.blocks.length} bloques de contenido.</div>
                   
                   <div className="space-y-2 mt-4 max-h-40 overflow-y-auto custom-scrollbar">
                     {previewData.blocks.map((b, i) => (
                       <div key={i} className="border border-[#1c1c19]/20 p-2 bg-white text-[9px] font-mono text-[#1c1c19]/70 line-clamp-2">
                         {b.content}
                       </div>
                     ))}
                   </div>

                   <button 
                     onClick={handleImport}
                     className="w-full mt-4 py-3 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-display font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#1c1c19] transition-colors"
                   >
                     <Save size={16} /> CONFIRMAR E INSERTAR BLOQUES
                   </button>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function AdminResourceDetailView() {
  const { resourceId } = useParams();
  const navigate = useNavigate();
  const {
    fetchResourceById,
    updateResource,
    deleteResource,
    fetchResourceBlocks,
    updateResourceBlocks,
    uploadResourceImage
  } = useResources();
  const { user, isAdmin, isBimManager } = useAuth();
  const canEdit = isAdmin || isBimManager;

  const [resource, setResource] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(true);
  const [formData, setFormData] = useState({});
  const [blocks, setBlocks] = useState([]);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [useNewEditor, setUseNewEditor] = useState(() => {
    return localStorage.getItem('global_use_new_editor') === 'true';
  });

  useEffect(() => {
    if (blocks && blocks.length > 0) {
      const hasAdvanced = blocks.some(b => 
        b.type === 'page-break' || 
        b.type === 'spacer' || 
        (b.width && b.width !== '1' && b.width !== '100%') || 
        b.padding || 
        b.margin || 
        (b.align && b.align !== 'justify' && b.align !== 'center') || 
        b.caption
      );
      if (hasAdvanced) {
        setUseNewEditor(true);
      }
    }
  }, [blocks]);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const publicUrl = await uploadResourceImage(file);
      setFormData({ ...formData, image_url: publicUrl });
    } catch (err) {
      alert("Error al subir la imagen. Inténtalo de nuevo.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const [associatedEsquemas, setAssociatedEsquemas] = useState([]);
  const [showAggregator, setShowAggregator] = useState(false);
  const [allEsquemaNodes, setAllEsquemaNodes] = useState([]);
  const [searchEsquema, setSearchEsquema] = useState('');
  const [allProtocols, setAllProtocols] = useState([]);

  useEffect(() => {
    async function loadResource() {
      const data = await fetchResourceById(resourceId);
      if (data) {
        setResource(data);
        setFormData(data);

        // Fetch blocks
        const blockData = await fetchResourceBlocks(resourceId);
        if (blockData && blockData.length > 0) {
          setBlocks(blockData);
        } else if (data.manual) {
          // Migration from old manual field
          setBlocks([{ type: 'text', content: data.manual, id: 'migrated-manual' }]);
        }

        // Fetch Associated Esquemas
        fetchAssociatedEsquemas(data.id);
      } else {
        navigate('/admin/resources');
      }
      setLoading(false);
    }
    loadResource();
  }, [resourceId, fetchResourceById, fetchResourceBlocks, navigate]);

  const fetchAssociatedEsquemas = async (resId) => {
    const { data: assocData, error } = await supabase
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

  const fetchProtocols = async () => {
    const { data } = await supabase
      .from('resources')
      .select('id, title')
      .eq('category', 'Protocolo');
    if (data) setAllProtocols(data);
  };

  const handleLinkEsquemaNode = async (node) => {
    if (associatedEsquemas.find(a => a.esquema_id === node.esquema_id && a.node_id === node.node_id)) {
      alert("This node is already associated with this resource.");
      return;
    }

    const { error } = await supabase.from('esquema_nodes_resources').insert([{
      esquema_id: node.esquema_id,
      node_id: node.node_id,
      resource_id: resource.id
    }]);

    if (!error) {
      setAssociatedEsquemas(prev => [...prev, node]);
      setSearchEsquema('');
    }
  };

  const handleUnlinkEsquemaNode = async (esquemaId, nodeId) => {
    if (!window.confirm("¿Seguro que deseas desconectar este esquema de este recurso?")) return;
    const { error } = await supabase
      .from('esquema_nodes_resources')
      .delete()
      .eq('esquema_id', esquemaId)
      .eq('node_id', nodeId)
      .eq('resource_id', resource.id);

    if (!error) {
      setAssociatedEsquemas(prev => prev.filter(a => !(a.esquema_id === esquemaId && a.node_id === nodeId)));
    }
  };

  const handleSave = async () => {
    setIsEditing(false);
    try {
      // Clean formData to match exactly the schema columns
      const schemaData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        url: formData.url,
        image_url: formData.image_url, // Hierarchy link
        manual: blocks.filter(b => b.type === 'text').map(b => b.content).join('\n\n'),
        sort_order: formData.sort_order || 0,
        published: formData.published === undefined ? true : formData.published,
        project_id: formData.project_id
      };

      const updated = await updateResource(resourceId, schemaData);
      await updateResourceBlocks(resourceId, blocks);
      setResource(updated);
    } catch (e) {
      console.error(e);
      alert("Error saving resource details.");
    }
  };

  const handleDelete = async () => {
    if (window.confirm("¿Estás seguro de que quieres borrar de forma permanente este recurso y sus dependencias?")) {
      try {
        await deleteResource(resourceId);
        navigate('/admin/resources');
      } catch (e) {
        alert("Error al borrar el recurso.");
      }
    }
  };

  const handleCancel = async () => {
    setFormData(resource);
    const blockData = await fetchResourceBlocks(resourceId);
    if (blockData && blockData.length > 0) {
      setBlocks(blockData);
    } else if (resource.manual) {
      setBlocks([{ type: 'text', content: resource.manual, id: 'migrated-manual' }]);
    } else {
      setBlocks([]);
    }
    setIsEditing(false);
  };

  if (loading) {
    return (
      <div className="flex-1 flex justify-center items-center h-full">
        <div className="font-display font-bold text-[#1c1c19] uppercase tracking-widest text-sm bg-[#f6f3ee] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] px-6 py-3 inline-block">
          ADMIN_FETCHING_DATA...
        </div>
      </div>
    );
  }

  if (!resource) return null;

  return (
    <div className="container mx-auto relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 px-4 md:px-8 pt-0">
      
      {/* STICKY TOOLBAR */}
      <div className="sticky top-0 z-50 bg-[#fcf9f4]/95 backdrop-blur-md border-b-4 border-[#1c1c19] py-4 mb-8 flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4 flex-wrap">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-xs font-display font-bold tracking-widest uppercase text-[#1c1c19] hover:bg-[#e5e2dd] transition-colors border-2 border-[#1c1c19] px-3 py-2 bg-white shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] active:translate-y-[2px]"
          >
            <ArrowLeft className="mr-2" size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Return_List</span>
            <span className="sm:hidden">Back</span>
          </button>

          <div className="h-6 w-px bg-[#1c1c19]/20" />

          {/* ID label */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-mono text-[#72777f]">ID:</span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#1c1c19] bg-[#e5e2dd] px-2 py-0.5 border border-[#1c1c19]/20">{resource.id.substring(0, 8)}</span>
          </div>

          <div className="h-6 w-px bg-[#1c1c19]/20" />

          {/* Category drop selection / display */}
          <div className="flex items-center gap-2">
            <Box size={14} className="text-[#0f4369]" />
            {isEditing ? (
              <select
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="bg-white border-2 border-[#1c1c19] px-2 py-1 text-[10px] font-display font-bold uppercase tracking-widest cursor-pointer focus:outline-none"
              >
                {RESOURCE_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            ) : (
              <span className="text-[10px] font-display font-bold text-[#0f4369] tracking-widest uppercase bg-[#0f4369]/10 px-2.5 py-1 border border-[#0f4369]/20">{resource.category}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Button */}
          <button
            type="button"
            onClick={() => window.open(`/resource/${resourceId}`, '_blank')}
            className="flex items-center gap-1.5 px-3 py-2 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-display font-bold text-[10px] uppercase tracking-widest hover:bg-[#e5e2dd] transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
            title="Ver vista pública del recurso"
          >
            <Eye size={12} />
            <span>VIEW / PREVIEW</span>
          </button>

          {/* Toggle Editor Mode Button */}
          {isEditing && (
            <div className="flex bg-[#1c1c19] p-0.5 border-2 border-[#1c1c19] self-start md:self-auto shrink-0 shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
              <button 
                type="button" 
                onClick={() => {
                  if (useNewEditor) {
                    if (window.confirm("¿Seguro que deseas volver al editor clásico? Los espaciados, layouts de columna y bloques avanzados podrían no mostrarse correctamente en la edición.")) {
                      setUseNewEditor(false);
                      localStorage.setItem('global_use_new_editor', 'false');
                    }
                  }
                }} 
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-display font-bold tracking-widest uppercase transition-all ${!useNewEditor ? 'bg-[#fcf9f4] text-[#1c1c19]' : 'text-[#f6f3ee] hover:text-[#e5e2dd]'}`}
              >
                CLÁSICO
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (!useNewEditor) {
                    setUseNewEditor(true);
                    localStorage.setItem('global_use_new_editor', 'true');
                  }
                }} 
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px] font-display font-bold tracking-widest uppercase transition-all ${useNewEditor ? 'bg-[#fcf9f4] text-[#1c1c19]' : 'text-[#f6f3ee] hover:text-[#e5e2dd]'}`}
              >
                AVANZADO ✨
              </button>
            </div>
          )}

          {/* IA Import Button */}
          {isEditing && (
            <button 
              onClick={() => setIsAiModalOpen(true)} 
              className="flex items-center gap-1.5 px-3 py-2 bg-yellow-50 text-[#1c1c19] border-2 border-[#1c1c19] font-display font-bold text-[10px] uppercase tracking-widest hover:bg-yellow-100 transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px]"
            >
              <Sparkles size={12} className="text-yellow-500" />
              <span>IA IMPORT</span>
            </button>
          )}

          {/* Delete Button */}
          {isEditing && (
            <button
              onClick={handleDelete}
              className="px-3 py-2 flex items-center gap-1.5 border-2 border-[#1c1c19] font-display text-[10px] font-bold tracking-widest uppercase transition-colors bg-[#ba1a1a] text-white hover:bg-[#1c1c19]"
            >
              <Trash2 size={12} />
              <span>DELETE</span>
            </button>
          )}

          {/* Cancel button when editing */}
          {isEditing && (
            <button
              onClick={handleCancel}
              className="px-3 py-2 flex items-center gap-1.5 border-2 border-[#1c1c19] font-display text-[10px] font-bold tracking-widest uppercase transition-colors bg-white text-[#1c1c19] hover:bg-[#e5e2dd]"
            >
              <X size={12} />
              <span>CANCEL</span>
            </button>
          )}

          {/* Save / Edit Toggle Button */}
          <button
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                setIsEditing(true);
              }
            }}
            className={`px-4 py-2 flex items-center gap-2 border-2 border-[#1c1c19] font-display text-[10px] font-bold tracking-widest uppercase transition-all shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] ${isEditing ? 'bg-[#0f4369] text-white' : 'bg-[#e5e2dd] text-[#1c1c19] hover:bg-[#1c1c19] hover:text-white'}`}
          >
            {isEditing ? (
              <><Save size={12} /> <span>Save Edits</span></>
            ) : (
              <><Edit2 size={12} /> <span>Admin Edit</span></>
            )}
          </button>
        </div>
      </div>

      <div className="w-full bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,0.2)] relative overflow-visible mb-12">

        {/* Tape annotation */}
        <div className="absolute -top-4 -right-2 sm:-right-6 bg-[#0f4369] border-2 border-[#1c1c19] text-white font-display font-bold text-[8px] sm:text-[10px] py-0.5 sm:py-1 px-4 sm:px-8 rotate-12 tracking-[0.2em] uppercase shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] z-20">
          ADMIN_RESOURCE_FILE
        </div>

        {/* Hero Image / Header Sector */}
        <div className="relative border-b-2 border-[#1c1c19]">
          <div className="h-64 sm:h-96 w-full bg-[#e5e2dd] flex items-center justify-center overflow-hidden">
            {(isEditing ? formData.image_url : resource.image_url) ? (
              <img
                src={isEditing ? formData.image_url : resource.image_url}
                alt={resource.title}
                className="w-full h-full object-cover mix-blend-multiply opacity-80"
              />
            ) : (
              <ResourcePlaceholder seed={resource.id} iconSize={64} />
            )}
          </div>
        </div>

        <div className="border-b-2 border-[#1c1c19] p-5 md:p-12 pb-6 md:pb-8 relative z-10 bg-[#f6f3ee]">
          <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4 md:mb-6 pr-12 md:pr-24">
            <Box size={14} className="text-[#0f4369] md:size-4" />
            <span className="text-[10px] md:text-xs font-display font-bold text-[#0f4369] tracking-widest uppercase bg-[#0f4369]/10 px-2 py-0.5 border border-[#0f4369]/20">{isEditing ? formData.category : resource.category}</span>
            <span className="text-[#72777f]">//</span>
            <span className="text-[10px] md:text-xs font-display font-bold text-[#1c1c19] tracking-widest uppercase">ID_{resource.id.substring(0, 6)}</span>
          </div>

          {isEditing ? (
            <input
              type="text"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-white border-2 border-[#0f4369] p-3 text-xl md:text-5xl text-[#1c1c19] tracking-wide font-display font-bold mb-4 md:mb-6 focus:outline-none uppercase leading-[1.1]"
            />
          ) : (
            <h1 className="text-xl md:text-5xl text-[#1c1c19] tracking-wide font-display font-bold mb-4 md:mb-6 max-w-4xl uppercase leading-[1.1]">
              {resource.title}
            </h1>
          )}

          {isEditing && (
            <div className="mb-8 p-6 bg-white border-2 border-[#ba1a1a] shadow-[4px_4px_0_0_rgba(186,26,26,0.1)]">
              <label className="font-display font-bold text-[10px] tracking-widest uppercase mb-4 block text-[#ba1a1a]">Background_Hero_Image_URL</label>
              <div className="flex flex-col gap-4">
                <input
                  type="text"
                  value={formData.image_url || ''}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-[#f6f3ee] border-2 border-[#1c1c19] p-3 text-sm focus:outline-none"
                />
                <div className="flex items-center gap-4">
                  <div className="h-[2px] flex-1 bg-[#1c1c19]/10"></div>
                  <span className="text-[10px] font-display font-bold uppercase tracking-widest text-[#72777f]">O SUBIR IMAGEN DESDE EL EQUIPO</span>
                  <div className="h-[2px] flex-1 bg-[#1c1c19]/10"></div>
                </div>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={isUploadingImage}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed z-10"
                  />
                  <div className={`flex items-center justify-center gap-2 border-2 border-dashed border-[#1c1c19] p-4 text-center transition-colors ${isUploadingImage ? 'bg-[#e5e2dd] text-[#72777f]' : 'bg-[#fcf9f4] hover:bg-[#e5e2dd]'}`}>
                    {isUploadingImage ? (
                      <><Loader2 size={16} className="animate-spin" /> <span className="font-display font-bold text-[10px] tracking-widest uppercase">SUBIENDO IMAGEN...</span></>
                    ) : (
                      <><ImageIcon size={16} /> <span className="font-display font-bold text-[10px] tracking-widest uppercase">CLICK AQUÍ PARA SELECCIONAR Y SUBIR IMAGEN</span></>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {isEditing ? (
            <textarea
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full h-32 bg-white border-2 border-[#0f4369] p-3 text-[#1c1c19] text-sm font-sans mb-6 md:mb-10 focus:outline-none"
            />
          ) : (
            <p className="text-[#1c1c19]/80 text-sm md:text-base tracking-wide max-w-3xl leading-relaxed font-sans mb-6 md:mb-10 border-l-2 border-[#0f4369] pl-4 md:pl-5">
              {resource.description}
            </p>
          )}

          {isEditing && (
            <div className="mb-10 p-6 bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)]">
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.published}
                    onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#0f4369]"></div>
                </div>
                <span className="text-xs font-display font-bold text-[#1c1c19] tracking-widest uppercase">Publicar Documento (Visible para Usuarios)</span>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-12 items-start">
            {/* Associated Esquemas */}
            <div className="w-full">
              <div className="flex justify-between items-center border-b-2 border-[#1c1c19] pb-3 mb-4 mt-2">
                <h3 className="text-sm font-display font-bold text-[#1c1c19] tracking-widest flex items-center uppercase">
                  <Database size={16} strokeWidth={2.5} className="mr-3 text-[#1c1c19]" />
                  Esquemas BIM Asociados
                </h3>
                <button
                  onClick={() => {
                    fetchAllNodes();
                    setShowAggregator(true);
                  }}
                  className="text-[10px] font-display font-bold uppercase tracking-widest flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#0f4369] text-[#0f4369] hover:bg-[#0f4369] hover:text-white transition-all shadow-[2px_2px_0_0_rgba(15,67,105,1)] hover:shadow-none active:translate-y-[1px]"
                >
                  <LinkIcon size={12} /> Link Schema
                </button>
              </div>

              <div className="space-y-8">
                {associatedEsquemas.length === 0 ? (
                  <div className="p-4 border-2 border-dashed border-[#d8d3cc] text-center bg-white/50">
                    <p className="text-[10px] font-display uppercase tracking-widest text-[#72777f]">No hay esquemas BIM asociados a este recurso.</p>
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
                              <Eye size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
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
                            <button
                              onClick={() => handleUnlinkEsquemaNode(assoc.esquema_id, assoc.node_id)}
                              className="bg-white border-2 border-[#ba1a1a] text-[#ba1a1a] p-1.5 opacity-0 group-hover:opacity-100 hover:bg-[#ba1a1a] hover:text-white transition-all shadow-[2px_2px_0_0_rgba(186,26,26,1)] hover:shadow-none translate-y-0 active:translate-y-0.5"
                              title="Remove association"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-col items-start bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] gap-6 p-4 md:p-6 w-full h-fit">
              {isEditing && (formData.category === 'Manual' || formData.category === 'Plantilla') && (
                <div className="w-full pb-4 border-b border-[#1c1c19]/10">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-[#0f4369] mb-2">Protocolo Maestro Asociado (Jerarquía)</label>
                  <select
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    onFocus={fetchProtocols}
                    className="w-full bg-white border-2 border-[#1c1c19] p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f4369]/20"
                  >
                    <option value="">-- NINGUNO (ES UN MAESTRO) --</option>
                    {allProtocols.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex-1 w-full">
                <span className="block text-[10px] font-display font-bold text-[#72777f] tracking-[0.2em] mb-2 uppercase flex justify-between">
                  <span>Source URL / Drive Integration</span>
                </span>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.url || ''}
                    onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                    className="w-full bg-white border-2 border-[#1c1c19] p-2 text-xs md:text-sm focus:outline-none"
                    placeholder="https://..."
                  />
                ) : (
                  resource.url ? (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 md:gap-3 text-[10px] md:text-xs font-display font-bold tracking-[0.15em] uppercase text-[#fcf9f4] bg-[#1c1c19] border-2 border-[#1c1c19] px-4 md:px-6 py-2.5 md:py-3 hover:bg-[#333] transition-colors shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] active:translate-y-[2px] active:shadow-none w-full"
                    >
                      <ExternalLink size={14} className="md:size-4" strokeWidth={2.5} />
                      Open External Resource
                    </a>
                  ) : (
                    <div className="flex items-center gap-2 text-[9px] md:text-[10px] font-display font-bold text-[#72777f] uppercase tracking-widest border-2 border-dashed border-[#d8d3cc] px-4 py-2 bg-[#fcf9f4]/50">
                      <X size={12} /> No external URL defined
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-20 mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
        <div className="flex items-center justify-center mb-12 relative max-w-4xl mx-auto w-full">
          <div className="h-[1px] flex-1 bg-[#1c1c19]/10"></div>
          <div className="mx-6 flex flex-col items-center">
            <div className="w-12 h-[1px] bg-[#ba1a1a] mb-2"></div>
            <h3 className="font-display font-bold text-[12px] text-[#1c1c19] uppercase tracking-[0.4em]">
              Resource_Manual_Documentation
            </h3>
          </div>
          <div className="h-[1px] flex-1 bg-[#1c1c19]/10"></div>
          {isEditing && (
            <button 
              onClick={() => setIsAiModalOpen(true)} 
              className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 px-3 py-1.5 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] font-display font-bold text-[10px] uppercase tracking-widest hover:bg-[#e5e2dd] transition-all"
            >
              <Sparkles size={14} className="text-yellow-500" /> IA IMPORT
            </button>
          )}
        </div>

        <div className="bg-white/40 backdrop-blur-sm py-6 md:py-12 border-x border-[#1c1c19]/5">
          <ContentBlockEditor
            blocks={blocks}
            onChange={setBlocks}
            onUploadImage={uploadResourceImage}
            isEditing={isEditing}
            useNewEditor={useNewEditor}
            setUseNewEditor={setUseNewEditor}
            hideModeSelector={true}
          />
        </div>
      </div>

      {showAggregator && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-[#fcf9f4]">
          <div className="bg-[#e5e2dd] border-b-2 border-[#1c1c19] p-4 md:p-6 sticky top-0 z-10 flex flex-col md:flex-row md:justify-between md:items-center gap-4 shadow-[0_4px_0_0_rgba(28,28,25,0.1)]">
            <div>
              <h2 className="font-display font-bold text-[#1c1c19] tracking-widest uppercase text-lg md:text-xl">BIM Schema Linker</h2>
              <p className="font-sans text-xs md:text-sm text-[#72777f] mt-1">Search and link this resource to a specific node in any BIM Schema.</p>
            </div>

            <button
              onClick={() => setShowAggregator(false)}
              className="bg-[#1c1c19] text-[#fcf9f4] w-full md:w-auto px-4 py-2 font-display font-bold tracking-widest text-[11px] uppercase border-2 border-transparent hover:bg-[#333] transition-colors"
            >
              Close Aggregator
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-7xl mx-auto w-full">
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
                          {isLinked ? 'LINKED' : 'LINK TO THIS NODE'}
                        </button>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      <BlocksAiImportModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        onImport={(data) => {
          setBlocks(prev => [...prev, ...data.blocks]);
        }} 
        resourceTitle={resource.title} 
        associatedEsquemas={associatedEsquemas}
      />
    </div>
  );
}
