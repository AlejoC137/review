import React from 'react';
import { Filter, X } from 'lucide-react';

const CalendarFilterBar = ({
    staffers = [],
    projects = [],
    stages = [],
    filters,
    onFilterChange,
    onClear,
    showProjectFilter = true,
    showStaffFilter = true,
    showStageFilter = true
}) => {
    return (
        <div className="flex items-center gap-2 flex-nowrap">
            <div className="flex items-center gap-1 text-gray-400 mr-2 shrink-0">
                <Filter size={14} />
                <span className="text-xs font-bold uppercase">Filtrar:</span>
            </div>

            {/* Responsable Filter */}
            {showStaffFilter && (
                <select
                    value={filters.staffId || ''}
                    onChange={(e) => onFilterChange('staffId', e.target.value)}
                    className="bg-white border border-gray-200 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                    <option value="">- Todos los Responsables -</option>
                    {staffers.map(s => (
                        <option key={s.id} value={s.id}>{s.name || s.nombre}</option>
                    ))}
                </select>
            )}

            {/* Project Filter */}
            {showProjectFilter && (
                <select
                    value={filters.projectId || ''}
                    onChange={(e) => onFilterChange('projectId', e.target.value)}
                    className="bg-white border border-gray-200 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                    style={{ maxWidth: '150px' }}
                >
                    <option value="">- Todos los Proyectos -</option>
                    {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                </select>
            )}

            {/* Stage Filter */}
            {showStageFilter && (
                <select
                    value={filters.stageId || ''}
                    onChange={(e) => onFilterChange('stageId', e.target.value)}
                    className="bg-white border border-gray-200 text-xs rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                    <option value="">- Todas las Etapas -</option>
                    {stages.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                </select>
            )}

            <div className="flex items-center gap-3 ml-2 border-l border-gray-200 pl-3 shrink-0">
                {/* Construction Mode Toggle */}
                {/* Stage Toggles */}
                <button
                    onClick={() => onFilterChange('showIdea', !filters.showIdea)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded border transition-colors ${filters.showIdea
                        ? 'bg-yellow-100 text-yellow-700 border-yellow-200'
                        : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                        }`}
                    title="Toggle Idea Básica"
                >
                    <span className="text-sm">💡</span>
                    <span className="text-xs font-bold">Idea</span>
                </button>

                <button
                    onClick={() => onFilterChange('showDesarrollo', !filters.showDesarrollo)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded border transition-colors ${filters.showDesarrollo
                        ? 'bg-blue-100 text-blue-700 border-blue-200'
                        : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                        }`}
                    title="Toggle Desarrollo Técnico"
                >
                    <span className="text-sm">📐</span>
                    <span className="text-xs font-bold">Desarrollo</span>
                </button>

                <button
                    onClick={() => onFilterChange('showMuebles', !filters.showMuebles)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded border transition-colors ${filters.showMuebles
                        ? 'bg-purple-100 text-purple-700 border-purple-200'
                        : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                        }`}
                    title="Toggle Muebles"
                >
                    <span className="text-sm">🪑</span>
                    <span className="text-xs font-bold">Muebles</span>
                </button>

                <button
                    onClick={() => onFilterChange('showObra', !filters.showObra)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded border transition-colors ${filters.showObra
                        ? 'bg-orange-100 text-orange-700 border-orange-200'
                        : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'
                        }`}
                    title="Toggle Obra"
                >
                    <span className="text-sm">🏗️</span>
                    <span className="text-xs font-bold">Obra</span>
                </button>

                <div className="h-4 w-px bg-gray-200 mx-1"></div>

                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={!!filters.alejoPass}
                        onChange={(e) => onFilterChange('alejoPass', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                    />
                    <span className="text-xs text-gray-600">AlejoPass</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={!!filters.ronaldPass}
                        onChange={(e) => onFilterChange('ronaldPass', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                    />
                    <span className="text-xs text-gray-600">RonaldPass</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={!!filters.wietPass}
                        onChange={(e) => onFilterChange('wietPass', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-3 w-3"
                    />
                    <span className="text-xs text-gray-600">WietPass</span>
                </label>
            </div>

            {/* Active Filters Indicator / Clear */}
            {(filters.staffId || filters.projectId || filters.stageId || filters.alejoPass || filters.ronaldPass || filters.wietPass) && (
                <button
                    onClick={onClear}
                    className="ml-auto flex items-center gap-1 text-[10px] text-red-500 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                >
                    <X size={12} /> Limpiar Filtros
                </button>
            )}
        </div>
    );
};

export default CalendarFilterBar;
