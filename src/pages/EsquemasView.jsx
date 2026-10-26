import React, { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FolderOpen, Network, Wand2, Cpu, FileJson } from 'lucide-react';
import { useSchemaLogic } from './Esquemas/useSchemaLogic';
import MindMapNode from './Esquemas/MindMapNode';
import Connector from './Esquemas/Connector';
import SchemaHUD from './Esquemas/SchemaHUD';
import SchemaList from './Esquemas/SchemaList';
import NewSchemaModal from './Esquemas/NewSchemaModal';
import NodeEditorModal from './Esquemas/NodeEditorModal';
import NodeJsonOperationsModal from './Esquemas/NodeJsonOperationsModal';
import UniversalJsonImportModal from './Esquemas/UniversalJsonImportModal';
import RevitActionsTabView from './Esquemas/RevitActionsTabView';
import ContextMenu from './Esquemas/ContextMenu';
import UniversalPreviewModal from './Esquemas/UniversalPreviewModal';
import CdeExplorerView from './Esquemas/CdeExplorerView';
import BimPlannerModal from './Esquemas/BimPlannerModal';
import { extractRevitActionsFromTree } from './Esquemas/schemaAiPrompt';

const EsquemasView = ({ projectId: propProjectId = null }) => {
  const { schemaId, id } = useParams();
  const [searchParams] = useSearchParams();
  const urlSchemaId = schemaId || id;
  const projectId = propProjectId || searchParams.get('projectId') || null;
  const initialTab = searchParams.get('tab');
  const navigate = useNavigate();
  const isAdmin = true;

  const {
    schemas,
    selectedSchema,
    setSelectedSchema,
    mapData,
    loading,
    isSaving,
    panOffset,
    setPanOffset,
    zoom,
    setZoom,
    isDragging,
    setIsDragging,
    setDragStart,
    containerRef,
    selectedNodeIds,
    setSelectedNodeIds,
    selectionBox,
    setSelectionBox,
    isolatedNodeId,
    isLocked,
    setIsLocked,
    isCreatorMode,
    setIsCreatorMode,
    allBranchesExpanded,
    allDataExpanded,
    isHighlighterActive,
    setIsHighlighterActive,
    markerColor,
    setMarkerColor,
    editingNode,
    setEditingNode,
    parentForNewNode,
    setParentForNewNode,
    contextMenu,
    setContextMenu,
    showJsonView,
    setShowJsonView,
    nodeForJsonModal,
    setNodeForJsonModal,
    showUniversalJsonModal,
    setShowUniversalJsonModal,
    showNewSchemaModal,
    setShowNewSchemaModal,
    previewNode,
    setPreviewNode,
    showBimPlannerModal,
    setShowBimPlannerModal,
    viewMode,
    setViewMode,
    connectingData,
    visibleNodes,
    handleSelectSchema,
    handleCreateSchema,
    handleDeleteSchema,
    centerOnRoot,
    handleToggleText,
    handleToggleBranch,
    handleGlobalTreeToggle,
    handleGlobalDataToggle,
    handleIsolateNode,
    handleAutoOrganize,
    handleUpdateCableOffset,
    handleSaveNodeContent,
    handleDeleteNode,
    handleQuickAddChild,
    handleAddActionNodeToBranch,
    handleInjectPresetBranch,
    handleNodeResize,
    handleSaveNode,
    handleCutConnection,
    handleInsertIntermediateNode,
    handleDuplicateBranch,
    handleImportJsonToNode,
    handleUniversalJsonImport,
    handleStartDragNode,
    handleStartConnect,
    handleCompleteConnect,
    handleMouseMove,
    handleMouseUp,
    handleWheel,
    handleCopyAiPrompt
  } = useSchemaLogic(urlSchemaId, navigate, projectId, initialTab);

  const revitActionsCount = useMemo(
    () => extractRevitActionsFromTree(mapData).length,
    [mapData]
  );

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;

    if (e.shiftKey) {
      const rect = containerRef.current.getBoundingClientRect();
      const startX = (e.clientX - rect.left - panOffset.x) / zoom;
      const startY = (e.clientY - rect.top - panOffset.y) / zoom;
      setSelectionBox({ startX, startY, endX: startX, endY: startY });
    } else {
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      setSelectedNodeIds(new Set());
      setContextMenu(null);
    }
  };

  if (!selectedSchema && (projectId || !urlSchemaId)) {
    return (
      <>
        <SchemaList
          schemas={schemas}
          onSelect={(s) => {
            handleSelectSchema(s);
            if (!projectId) navigate(`/esquemas/${s.id}`);
          }}
          onDelete={handleDeleteSchema}
          onCreateNew={() => setShowNewSchemaModal(true)}
          isAdmin={isAdmin}
        />
        {showNewSchemaModal && (
          <NewSchemaModal
            onSave={handleCreateSchema}
            onCancel={() => setShowNewSchemaModal(false)}
          />
        )}
      </>
    );
  }

  return (
    <div
      ref={containerRef}
      onMouseDown={viewMode === 'canvas' ? handleMouseDown : undefined}
      onMouseMove={viewMode === 'canvas' ? handleMouseMove : undefined}
      onMouseUp={viewMode === 'canvas' ? handleMouseUp : undefined}
      onWheel={viewMode === 'canvas' ? handleWheel : undefined}
      className="relative w-full h-screen bg-[#fcf9f4] overflow-hidden select-none font-sans"
    >
      {/* Blueprint Grid Background */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(#1c1c19 2px, transparent 2px), linear-gradient(to right, #1c1c19 1px, transparent 1px), linear-gradient(to bottom, #1c1c19 1px, transparent 1px)`,
          backgroundSize: `${20 * zoom}px ${20 * zoom}px, ${100 * zoom}px ${100 * zoom}px, ${100 * zoom}px ${100 * zoom}px`,
          backgroundPosition: `${panOffset.x}px ${panOffset.y}px`
        }}
      />

      {/* TOP NAVIGATION BAR & TABS (MAPA DE ESQUEMA | PESTAÑA ACCIONES REVIT | EXPLORADOR CDE) */}
      <div className="fixed top-4 left-4 right-4 z-[120] flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => {
              setSelectedSchema(null);
              if (!projectId) navigate('/esquemas');
            }}
            className="p-2.5 bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:bg-[#1c1c19] hover:text-white transition-all flex items-center gap-2 font-black text-xs uppercase"
          >
            <ArrowLeft size={16} strokeWidth={3} />
            <span className="hidden sm:inline">Esquemas</span>
          </button>

          <div className="bg-[#1c1c19] text-white px-3.5 py-2 border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(15,67,105,1)]">
            <span className="font-mono text-[7px] uppercase tracking-[0.2em] block opacity-60">
              ESQUEMA ACTIVO {isSaving ? '• GUARDANDO...' : ''}
            </span>
            <h2 className="text-xs font-black uppercase tracking-tight truncate max-w-[240px]">
              {selectedSchema?.title || mapData.name}
            </h2>
          </div>
        </div>

        {/* Center/Right: View Switcher Tabs + Quick AI/JSON Actions */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* 3-Tab Switcher */}
          <div className="flex bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,1)] p-0.5">
            <button
              onClick={() => setViewMode('canvas')}
              className={`px-3 py-1.5 flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider transition-all ${
                viewMode === 'canvas'
                  ? 'bg-[#0f4369] text-white'
                  : 'text-[#1c1c19] hover:bg-[#e5e2dd]'
              }`}
            >
              <Network size={13} />
              <span>1. Mapa de Esquema</span>
            </button>

            <button
              onClick={() => setViewMode('revit_actions')}
              className={`px-3 py-1.5 flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider transition-all ${
                viewMode === 'revit_actions'
                  ? 'bg-[#0f4369] text-white'
                  : 'text-[#1c1c19] hover:bg-[#e5e2dd]'
              }`}
            >
              <Cpu size={13} className={viewMode === 'revit_actions' ? 'text-yellow-400' : 'text-[#0f4369]'} />
              <span>2. Pestaña Acciones Revit</span>
              <span className="px-1.5 py-0.2 bg-yellow-400 text-[#1c1c19] font-mono text-[9px] font-black rounded-sm">
                {revitActionsCount}
              </span>
            </button>

            <button
              onClick={() => setViewMode('cde')}
              className={`px-3 py-1.5 flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider transition-all ${
                viewMode === 'cde'
                  ? 'bg-[#0f4369] text-white'
                  : 'text-[#1c1c19] hover:bg-[#e5e2dd]'
              }`}
            >
              <FolderOpen size={13} />
              <span className="hidden md:inline">3. Explorador CDE</span>
            </button>
          </div>

          {/* Universal JSON + AI Prompt Button */}
          <button
            onClick={() => setShowUniversalJsonModal(true)}
            className="px-3.5 py-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:bg-[#1c1c19] transition-all flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider"
            title="Generar Prompt IA o Inyectar JSON de Acciones Revit / Esquema"
          >
            <FileJson size={14} className="text-yellow-400" />
            <span>JSON / Prompt IA Revit</span>
          </button>

          {/* BIM Planner Button */}
          <button
            onClick={() => setShowBimPlannerModal(true)}
            className="px-3 py-2 bg-[#fcf9f4] text-[#1c1c19] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:bg-[#1c1c19] hover:text-white transition-all flex items-center gap-1.5 font-black text-[10px] uppercase tracking-wider"
          >
            <Wand2 size={13} />
            <span className="hidden lg:inline">BIM Planner</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: MINDMAP CANVAS (MARKDOWN ENGINE + REVIT LAYER) */}
      {viewMode === 'canvas' && (
        <>
          <div
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0'
            }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* SVG Connections Layer */}
            <svg className="absolute inset-0 w-[10000px] h-[10000px] overflow-visible pointer-events-none">
              {visibleNodes.map((node) => {
                if (!node.children || !node.isBranchExpanded) return null;
                return node.children.map((child) => {
                  const target = visibleNodes.find((n) => n.id === child.id);
                  if (!target) return null;

                  const isTargetLeftOfParent = target.x + target.width / 2 < node.x + node.width / 2;
                  const startX = isTargetLeftOfParent ? node.x : node.x + node.width;
                  const startY = node.y + node.height / 2;
                  const endX = isTargetLeftOfParent ? target.x + target.width : target.x;
                  const endY = target.y + target.height / 2;

                  return (
                    <Connector
                      key={`${node.id}-${target.id}`}
                      start={{ x: startX, y: startY }}
                      end={{ x: endX, y: endY }}
                      parentId={node.id}
                      childId={target.id}
                      cableOffset={target.cableOffset}
                      onUpdateOffset={handleUpdateCableOffset}
                      onCut={handleCutConnection}
                      onInsert={handleInsertIntermediateNode}
                      onDuplicate={handleDuplicateBranch}
                      isAdmin={isAdmin}
                      zoom={zoom}
                      isRevitAction={target.blockType === 'revit_action' || !!target.revitAction}
                    />
                  );
                });
              })}

              {/* Active Connection Dragging Line */}
              {connectingData && (
                <path
                  d={`M ${connectingData.startX} ${connectingData.startY} C ${
                    connectingData.startX + (connectingData.currX - connectingData.startX) / 2
                  } ${connectingData.startY}, ${
                    connectingData.startX + (connectingData.currX - connectingData.startX) / 2
                  } ${connectingData.currY}, ${connectingData.currX} ${connectingData.currY}`}
                  fill="none"
                  stroke="#e62020"
                  strokeWidth="4"
                  strokeDasharray="6 4"
                />
              )}
            </svg>

            {/* Nodes Layer */}
            <div className="pointer-events-auto">
              {visibleNodes.map((node) => (
                <MindMapNode
                  key={node.id}
                  node={node}
                  onSelect={(id, multi) => {
                    if (multi) {
                      const next = new Set(selectedNodeIds);
                      if (next.has(id)) next.delete(id);
                      else next.add(id);
                      setSelectedNodeIds(next);
                    } else {
                      setSelectedNodeIds(new Set([id]));
                    }
                  }}
                  onToggleText={handleToggleText}
                  onToggleBranch={handleToggleBranch}
                  onStartConnect={handleStartConnect}
                  onCompleteConnect={handleCompleteConnect}
                  onStartDrag={handleStartDragNode}
                  onContextMenu={(e, n) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, node: n });
                  }}
                  onQuickAdd={(parent, side) => handleQuickAddChild(parent, side)}
                  onDeleteNode={handleDeleteNode}
                  onOpenJsonModal={(n) => setNodeForJsonModal(n)}
                  onSaveNodeContent={handleSaveNodeContent}
                  onNodeResize={handleNodeResize}
                  allSchemas={schemas}
                  onNavigateSchema={(targetSchemaId) => {
                    const found = schemas.find((s) => String(s.id) === String(targetSchemaId));
                    if (found) {
                      handleSelectSchema(found);
                      if (!projectId) navigate(`/esquemas/${found.id}`);
                    }
                  }}
                  isSelected={selectedNodeIds.has(node.id)}
                  isIsolated={isolatedNodeId === node.id}
                  isCreatorMode={isCreatorMode}
                  isHighlighterActive={isHighlighterActive}
                  isConnecting={!!connectingData}
                  isAdmin={isAdmin}
                />
              ))}
            </div>

            {/* Selection Box */}
            {selectionBox && (
              <div
                style={{
                  left: Math.min(selectionBox.startX, selectionBox.endX),
                  top: Math.min(selectionBox.startY, selectionBox.endY),
                  width: Math.abs(selectionBox.endX - selectionBox.startX),
                  height: Math.abs(selectionBox.endY - selectionBox.startY)
                }}
                className="absolute border-2 border-[#0f4369] bg-[#0f4369]/10 pointer-events-none z-50"
              />
            )}
          </div>

          {/* Floating HUD Controls */}
          <SchemaHUD
            zoom={zoom}
            setZoom={setZoom}
            panOffset={panOffset}
            setPanOffset={setPanOffset}
            containerRef={containerRef}
            centerOnRoot={centerOnRoot}
            allBranchesExpanded={allBranchesExpanded}
            handleGlobalTreeToggle={handleGlobalTreeToggle}
            allDataExpanded={allDataExpanded}
            handleGlobalDataToggle={handleGlobalDataToggle}
            isHighlighterActive={isHighlighterActive}
            setIsHighlighterActive={setIsHighlighterActive}
            markerColor={markerColor}
            setMarkerColor={setMarkerColor}
            isLocked={isLocked}
            setIsLocked={setIsLocked}
            isCreatorMode={isCreatorMode}
            setIsCreatorMode={setIsCreatorMode}
            selectedNodeIds={selectedNodeIds}
            handleIsolateNode={handleIsolateNode}
            handleAutoOrganize={handleAutoOrganize}
            isAdmin={isAdmin}
            showJsonView={showJsonView}
            setShowJsonView={() => setShowUniversalJsonModal(true)}
          />
        </>
      )}

      {/* VIEW 2: PESTAÑA DE ACCIONES Y PROCESOS REVIT */}
      {viewMode === 'revit_actions' && (
        <RevitActionsTabView
          mapData={mapData}
          schemaTitle={selectedSchema?.title || mapData.name}
          onSaveNodeContent={handleSaveNodeContent}
          onDeleteNode={handleDeleteNode}
          onAddActionNodeToBranch={handleAddActionNodeToBranch}
          onInjectPresetBranch={handleInjectPresetBranch}
          onOpenUniversalJsonModal={() => setShowUniversalJsonModal(true)}
          onSwitchToCanvas={(nodeId) => {
            setSelectedNodeIds(new Set([nodeId]));
            setViewMode('canvas');
          }}
        />
      )}

      {/* VIEW 3: CDE EXPLORER */}
      {viewMode === 'cde' && (
        <div className="w-full h-full pt-20 px-8 pb-8 overflow-y-auto">
          <CdeExplorerView
            mapData={mapData}
            onPreviewNode={(n) => setPreviewNode(n)}
            onEditNode={(n) => setEditingNode(n)}
            onAddChild={(parent) => setParentForNewNode(parent)}
          />
        </div>
      )}

      {/* MODALS & OVERLAYS */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          node={contextMenu.node}
          onClose={() => setContextMenu(null)}
          onEdit={() => {
            setEditingNode(contextMenu.node);
            setContextMenu(null);
          }}
          onAddChild={() => {
            handleQuickAddChild(contextMenu.node, 'right');
            setContextMenu(null);
          }}
          onDelete={() => {
            handleDeleteNode(contextMenu.node.id);
            setContextMenu(null);
          }}
          onDuplicate={(e) => {
            handleDuplicateBranch(e, contextMenu.node.id);
            setContextMenu(null);
          }}
          onOpenJson={() => {
            setNodeForJsonModal(contextMenu.node);
            setContextMenu(null);
          }}
        />
      )}

      {(editingNode || parentForNewNode) && (
        <NodeEditorModal
          node={editingNode}
          parent={parentForNewNode}
          onSave={handleSaveNode}
          onCancel={() => {
            setEditingNode(null);
            setParentForNewNode(null);
          }}
        />
      )}

      {nodeForJsonModal && (
        <NodeJsonOperationsModal
          node={nodeForJsonModal}
          mapData={mapData}
          onImport={handleImportJsonToNode}
          onCancel={() => setNodeForJsonModal(null)}
          onCopyPrompt={() => handleCopyAiPrompt(nodeForJsonModal)}
        />
      )}

      <UniversalJsonImportModal
        isOpen={showUniversalJsonModal}
        onClose={() => setShowUniversalJsonModal(false)}
        onImport={handleUniversalJsonImport}
        currentTitle={selectedSchema?.title || mapData.name}
        mapData={mapData}
      />

      {previewNode && (
        <UniversalPreviewModal
          node={previewNode}
          onClose={() => setPreviewNode(null)}
        />
      )}

      {showBimPlannerModal && (
        <BimPlannerModal
          isOpen={showBimPlannerModal}
          onClose={() => setShowBimPlannerModal(false)}
          onGenerateSchema={async (generatedTree) => {
            await handleUniversalJsonImport(generatedTree, true);
            setShowBimPlannerModal(false);
          }}
        />
      )}

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[500] bg-[#fcf9f4]/80 backdrop-blur-md flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-[#1c1c19] border-t-[#0f4369] animate-spin mb-4" />
          <span className="font-mono text-[10px] font-black uppercase tracking-[0.3em]">
            Sincronizando Esquema & Acciones Revit...
          </span>
        </div>
      )}
    </div>
  );
};

export default EsquemasView;
