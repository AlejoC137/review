import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit2, Check, Loader2, Bot, Copy, CheckCircle, Database, Play } from 'lucide-react';
import { projectService } from '../../services/projectService';
import { useAuth } from '../../context/AuthContext';
import { PROMPTS } from '../../config/aiPrompts';

export default function RolesModal({ isOpen, onClose, onSelectRole, projectId }) {
  const { isAdmin } = useAuth();
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showAiInput, setShowAiInput] = useState(false);
  const [jsonInput, setJsonInput] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [jsonError, setJsonError] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  
  const [form, setForm] = useState({ name: '', description: '' });

  const handleCopyPrompt = () => {
      navigator.clipboard.writeText(PROMPTS.roles);
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleJsonChange = (e) => {
      const text = e.target.value;
      setJsonInput(text);
      setJsonError(null);
      setParsedData(null);

      if (!text.trim()) return;

      try {
          const parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) {
              throw new Error('El JSON debe ser un Array [...]');
          }
          setParsedData(parsed);
      } catch (err) {
          setJsonError(err.message);
      }
  };

  const handleProcessJson = async () => {
      if (!parsedData || !Array.isArray(parsedData)) return;
      try {
          setLoading(true);
          for (const role of parsedData) {
              if (role.name) {
                  await projectService.createRole({
                    name: role.name,
                    description: role.description || '',
                    ...(projectId ? { project_id: projectId } : {})
                  });
              }
          }
          setJsonInput('');
          setParsedData(null);
          setShowAiInput(false);
          fetchRoles();
          alert("Roles importados correctamente.");
      } catch (err) {
          console.error("Error importando JSON:", err);
          alert("Error al importar roles: " + err.message);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen, projectId]);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      const data = await projectService.getRoles(projectId);
      setRoles(data || []);
    } catch (error) {
      console.error("Error fetching roles:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    try {
      if (editingId) {
        await projectService.updateRole(editingId, form);
      } else {
        // Incluir project_id en el nuevo rol
        await projectService.createRole({ ...form, ...(projectId ? { project_id: projectId } : {}) });
      }
      setForm({ name: '', description: '' });
      setIsAdding(false);
      setEditingId(null);
      fetchRoles();
    } catch (error) {
      console.error("Error saving role:", error);
      alert("Error al guardar el rol. Asegúrese de que la tabla 'roles' exista en la base de datos.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Eliminar este rol?")) return;
    try {
      await projectService.deleteRole(id);
      fetchRoles();
    } catch (error) {
      console.error("Error deleting role:", error);
    }
  };

  const startEdit = (role) => {
    setForm({ name: role.name, description: role.description || '' });
    setEditingId(role.id);
    setIsAdding(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1c1c19]/50 backdrop-blur-sm p-4">
      <div className="bg-white border-2 border-[#1c1c19] w-full max-w-2xl shadow-[8px_8px_0_0_rgba(28,28,25,1)] flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="p-4 border-b-2 border-[#1c1c19] flex justify-between items-center bg-[#f6f3ee]">
          <div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter">Catálogo de Roles</h2>
            {projectId && (
              <p className="text-[9px] font-mono uppercase text-[#0f4369] mt-0.5">
                Roles de este proyecto — <span className="font-black">{projectId.slice(0, 8)}...</span>
              </p>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white border-2 border-transparent hover:border-[#1c1c19] transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto bg-white">
          <div className="flex justify-between items-center mb-4">
            <p className="text-xs font-mono uppercase text-[#72777f]">Selecciona o administra los roles</p>
            <div className="flex gap-2">
              {isAdmin && !isAdding && (
                <button 
                  onClick={() => setShowAiInput(!showAiInput)}
                  className="flex items-center gap-2 bg-[#f6f3ee] text-[#1c1c19] px-3 py-1.5 text-xs font-bold border-2 border-[#1c1c19] hover:bg-white shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <Bot size={14} /> {showAiInput ? 'OCULTAR IA' : 'ASISTENTE IA'}
                </button>
              )}
              {!isAdding && (
                <button 
                  onClick={() => { setForm({ name: '', description: '' }); setEditingId(null); setIsAdding(true); setShowAiInput(false); }}
                  className="flex items-center gap-2 bg-[#0f4369] text-white px-3 py-1.5 text-xs font-bold border-2 border-[#1c1c19] hover:bg-[#0a2e49] shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[1px] hover:translate-y-[1px] transition-all"
                >
                  <Plus size={14} /> NUEVO ROL
                </button>
              )}
            </div>
          </div>

          {isAdmin && showAiInput && !isAdding && (
            <div className="mb-6 border-2 border-[#0f4369] shadow-[4px_4px_0_0_rgba(15,67,105,1)] flex flex-col">
              <div className="flex items-center justify-between px-3 py-2 border-b-2 border-[#0f4369] bg-[#f6f3ee]">
                <div className="flex items-center gap-3">
                  <Bot size={16} className="text-[#0f4369]" />
                  <h3 className="text-xs font-black uppercase text-[#0f4369]">Importador IA (JSON)</h3>
                </div>
                <div className="flex items-center gap-2">
                  <button
                      onClick={handleCopyPrompt}
                      className="flex items-center gap-1.5 px-2 py-1 bg-white border-2 border-[#0f4369] text-[10px] font-bold text-[#0f4369] hover:bg-[#f6f3ee] transition-colors"
                  >
                      {copyFeedback ? <CheckCircle size={12} /> : <Copy size={12} />}
                      <span>{copyFeedback ? 'COPIADO' : 'COPIAR PROMPT'}</span>
                  </button>
                  <button
                      onClick={handleProcessJson}
                      disabled={!parsedData || !!jsonError}
                      className="flex items-center gap-1.5 px-3 py-1 bg-[#0f4369] text-white border-2 border-[#0f4369] text-[10px] font-bold hover:bg-[#0a2e49] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                      <Play size={12} /> PROCESAR JSON
                  </button>
                </div>
              </div>
              <div className="relative p-0 h-32">
                <textarea
                  className="w-full h-full p-3 border-none resize-none bg-white focus:outline-none text-xs font-mono text-gray-700 leading-relaxed"
                  placeholder="Pega aquí el JSON generado por la IA..."
                  value={jsonInput}
                  onChange={handleJsonChange}
                  spellCheck={false}
                />
                <div className="absolute bottom-2 right-2 pointer-events-none flex gap-2">
                    {parsedData && <span className="bg-green-100 text-green-700 px-2 py-1 border-2 border-green-700 text-[10px] font-bold">JSON Válido ({parsedData.length})</span>}
                    {jsonError && <span className="bg-red-100 text-red-700 px-2 py-1 border-2 border-red-700 text-[10px] font-bold">Error de Sintaxis</span>}
                </div>
              </div>
            </div>
          )}

          {isAdding && (
            <div className="mb-6 p-4 bg-[#f6f3ee] border-2 border-[#1c1c19] space-y-4">
              <h3 className="text-sm font-black uppercase">{editingId ? 'Editar Rol' : 'Nuevo Rol'}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Nombre del Rol *</label>
                  <input 
                    type="text" 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    className="w-full p-2 border-2 border-[#1c1c19] text-sm font-bold focus:outline-none" 
                    placeholder="Ej. Arquitecto BIM"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-[#72777f] mb-1 block">Descripción</label>
                  <input 
                    type="text" 
                    value={form.description} 
                    onChange={e => setForm({...form, description: e.target.value})} 
                    className="w-full p-2 border-2 border-[#1c1c19] text-sm focus:outline-none" 
                    placeholder="Opcional..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setIsAdding(false)} className="px-4 py-2 border-2 border-[#1c1c19] text-xs font-bold hover:bg-white transition-all">
                  CANCELAR
                </button>
                <button onClick={handleSave} className="px-4 py-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] text-xs font-bold hover:bg-[#0a2e49] transition-all">
                  GUARDAR
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center p-8">
              <Loader2 size={32} className="animate-spin text-[#0f4369]" />
            </div>
          ) : (
            <div className="border-2 border-[#1c1c19]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#f6f3ee] border-b-2 border-[#1c1c19] text-[10px] uppercase font-black tracking-widest text-[#72777f]">
                    <th className="p-3 border-r-2 border-[#1c1c19]">Nombre</th>
                    <th className="p-3 border-r-2 border-[#1c1c19]">Descripción</th>
                    <th className="p-3 w-24 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-6 text-center text-xs font-mono uppercase text-[#72777f]">
                        No hay roles registrados
                      </td>
                    </tr>
                  ) : (
                    roles.map((role) => (
                      <tr key={role.id} className="border-b-2 border-[#1c1c19] last:border-0 hover:bg-[#f6f3ee]/50 transition-colors">
                        <td className="p-3 border-r-2 border-[#1c1c19] font-bold text-sm">
                          <button 
                            onClick={() => onSelectRole(role)}
                            className="text-[#0f4369] hover:underline flex items-center gap-2"
                            title="Seleccionar este rol"
                          >
                            <Check size={14} /> {role.name}
                          </button>
                        </td>
                        <td className="p-3 border-r-2 border-[#1c1c19] text-xs text-[#72777f]">
                          {role.description || '-'}
                        </td>
                        <td className="p-3 flex justify-center gap-2">
                          <button onClick={() => startEdit(role)} className="p-1 text-[#0f4369] hover:bg-white border-2 border-transparent hover:border-[#1c1c19] transition-all" title="Editar">
                            <Edit2 size={14} />
                          </button>
                          <button onClick={() => handleDelete(role.id)} className="p-1 text-red-600 hover:bg-white border-2 border-transparent hover:border-[#1c1c19] transition-all" title="Eliminar">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
