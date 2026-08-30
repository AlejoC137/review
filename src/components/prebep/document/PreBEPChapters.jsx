import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { TABLE_METADATA } from '../../../services/databaseReportService';
import ContentBlockEditor from '../../modules/ContentBlockEditor';
import PreBEPCdeTree from '../../project/PreBEPCdeTree';
import PreBEPEsquemaDetails from '../../project/PreBEPEsquemaDetails';
import EditableTabLink from '../components/EditableTabLink';
import { renderObjectOrValue, formatDate } from '../utils/preBepHelpers';

import SubproyectosTable from '../tables/SubproyectosTable';
import EquipoTable from '../tables/EquipoTable';
import DirectorioTable from '../tables/DirectorioTable';
import TdiReferenceMatrix from '../tables/TdiReferenceMatrix';
import LodMatrixTable from '../tables/LodMatrixTable';
import MaterialesTable from '../tables/MaterialesTable';
import CalendarioTable from '../tables/CalendarioTable';
import HerramientasTable from '../tables/HerramientasTable';
import SoftwareTable from '../tables/SoftwareTable';
import ObjetivosTable from '../tables/ObjetivosTable';
import UsosBIMTable from '../tables/UsosBIMTable';
import EntregasTable from '../tables/EntregasTable';

export const PreBEPChapters = ({
  projectId,
  project,
  pebInfo,
  specialties,
  bepTeam,
  staff,
  contacts,
  requirements,
  lodTdi,
  spaces,
  materials,
  documents,
  tasks,
  plans,
  software,
  objectives,
  bimUses,
  deliverables,
  dbData,
  customSections,
  chapterOrder,
  chapterVisibility,
  getChapterNum,
  renderTableTitle,
  // Column visibilities
  subproyectosVisibleColumns,
  equipoVisibleColumns,
  directorioVisibleColumns,
  softwareVisibleColumns,
  lodVisibleColumns,
  lodExpandedDisciplines,
  toggleLodDiscipline,
  materialesVisibleColumns,
  calendarioVisibleColumns,
  objetivosVisibleColumns,
  entregasVisibleColumns,
  // Protocols config
  orderedProtocols,
  showFullProtocols,
  expandedProtocols,
  toggleProtocol,
  expandedSubItems,
  toggleSubItem
}) => {
  return (
    <>
      {chapterOrder.filter(k => chapterVisibility[k]).map((key, index, array) => {
        let chapterContent = null;
        
        if (key.startsWith('custom_')) {
          const customSec = customSections.find(s => s.id === key);
          if (customSec) {
            const tableData = dbData[customSec.table]?.records || [];
            const record = tableData.find(r => r.id === customSec.recordId);
            
            chapterContent = (
              <section className="w-full">
                <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                  {getChapterNum(key)}. {customSec.title}
                </h2>
                {record ? (() => {
                  const visibleEntries = Object.entries(record).filter(([k, value]) => {
                    const keyLower = k.toLowerCase();
                    const isId = keyLower === 'id' || keyLower.endsWith('_id') || keyLower.endsWith('id') || keyLower.includes('uuid') || keyLower === 'key' || /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(String(value));
                    const isMeta = ['blocks', 'created_at', 'updated_at', 'created_by', 'updated_by', 'title', 'name'].includes(keyLower);
                    return !isId && !isMeta && value !== null && value !== undefined && value !== '';
                  });

                  return (
                    <>
                      {customSec.table === 'resources' && record.blocks && record.blocks.length > 0 && (
                        <div className="prose prose-sm max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-[#0f4369] mb-8">
                          <ContentBlockEditor blocks={record.blocks} isEditing={false} onChange={() => {}} onUploadImage={() => {}} />
                        </div>
                      )}
                      {customSec.table !== 'resources' && visibleEntries.length > 0 && (
                        <div className="mb-8 w-full">
                          {renderTableTitle(key)}
                          <table className="w-full text-xs border-collapse mb-8 border border-gray-300 table-fixed">
                            <tbody>
                              <tr className="bg-[#f6f3ee]">
                                <th colSpan="2" className="text-left p-2.5 font-bold tracking-widest uppercase border-b border-gray-300">
                                  INFORMACIÓN DE {TABLE_METADATA[customSec.table]?.displayName || customSec.table}
                                </th>
                              </tr>
                              {visibleEntries.map(([k, value]) => (
                                <tr key={k} className="border-b border-gray-200">
                                  <td className="p-2.5 font-semibold w-1/3 bg-gray-50 border-r border-gray-200 uppercase break-all">{k}</td>
                                  <td className="p-2.5 font-medium break-words overflow-hidden">{renderObjectOrValue(value)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </>
                  );
                })() : (
                  <p className="text-xs text-red-500 italic mb-8 p-4 border border-red-200 bg-red-50">No se encontraron datos para esta sección importada.</p>
                )}

                {customSec.table === 'resources' ? (
                  <EditableTabLink 
                    projectId={projectId} 
                    sectionId={key} 
                    defaultLabel={`RECURSO: ${customSec.title}`} 
                    defaultUrl={`/resourceView/${customSec.recordId}`} 
                  />
                ) : (
                  <EditableTabLink 
                    projectId={projectId} 
                    sectionId={key} 
                    defaultLabel={`EXPLORADOR: ${TABLE_METADATA[customSec.table]?.displayName || customSec.table}`} 
                    defaultUrl={`?tab=datos&subtab=explorador`} 
                  />
                )}
              </section>
            );
          }
        } else {
          switch (key) {
            case 'datos':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                    {getChapterNum(key)}. DATOS DEL PROYECTO
                  </h2>
                  <div className="mb-8 w-full">
                    {renderTableTitle('datos_gral')}
                    <table className="w-full text-xs border-collapse border border-[#1c1c19] table-fixed">
                      <tbody>
                        <tr className="border-b border-[#1c1c19]">
                          <td className="p-2.5 font-bold w-1/3 bg-[#f6f3ee] border-r border-[#1c1c19] uppercase tracking-wider">NOMBRE DEL PROYECTO</td>
                          <td className="p-2.5 font-black uppercase text-[#0f4369]">{project?.name || '-'}</td>
                        </tr>
                        <tr className="border-b border-[#1c1c19]">
                          <td className="p-2.5 font-bold w-1/3 bg-[#f6f3ee] border-r border-[#1c1c19] uppercase tracking-wider">TIPO DE PROYECTO</td>
                          <td className="p-2.5 uppercase font-medium">{project?.tipo_proyecto || project?.type || '-'}</td>
                        </tr>
                        <tr className="border-b border-[#1c1c19]">
                          <td className="p-2.5 font-bold w-1/3 bg-[#f6f3ee] border-r border-[#1c1c19] uppercase tracking-wider">FASE ACTUAL</td>
                          <td className="p-2.5 uppercase font-medium">{project?.fase_actual || project?.phase || '-'}</td>
                        </tr>
                        <tr className="border-b border-[#1c1c19]">
                          <td className="p-2.5 font-bold w-1/3 bg-[#f6f3ee] border-r border-[#1c1c19] uppercase tracking-wider">UBICACIÓN / DIRECCIÓN</td>
                          <td className="p-2.5 uppercase font-medium">{project?.ubicacion || project?.location || '-'}</td>
                        </tr>
                        <tr className="border-b border-[#1c1c19]">
                          <td className="p-2.5 font-bold w-1/3 bg-[#f6f3ee] border-r border-[#1c1c19] uppercase tracking-wider">CLIENTE</td>
                          <td className="p-2.5 uppercase font-medium">{project?.cliente || project?.client || '-'}</td>
                        </tr>
                        <tr className="border-b border-[#1c1c19]">
                          <td className="p-2.5 font-bold w-1/3 bg-[#f6f3ee] border-r border-[#1c1c19] uppercase tracking-wider">DESCRIPCIÓN GENERAL</td>
                          <td className="p-2.5 uppercase font-medium leading-relaxed">{project?.descripcion || project?.description || '-'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {pebInfo && (
                    <div className="mb-8 w-full">
                      {renderTableTitle('datos_areas')}
                      <table className="w-full text-xs border-collapse border border-[#1c1c19] table-fixed">
                        <tbody>
                          <tr className="border-b border-[#1c1c19]">
                            <td className="p-2.5 font-bold w-1/3 bg-[#f6f3ee] border-r border-[#1c1c19] uppercase tracking-wider">ÁREA TOTAL CONSTRUIDA</td>
                            <td className="p-2.5 font-black uppercase text-[#0f4369]">{pebInfo.area_total || pebInfo.total_area || '-'} m²</td>
                          </tr>
                          <tr className="border-b border-[#1c1c19]">
                            <td className="p-2.5 font-bold w-1/3 bg-[#f6f3ee] border-r border-[#1c1c19] uppercase tracking-wider">ÁREA DEL LOTE / TERRENO</td>
                            <td className="p-2.5 uppercase font-medium">{pebInfo.area_lote || pebInfo.lot_area || '-'} m²</td>
                          </tr>
                          <tr className="border-b border-[#1c1c19]">
                            <td className="p-2.5 font-bold w-1/3 bg-[#f6f3ee] border-r border-[#1c1c19] uppercase tracking-wider">NÚMERO DE PISOS / NIVELES</td>
                            <td className="p-2.5 uppercase font-medium">{pebInfo.numero_pisos || pebInfo.floors_count || '-'}</td>
                          </tr>
                          <tr className="border-b border-[#1c1c19]">
                            <td className="p-2.5 font-bold w-1/3 bg-[#f6f3ee] border-r border-[#1c1c19] uppercase tracking-wider">USO PRINCIPAL</td>
                            <td className="p-2.5 uppercase font-medium">{pebInfo.uso_principal || pebInfo.main_use || '-'}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )}

                  <EditableTabLink projectId={projectId} sectionId="datos" defaultLabel="DATOS DEL PROYECTO" defaultUrl="?tab=info" />
                </section>
              );
              break;

            case 'unidades':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                    {getChapterNum(key)}. SUB PROYECTOS / UNIDADES
                  </h2>
                  <p className="text-xs text-gray-600 mb-4 uppercase">
                    Desglose de unidades funcionales, subproyectos o sectores que componen el proyecto general.
                  </p>
                  <div className="mb-8 w-full">
                    {renderTableTitle('unidades_subproyectos')}
                    <SubproyectosTable spaces={spaces} visibleColumns={subproyectosVisibleColumns} />
                  </div>
                  <EditableTabLink projectId={projectId} sectionId="unidades" defaultLabel="DATOS DEL PROYECTO - UNIDADES" defaultUrl="?tab=units" />
                </section>
              );
              break;

            case 'directorio':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                    {getChapterNum(key)}. EQUIPO BIM Y DIRECTORIO
                  </h2>

                  <div className="mb-8 w-full">
                    {renderTableTitle('directorio_bep')}
                    <EquipoTable bepTeam={bepTeam} staff={staff} visibleColumns={equipoVisibleColumns} />
                  </div>

                  <div className="mb-8 w-full">
                    {renderTableTitle('directorio_staff')}
                    <DirectorioTable dataArray={staff} tableId="directorio_staff" visibleColumns={directorioVisibleColumns} />
                  </div>

                  <div className="mb-8 w-full">
                    {renderTableTitle('directorio_contactos')}
                    <DirectorioTable dataArray={contacts} tableId="directorio_contactos" visibleColumns={directorioVisibleColumns} />
                  </div>

                  {specialties.length > 0 && (
                    <div className="mb-8 w-full">
                      {renderTableTitle('directorio_especialidades')}
                      <div className="border border-[#1c1c19] overflow-hidden my-3 w-full text-left">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-[#1c1c19] text-white">
                              <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider w-24">CÓDIGO</th>
                              <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider">ESPECIALIDAD</th>
                              <th className="p-2 text-[10px] font-black uppercase tracking-wider">DESCRIPCIÓN</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1c1c19]">
                            {specialties.map((sp, idx) => (
                              <tr key={sp.id || idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]'}>
                                <td className="p-2 border-r border-[#1c1c19] font-mono text-[9px] font-bold">{sp.codigo || sp.code || `ESP-${idx + 1}`}</td>
                                <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold text-[#0f4369]">{sp.nombre || sp.name || '-'}</td>
                                <td className="p-2 text-[9px] text-gray-700">{sp.descripcion || sp.description || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <EditableTabLink projectId={projectId} sectionId="directorio" defaultLabel="DIRECTORIO" defaultUrl="?tab=directory" />
                </section>
              );
              break;

            case 'software':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                    {getChapterNum(key)}. SOFTWARE Y PLATAFORMAS
                  </h2>
                  <div className="mb-8 w-full">
                    {renderTableTitle('software_tabla')}
                    <SoftwareTable software={software} visibleColumns={softwareVisibleColumns} />
                  </div>
                  <EditableTabLink projectId={projectId} sectionId="software" defaultLabel="SOFTWARE" defaultUrl="?tab=software" />
                </section>
              );
              break;

            case 'herramientas':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                    {getChapterNum(key)}. HERRAMIENTAS BIM Y ENTORNO COLABORATIVO
                  </h2>
                  <div className="mb-8 w-full">
                    {renderTableTitle('herramientas_tabla')}
                    <HerramientasTable plans={plans} />
                  </div>
                  <EditableTabLink projectId={projectId} sectionId="herramientas" defaultLabel="HERRAMIENTAS BIM" defaultUrl="?tab=tools" />
                </section>
              );
              break;

            case 'requisitos':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                    {getChapterNum(key)}. REQUISITOS DEL CLIENTE (EIR / REQ)
                  </h2>
                  <div className="space-y-4 mb-8">
                    {requirements.length === 0 ? (
                      <p className="text-xs text-gray-500 italic p-4 border border-gray-200">No hay requisitos del cliente registrados.</p>
                    ) : (
                      requirements.map((req, idx) => (
                        <div key={req.id || idx} className="p-4 border border-[#1c1c19] bg-[#fcf9f4] shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
                          <div className="flex justify-between items-start mb-2">
                            <span className="font-bold text-xs uppercase text-[#0f4369]">
                              {req.codigo || req.code || `REQ-${idx + 1}`}: {req.titulo || req.title || req.nombre || 'Requisito'}
                            </span>
                            <span className="text-[10px] font-mono bg-[#1c1c19] text-white px-2 py-0.5 uppercase">
                              {req.prioridad || req.priority || 'Normal'}
                            </span>
                          </div>
                          <p className="text-xs text-gray-700 leading-relaxed uppercase">{req.descripcion || req.description || '-'}</p>
                        </div>
                      ))
                    )}
                  </div>
                  <EditableTabLink projectId={projectId} sectionId="requisitos" defaultLabel="REQUISITOS" defaultUrl="?tab=requirements" />
                </section>
              );
              break;

            case 'lod_tdi':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                    {getChapterNum(key)}. MATRIZ DE INFORMACIÓN Y MODELADO (LOD / TDI)
                  </h2>

                  <div className="mb-6 w-full">
                    {renderTableTitle('lod_tdi_matriz')}
                    <LodMatrixTable
                      lodTdi={lodTdi}
                      specialties={specialties}
                      visibleColumns={lodVisibleColumns}
                      lodExpandedDisciplines={lodExpandedDisciplines}
                      toggleLodDiscipline={toggleLodDiscipline}
                    />
                  </div>

                  <div className="mb-8 w-full">
                    {renderTableTitle('lod_tdi_ref')}
                    <TdiReferenceMatrix />
                  </div>

                  <EditableTabLink projectId={projectId} sectionId="lod_tdi" defaultLabel="DATOS DEL PROYECTO - LOD/TDI" defaultUrl="?tab=lod_tdi" />
                </section>
              );
              break;

            case 'cde':
              chapterContent = (
                <section className="w-full break-inside-avoid">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                    {getChapterNum(key)}. ESTRUCTURA DE CARPETAS CDE (COMMON DATA ENVIRONMENT)
                  </h2>
                  <p className="text-xs text-gray-600 mb-4 uppercase">
                    Estructura normalizada ISO 19650 para la gestión documental y contenedores de información.
                  </p>
                  
                  <div className="border border-[#1c1c19] p-4 bg-[#fcf9f4] shadow-[4px_4px_0_0_rgba(28,28,25,1)] mb-8">
                    <PreBEPCdeTree projectId={projectId} />
                  </div>

                  <EditableTabLink projectId={projectId} sectionId="cde" defaultLabel="EXPLORADOR CDE" defaultUrl="/planner" />
                </section>
              );
              break;

            case 'protocolos':
              chapterContent = (
                <section className="w-full">
                  <div className="flex justify-between items-center mb-4 border-b-2 border-[#1c1c19] pb-2">
                    <h2 className="text-2xl font-black uppercase tracking-tight text-[#0f4369]">
                      {getChapterNum(key)}. PROTOCOLOS Y ESTÁNDARES DE MODELADO
                    </h2>
                  </div>

                  <div className="space-y-6 mb-8">
                    {orderedProtocols.length === 0 ? (
                      <p className="text-xs text-gray-500 italic p-4 border border-gray-200">No hay protocolos registrados.</p>
                    ) : (
                      orderedProtocols.map((proto, idx) => {
                        const isExpanded = expandedProtocols[proto.id] ?? showFullProtocols;
                        return (
                          <div key={proto.id || idx} className="border border-[#1c1c19] p-4 bg-[#fcf9f4] shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-black text-sm uppercase text-[#0f4369]">
                                {proto.codigo || proto.code || `PROT-${idx + 1}`}: {proto.nombre || proto.name || proto.titulo || 'Protocolo'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono bg-blue-100 text-blue-900 border border-blue-300 px-2 py-0.5 uppercase">
                                  {proto.categoria || proto.category || 'Estándar'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => toggleProtocol(proto.id)}
                                  className="no-print text-xs font-bold text-gray-600 hover:text-black border border-gray-300 px-1.5 py-0.5 rounded bg-white"
                                >
                                  {isExpanded ? '▲ Colapsar' : '▼ Expandir'}
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <>
                                <p className="text-xs text-gray-700 leading-relaxed uppercase mb-3">{proto.descripcion || proto.description || '-'}</p>

                                {proto.content_blocks && proto.content_blocks.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-gray-300">
                                    <ContentBlockEditor blocks={proto.content_blocks} isEditing={false} onChange={() => {}} onUploadImage={() => {}} />
                                  </div>
                                )}

                                {proto.children && proto.children.length > 0 && (
                                  <div className="mt-4 pt-4 border-t border-gray-300 space-y-4">
                                    <h4 className="text-[11px] font-black uppercase text-[#0f4369] tracking-wider">SUB-ÍTEMS / SECCIONES DEL PROTOCOLO</h4>
                                    {proto.children.map((child, cIdx) => {
                                      const isChildExpanded = expandedSubItems[child.id] ?? showFullProtocols;
                                      return (
                                        <div key={child.id || cIdx} className="p-3 bg-white border border-gray-300 rounded shadow-sm">
                                          <div className="flex justify-between items-start mb-1">
                                            <span className="font-bold text-xs uppercase text-gray-800">
                                              {child.codigo || child.code || `${cIdx + 1}.`} {child.nombre || child.name || child.titulo || 'Sub-ítem'}
                                            </span>
                                            <button
                                              type="button"
                                              onClick={() => toggleSubItem(child.id)}
                                              className="no-print text-[10px] font-bold text-gray-500 hover:text-black border border-gray-200 px-1 py-0.5 rounded"
                                            >
                                              {isChildExpanded ? '▲' : '▼'}
                                            </button>
                                          </div>
                                          {isChildExpanded && (
                                            <>
                                              <p className="text-[11px] text-gray-600 leading-relaxed uppercase mb-2">{child.descripcion || child.description || '-'}</p>
                                              {child.content_blocks && child.content_blocks.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-gray-100">
                                                  <ContentBlockEditor blocks={child.content_blocks} isEditing={false} onChange={() => {}} onUploadImage={() => {}} />
                                                </div>
                                              )}
                                            </>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>

                  <EditableTabLink projectId={projectId} sectionId="protocolos" defaultLabel="PROTOCOLOS" defaultUrl="?tab=protocols" />
                </section>
              );
              break;

            case 'materiales':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                    {getChapterNum(key)}. BASE DE DATOS DE MATERIALES
                  </h2>
                  <div className="mb-8 w-full">
                    {renderTableTitle('materiales_tabla')}
                    <MaterialesTable materials={materials} visibleColumns={materialesVisibleColumns} />
                  </div>
                  <EditableTabLink projectId={projectId} sectionId="materiales" defaultLabel="MATERIALES" defaultUrl="?tab=materials" />
                </section>
              );
              break;

            case 'documentos':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                    {getChapterNum(key)}. DOCUMENTOS ASOCIADOS
                  </h2>
                  <div className="space-y-3 mb-8">
                    {documents.length === 0 ? (
                      <p className="text-xs text-gray-500 italic p-4 border border-gray-200">No hay documentos registrados.</p>
                    ) : (
                      documents.map((doc, idx) => (
                        <div key={doc.id || idx} className="p-3 border border-[#1c1c19] bg-[#fcf9f4] flex justify-between items-center">
                          <div>
                            <span className="font-bold text-xs uppercase text-[#0f4369]">{doc.nombre || doc.name || doc.title || 'Documento'}</span>
                            <span className="text-[10px] text-gray-500 ml-2 font-mono uppercase">({doc.tipo || doc.type || 'Archivo'})</span>
                          </div>
                          <span className="text-[9px] text-gray-500 font-mono">{formatDate(doc.created_at || doc.fecha)}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <EditableTabLink projectId={projectId} sectionId="documentos" defaultLabel="DOCUMENTOS" defaultUrl="?tab=documents" />
                </section>
              );
              break;

            case 'calendario':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                    {getChapterNum(key)}. CALENDARIO MENSUAL Y ACTIVIDADES
                  </h2>
                  <div className="mb-8 w-full">
                    {renderTableTitle('calendario_tabla')}
                    <CalendarioTable tasks={tasks} visibleColumns={calendarioVisibleColumns} />
                  </div>
                  <EditableTabLink projectId={projectId} sectionId="calendario" defaultLabel="CALENDARIO MENSUAL" defaultUrl="?tab=calendar" />
                </section>
              );
              break;

            case 'esquemas':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                    {getChapterNum(key)}. ESQUEMAS DEL PROYECTO
                  </h2>
                  
                  <div className="border border-[#1c1c19] p-4 bg-[#fcf9f4] shadow-[4px_4px_0_0_rgba(28,28,25,1)] mb-8">
                    <PreBEPEsquemaDetails projectId={projectId} />
                  </div>

                  <EditableTabLink projectId={projectId} sectionId="esquemas" defaultLabel="ESQUEMAS" defaultUrl="?tab=spaces" />
                </section>
              );
              break;

            case 'objetivos':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                    {getChapterNum(key)}. OBJETIVOS Y USOS BIM
                  </h2>
                  
                  <div className="mb-8 w-full">
                    {renderTableTitle('objetivos_tabla')}
                    <ObjetivosTable objectives={objectives} bimUses={bimUses} visibleColumns={objetivosVisibleColumns} />
                  </div>

                  <div className="mb-8 w-full">
                    {renderTableTitle('objetivos_usos')}
                    <UsosBIMTable bimUses={bimUses} />
                  </div>

                  <EditableTabLink projectId={projectId} sectionId="objetivos" defaultLabel="OBJETIVOS" defaultUrl="?tab=objectives" />
                </section>
              );
              break;

            case 'cronograma_entregas':
              chapterContent = (
                <section className="w-full">
                  <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
                    {getChapterNum(key)}. CRONOGRAMA DE ENTREGAS
                  </h2>
                  <div className="mb-8 w-full">
                    {renderTableTitle('entregas_tabla')}
                    <EntregasTable deliverables={deliverables} visibleColumns={entregasVisibleColumns} />
                  </div>
                  <EditableTabLink projectId={projectId} sectionId="cronograma_entregas" defaultLabel="CRONOGRAMA" defaultUrl="?tab=deliverables" />
                </section>
              );
              break;

            default:
              chapterContent = null;
          }
        }

        if (!chapterContent) return null;

        return (
          <React.Fragment key={key}>
            {chapterContent}
            {index < array.length - 1 && (
              <div className="w-full border-t border-dashed border-gray-400 my-8"></div>
            )}
          </React.Fragment>
        );
      })}
    </>
  );
};
export default PreBEPChapters;
