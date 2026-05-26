import React from 'react';
import { Trash2 } from 'lucide-react';

const ParallelActionCard = ({ action, staffers, onChange, onDelete, onDragStart, onDragEnd, onDragOver, onDrop, index }) => {
    return (
        <div
            draggable
            onDragStart={(e) => { e.stopPropagation(); onDragStart(e, index); }}
            onDragEnd={(e) => { e.stopPropagation(); if (onDragEnd) onDragEnd(e); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); if (onDragOver) onDragOver(e, index); }}
            onDrop={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(e, index); }}
            className={`w-full bg-white border-2 border-[#1c1c19] p-2 shadow-[3px_3px_0_0_rgba(0,0,0,1)] relative group flex items-center justify-between cursor-grab active:cursor-grabbing hover:bg-[#fcf9f4] transition-all ${action.completed ? 'opacity-50 grayscale' : ''}`}
        >
            <div
                className="absolute top-0 left-0 w-full h-1 bg-[#d1a457] transition-colors"
                style={{ backgroundColor: action.completed ? '#9ca3af' : '#d1a457' }}
            ></div>

            <div className="flex flex-1 items-center gap-3 pl-1">
                <input
                    type="text"
                    value={action.description || ''}
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => onChange('description', e.target.value)}
                    placeholder="Acción paralela..."
                    className="flex-1 text-[13px] font-black text-[#1c1c19] bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300 italic"
                />

                <div className="flex items-center gap-3">
                    <select
                        value={action.executor_id || ''}
                        onMouseDown={(e) => e.stopPropagation()}
                        onChange={(e) => onChange('executor_id', e.target.value)}
                        className="text-[8px] font-black uppercase text-[#0f4369] bg-[#0f4369]/5 border-none px-1.5 py-0.5 focus:ring-0 w-24 truncate"
                    >
                        <option value="">- RESP -</option>
                        {staffers.map((s, idx) => (
                            <option key={s.id || idx} value={s.id}>{s.name}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-2">
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
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParallelActionCard;
