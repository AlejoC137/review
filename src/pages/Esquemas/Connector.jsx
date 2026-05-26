import React from 'react';
import { Plus, Copy, Scissors } from 'lucide-react';

const Connector = ({ start, end, parentId, childId, onCut, onInsert, onDuplicate, isAdmin }) => {
  const midX = start.x + ((end.x - start.x) / 2);
  
  // Calculate approximate cubic bezier midpoint for the handle
  const t = 0.5;
  const mt = 1 - t;
  const bx = mt*mt*mt*start.x + 3*mt*mt*t*midX + 3*mt*t*t*midX + t*t*t*end.x;
  const by = mt*mt*mt*start.y + 3*mt*mt*t*start.y + 3*mt*t*t*end.y + t*t*t*end.y;

  const path = `M ${start.x} ${start.y} C ${midX} ${start.y} ${midX} ${end.y} ${end.x} ${end.y}`;

  return (
    <g className="group/connector pointer-events-none">
      {/* Invisible thicker path for easier hover */}
      <path
        d={path}
        fill="none"
        stroke="transparent"
        strokeWidth="24"
        className="cursor-pointer pointer-events-auto"
        onMouseDown={(e) => e.stopPropagation()}
      />
      <path
        d={path}
        fill="none"
        stroke="#0f4369"
        strokeWidth="3"
        strokeDasharray="4 4"
        opacity="0.5"
        className="transition-all duration-500 group-hover/connector:opacity-90 group-hover/connector:stroke-[5px] pointer-events-none"
      />
      {isAdmin && (
        <foreignObject x={bx - 24} y={by - 12} width="48" height="24" className="pointer-events-auto">
          <div className="flex gap-1 items-center justify-center h-full">
            <button 
                onMouseDown={(e) => {
                e.stopPropagation();
                onInsert(parentId, childId);
                }}
                className="w-5 h-5 bg-white text-[#0f4369] rounded-full flex items-center justify-center shadow-md opacity-40 group-hover/connector:opacity-100 hover:!bg-[#0f4369] hover:!text-white transition-all outline-none border-2 border-[#0f4369]/20"
                title="Insertar nodo intermedio"
            >
                <Plus size={10} strokeWidth={4} />
            </button>
            <button 
                onMouseDown={(e) => {
                e.stopPropagation();
                onDuplicate(e, childId);
                }}
                className="w-5 h-5 bg-[#0f4369] text-white rounded-full flex items-center justify-center shadow-md opacity-40 group-hover/connector:opacity-100 hover:!bg-[#0f4369] transition-all outline-none border-2 border-white/20"
                title="Duplicar rama"
            >
                <Copy size={9} strokeWidth={4} />
            </button>
            <button 
                onMouseDown={(e) => {
                e.stopPropagation();
                onCut(e, parentId, childId, { x: bx, y: by });
                }}
                className="w-5 h-5 bg-[#1c1c19] text-white rounded-full flex items-center justify-center shadow-md opacity-40 group-hover/connector:opacity-100 hover:!bg-[#e62020] transition-all outline-none border-2 border-white/20"
                title="Cortar y mover conexión"
            >
                <Scissors size={10} strokeWidth={4} />
            </button>
          </div>
        </foreignObject>
      )}
    </g>
  );
};

export default Connector;
