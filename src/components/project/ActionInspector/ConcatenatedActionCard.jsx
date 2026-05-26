import React from 'react';
import { Trash2 } from 'lucide-react';

const ConcatenatedActionCard = ({
    action,
    widthPercentage,
    totalTaskDays,
    color,
    staffers,
    onChange,
    onDelete,
    isDragging,
    onDragStart,
    onDragEnd,
    onDragOver,
    onDrop,
    index
}) => {
    const actionDays = totalTaskDays ? ((widthPercentage / 100) * totalTaskDays).toFixed(1) : '0';

    return (
        <div
            draggable
            onDragStart={(e) => { e.stopPropagation(); onDragStart(e, index); }}
            onDragEnd={(e) => { e.stopPropagation(); if (onDragEnd) onDragEnd(e); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (onDragOver) onDragOver(e, index); }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(e, index); }}
            className={`relative flex flex-col h-full bg-white overflow-hidden group cursor-grab active:cursor-grabbing border-r-2 border-gray-100 ${isDragging ? '' : 'transition-all duration-300'} ${action.completed ? 'opacity-50 grayscale' : ''}`}
            style={{ width: `${widthPercentage}%` }}
        >
            <div
                className={`h-full border-l-4 flex flex-col p-1.5 m-0.5 transition-colors ${action.completed ? 'bg-gray-50 border-gray-400' : 'bg-white border-[#0f4369]'}`}
                style={{ borderLeftColor: action.completed ? '#9ca3af' : (color || '#0f4369') }}
            >
                <div className="flex justify-between items-start gap-1.5 flex-1 min-h-0">
                    <div className="flex-1 h-full min-w-0">
                        <textarea
                            value={action.description || ''}
                            onMouseDown={(e) => e.stopPropagation()}
                            onChange={(e) => onChange('description', e.target.value)}
                            placeholder="Acción..."
                            className="w-full h-full text-[12px] font-black leading-tight text-[#1c1c19] bg-transparent border-none p-0 resize-none focus:ring-0 placeholder:text-gray-300 italic"
                        />
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <input
                            type="checkbox"
                            checked={!!action.completed}
                            onMouseDown={(e) => e.stopPropagation()}
                            onChange={(e) => onChange('completed', e.target.checked)}
                            className="h-3.5 w-3.5 border-2 border-[#1c1c19] accent-[#0f4369]"
                        />
                        <button
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={onDelete}
                            className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Trash2 size={10} />
                        </button>
                    </div>
                </div>

                <div className="mt-auto flex items-center justify-between gap-1.5 overflow-hidden border-t border-gray-50 pt-1.5">
                    <div className="flex-1 min-w-0">
                        <select
                            value={action.executor_id || ''}
                            onMouseDown={(e) => e.stopPropagation()}
                            onChange={(e) => onChange('executor_id', e.target.value)}
                            className="w-full text-[8px] font-black uppercase text-[#0f4369] bg-[#0f4369]/5 border-none px-1 py-0.5 focus:ring-0 cursor-pointer truncate"
                        >
                            <option value="">- RESP -</option>
                            {staffers.map((s, idx) => (
                                <option key={s.id || idx} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <span className="text-[8px] font-black text-[#72777f] bg-gray-100 px-1 py-0.5 rounded border border-gray-100">
                        {actionDays}D
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ConcatenatedActionCard;
