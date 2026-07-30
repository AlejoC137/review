import React, { useState, useEffect } from 'react';
import { pluginDataService } from '../services/pluginDataService';
import { 
  Database, RefreshCw, Trash2, Eye, MapPin, Layers, 
  Box, Calendar, Mail, FileText, Search, AlertCircle, CheckCircle, Code
} from 'lucide-react';

export default function FromPlugInView() {
  const [exportsList, setExportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary', 'levels', 'categories', 'elements', 'json'
  const [errorMsg, setErrorMsg] = useState(null);

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

  useEffect(() => {
    fetchExports();
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

  const filteredItems = exportsList.filter(item => {
    const query = searchTerm.toLowerCase();
    return (
      (item.user_email && item.user_email.toLowerCase().includes(query)) ||
      (item.project_name && item.project_name.toLowerCase().includes(query)) ||
      (item.project_number && item.project_number.toLowerCase().includes(query)) ||
      (item.project_address && item.project_address.toLowerCase().includes(query))
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
                Registro de proyectos y metadata recibida desde el plugin de Revit en tiempo real.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchExports}
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
            placeholder="Buscar por Correo, Proyecto o Dirección..."
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
          <span className="text-[#72777f]">Último Recibido:</span>
          <span className="font-bold text-[#1c1c19] truncate ml-2">
            {exportsList.length > 0 ? new Date(exportsList[0].created_at).toLocaleTimeString() : 'N/A'}
          </span>
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
                  <th className="p-3">Usuario (Correo)</th>
                  <th className="p-3">Proyecto</th>
                  <th className="p-3">Dirección Revit</th>
                  <th className="p-3">Niveles</th>
                  <th className="p-3">Elementos por ID</th>
                  <th className="p-3">Fecha Exportación</th>
                  <th className="p-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e5e2dd]">
                {filteredItems.map((item) => {
                  const elemCount = item.elements_by_id ? Object.keys(item.elements_by_id).length : 0;
                  const levelCount = Array.isArray(item.levels) ? item.levels.length : 0;
                  return (
                    <tr 
                      key={item.id} 
                      onClick={() => setSelectedItem(item)}
                      className={`hover:bg-[#fcf9f4] cursor-pointer transition-colors ${selectedItem?.id === item.id ? 'bg-[#e5f0f8]' : ''}`}
                    >
                      <td className="p-3 font-bold text-[#0f4369] flex items-center gap-2">
                        <Mail size={14} className="shrink-0 text-[#72777f]" />
                        <span className="truncate max-w-[180px]">{item.user_email || 'Sin correo'}</span>
                      </td>
                      <td className="p-3 font-bold">
                        <div>{item.project_name || 'Sin Nombre'}</div>
                        <div className="text-[10px] text-[#72777f]"># {item.project_number || 'N/A'}</div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-1.5 text-[#1c1c19]">
                          <MapPin size={13} className="shrink-0 text-red-500" />
                          <span className="truncate max-w-[200px]" title={item.project_address}>
                            {item.project_address || 'No especificada'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="bg-[#f6f3ee] border border-[#1c1c19] px-2 py-0.5 text-[10px] font-bold">
                          {levelCount} Niveles
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="bg-[#e5f0f8] text-[#0f4369] border border-[#0f4369] px-2 py-0.5 text-[10px] font-bold">
                          {elemCount} Elementos
                        </span>
                      </td>
                      <td className="p-3 text-[#72777f] text-[10px]">
                        {new Date(item.created_at || item.exported_at).toLocaleString()}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-2" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setSelectedItem(item)}
                            className="p-1.5 bg-[#0f4369] text-white hover:bg-[#082a43] transition-colors rounded"
                            title="Ver Detalle"
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 bg-red-600 text-white hover:bg-red-700 transition-colors rounded"
                            title="Eliminar"
                          >
                            <Trash2 size={14} />
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

      {/* Drawer / Detail Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#fcf9f4] border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,0.3)] w-full max-w-4xl max-h-[90vh] flex flex-col font-mono">
            {/* Modal Header */}
            <div className="bg-[#0f4369] text-white p-4 flex items-center justify-between border-b-2 border-[#1c1c19]">
              <div className="flex items-center gap-3">
                <Database size={20} />
                <div>
                  <h3 className="font-bold text-sm uppercase">Detalle del Proyecto Enviado desde Revit</h3>
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

            {/* Tabs */}
            <div className="flex border-b-2 border-[#1c1c19] bg-[#f6f3ee] text-xs">
              <button
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2.5 font-bold flex items-center gap-2 border-r border-[#1c1c19] ${activeTab === 'summary' ? 'bg-[#0f4369] text-white' : 'text-[#72777f] hover:bg-[#e5e2dd]'}`}
              >
                <FileText size={14} /> Info General &amp; Dirección
              </button>
              <button
                onClick={() => setActiveTab('levels')}
                className={`px-4 py-2.5 font-bold flex items-center gap-2 border-r border-[#1c1c19] ${activeTab === 'levels' ? 'bg-[#0f4369] text-white' : 'text-[#72777f] hover:bg-[#e5e2dd]'}`}
              >
                <Layers size={14} /> Niveles ({selectedItem.levels ? selectedItem.levels.length : 0})
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`px-4 py-2.5 font-bold flex items-center gap-2 border-r border-[#1c1c19] ${activeTab === 'categories' ? 'bg-[#0f4369] text-white' : 'text-[#72777f] hover:bg-[#e5e2dd]'}`}
              >
                <Box size={14} /> Categorías
              </button>
              <button
                onClick={() => setActiveTab('elements')}
                className={`px-4 py-2.5 font-bold flex items-center gap-2 border-r border-[#1c1c19] ${activeTab === 'elements' ? 'bg-[#0f4369] text-white' : 'text-[#72777f] hover:bg-[#e5e2dd]'}`}
              >
                <Database size={14} /> Elementos por ID ({selectedItem.elements_by_id ? Object.keys(selectedItem.elements_by_id).length : 0})
              </button>
              <button
                onClick={() => setActiveTab('json')}
                className={`px-4 py-2.5 font-bold flex items-center gap-2 ${activeTab === 'json' ? 'bg-[#0f4369] text-white' : 'text-[#72777f] hover:bg-[#e5e2dd]'}`}
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
                    <p><span className="text-[#72777f]">Nombre Proyecto:</span> <strong>{selectedItem.project_name || 'N/A'}</strong></p>
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
                            <td className="p-2 text-[#0f4369] font-bold">{lvl.elevation_m?.toFixed(2)} m</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-[#72777f]">Sin información de niveles.</p>
                  )}
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
