import React from 'react';
import { Calendar, Plus, Box, CheckCircle, User } from 'lucide-react';

const DayView = ({ selectedDate, dayTasks, loading, handleCreateTaskForDay, handleSelectTask }) => {
    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            <div className="p-3 border-b border-gray-200 bg-white flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-blue-500" />
                    <div>
                        <h3 className="text-xs font-bold text-gray-800">Tareas del {selectedDate}</h3>
                        <p className="text-[10px] text-gray-400">{dayTasks.length} tareas programadas</p>
                    </div>
                </div>
                <button
                    onClick={handleCreateTaskForDay}
                    className="flex items-center gap-1 px-2.5 py-1 bg-blue-600 text-white rounded text-[10px] font-bold hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus size={12} />
                    Nueva Tarea
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {loading ? (
                    <div className="text-center py-10 text-gray-400 text-xs">Cargando tareas...</div>
                ) : dayTasks.length === 0 ? (
                    <div className="text-center py-10 text-gray-400">
                        <Box size={24} className="mx-auto mb-2 opacity-50" />
                        <p className="text-xs font-medium">No hay tareas para este día</p>
                        <p className="text-[10px] mt-1">Usa el botón "Nueva Tarea" para comenzar</p>
                    </div>
                ) : (
                    dayTasks.map(task => (
                        <div
                            key={task.id}
                            onClick={() => handleSelectTask(task)}
                            className={`
                                bg-white border rounded p-2 shadow-sm hover:shadow-md hover:border-blue-400 cursor-pointer transition-all group
                                ${task.finished ? 'opacity-60 grayscale border-gray-100' : 'border-gray-200'}
                            `}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-xs font-bold text-gray-800 line-clamp-2 ${task.finished ? 'line-through' : ''}`}>
                                    {task.task_description}
                                </span>
                                {task.finished && <CheckCircle size={12} className="text-green-500 shrink-0 mt-0.5" />}
                            </div>

                            <div className="flex items-center gap-2 mt-2">
                                {/* Project Badge */}
                                {task.proyecto && (
                                    <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-bold truncate max-w-[100px]">
                                        {task.proyecto.name}
                                    </span>
                                )}

                                {/* Staff Badge */}
                                {task.staff && (
                                    <div className="flex items-center gap-1 text-gray-500 text-[9px]">
                                        <User size={10} />
                                        <span className="font-medium truncate">{task.staff.name.split(' ')[0]}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default DayView;
