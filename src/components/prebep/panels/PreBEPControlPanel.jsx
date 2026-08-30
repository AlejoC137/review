import React from 'react';
import {
  ChevronUp, ChevronDown, ChevronRight, Book, X, Search, Database, LayoutGrid
} from 'lucide-react';
import { TABLE_METADATA } from '../../../services/databaseReportService';
import { PROJECT_TABS_OPTIONS } from '../utils/preBepHelpers';

import SubproyectosTable from '../tables/SubproyectosTable';
import EquipoTable from '../tables/EquipoTable';
import DirectorioTable from '../tables/DirectorioTable';
import LodMatrixTable from '../tables/LodMatrixTable';
import MaterialesTable from '../tables/MaterialesTable';
import CalendarioTable from '../tables/CalendarioTable';
import SoftwareTable from '../tables/SoftwareTable';
import ObjetivosTable from '../tables/ObjetivosTable';
import UsosBIMTable from '../tables/UsosBIMTable';
import EntregasTable from '../tables/EntregasTable';

export const PreBEPControlPanel = ({
  projectId,
  chapterOrder,
  chapterVisibility,
  handleChapterVisibilityChange,
  handleOrderChange,
  getChapterLabel,
  customSections,
  handleRemoveCustomSection,
  // Protocols
  orderedProtocols,
  showFullProtocols,
  toggleProtocolsDisplay,
  expandedProtocols,
  toggleProtocol,
  expandedSubItems,
  toggleSubItem,
  handleProtocolOrderChange,
  // Custom section importer
  customImportTable,
  setCustomImportTable,
  customImportSelectedIds,
  setCustomImportSelectedIds,
  customImportSearchQuery,
  setCustomImportSearchQuery,
  handleAddCustomSection,
  availableTables,
  dbData,
  // Column config
  activeConfigTab,
  setActiveConfigTab,
  subproyectosVisibleColumns,
  handleSubproyectosColumnToggle,
  equipoVisibleColumns,
  handleEquipoColumnToggle,
  directorioVisibleColumns,
  handleDirectorioColumnToggle,
  softwareVisibleColumns,
  handleSoftwareColumnToggle,
  lodVisibleColumns,
  handleLodColumnToggle,
  lodExpandedDisciplines,
  toggleLodDiscipline,
  materialesVisibleColumns,
  handleMaterialesColumnToggle,
  calendarioVisibleColumns,
  handleCalendarioColumnToggle,
  objetivosVisibleColumns,
  handleObjetivosColumnToggle,
  entregasVisibleColumns,
  handleEntregasColumnToggle,
  // Data props for preview tables
  spaces,
  bepTeam,
  staff,
  contacts,
  software,
  lodTdi,
  specialties,
  materials,
  tasks,
  objectives,
  bimUses,
  deliverables
}) => {
  return (
    <div className="flex-1 overflow-y-auto w-full py-8 px-4 flex flex-col items-center bg-[#f0ede6]">
      <div className="w-full max-w-5xl">
        
        {/* Gestor de Capítulos */}
        <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[4px_4px_0_0_rgba(28,28,25,1)] mb-8">
          <h2 className="text-xl font-black uppercase mb-4 text-[#0f4369] flex items-center gap-2 border-b-2 border-gray-200 pb-2">
            <LayoutGrid size={20} /> Visibilidad y Orden de Capítulos
          </h2>
          <p className="text-xs text-gray-600 mb-6 uppercase">
            Activa, desactiva o reordena las secciones del documento impreso.
          </p>

          <div className="space-y-2">
            {chapterOrder.map((key, index) => {
              const isCustom = key.startsWith('custom_');
              return (
                <div 
                  key={key} 
                  className={`flex items-center justify-between p-3 border-2 transition-colors ${
                    chapterVisibility[key] ? 'bg-white border-[#1c1c19]' : 'bg-gray-100 border-gray-300 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <input 
                      type="checkbox"
                      checked={!!chapterVisibility[key]}
                      onChange={(e) => handleChapterVisibilityChange(key, e.target.checked)}
                      className="w-4 h-4 accent-[#0f4369] cursor-pointer"
                    />
                    <span className="font-mono text-xs font-bold text-gray-400 w-6">{(index + 1).toString().padStart(2, '0')}</span>
                    <span className="font-bold text-xs uppercase text-[#1c1c19] truncate">{getChapterLabel(key)}</span>
                    {isCustom && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 border border-amber-300 uppercase">
                        Importado
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => handleOrderChange(key, index - 1)}
                      disabled={index === 0}
                      className="p-1 border border-[#1c1c19] hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button 
                      onClick={() => handleOrderChange(key, index + 1)}
                      disabled={index === chapterOrder.length - 1}
                      className="p-1 border border-[#1c1c19] hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-inherit"
                    >
                      <ChevronDown size={14} />
                    </button>
                    {isCustom && (
                      <button 
                        onClick={() => handleRemoveCustomSection(key)}
                        className="p-1 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white ml-2"
                        title="Eliminar sección personalizada"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Gestor y Visualización de Protocolos */}
        <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[4px_4px_0_0_rgba(28,28,25,1)] mb-8">
          <div className="flex justify-between items-center mb-4 border-b-2 border-gray-200 pb-2 flex-wrap gap-2">
            <h2 className="text-xl font-black uppercase text-[#0f4369] flex items-center gap-2">
              <Book size={20} /> Visibilidad y Orden de Protocolos
            </h2>
            <div className="flex items-center gap-2">
              <button 
                onClick={toggleProtocolsDisplay}
                className="text-xs font-bold uppercase px-3 py-1.5 border-2 border-[#1c1c19] bg-[#f6f3ee] hover:bg-black hover:text-white transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
              >
                {showFullProtocols ? 'Colapsar Todo por Defecto' : 'Expandir Todo por Defecto'}
              </button>
            </div>
          </div>
          <p className="text-xs text-gray-600 mb-6 uppercase">Controla qué protocolos o ítems específicos se muestran desplegados y su orden en el documento.</p>

          {chapterVisibility.protocolos && (
            <div className="space-y-3">
              {orderedProtocols.length === 0 ? (
                <p className="text-xs text-gray-500 italic p-4 border border-gray-200">No hay protocolos registrados en este proyecto.</p>
              ) : (
                orderedProtocols.map((proto, pIdx) => {
                  const isExpanded = expandedProtocols[proto.id] ?? showFullProtocols;
                  return (
                    <div key={proto.id || pIdx} className="border-2 border-[#1c1c19] bg-[#fcf9f4] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <input 
                            type="checkbox" 
                            checked={isExpanded} 
                            onChange={() => toggleProtocol(proto.id)} 
                            className="w-4 h-4 accent-[#0f4369] cursor-pointer flex-shrink-0" 
                          />
                          <span className="font-mono text-xs font-bold text-gray-400">{(pIdx + 1).toString().padStart(2, '0')}</span>
                          <span className="font-black text-xs uppercase text-[#0f4369] truncate">
                            {proto.codigo || proto.code || `PROT-${pIdx + 1}`}: {proto.nombre || proto.name || proto.titulo}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button 
                            onClick={() => handleProtocolOrderChange(proto.id, pIdx - 1)}
                            disabled={pIdx === 0}
                            className="p-1 border border-[#1c1c19] bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
                          >
                            <ChevronUp size={12} />
                          </button>
                          <button 
                            onClick={() => handleProtocolOrderChange(proto.id, pIdx + 1)}
                            disabled={pIdx === orderedProtocols.length - 1}
                            className="p-1 border border-[#1c1c19] bg-white hover:bg-black hover:text-white disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black"
                          >
                            <ChevronDown size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Sub ítems checkboxes */}
                      {proto.children && proto.children.length > 0 && isExpanded && (
                        <div className="pl-6 pt-3 mt-2 border-t border-gray-200 space-y-1.5">
                          <div className="text-[10px] font-bold uppercase text-gray-500">Sub-secciones / Ítems:</div>
                          {proto.children.map((child, cIdx) => {
                            const isChildExpanded = expandedSubItems[child.id] ?? showFullProtocols;
                            return (
                              <label key={child.id || cIdx} className="flex items-center gap-2 cursor-pointer py-0.5">
                                <input 
                                  type="checkbox" 
                                  checked={isChildExpanded} 
                                  onChange={() => toggleSubItem(child.id)} 
                                  className="w-3.5 h-3.5 accent-[#0f4369] flex-shrink-0" 
                                />
                                <span className="text-[10px] font-bold uppercase text-gray-700 truncate">
                                  {child.codigo || `${cIdx + 1}.`} {child.nombre || child.titulo}
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Importador de Secciones Adicionales */}
        <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[4px_4px_0_0_rgba(28,28,25,1)] mb-8">
          <h2 className="text-xl font-black uppercase mb-4 text-[#0f4369] flex items-center gap-2 border-b-2 border-gray-200 pb-2">
            <Database size={20} /> Importador de Secciones Adicionales
          </h2>
          <p className="text-xs text-gray-600 mb-6 uppercase">Busca entradas en tu proyecto para añadirlas como secciones independientes en el documento continuo.</p>
          
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase text-[#0f4369] mb-1">Tabla Origen</label>
              <select 
                value={customImportTable} 
                onChange={(e) => {
                  setCustomImportTable(e.target.value);
                  setCustomImportSelectedIds([]);
                  setCustomImportSearchQuery('');
                }}
                className="w-full p-2 border border-[#1c1c19] text-xs font-bold uppercase bg-white outline-none"
              >
                <option value="">Seleccione una tabla...</option>
                {availableTables.map(t => (
                  <option key={t.id || t} value={t.id || t}>{TABLE_METADATA[t.id || t]?.displayName || t.name || t.id || t}</option>
                ))}
              </select>
            </div>
          </div>

          {customImportTable && (
            <div className="mb-6 border border-[#1c1c19] bg-white p-4">
              <div className="flex justify-between items-center mb-4">
                <label className="block text-[10px] font-bold uppercase text-[#0f4369]">Selecciona los registros a importar</label>
                <button 
                  onClick={() => handleAddCustomSection(dbData[customImportTable] || [])}
                  disabled={customImportSelectedIds.length === 0}
                  className="py-1.5 px-4 bg-[#1c1c19] text-white text-[9px] font-black uppercase tracking-widest hover:bg-[#0f4369] transition-colors disabled:opacity-50"
                >
                  Añadir Seleccionados ({customImportSelectedIds.length})
                </button>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  placeholder="Buscar por nombre o descripción..."
                  value={customImportSearchQuery}
                  onChange={(e) => setCustomImportSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 border border-[#1c1c19] text-xs outline-none focus:border-[#0f4369]"
                />
              </div>

              <div className="max-h-60 overflow-y-auto space-y-1 pr-2">
                {(Array.isArray(dbData[customImportTable]) ? dbData[customImportTable] : (dbData[customImportTable]?.records || [])).filter(r => {
                  if (!customImportSearchQuery) return true;
                  const label = String(r.name || r.title || r.Nombre || r.tarea || r.descripcion || r.id).toLowerCase();
                  return label.includes(customImportSearchQuery.toLowerCase());
                }).map(r => {
                  const isSelected = customImportSelectedIds.includes(r.id);
                  return (
                    <label key={r.id} className={`flex items-start gap-3 p-2 border cursor-pointer transition-colors ${isSelected ? 'border-[#0f4369] bg-[#eef4f9]' : 'border-gray-200 hover:bg-gray-50'}`}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCustomImportSelectedIds(prev => [...prev, r.id]);
                          } else {
                            setCustomImportSelectedIds(prev => prev.filter(id => id !== r.id));
                          }
                        }}
                        className="mt-0.5 w-4 h-4 accent-[#0f4369]"
                      />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-[11px] font-bold uppercase text-[#1c1c19] truncate">
                          {r.name || r.title || r.Nombre || r.tarea || r.descripcion || r.id}
                        </span>
                        <span className="text-[9px] text-gray-500 font-mono truncate">{r.id}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          
          {customSections.length > 0 && (
            <div className="mt-6 border-t border-gray-200 pt-4">
              <h3 className="text-[10px] font-black uppercase text-[#1c1c19] mb-2">Secciones Importadas</h3>
              <ul className="space-y-2">
                {customSections.map(sec => (
                  <li key={sec.id} className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200">
                    <span className="text-[10px] font-bold uppercase text-[#0f4369] truncate flex-1 pr-4">{sec.title}</span>
                    <span className="text-[9px] uppercase text-gray-500 font-mono px-2 hidden md:block">{TABLE_METADATA[sec.tableId || sec.table]?.displayName || sec.tableId || sec.table}</span>
                    <button onClick={() => handleRemoveCustomSection(sec.id)} className="text-red-600 hover:text-red-800 p-1 flex-shrink-0" title="Eliminar sección">
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Gestor de Columnas Visibles */}
        <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[4px_4px_0_0_rgba(28,28,25,1)] mb-8">
          <h2 className="text-xl font-black uppercase mb-4 text-[#0f4369] flex items-center gap-2 border-b-2 border-gray-200 pb-2">
            <LayoutGrid size={20} /> Personalización de Columnas por Tabla
          </h2>
          <p className="text-xs text-gray-600 mb-6 uppercase">Selecciona las columnas visibles para optimizar el encuadre en el documento.</p>

          <div className="flex flex-wrap gap-2 mb-6 border-b-2 border-[#1c1c19] pb-4">
            {[
              { id: 'subproyectos', label: '2. SUB PROYECTOS', show: chapterVisibility.unidades },
              { id: 'equipo', label: '3. EQUIPO BIM', show: chapterVisibility.directorio },
              { id: 'directorio', label: '3. DIRECTORIO', show: chapterVisibility.directorio },
              { id: 'software', label: '4. SOFTWARE', show: chapterVisibility.software },
              { id: 'lod_tdi', label: '6. LOD/TDI', show: chapterVisibility.lod_tdi },
              { id: 'materiales', label: '9. MATERIALES', show: chapterVisibility.materiales },
              { id: 'calendario', label: '11. CALENDARIO', show: chapterVisibility.calendario },
              { id: 'objetivos', label: '13. OBJETIVOS', show: chapterVisibility.objetivos },
              { id: 'cronograma', label: '14. CRONOGRAMA', show: chapterVisibility.cronograma_entregas }
            ].filter(t => t.show).map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveConfigTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-black uppercase transition-all ${
                  activeConfigTab === tab.id 
                    ? 'bg-[#0f4369] text-white shadow-[2px_2px_0_0_rgba(0,0,0,1)]' 
                    : 'bg-[#f6f3ee] text-[#1c1c19] hover:bg-gray-200 border border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="bg-[#fcf9f4] border border-[#1c1c19] p-4">
            {activeConfigTab === 'subproyectos' && chapterVisibility.unidades && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {['codigo', 'nombre', 'descripcion', 'estado'].map(col => (
                    <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={subproyectosVisibleColumns.includes(col)} onChange={() => handleSubproyectosColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                      {col}
                    </label>
                  ))}
                </div>
                <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                  <SubproyectosTable spaces={spaces} visibleColumns={subproyectosVisibleColumns} />
                </div>
              </div>
            )}

            {activeConfigTab === 'equipo' && chapterVisibility.directorio && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {['rol_bep', 'nombre', 'empresa', 'email', 'telefono'].map(col => (
                    <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={equipoVisibleColumns.includes(col)} onChange={() => handleEquipoColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                      {col}
                    </label>
                  ))}
                </div>
                <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                  <EquipoTable bepTeam={bepTeam} staff={staff} visibleColumns={equipoVisibleColumns} />
                </div>
              </div>
            )}

            {activeConfigTab === 'directorio' && chapterVisibility.directorio && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {['nombre', 'empresa', 'disciplina', 'email', 'telefono'].map(col => (
                    <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={directorioVisibleColumns.includes(col)} onChange={() => handleDirectorioColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                      {col}
                    </label>
                  ))}
                </div>
                <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)] flex flex-col p-4 gap-4">
                  <div className="font-bold text-[10px] uppercase text-[#72777f]">Directorio de Personal Interno (Staff)</div>
                  <DirectorioTable dataArray={staff} tableId="directorio_staff" visibleColumns={directorioVisibleColumns} />
                  <div className="font-bold text-[10px] uppercase text-[#72777f] mt-4">Directorio de Contactos Externos</div>
                  <DirectorioTable dataArray={contacts} tableId="directorio_contactos" visibleColumns={directorioVisibleColumns} />
                </div>
              </div>
            )}

            {activeConfigTab === 'software' && chapterVisibility.software && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {['software', 'version', 'disciplina', 'formato_nativo', 'formato_intercambio'].map(col => (
                    <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={softwareVisibleColumns.includes(col)} onChange={() => handleSoftwareColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                      {col}
                    </label>
                  ))}
                </div>
                <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                  <SoftwareTable software={software} visibleColumns={softwareVisibleColumns} />
                </div>
              </div>
            )}

            {activeConfigTab === 'lod_tdi' && chapterVisibility.lod_tdi && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {['disciplina', 'elemento', 'tdi', 'lod', 'formato', 'fase_conceptual', 'fase_anteproyecto', 'fase_detallado', 'fase_documentacion', 'notas'].map(col => (
                    <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={lodVisibleColumns.includes(col)} onChange={() => handleLodColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                      {col}
                    </label>
                  ))}
                </div>
                <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                  <LodMatrixTable
                    lodTdi={lodTdi}
                    specialties={specialties}
                    visibleColumns={lodVisibleColumns}
                    lodExpandedDisciplines={lodExpandedDisciplines}
                    toggleLodDiscipline={toggleLodDiscipline}
                  />
                </div>
              </div>
            )}

            {activeConfigTab === 'materiales' && chapterVisibility.materiales && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {['codigo', 'nombre', 'categoria', 'marca', 'modelo', 'unidad', 'descripcion'].map(col => (
                    <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={materialesVisibleColumns.includes(col)} onChange={() => handleMaterialesColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                      {col}
                    </label>
                  ))}
                </div>
                <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                  <MaterialesTable materials={materials} visibleColumns={materialesVisibleColumns} />
                </div>
              </div>
            )}

            {activeConfigTab === 'calendario' && chapterVisibility.calendario && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {['mes', 'fase', 'actividades_principales', 'hitos'].map(col => (
                    <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={calendarioVisibleColumns.includes(col)} onChange={() => handleCalendarioColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                      {col}
                    </label>
                  ))}
                </div>
                <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                  <CalendarioTable tasks={tasks} visibleColumns={calendarioVisibleColumns} />
                </div>
              </div>
            )}

            {activeConfigTab === 'objetivos' && chapterVisibility.objetivos && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {['codigo', 'prioridad', 'objetivo_cliente', 'objetivo_proyecto', 'usos_bim_asociados'].map(col => (
                    <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={objetivosVisibleColumns.includes(col)} onChange={() => handleObjetivosColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                      {col}
                    </label>
                  ))}
                </div>
                <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)] flex flex-col p-4 gap-4">
                  <div className="font-bold text-[10px] uppercase text-[#72777f]">Objetivos del Proyecto</div>
                  <ObjetivosTable objectives={objectives} bimUses={bimUses} visibleColumns={objetivosVisibleColumns} />
                  <div className="font-bold text-[10px] uppercase text-[#72777f] mt-4">Usos BIM</div>
                  <UsosBIMTable bimUses={bimUses} />
                </div>
              </div>
            )}

            {activeConfigTab === 'cronograma' && chapterVisibility.cronograma_entregas && (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {['codigo', 'fase', 'fecha_entrega', 'entregables_modelo', 'entregables_documentos', 'responsable'].map(col => (
                    <label key={col} className="flex items-center gap-2 text-[9px] uppercase font-mono cursor-pointer bg-white px-2 py-1.5 border border-gray-200 hover:bg-gray-50 transition-colors">
                      <input type="checkbox" checked={entregasVisibleColumns.includes(col)} onChange={() => handleEntregasColumnToggle(col)} className="w-3 h-3 cursor-pointer accent-[#0f4369]" />
                      {col}
                    </label>
                  ))}
                </div>
                <div className="max-h-96 overflow-y-auto bg-white border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                  <EntregasTable deliverables={deliverables} visibleColumns={entregasVisibleColumns} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Enlaces de Edición de Tablas */}
        <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
          <h2 className="text-xl font-black uppercase mb-4 text-[#0f4369] flex items-center gap-2 border-b-2 border-gray-200 pb-2">
            <Database size={20} /> Edición de Tablas
          </h2>
          <p className="text-xs text-gray-600 mb-6 uppercase">Accede directamente a los formularios para editar la información de cada sección.</p>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {PROJECT_TABS_OPTIONS.filter(opt => opt.value && opt.value !== '').map((opt, i) => {
              const href = opt.value.startsWith('?') ? `/projects/${projectId}${opt.value}` : opt.value;
              return (
                <a 
                  key={i} 
                  href={href} 
                  target="_blank" rel="noopener noreferrer"
                  className="p-4 border-2 border-[#1c1c19] bg-[#f6f3ee] hover:bg-[#1c1c19] hover:text-white transition-all flex flex-col justify-between h-full group shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-y-0.5"
                >
                  <span className="text-[10px] font-black uppercase mb-2">{opt.label}</span>
                  <div className="flex justify-end w-full">
                    <ChevronRight size={14} className="opacity-50 group-hover:opacity-100" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
export default PreBEPControlPanel;
