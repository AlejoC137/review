import React from 'react';
import { Trash2 } from 'lucide-react';

const ParallelActionCard = ({ action, staffers, onChange, onDelete, onDragStart, onDragOver, onDrop, index }) => {
    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => onDragOver(e, index)}
            onDrop={(e) => onDrop(e, index)}
            className={`w-full bg-white border border-gray-200 rounded p-1 shadow-sm relative group flex items-center justify-between cursor-grab active:cursor-grabbing ${action.completed ? 'opacity-60 grayscale' : ''}`}
        >
            <div
                className="absolute top-0 left-0 w-full h-1 bg-indigo-500 rounded-t transition-colors"
                style={{ backgroundColor: action.completed ? '#d1d5db' : '#6366f1' }}
            ></div>

            <div className="flex flex-1 items-center gap-4 pl-2">
                <input
                    type="text"
                    value={action.description || ''}
                    onChange={(e) => onChange('description', e.target.value)}
                    placeholder="Descripción de acción paralela..."
                    className="flex-1 text-[10px] font-bold text-gray-800 bg-transparent border-none p-0 focus:ring-0 placeholder:text-gray-300"
                />

                <div className="flex items-center gap-3">
                    <select
                        value={action.executor_id || ''}
                        onChange={(e) => onChange('executor_id', e.target.value)}
                        className="text-[9px] bg-gray-50 border-none rounded px-1 py-0.5 w-max focus:ring-0"
                    >
                        <option value="">- Ejecutor -</option>
                        {staffers.map((s, idx) => (
                            <option key={s.id || idx} value={s.name}>{s.name}</option>
                        ))}
                    </select>

                    <div className="flex items-center gap-1.5 pr-1">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <input
                                type="checkbox"
                                checked={!!action.completed}
                                onChange={(e) => onChange('completed', e.target.checked)}
                                className="h-3 w-3 rounded text-green-600 focus:ring-green-500"
                            />
                            <button onClick={onDelete} className="text-red-400 hover:text-red-600">
                                <Trash2 size={12} />
                            </button>
                        </div>
                        <span className="text-[8px] text-gray-400 font-medium uppercase tracking-tighter">Transversal</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ParallelActionCard;
