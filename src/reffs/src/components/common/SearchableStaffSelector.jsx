import React, { useState, useRef, useEffect } from 'react';
import { Search, User, Check, ChevronDown, X } from 'lucide-react';

const SearchableStaffSelector = ({
    staffers = [],
    value,
    onChange,
    placeholder = "Seleccionar personal...",
    label,
    showIcon = true
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const containerRef = useRef(null);

    const selectedStaffer = staffers.find(s => s.id === value);

    const filteredStaffers = staffers.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role_description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (staffer) => {
        onChange(staffer.id);
        setIsOpen(false);
        setSearchTerm('');
    };

    return (
        <div className="flex flex-col gap-1 w-full" ref={containerRef}>
            {label && <label className="text-[10px] font-bold text-gray-400 uppercase">{label}</label>}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between gap-2 px-2 py-1 bg-white border border-gray-200 rounded text-[11px] hover:border-blue-400 transition-all text-left"
                >
                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {showIcon && <User size={12} className="text-gray-400 shrink-0" />}
                        <span className={`truncate ${selectedStaffer ? 'text-gray-900' : 'text-gray-400 italic'}`}>
                            {selectedStaffer ? selectedStaffer.name : placeholder}
                        </span>
                    </div>
                    <ChevronDown size={12} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-[100] overflow-hidden flex flex-col max-h-[250px]">
                        <div className="p-2 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                            <Search size={14} className="text-gray-400" />
                            <input
                                autoFocus
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Buscar nombre o rol..."
                                className="w-full bg-transparent border-none p-0 text-[11px] focus:ring-0 placeholder:text-gray-400"
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-gray-600">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                        <div className="overflow-y-auto flex-1 custom-scrollbar">
                            {filteredStaffers.length > 0 ? (
                                filteredStaffers.map((staffer) => (
                                    <button
                                        key={staffer.id}
                                        onClick={() => handleSelect(staffer)}
                                        className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left hover:bg-blue-50 transition-colors border-b border-gray-50 last:border-0 ${value === staffer.id ? 'bg-blue-50/50' : ''}`}
                                    >
                                        <div className="flex-1 min-w-0">
                                            <div className={`text-[11px] font-medium truncate ${value === staffer.id ? 'text-blue-600' : 'text-gray-700'}`}>
                                                {staffer.name}
                                            </div>
                                            {staffer.role_description && (
                                                <div className="text-[9px] text-gray-400 truncate mt-0.5">
                                                    {staffer.role_description}
                                                </div>
                                            )}
                                        </div>
                                        {value === staffer.id && <Check size={12} className="text-blue-600 shrink-0" />}
                                    </button>
                                ))
                            ) : (
                                <div className="px-3 py-4 text-center text-[10px] text-gray-400 italic">
                                    No se encontraron resultados
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchableStaffSelector;
