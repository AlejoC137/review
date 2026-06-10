import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { Layers, Plus, Trash2, Edit, Check, X, Copy, FileText } from 'lucide-react';

// Placeholder for the actual composer that will be built in Phase 3
function DocumentComposer({ documentId, documentData }) {
  return (
    <div className="flex-1 w-full h-full flex items-center justify-center bg-[#f0f2f5]">
      <div className="text-center">
        <h2 className="text-2xl font-black uppercase mb-2">Compositor de Documento</h2>
        <p className="text-[#72777f] font-mono">ID: {documentId}</p>
        <p className="text-[#72777f] font-mono">Modo de edición de grilla en construcción (Fase 3)</p>
      </div>
    </div>
  );
}

export default function DocumentComposerManager() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const projectId = searchParams.get('project');
  const activeDocId = searchParams.get('doc');

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [cloneName, setCloneName] = useState("");
  const [cloneSourceId, setCloneSourceId] = useState(""); 
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    if (user && projectId) {
      fetchDocuments();
    } else if (!projectId) {
      setLoading(false); // Can't load without project
    }
  }, [user, projectId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('admin_documents')
        .select('*')
        .eq('user_id', user.id)
        .eq('project_id', projectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Filter only compositor type or treat all as compositors for this test
      // Let's create a default one if none exist for this project
      let loadedDocs = data || [];
      
      if (loadedDocs.length === 0) {
        const defaultDoc = {
          project_id: projectId,
          user_id: user.id,
          title: "Documento Principal",
          type: "compositor",
          content: JSON.stringify({
            pages: [{ id: 'PAGE_1', left: [], center: [], right: [] }]
          })
        };
        const { data: newDocData, error: insertError } = await supabase
          .from('admin_documents')
          .insert([defaultDoc])
          .select();
          
        if (!insertError && newDocData) {
          loadedDocs = newDocData;
        }
      }

      setDocuments(loadedDocs);

      // Set active doc if not set or invalid
      if (!activeDocId || !loadedDocs.some(d => String(d.id) === activeDocId)) {
        if (loadedDocs.length > 0) {
          setSearchParams({ project: projectId, doc: loadedDocs[0].id }, { replace: true });
        }
      }
    } catch (err) {
      console.error("Error loading documents list:", err);
    } finally {
      setLoading(false);
    }
  };

  const activeDoc = documents.find(d => String(d.id) === activeDocId) || documents[0];

  const startEditName = () => {
    if (!activeDoc) return;
    setEditedName(activeDoc.title);
    setIsEditingName(true);
  };

  const saveEditedName = async () => {
    if (!editedName.trim() || !activeDoc) return;
    try {
      const { error } = await supabase
        .from("admin_documents")
        .update({ title: editedName.trim() })
        .eq("id", activeDoc.id);

      if (error) throw error;

      setDocuments(documents.map(d => d.id === activeDoc.id ? { ...d, title: editedName.trim() } : d));
      setIsEditingName(false);
    } catch (err) {
      console.error("Error updating name:", err);
      alert("Error al actualizar el nombre");
    }
  };

  const handleCloneMenu = async () => {
    if (!cloneSourceId) return;
    const sourceDoc = documents.find(d => String(d.id) === String(cloneSourceId));
    if (!sourceDoc) return;

    const finalName = cloneName.trim() || `Copia de ${sourceDoc.title}`;
    setIsCreating(true);
    try {
      const newDoc = {
        project_id: projectId,
        user_id: user.id,
        title: finalName,
        type: sourceDoc.type || "compositor",
        content: sourceDoc.content // copy the exact JSON layout
      };

      const { data, error } = await supabase
        .from("admin_documents")
        .insert([newDoc])
        .select();
        
      if (error) throw error;

      setShowCloneModal(false);
      setCloneName("");
      
      if (data && data.length > 0) {
        setSearchParams({ project: projectId, doc: data[0].id });
        await fetchDocuments();
      }
    } catch (err) {
      console.error("Error cloning document:", err);
      alert("Error al clonar");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteDoc = async () => {
    if (!activeDoc) return;
    if (documents.length <= 1) {
      alert("Debe existir al menos un documento en el proyecto.");
      return;
    }

    if (!window.confirm(`¿Estás seguro de eliminar el documento "${activeDoc.title}"?`)) {
      return;
    }

    try {
      const { error } = await supabase.from("admin_documents").delete().eq("id", activeDoc.id);
      if (error) throw error;

      const remainingDocs = documents.filter(d => d.id !== activeDoc.id);
      if (remainingDocs.length > 0) {
         setSearchParams({ project: projectId, doc: remainingDocs[0].id });
      }
      await fetchDocuments();
    } catch (err) {
      console.error("Error deleting document:", err);
      alert("Error al eliminar");
    }
  };

  if (!projectId) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center min-h-screen bg-[#fcf9f4] font-black italic uppercase text-xl">
        <div className="bg-white p-8 border-2 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)]">
          Falta el parámetro ?project= en la URL
        </div>
      </div>
    );
  }

  if (loading && documents.length === 0) {
    return (
      <div className="flex-1 w-full flex flex-col items-center justify-center min-h-screen bg-[#fcf9f4] font-mono text-sm uppercase tracking-widest animate-pulse text-[#1c1c19]">
        Cargando Gestor...
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-[#fcf9f4] relative">
      {/* Barra de Controles (Selector) - Oculta al Imprimir */}
      <div className="flex-none w-full z-[120] bg-white border-b-2 border-[#1c1c19] text-[#1c1c19] h-16 flex items-center justify-between px-6 shadow-sm print:hidden">
        
        {/* Lado Izquierdo: Título y Edición de Nombre */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="flex items-center gap-1.5 bg-[#1c1c19] text-white font-black uppercase text-[10px] tracking-widest px-3 py-1.5 border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(0,0,0,0.2)]">
            <Layers size={14} />
            <span>DOCS</span>
          </div>

          <div className="flex items-center gap-2">
            {isEditingName ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="h-8 border-2 border-[#1c1c19] font-bold text-sm bg-white px-2 py-1 max-w-[200px] shadow-[2px_2px_0_0_rgba(28,28,25,1)] outline-none"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveEditedName();
                    if (e.key === "Escape") setIsEditingName(false);
                  }}
                />
                <button onClick={saveEditedName} className="bg-green-400 hover:bg-green-500 border-2 border-[#1c1c19] p-1 shadow-[2px_2px_0_0_rgba(28,28,25,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                  <Check size={14} className="text-[#1c1c19] font-black" />
                </button>
                <button onClick={() => setIsEditingName(false)} className="bg-red-400 hover:bg-red-500 border-2 border-[#1c1c19] p-1 shadow-[2px_2px_0_0_rgba(28,28,25,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all">
                  <X size={14} className="text-[#1c1c19] font-black" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-black uppercase italic text-sm md:text-base text-[#1c1c19] max-w-[250px] truncate">
                  {activeDoc?.title || 'DOCUMENTO'}
                </span>
                <button onClick={startEditName} className="hover:bg-[#f6f3ee] p-1.5 border-2 border-transparent hover:border-[#1c1c19] transition-all text-[#1c1c19]">
                  <Edit size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Centro: Selector de Menús (Pestañas) */}
        <div className="flex-1 mx-6 flex items-center justify-start overflow-x-auto gap-3 py-2 custom-scrollbar scroll-smooth">
          {documents.map((d) => {
            const isActive = String(d.id) === String(activeDoc?.id);
            return (
              <button
                key={d.id}
                onClick={() => {
                  setSearchParams({ project: projectId, doc: d.id });
                  setIsEditingName(false);
                }}
                className={`flex items-center gap-1.5 shrink-0 px-4 py-2 border-2 border-[#1c1c19] font-black uppercase text-[10px] tracking-widest transition-all ${
                  isActive 
                    ? "bg-[#0f4369] text-white shadow-[2px_2px_0_0_rgba(28,28,25,1)] translate-x-[-1px] translate-y-[-1px]" 
                    : "bg-white text-[#1c1c19] hover:bg-[#e5e2dd] shadow-none"
                }`}
              >
                <FileText size={14} />
                <span>{d.title}</span>
              </button>
            );
          })}
        </div>

        {/* Lado Derecho: Acciones (Clonar y Eliminar) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setCloneSourceId(activeDoc?.id || (documents[0]?.id));
              setShowCloneModal(true);
            }}
            className="bg-white hover:bg-[#e5e2dd] text-[#1c1c19] border-2 border-[#1c1c19] font-black uppercase text-[10px] tracking-widest h-9 px-4 shadow-[2px_2px_0_0_rgba(28,28,25,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={3} />
            <span className="hidden sm:inline">CLONAR</span>
          </button>

          <button
            onClick={handleDeleteDoc}
            className="bg-white hover:bg-red-50 text-red-600 hover:text-red-700 border-2 border-[#1c1c19] font-black uppercase text-[10px] tracking-widest h-9 px-3 shadow-[2px_2px_0_0_rgba(28,28,25,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all flex items-center gap-1.5"
            title="Eliminar Documento"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Renderizado del Documento Elegido */}
      {activeDoc && (
        <DocumentComposer documentId={activeDoc.id} documentData={activeDoc} />
      )}

      {/* Modal Creador (Clonar) */}
      {showCloneModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white border-2 border-[#1c1c19] p-8 shadow-[16px_16px_0_0_rgba(28,28,25,1)] max-w-md w-full">
            <div className="flex justify-between items-center mb-6 border-b-2 border-[#1c1c19] pb-4">
              <h3 className="font-black text-xl uppercase italic flex items-center gap-2 text-[#1c1c19]">
                <Copy size={20} />
                <span>CLONAR DOCUMENTO</span>
              </h3>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-[#72777f] tracking-widest mb-2 block">
                  Nombre del Nuevo Documento
                </label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="ej. Especificaciones Eléctricas"
                  className="border-2 border-[#1c1c19] font-mono text-sm bg-white w-full p-3 shadow-[4px_4px_0_0_rgba(28,28,25,1)] outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-[#72777f] tracking-widest mb-2 block">
                  Copiar Estructura De:
                </label>
                <select
                  value={cloneSourceId}
                  onChange={(e) => setCloneSourceId(e.target.value)}
                  className="w-full border-2 border-[#1c1c19] font-bold bg-white p-3 text-sm shadow-[4px_4px_0_0_rgba(28,28,25,1)] outline-none"
                >
                  {documents.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex gap-4 justify-end">
                <button 
                  onClick={() => setShowCloneModal(false)} 
                  className="bg-white hover:bg-[#e5e2dd] text-[#1c1c19] border-2 border-[#1c1c19] font-black uppercase tracking-widest text-[10px] px-6 py-3 shadow-[4px_4px_0_0_rgba(28,28,25,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleCloneMenu} 
                  disabled={isCreating} 
                  className="bg-[#1c1c19] hover:bg-[#0f4369] text-white border-2 border-[#1c1c19] font-black uppercase tracking-widest text-[10px] px-6 py-3 shadow-[4px_4px_0_0_rgba(28,28,25,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all disabled:opacity-50"
                >
                  {isCreating ? "Clonando..." : "Crear Clon"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
