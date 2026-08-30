import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { TABLE_METADATA } from '../services/databaseReportService';

// Hooks Modulares
import { usePreBEPData } from '../components/prebep/hooks/usePreBEPData';
import { usePreBEPConfig } from '../components/prebep/hooks/usePreBEPConfig';

// Componentes del Documento
import PreBEPCoverPage from '../components/prebep/document/PreBEPCoverPage';
import PreBEPIndexPage from '../components/prebep/document/PreBEPIndexPage';
import PreBEPChapters from '../components/prebep/document/PreBEPChapters';
import PreBEPPageSlicer from '../components/prebep/document/PreBEPPageSlicer';

// Paneles de Control y Modales
import PreBEPToolbar from '../components/prebep/panels/PreBEPToolbar';
import PreBEPThumbnails from '../components/prebep/panels/PreBEPThumbnails';
import PreBEPControlPanel from '../components/prebep/panels/PreBEPControlPanel';
import PreBEPExplorerModal from '../components/prebep/panels/PreBEPExplorerModal';

import { CHAPTER_LABELS } from '../components/prebep/utils/preBepHelpers';

export default function PreBEPView() {
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId') || '';

  // 1. Hook de Carga de Datos
  const {
    loading,
    refreshing,
    loadData,
    project,
    pebInfo,
    specialties,
    bepTeam,
    staff,
    contacts,
    requirements,
    lodTdi,
    protocols,
    spaces,
    materials,
    documents,
    tasks,
    plans,
    software,
    objectives,
    bimUses,
    deliverables,
    availableTables,
    dbData
  } = usePreBEPData(projectId);

  // 2. Hook de Configuración y Preferencias
  const config = usePreBEPConfig(projectId, protocols);

  // Medición de altura real del contenido continuo
  const [contentHeightMm, setContentHeightMm] = useState(0);
  const hiddenMeasureRef = useRef(null);

  useEffect(() => {
    if (!hiddenMeasureRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const heightPx = entry.contentRect.height;
        const heightMm = Math.round(heightPx * (25.4 / 96));
        setContentHeightMm(heightMm);
      }
    });
    observer.observe(hiddenMeasureRef.current);
    return () => observer.disconnect();
  }, [loading, config.activeView]);

  // Numeración dinámica de capítulos
  const getChapterNum = (key) => {
    const visibleActive = config.chapterOrder.filter(k => config.chapterVisibility[k]);
    const idx = visibleActive.indexOf(key);
    return idx !== -1 ? idx + 1 : '';
  };

  const getChapterLabel = (key) => {
    if (key.startsWith('custom_')) {
      const sec = config.customSections.find(s => s.id === key);
      return sec ? sec.title : 'Sección Personalizada';
    }
    return CHAPTER_LABELS[key] || key.toUpperCase();
  };

  // Construcción de tablas activas para el índice
  const activeTables = useMemo(() => {
    const tables = [];
    let tableCounter = 1;

    config.chapterOrder.forEach(key => {
      if (!config.chapterVisibility[key]) return;

      if (key.startsWith('custom_')) {
        const customSec = config.customSections.find(s => s.id === key);
        if (customSec) {
          const tableData = dbData[customSec.tableId || customSec.table]?.records || dbData[customSec.tableId || customSec.table] || [];
          const record = tableData.find(r => r.id === customSec.recordId);
          if (record && !(customSec.table === 'resources' && record.blocks && record.blocks.length > 0)) {
            tables.push({
              id: key,
              title: `INFORMACIÓN DE ${TABLE_METADATA[customSec.tableId || customSec.table]?.displayName || customSec.tableId || customSec.table}: ${customSec.title}`,
              number: tableCounter++
            });
          }
        }
      } else {
        switch (key) {
          case 'datos':
            tables.push({ id: 'datos_gral', title: 'INFORMACIÓN GENERAL', number: tableCounter++ });
            if (pebInfo) tables.push({ id: 'datos_areas', title: 'ÁREAS DEL PROYECTO', number: tableCounter++ });
            break;
          case 'unidades':
            if (spaces.length > 0) tables.push({ id: 'unidades_subproyectos', title: 'SUB PROYECTOS / FASES', number: tableCounter++ });
            break;
          case 'directorio':
            if (bepTeam.length > 0) tables.push({ id: 'directorio_bep', title: 'EQUIPO BIM (BEP TEAM)', number: tableCounter++ });
            if (staff.length > 0) tables.push({ id: 'directorio_staff', title: 'DIRECTORIO INTERNO (STAFF)', number: tableCounter++ });
            if (contacts.length > 0) tables.push({ id: 'directorio_contactos', title: 'DIRECTORIO EXTERNO (CONTACTOS)', number: tableCounter++ });
            if (specialties.length > 0) tables.push({ id: 'directorio_especialidades', title: 'CATÁLOGO DE ESPECIALIDADES', number: tableCounter++ });
            break;
          case 'software':
            if (software.length > 0) tables.push({ id: 'software_tabla', title: 'SOFTWARE Y PLATAFORMAS', number: tableCounter++ });
            break;
          case 'lod_tdi':
            if (lodTdi.length > 0) tables.push({ id: 'lod_tdi_matriz', title: 'MATRIZ LOD / TDI', number: tableCounter++ });
            tables.push({ id: 'lod_tdi_ref', title: 'MATRIZ REFERENCIAL TDI POR NIVEL LOD', number: tableCounter++ });
            break;
          case 'materiales':
            if (materials.length > 0) tables.push({ id: 'materiales_tabla', title: 'BASE DE DATOS DE MATERIALES', number: tableCounter++ });
            break;
          case 'calendario':
            if (tasks.length > 0) tables.push({ id: 'calendario_tabla', title: 'CALENDARIO DE TAREAS', number: tableCounter++ });
            break;
          case 'objetivos':
            if (objectives.length > 0) tables.push({ id: 'objetivos_tabla', title: 'OBJETIVOS DEL PROYECTO', number: tableCounter++ });
            if (bimUses.length > 0) tables.push({ id: 'objetivos_usos', title: 'USOS BIM', number: tableCounter++ });
            break;
          case 'cronograma_entregas':
            if (deliverables.length > 0) tables.push({ id: 'entregas_tabla', title: 'CRONOGRAMA DE ENTREGAS', number: tableCounter++ });
            break;
          case 'herramientas':
            tables.push({ id: 'herramientas_tabla', title: 'HERRAMIENTAS BIM', number: tableCounter++ });
            break;
          default:
            break;
        }
      }
    });

    return tables;
  }, [config.chapterOrder, config.chapterVisibility, config.customSections, dbData, pebInfo, spaces, bepTeam, staff, contacts, specialties, software, lodTdi, materials, tasks, objectives, bimUses, deliverables]);

  const renderTableTitle = (id) => {
    const table = activeTables.find(t => t.id === id);
    if (!table) return null;
    return (
      <div className="bg-[#1c1c19] text-white text-[9px] font-black uppercase tracking-wider px-3 py-1.5 flex justify-between items-center w-full">
        <span>TABLA {table.number}: {table.title}</span>
      </div>
    );
  };

  // Renderizado del documento continuo memorizado
  const renderedDocument = useMemo(() => {
    return (
      <div className="continuous-document-content w-full flex flex-col items-center bg-white text-[#1c1c19]">
        <PreBEPCoverPage 
          project={project} 
          projectId={projectId} 
          availableTablesCount={availableTables.length} 
        />

        <div className="w-full border-t border-dashed border-gray-400 my-8"></div>

        {config.showIndex && (
          <PreBEPIndexPage 
            chapterOrder={config.chapterOrder}
            chapterVisibility={config.chapterVisibility}
            getChapterNum={getChapterNum}
            getChapterLabel={getChapterLabel}
            activeTables={activeTables}
          />
        )}

        <PreBEPChapters 
          projectId={projectId}
          project={project}
          pebInfo={pebInfo}
          specialties={specialties}
          bepTeam={bepTeam}
          staff={staff}
          contacts={contacts}
          requirements={requirements}
          lodTdi={lodTdi}
          spaces={spaces}
          materials={materials}
          documents={documents}
          tasks={tasks}
          plans={plans}
          software={software}
          objectives={objectives}
          bimUses={bimUses}
          deliverables={deliverables}
          dbData={dbData}
          customSections={config.customSections}
          chapterOrder={config.chapterOrder}
          chapterVisibility={config.chapterVisibility}
          getChapterNum={getChapterNum}
          renderTableTitle={renderTableTitle}
          // Visibilidad de columnas
          subproyectosVisibleColumns={config.subproyectosVisibleColumns}
          equipoVisibleColumns={config.equipoVisibleColumns}
          directorioVisibleColumns={config.directorioVisibleColumns}
          softwareVisibleColumns={config.softwareVisibleColumns}
          lodVisibleColumns={config.lodVisibleColumns}
          lodExpandedDisciplines={config.lodExpandedDisciplines}
          toggleLodDiscipline={config.toggleLodDiscipline}
          materialesVisibleColumns={config.materialesVisibleColumns}
          calendarioVisibleColumns={config.calendarioVisibleColumns}
          objetivosVisibleColumns={config.objetivosVisibleColumns}
          entregasVisibleColumns={config.entregasVisibleColumns}
          // Protocolos
          orderedProtocols={config.orderedProtocols}
          showFullProtocols={config.showFullProtocols}
          expandedProtocols={config.expandedProtocols}
          toggleProtocol={config.toggleProtocol}
          expandedSubItems={config.expandedSubItems}
          toggleSubItem={config.toggleSubItem}
        />
      </div>
    );
  }, [
    project,
    projectId,
    availableTables,
    config,
    activeTables,
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
    dbData
  ]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen w-full bg-[#f0ede6] font-mono">
        <Loader2 className="w-12 h-12 animate-spin text-[#0f4369] mb-4" />
        <p className="font-black text-xs uppercase tracking-widest text-[#1c1c19]">Compilando Base de Datos Pre-BEP...</p>
        <span className="text-[10px] text-gray-500 mt-2 font-bold uppercase">Extrayendo requerimientos de proyecto</span>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-[#f0ede6] overflow-hidden font-mono text-[#1c1c19] select-text prebep-print-root">
      {/* 1. Header Toolbar */}
      <PreBEPToolbar 
        project={project}
        refreshing={refreshing}
        loadData={loadData}
        activeView={config.activeView}
        setActiveView={config.setActiveView}
        pageHeights={config.pageHeights}
        addPage={config.addPage}
        deletePage={config.deletePage}
        resetPages={config.resetPages}
        configSaveStatus={config.configSaveStatus}
      />

      {/* 2. Cuerpo Principal */}
      <div className="flex-1 flex overflow-hidden w-full relative print:block print:overflow-visible">
        {/* Vista Documento: Barra de Miniaturas + Slicer de Páginas */}
        {config.activeView === 'document' && (
          <>
            <PreBEPThumbnails 
              pageHeights={config.pageHeights}
              contentHeightMm={contentHeightMm}
            />

            <PreBEPPageSlicer 
              pageHeights={config.pageHeights}
              setPageHeights={config.setPageHeights}
              contentHeightMm={contentHeightMm}
              configSaveStatus={config.configSaveStatus}
              addPage={config.addPage}
              deletePage={config.deletePage}
              resetPages={config.resetPages}
              handlePageHeightChange={config.handlePageHeightChange}
              renderedDocument={renderedDocument}
            />
          </>
        )}

        {/* Vista Panel de Control */}
        {config.activeView === 'control_panel' && (
          <PreBEPControlPanel 
            projectId={projectId}
            chapterOrder={config.chapterOrder}
            chapterVisibility={config.chapterVisibility}
            handleChapterVisibilityChange={config.handleChapterVisibilityChange}
            handleOrderChange={config.handleOrderChange}
            getChapterLabel={getChapterLabel}
            customSections={config.customSections}
            handleRemoveCustomSection={config.handleRemoveCustomSection}
            orderedProtocols={config.orderedProtocols}
            showFullProtocols={config.showFullProtocols}
            toggleProtocolsDisplay={config.toggleProtocolsDisplay}
            expandedProtocols={config.expandedProtocols}
            toggleProtocol={config.toggleProtocol}
            expandedSubItems={config.expandedSubItems}
            toggleSubItem={config.toggleSubItem}
            handleProtocolOrderChange={config.handleProtocolOrderChange}
            customImportTable={config.customImportTable}
            setCustomImportTable={config.setCustomImportTable}
            customImportSelectedIds={config.customImportSelectedIds}
            setCustomImportSelectedIds={config.setCustomImportSelectedIds}
            customImportSearchQuery={config.customImportSearchQuery}
            setCustomImportSearchQuery={config.setCustomImportSearchQuery}
            handleAddCustomSection={config.handleAddCustomSection}
            availableTables={availableTables}
            dbData={dbData}
            activeConfigTab={config.activeConfigTab}
            setActiveConfigTab={config.setActiveConfigTab}
            subproyectosVisibleColumns={config.subproyectosVisibleColumns}
            handleSubproyectosColumnToggle={config.handleSubproyectosColumnToggle}
            equipoVisibleColumns={config.equipoVisibleColumns}
            handleEquipoColumnToggle={config.handleEquipoColumnToggle}
            directorioVisibleColumns={config.directorioVisibleColumns}
            handleDirectorioColumnToggle={config.handleDirectorioColumnToggle}
            softwareVisibleColumns={config.softwareVisibleColumns}
            handleSoftwareColumnToggle={config.handleSoftwareColumnToggle}
            lodVisibleColumns={config.lodVisibleColumns}
            handleLodColumnToggle={config.handleLodColumnToggle}
            lodExpandedDisciplines={config.lodExpandedDisciplines}
            toggleLodDiscipline={config.toggleLodDiscipline}
            materialesVisibleColumns={config.materialesVisibleColumns}
            handleMaterialesColumnToggle={config.handleMaterialesColumnToggle}
            calendarioVisibleColumns={config.calendarioVisibleColumns}
            handleCalendarioColumnToggle={config.handleCalendarioColumnToggle}
            objetivosVisibleColumns={config.objetivosVisibleColumns}
            handleObjetivosColumnToggle={config.handleObjetivosColumnToggle}
            entregasVisibleColumns={config.entregasVisibleColumns}
            handleEntregasColumnToggle={config.handleEntregasColumnToggle}
            spaces={spaces}
            bepTeam={bepTeam}
            staff={staff}
            contacts={contacts}
            software={software}
            lodTdi={lodTdi}
            specialties={specialties}
            materials={materials}
            tasks={tasks}
            objectives={objectives}
            bimUses={bimUses}
            deliverables={deliverables}
          />
        )}
      </div>

      {/* 3. Modal de Explorador de Base de Datos */}
      <PreBEPExplorerModal 
        selectedExplorerTable={config.selectedExplorerTable}
        setSelectedExplorerTable={config.setSelectedExplorerTable}
        searchQuery={config.searchQuery}
        setSearchQuery={config.setSearchQuery}
        dbData={dbData}
        projectId={projectId}
      />

      {/* 4. Div oculto fuera de pantalla para medir la altura real en mm del contenido */}
      <div 
        ref={hiddenMeasureRef}
        aria-hidden="true"
        className="no-print pointer-events-none"
        style={{
          position: 'absolute',
          left: '-9999px',
          top: 0,
          width: '215.9mm',
          paddingLeft: '20mm',
          paddingRight: '20mm',
          boxSizing: 'border-box',
          visibility: 'hidden',
          height: 'auto'
        }}
      >
        {renderedDocument}
      </div>

      {/* 5. Estilos de Impresión y Vista Previa */}
      <style dangerouslySetInnerHTML={{__html: `
        /* ── Pantalla (vista previa) ── */
        .page-container { margin-bottom: 24px; }

        .page-wrapper {
          box-sizing: border-box;
          transition: height 0.1s ease-out;
          outline: 4px solid #1c1c19;
          outline-offset: -4px;
        }

        .markdown-content img {
          max-width: 100% !important;
          height: auto !important;
          display: block;
          margin: 10px 0;
        }

        /* ── IMPRESIÓN ── */
        @media print {
          @page {
            margin: 20mm 0mm !important;
            size: letter portrait;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
          }

          .no-print { display: none !important; }

          .prebep-print-root {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            overflow: visible !important;
            height: auto !important;
          }

          .prebep-pages-scroll {
            display: block !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            height: auto !important;
          }

          .page-container {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
          }

          .empty-page { display: none !important; }

          .normal-page {
            page-break-after: always !important;
            break-after: page !important;
          }
          .last-page {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          .page-wrapper {
            display: block !important;
            position: relative !important;
            box-shadow: none !important;
            outline: none !important;
            border: none !important;
            margin: 0 auto !important;
            padding: 0 !important;
            width: 215.9mm !important;
            height: var(--page-print-height) !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .page-clip-inner {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .continuous-document-content,
          .continuous-document-content * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}} />
    </div>
  );
}
