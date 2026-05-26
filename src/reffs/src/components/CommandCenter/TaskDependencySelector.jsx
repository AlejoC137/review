import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Link } from 'lucide-react';
import { searchTasks, getTaskById } from '../../services/tasksService';

const TaskDependencySelector = ({ label, value, onChange, onEdit, initialItem, placeholder = "Buscar tarea..." }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [results, setResults] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    // Initialize with provided item or fetch if missing
    useEffect(() => {
        const initializeItem = async () => {
            if (initialItem && initialItem.id === value) {
                setSelectedItem(initialItem);
            } else if (value && (!selectedItem || selectedItem.id !== value)) {
                // We have a Value (ID) but no Item object. Fetch it.
                try {
                    setLoading(true);
                    const taskData = await getTaskById(value);
                    if (taskData) setSelectedItem(taskData);
                } catch (err) {
                    console.error("Error fetching dependency task:", err);
                } finally {
                    setLoading(false);
                }
            } else if (!value) {
                setSelectedItem(null);
            }
        };

        initializeItem();
    }, [initialItem, value]);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Debounce search
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length >= 2 && !selectedItem && isOpen) {
                setLoading(true);
                try {
                    const data = await searchTasks(searchTerm);
                    setResults(data || []);
                } catch (error) {
                    console.error("Error searching tasks", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm, isOpen, selectedItem]);

    const handleSelect = (task) => {
        setSelectedItem(task);
        onChange(task.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    const handleClear = () => {
        setSelectedItem(null);
        onChange(null);
        setSearchTerm('');
    };

    return (
        <div className="relative" ref={wrapperRef}>
            <label className="block text-[8px] font-bold text-gray-400 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                <Link size={8} /> {label}
            </label>

            {!selectedItem ? (
                <div className="relative">
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        className="w-full text-[10px] bg-white border border-gray-200 rounded px-1.5 py-1 pl-6 focus:ring-1 focus:ring-blue-500/20 focus:border-blue-500 transition-colors placeholder-gray-300"
                        placeholder={placeholder}
                    />
                    <Search size={10} className="absolute left-1.5 top-1.5 text-gray-400" />

                    {/* Dropdown Results */}
                    {isOpen && (searchTerm.length >= 2 || results.length > 0) && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 max-h-40 overflow-y-auto">
                            {loading ? (
                                <div className="p-2 text-[9px] text-gray-400 text-center">Buscando...</div>
                            ) : results.length > 0 ? (
                                results.map((task) => (
                                    <div
                                        key={task.id}
                                        onClick={() => handleSelect(task)}
                                        className="p-1.5 hover:bg-blue-50 cursor-pointer border-b border-gray-50 last:border-0"
                                    >
                                        <div className="text-[10px] font-bold text-gray-700 truncate">{task.task_description}</div>
                                        {task.proyecto && (
                                            <div className="text-[8px] text-gray-400">{task.proyecto.name}</div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="p-2 text-[9px] text-gray-400 text-center">No se encontraron tareas</div>
                            )}
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex items-center justify-between text-[10px] bg-blue-50 border border-blue-100 rounded px-1.5 py-1 text-blue-800">
                    <span className="truncate flex-1 font-medium">{selectedItem.task_description}</span>
                    <div className="flex items-center">
                        {/* New Navigation Button */}
                        {onEdit && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(selectedItem);
                                }}
                                className="mr-1 p-0.5 hover:bg-blue-100 rounded text-blue-400 hover:text-blue-600 transition-colors"
                                title="Ir a la tarea"
                            >
                                <Link size={10} className="transform -rotate-45" /> {/* Use Link icon rotated or similar to indicate jump */}
                            </button>
                        )}
                        <button onClick={handleClear} className="p-0.5 hover:bg-blue-100 rounded text-blue-500">
                            <X size={10} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskDependencySelector;
