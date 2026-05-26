import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, ChevronDown, CheckCircle, Plus, X } from 'lucide-react';

const SearchableSpaceSelector = ({
    value,
    onChange,
    spaces = [],
    placeholder = "- Seleccionar Espacio -",
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const wrapperRef = useRef(null);

    const filteredSpaces = useMemo(() => {
        return spaces.filter(s => {
            const term = searchTerm.toLowerCase();
            return (
                (s.name || s.nombre || '').toLowerCase().includes(term) ||
                (s.apellido || '').toLowerCase().includes(term) ||
                (s.piso || '').toString().toLowerCase().includes(term)
            );
        });
    }, [spaces, searchTerm]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedSpace = useMemo(() => {
        if (!value) return null;
        return spaces.find(s => s.id === value || s._id === value);
    }, [value, spaces]);

    const displayValue = selectedSpace
        ? `${selectedSpace.name || selectedSpace.nombre}${selectedSpace.apellido ? ` ${selectedSpace.apellido}` : ''}${selectedSpace.piso ? ` P${selectedSpace.piso}` : ''}`
        : placeholder;

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <div
                onClick={() => setIsOpen(!isOpen)}
                style={{ height: '28px' }}
                className="w-full px-2 text-[10px] font-bold border-2 border-[#1c1c19] flex items-center justify-between cursor-pointer bg-white hover:bg-[#f6f3ee] transition-all box-border"
            >
                <span className={`truncate ${!selectedSpace ? 'text-gray-400 italic' : 'text-[#1c1c19] uppercase'}`}>
                    {displayValue}
                </span>
                <ChevronDown size={12} className="text-[#1c1c19] shrink-0 ml-1" />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border-4 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(0,0,0,1)] z-[100] max-h-64 flex flex-col overflow-hidden">
                    <div className="p-2 border-b-2 border-[#1c1c19] bg-[#fcf9f4] flex items-center gap-2">
                        <Search size={14} className="text-[#1c1c19]" />
                        <input
                            autoFocus
                            type="text"
                            placeholder="Buscar espacio..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-[11px] font-bold focus:ring-0 placeholder:text-gray-400 uppercase"
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="text-gray-400 hover:text-[#1c1c19]">
                                <X size={12} />
                            </button>
                        )}
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-[100px] custom-scrollbar">
                        {filteredSpaces.length > 0 ? (
                            filteredSpaces.map(s => (
                                <div
                                    key={s.id || s._id}
                                    onClick={() => {
                                        onChange(s.id || s._id);
                                        setIsOpen(false);
                                    }}
                                    className={`px-3 py-2 text-[10px] hover:bg-[#0f4369] hover:text-white cursor-pointer flex items-center justify-between group transition-colors border-b border-gray-100 last:border-0 ${value === (s.id || s._id) ? 'bg-[#0f4369]/10' : ''}`}
                                >
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <span className="font-black uppercase truncate">{s.name || s.nombre}</span>
                                        {s.apellido && <span className="opacity-70 truncate">{s.apellido}</span>}
                                        {s.piso && (
                                            <span className="text-white text-[8px] font-black bg-[#0f4369] px-1.5 py-0.5 rounded shrink-0">
                                                PISO {s.piso}
                                            </span>
                                        )}
                                    </div>
                                    {(value === (s.id || s._id)) && <CheckCircle size={12} className="text-[#0f4369] group-hover:text-white shrink-0 ml-1" />}
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center text-[10px] text-gray-400 italic font-bold uppercase">
                                No se encontraron espacios
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchableSpaceSelector;
