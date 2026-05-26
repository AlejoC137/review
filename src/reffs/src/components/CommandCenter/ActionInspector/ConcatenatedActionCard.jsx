import React from 'react';
import { Trash2 } from 'lucide-react';

const ConcatenatedActionCard = ({ action, widthPercentage, totalTaskDays, color, staffers, onChange, onDelete, isDragging, onDragStart, onDragOver, onDrop, index }) => {
    const actionDays = totalTaskDays ? ((widthPercentage / 100) * totalTaskDays).toFixed(1) : '0';

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
            className={`relative flex flex-col h-full bg-white overflow-hidden group cursor-grab active:cursor-grabbing border-r border-gray-100 ${isDragging ? '' : 'transition-all duration-300'} ${action.completed ? 'opacity-60 grayscale' : ''}`}
            style={{ width: `${widthPercentage}%` }}
        >
            <div
                className={`h-full border-l-2 flex flex-col p-1 m-0.5 rounded-sm transition-colors ${action.completed ? 'bg-gray-50 opacity-60 grayscale border-gray-300' : ''}`}
                style={{ borderLeftColor: action.completed ? '#d1d5db' : (color || '#3b82f6') }}
            >
                {/* Header Area */}
                <div className="flex justify-between items-start gap-1 flex-1 min-h-0">
                    <div className="flex-1 h-full min-w-0">
                        <textarea
                            value={action.description || ''}
                            onChange={(e) => onChange('description', e.target.value)}
                            placeholder="Acción parcial..."
                            className="w-full h-full text-[10px] font-black leading-tight text-gray-900 bg-transparent border-none p-0 resize-none focus:ring-0 placeholder:text-gray-300"
                            rows={4}
                        />
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <input
                            type="checkbox"
                            checked={!!action.completed}
                            onChange={(e) => onChange('completed', e.target.checked)}
                            className="h-3 w-3 rounded text-green-600 focus:ring-green-500"
                        />
                        <button onClick={onDelete} className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 size={10} />
                        </button>
                    </div>
                </div>

                {/* Details Area - COMPACT: Executor + Days Count */}
                <div className="mt-auto flex items-center justify-between gap-1 overflow-hidden border-t border-gray-50 pt-1">
                    <div className="flex-1 min-w-0">
                        <select
                            value={action.executor_id || ''}
                            onChange={(e) => onChange('executor_id', e.target.value)}
                            className="w-full text-[9px] font-bold text-blue-700 bg-blue-50/50 border-none rounded px-1 py-0 focus:ring-1 focus:ring-blue-100 appearance-none truncate cursor-pointer hover:bg-blue-100 transition-colors"
                        >
                            <option value="">- Ejecutor -</option>
                            {staffers.map((s, idx) => (
                                <option key={s.id || idx} value={s.short_name || s.name || s.nombre}>{s.short_name || s.name || s.nombre}</option>
                            ))}
                        </select>
                    </div>
                    <span className="text-[9px] font-black text-gray-500 whitespace-nowrap bg-gray-100 px-1 rounded">
                        {actionDays}d
                    </span>
                </div>
            </div>
        </div>
    );
};

export default ConcatenatedActionCard;
