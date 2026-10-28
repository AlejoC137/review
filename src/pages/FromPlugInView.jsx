import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { pluginDataService } from '../services/pluginDataService';
import { supabase } from '../services/supabaseClient';
import { 
  Database, RefreshCw, Trash2, Eye, MapPin, Layers, 
  Box, Mail, FileText, Search, AlertCircle, CheckCircle, 
  Code, PaintBucket, FolderGit2, Link2, Unlink, ArrowRight,
  ExternalLink, CheckCircle2, Building, Sparkles, ChevronRight
} from 'lucide-react';
import MaterialSyncEditor from '../components/MaterialSyncEditor';

export default function FromPlugInView() {
  const navigate = useNavigate();
  const [exportsList, setExportsList] = useState([]);
  const [projectsList, setProjectsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'levels', 'categories', 'elements', 'materials', 'json'
  const [errorMsg, setErrorMsg] = useState(null);

  // Estado para el modal de asignación y adopción
  const [assignModalItem, setAssignModalItem] = useState(null);
  const [targetProjectId, setTargetProjectId] = useState('');
  const [syncOptions, setSyncOptions] = useState({
    syncGeneralInfo: true,
    syncLevels: true,
    syncRooms: true,
    syncMaterials: true
  });
  const [isAdopting, setIsAdopting] = useState(false);
  const [adoptionResult, setAdoptionResult] = useState(null);

  const fetchExports = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await pluginDataService.getAllPluginExports();
      setExportsList(data);
    } catch (err) {
      setErrorMsg(err.message || 'Error al conectar con Supabase. Verifica si ejecutaste el script SQL supabase_plugin_project_data.sql');
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description')
        .order('name', { ascending: true });
      if (error) throw error;
      setProjectsList(data || []);
    } catch (err) {
      console.warn('Error al cargar lista de proyectos:', err);
    }
  };

  useEffect(() => {
    fetchExports();
    fetchProjects();
  }, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('¿Deseas eliminar este registro de prueba?')) return;
    try {
      await pluginDataService.deleteExport(id);
      setExportsList(prev => prev.filter(item => item.id !== id));
      if (selectedItem?.id === id) setSelectedItem(null);
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  // Obtiene el proyecto asignado a un item
  const getAssignedProject = (item) => {
    const assignedId = item.project_id || item.project_info?.review_project_id;
    if (!assignedId) return null;
    const found = projectsList.find(p => p.id === assignedId);
    if (found) return found;
    return {
      id: assignedId,
      name: item.project_info?.review_project_name || 'Proyecto vinculado'
    };
  };

  // Abrir modal de asignación / adopción
  const handleOpenAssignModal = (item, e) => {
    if (e) e.stopPropagation();
    setAssignModalItem(item);
    setAdoptionResult(null);

    // Sugerir proyecto: si ya tiene uno asignado, o por coincidencia de nombre
    const assignedId = item.project_id || item.project_info?.review_project_id;
    if (assignedId) {
      setTargetProjectId(assignedId);
    } else {
      const revitName = (item.project_name || '').toLowerCase().trim();
      const matched = projectsList.find(p => {
        const pName = (p.name || '').toLowerCase().trim();
        return revitName && (pName.includes(revitName) || revitName.includes(pName));
      });
      setTargetProjectId(matched ? matched.id : (projectsList[0]?.id || ''));
    }
  };

  // Desasignar proyecto
  const handleUnassign = async (item, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`¿Desvincular esta exportación del proyecto asignado?`)) return;

    try {
      await pluginDataService.unassignProjectFromExport(item.id);
      
      // Actualizar estado local
      const updatedItem = {
        ...item,
        project_id: null,
        project_info: {
          ...(item.project_info || {}),
          review_project_id: null,
          review_project_name: null
        }
      };
      setExportsList(prev => prev.map(exp => exp.id === item.id ? updatedItem : exp));
      if (selectedItem?.id === item.id) setSelectedItem(updatedItem);
      alert('Se ha desvinculado la recepción del proyecto.');
    } catch (err) {
      alert('Error al desvincular: ' + err.message);
    }
  };

  // Ejecutar adopción de datos en el proyecto
  const handleConfirmAdoption = async () => {
    if (!targetProjectId || !assignModalItem) return;
    setIsAdopting(true);
    setAdoptionResult(null);

    const targetProject = projectsList.find(p => p.id === targetProjectId);
    const targetName = targetProject?.name || 'Proyecto';

    try {
      const result = await pluginDataService.adoptExportIntoProject(
        assignModalItem,
        targetProjectId,
        {
          ...syncOptions,
          targetProjectName: targetName
        }
      );

      setAdoptionResult({
        ...result,
        projectName: targetName,
        projectId: targetProjectId
      });

      // Actualizar lista local de exportaciones
      const updatedItem = {
        ...assignModalItem,
        project_id: targetProjectId,
        project_info: {
          ...(assignModalItem.project_info || {}),
          review_project_id: targetProjectId,
          review_project_name: targetName
        }
      };
      setExportsList(prev => prev.map(exp => exp.id === assignModalItem.id ? updatedItem : exp));
      if (selectedItem?.id === assignModalItem.id) setSelectedItem(updatedItem);
    } catch (err) {
      console.error('Error durante la adopción:', err);
      alert('Error al adoptar los datos: ' + err.message);
    } finally {
      setIsAdopting(false);
    }
  };

  const filteredItems = exportsList.filter(item => {
    const query = searchTerm.toLowerCase();
    const assigned = getAssignedProject(item);
    return (
      (item.user_email && item.user_email.toLowerCase().includes(query)) ||
      (item.project_name && item.project_name.toLowerCase().includes(query)) ||
      (item.project_number && item.project_number.toLowerCase().includes(query)) ||
      (item.project_address && item.project_address.toLowerCase().includes(query)) ||
      (assigned && assigned.name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#e5e2dd] pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#0f4369] text-white rounded-lg shadow-sm">
              <Database size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-mono text-[#1c1c19]">
                /fromPlugIn <span className="text-xs bg-[#e5e2dd] text-[#0f4369] px-2 py-0.5 rounded font-mono uppercase ml-2">Monitor Revit</span>
              </h1>
              <p className="text-xs text-[#72777f]">
                Registro de proyectos y metadata recibida desde el plugin de Revit. Asigna las recepciones a un proyecto para adoptar su información.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { fetchExports(); fetchProjects(); }}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-[#f6f3ee] hover:bg-[#e5e2dd] text-[#1c1c19] border-2 border-[#1c1c19] font-mono text-xs font-bold transition-all shadow-[2px_2px_0_0_rgba(28,28,25,0.15)] active:translate-y-[1px]"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Cargando...' : 'Actualizar Tabla'}
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="p-4 bg-red-50 border-2 border-red-500 text-red-800 rounded-md flex items-start gap-3 text-xs font-mono">
          <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
          <div>
            <span className="font-bold">Aviso de Base de Datos:</span> {errorMsg}
          </div>
        </div>
      )}

      {/* Filter and Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search size={16} className="absolute left-3 top-3 text-[#72777f]" />
          <input
            type="text"
            placeholder="Buscar por Correo, Proyecto Revit, Proyecto Review o Dirección..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border-2 border-[#1c1c19] text-xs font-mono text-[#1c1c19] focus:outline-none focus:ring-2 focus:ring-[#0f4369]"
          />
        </div>
        <div className="p-3 bg-[#f6f3ee] border-2 border-[#1c1c19] flex items-center justify-between font-mono text-xs">
          <span className="text-[#72777f]">Total Registros:</span>
          <span className="font-bold text-[#0f4369] text-sm">{exportsList.length}</span>
        </div>
        <div className="p-3 bg-[#f6f3ee] border-2 border-[#1c1c19] flex items-center justify-between font-mono text-xs">
          <span className="text-[#72777f]">Proyectos en Sistema:</span>
          <span className="font-bold text-[#1c1c19] text-sm">{projectsList.length}</span>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs font-mono text-[#72777f]">
            <RefreshCw size={24} className="animate-spin mx-auto mb-3 text-[#0f4369]" />
            Consultando registros en Supabase...
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="p-12 text-center font-mono space-y-2">
            <Box size={32} className="mx-auto text-[#72777f] opacity-50" />
            <p className="text-sm font-bold text-[#1c1c19]">No hay registros enviados desde el plugin aún</p>
            <p className="text-xs text-[#72777f]">
              Abre Revit, presiona el botón "Conectar con Supabase", ingresa tu correo y haz clic en Conectar y Guardar.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs border-collapse">
              <thead>
                <tr className="bg-[#0f4369] text-white uppercase text-[10px] tracking-wider border-b-2 border-[#1c1c19]">
                  <th className="p-3">Proyecto Revit</th>
                  <th className="p-3">Proyecto Review (Asignado)</th>
                  <th className="p-3">Usuario (Correo)</th>
                  <th className="p-3">Dirección Revit</th>
                  <th className="p-3">Niveles</th>
                  <th className="p-3">Materiales / Habitaciones</th>
                  <th className="p-3">Fecha Exportación</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e2dd]">
                {filteredItems.map((item) => {
                  const elemCount = item.elements_by_id ? Object.keys(item.elements_by_id).length : 0;
                  const levelCount = Array.isArray(item.levels) ? item.levels.length : 0;
                  const materialsCount = Array.isArray(item.materials) ? item.materials.length : 0;
                  const roomsCount = Array.isArray(item.rooms) ? item.rooms.length : (item.project_info?.rooms?.length || 0);
                  const assignedProject = getAssignedProject(item);

                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedItem(item)}
                      className={`hover:bg-[#fcf9f4] cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-[#e5f0f8]' : ''}`}
                    >
                      {/* Proyecto Revit */}
                      <td className="p-3 font-bold">
                        <div className="text-[#1c1c19] text-sm">{item.project_name || 'Sin Nombre'}</div>
                        <div className="text-[10px] text-[#72777f]"># {item.project_number || 'N/A'}</div>
                      </td>

                      {/* Proyecto Asignado en Review */}
                      <td className="p-3" onClick={e => e.stopPropagation()}>
                        {assignedProject ? (
                          <div className="flex flex-col gap-1.5 items-start">
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[#0f4369] text-white rounded text-[11px] font-bold shadow-sm max-w-[200px]">
                              <FolderGit2 size={13} className="shrink-0 text-cyan-300" />
                              <span className="truncate uppercase">{assignedProject.name}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px]">
                              <button
                                onClick={() => navigate(`/project/${assignedProject.id}?tab=datos`)}
                                className="text-[#0f4369] hover:underline flex items-center gap-0.5 font-bold"
                                title="Abrir en Review"
                              >
                                Abrir proyecto <ExternalLink size={10} />
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={(e) => handleOpenAssignModal(item, e)}
                                className="text-blue-700 hover:underline font-bold"
                                title="Re-sincronizar datos de Revit en el proyecto"
                              >
                                Re-adoptar
                              </button>
                              <span className="text-gray-300">|</span>
                              <button
                                onClick={(e) => handleUnassign(item, e)}
                                className="text-red-600 hover:underline"
                                title="Desvincular"
                              >
                                Quitar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-bold">
                              Sin asignar
                            </span>
                            <button
                              onClick={(e) => handleOpenAssignModal(item, e)}
                              className="mt-1 flex items-center gap-1 px-2.5 py-1 bg-[#1c1c19] hover:bg-[#0f4369] text-white text-[10px] font-bold transition-all shadow-[1px_1px_0_0_rgba(0,0,0,0.2)]"
                            >
                              <Link2 size={11} /> Asignar a Proyecto
                            </button>
                          </div>
                        )}
                      </td>

                      {/* Usuario (Correo) */}
                      <td className="p-3 text-[#0f4369]">
                        <div className="flex items-center gap-1.5">
                          <Mail size={13} className="shrink-0 text-[#72777f]" />
                          <span className="truncate max-w-[150px]" title={item.user_email}>{item.user_email || 'Sin correo'}</span>
                        </div>
                      </td>

                      {/* Dirección Revit */}
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-[#1c1c19]">
                          <MapPin size={13} className="shrink-0 text-red-500" />
                          <span className="truncate max-w-[160px]" title={item.project_address}>
                            {item.project_address || 'No especificada'}
                          </span>
                        </div>
                      </td>

                      {/* Niveles */}
                      <td className="p-3">
                        <span className="bg-[#f6f3ee] border border-[#1c1c19] px-2 py-0.5 text-[10px] font-bold">
                          {levelCount} Niveles
                        </span>
                      </td>

                      {/* Materiales y Habitaciones */}
                      <td className="p-3">
                        <div className="flex flex-col gap-1">
                          <span className="bg-[#e5f0f8] text-[#0f4369] border border-[#0f4369] px-1.5 py-0.5 text-[9px] font-bold inline-block w-fit">
                            {materialsCount} Materiales
                          </span>
                          {roomsCount > 0 && (
                            <span className="bg-[#f0fdf4] text-green-800 border border-green-700 px-1.5 py-0.5 text-[9px] font-bold inline-block w-fit">
                              {roomsCount} Habitaciones
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Fecha */}
                      <td className="p-3 text-[#72777f] text-[10px]">
                        {new Date(item.created_at || item.exported_at).toLocaleString()}
                      </td>

                      {/* Acciones */}
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={(e) => handleOpenAssignModal(item, e)}
                            className="p-1.5 bg-[#1c1c19] text-white hover:bg-[#0f4369] transition-colors rounded"
                            title="Asignar y Adoptar Datos en Proyecto"
                          >
                            <Link2 size={13} />
                          </button>
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-1.5 bg-[#0f4369] text-white hover:bg-[#082a43] transition-colors rounded"
                            title="Ver Detalle"
                          >
                            <Eye size={13} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors rounded"
                            title="Eliminar"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE ASIGNACIÓN Y ADOPCIÓN DE DATOS */}
      {assignModalItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fcf9f4] border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,0.3)] w-full max-w-2xl flex flex-col font-mono">
            {/* Modal Header */}
            <div className="bg-[#0f4369] text-white p-4 flex items-center justify-between border-b-2 border-[#1c1c19]">
              <div className="flex items-center gap-3">
                <FolderGit2 size={20} className="text-cyan-300" />
                <div>
                  <h3 className="font-bold text-sm uppercase">Asignar Recepción a Proyecto de Review</h3>
                  <p className="text-[10px] text-gray-200">
                    Recepción Revit: <span className="font-bold">{assignModalItem.project_name || 'Sin Nombre'}</span> (#{assignModalItem.project_number || 'N/A'})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setAssignModalItem(null); setAdoptionResult(null); }}
                className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white font-bold text-xs border border-white"
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 text-xs">
              {adoptionResult ? (
                /* REPORTE DE RESULTADO EXITOSO */
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border-2 border-green-600 text-green-900 rounded space-y-2">
                    <div className="flex items-center gap-2 font-bold text-sm text-green-800">
                      <CheckCircle2 size={18} className="text-green-600" />
                      ¡Información adoptada exitosamente en el Proyecto!
                    </div>
                    <p className="text-xs">
                      El proyecto <strong className="uppercase">{adoptionResult.projectName}</strong> ha incorporado la información exportada desde Revit.
                    </p>
                  </div>

                  {/* Detalle de lo adoptado */}
                  <div className="p-4 bg-white border-2 border-[#1c1c19] space-y-2">
                    <h4 className="font-bold text-[#0f4369] uppercase border-b pb-1">Resumen de Sincronización:</h4>
                    <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className={adoptionResult.generalInfoUpdated ? 'text-green-600' : 'text-gray-400'} />
                        <span>Info General PEB: <strong>{adoptionResult.generalInfoUpdated ? 'Actualizada' : 'Sin cambios'}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className={adoptionResult.levelsAdded > 0 || adoptionResult.levelsUpdated > 0 ? 'text-green-600' : 'text-gray-400'} />
                        <span>Niveles: <strong>+{adoptionResult.levelsAdded} nuevos / {adoptionResult.levelsUpdated} act.</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className={adoptionResult.roomsAdded > 0 ? 'text-green-600' : 'text-gray-400'} />
                        <span>Habitaciones/Áreas: <strong>+{adoptionResult.roomsAdded} registradas</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={14} className={adoptionResult.materialsAdded > 0 ? 'text-green-600' : 'text-gray-400'} />
                        <span>Materiales: <strong>+{adoptionResult.materialsAdded} agregados</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => { setAssignModalItem(null); setAdoptionResult(null); }}
                      className="px-4 py-2 border-2 border-[#1c1c19] bg-white hover:bg-gray-100 font-bold"
                    >
                      Cerrar Ventana
                    </button>
                    <button
                      onClick={() => navigate(`/project/${adoptionResult.projectId}?tab=datos`)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-[#0f4369] hover:bg-[#082a43] text-white font-bold border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(0,0,0,1)]"
                    >
                      Ir al Proyecto en Review <ExternalLink size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* FORMULARIO DE SELECCIÓN Y ADOPCIÓN */
                <div className="space-y-5">
                  {/* Selector de Proyecto */}
                  <div className="space-y-2">
                    <label className="font-bold text-[#1c1c19] block uppercase tracking-wide">
                      1. Selecciona el Proyecto Destino (de la lista de Proyectos):
                    </label>
                    <div className="relative">
                      <select
                        value={targetProjectId}
                        onChange={(e) => setTargetProjectId(e.target.value)}
                        className="w-full p-2.5 bg-white border-2 border-[#1c1c19] font-bold text-xs font-mono uppercase focus:ring-2 focus:ring-[#0f4369] focus:outline-none"
                      >
                        <option value="">-- Seleccionar Proyecto --</option>
                        {projectsList.map((proj) => (
                          <option key={proj.id} value={proj.id}>
                            {proj.name} {proj.description ? `(${proj.description.slice(0, 40)}...)` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <p className="text-[11px] text-[#72777f]">
                      Esta recepción quedará vinculada permanentemente a este proyecto en Supabase.
                    </p>
                  </div>

                  {/* Resumen de Datos que Revit enviará al Proyecto */}
                  <div className="p-3.5 bg-white border-2 border-[#1c1c19] space-y-2">
                    <h4 className="font-bold text-[#0f4369] uppercase flex items-center gap-1.5">
                      <Sparkles size={14} className="text-amber-500" />
                      Datos disponibles en esta recepción para adoptar:
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-[11px] text-[#1c1c19]">
                      <div>• Proyecto Revit: <strong>{assignModalItem.project_name || 'N/A'}</strong></div>
                      <div>• Número / Código: <strong>{assignModalItem.project_number || 'N/A'}</strong></div>
                      <div>• Niveles en modelo: <strong>{assignModalItem.levels?.length || 0} niveles</strong></div>
                      <div>• Materiales detectados: <strong>{assignModalItem.materials?.length || 0} materiales</strong></div>
                      <div className="col-span-2">• Dirección: <strong>{assignModalItem.project_address || 'No indicada'}</strong></div>
                      {assignModalItem.project_info?.rooms?.length > 0 && (
                        <div className="col-span-2">• Habitaciones / Rooms: <strong>{assignModalItem.project_info.rooms.length} recintos con área m²</strong></div>
                      )}
                    </div>
                  </div>

                  {/* Checkboxes de Adopción */}
                  <div className="space-y-2">
                    <label className="font-bold text-[#1c1c19] block uppercase tracking-wide">
                      2. Elige qué componentes debe adoptar el Proyecto:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className="flex items-center gap-2 p-2 bg-white border border-[#1c1c19] cursor-pointer hover:bg-[#f6f3ee]">
                        <input
                          type="checkbox"
                          checked={syncOptions.syncGeneralInfo}
                          onChange={(e) => setSyncOptions(prev => ({ ...prev, syncGeneralInfo: e.target.checked }))}
                          className="w-4 h-4 text-[#0f4369]"
                        />
                        <div>
                          <div className="font-bold">Info General PEB</div>
                          <div className="text-[10px] text-gray-500">Cliente, código, ubicación, áreas estimadas</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-2 bg-white border border-[#1c1c19] cursor-pointer hover:bg-[#f6f3ee]">
                        <input
                          type="checkbox"
                          checked={syncOptions.syncLevels}
                          onChange={(e) => setSyncOptions(prev => ({ ...prev, syncLevels: e.target.checked }))}
                          className="w-4 h-4 text-[#0f4369]"
                        />
                        <div>
                          <div className="font-bold">Niveles ({assignModalItem.levels?.length || 0})</div>
                          <div className="text-[10px] text-gray-500">Pisos y elevaciones a project_levels</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-2 bg-white border border-[#1c1c19] cursor-pointer hover:bg-[#f6f3ee]">
                        <input
                          type="checkbox"
                          checked={syncOptions.syncRooms}
                          onChange={(e) => setSyncOptions(prev => ({ ...prev, syncRooms: e.target.checked }))}
                          className="w-4 h-4 text-[#0f4369]"
                        />
                        <div>
                          <div className="font-bold">Habitaciones y Áreas</div>
                          <div className="text-[10px] text-gray-500">Recintos y m² por nivel</div>
                        </div>
                      </label>

                      <label className="flex items-center gap-2 p-2 bg-white border border-[#1c1c19] cursor-pointer hover:bg-[#f6f3ee]">
                        <input
                          type="checkbox"
                          checked={syncOptions.syncMaterials}
                          onChange={(e) => setSyncOptions(prev => ({ ...prev, syncMaterials: e.target.checked }))}
                          className="w-4 h-4 text-[#0f4369]"
                        />
                        <div>
                          <div className="font-bold">Materiales ({assignModalItem.materials?.length || 0})</div>
                          <div className="text-[10px] text-gray-500">Catálogo a módulo Materiales</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Botones de acción */}
                  <div className="flex items-center justify-between pt-3 border-t border-[#e5e2dd]">
                    <button
                      onClick={() => setAssignModalItem(null)}
                      disabled={isAdopting}
                      className="px-4 py-2 border-2 border-[#1c1c19] bg-white hover:bg-gray-100 font-bold"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmAdoption}
                      disabled={!targetProjectId || isAdopting}
                      className="flex items-center gap-2 px-6 py-2.5 bg-[#0f4369] hover:bg-[#082a43] text-white font-bold border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(0,0,0,1)] disabled:opacity-50 active:translate-y-[1px]"
                    >
                      {isAdopting ? (
                        <>
                          <RefreshCw size={14} className="animate-spin" />
                          Adoptando Datos en Proyecto...
                        </>
                      ) : (
                        <>
                          <Link2 size={14} />
                          Confirmar y Adoptar Datos
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Drawer / Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fcf9f4] border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,0.3)] w-full max-w-4xl max-h-[90vh] flex flex-col font-mono">
            {/* Modal Header */}
            <div className="bg-[#0f4369] text-white p-4 flex items-center justify-between border-b-2 border-[#1c1c19]">
              <div className="flex items-center gap-3">
                <Database size={20} />
                <div>
                  <h3 className="font-bold text-sm uppercase">Detalle de Recepción Plugin Revit</h3>
                  <p className="text-[10px] text-gray-200">ID: {selectedItem.id}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="px-2.5 py-1 bg-red-500 hover:bg-red-600 text-white font-bold text-xs border border-white"
              >
                ✕ Cerrar
              </button>
            </div>

            {/* Assignment Bar in Detail Modal */}
            <div className="p-3 bg-white border-b-2 border-[#1c1c19] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-[#72777f]">Proyecto Review Asignado:</span>
                {getAssignedProject(selectedItem) ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#0f4369] text-white rounded text-xs font-bold">
                    <FolderGit2 size={13} className="text-cyan-300" />
                    {getAssignedProject(selectedItem).name.toUpperCase()}
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-xs font-bold">
                    Sin Asignar
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {getAssignedProject(selectedItem) && (
                  <button
                    onClick={() => navigate(`/project/${getAssignedProject(selectedItem).id}?tab=datos`)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-[#1c1c19] text-white text-xs font-bold border border-[#1c1c19] hover:bg-gray-800"
                  >
                    Abrir Proyecto <ExternalLink size={12} />
                  </button>
                )}
                <button
                  onClick={(e) => handleOpenAssignModal(selectedItem, e)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-[#0f4369] text-white text-xs font-bold border border-[#1c1c19] hover:bg-[#082a43]"
                >
                  <Link2 size={12} />
                  {getAssignedProject(selectedItem) ? 'Re-sincronizar / Cambiar' : 'Asignar a Proyecto'}
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b-2 border-[#1c1c19] bg-[#f6f3ee] text-xs overflow-x-auto">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2.5 font-bold flex items-center gap-2 border-r border-[#1c1c19] whitespace-nowrap ${activeTab === 'summary' ? 'bg-[#0f4369] text-white' : 'text-[#72777f] hover:bg-[#e5e2dd]'}`}
              >
                <FileText size={14} /> Info General &amp; Dirección
              </button>
              <button
                onClick={() => setActiveTab('levels')}
                className={`px-4 py-2.5 font-bold flex items-center gap-2 border-r border-[#1c1c19] whitespace-nowrap ${activeTab === 'levels' ? 'bg-[#0f4369] text-white' : 'text-[#72777f] hover:bg-[#e5e2dd]'}`}
              >
                <Layers size={14} /> Niveles ({selectedItem.levels ? selectedItem.levels.length : 0})
              </button>
              <button
                onClick={() => setActiveTab('rooms')}
                className={`px-4 py-2.5 font-bold flex items-center gap-2 border-r border-[#1c1c19] whitespace-nowrap ${activeTab === 'rooms' ? 'bg-[#0f4369] text-white' : 'text-[#72777f] hover:bg-[#e5e2dd]'}`}
              >
                <Building size={14} /> Habitaciones ({selectedItem.rooms?.length || selectedItem.project_info?.rooms?.length || 0})
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-4 py-2.5 font-bold flex items-center gap-2 border-r border-[#1c1c19] whitespace-nowrap ${activeTab === 'categories' ? 'bg-[#0f4369] text-white' : 'text-[#72777f] hover:bg-[#e5e2dd]'}`}
              >
                <Box size={14} /> Categorías
              </button>
              <button
                onClick={() => setActiveTab('elements')}
                className={`px-4 py-2.5 font-bold flex items-center gap-2 border-r border-[#1c1c19] whitespace-nowrap ${activeTab === 'elements' ? 'bg-[#0f4369] text-white' : 'text-[#72777f] hover:bg-[#e5e2dd]'}`}
              >
                <Database size={14} /> Elementos ({selectedItem.elements_by_id ? Object.keys(selectedItem.elements_by_id).length : 0})
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`px-4 py-2.5 font-bold flex items-center gap-2 border-r border-[#1c1c19] whitespace-nowrap ${activeTab === 'materials' ? 'bg-[#0f4369] text-white' : 'text-[#72777f] hover:bg-[#e5e2dd]'}`}
              >
                <PaintBucket size={14} /> Materiales ({selectedItem.materials ? selectedItem.materials.length : 0})
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-4 py-2.5 font-bold flex items-center gap-2 whitespace-nowrap ${activeTab === 'json' ? 'bg-[#0f4369] text-white' : 'text-[#72777f] hover:bg-[#e5e2dd]'}`}
              >
                <Code size={14} /> JSON Crudo
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              {activeTab === 'summary' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white border-2 border-[#1c1c19] space-y-2">
                    <h4 className="font-bold text-[#0f4369] border-b pb-1">Datos del Usuario &amp; Proyecto</h4>
                    <p><span className="text-[#72777f]">Correo Enviado:</span> <strong className="text-[#1c1c19]">{selectedItem.user_email}</strong></p>
                    <p><span className="text-[#72777f]">Nombre Proyecto Revit:</span> <strong>{selectedItem.project_name || 'N/A'}</strong></p>
                    <p><span className="text-[#72777f]">Número Proyecto:</span> <strong>{selectedItem.project_number || 'N/A'}</strong></p>
                    <p><span className="text-[#72777f]">Dirección Registrada:</span> <strong>{selectedItem.project_address || 'N/A'}</strong></p>
                    <p><span className="text-[#72777f]">Fecha de Exportación:</span> <strong>{new Date(selectedItem.created_at).toLocaleString()}</strong></p>
                  </div>

                  <div className="p-4 bg-white border-2 border-[#1c1c19] space-y-2">
                    <h4 className="font-bold text-[#0f4369] border-b pb-1 flex items-center gap-1.5">
                      <MapPin size={14} className="text-red-500" /> Geolocalización (SiteLocation)
                    </h4>
                    {selectedItem.site_location ? (
                      <>
                        <p><span className="text-[#72777f]">Latitud:</span> <strong>{selectedItem.site_location.latitude?.toFixed(6) ?? 'N/A'}°</strong></p>
                        <p><span className="text-[#72777f]">Longitud:</span> <strong>{selectedItem.site_location.longitude?.toFixed(6) ?? 'N/A'}°</strong></p>
                        <p><span className="text-[#72777f]">Elevación:</span> <strong>{selectedItem.site_location.elevation_m?.toFixed(2) ?? 'N/A'} m</strong></p>
                        <p><span className="text-[#72777f]">Lugar:</span> <strong>{selectedItem.site_location.place_name || 'N/A'}</strong></p>
                      </>
                    ) : (
                      <p className="text-[#72777f]">No se incluyó geolocalización.</p>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'levels' && (
                <div className="bg-white border-2 border-[#1c1c19] p-4">
                  <h4 className="font-bold text-[#0f4369] mb-3">Niveles del Proyecto Revit</h4>
                  {Array.isArray(selectedItem.levels) && selectedItem.levels.length > 0 ? (
                    <table className="w-full text-left font-mono border-collapse">
                      <thead>
                        <tr className="bg-[#f6f3ee] border-b">
                          <th className="p-2">ID Nivel</th>
                          <th className="p-2">Nombre del Nivel</th>
                          <th className="p-2">Elevación (Metros)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem.levels.map((lvl, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2 text-[#72777f]">{lvl.id}</td>
                            <td className="p-2 font-bold">{lvl.name}</td>
                            <td className="p-2 text-[#0f4369] font-bold">
                              {typeof lvl.elevation_m === 'number' ? `${lvl.elevation_m.toFixed(2)} m` : 'N/A'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-[#72777f]">Sin información de niveles.</p>
                  )}
                </div>
              )}

              {activeTab === 'rooms' && (
                <div className="bg-white border-2 border-[#1c1c19] p-4 space-y-3">
                  <h4 className="font-bold text-[#0f4369]">Habitaciones / Recintos Extraídos de Revit</h4>
                  {(() => {
                    const rooms = Array.isArray(selectedItem.rooms) && selectedItem.rooms.length > 0
                      ? selectedItem.rooms
                      : (Array.isArray(selectedItem.project_info?.rooms) ? selectedItem.project_info.rooms : []);

                    if (!rooms || rooms.length === 0) {
                      return <p className="text-[#72777f]">No se registraron habitaciones (rooms) en esta exportación.</p>;
                    }

                    return (
                      <div className="max-h-[350px] overflow-y-auto">
                        <table className="w-full text-left font-mono text-[11px]">
                          <thead className="bg-[#f6f3ee] sticky top-0 border-b">
                            <tr>
                              <th className="p-2">#</th>
                              <th className="p-2">Nombre Habitación</th>
                              <th className="p-2">Nivel</th>
                              <th className="p-2">Área (m²)</th>
                              <th className="p-2">Volumen (m³)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {rooms.map((rm, idx) => (
                              <tr key={idx} className="hover:bg-[#fcf9f4]">
                                <td className="p-2 font-bold text-[#0f4369]">{rm.number || idx + 1}</td>
                                <td className="p-2 font-bold">{rm.name}</td>
                                <td className="p-2 text-gray-600">{rm.level || 'N/A'}</td>
                                <td className="p-2 text-[#0f4369] font-bold">{Number(rm.area_m2 || 0).toFixed(2)} m²</td>
                                <td className="p-2 text-gray-500">{rm.volume_m3 ? `${Number(rm.volume_m3).toFixed(2)} m³` : '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="bg-white border-2 border-[#1c1c19] p-4">
                  <h4 className="font-bold text-[#0f4369] mb-3">Conteo de Elementos por Categoría</h4>
                  {selectedItem.category_summary && Object.keys(selectedItem.category_summary).length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {Object.entries(selectedItem.category_summary).map(([cat, count]) => (
                        <div key={cat} className="p-3 bg-[#f6f3ee] border border-[#1c1c19] flex justify-between items-center">
                          <span className="font-bold text-[#1c1c19]">{cat}</span>
                          <span className="bg-[#0f4369] text-white px-2 py-0.5 rounded text-xs font-bold">{count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[#72777f]">Sin resumen por categoría.</p>
                  )}
                </div>
              )}

              {activeTab === 'elements' && (
                <div className="bg-white border-2 border-[#1c1c19] p-4 space-y-3">
                  <h4 className="font-bold text-[#0f4369]">Detalle de Elementos Indexados por ElementId</h4>
                  {selectedItem.elements_by_id && Object.keys(selectedItem.elements_by_id).length > 0 ? (
                    <div className="max-h-[350px] overflow-y-auto">
                      <table className="w-full text-left font-mono text-[11px]">
                        <thead className="bg-[#f6f3ee] sticky top-0 border-b">
                          <tr>
                            <th className="p-2">ElementId</th>
                            <th className="p-2">Categoría</th>
                            <th className="p-2">Familia / Tipo</th>
                            <th className="p-2">Nivel</th>
                            <th className="p-2">Dimensiones</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {Object.entries(selectedItem.elements_by_id).slice(0, 100).map(([idKey, elem]) => (
                            <tr key={idKey} className="hover:bg-[#fcf9f4]">
                              <td className="p-2 font-bold text-[#0f4369]">{elem.element_id}</td>
                              <td className="p-2"><span className="bg-gray-100 px-1.5 py-0.5 rounded">{elem.category}</span></td>
                              <td className="p-2">{elem.family_name} : {elem.type_name}</td>
                              <td className="p-2">{elem.level || 'N/A'}</td>
                              <td className="p-2 text-[10px] text-gray-600">
                                {elem.volume_m3 ? `Vol: ${elem.volume_m3.toFixed(2)}m³ ` : ''}
                                {elem.area_m2 ? `Área: ${elem.area_m2.toFixed(2)}m²` : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-[#72777f]">No se incluyó detalle de elementos por ID.</p>
                  )}
                </div>
              )}

              {activeTab === 'materials' && (
                <MaterialSyncEditor 
                  selectedItem={selectedItem} 
                  onSaveSuccess={(updatedMaterials) => {
                    setSelectedItem({ ...selectedItem, materials: updatedMaterials });
                    setExportsList(prev => prev.map(p => p.id === selectedItem.id ? { ...p, materials: updatedMaterials } : p));
                  }}
                />
              )}

              {activeTab === 'json' && (
                <div className="bg-black text-green-400 p-4 border-2 border-[#1c1c19] overflow-x-auto">
                  <pre className="text-[11px] font-mono whitespace-pre-wrap">
                    {JSON.stringify(selectedItem, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
