import React, { useState } from 'react';
import RoadmapNode from './RoadmapNode';
import { Layers, Plus, Save, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useRoadmapProgress } from '../../hooks/useRoadmapProgress';
import { BROLL_IMAGES } from '../../services/brollImages';

export default function PhaseContainer({ phase, index, isLast }) {
  const nodes = phase.nodes || [];
  const { isAdmin } = useAuth();
  const { createModule, reorderModules, moveModuleBetweenPhases } = useRoadmapProgress();
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newSortOrder, setNewSortOrder] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [draggedNodeId, setDraggedNodeId] = useState(null);
  const [dragOverNodeId, setDragOverNodeId] = useState(null);

  const handleSaveNew = async () => {
    if (!newTitle) return;
    await createModule(phase.id, {
      title: newTitle,
      description: newDesc,
      sort_order: parseInt(newSortOrder) || nodes.length + 1,
      image_url: selectedImage
    });
    setIsAdding(false);
    setNewTitle('');
    setNewDesc('');
    setNewSortOrder('');
    setSelectedImage(null);
  };

  const handleDragStart = (e, nodeId) => {
    if (!isAdmin) return;
    setDraggedNodeId(nodeId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/react-node-id', nodeId);
    e.dataTransfer.setData('application/react-phase-id', phase.id);
    setTimeout(() => {
      e.target.style.opacity = '0.4';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedNodeId(null);
    setDragOverNodeId(null);
  };

  const handleDragOver = (e, nodeId) => {
    e.preventDefault();
    if (!isAdmin || draggedNodeId === nodeId) return;
    setDragOverNodeId(nodeId);
  };

  const handleDrop = (e, targetNodeId) => {
    const sourceNodeId = e.dataTransfer.getData('application/react-node-id');
    const sourcePhaseId = e.dataTransfer.getData('application/react-phase-id');

    if (!isAdmin || sourceNodeId === targetNodeId) return;

    const targetIndex = nodes.findIndex(n => n.id === targetNodeId);

    if (sourcePhaseId === phase.id) {
      // Reorder within same phase
      const oldIndex = nodes.findIndex(n => n.id === sourceNodeId);
      if (oldIndex !== -1 && targetIndex !== -1 && oldIndex !== targetIndex) {
        const reorderedNodes = Array.from(nodes);
        const [removed] = reorderedNodes.splice(oldIndex, 1);
        reorderedNodes.splice(targetIndex, 0, removed);

        const updatedNodes = reorderedNodes.map((n, idx) => ({
          ...n,
          sort_order: idx + 1
        }));

        reorderModules(phase.id, updatedNodes);
      }
    } else {
      // Drag between phases
      moveModuleBetweenPhases(sourceNodeId, sourcePhaseId, phase.id, targetIndex);
    }

    setDraggedNodeId(null);
    setDragOverNodeId(null);
  };

  return (
    <div id={`phase-${index + 1}`} data-phase-id={phase.id} className="relative w-full z-10 flex flex-col mt-8 scroll-mt-20">

      {/* Node Connection Point on vertical timeline for Phase Label */}
      <div className="absolute top-[48px] left-[33px] w-4 h-4 bg-[#fcf9f4] border-2 border-[#1c1c19] -translate-y-1/2 rounded-none z-20 hidden md:block">
        <div className="absolute inset-[2px] bg-[#1c1c19]"></div>
      </div>

      {/* Horizontal line for Phase Label */}
      <div className="absolute top-[48px] left-[41px] w-[39px] h-[2px] bg-[#1c1c19] -translate-y-1/2 z-10 hidden md:block"></div>

      {/* Phase Label - Blueprint Stamp Style */}
      <div className="bg-[#e5e2dd] border-2 border-[#1c1c19] p-4 md:p-6 flex flex-col items-start relative z-20 shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] mb-10 w-[calc(100%-24px)] md:w-[calc(100%-80px)] max-w-[400px] ml-6 md:ml-[80px] mt-2 rounded-none">

        <div className="absolute -top-3 left-4 bg-[#0f4369] text-white border-2 border-[#1c1c19] px-2 py-0.5 text-[10px] font-display font-bold tracking-widest uppercase flex items-center">
          <Layers size={10} className="mr-2" />
          PHASE_0{index + 1}
        </div>
        <h2 className="text-xl font-display font-bold text-[#1c1c19] uppercase tracking-widest">{phase.title}</h2>
        <p className="text-[10px] text-[#1c1c19]/70 font-display tracking-[0.2em] mt-3 uppercase border-t-2 border-[#1c1c19]/20 pt-3 w-full text-left">{phase.description}</p>
      </div>

      {/* Nodes List Layout - Dense vertical list */}
      <div className="w-full relative flex flex-col gap-6 mb-12">
        {nodes.map((node, i) => {
          const showStar = (i + 1) % 4 === 0;
          return (
            <div
              key={node.id}
              onDragOver={(e) => handleDragOver(e, node.id)}
              onDrop={(e) => handleDrop(e, node.id)}
              className={`w-full flex items-stretch relative z-10 pl-12 md:pl-[80px] pr-4 md:pr-0 group transition-all duration-200`}
            >
              {isAdmin && dragOverNodeId === node.id && (
                <div className="absolute -top-3 left-[40px] right-4 md:right-0 h-[6px] bg-[#0f4369] z-50">
                  <div className="absolute right-0 -top-2 bg-[#0f4369] text-white text-[8px] px-1 font-bold">DROP_LOCATION</div>
                </div>
              )}

              {/* Node Connection Point on vertical timeline - Now showing Sort Order and acts as Drag Handle */}
              <div
                draggable={isAdmin}
                onDragStart={(e) => handleDragStart(e, node.id)}
                onDragEnd={handleDragEnd}
                className={"absolute left-4 md:left-[29px] top-1/2 -translate-y-1/2 w-[24px] h-[40px] border-2 rounded-none z-20 flex items-center justify-center transition-all " +
                  (isAdmin ? "cursor-grab active:cursor-grabbing hover:scale-110 " : "") +
                  (node.finished === 'locked' ? 'bg-[#e5e2dd] border-[#c2c7cf] text-[#72777f]' :
                    node.finished === 'completed' ? 'bg-[#493f36] border-[#1c1c19] text-white shadow-[2px_2px_0_0_rgba(28,28,25,0.1)]' :
                      'bg-[#0f4369] border-[#1c1c19] text-white shadow-[2px_2px_0_0_rgba(28,28,25,0.1)]')}>
                <span className="font-display font-bold text-[14px] leading-none">
                  {node.sort_order || 0}
                </span>
              </div>

              {/* Horizontal line connecting dot to card */}
              <div className={`absolute left-8 md:left-[41px] top-1/2 -translate-y-1/2 h-[2px] w-[20px] md:w-[39px] z-10 ${node.finished === 'locked' ? 'bg-[#c2c7cf] opacity-50' : 'bg-[#1c1c19]'}`}></div>

              <div className="w-full flex-1 md:pr-8">
                <RoadmapNode node={node} showStar={showStar} />
              </div>
            </div>
          );
        })}
      </div>

      {isAdmin && (
        <div className="w-full flex items-stretch relative z-10 pl-12 md:pl-[80px] pr-4 md:pr-0 mt-4 group">
          <div className="absolute left-6 md:left-[33px] top-1/2 -translate-y-1/2 w-4 h-4 bg-[#fcf9f4] border-2 border-dashed border-[#1c1c19] rounded-none z-20 group-hover:scale-110 transition-transform"></div>
          <div className="absolute left-8 md:left-[41px] top-1/2 -translate-y-1/2 h-[2px] w-[20px] md:w-[39px] z-10 bg-[#1c1c19]"></div>

          <div className="w-full flex-1 md:pr-8">
            {isAdding ? (
              <div className="bg-[#fcf9f4] border-2 border-dashed border-[#1c1c19] p-4 flex flex-col gap-3 shadow-[4px_4px_0_0_rgba(28,28,25,0.1)]">
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <label className="text-[9px] font-display font-bold tracking-[0.2em] text-[#1c1c19]/50 ml-1 uppercase">Module Title</label>
                    <input
                      type="text"
                      placeholder="E.G. CIMENTACIONES Y ESTRUCTURAS"
                      value={newTitle}
                      onChange={e => setNewTitle(e.target.value)}
                      className="w-full bg-white border-2 border-[#1c1c19] p-2 font-display uppercase text-sm focus:outline-none focus:border-[#0f4369]"
                    />
                  </div>
                  <div className="w-full md:w-32">
                    <label className="text-[9px] font-display font-bold tracking-[0.2em] text-[#1c1c19]/50 ml-1 uppercase">Sort Order</label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newSortOrder}
                      onChange={e => setNewSortOrder(e.target.value)}
                      className="w-full bg-white border-2 border-[#1c1c19] p-2 font-display uppercase text-sm focus:outline-none focus:border-[#0f4369]"
                    />
                  </div>
                </div>
                <textarea
                  placeholder="Module description (optional)..."
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  className="w-full bg-white border-2 border-[#1c1c19] p-2 font-sans text-xs focus:outline-none focus:border-[#0f4369]"
                  rows={2}
                />

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] font-display font-bold tracking-[0.2em] text-[#1c1c19]/50 ml-1 uppercase">Background Image Selection</label>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setSelectedImage(null)}
                      className={`w-16 h-10 border-2 transition-all flex items-center justify-center text-[10px] font-bold ${!selectedImage ? 'border-[#0f4369] bg-[#e5e2dd]' : 'border-[#1c1c19]/20 bg-[#fcf9f4] hover:border-[#1c1c19]'}`}
                    >
                      NONE
                    </button>
                    {BROLL_IMAGES.map((img) => (
                      <button
                        key={img}
                        onClick={() => setSelectedImage(img)}
                        className={`w-16 h-10 border-2 transition-all overflow-hidden relative ${selectedImage === img ? 'border-[#0f4369] scale-105 shadow-md' : 'border-[#1c1c19]/20 hover:border-[#1c1c19]'}`}
                      >
                        <img src={img} className="w-full h-full object-cover" alt="Broll" />
                        {selectedImage === img && <div className="absolute inset-0 bg-[#0f4369]/20"></div>}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end mt-2">
                  <button onClick={() => setIsAdding(false)} className="p-1 border-2 border-transparent hover:border-[#1c1c19] text-[#72777f] hover:text-[#1c1c19] transition-colors"><X size={18} /></button>
                  <button
                    onClick={handleSaveNew}
                    className="flex items-center gap-2 bg-[#0f4369] text-white px-4 py-2 font-display font-bold text-[10px] tracking-widest uppercase border-2 border-[#1c1c19] hover:bg-[#1c1c19] transition-colors"
                  >
                    <Save size={14} /> Add Module
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setIsAdding(true);
                  setNewSortOrder(nodes.length + 1);
                }}
                className="w-full bg-[#f6f3ee] border-2 border-dashed border-[#1c1c19] p-6 flex items-center justify-center gap-2 text-[#72777f] hover:text-[#0f4369] hover:bg-[#e5e2dd] transition-all font-display font-bold text-xs tracking-widest uppercase shadow-[4px_4px_0_0_rgba(28,28,25,0.05)] hover:shadow-[4px_4px_0_0_rgba(28,28,25,0.15)]"
              >
                <Plus size={16} /> Add New Module to {phase.title}
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
