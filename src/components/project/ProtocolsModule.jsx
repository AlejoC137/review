import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  FileText, Plus, Search, ChevronRight, BookOpen, 
  Code, Save, Trash2, Edit3, Eye, Download, Lock, Key, X,
  ExternalLink, FileDown, Layers, Book, ChevronDown, Sparkles, Copy, Check, Loader2, RefreshCw, Printer, Eraser
} from 'lucide-react';
import { useResources } from '../../hooks/useResources';
import ResourcePlaceholder from '../ui/ResourcePlaceholder';
import { supabase } from '../../services/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import ContentBlockEditor from '../modules/ContentBlockEditor';
import { PROMPTS } from '../../config/aiPrompts';
import { buildTreeFromFlatNodes } from '../../utils/schemaUtils';
import AiProtocolFillModal from './AiProtocolFillModal';

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

// --- SUB-COMPONENT: INLINE RESOURCE VIEWER ---
function InlineResourceViewer({ resource, fontSize = 13 }) {
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
      <div className="p-8 text-[10px] font-black uppercase tracking-widest text-[#72777f] text-center animate-pulse flex items-center justify-center gap-2">
        <Loader2 size={12} className="animate-spin text-[#0f4369]" />
        CARGANDO CONTENIDO...
      </div>
    );
  }

  if (blocks.length === 0) {
    return <div className="p-8 text-[10px] italic text-[#72777f] text-center uppercase border-t border-[#1c1c19]/10 bg-white/50">ESTE DOCUMENTO NO TIENE CONTENIDO AÚN.</div>;
  }

  return (
    <div className="bg-white px-6 py-6 border-t border-[#1c1c19]/10">
      <ContentBlockEditor
        blocks={blocks}
        onChange={() => {}}
        onUploadImage={() => {}}
        isEditing={false}
        fontSize={fontSize}
      />
    </div>
  );
}

// --- SUB-COMPONENT: AI IMPORT MODAL ---
const AiImportModal = ({ isOpen, onClose, onImport, projectId }) => {
  const [userInput, setUserInput] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    if (!userInput) {
      alert("Por favor, ingresa primero lo que necesitas.");
      return;
    }
    const masterPrompt = PROMPTS.protocolsStructure;

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
      
      if (!parsed.title || !parsed.description) {
        throw new Error("El JSON debe contener 'title' y 'description' para el protocolo.");
      }
      
      setPreviewData(parsed);
    } catch (err) {
      setError("Error al parsear JSON. Asegúrate de copiar solo el formato JSON válido. Detalles: " + err.message);
    }
  };

  const handleCreate = async () => {
    setIsImporting(true);
    try {
      await onImport(previewData);
      onClose();
    } catch (err) {
      setError("Error al importar en base de datos: " + err.message);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#fcf9f4]/95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border-4 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(28,28,25,0.2)] w-full max-w-3xl my-8 flex flex-col max-h-[90vh]">
        
        <div className="p-6 border-b-2 border-[#1c1c19] bg-[#0f4369] text-white flex justify-between items-center flex-none">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-yellow-400" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">IMPORTADOR_BIM_IA</h3>
          </div>
          <button onClick={onClose} className="text-white hover:rotate-90 transition-transform"><X size={24} /></button>
        </div>
        
        <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
          {/* PASO 1 */}
          <div className="space-y-4">
             <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-2">
                <span className="bg-[#1c1c19] text-white font-black text-xs px-2 py-1">PASO 1</span>
                <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">Configurar y Copiar Prompt</h4>
             </div>
             
             <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-[#72777f]">¿Qué protocolo necesitas estructurar?</label>
                <textarea 
                  value={userInput}
                  onChange={e => setUserInput(e.target.value)}
                  placeholder="Ej: Necesito un protocolo BIM para el diseño de un hospital..."
                  className="w-full bg-[#f6f3ee] border-2 border-[#1c1c19]  p-3 text-sm focus:outline-none min-h-[80px]"
                />
             </div>
             
             <button 
                onClick={handleCopyPrompt}
                className={`w-full py-3 border-2 font-display font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${copied ? 'bg-green-600 text-white border-green-800' : 'bg-[#1c1c19] text-white border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.2)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px]'}`}
             >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'PROMPT COPIADO AL PORTAPAPELES' : 'COPIAR PROMPT MAESTRO A IA'}
             </button>
          </div>

          {/* PASO 2 */}
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
                   <div><strong className="text-xs">{previewData.title}</strong></div>
                   <div className="text-[10px] text-[#72777f]">{previewData.description}</div>
                   
                   <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="border border-[#1c1c19]/20 p-2 bg-white">
                         <div className="text-[9px] font-black uppercase mb-1">{(previewData.manuals || []).length} MANUALES</div>
                         <ul className="text-[9px] list-disc pl-4 opacity-70">
                           {(previewData.manuals || []).slice(0,3).map((m,i) => <li key={i}>{m.title}</li>)}
                           {(previewData.manuals?.length > 3) && <li>...</li>}
                         </ul>
                      </div>
                      <div className="border border-[#1c1c19]/20 p-2 bg-white">
                         <div className="text-[9px] font-black uppercase mb-1">{(previewData.templates || []).length} PLANTILLAS</div>
                         <ul className="text-[9px] list-disc pl-4 opacity-70">
                           {(previewData.templates || []).slice(0,3).map((t,i) => <li key={i}>{t.title}</li>)}
                           {(previewData.templates?.length > 3) && <li>...</li>}
                         </ul>
                      </div>
                   </div>

                   <button 
                     onClick={handleCreate}
                     disabled={isImporting}
                     className="w-full mt-4 py-3 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-display font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#1c1c19] transition-colors disabled:opacity-50"
                   >
                     {isImporting ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                     {isImporting ? 'CREANDO...' : 'CONFIRMAR Y CREAR PROTOCOLO'}
                   </button>
                </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProtocolsModule({ project }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const resourceIdParam = searchParams.get('resourceId');
  const { user, isAdmin, isBimManager } = useAuth();
  const isUnlocked = isAdmin || isBimManager;

  const { 
    fetchProjectResources, 
    createResource, 
    updateResource, 
    deleteResource 
  } = useResources();

  const [resources, setResources] = useState([]);
  const [protocols, setProtocols] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedProtocols, setExpandedProtocols] = useState({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [bepSchemaName, setBepSchemaName] = useState(null);
  const [bepSchemaId, setBepSchemaId] = useState(null);
  
  // Creation/Edit state
  const [isCreating, setIsCreating] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isAiFillModalOpen, setIsAiFillModalOpen] = useState(false);
  const [selectedProtocolForAi, setSelectedProtocolForAi] = useState(null);

  const handleOpenAiFillModal = (protocol) => {
    setSelectedProtocolForAi(protocol);
    setIsAiFillModalOpen(true);
  };
  const [formData, setFormData] = useState({
    title: '',
    category: 'Protocolo',
    description: '',
    url: '',
    image_url: null,
    published: true,
    manual: '',
    project_id: project?.id
  });

  const loadResources = useCallback(async () => {
    if (!project?.id) return;
    setLoading(true);
    try {
      const allData = await fetchProjectResources(project.id);
      const mainProtocols = allData.filter(r => r.category === 'Protocolo');
      const protocolIds = mainProtocols.map(p => p.id);
      
      let allSubDocs = [];
      if (protocolIds.length > 0) {
          const { data: subDocs, error: subError } = await supabase
            .from('resources')
            .select('*')
            .in('image_url', protocolIds);
          
          if (!subError && subDocs) {
            allSubDocs = subDocs;
          }
      }

      setProtocols(mainProtocols);
      setResources(allSubDocs);
    } catch (err) {
      console.error('Error loading protocols:', err);
    } finally {
      setLoading(false);
    }
  }, [project?.id, fetchProjectResources]);

  const fetchBepSchemaInfo = useCallback(async () => {
    if (!project?.id) return;
    try {
      const { data: schemas } = await supabase
        .from('esquemas')
        .select('id, name')
        .eq('project', project.id)
        .limit(1);
      
      if (schemas && schemas.length > 0) {
        setBepSchemaName(schemas[0].name);
        setBepSchemaId(schemas[0].id);
      } else {
        setBepSchemaName(null);
        setBepSchemaId(null);
      }
    } catch (err) {
      console.error("Error fetching BEP schema:", err);
    }
  }, [project?.id]);

  useEffect(() => {
    loadResources();
    fetchBepSchemaInfo();
  }, [loadResources, fetchBepSchemaInfo]);

  useEffect(() => {
    if (!resourceIdParam || loading || protocols.length === 0) return;

    // 1. Is it a main protocol?
    const mainProtocol = protocols.find(p => p.id === resourceIdParam);
    if (mainProtocol) {
      setExpandedProtocols(prev => ({ ...prev, [resourceIdParam]: true }));
      setTimeout(() => {
        const element = document.getElementById(`protocol-card-${resourceIdParam}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-[#0f4369]', 'ring-offset-2', 'duration-300');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-[#0f4369]', 'ring-offset-2');
          }, 3000);
        }
      }, 300);
      return;
    }

    // 2. Is it a child item?
    const childDoc = resources.find(r => r.id === resourceIdParam);
    if (childDoc && childDoc.image_url) {
      const parentId = childDoc.image_url;
      setExpandedProtocols(prev => ({ ...prev, [parentId]: true }));
    }
  }, [resourceIdParam, protocols, resources, loading]);

  const handleAddChild = (category, parentId) => {
    setFormData({
      ...formData,
      category,
      image_url: parentId,
      project_id: project?.id
    });
    setIsCreating(true);
  };

  const toggleProtocol = (id) => {
    setExpandedProtocols(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const dataToSave = { 
        title: formData.title,
        description: formData.description,
        category: formData.category,
        url: formData.url,
        image_url: (formData.category === 'Manual' || formData.category === 'Plantilla' || formData.category === 'Requisito') ? formData.image_url : null,
        manual: formData.manual,
        published: formData.published,
        project_id: project.id,
        sort_order: 0
      };

      if ((formData.category === 'Manual' || formData.category === 'Plantilla' || formData.category === 'Requisito') && !formData.image_url) {
          alert("Debes seleccionar un Protocolo Maestro asociado.");
          return;
      }

      await createResource(dataToSave);
      setIsCreating(false);
      setFormData({
        title: '',
        category: 'Protocolo',
        description: '',
        url: '',
        image_url: null,
        published: true,
        manual: '',
        project_id: project?.id
      });
      loadResources();
    } catch (err) {
      alert("Error al crear el documento.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("¿Estás seguro de eliminar este documento y sus dependencias?")) {
      await deleteResource(id);
      loadResources();
    }
  };

  const getChildren = (parentId) => {
    return resources.filter(r => r.image_url === parentId);
  };

  const handleSyncBep = async () => {
    if (!project?.id) return;
    setIsSyncing(true);
    try {
      // 1. Fetch BEP schemas for this project
      const { data: schemas, error: schemaError } = await supabase
        .from('esquemas')
        .select('id')
        .eq('project', project.id);

      if (schemaError || !schemas || schemas.length === 0) {
        alert("No se encontró un esquema BEP asociado a este proyecto.");
        setIsSyncing(false);
        return;
      }

      // 2.5 Fetch all existing resources in the project to match by name/category
      const { data: allProjectResources, error: allResErr } = await supabase
        .from('resources')
        .select('id, title, category')
        .eq('project_id', project.id);
        
      const existingResourcesMap = {};
      if (allProjectResources) {
        allProjectResources.forEach(res => {
          const key = `${res.category?.trim()}-${res.title?.trim()}`.toLowerCase();
          existingResourcesMap[key] = res.id;
        });
      }

      let syncStats = {
        new: 0,
        linkedExisting: 0,
        updated: 0
      };

      console.log(`[Sync] Iniciando sincronización del BEP en ${schemas.length} esquemas...`);
      
      // UUID validation helper
      const isValidUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

      // Helper: link a resource to the module associated with a node (if any)
      const linkResourceToModuleIfNeeded = async (esquemaId, nodeId, resourceId) => {
        // esquema_nodes_modules.esquema_id is UUID type — skip if not a valid UUID
        if (!isValidUUID(esquemaId)) {
          return; // silently skip non-UUID schema ids
        }
        
        console.log(`[Sync]     🔍 Buscando módulo para nodo "${nodeId.substring(0,8)}" en esquema "${esquemaId.substring(0,8)}"...`);
        
        const { data: nodeModuleLinks, error: nmErr } = await supabase
          .from('esquema_nodes_modules')
          .select('module_id')
          .eq('esquema_id', esquemaId)
          .eq('node_id', nodeId);
        
        if (nmErr) {
          console.error(`[Sync Error] Error buscando módulo para nodo:`, nmErr);
          return;
        }
          
        if (!nodeModuleLinks || nodeModuleLinks.length === 0) {
          console.log(`[Sync]     ⚠️ Nodo "${nodeId.substring(0,8)}" no tiene módulo asociado.`);
          return;
        }
        
        for (const link of nodeModuleLinks) {
          console.log(`[Sync]     📦 Módulo encontrado: ${link.module_id}. Insertando en module_resources...`);
          const { error: mrErr } = await supabase
            .from('module_resources')
            .insert([{ module_id: link.module_id, resource_id: resourceId, sort_order: 0 }]);
          
          if (mrErr) {
            if (mrErr.code === '23505') {
              console.log(`[Sync]     ℹ️ Ya estaba vinculado al módulo ${link.module_id}.`);
            } else {
              console.error(`[Sync Error] Error al vincular recurso con módulo:`, mrErr);
            }
          } else {
            console.log(`[Sync]   -> ✅ Recurso vinculado al MÓDULO ${link.module_id}`);
            syncStats.linkedToModule = (syncStats.linkedToModule || 0) + 1;
          }
        }
      };

      // Process all schemas for the project
      for (const esquema of schemas) {
        const { data: nodes, error: nodesErr } = await supabase
          .from('esquema_nodes')
          .select('*')
          .eq('esquema_id', esquema.id);

        if (nodesErr || !nodes || nodes.length === 0) {
          console.warn(`[Sync] No se encontraron nodos en esquema_nodes para el esquema ${esquema.id}, se omite.`);
          continue;
        }

        const mapData = buildTreeFromFlatNodes(nodes);
        if (!mapData || !mapData.children || mapData.children.length === 0) {
          console.warn(`[Sync] El esquema ${esquema.id} está vacío, se omite.`);
          continue;
        }

        // Fetch existing node-resource links for THIS schema
        const { data: existingLinks } = await supabase
          .from('esquema_nodes_resources')
          .select('node_id, resource_id')
          .eq('esquema_id', esquema.id);

        const nodeToResource = {};
        if (existingLinks) {
          existingLinks.forEach(link => {
            nodeToResource[link.node_id] = link.resource_id;
          });
        }

        const processNodeAsync = async (node, parentProtocolId) => {
          let nextProtocolId = parentProtocolId;

          if (node.category === 'Protocolo' || node.category === 'Manual' || node.category === 'Plantilla' || node.category === 'Requisito') {
            console.log(`[Sync] Esquema ${esquema.id.substring(0,8)} - Procesando nodo: "${node.name}" (${node.category})`);
            
            const resourceData = {
              title: node.name?.trim(),
              description: node.description || '',
              category: node.category,
              url: node.externalLinks?.[0]?.url || '',
              published: true,
              project_id: project.id,
              sort_order: 0
            };

            if (node.category === 'Manual' || node.category === 'Plantilla') {
               resourceData.image_url = parentProtocolId;
            }

            let existingResourceId = nodeToResource[node.id];

            // If not linked to node yet, try matching by name+category from existing resources
            if (!existingResourceId) {
               const key = `${node.category?.trim()}-${node.name?.trim()}`.toLowerCase();
               if (existingResourcesMap[key]) {
                  existingResourceId = existingResourcesMap[key];
                  console.log(`[Sync]   -> Recurso existente encontrado por nombre: "${node.name}". Vinculando...`);
                  
                  const { error: linkErr } = await supabase.from('esquema_nodes_resources').insert([{
                     esquema_id: esquema.id,
                     node_id: node.id,
                     resource_id: existingResourceId
                  }]);
                  
                  if (!linkErr) {
                     // Set Direct recurso_id on the node row in the DB
                     await supabase.from('esquema_nodes').update({ recurso_id: existingResourceId }).eq('id', node.id);
                     
                     nodeToResource[node.id] = existingResourceId;
                     syncStats.linkedExisting++;
                     // Also link to module
                     await linkResourceToModuleIfNeeded(esquema.id, node.id, existingResourceId);
                  } else {
                     console.error(`[Sync Error]`, linkErr);
                  }
               }
            } else {
               // Already linked to node in esquema_nodes_resources. Ensure direct recurso_id is in sync
               await supabase.from('esquema_nodes').update({ recurso_id: existingResourceId }).eq('id', node.id);
               // Already linked to node, but make sure it's also in module_resources
               await linkResourceToModuleIfNeeded(esquema.id, node.id, existingResourceId);
            }

            if (existingResourceId) {
               // Update existing resource metadata
               const updateData = { ...resourceData };
               if (!updateData.url) delete updateData.url;
               const { error: updErr } = await supabase.from('resources').update(updateData).eq('id', existingResourceId);
               if (updErr) console.error(`[Sync Error] Error al actualizar recurso:`, updErr);
               else syncStats.updated++;
               
               if (node.category === 'Protocolo') nextProtocolId = existingResourceId;

            } else {
               // Create brand new resource
               console.log(`[Sync]   -> Creando nuevo ${node.category}...`);
               const { data: newRes, error: insErr } = await supabase
                 .from('resources')
                 .insert([resourceData])
                 .select()
                 .single();
                 
               if (insErr) {
                  console.error(`[Sync Error] Error al crear recurso:`, insErr);
               } else if (newRes) {
                  // 1. Link to the schema node
                  const { error: linkErr } = await supabase.from('esquema_nodes_resources').insert([{
                     esquema_id: esquema.id,
                     node_id: node.id,
                     resource_id: newRes.id
                  }]);
                  if (linkErr) console.error(`[Sync Error] Error al vincular recurso con nodo:`, linkErr);
                  else {
                     // Set Direct recurso_id on the node row in the DB
                     await supabase.from('esquema_nodes').update({ recurso_id: newRes.id }).eq('id', node.id);
                     
                     syncStats.new++;
                     // 2. Also link to the module if node has one
                     await linkResourceToModuleIfNeeded(esquema.id, node.id, newRes.id);
                  }

                  const key = `${node.category?.trim()}-${node.name?.trim()}`.toLowerCase();
                  existingResourcesMap[key] = newRes.id;
                  if (node.category === 'Protocolo') nextProtocolId = newRes.id;
               }
            }
          }

          if (node.children && node.children.length > 0) {
             for (const child of node.children) {
                await processNodeAsync(child, nextProtocolId);
             }
          }
        };

        await processNodeAsync(mapData, null);
      }
      
      console.log(`\n=========================================`);
      console.log(`[Sync] ¡Sincronización finalizada con éxito!`);
      console.log(`[Sync] RESUMEN DE CONEXIONES:`);
      console.log(`[Sync] - Nuevos documentos creados y conectados al esquema: ${syncStats.new}`);
      console.log(`[Sync] - Documentos EXISTENTES que fueron conectados al esquema: ${syncStats.linkedExisting}`);
      console.log(`[Sync] - Documentos que ya estaban conectados y fueron actualizados: ${syncStats.updated}`);
      console.log(`=========================================\n`);

      alert("¡Estructura del BEP sincronizada con éxito basándose en las etiquetas!");
      loadResources();
    } catch (err) {
      console.error("Error syncing BEP:", err);
      alert("Ocurrió un error al sincronizar el BEP.");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetBepDocs = async () => {
    if (!window.confirm("⚠️ ¿Estás seguro de que quieres ELIMINAR TODOS LOS PROTOCOLOS, MANUALES Y PLANTILLAS de este proyecto y limpiar las vinculaciones? Esta acción NO se puede deshacer.")) {
       return;
    }
    
    setIsSyncing(true);
    try {
       // 1. Borrar todas las vinculaciones de esquema_nodes_resources de los esquemas del proyecto
       const { data: schemas } = await supabase.from('esquemas').select('id').eq('project', project.id);
       if (schemas && schemas.length > 0) {
          const schemaIds = schemas.map(s => s.id);
          await supabase.from('esquema_nodes_resources').delete().in('esquema_id', schemaIds);
       }
       
       // 2. Borrar todos los recursos del proyecto que sean BEP docs
       await supabase.from('resources')
          .delete()
          .eq('project_id', project.id)
          .in('category', ['Protocolo', 'Manual', 'Plantilla', 'protocolo', 'manual', 'plantilla']);
          
       alert("¡Limpieza completa! Todos los protocolos han sido eliminados y los nodos desvinculados. Ahora puedes importar de nuevo.");
       loadResources();
    } catch (e) {
       console.error("Error reseteando:", e);
       alert("Error al limpiar: " + e.message);
    } finally {
       setIsSyncing(false);
    }
  };

  const handleAiImport = async (data) => {
    // 1. Crear el protocolo padre directamente en Supabase para asegurar obtener el ID
    const protocolData = {
        title: data.title,
        description: data.description || '',
        category: 'Protocolo',
        url: '',
        published: true,
        project_id: project.id,
        sort_order: 0
    };

    const { data: protoRes, error: protoErr } = await supabase
      .from('resources')
      .insert([protocolData])
      .select()
      .single();
      
    if (protoErr) throw protoErr;

    const protocolId = protoRes.id;
    const childInserts = [];
    
    if (data.manuals && Array.isArray(data.manuals)) {
      data.manuals.forEach(m => {
         childInserts.push({
            title: m.title,
            description: m.description || '',
            category: 'Manual',
            url: '',
            image_url: protocolId,
            published: true,
            project_id: project.id,
            sort_order: 0
         });
      });
    }

    if (data.templates && Array.isArray(data.templates)) {
      data.templates.forEach(t => {
         childInserts.push({
            title: t.title,
            url: t.url || '',
            description: t.description || '',
            category: 'Plantilla',
            image_url: protocolId,
            published: true,
            project_id: project.id,
            sort_order: 0
         });
      });
    }

    if (childInserts.length > 0) {
       const { error: childErr } = await supabase.from('resources').insert(childInserts);
       if (childErr) throw childErr;
    }

    loadResources();
  };

  const handleClearProtocolContent = async (protocol, protocolChildren) => {
    if (!window.confirm("⚠️ ¿Estás seguro de que quieres VACIAR el contenido de este protocolo y de sus manuales asociados? Esto borrará todos los textos, pero mantendrá la estructura de documentos (los manuales y plantillas seguirán existiendo).")) {
       return;
    }
    
    setLoading(true);
    try {
       // 1. Clear main protocol resource manual field
       const { error: mainErr } = await supabase
          .from('resources')
          .update({ manual: '' })
          .eq('id', protocol.id);
          
       if (mainErr) throw mainErr;
       
       // 2. Delete content blocks of the main protocol
       await supabase
          .from('resource_content_blocks')
          .delete()
          .eq('resource_id', protocol.id);
          
       // 3. Find child manuals
       const childManuals = protocolChildren.filter(c => c.category === 'Manual');
       const childManualIds = childManuals.map(m => m.id);
       
       if (childManualIds.length > 0) {
          // 4. Clear child manuals manual fields
          const { error: childErr } = await supabase
             .from('resources')
             .update({ manual: '' })
             .in('id', childManualIds);
             
          if (childErr) throw childErr;
          
          // 5. Delete content blocks of all child manuals
          await supabase
             .from('resource_content_blocks')
             .delete()
             .in('resource_id', childManualIds);
       }
       
       alert("¡Contenido vaciado con éxito! La estructura se ha conservado.");
       loadResources();
    } catch (e) {
       console.error("Error clearing content:", e);
       alert("Error al vaciar contenido: " + e.message);
    } finally {
       setLoading(false);
    }
  };

  const filteredProtocols = protocols.filter(p => 
    p.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && resources.length === 0) {
    return (
      <div className="flex-1 flex justify-center items-center h-full bg-white">
        <div className="font-display font-bold text-[#1c1c19] uppercase tracking-widest text-sm bg-[#f6f3ee] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] px-6 py-3">
          FETCHING_HIERARCHY...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#fcf9f4] overflow-hidden">
      <div className="flex-none p-6 border-b-2 border-[#1c1c19] bg-white flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#0f4369] border-2 border-[#1c1c19] flex items-center justify-center text-white">
            <Layers size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black italic uppercase tracking-tighter">PROTOCOLOS_MAESTROS</h2>
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-bold text-[#72777f] uppercase tracking-widest">Gestión Jerárquica de Documentación</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto">
          {isUnlocked && (
            <div className="flex flex-col items-center gap-1">
              <div className="flex gap-2">
                <button 
                  onClick={handleSyncBep}
                  disabled={isSyncing || !bepSchemaName}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-display font-bold text-[10px] uppercase tracking-widest hover:bg-[#1c1c19] transition-all disabled:opacity-50"
                >
                  {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} 
                  {isSyncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR'}
                </button>
                <button
                  onClick={handleResetBepDocs}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-3 py-2 bg-white text-[#ba1a1a] border-2 border-[#ba1a1a] font-display font-bold text-[10px] uppercase tracking-widest hover:bg-[#ba1a1a] hover:text-white transition-all disabled:opacity-50"
                  title="Eliminar todos los protocolos y vinculaciones"
                >
                  <Trash2 size={14} /> LIMPIAR
                </button>
              </div>
              {bepSchemaName ? (
                <div className="flex items-center gap-1">
                  <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[#0f4369]">
                    BEP: {bepSchemaName}
                  </span>
                  <button 
                    onClick={() => navigate(`/esquemas/${bepSchemaId}?projectId=${project.id}`)}
                    className="p-0.5 bg-[#f6f3ee] border border-[#1c1c19] text-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"
                    title="Ver Esquema"
                  >
                    <ExternalLink size={8} />
                  </button>
                </div>
              ) : (
                <span className="text-[7px] font-black uppercase tracking-[0.2em] text-[#e62020]">
                  NO CONECTADO
                </span>
              )}
            </div>
          )}
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72777f]" />
            <input 
              type="text" 
              placeholder="FILTRAR_PROTOCOLOS..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#1c1c19] text-[10px] font-mono uppercase focus:outline-none shadow-[2px_2px_0_0_rgba(28,28,25,0.1)]"
            />
          </div>
          {isUnlocked && (
            <div className="flex gap-2">
              <button 
                onClick={() => setIsAiModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] font-display font-bold text-[10px] uppercase tracking-widest hover:bg-[#e5e2dd] transition-all"
              >
                <Sparkles size={14} className="text-yellow-500" /> IA IMPORT
              </button>
              <button 
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-display font-bold text-[10px] uppercase tracking-widest shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <Plus size={14} /> NUEVO_DOC
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

        {filteredProtocols.length === 0 ? (
           <div className="py-20 border-2 border-dashed border-[#d8d3cc] text-center">
             <div className="text-[12px] font-black text-[#72777f] uppercase tracking-[0.3em] mb-2">No hay protocolos maestros configurados</div>
             <p className="text-[10px] text-[#72777f] uppercase italic">Crea un protocolo para comenzar a asociar manuales y plantillas.</p>
           </div>
        ) : (
          <div className="space-y-6">
            {filteredProtocols.map(protocol => (
              <ProtocolGroup 
                key={protocol.id} 
                protocol={protocol} 
                children={getChildren(protocol.id)}
                isExpanded={expandedProtocols[protocol.id]}
                onToggle={() => toggleProtocol(protocol.id)}
                onNavigate={() => navigate(`/admin/resourceEdit/${protocol.id}`)}
                onDelete={handleDelete}
                isUnlocked={isUnlocked}
                onAddChild={handleAddChild}
                highlightResourceId={resourceIdParam}
                isBimManager={isBimManager}
                onOpenAiFill={handleOpenAiFillModal}
                onClearContent={handleClearProtocolContent}
              />
            ))}
          </div>
        )}
      </div>

      {isCreating && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#fcf9f4]/95 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white border-4 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(28,28,25,0.2)] w-full max-w-2xl my-8">
            <div className="p-6 border-b-2 border-[#1c1c19] bg-[#0f4369] text-white flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Plus size={24} />
                <h3 className="text-xl font-black italic uppercase tracking-tighter">REGISTRAR_DOC_JERÁRQUICO</h3>
              </div>
              <button onClick={() => setIsCreating(false)} className="text-white hover:rotate-90 transition-transform"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleCreate} className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2">Título del Documento</label>
                <input 
                  required
                  type="text" 
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full bg-[#f6f3ee] border-2 border-[#1c1c19] p-3 text-sm focus:outline-none uppercase font-bold"
                  placeholder="TITULO_DEL_DOCUMENTO"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest mb-2">Categoría Técnica</label>
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-[#f6f3ee] border-2 border-[#1c1c19] p-3 text-sm focus:outline-none font-bold"
                >
                  <option value="Protocolo">Protocolo (Maestro)</option>
                  <option value="Manual">Manual (Secundario)</option>
                  <option value="Plantilla">Plantilla (Enlace)</option>
                  <option value="Requisito">Requisito (Normativo)</option>
                </select>
              </div>

              {formData.category !== 'Protocolo' && (
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2">Protocolo Maestro Asociado</label>
                  <select 
                    required
                    value={formData.image_url || ''}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="w-full bg-white border-2 border-[#ba1a1a] p-3 text-sm focus:outline-none font-bold text-[#ba1a1a]"
                  >
                    <option value="">-- SELECCIONAR PADRE --</option>
                    {protocols.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}

              {formData.category === 'Plantilla' && (
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest mb-2">URL del Recurso / Enlace Drive</label>
                  <input 
                    required
                    type="text" 
                    value={formData.url || ''}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className="w-full bg-[#f6f3ee] border-2 border-[#1c1c19] p-3 text-sm focus:outline-none"
                    placeholder="https://drive.google.com/..."
                  />
                </div>
              )}

              <div className="md:col-span-2 mt-4">
                <button 
                  type="submit"
                  className="w-full bg-[#1c1c19] text-white py-4 border-2 border-[#1c1c19] font-display font-bold text-[12px] uppercase tracking-[0.3em] shadow-[8px_8px_0_0_rgba(15,67,105,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center gap-3"
                >
                  <Save size={18} /> GUARDAR_EN_HIERARCHY
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <AiImportModal 
        isOpen={isAiModalOpen} 
        onClose={() => setIsAiModalOpen(false)} 
        onImport={handleAiImport}
        projectId={project?.id}
      />

      <AiProtocolFillModal 
        isOpen={isAiFillModalOpen} 
        onClose={() => setIsAiFillModalOpen(false)} 
        protocol={selectedProtocolForAi}
        project={project}
        onComplete={loadResources}
      />
    </div>
  );
}

function ProtocolGroup({ protocol, children, isExpanded, onToggle, onNavigate, onDelete, isUnlocked, onAddChild, highlightResourceId, isBimManager, onOpenAiFill, onClearContent }) {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState({});
  const toggleItem = (id) => setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));

  const manuals = children.filter(c => c.category === 'Manual');
  const templates = children.filter(c => c.category === 'Plantilla');
  const requirements = children.filter(c => c.category === 'Requisito' || c.category === 'requisito');
  const hasRequirements = requirements.length > 0;
  const showFullProtocolActions = isBimManager;

  useEffect(() => {
    if (!highlightResourceId) return;
    const hasChild = children.some(c => c.id === highlightResourceId);
    if (hasChild && isExpanded) {
      setExpandedItems(prev => ({ ...prev, [highlightResourceId]: true }));
      setTimeout(() => {
        const element = document.getElementById(`subdoc-card-${highlightResourceId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('ring-4', 'ring-[#0f4369]', 'duration-300');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-[#0f4369]');
          }, 3000);
        }
      }, 400);
    }
  }, [highlightResourceId, isExpanded, children]);

  return (
    <div id={`protocol-card-${protocol.id}`} className="border-2 border-[#1c1c19] bg-white shadow-[6px_6px_0_0_rgba(28,28,25,0.08)] hover:shadow-[10px_10px_0_0_rgba(28,28,25,0.1)] transition-all duration-300">
      
      {/* Protocol Accordion Header */}
      <div className={`p-5 flex items-center justify-between transition-colors cursor-pointer select-none ${isExpanded ? 'bg-[#0f4369] text-white border-b-2 border-[#1c1c19]' : 'bg-white text-[#1c1c19] hover:bg-[#f6f3ee]/50'}`} onClick={onToggle}>
        <div className="flex items-center gap-4 flex-1 min-w-0">
          <div className={`w-12 h-12 border-2 flex items-center justify-center shrink-0 ${isExpanded ? 'bg-white text-[#0f4369] border-white' : 'bg-[#f6f3ee] text-[#1c1c19] border-[#1c1c19]'}`}>
            <BookOpen size={24} />
          </div>
          <div className="min-w-0">
            <h3 className="text-lg font-black italic uppercase tracking-tighter leading-tight truncate">{protocol.title}</h3>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 border ${isExpanded ? 'bg-white/10 border-white/20' : 'bg-[#1c1c19] text-white border-[#1c1c19]'}`}>
                MASTER_PROTOCOL
              </span>
              <span className="text-[9px] font-bold opacity-60 uppercase font-mono">
                {children.length} SUB_DOCUMENTOS
              </span>
              {protocol.url && (
                <span className="text-[9px] font-bold opacity-75 font-mono underline hover:text-yellow-400 flex items-center gap-1" onClick={(e) => { e.stopPropagation(); window.open(protocol.url, '_blank'); }}>
                  <ExternalLink size={10} /> DRIVE
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={() => navigate(`/resourceView/${protocol.id}`)}
            className={`p-2 border-2 transition-all ${isExpanded ? 'border-white text-white hover:bg-white hover:text-[#0f4369]' : 'border-[#1c1c19] bg-[#f6f3ee] hover:bg-[#1c1c19] hover:text-white'}`}
            title="Ver Vista Completa de Lectura"
          >
            <Eye size={14} />
          </button>

          {showFullProtocolActions && (
            <>
              <button 
                onClick={() => onOpenAiFill(protocol)}
                className={`p-2 border-2 transition-all ${isExpanded ? 'border-white text-white hover:bg-white hover:text-[#0f4369]' : 'border-[#1c1c19] bg-[#f6f3ee] hover:bg-[#1c1c19] hover:text-white'}`}
                title="Llenar con IA"
              >
                <Sparkles size={14} className="text-yellow-500 animate-pulse" />
              </button>
              
              <button 
                onClick={() => onClearContent(protocol, children)}
                className={`p-2 border-2 transition-all ${isExpanded ? 'border-white text-white hover:bg-[#ba1a1a] hover:text-white hover:border-[#ba1a1a]' : 'border-[#ba1a1a] bg-[#f6f3ee] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white'}`}
                title="Vaciar Contenido (sin borrar estructura)"
              >
                <Eraser size={14} />
              </button>
            </>
          )}

          <button 
            onClick={() => window.open(`/print/protocol/${protocol.id}`, '_blank')}
            className={`p-2 border-2 transition-all ${isExpanded ? 'border-white text-white hover:bg-white hover:text-[#0f4369]' : 'border-[#1c1c19] bg-[#f6f3ee] hover:bg-[#1c1c19] hover:text-white'}`}
            title="Imprimir Protocolo y Anexos"
          >
            <Printer size={14} />
          </button>

          {isUnlocked && showFullProtocolActions && (
            <>
              <button 
                onClick={onNavigate}
                className={`p-2 border-2 transition-all ${isExpanded ? 'border-white text-white hover:bg-white hover:text-[#0f4369]' : 'border-[#1c1c19] bg-[#f6f3ee] hover:bg-[#1c1c19] hover:text-white'}`}
                title="Editar Contenido del Protocolo"
              >
                <Edit3 size={14} />
              </button>
              <button 
                onClick={() => onDelete(protocol.id)}
                className={`p-2 border-2 transition-all ${isExpanded ? 'border-white/40 text-white/60 hover:bg-[#ba1a1a] hover:text-white hover:border-[#ba1a1a]' : 'border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white'}`}
                title="Eliminar Protocolo"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}

          <button onClick={onToggle} className={`p-1.5 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-white' : 'text-[#1c1c19]'}`}>
            <ChevronDown size={20} />
          </button>
        </div>
      </div>

      {/* Protocol Accordion Body */}
      {isExpanded && (
        <div className="bg-[#fcf9f4] p-6 animate-in slide-in-from-top-4 duration-300 space-y-8">
          
          {/* Main Content Inline Panel */}
          <div className="border-2 border-[#1c1c19] bg-white shadow-[4px_4px_0_0_rgba(28,28,25,0.05)] overflow-hidden">
             <div className="p-3 border-b border-[#1c1c19]/10 bg-[#f6f3ee] text-[9px] font-mono font-black uppercase tracking-widest text-[#72777f] flex justify-between items-center">
               <span className="flex items-center gap-2">
                 <BookOpen size={12} className="text-[#0f4369]" />
                 CONTENIDO PRINCIPAL DEL PROTOCOLO
               </span>
               <span className="text-[8px] opacity-75">VISTA PREVIA DE LECTURA</span>
             </div>
             <div className="bg-white">
               <InlineResourceViewer resource={protocol} fontSize={14} />
             </div>
          </div>

          {/* Children Documents Grid */}
          <div className={`grid grid-cols-1 ${hasRequirements ? 'lg:grid-cols-3' : 'lg:grid-cols-2'} gap-8`}>
            
            {/* Manuales Secundarios */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#1c1c19]/10 pb-2">
                <div className="flex items-center gap-2">
                  <Book size={14} className="text-[#0f4369]" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#1c1c19]">MANUALES_SECUNDARIOS</span>
                </div>
                {isUnlocked && (
                  <button 
                    onClick={() => onAddChild('Manual', protocol.id)}
                    className="p-1 bg-[#1c1c19] text-white hover:bg-[#0f4369] transition-colors border border-[#1c1c19]"
                    title="Añadir Manual Secundario"
                  >
                    <Plus size={10} />
                  </button>
                )}
              </div>
              {manuals.length === 0 ? (
                <p className="text-[9px] font-mono text-[#72777f] uppercase italic p-3 bg-white border border-dashed border-[#d8d3cc] text-center">No hay manuales asociados.</p>
              ) : (
                <div className="space-y-3">
                  {manuals.map(m => (
                    <div id={`subdoc-card-${m.id}`} key={m.id} className="bg-white border-2 border-[#1c1c19] overflow-hidden shadow-[2px_2px_0_0_rgba(28,28,25,0.05)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all group">
                      
                      <div 
                        className="p-3 flex justify-between items-center cursor-pointer hover:bg-[#f6f3ee]/50"
                        onClick={() => toggleItem(m.id)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 bg-[#f6f3ee] border border-[#1c1c19] text-[#1c1c19] flex items-center justify-center shrink-0">
                            <FileText size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase block truncate text-[#1c1c19] group-hover:text-[#0f4369] transition-colors">{m.title}</span>
                            <span className="text-[8px] font-mono text-[#72777f] uppercase block">
                              {estimateReadingTime(null, m.manual)} // CLICK PARA EXPANDIR
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => toggleItem(m.id)} 
                            className="p-1 bg-[#f6f3ee] border border-[#1c1c19] text-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"
                            title="Expandir contenido"
                          >
                            <ChevronDown size={12} className={`transition-transform duration-300 ${expandedItems[m.id] ? 'rotate-180' : ''}`} />
                          </button>
                          
                          <button 
                            onClick={() => navigate(`/resourceView/${m.id}`)} 
                            className="p-1 bg-[#f6f3ee] border border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"
                            title="Ver detalles completos"
                          >
                            <Eye size={12} />
                          </button>
                          
                          {isUnlocked && showFullProtocolActions && (
                            <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => navigate(`/admin/resourceEdit/${m.id}`)} className="p-1 bg-[#f6f3ee] border border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"><Edit3 size={12} /></button>
                              <button onClick={() => onDelete(m.id)} className="p-1 bg-white border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white transition-all"><Trash2 size={12} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {expandedItems[m.id] && (
                        <div className="border-t border-[#1c1c19]/10">
                           <InlineResourceViewer resource={m} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Plantillas de Descarga */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#1c1c19]/10 pb-2">
                <div className="flex items-center gap-2">
                  <FileDown size={14} className="text-[#0f4369]" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#1c1c19]">PLANTILLAS_DESCARGA</span>
                </div>
                {isUnlocked && showFullProtocolActions && (
                  <button 
                    onClick={() => onAddChild('Plantilla', protocol.id)}
                    className="p-1 bg-[#1c1c19] text-white hover:bg-[#0f4369] transition-colors border border-[#1c1c19]"
                    title="Añadir Plantilla"
                  >
                    <Plus size={10} />
                  </button>
                )}
              </div>
              {templates.length === 0 ? (
                <p className="text-[9px] font-mono text-[#72777f] uppercase italic p-3 bg-white border border-dashed border-[#d8d3cc] text-center">No hay plantillas vinculadas.</p>
              ) : (
                <div className="space-y-3">
                  {templates.map(t => (
                    <div id={`subdoc-card-${t.id}`} key={t.id} className="bg-white border-2 border-[#1c1c19] overflow-hidden shadow-[2px_2px_0_0_rgba(28,28,25,0.05)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all group">
                      
                      <div 
                        className="p-3 flex justify-between items-center cursor-pointer hover:bg-[#f6f3ee]/50"
                        onClick={() => toggleItem(t.id)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 bg-[#0f4369] border border-[#1c1c19] text-white flex items-center justify-center shrink-0">
                            <Download size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase block truncate text-[#1c1c19] group-hover:text-[#0f4369] transition-colors">{t.title}</span>
                            <span className="text-[8px] font-mono text-[#72777f] uppercase block">PLANTILLA DESCARGABLE</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => toggleItem(t.id)} 
                            className="p-1 bg-[#f6f3ee] border border-[#1c1c19] text-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"
                            title="Expandir contenido"
                          >
                            <ChevronDown size={12} className={`transition-transform duration-300 ${expandedItems[t.id] ? 'rotate-180' : ''}`} />
                          </button>

                          {t.url ? (
                            <a 
                              href={t.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="p-1 bg-[#1c1c19] text-white border border-[#1c1c19] hover:bg-[#0f4369] transition-colors"
                              title="Descargar desde Drive"
                            >
                              <Download size={12} />
                            </a>
                          ) : (
                            <span className="text-[7px] bg-red-100 border border-red-200 text-red-700 px-1 font-mono">SIN URL</span>
                          )}

                          <button 
                            onClick={() => navigate(`/resourceView/${t.id}`)} 
                            className="p-1 bg-[#f6f3ee] border border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"
                            title="Ver detalles"
                          >
                            <Eye size={12} />
                          </button>
                          
                          {isUnlocked && showFullProtocolActions && (
                            <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => navigate(`/admin/resourceEdit/${t.id}`)} className="p-1 bg-[#f6f3ee] border border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"><Edit3 size={12} /></button>
                              <button onClick={() => onDelete(t.id)} className="p-1 bg-white border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white transition-all"><Trash2 size={12} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {expandedItems[t.id] && (
                        <div className="border-t border-[#1c1c19]/10">
                           <InlineResourceViewer resource={t} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Requisitos de Información if any */}
            {hasRequirements && (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-[#1c1c19]/10 pb-2">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-[#10b981]" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#1c1c19]">REQUISITOS_ASOCIADOS</span>
                  </div>
                  {isUnlocked && showFullProtocolActions && (
                    <button 
                      onClick={() => onAddChild('Requisito', protocol.id)}
                      className="p-1 bg-[#1c1c19] text-white hover:bg-[#0f4369] transition-colors border border-[#1c1c19]"
                      title="Añadir Requisito"
                    >
                      <Plus size={10} />
                    </button>
                  )}
                </div>
                <div className="space-y-3">
                  {requirements.map(req => (
                    <div id={`subdoc-card-${req.id}`} key={req.id} className="bg-white border-2 border-[#1c1c19] border-l-4 border-l-emerald-500 overflow-hidden shadow-[2px_2px_0_0_rgba(28,28,25,0.05)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all group">
                      
                      <div 
                        className="p-3 flex justify-between items-center cursor-pointer hover:bg-[#f6f3ee]/50"
                        onClick={() => toggleItem(req.id)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                            <FileText size={14} />
                          </div>
                          <div className="min-w-0">
                            <span className="text-[10px] font-black uppercase block truncate text-[#1c1c19] group-hover:text-[#0f4369] transition-colors">{req.title}</span>
                            <span className="text-[8px] font-mono text-[#72777f] uppercase block">REQUISITO DE INFORMACION</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => toggleItem(req.id)} 
                            className="p-1 bg-[#f6f3ee] border border-[#1c1c19] text-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"
                            title="Expandir contenido"
                          >
                            <ChevronDown size={12} className={`transition-transform duration-300 ${expandedItems[req.id] ? 'rotate-180' : ''}`} />
                          </button>
                          
                          <button 
                            onClick={() => navigate(`/resourceView/${req.id}`)} 
                            className="p-1 bg-[#f6f3ee] border border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"
                            title="Ver detalles"
                          >
                            <Eye size={12} />
                          </button>
                          
                          {isUnlocked && showFullProtocolActions && (
                            <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => navigate(`/admin/resourceEdit/${req.id}`)} className="p-1 bg-[#f6f3ee] border border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all"><Edit3 size={12} /></button>
                              <button onClick={() => onDelete(req.id)} className="p-1 bg-white border border-[#ba1a1a] text-[#ba1a1a] hover:bg-[#ba1a1a] hover:text-white transition-all"><Trash2 size={12} /></button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {expandedItems[req.id] && (
                        <div className="border-t border-[#1c1c19]/10">
                           <InlineResourceViewer resource={req} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
