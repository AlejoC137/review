import React, { useState, useRef, useEffect } from 'react';
import { Trash2, GripVertical, Move } from 'lucide-react';
import { clsx } from 'clsx';

function LifecycleItem({ activity, stagesCount, totalRows, onUpdate, onDelete }) {
  const [isResizing, setIsResizing] = useState(null); // 'left' | 'right' | null
  const [isMoving, setIsMoving] = useState(false);
  const [tempStart, setTempStart] = useState(activity.start_stage_index);
  const [tempEnd, setTempEnd] = useState(activity.end_stage_index);
  const [tempLevel, setTempLevel] = useState(activity.specificity_level);
  
  const itemRef = useRef(null);

  const gridColumn = `${tempStart + 1} / ${tempEnd + 2}`;
  const gridRow = Math.min(tempLevel, totalRows * 2) + 1; // +1 para saltar la cabecera (row 1)

  // Desfase estable basado en el ID para que los solapamientos sean visibles
  const staggerX = (activity.id.charCodeAt(0) % 6) * 3; // 0 a 15px
  const staggerY = (activity.id.charCodeAt(1) % 6) * 3; // 0 a 15px
  const baseZ = 10 + (activity.id.charCodeAt(0) % 30);

  useEffect(() => {
    setTempStart(activity.start_stage_index);
    setTempEnd(activity.end_stage_index);
    // Asegurar que el nivel no exceda el total de filas actual (ahora doble densidad)
    setTempLevel(Math.min(activity.specificity_level, totalRows * 2));
  }, [activity.start_stage_index, activity.end_stage_index, activity.specificity_level, totalRows]);

  // Manejador para RE-DIMOENSIÓN
  const handleResizeDown = (e, edge) => {
    e.stopPropagation();
    setIsResizing(edge);
    
    const startX = e.clientX;
    const initialStart = tempStart;
    const initialEnd = tempEnd;
    const colWidth = itemRef.current?.parentElement?.offsetWidth / stagesCount || 100;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const step = Math.round(deltaX / colWidth);

      if (edge === 'left') {
        const newStart = Math.min(initialStart + step, initialEnd);
        setTempStart(Math.max(0, newStart));
      } else if (edge === 'right') {
        const newEnd = Math.max(initialEnd + step, initialStart);
        setTempEnd(Math.min(stagesCount - 1, newEnd));
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setIsResizing(null);
      if (tempStart !== activity.start_stage_index || tempEnd !== activity.end_stage_index) {
        onUpdate(activity.id, { start_stage_index: tempStart, end_stage_index: tempEnd });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Manejador para MOVIMIENTO TOTAL (Drag & Move)
  const handleMoveDown = (e) => {
    if (e.button !== 0) return; // Solo clic izquierdo
    e.stopPropagation();
    setIsMoving(true);

    const startX = e.clientX;
    const startY = e.clientY;
    const initialStart = tempStart;
    const initialEnd = tempEnd;
    const initialLevel = tempLevel;
    
    const parent = itemRef.current?.parentElement;
    const colWidth = parent?.offsetWidth / stagesCount || 100;
    const rowHeight = parent?.offsetHeight / (totalRows * 2) || 30;

    const onMouseMove = (moveEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const stepX = Math.round(deltaX / colWidth);
      const stepY = Math.round(deltaY / rowHeight);

      // Calcular nuevos índices con límites
      const width = initialEnd - initialStart;
      let newStart = initialStart + stepX;
      let newEnd = initialEnd + stepX;

      if (newStart < 0) {
        newStart = 0;
        newEnd = width;
      }
      if (newEnd >= stagesCount) {
        newEnd = stagesCount - 1;
        newStart = newEnd - width;
      }

      setTempStart(newStart);
      setTempEnd(newEnd);
      setTempLevel(Math.max(1, Math.min(totalRows * 2, initialLevel + stepY)));
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      setIsMoving(false);
      
      if (tempStart !== activity.start_stage_index || tempLevel !== activity.specificity_level) {
        onUpdate(activity.id, { 
          start_stage_index: tempStart, 
          end_stage_index: tempEnd, 
          specificity_level: tempLevel 
        });
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      ref={itemRef}
      onMouseDown={handleMoveDown}
      style={{
        gridColumn: gridColumn,
        gridRow: gridRow,
        transform: (isResizing || isMoving) ? 'none' : `translate(${staggerX}px, ${staggerY}px)`,
        zIndex: (isResizing || isMoving) ? 100 : baseZ
      }}
      className={clsx(
        "group relative flex flex-col justify-start p-3 transition-all duration-75 select-none",
        "border-2 border-[#1c1c19] bg-white",
        "shadow-[4px_4px_0_0_rgba(28,28,25,0.15)]",
        (isResizing || isMoving) 
          ? "z-[100] shadow-[12px_12px_0_0_rgba(28,28,25,1)] scale-[1.05] cursor-grabbing opacity-90" 
          : "hover:z-[90] hover:shadow-[8px_8px_0_0_rgba(28,28,25,0.8)] cursor-grab"
      )}
    >
      {/* Indicador de Color (Nativo Blueprint) */}
      <div 
        className="absolute top-0 left-0 right-0 h-1.5 opacity-80" 
        style={{ backgroundColor: activity.color_hex || '#0f4369' }} 
      />

      {/* Resize Handle Left */}
      <div
        onMouseDown={(e) => handleResizeDown(e, 'left')}
        className="absolute left-0 top-1.5 bottom-0 w-4 cursor-col-resize flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#f6f3ee] border-r border-[#1c1c19]/10 transition-all z-10"
      >
        <GripVertical size={14} className="text-[#1c1c19]/30" />
      </div>

      <div className="flex flex-col h-full pointer-events-none mt-0">
        <div className="flex justify-between items-center mb-1">
          <span className="font-mono text-[7px] font-black text-white bg-[#0f4369] px-1 py-0.5 leading-none uppercase tracking-tighter">
            REF_{activity.id.split('-')[0]}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(activity.id);
            }}
            className="pointer-events-auto p-0.5 hover:bg-red-50 transition-all rounded"
          >
            <Trash2 size={8} className="text-red-500/50 hover:text-red-600" />
          </button>
        </div>

        <h4 className="text-[10px] font-black leading-tight text-[#1c1c19] uppercase tracking-tighter mb-1 line-clamp-2">
          {activity.name}
        </h4>

        <div className="mt-auto flex items-center gap-1">
            <span className="text-[6px] font-mono font-black text-[#72777f] uppercase whitespace-nowrap bg-[#f6f3ee] px-0.5">
                L_SPEC: {tempLevel}
            </span>
            <div className="flex-1 h-[1px] bg-[#1c1c19]/5" />
            <span className="text-[6px] font-mono font-black text-[#0f4369] uppercase whitespace-nowrap">
                {tempEnd - tempStart + 1} STG
            </span>
        </div>
      </div>

      {/* Resize Handle Right */}
      <div
        onMouseDown={(e) => handleResizeDown(e, 'right')}
        className="absolute right-0 top-1.5 bottom-0 w-4 cursor-col-resize flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-[#f6f3ee] border-l border-[#1c1c19]/10 transition-all z-10"
      >
        <GripVertical size={14} className="text-[#1c1c19]/30" />
      </div>

      {/* Floating Indicators when Manipulating */}
      {(isResizing || isMoving) && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-[#1c1c19] text-white px-3 py-1 text-[9px] font-black font-mono whitespace-nowrap uppercase tracking-widest shadow-[4px_4px_0_0_rgb(209,164,87)]">
          {isMoving ? 'MOVING_ELEMENT' : 'SCALING_DURATION'}
        </div>
      )}
    </div>
  );
}

export default LifecycleItem;
