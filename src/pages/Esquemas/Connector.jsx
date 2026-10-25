import React, { useState, useRef } from 'react';
import { Plus, Copy, Scissors, RotateCcw } from 'lucide-react';

const Connector = ({
  start,
  end,
  parentId,
  childId,
  cableOffset = { x: 0, y: 0 },
  onUpdateOffset,
  onCut,
  onInsert,
  onDuplicate,
  isAdmin,
  zoom = 1,
  isRevitAction = false
}) => {
  const [isDraggingCurve, setIsDraggingCurve] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, initialOffset: { x: 0, y: 0 } });

  const baseMidX = start.x + (end.x - start.x) / 2;
  const baseMidY = start.y + (end.y - start.y) / 2;

  const offX = cableOffset?.x || 0;
  const offY = cableOffset?.y || 0;
  const hasCustomOffset = Math.abs(offX) > 1 || Math.abs(offY) > 1;

  // Control points shifted by user's custom offset so the curve passes through the dragged midpoint
  const cp1x = baseMidX + offX * 1.33;
  const cp1y = start.y + offY * 1.33;
  const cp2x = baseMidX + offX * 1.33;
  const cp2y = end.y + offY * 1.33;

  // Calculate cubic bezier midpoint (t = 0.5) for the interactive handle
  const t = 0.5;
  const mt = 1 - t;
  const bx =
    mt * mt * mt * start.x +
    3 * mt * mt * t * cp1x +
    3 * mt * t * t * cp2x +
    t * t * t * end.x;
  const by =
    mt * mt * mt * start.y +
    3 * mt * mt * t * cp1y +
    3 * mt * t * t * cp2y +
    t * t * t * end.y;

  const path = `M ${start.x} ${start.y} C ${cp1x} ${cp1y} ${cp2x} ${cp2y} ${end.x} ${end.y}`;

  const handleCurveMouseDown = (e) => {
    if (!onUpdateOffset) return;
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingCurve(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      initialOffset: { x: offX, y: offY }
    };

    const handleMouseMove = (moveEvent) => {
      const dx = (moveEvent.clientX - dragStartRef.current.x) / (zoom || 1);
      const dy = (moveEvent.clientY - dragStartRef.current.y) / (zoom || 1);
      onUpdateOffset(
        childId,
        {
          x: Math.round(dragStartRef.current.initialOffset.x + dx),
          y: Math.round(dragStartRef.current.initialOffset.y + dy)
        },
        false
      );
    };

    const handleMouseUp = (upEvent) => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      setIsDraggingCurve(false);
      const dx = (upEvent.clientX - dragStartRef.current.x) / (zoom || 1);
      const dy = (upEvent.clientY - dragStartRef.current.y) / (zoom || 1);
      onUpdateOffset(
        childId,
        {
          x: Math.round(dragStartRef.current.initialOffset.x + dx),
          y: Math.round(dragStartRef.current.initialOffset.y + dy)
        },
        true
      );
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <g className="group/connector pointer-events-none">
      {/* Invisible thicker path for easier hover & direct curve dragging */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="28"
        className="cursor-grab active:cursor-grabbing pointer-events-auto"
        onMouseDown={handleCurveMouseDown}
      >
        <title>Arrastra el cable para ajustar su curvatura</title>
      </path>

      {/* Main visible cable path */}
      <path
        d={path}
        fill="none"
        stroke={isDraggingCurve ? '#e62020' : isRevitAction ? '#0284c7' : '#0f4369'}
        strokeWidth={isDraggingCurve ? '4' : isRevitAction ? '3.5' : '3'}
        strokeDasharray={hasCustomOffset || isRevitAction ? 'none' : '4 4'}
        opacity={isDraggingCurve ? '0.95' : isRevitAction ? '0.85' : '0.55'}
        className="transition-colors duration-200 group-hover/connector:opacity-95 group-hover/connector:stroke-[4.5px] pointer-events-none"
      />

      {/* Midpoint curve grip dot (always subtly visible, highlights on hover) */}
      <circle
        cx={bx}
        cy={by}
        r={isDraggingCurve ? 6 : 4}
        fill={isDraggingCurve ? '#e62020' : isRevitAction ? '#0284c7' : '#0f4369'}
        stroke="#fcf9f4"
        strokeWidth="1.5"
        className="pointer-events-auto cursor-grab active:cursor-grabbing opacity-45 group-hover/connector:opacity-100 transition-opacity"
        onMouseDown={handleCurveMouseDown}
      />

      {isAdmin && (
        <foreignObject
          x={bx - 52}
          y={by - 30}
          width="104"
          height="26"
          className="pointer-events-auto overflow-visible"
        >
          <div className="flex gap-1 items-center justify-center h-full opacity-0 group-hover/connector:opacity-100 transition-opacity duration-150">
            <button
              onMouseDown={(e) => {
                e.stopPropagation();
                onInsert(parentId, childId);
              }}
              className="w-5 h-5 bg-white text-[#0f4369] rounded-full flex items-center justify-center shadow-md hover:!bg-[#0f4369] hover:!text-white transition-all outline-none border border-[#1c1c19]"
              title="Insertar nodo intermedio"
            >
              <Plus size={10} strokeWidth={4} />
            </button>
            <button
              onMouseDown={(e) => {
                e.stopPropagation();
                onDuplicate(e, childId);
              }}
              className="w-5 h-5 bg-[#0f4369] text-white rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all outline-none border border-[#1c1c19]"
              title="Duplicar rama"
            >
              <Copy size={9} strokeWidth={3.5} />
            </button>
            <button
              onMouseDown={(e) => {
                e.stopPropagation();
                onCut(e, parentId, childId, { x: bx, y: by });
              }}
              className="w-5 h-5 bg-[#1c1c19] text-white rounded-full flex items-center justify-center shadow-md hover:!bg-[#e62020] transition-all outline-none border border-white/20"
              title="Cortar y reconectar a otro nodo"
            >
              <Scissors size={10} strokeWidth={3.5} />
            </button>
            {hasCustomOffset && (
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onUpdateOffset && onUpdateOffset(childId, { x: 0, y: 0 }, true);
                }}
                className="w-5 h-5 bg-amber-500 text-[#1c1c19] rounded-full flex items-center justify-center shadow-md hover:bg-amber-400 transition-all outline-none border border-[#1c1c19]"
                title="Restablecer curvatura del cable"
              >
                <RotateCcw size={9} strokeWidth={3.5} />
              </button>
            )}
          </div>
        </foreignObject>
      )}
    </g>
  );
};

export default Connector;
