import React, { useState, useEffect } from 'react';
import { X, Sparkles, Copy, Check, Loader2, Save, ArrowRight } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

export default function AiProtocolFillModal({ isOpen, onClose, protocol, project, onComplete }) {
  const [loadingContext, setLoadingContext] = useState(false);
  const [contextData, setContextData] = useState(null);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [jsonInput, setJsonInput] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);

  useEffect(() => {
    if (isOpen && protocol && project) {
      fetchContext();
    } else {
      // Reset state on close
      setContextData(null);
      setGeneratedPrompt('');
      setJsonInput('');
      setPreviewData(null);
      setError(null);
      setCopied(false);
    }
  }, [isOpen, protocol, project]);

  const fetchContext = async () => {
    setLoadingContext(true);
    try {
      // 1. Fetch schemas for this project
      const { data: schemas, error: schemaErr } = await supabase
        .from('esquemas')
        .select('*')
        .eq('project', project.id);

      if (schemaErr) throw schemaErr;

      let schemaNodes = [];
      let activeSchema = null;
      let linkedNode = null;
      let path = [];

      if (schemas && schemas.length > 0) {
        activeSchema = schemas[0];
        const { data: nodes, error: nodesErr } = await supabase
          .from('esquema_nodes')
          .select('*')
          .eq('esquema_id', activeSchema.id);
        
        if (nodesErr) throw nodesErr;
        if (nodes) {
          schemaNodes = nodes;
        }

        // Find node linked to this protocol
        const { data: links, error: linkErr } = await supabase
          .from('esquema_nodes_resources')
          .select('node_id')
          .eq('resource_id', protocol.id)
          .eq('esquema_id', activeSchema.id);

        if (linkErr) throw linkErr;

        if (links && links.length > 0) {
          const nodeId = links[0].node_id;
          linkedNode = schemaNodes.find(n => n.id === nodeId);

          // Build path from root to this node
          if (linkedNode) {
            let curr = linkedNode;
            while (curr) {
              path.unshift(curr);
              curr = schemaNodes.find(n => n.id === curr.parent_id);
            }
          }
        }
      }

      const ctx = {
        project,
        protocol,
        schema: activeSchema,
        schemaNodes,
        linkedNode,
        path
      };

      setContextData(ctx);
      setGeneratedPrompt(buildAiPrompt(ctx));
    } catch (err) {
      console.error('Error fetching context for AI Prompt:', err);
      setError('Error al cargar la información del proyecto y del esquema.');
    } finally {
      setLoadingContext(false);
    }
  };

  const buildAiPrompt = ({ project, protocol, schema, schemaNodes, linkedNode, path }) => {
    // Build path string
    const pathString = path && path.length > 0
      ? path.map(n => n.name).join(' -> ')
      : 'No definido en el esquema';

    // Build schema tree representation (Only names/network hierarchy)
    let schemaTreeString = '';
    if (schemaNodes && schemaNodes.length > 0) {
      const buildHierarchyText = (nodeId, indent = '') => {
        const node = schemaNodes.find(n => n.id === nodeId);
        if (!node) return '';
        let txt = `${indent}- ${node.name}\n`;
        const children = schemaNodes.filter(n => n.parent_id === nodeId);
        children.forEach(c => {
          txt += buildHierarchyText(c.id, indent + '  ');
        });
        return txt;
      };
      const rootNode = schemaNodes.find(n => n.is_root || !n.parent_id);
      if (rootNode) {
        schemaTreeString = buildHierarchyText(rootNode.id);
      } else {
        schemaTreeString = schemaNodes.map(n => `- ${n.name}`).join('\n');
      }
    } else {
      schemaTreeString = 'No hay esquema cargado.';
    }

    // Find siblings, parent, children of the linked node (Only names)
    let positioningContext = '';
    if (linkedNode && schemaNodes && schemaNodes.length > 0) {
      const parentNode = schemaNodes.find(n => n.id === linkedNode.parent_id);
      const siblings = schemaNodes.filter(n => n.parent_id === linkedNode.parent_id && n.id !== linkedNode.id);
      const childrenNodes = schemaNodes.filter(n => n.parent_id === linkedNode.id);

      positioningContext = `
- **Nodo actual**: "${linkedNode.name}"
- **Nodo Padre**: ${parentNode ? `"${parentNode.name}"` : 'Ninguno (es raíz)'}
- **Nodos Hermanos**: ${siblings.length > 0 ? siblings.map(s => `"${s.name}"`).join(', ') : 'Ninguno'}
- **Sub-nodos/Hijos**: ${childrenNodes.length > 0 ? childrenNodes.map(c => `"${c.name}"`).join(', ') : 'Ninguno'}
`;
    }

    return `Escribe el contenido completo en formato JSON para el protocolo "${protocol.title}" basándote en las fuentes del proyecto cargadas en tu contexto (NotebookLM).

### CONTEXTO DEL PROYECTO
- **Proyecto**: "${project.name}"
- **Breve**: "${project.description || 'Sin descripción'}"

### RED DE ESQUEMA BIM (PIB)
${schemaTreeString}

### POSICIÓN DEL PROTOCOLO EN EL ESQUEMA
- **Ruta de jerarquía**: ${pathString}
${positioningContext}

---

### INSTRUCCIONES DE GENERACIÓN (USANDO TUS FUENTES DE NOTEBOOK LM)
1. **Protocolo Maestro**: Redacta el contenido principal del protocolo en formato Markdown (mínimo 600 palabras) utilizando las fuentes del proyecto.
2. **Manuales Secundarios**: Redacta al menos 2 manuales operativos específicos derivados de este protocolo en formato Markdown (mínimo 350 palabras por manual).
3. **Paso a paso detallado**: Tanto en el Protocolo Maestro como en los Manuales, DEBES incluir instrucciones y un paso a paso MUY específico basado estrictamente en las fuentes, prestando especial atención y énfasis a la información proporcionada en las clases grabadas/transcritas.
4. **Plantillas**: Identifica al menos 2 plantillas de descarga necesarias y provee un título, descripción y URL (puede ser de Google Drive o un enlace ficticio).
5. **Eliminar citas**: No incluyas citas, referencias bibliográficas, notas al pie ni numeraciones de fuente en el texto de salida. Conserva todo el contenido y la información, pero elimina cualquier marca de cita o referencia.
6. **No uses etiquetas de cita**: No incluyas texto como [cite:...] ni otras marcas de cita en ninguna parte del contenido generado.

---

### FORMATO DE SALIDA (ESTRICTAMENTE JSON)
Tu respuesta debe ser exclusivamente un bloque JSON válido, sin textos introductorios ni bloques explicativos externos. Estructura exacta:

{
  "title": "${protocol.title}",
  "description": "Breve descripción del protocolo basada en tus fuentes.",
  "content": "Cuerpo del documento del protocolo en formato Markdown. Usa \\n para saltos de línea.",
  "manuals": [
    {
      "title": "Nombre del Manual",
      "description": "Qué cubre este manual.",
      "content": "Contenido del manual en formato Markdown. Usa \\n para saltos de línea."
    }
  ],
  "templates": [
    {
      "title": "Nombre de la Plantilla",
      "description": "Para qué sirve.",
      "url": "https://drive.google.com/..."
    }
  ]
}

Asegúrate de que el JSON sea perfectamente válido y que el Markdown esté correctamente escapado. No agregues fuentes externas ni explicaciones fuera del JSON.`;
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt).then(() => {
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
      
      if (!parsed.title || !parsed.description || !parsed.content) {
        throw new Error("El JSON debe contener 'title', 'description' y 'content' (contenido del protocolo maestro).");
      }
      
      setPreviewData(parsed);
    } catch (err) {
      setError("Error al parsear JSON. Asegúrate de copiar solo el formato JSON válido. Detalles: " + err.message);
    }
  };

  const handleCreate = async () => {
    setIsPopulating(true);
    try {
      // 1. Update the parent Protocol details
      const { error: protoErr } = await supabase
        .from('resources')
        .update({
          title: previewData.title,
          description: previewData.description,
          manual: previewData.content
        })
        .eq('id', protocol.id);

      if (protoErr) throw protoErr;

      // Update main protocol content blocks (delete & insert)
      await supabase
        .from('resource_content_blocks')
        .delete()
        .eq('resource_id', protocol.id);

      if (previewData.content) {
        await supabase
          .from('resource_content_blocks')
          .insert([{
            resource_id: protocol.id,
            type: 'text',
            content: previewData.content,
            sort_order: 0
          }]);
      }

      // 2. Delete all existing associated Manuals and Templates
      const { error: deleteErr } = await supabase
        .from('resources')
        .delete()
        .eq('image_url', protocol.id)
        .in('category', ['Manual', 'Plantilla']);

      if (deleteErr) throw deleteErr;

      // 3. Create child documents
      const childInserts = [];
      
      if (previewData.manuals && Array.isArray(previewData.manuals)) {
        previewData.manuals.forEach(m => {
          childInserts.push({
            title: m.title,
            description: m.description || '',
            category: 'Manual',
            url: '',
            image_url: protocol.id,
            published: true,
            project_id: project.id,
            manual: m.content || '',
            sort_order: 0
          });
        });
      }

      if (previewData.templates && Array.isArray(previewData.templates)) {
        previewData.templates.forEach(t => {
          childInserts.push({
            title: t.title,
            description: t.description || '',
            category: 'Plantilla',
            url: t.url || '',
            image_url: protocol.id,
            published: true,
            project_id: project.id,
            manual: '',
            sort_order: 0
          });
        });
      }

      if (childInserts.length > 0) {
        const { data: insertedDocs, error: childErr } = await supabase
          .from('resources')
          .insert(childInserts)
          .select();

        if (childErr) throw childErr;

        // 4. Create content blocks for each newly created Manual
        if (insertedDocs) {
          const blockInserts = [];
          insertedDocs.forEach(doc => {
            if (doc.category === 'Manual') {
              const matchedManual = previewData.manuals.find(m => m.title === doc.title);
              if (matchedManual && matchedManual.content) {
                blockInserts.push({
                  resource_id: doc.id,
                  type: 'text',
                  content: matchedManual.content,
                  sort_order: 0
                });
              }
            }
          });

          if (blockInserts.length > 0) {
            const { error: blockErr } = await supabase
              .from('resource_content_blocks')
              .insert(blockInserts);
            
            if (blockErr) throw blockErr;
          }
        }
      }

      if (onComplete) {
        await onComplete();
      }
      onClose();
    } catch (err) {
      console.error('Error populating protocol data:', err);
      setError("Error al guardar en base de datos: " + err.message);
    } finally {
      setIsPopulating(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#fcf9f4]/95 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white border-4 border-[#1c1c19] shadow-[16px_16px_0_0_rgba(28,28,25,0.2)] w-full max-w-4xl my-8 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b-2 border-[#1c1c19] bg-[#0f4369] text-white flex justify-between items-center flex-none">
          <div className="flex items-center gap-3">
            <Sparkles size={24} className="text-yellow-400 animate-pulse" />
            <div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">CO-PILOTO IA: LLENAR PROTOCOLO</h3>
              <p className="text-[9px] text-white/70 uppercase tracking-widest font-mono">
                {protocol?.title}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:rotate-90 transition-transform">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        {loadingContext ? (
          <div className="p-16 text-[11px] font-mono font-black uppercase tracking-widest text-[#72777f] text-center flex flex-col items-center justify-center gap-4 flex-1">
            <Loader2 size={32} className="animate-spin text-[#0f4369]" />
            Generando contexto de proyecto y esquema...
          </div>
        ) : (
          <div className="p-8 flex-1 overflow-y-auto custom-scrollbar space-y-8">
            
            {/* Step 1: Copy Context Prompt */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-2">
                <span className="bg-[#1c1c19] text-white font-black text-xs px-2 py-1">PASO 1</span>
                <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">Copiar Prompt con Contexto del Esquema</h4>
              </div>
              
              <p className="text-[10px] uppercase font-bold text-[#72777f] leading-normal font-sans">
                El siguiente prompt contiene el brief del proyecto, la estructura general del esquema del BEP y la ubicación exacta de este protocolo.
                Cópialo y úsalo en tu IA preferida para generar el JSON correspondiente.
              </p>

              <div className="relative">
                <textarea
                  readOnly
                  value={generatedPrompt}
                  className="w-full bg-[#f6f3ee] border-2 border-[#1c1c19] p-4 text-[9px] font-mono focus:outline-none min-h-[150px] max-h-[250px] custom-scrollbar"
                />
                <button
                  onClick={handleCopyPrompt}
                  className={`absolute right-3 bottom-3 px-4 py-2 border-2 font-display font-black text-[9px] uppercase tracking-widest flex items-center gap-2 transition-all ${copied ? 'bg-green-600 text-white border-green-800' : 'bg-[#1c1c19] text-white border-[#1c1c19] hover:bg-[#0f4369]'}`}
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'COPIADO' : 'COPIAR PROMPT'}
                </button>
              </div>
            </div>

            {/* Step 2: Paste and Validate Result */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b-2 border-[#1c1c19] pb-2">
                <span className="bg-[#1c1c19] text-white font-black text-xs px-2 py-1">PASO 2</span>
                <h4 className="text-sm font-black uppercase tracking-widest text-[#1c1c19]">Pegar y Validar Formato JSON</h4>
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

              {error && (
                <div className="p-3 bg-red-100 text-red-700 text-xs font-bold uppercase border-l-4 border-red-500 font-sans">
                  {error}
                </div>
              )}

              {!previewData ? (
                <button
                  onClick={handleValidate}
                  disabled={!jsonInput.trim()}
                  className="w-full py-3 bg-[#f6f3ee] text-[#1c1c19] border-2 border-[#1c1c19] font-display font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-[#e5e2dd] disabled:opacity-50 transition-colors"
                >
                  <Check size={16} /> VALIDAR JSON
                </button>
              ) : (
                <div className="bg-[#f6f3ee] border-2 border-[#1c1c19] p-6 space-y-4">
                  <h5 className="text-[10px] font-black uppercase bg-[#1c1c19] text-white px-2 py-1 inline-block">VISTA_PREVIA_DE_IMPORTACION</h5>
                  
                  <div className="border border-[#1c1c19]/10 bg-white p-3 space-y-1">
                    <div className="text-[8px] font-mono text-[#72777f] uppercase font-black">PROTOCOLO MAESTRO</div>
                    <div className="text-xs font-bold">{previewData.title}</div>
                    <div className="text-[10px] text-[#72777f] font-sans">{previewData.description}</div>
                    <div className="text-[9px] font-mono text-blue-600 bg-blue-50 border border-blue-100 p-2 mt-2 uppercase font-black">
                      ✓ Contenido del protocolo de {previewData.content?.length || 0} caracteres listo para importar.
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-[#1c1c19]/20 p-3 bg-white">
                      <div className="text-[9px] font-black uppercase mb-2 text-[#0f4369]">{ (previewData.manuals || []).length } MANUALES OPERATIVOS</div>
                      <ul className="text-[9px] list-disc pl-4 space-y-1 text-[#72777f]">
                        { (previewData.manuals || []).map((m, i) => (
                          <li key={i}>
                            <strong className="text-[#1c1c19]">{m.title}</strong> - {m.description} ({m.content?.length || 0} chars)
                          </li>
                        )) }
                      </ul>
                    </div>

                    <div className="border border-[#1c1c19]/20 p-3 bg-white">
                      <div className="text-[9px] font-black uppercase mb-2 text-[#0f4369]">{ (previewData.templates || []).length } PLANTILLAS ASOCIADAS</div>
                      <ul className="text-[9px] list-disc pl-4 space-y-1 text-[#72777f]">
                        { (previewData.templates || []).map((t, i) => (
                          <li key={i}>
                            <strong className="text-[#1c1c19]">{t.title}</strong> - {t.description} {t.url && <span className="underline italic text-blue-500">{t.url.substring(0,20)}...</span>}
                          </li>
                        )) }
                      </ul>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1c1c19]/10">
                    <button
                      onClick={handleCreate}
                      disabled={isPopulating}
                      className="w-full py-4 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-display font-black text-[11px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[#1c1c19] transition-colors shadow-[6px_6px_0_0_rgba(28,28,25,0.15)] disabled:opacity-50"
                    >
                      {isPopulating ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      {isPopulating ? 'ACTUALIZANDO PROTOCOLO...' : 'CONFIRMAR Y LLENAR TODO EL PROTOCOLO'}
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

      </div>
    </div>
  );
}
