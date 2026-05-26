import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Database, FileText, X, Upload, ChevronRight, Activity, Lock } from 'lucide-react';
import { useNavigate, useParams, useLocation, useSearchParams } from 'react-router-dom';

// Layout & Context
import { useAuth } from '../context/AuthContext';

// Modularized Components
import SchemaList from './Esquemas/SchemaList';
import SchemaHUD from './Esquemas/SchemaHUD';
import MindMapNode from './Esquemas/MindMapNode';
import Connector from './Esquemas/Connector';
import EsquemaNodeModal from './Esquemas/EsquemaNodeModal';
import DeleteConfirmationModal from './Esquemas/DeleteConfirmationModal';
import NodeJsonOperationsModal from './Esquemas/NodeJsonOperationsModal';
import BimFolderExplorer from '../components/BIM/BimFolderExplorer';
import BimImplementationPlanner from '../components/BIM/BimImplementationPlanner';
import { PROMPTS } from '../config/aiPrompts';

// Hooks & Logic
import { useSchemaLogic } from './Esquemas/useSchemaLogic';



export default function EsquemasView({ isAdminView }) {
  const { t } = useTranslation();
  const { isAdmin: authIsAdmin, isBimManager, setBimManager } = useAuth();

  const [passkey, setPasskey] = React.useState('');
  const [authError, setAuthError] = React.useState('');

  const isAdmin = (authIsAdmin && isAdminView) || isBimManager;
  const { schemaId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const projectId = searchParams.get('projectId');

  const { state, handlers, centerOnRoot } = useSchemaLogic(schemaId, isAdmin, navigate, isAdminView ? null : projectId, isAdminView);
  const basePath = (isAdminView && (authIsAdmin || isBimManager)) ? '/esquemaEdit' : '/esquemaView';

  const handleUnlock = (e) => {
    e.preventDefault();
    if (passkey === '123123') {
      setBimManager(true);
      setAuthError('');
      if (schemaId) navigate(`/esquemaEdit/${schemaId}`);
      else navigate(`/esquemaEdit`);
    } else {
      setAuthError('INVALID_KEY');
    }
  };

  const {
    zoom, setZoom, panOffset, setPanOffset, containerRef, esquemas, activeEsquema, isLoading,
    isImportModalOpen, setIsImportModalOpen, importJsonText, setImportJsonText, isImporting,
    mapData, inspectedNode, setInspectedNode, draggingNodeId, selectedNodeIds, selectionBox,
    isLocked, setIsLocked, showJsonView, setShowJsonView, isCreatorMode, setIsCreatorMode,
    editingNodeId, setEditingNodeId, reconnectingData, reconnectTargetId, duplicatingData,
    isHighlighterActive, setIsHighlighterActive, markerColor, setMarkerColor, allBranchesExpanded,
    allDataExpanded, importTargetNode, setImportTargetNode, isSaving, isDirty, confirmDeleteId,
    setConfirmDeleteId, nodeLinks, treeNodes, dragHappened, isPanning, viewMode, setViewMode, projectsList
  } = state;

  const {
    handleCreateEsquema, handleDeleteEsquema, handleImportJson, toggleTextExpand, toggleBranchExpand,
    handleToggleHighlight, handleDeepToggleBranch, handleGlobalTreeToggle, handleGlobalDataToggle,
    handleIsolateNode, handleMouseDownMain, handleMouseMove, handleMouseUp, handleStartCut,
    handleInsertIntermediateNode, handleStartDuplicateBranch, handleSaveNode, handleSaveNodeName,
    handleAddSubNodeToTree, handleImportBranchToNode, handleDeleteNodeFromTree, executeDeleteNode,
    handleAutoOrganize, handleDragStart, handleSetNodeType, handleSetNodeCategory, handleSetStorageMode, handleUpdateNodeInPlanner, setCurrentPlan,
    handleAssignProject
  } = handlers;

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !activeEsquema) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const canvasMouseX = (mouseX - panOffset.x) / zoom;
      const canvasMouseY = (mouseY - panOffset.y) / zoom;
      const delta = -e.deltaY;
      const zoomIntensity = 0.001;
      let newZoom = Math.min(Math.max(0.1, zoom + delta * zoomIntensity * zoom), 3);
      const newPanX = mouseX - canvasMouseX * newZoom;
      const newPanY = mouseY - canvasMouseY * newZoom;
      setZoom(newZoom);
      setPanOffset({ x: newPanX, y: newPanY });
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [activeEsquema, zoom, panOffset, setZoom, setPanOffset, containerRef]);

  const copyAiPrompt = () => {
    navigator.clipboard.writeText(PROMPTS.esquemasMap);
    alert("Prompt para SISTEMA COMPLETO copiado.");
  };

  const copyBranchAiPrompt = (nodeName) => {
    navigator.clipboard.writeText(PROMPTS.esquemasExpand(nodeName));
    alert("Prompt para RAMA copiado. Pégalo en Gemini o ChatGPT.");
  };

  const maxX = treeNodes.length > 0 ? Math.max(...treeNodes.map(n => n.x + n.width), 1500) + 400 : 2000;
  const maxY = treeNodes.length > 0 ? Math.max(...treeNodes.map(n => n.y + n.height), 800) + 400 : 2000;

  return (
    <>
      <style>
        {`
          @media print {
            .no-print, header, nav, aside, .fixed.bottom-10, .fixed.top-24 { display: none !important; }
            body, html { background: white !important; overflow: visible !important; height: auto !important; width: auto !important; }
            .flex.h-screen { display: block !important; height: auto !important; overflow: visible !important; }
            main { overflow: visible !important; background: white !important; position: relative !important; width: 100% !important; height: auto !important; padding: 0 !important; margin: 0 !important; }
            canvas, svg, .absolute { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .absolute[style*="transform: translate"] { transform: none !important; position: relative !important; top: 0 !important; left: 0 !important; width: 100% !important; }
          }
        `}
      </style>

      {!activeEsquema ? (
        <SchemaList
          esquemas={esquemas}
          isLoading={isLoading}
          openEsquema={(esq) => navigate(`${basePath}/${esq.id}`)}
          handleCreateEsquema={handleCreateEsquema}
          handleDeleteEsquema={handleDeleteEsquema}
          setIsImportModalOpen={setIsImportModalOpen}
          isAdmin={isAdmin}
          isAdminView={isAdminView}
          isUnlocked={isBimManager || authIsAdmin}
          isBimManager={isBimManager}
          projectsList={projectsList}
          handleAssignProject={handleAssignProject}
        />
      ) : (
        <div className="flex-1 flex flex-col h-full relative">
          <div className="absolute top-4 left-4 right-4 z-[160] flex justify-between items-start pointer-events-none">
            <button
              onClick={handlers.handleBackToList}
              className="pointer-events-auto flex items-center gap-2 px-4 py-2 bg-white border-2 border-[#1c1c19] text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <ChevronRight size={14} className="rotate-180" /> LISTA_DE_ESQUEMAS
            </button>
            <div className="pointer-events-auto flex items-center gap-3">
              {/* BIM KEY moved to Assistant */}
            </div>
          </div>

          {viewMode === 'canvas' ? (
            <div
              id="esquemas-canvas"
              className={`flex-1 h-full w-full overflow-hidden relative ${isPanning || draggingNodeId || selectionBox ? 'cursor-grabbing select-none' : 'cursor-grab'} bg-[#fcf9f4]`}
              ref={containerRef}
              onMouseDown={handleMouseDownMain}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onAuxClick={(e) => { if (e.button === 1) e.preventDefault(); }}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.12]"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #1c1c19 1px, transparent 1px),
                    linear-gradient(to bottom, #1c1c19 1px, transparent 1px),
                    linear-gradient(to right, #1c1c19 2px, transparent 2px),
                    linear-gradient(to bottom, #1c1c19 2px, transparent 2px)
                  `,
                  backgroundSize: `${30 * zoom}px ${30 * zoom}px, ${30 * zoom}px ${30 * zoom}px, ${150 * zoom}px ${150 * zoom}px, ${150 * zoom}px ${150 * zoom}px`,
                  backgroundPosition: `${panOffset.x}px ${panOffset.y}px`
                }}
              />

              <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 transition-all duration-300 pointer-events-none">
                {isSaving ? (
                  <div className="bg-[#1c1c19] text-[#e5e2dd] px-4 py-2 border-2 border-[#1c1c19] shadow-[4px_4px_0_1px_rgba(0,255,249,0.5)] flex items-center gap-3 animate-pulse">
                    <Save size={14} className="animate-spin-slow" />
                    <span className="font-mono text-[9px] font-black tracking-[3px] uppercase">Sync h-16/Cloud</span>
                  </div>
                ) : isDirty ? (
                  <div className="bg-[#f6f3ee] text-[#1c1c19] px-4 py-2 border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] flex items-center gap-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                    <span className="font-mono text-[9px] font-black tracking-[3px] uppercase">Pending Edits</span>
                  </div>
                ) : activeEsquema && (
                  <div className="bg-white text-green-700 px-4 py-2 border-2 border-green-600 shadow-[4px_4px_0_0_rgba(22,101,52,0.1)] flex items-center gap-2 opacity-0 hover:opacity-100 transition-opacity">
                    <Database size={14} strokeWidth={3} />
                    <span className="font-mono text-[9px] font-black tracking-[3px] uppercase">Sys. Secured</span>
                  </div>
                )}
              </div>

              <div
                className="absolute"
                style={{
                  transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
                  transformOrigin: '0 0',
                  width: `${maxX}px`,
                  height: `${maxY}px`,
                  transition: isPanning ? 'none' : 'transform 0.1s ease-out'
                }}
              >
                <div className="relative w-full h-full">
                  <div
                    className="absolute border-[3px] border-[#1c1c19] bg-white shadow-2xl pointer-events-none z-[1]"
                    style={{ width: `${maxX - 100}px`, height: `${maxY - 100}px`, left: '50px', top: '50px' }}
                  />

                  <svg className="absolute top-0 left-0 pointer-events-none z-[15] overflow-visible" width={maxX} height={maxY}>
                    {treeNodes.map((parent) => {
                      if (!parent.children || !parent.isBranchExpanded) return null;
                      return parent.children.map((childRef) => {
                        const child = treeNodes.find(n => n.id === childRef.id);
                        if (!child) return null;
                        return (
                          <Connector
                            key={`${parent.id}-${child.id}`}
                            start={{ x: parent.x + parent.width, y: parent.y + parent.height / 2 }}
                            end={{ x: child.x, y: child.y + child.height / 2 }}
                            parentId={parent.id}
                            childId={child.id}
                            onCut={handleStartCut}
                            onInsert={handleInsertIntermediateNode}
                            onDuplicate={handleStartDuplicateBranch}
                            isAdmin={isAdmin}
                          />
                        );
                      });
                    })}

                    {reconnectingData && (
                      <line
                        x1={reconnectingData.mouseX} y1={reconnectingData.mouseY}
                        x2={treeNodes.find(n => n.id === reconnectingData.childId)?.x || reconnectingData.mouseX}
                        y2={(() => { const n = treeNodes.find(n => n.id === reconnectingData.childId); return n ? n.y + n.height / 2 : reconnectingData.mouseY; })()}
                        stroke={reconnectTargetId ? "#22c55e" : "#0f4369"} strokeWidth="4" strokeDasharray="5 5"
                      />
                    )}

                    {duplicatingData && (
                      <g>
                        <circle cx={duplicatingData.mouseX} cy={duplicatingData.mouseY} r="10" fill={reconnectTargetId ? "#22c55e" : "#0f4369"} opacity="0.6" className="animate-pulse" />
                        <text x={duplicatingData.mouseX + 15} y={duplicatingData.mouseY + 5} className="font-black text-[10px] fill-[#1c1c19] uppercase tracking-widest pointer-events-none">
                          DUPLICANDO: {duplicatingData.branchRootNode.name}
                        </text>
                        {reconnectTargetId && (
                          <line
                            x1={duplicatingData.mouseX} y1={duplicatingData.mouseY}
                            x2={treeNodes.find(n => n.id === reconnectTargetId).x + treeNodes.find(n => n.id === reconnectTargetId).width}
                            y2={treeNodes.find(n => n.id === reconnectTargetId).y + treeNodes.find(n => n.id === reconnectTargetId).height / 2}
                            stroke="#22c55e" strokeWidth="2" strokeDasharray="4 4"
                          />
                        )}
                      </g>
                    )}
                  </svg>

                  <div className="absolute top-0 left-0 w-full h-full z-10 pointer-events-auto">
                    {treeNodes.map((node) => (
                      <MindMapNode
                        key={node.id}
                        node={node}
                        toggleTextExpand={toggleTextExpand}
                        toggleBranchExpand={toggleBranchExpand}
                        onInspect={setInspectedNode}
                        onAddSubNode={handleAddSubNodeToTree}
                        onImportSubNodes={setImportTargetNode}
                        onDeepToggleBranch={handleDeepToggleBranch}
                        onToggleHighlight={handleToggleHighlight}
                        onDeleteNode={handleDeleteNodeFromTree}
                        onDragStart={handleDragStart}
                        isAdmin={isAdmin}
                        isAdminView={isAdminView}
                        dragHappened={dragHappened}
                        links={nodeLinks[node.id]}
                        navigate={navigate}
                        isDragging={draggingNodeId?.id === node.id}
                        isSelected={selectedNodeIds.has(node.id)}
                        isLocked={isLocked}
                        isEditing={editingNodeId === node.id}
                        onNameSave={handleSaveNodeName}
                        onStartEdit={setEditingNodeId}
                        isCreatorMode={isCreatorMode}
                        isHighlighterMode={isHighlighterActive}
                        onSetType={handleSetNodeType}
                        onSetCategory={handleSetNodeCategory}
                        onSetStorageMode={handleSetStorageMode}
                        projectId={projectId || activeEsquema?.project}
                      />
                    ))}

                    {selectionBox && (
                      <div
                        className="absolute border-2 border-[#0f4369] bg-[#0f4369]/10 pointer-events-none z-[1000]"
                        style={{
                          left: Math.min(selectionBox.startX, selectionBox.endX),
                          top: Math.min(selectionBox.startY, selectionBox.endY),
                          width: Math.abs(selectionBox.endX - selectionBox.startX),
                          height: Math.abs(selectionBox.endY - selectionBox.startY)
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 w-full h-full p-6 pt-24 bg-[#f6f3ee] flex flex-col items-center overflow-y-auto">
              <div className="w-full max-w-5xl h-full">
                <BimFolderExplorer
                  mapData={mapData}
                  title={activeEsquema?.name}
                />
                <div className="mt-8">
                  <BimImplementationPlanner
                    mapData={mapData}
                    title={activeEsquema?.name}
                    onUpdateNode={handleUpdateNodeInPlanner}
                    onSyncNode={setImportTargetNode}
                    isAdmin={isAdmin}
                  />
                </div>
              </div>
            </div>
          )}

          {viewMode === 'canvas' && (
            <SchemaHUD
              zoom={zoom} setZoom={setZoom} panOffset={panOffset} setPanOffset={setPanOffset}
              containerRef={containerRef} centerOnRoot={centerOnRoot}
              allBranchesExpanded={allBranchesExpanded} handleGlobalTreeToggle={handleGlobalTreeToggle}
              allDataExpanded={allDataExpanded} handleGlobalDataToggle={handleGlobalDataToggle}
              isHighlighterActive={isHighlighterActive} setIsHighlighterActive={setIsHighlighterActive}
              markerColor={markerColor} setMarkerColor={setMarkerColor}
              isLocked={isLocked} setIsLocked={setIsLocked}
              isCreatorMode={isCreatorMode} setIsCreatorMode={setIsCreatorMode}
              selectedNodeIds={selectedNodeIds} handleIsolateNode={handleIsolateNode}
              handleAutoOrganize={handleAutoOrganize} isAdmin={isAdmin}
              showJsonView={showJsonView} setShowJsonView={setShowJsonView}
            />
          )}
        </div>
      )}

      {/* Modals */}
      {inspectedNode && (
        <EsquemaNodeModal
          node={inspectedNode}
          activeEsquema={activeEsquema}
          onClose={() => setInspectedNode(null)}
          onSave={handleSaveNode}
          isAdmin={isAdmin}
        />
      )}

      {importTargetNode && (
        <NodeJsonOperationsModal
          node={importTargetNode}
          onCancel={() => setImportTargetNode(null)}
          onImport={(json, replace) => handleImportBranchToNode(importTargetNode.id, json, replace)}
          onCopyPrompt={() => copyBranchAiPrompt(importTargetNode.name)}
        />
      )}

      {isImportModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-[#fcf9f4] border-2 border-[#1c1c19] w-full max-w-2xl shadow-[12px_12px_0_0_rgba(28,28,25,1)] flex flex-col">
            <div className="bg-[#1c1c19] text-white p-4 flex justify-between items-center text-bold">
              <h2 className="font-display font-black uppercase tracking-widest text-lg flex items-center gap-3">
                <Upload size={20} className="text-[#e5e2dd]" /> Paste Schema JSON
              </h2>
              <button onClick={() => setIsImportModalOpen(false)} className="p-1 hover:bg-white/10 transition-colors"><X size={24} /></button>
            </div>
            <div className="p-6">
              <p className="text-xs font-mono mb-4 text-[#72777f] uppercase tracking-widest leading-loose">
                Paste the entire JSON structure below.
              </p>
              <button onClick={copyAiPrompt} className="w-full flex items-center justify-center gap-2 bg-[#f6f3ee] border-2 border-[#1c1c19] border-dashed py-3 px-4 text-[10px] font-black uppercase tracking-widest hover:bg-[#1c1c19] hover:text-[#e5e2dd] transition-all group mb-4">
                <FileText size={16} className="text-[#0f4369] group-hover:text-[#e5e2dd]" /> Copy AI Instruction Prompt
              </button>
              <textarea
                autoFocus value={importJsonText} onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{ "name": "Project Schema", "children": [...] }'
                className="w-full h-80 bg-white border-2 border-[#1c1c19] p-4 font-mono text-xs focus:outline-none focus:border-[#0f4369] transition-colors resize-none"
              />
              <div className="mt-6 flex justify-end gap-4">
                <button onClick={() => { setIsImportModalOpen(false); setImportJsonText(''); }} className="px-6 py-2 font-display font-bold uppercase tracking-widest text-[11px] border-2 border-[#1c1c19] hover:bg-[#1c1c19] hover:text-white transition-all">Cancel</button>
                <button onClick={handleImportJson} disabled={isImporting || !importJsonText.trim()} className="px-10 py-2 bg-[#e5e2dd] text-[#1c1c19] font-display font-black uppercase tracking-widest text-[11px] border-2 border-[#1c1c19] hover:translate-y-1 hover:shadow-none transition-all shadow-[6px_6px_0_0_rgba(28,28,25,1)] disabled:opacity-50 disabled:grayscale">
                  {isImporting ? 'Processing...' : 'Analyze & Load'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && <DeleteConfirmationModal onConfirm={executeDeleteNode} onCancel={() => setConfirmDeleteId(null)} />}

      {showJsonView && isAdmin && activeEsquema && (
        <div className="fixed top-24 right-6 bottom-32 w-full max-w-md z-[150] bg-[#1c1c19] border-2 border-[#1c1c19] shadow-[12px_12px_0_0_rgba(28,28,25,0.3)] flex flex-col animate-in slide-in-from-right-10 duration-500">
          <div className="bg-[#1c1c19] p-4 flex justify-between items-center border-b border-white/10">
            <h3 className="text-white font-black uppercase tracking-tighter text-sm">Schema Data Structure</h3>
            <button onClick={() => setShowJsonView(false)} className="p-2 text-white/60 hover:text-red-400 transition-all"><X size={20} /></button>
          </div>
          <div className="flex-1 overflow-hidden p-4 bg-[#141412]">
            <textarea readOnly value={JSON.stringify(mapData, null, 2)} className="w-full h-full bg-transparent text-green-400/90 font-mono text-xs p-4 focus:outline-none resize-none" spellCheck="false" />
          </div>
          <div className="p-4">
            <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(mapData, null, 2)); alert("Copied!"); }} className="w-full py-3 bg-white text-[#1c1c19] font-black uppercase text-[10px] tracking-widest hover:bg-green-400 transition-all shadow-[4px_4px_0_0_rgba(0,0,0,0.5)]">Copy Structure</button>
          </div>
        </div>
      )}
    </>
  );
}
