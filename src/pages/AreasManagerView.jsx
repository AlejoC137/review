import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Layers, Box, ChevronDown, ChevronRight, Hash, Paperclip, BarChart2, Building2, LayoutGrid, FileText } from 'lucide-react';
import { projectService } from '../services/projectService';
import { spacesService } from '../services/spacesService';
import { levelsService } from '../services/levelsService';

const AreasManagerView = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const projectId = searchParams.get('projectId') || '';

    const [subProjects, setSubProjects] = useState([]);
    const [spacesElements, setSpacesElements] = useState([]);
    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('subproject');

    const [expandedSubProjects, setExpandedSubProjects] = useState({});
    const [expandedSpaces, setExpandedSpaces] = useState({});

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        if (!projectId) return;
        setLoading(true);
        try {
            const [spRes, seRes, lvRes] = await Promise.all([
                projectService.getSpaces(projectId),
                spacesService.getProjectSpaces(projectId),
                levelsService.getLevels(projectId)
            ]);

            setSubProjects(spRes || []);
            setSpacesElements(seRes || []);
            setLevels(lvRes || []);

            const spExp = {};
            (spRes || []).forEach(sp => spExp[sp.id] = true);
            setExpandedSubProjects(spExp);
            
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSubProject = (id) => setExpandedSubProjects(prev => ({ ...prev, [id]: !prev[id] }));
    const toggleSpace = (id) => setExpandedSpaces(prev => ({ ...prev, [id]: !prev[id] }));

    // Helpers
    const getLevelName = (level_id, piso) => {
        if (level_id) {
            const level = levels.find(l => l.id === level_id);
            if (level) return level.nombre;
        }
        if (piso) return `PISO ${piso}`;
        return 'SIN ASIGNAR';
    };

    const countComponents = (componentsJson) => {
        if (!componentsJson) return 0;
        try {
            const parsed = typeof componentsJson === 'string' ? JSON.parse(componentsJson) : componentsJson;
            return Array.isArray(parsed) ? parsed.length : 0;
        } catch {
            return 0;
        }
    };

    // Filter only spaces for aggregations (Elements don't sum area)
    const spacesOnly = spacesElements.filter(se => se.tipo === 'Espacio');

    // Advanced Aggregation Structure considering Demolition
    const createEmptyAgg = () => ({
        construida: { nueva: 0, existente: 0 },
        descubierta: { nueva: 0, existente: 0 },
        demolicion: 0,
        total_proyecto: 0,     // Lo que queda construido/libre al final
        total_intervencion: 0  // Todo lo que el constructor toca (Nueva + Existente/Refacción + Demolición)
    });

    const addAreaToAgg = (agg, space) => {
        const area = parseFloat(space.area) || 0;
        const isConstruida = space.area_category === 'Construida';
        const phase = space.phase || 'Nueva Construcción'; // Default to new

        if (phase === 'Demolición') {
            agg.demolicion += area;
            agg.total_intervencion += area;
        } else {
            // Es Nueva o Existente (Se queda en el proyecto final)
            if (isConstruida) {
                if (phase === 'Existente') agg.construida.existente += area;
                else agg.construida.nueva += area;
            } else {
                if (phase === 'Existente') agg.descubierta.existente += area;
                else agg.descubierta.nueva += area;
            }
            agg.total_proyecto += area;
            agg.total_intervencion += area;
        }
    };

    const renderTotalsRow = (totals, label = "TOTAL GENERAL PROYECTO", className = "bg-[#f6f3ee] border-t-4 border-[#1c1c19] text-lg") => (
        <tr className={`font-black ${className}`}>
            <td className="p-4 border-r-2 border-[#1c1c19]/20 uppercase text-right">{label}</td>
            <td className="p-4 border-r-2 border-[#1c1c19]/20 text-center text-[#16a34a]">{totals.construida.nueva.toFixed(2)}</td>
            <td className="p-4 border-r-2 border-[#1c1c19]/20 text-center text-[#16a34a]">{totals.construida.existente.toFixed(2)}</td>
            <td className="p-4 border-r-2 border-[#1c1c19]/20 text-center text-[#ea580c]">{totals.descubierta.nueva.toFixed(2)}</td>
            <td className="p-4 border-r-2 border-[#1c1c19]/20 text-center text-[#ea580c]">{totals.descubierta.existente.toFixed(2)}</td>
            <td className="p-4 border-r-2 border-[#1c1c19]/20 text-center text-[#dc2626] bg-[#fee2e2]/50">{totals.demolicion.toFixed(2)}</td>
            <td className="p-4 border-r-2 border-[#1c1c19]/20 text-center text-white bg-[#0f4369]">{totals.total_proyecto.toFixed(2)}</td>
            <td className="p-4 text-center text-xl bg-[#1c1c19] text-[#e5e2dd]">{totals.total_intervencion.toFixed(2)}</td>
        </tr>
    );

    const TableHeader = ({ title }) => (
        <thead className="bg-[#1c1c19] text-white text-[10px] tracking-wider sticky top-0 z-10 shadow-sm border-b-4 border-[#1c1c19]">
            <tr>
                <th rowSpan={2} className="p-3 border-r-2 border-white/20 w-[20%] uppercase align-bottom text-[13px] font-black">{title}</th>
                <th colSpan={2} className="p-2 border-r-2 border-b-2 border-white/20 text-center bg-[#16a34a]/20 uppercase text-xs text-[#4ade80]">CONSTRUIDA FINAL</th>
                <th colSpan={2} className="p-2 border-r-2 border-b-2 border-white/20 text-center bg-[#ea580c]/20 uppercase text-xs text-[#fdba74]">LIBRE FINAL</th>
                <th rowSpan={2} className="p-3 border-r-2 border-white/20 text-center align-bottom bg-[#dc2626]/20 text-[#fca5a5] text-xs font-black w-[10%]">A DEMOLER</th>
                <th rowSpan={2} className="p-3 border-r-2 border-white/20 text-center align-bottom bg-[#0f4369] text-white text-xs font-black w-[10%] leading-tight">ÁREA PROYECTO<br/><span className="text-[9px] font-normal text-gray-300">(SIN DEMOLICIONES)</span></th>
                <th rowSpan={2} className="p-3 text-center align-bottom bg-[#e5e2dd] text-[#1c1c19] text-xs font-black w-[12%] leading-tight">TOTAL INTERVENCIÓN<br/><span className="text-[9px] font-bold text-gray-500">(OBRA TOTAL)</span></th>
            </tr>
            <tr>
                <th className="p-2 border-r-2 border-white/20 text-center bg-[#16a34a]/10 w-[9%] uppercase font-bold text-gray-300">Nueva</th>
                <th className="p-2 border-r-2 border-white/20 text-center bg-[#16a34a]/10 w-[9%] uppercase font-bold text-gray-300">Existente</th>
                <th className="p-2 border-r-2 border-white/20 text-center bg-[#ea580c]/10 w-[9%] uppercase font-bold text-gray-300">Nueva</th>
                <th className="p-2 border-r-2 border-white/20 text-center bg-[#ea580c]/10 w-[9%] uppercase font-bold text-gray-300">Existente</th>
            </tr>
        </thead>
    );

    // ==========================================
    // TAB 1: POR SUBPROYECTO
    // ==========================================
    const renderSubProjectTab = () => {
        const aggregations = {};
        const grandTotal = createEmptyAgg();

        subProjects.forEach(sp => aggregations[sp.id] = createEmptyAgg());
        spacesOnly.forEach(s => {
            if (s.subProject_id && aggregations[s.subProject_id]) {
                addAreaToAgg(aggregations[s.subProject_id], s);
                addAreaToAgg(grandTotal, s);
            }
        });

        return (
            <div className="bg-white border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)] flex-1 flex flex-col overflow-hidden font-mono">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full min-w-[1200px] text-left border-collapse text-[13px]">
                        <TableHeader title="SUBPROYECTO / UNIDAD" />
                        <tbody>
                            {subProjects.length === 0 ? (
                                <tr><td colSpan={8} className="p-8 text-center text-gray-500 italic uppercase">No hay subproyectos.</td></tr>
                            ) : subProjects.map(sp => {
                                const agg = aggregations[sp.id];
                                return (
                                    <tr key={sp.id} className="border-b border-[#1c1c19]/20 hover:bg-[#f6f3ee] transition-colors">
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 font-bold uppercase">{sp.name}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#a7f3d0]/10 text-[#16a34a]">{agg.construida.nueva.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#a7f3d0]/10 text-gray-600">{agg.construida.existente.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#fed7aa]/10 text-[#ea580c]">{agg.descubierta.nueva.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#fed7aa]/10 text-gray-600">{agg.descubierta.existente.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#fee2e2]/30 text-[#dc2626] font-bold">{agg.demolicion.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center font-bold text-[#0f4369] bg-[#0f4369]/10">{agg.total_proyecto.toFixed(2)}</td>
                                        <td className="p-3 text-center font-black bg-[#e5e2dd]/30">{agg.total_intervencion.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                            {renderTotalsRow(grandTotal)}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // ==========================================
    // TAB 2: POR NIVEL (PISO)
    // ==========================================
    const renderLevelTab = () => {
        const aggByLevel = {};
        const grandTotal = createEmptyAgg();

        spacesOnly.forEach(s => {
            const levelName = getLevelName(s.level_id, s.piso);
            if (!aggByLevel[levelName]) aggByLevel[levelName] = createEmptyAgg();
            addAreaToAgg(aggByLevel[levelName], s);
            addAreaToAgg(grandTotal, s);
        });

        const sortedLevels = Object.keys(aggByLevel).sort((a, b) => {
            if (a === 'SIN ASIGNAR') return 1;
            if (b === 'SIN ASIGNAR') return -1;
            return a.localeCompare(b);
        });

        return (
            <div className="bg-white border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)] flex-1 flex flex-col overflow-hidden font-mono">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full min-w-[1200px] text-left border-collapse text-[13px]">
                        <TableHeader title="NIVEL / PISO" />
                        <tbody>
                            {sortedLevels.map(level => {
                                const agg = aggByLevel[level];
                                return (
                                    <tr key={level} className="border-b border-[#1c1c19]/20 hover:bg-[#f6f3ee] transition-colors">
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 font-bold uppercase">{level}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#a7f3d0]/10 text-[#16a34a]">{agg.construida.nueva.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#a7f3d0]/10 text-gray-600">{agg.construida.existente.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#fed7aa]/10 text-[#ea580c]">{agg.descubierta.nueva.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#fed7aa]/10 text-gray-600">{agg.descubierta.existente.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#fee2e2]/30 text-[#dc2626] font-bold">{agg.demolicion.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center font-bold text-[#0f4369] bg-[#0f4369]/10">{agg.total_proyecto.toFixed(2)}</td>
                                        <td className="p-3 text-center font-black bg-[#e5e2dd]/30">{agg.total_intervencion.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                            {renderTotalsRow(grandTotal)}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // ==========================================
    // TAB 3: POR CATEGORÍA DE USO
    // ==========================================
    const renderUsageTab = () => {
        const aggByUsage = {};
        const grandTotal = createEmptyAgg();

        spacesOnly.forEach(s => {
            const usage = s.categoria_uso || 'SIN ASIGNAR';
            if (!aggByUsage[usage]) aggByUsage[usage] = createEmptyAgg();
            addAreaToAgg(aggByUsage[usage], s);
            addAreaToAgg(grandTotal, s);
        });

        const sortedUsages = Object.keys(aggByUsage).sort();

        return (
            <div className="bg-white border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)] flex-1 flex flex-col overflow-hidden font-mono">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full min-w-[1200px] text-left border-collapse text-[13px]">
                        <TableHeader title="PROGRAMA ARQUITECTÓNICO" />
                        <tbody>
                            {sortedUsages.map(usage => {
                                const agg = aggByUsage[usage];
                                return (
                                    <tr key={usage} className="border-b border-[#1c1c19]/20 hover:bg-[#f6f3ee] transition-colors">
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 font-bold uppercase">{usage}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#a7f3d0]/10 text-[#16a34a]">{agg.construida.nueva.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#a7f3d0]/10 text-gray-600">{agg.construida.existente.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#fed7aa]/10 text-[#ea580c]">{agg.descubierta.nueva.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#fed7aa]/10 text-gray-600">{agg.descubierta.existente.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center bg-[#fee2e2]/30 text-[#dc2626] font-bold">{agg.demolicion.toFixed(2)}</td>
                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center font-bold text-[#0f4369] bg-[#0f4369]/10">{agg.total_proyecto.toFixed(2)}</td>
                                        <td className="p-3 text-center font-black bg-[#e5e2dd]/30">{agg.total_intervencion.toFixed(2)}</td>
                                    </tr>
                                );
                            })}
                            {renderTotalsRow(grandTotal)}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    // ==========================================
    // TAB 4: DESGLOSE TÉCNICO
    // ==========================================
    const renderDetailsTab = () => {
        return (
            <div className="bg-white border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)] flex-1 flex flex-col overflow-hidden font-mono">
                <div className="flex-1 overflow-auto custom-scrollbar p-0">
                    <table className="w-full min-w-[1200px] text-left border-collapse text-[10px]">
                        <thead className="bg-[#1c1c19] text-white sticky top-0 z-10 text-[9px] font-black uppercase tracking-wider shadow-sm border-b-4 border-[#1c1c19]">
                            <tr>
                                <th className="p-3 border-r-2 border-white/20 w-[30%]">ESTRUCTURA (SUBPROYECTO {'>'} ESPACIO {'>'} ELEMENTO)</th>
                                <th className="p-3 border-r-2 border-white/20 w-[15%]">CATEGORÍA DE USO</th>
                                <th className="p-3 border-r-2 border-white/20 w-[15%] text-center">NIVEL / PISO</th>
                                <th className="p-3 border-r-2 border-white/20 w-[10%] text-center">FASE (REVIT)</th>
                                <th className="p-3 border-r-2 border-white/20 w-[10%] text-center">COMPONENTES</th>
                                <th className="p-3 border-r-2 border-white/20 w-[10%] text-center">TIPO DE ÁREA</th>
                                <th className="p-3 w-[10%] text-center text-[#e5e2dd]">ÁREA (m²)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {subProjects.length === 0 ? (
                                <tr><td colSpan={7} className="p-8 text-center text-gray-500 italic uppercase">No hay subproyectos registrados.</td></tr>
                            ) : subProjects.map(sp => {
                                const isSpExpanded = expandedSubProjects[sp.id];
                                const spaces = spacesElements.filter(se => se.subProject_id === sp.id && se.tipo === 'Espacio');
                                
                                // Para el desglose, mostramos la suma bruta para fines técnicos
                                let spTotal = 0;
                                spaces.forEach(s => spTotal += (parseFloat(s.area) || 0));
                                
                                return (
                                    <React.Fragment key={sp.id}>
                                        <tr 
                                            className="bg-[#e5e2dd] border-b-2 border-[#1c1c19]/60 cursor-pointer hover:bg-[#d5d2cd] transition-colors"
                                            onClick={() => toggleSubProject(sp.id)}
                                        >
                                            <td className="p-3 border-r-2 border-[#1c1c19]/20 font-black flex items-center gap-2">
                                                {isSpExpanded ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}
                                                <Layers size={14}/>
                                                <span className="uppercase text-xs">{sp.name}</span>
                                            </td>
                                            <td className="p-3 border-r-2 border-[#1c1c19]/20 text-gray-500 text-center">-</td>
                                            <td className="p-3 border-r-2 border-[#1c1c19]/20 text-gray-500 text-center">-</td>
                                            <td className="p-3 border-r-2 border-[#1c1c19]/20 text-gray-500 text-center">-</td>
                                            <td className="p-3 border-r-2 border-[#1c1c19]/20 text-gray-500 text-center">-</td>
                                            <td className="p-3 border-r-2 border-[#1c1c19]/20 text-gray-500 text-center">-</td>
                                            <td className="p-3 text-center font-black text-sm bg-[#1c1c19]/10">{spTotal.toFixed(2)}</td>
                                        </tr>
                                        
                                        {isSpExpanded && spaces.map(space => {
                                            const elements = spacesElements.filter(se => se.parent_espacio_id === space.id && se.tipo === 'Elemento');
                                            const isSpaceExpanded = expandedSpaces[space.id];
                                            const compsCount = countComponents(space.componentes);
                                            const isConst = space.area_category === 'Construida';
                                            const isDemolicion = space.phase === 'Demolición';
                                            
                                            return (
                                                <React.Fragment key={space.id}>
                                                    <tr 
                                                        className={`bg-[#fcf9f4] border-b border-[#1c1c19]/20 hover:bg-white transition-colors ${elements.length > 0 ? 'cursor-pointer' : ''}`}
                                                        onClick={() => elements.length > 0 && toggleSpace(space.id)}
                                                    >
                                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 pl-8 flex items-center gap-2 font-bold">
                                                            {elements.length > 0 ? (
                                                                isSpaceExpanded ? <ChevronDown size={12}/> : <ChevronRight size={12}/>
                                                            ) : <span className="w-[12px]"></span>}
                                                            <Box size={14} className="text-[#0f4369]"/>
                                                            <span className={`uppercase ${isDemolicion ? 'line-through text-gray-400' : ''}`}>{space.nombre} {space.apellido}</span>
                                                        </td>
                                                        <td className={`p-3 border-r-2 border-[#1c1c19]/20 uppercase ${isDemolicion ? 'text-gray-400' : ''}`}>{space.categoria_uso}</td>
                                                        <td className={`p-3 border-r-2 border-[#1c1c19]/20 text-center font-bold uppercase ${isDemolicion ? 'text-gray-400' : 'text-[#0f4369]'}`}>
                                                            {getLevelName(space.level_id, space.piso)}
                                                        </td>
                                                        <td className={`p-3 border-r-2 border-[#1c1c19]/20 text-center uppercase text-[9px] font-bold ${isDemolicion ? 'text-[#dc2626]' : ''}`}>
                                                            {space.phase || 'NUEVA CONSTRUCCIÓN'}
                                                        </td>
                                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center">
                                                            {compsCount > 0 ? (
                                                                <span className="bg-[#1c1c19] text-white px-2 py-0.5 rounded-sm text-[8px] flex items-center justify-center gap-1 w-fit mx-auto">
                                                                    <Paperclip size={10}/> {compsCount}
                                                                </span>
                                                            ) : '-'}
                                                        </td>
                                                        <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center uppercase">
                                                            <span className={`px-2 py-0.5 font-black text-[9px] border-2 
                                                                ${isDemolicion ? 'border-[#dc2626] text-[#dc2626] bg-[#fee2e2]' 
                                                                : isConst ? 'border-[#16a34a] text-[#16a34a] bg-[#16a34a]/10' 
                                                                : 'border-[#ea580c] text-[#ea580c] bg-[#ea580c]/10'}`}>
                                                                {space.area_category}
                                                            </span>
                                                        </td>
                                                        <td className={`p-3 text-center font-black text-xs 
                                                            ${isDemolicion ? 'bg-[#fee2e2]/50 text-[#dc2626]' 
                                                            : isConst ? 'bg-[#a7f3d0]/30 text-[#16a34a]' 
                                                            : 'bg-[#fed7aa]/30 text-[#ea580c]'}`}>
                                                            {parseFloat(space.area || 0).toFixed(2)}
                                                        </td>
                                                    </tr>

                                                    {isSpaceExpanded && elements.map(element => {
                                                        const elCompsCount = countComponents(element.componentes);
                                                        const isElDemolicion = element.phase === 'Demolición';
                                                        return (
                                                            <tr key={element.id} className="bg-white border-b border-[#1c1c19]/10 hover:bg-[#f6f3ee]">
                                                                <td className="p-3 border-r-2 border-[#1c1c19]/20 pl-16 flex items-center gap-2 text-gray-500 font-bold">
                                                                    <Hash size={12} className="text-gray-400"/>
                                                                    <span className={`uppercase text-[9px] ${isElDemolicion ? 'line-through' : ''}`}>{element.nombre} {element.apellido}</span>
                                                                </td>
                                                                <td className="p-3 border-r-2 border-[#1c1c19]/20 uppercase text-[9px] text-gray-400">{element.categoria_uso || '-'}</td>
                                                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center uppercase text-[9px] text-gray-400">
                                                                    {getLevelName(element.level_id, element.piso)}
                                                                </td>
                                                                <td className={`p-3 border-r-2 border-[#1c1c19]/20 text-center uppercase text-[9px] ${isElDemolicion ? 'text-[#dc2626] font-bold' : 'text-gray-400'}`}>
                                                                    {element.phase || 'NUEVA CONSTRUCCIÓN'}
                                                                </td>
                                                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center">
                                                                    {elCompsCount > 0 ? (
                                                                        <span className="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-sm text-[8px] flex items-center justify-center gap-1 w-fit mx-auto font-bold">
                                                                            <Paperclip size={10}/> {elCompsCount}
                                                                        </span>
                                                                    ) : '-'}
                                                                </td>
                                                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center uppercase text-gray-400">-</td>
                                                                <td className="p-3 text-center text-gray-400 bg-gray-50">-</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </React.Fragment>
                                            )
                                        })}
                                        
                                        {isSpExpanded && spaces.length === 0 && (
                                            <tr className="bg-white border-b border-[#1c1c19]/20">
                                                <td colSpan={7} className="p-4 pl-10 text-gray-400 font-bold italic text-[10px] uppercase text-center">
                                                    SIN ESPACIOS CONFIGURADOS PARA ESTA UNIDAD.
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const tabs = [
        { id: 'subproject', label: 'POR SUBPROYECTO', icon: <Building2 size={16}/> },
        { id: 'level', label: 'POR NIVEL / PISO', icon: <Layers size={16}/> },
        { id: 'usage', label: 'POR PROGRAMA', icon: <BarChart2 size={16}/> },
        { id: 'details', label: 'DESGLOSE TÉCNICO', icon: <FileText size={16}/> }
    ];

    return (
        <div className="h-screen flex flex-col bg-[#fcf9f4] font-mono">
            {/* Header */}
            <div className="p-4 border-b-4 border-[#1c1c19] bg-[#1c1c19] text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate(`/project/${projectId}?tab=proyecto`)}
                        className="p-1 hover:bg-white/20 transition-all rounded"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black italic uppercase tracking-tighter text-[#e5e2dd]">
                            CUADRO DE ÁREAS ARQUITECTÓNICO
                        </h1>
                        <span className="text-[10px] font-bold text-[#a7f3d0] uppercase tracking-[0.2em]">PROYECTO: {projectId}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex shrink-0 bg-[#e5e2dd] border-b-4 border-[#1c1c19] overflow-x-auto">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-[200px] p-3 text-[11px] font-black uppercase tracking-widest transition-all border-r-2 border-[#1c1c19]/20 last:border-r-0 flex items-center justify-center gap-2
                            ${activeTab === tab.id ? 'bg-[#fcf9f4] text-[#1c1c19] shadow-[inset_0_4px_0_0_#16a34a]' : 'text-gray-500 hover:bg-[#d5d2cd] hover:text-[#1c1c19]'}`}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden p-6">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center"><Loader2 size={40} className="animate-spin text-[#1c1c19]" /></div>
                ) : (
                    <>
                        {activeTab === 'subproject' && renderSubProjectTab()}
                        {activeTab === 'level' && renderLevelTab()}
                        {activeTab === 'usage' && renderUsageTab()}
                        {activeTab === 'details' && renderDetailsTab()}
                    </>
                )}
            </div>
        </div>
    );
};

export default AreasManagerView;
