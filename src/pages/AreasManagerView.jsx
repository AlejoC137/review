import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, ArrowLeft, Layers, Box, ChevronDown, ChevronRight } from 'lucide-react';
import { levelsService } from '../services/levelsService';

const AreasManagerView = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const projectId = searchParams.get('projectId') || 'kengo-kuma';

    const [levels, setLevels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('norma'); // 'norma', 'overview', 'intervenida', 'piso'

    useEffect(() => {
        loadData();
    }, [projectId]);

    const loadData = async () => {
        setLoading(true);
        try {
            const levelsRes = await levelsService.getLevels(projectId);
            setLevels(levelsRes || []);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Separate levels
    const rootLevels = levels.filter(l => !l.parent_id).sort((a, b) => (a.indice || 0) - (b.indice || 0));
    const childLevels = levels.filter(l => l.parent_id);

    // Helpers
    const getAreaVal = (subLotes, name, type) => {
        const lote = subLotes.find(l => l.name === name);
        if (!lote) return 0;
        return type === 'built' ? (parseFloat(lote.built_area) || 0) : (parseFloat(lote.uncovered_area) || 0);
    };

    const isCirculationOrTech = (usageType) => {
        if (!usageType) return false;
        const u = usageType.toLowerCase();
        return u.includes('circulation') || u.includes('technical');
    };

    const isAccommodation = (usageType) => {
        if (!usageType) return false;
        return usageType.toLowerCase().includes('accommodation');
    };

    const renderNorma = () => {
        // Calculate dynamic values
        let numHabitaciones = 0;
        let totalBuiltAll = 0;

        childLevels.forEach(child => {
            const usage = child.project_area_details?.[0]?.usage_type || '';
            if (isAccommodation(usage) && child.nombre.toLowerCase().includes('room')) {
                numHabitaciones++;
            }
            
            (child.project_area_details || []).forEach(det => {
                totalBuiltAll += parseFloat(det.built_area) || 0;
            });
        });

        return (
            <div className="bg-white border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)] p-6 overflow-auto">
                <table className="w-full text-left border-collapse font-mono text-sm">
                    <thead className="bg-[#1c1c19] text-white">
                        <tr>
                            <th className="p-3 border-r-2 border-[#1c1c19]/20 w-1/2">AGORA de Click Clack por Kengo Kuma</th>
                            <th className="p-3 border-r-2 border-[#1c1c19]/20 w-1/4 text-center">REGULATION</th>
                            <th className="p-3 w-1/4 text-center">PROJECT</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-[#f6f3ee] font-bold">
                            <td className="p-3 border-b border-r-2 border-[#1c1c19]/20">CI 10A #37-28</td>
                            <td className="p-3 border-b border-r-2 border-[#1c1c19]/20"></td>
                            <td className="p-3 border-b"></td>
                        </tr>
                        {[
                            ['ÁREA BRUTA LOTE', '502,74', '502,74'],
                            ['FRENTE LOTE', '16,84', '16,84'],
                            ['FONDO LOTE', '30,00', '30,00'],
                            ['ALTURA', '8 PISOS', '8 PISOS'],
                            ['ÁREA ÍNDICE OCUPACIÓN 1 PISO', '402,19', '431,60'],
                            ['ÍNDICE DE OCUPACIÓN PLATAFORMA', '80%', '86%'],
                            ['ÁREA ÍNDICE OCUPACIÓN TORRE (4 PISO)', '301,64', '221,64'],
                            ['ÍNDICE DE OCUPACIÓN TORRE (4 PISO)', '60%', '56,90%'],
                            ['ÁREA TOTAL CONSTRUIDA', '', totalBuiltAll.toFixed(2)],
                            ['ÁREA QUE CUENTA PARA ÍNDICE DE CONSTRUCCIÓN', '', ''],
                            ['NÚMERO HABITACIONES', '', numHabitaciones],
                            ['CELDAS DE CARGUE Y DESCARGUE', '1', '0'],
                            ['CAR LOBBY', '1', '0']
                        ].map((row, i) => (
                            <tr key={i} className="border-b border-[#1c1c19]/20 hover:bg-[#f6f3ee]">
                                <td className="p-3 border-r-2 border-[#1c1c19]/20">{row[0]}</td>
                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center">{row[1]}</td>
                                <td className={`p-3 text-center ${row[2] !== row[1] && row[2] !== '' ? 'text-red-500 font-bold' : ''}`}>{row[2]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    const renderOverview = () => {
        const revenueData = [];
        let allCirculationWithin = 0;
        let allCirculationExt = 0;
        let allTechWithin = 0;
        let allTechExt = 0;

        let totalRevWithin = 0;
        let totalRevExt = 0;
        let totalCommercial = 0;
        let totalAccommodation = 0;

        rootLevels.forEach(floor => {
            const children = childLevels.filter(c => c.parent_id === floor.id);
            const programs = {};
            
            children.forEach(child => {
                const sub = child.project_area_details || [];
                const usage = sub[0]?.usage_type || 'Unknown';
                const within = getAreaVal(sub, 'WITHIN NEW PLOT', 'built');
                const ext = getAreaVal(sub, 'EXTENSION EXISTING PLOT', 'built') + getAreaVal(sub, 'EXTENSION EXISTING PLOT - REFURBISHMENT', 'built');

                if (isCirculationOrTech(usage)) {
                    if (usage.toLowerCase().includes('technical')) {
                        allTechWithin += within;
                        allTechExt += ext;
                    } else {
                        allCirculationWithin += within;
                        allCirculationExt += ext;
                    }
                } else {
                    if (!programs[usage]) programs[usage] = { within: 0, ext: 0 };
                    programs[usage].within += within;
                    programs[usage].ext += ext;
                    totalRevWithin += within;
                    totalRevExt += ext;

                    if (isAccommodation(usage)) {
                        totalAccommodation += (within + ext);
                    } else {
                        totalCommercial += (within + ext);
                    }
                }
            });

            Object.keys(programs).forEach(prog => {
                revenueData.push({
                    floor: floor.nombre,
                    space: prog,
                    within: programs[prog].within,
                    ext: programs[prog].ext,
                    total: programs[prog].within + programs[prog].ext
                });
            });
        });

        const totalBuiltWithin = totalRevWithin + allCirculationWithin + allTechWithin;
        const totalBuiltExt = totalRevExt + allCirculationExt + allTechExt;
        const totalBuilt = totalBuiltWithin + totalBuiltExt;

        return (
            <div className="bg-white border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)] p-6 overflow-auto">
                <table className="w-full text-left border-collapse font-mono text-sm">
                    <thead>
                        <tr className="bg-[#1c1c19] text-white">
                            <th colSpan={4} className="p-3 text-center text-lg tracking-widest uppercase">AREAS OVERVIEW</th>
                        </tr>
                        <tr className="bg-[#e5e2dd]">
                            <th className="p-3 border-r-2 border-[#1c1c19]/20 w-1/4">FLOOR</th>
                            <th className="p-3 border-r-2 border-[#1c1c19]/20 w-1/4">SPACE</th>
                            <th className="p-3 border-r-2 border-[#1c1c19]/20 w-1/4 text-center">
                                COVERED GROSS AREA<br/>REMUNERATED AREAS
                                <div className="flex w-full mt-2 border-t-2 border-[#1c1c19]/20">
                                    <div className="w-1/2 p-2 border-r-2 border-[#1c1c19]/20">Within Plot</div>
                                    <div className="w-1/2 p-2">Extensions</div>
                                </div>
                            </th>
                            <th className="p-3 w-1/4 text-center">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr className="bg-white font-bold border-b-2 border-[#1c1c19]/20"><td colSpan={4} className="p-3 uppercase">PROGRAMME WITH REVENUE</td></tr>
                        {revenueData.map((row, i) => (
                            <tr key={i} className="border-b border-[#1c1c19]/10">
                                <td className="p-3 border-r-2 border-[#1c1c19]/20">{row.floor}</td>
                                <td className="p-3 border-r-2 border-[#1c1c19]/20">{row.space}</td>
                                <td className="p-0 border-r-2 border-[#1c1c19]/20 h-full">
                                    <div className="flex h-full text-center">
                                        <div className="w-1/2 p-3 bg-[#a7f3d0]/30">{row.within > 0 ? `${row.within} m²` : ''}</div>
                                        <div className="w-1/2 p-3 bg-[#fed7aa]/30">{row.ext > 0 ? `${row.ext} m²` : ''}</div>
                                    </div>
                                </td>
                                <td className="p-3 text-center">{row.total > 0 ? `${row.total} m²` : ''}</td>
                            </tr>
                        ))}
                        <tr className="font-bold border-b-2 border-[#1c1c19]/20 bg-[#f6f3ee]">
                            <td colSpan={2} className="p-3 border-r-2 border-[#1c1c19]/20">TOTAL REVENUE</td>
                            <td className="p-0 border-r-2 border-[#1c1c19]/20 h-full">
                                <div className="flex h-full text-center">
                                    <div className="w-1/2 p-3">{totalRevWithin} m²</div>
                                    <div className="w-1/2 p-3">{totalRevExt} m²</div>
                                </div>
                            </td>
                            <td className="p-3 text-center">{totalRevWithin + totalRevExt} m²</td>
                        </tr>
                        
                        <tr className="border-b border-[#1c1c19]/10">
                            <td className="p-3 border-r-2 border-[#1c1c19]/20">ALL FLOORS</td>
                            <td className="p-3 border-r-2 border-[#1c1c19]/20">Circulations</td>
                            <td className="p-0 border-r-2 border-[#1c1c19]/20 h-full">
                                <div className="flex h-full text-center">
                                    <div className="w-1/2 p-3 bg-[#a7f3d0]/30">{allCirculationWithin} m²</div>
                                    <div className="w-1/2 p-3 bg-[#fed7aa]/30">{allCirculationExt} m²</div>
                                </div>
                            </td>
                            <td className="p-3 text-center">{allCirculationWithin + allCirculationExt} m²</td>
                        </tr>
                        <tr className="border-b border-[#1c1c19]/10">
                            <td className="p-3 border-r-2 border-[#1c1c19]/20">ALL FLOORS</td>
                            <td className="p-3 border-r-2 border-[#1c1c19]/20">Technical areas</td>
                            <td className="p-0 border-r-2 border-[#1c1c19]/20 h-full">
                                <div className="flex h-full text-center">
                                    <div className="w-1/2 p-3 bg-[#a7f3d0]/30">{allTechWithin} m²</div>
                                    <div className="w-1/2 p-3 bg-[#fed7aa]/30">{allTechExt} m²</div>
                                </div>
                            </td>
                            <td className="p-3 text-center">{allTechWithin + allTechExt} m²</td>
                        </tr>

                        <tr className="font-bold border-b-2 border-[#1c1c19] bg-[#1c1c19] text-white">
                            <td colSpan={2} className="p-3 border-r-2 border-[#1c1c19]/20">TOTAL BUILT</td>
                            <td className="p-0 border-r-2 border-[#1c1c19]/20 h-full">
                                <div className="flex h-full text-center">
                                    <div className="w-1/2 p-3">{totalBuiltWithin} m²</div>
                                    <div className="w-1/2 p-3">{totalBuiltExt} m²</div>
                                </div>
                            </td>
                            <td className="p-3 text-center">{totalBuilt} m²</td>
                        </tr>

                        <tr className="h-4 bg-white"><td colSpan={4}></td></tr>

                        <tr className="bg-[#e5e2dd] border-b border-[#1c1c19]/20 font-bold">
                            <td colSpan={2} className="p-3 border-r-2 border-[#1c1c19]/20">TOTAL Commercial m2</td>
                            <td colSpan={2} className="p-3">{totalCommercial} m²</td>
                        </tr>
                        <tr className="bg-[#e5e2dd] font-bold">
                            <td colSpan={2} className="p-3 border-r-2 border-[#1c1c19]/20">TOTAL Accommodation m2</td>
                            <td colSpan={2} className="p-3">{totalAccommodation} m²</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        );
    };

    const TableHeader = () => (
        <thead className="bg-white sticky top-0 z-10 text-[10px] font-black uppercase tracking-wider shadow-sm">
            <tr>
                <th className="p-2 border-b-2 border-r-2 border-[#1c1c19]/20 w-32 bg-[#e5e2dd]" rowSpan={2}>PROGRAM</th>
                <th className="p-2 border-b-2 border-r-2 border-[#1c1c19]/20 w-48 bg-[#e5e2dd]" rowSpan={2}>ROOM</th>
                <th className="p-2 border-b-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#4ade80]/20" colSpan={2}>WITHIN NEW PLOT</th>
                <th className="p-2 border-b-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#fdba74]/20" colSpan={2}>EXTENSION EXISTING PLOT</th>
                <th className="p-2 border-b-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#60a5fa]/20" colSpan={2}>EXTENSION EXISTING PLOT</th>
                <th className="p-2 border-b-2 border-[#1c1c19]/20 text-center bg-[#d1d5db]" rowSpan={2}>TOTAL NEW AND REFURBISHED COVERED AREA Gross</th>
            </tr>
            <tr>
                <th className="p-2 border-b-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#4ade80]/40 w-24">BUILT Gross</th>
                <th className="p-2 border-b-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#4ade80]/40 w-24">UNCOVERED Gross</th>
                <th className="p-2 border-b-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#fdba74]/40 w-24">NEW BUILD Gross</th>
                <th className="p-2 border-b-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#fdba74]/40 w-24">NEW UNCOVERED Gross</th>
                <th className="p-2 border-b-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#60a5fa]/40 w-24">INTERIOR REFURBISHMENT Gross</th>
                <th className="p-2 border-b-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#60a5fa]/40 w-24">EXTENSIONS UNCOVERED REFURBISHMENT Gross</th>
            </tr>
        </thead>
    );

    const calcTotalsForList = (list) => {
        let t = { wBuilt: 0, wUnc: 0, eBuilt: 0, eUnc: 0, rBuilt: 0, rUnc: 0, grand: 0, grandTotalAll: 0 };
        list.forEach(child => {
            const sub = child.project_area_details || [];
            const wB = getAreaVal(sub, 'WITHIN NEW PLOT', 'built');
            const wU = getAreaVal(sub, 'WITHIN NEW PLOT', 'uncovered');
            const eB = getAreaVal(sub, 'EXTENSION EXISTING PLOT', 'built');
            const eU = getAreaVal(sub, 'EXTENSION EXISTING PLOT', 'uncovered');
            const rB = getAreaVal(sub, 'EXTENSION EXISTING PLOT - REFURBISHMENT', 'built');
            const rU = getAreaVal(sub, 'EXTENSION EXISTING PLOT - REFURBISHMENT', 'uncovered');
            
            t.wBuilt += wB; t.wUnc += wU;
            t.eBuilt += eB; t.eUnc += eU;
            t.rBuilt += rB; t.rUnc += rU;
            
            t.grand += (wB + eB + rB);
            t.grandTotalAll += (wB + wU + eB + eU + rB + rU);
        });
        return t;
    };

    const renderIntervenida = () => {
        const t = calcTotalsForList(childLevels);

        return (
            <div className="bg-white border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)] flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto custom-scrollbar p-0">
                    <table className="w-full text-left border-collapse font-mono text-xs">
                        <TableHeader />
                        <tbody>
                            <tr className="border-b-2 border-[#1c1c19]/20 font-bold bg-[#f6f3ee]">
                                <td colSpan={2} className="p-3 border-r-2 border-[#1c1c19]/20">TOTAL</td>
                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#16a34a] bg-[#4ade80]/10">{t.wBuilt} m²</td>
                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#16a34a] bg-[#4ade80]/10">{t.wUnc} m²</td>
                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#ea580c] bg-[#fdba74]/10">{t.eBuilt} m²</td>
                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#ea580c] bg-[#fdba74]/10">{t.eUnc} m²</td>
                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#2563eb] bg-[#60a5fa]/10">{t.rBuilt} m²</td>
                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#2563eb] bg-[#60a5fa]/10">{t.rUnc} m²</td>
                                <td className="p-3 text-center bg-[#d1d5db]/30">{t.grand} m²</td>
                            </tr>
                            <tr className="border-b-2 border-[#1c1c19]/20 font-bold bg-[#e5e2dd]">
                                <td colSpan={2} className="p-3 border-r-2 border-[#1c1c19]/20">TOTAL</td>
                                <td colSpan={2} className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#16a34a]">{t.wBuilt + t.wUnc} m²</td>
                                <td colSpan={2} className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#ea580c]">{t.eBuilt + t.eUnc} m²</td>
                                <td colSpan={2} className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#2563eb]">{t.rBuilt + t.rUnc} m²</td>
                                <td className="p-3 text-center"></td>
                            </tr>
                            <tr className="font-bold border-t-4 border-[#1c1c19]">
                                <td colSpan={2} className="p-4 border-r-2 border-[#1c1c19]/20 text-sm">
                                    TOTAL ÁREA INTERVENIDA<br/>
                                    <span className="text-[9px] font-normal italic text-gray-500">Incluye área construida, área descubierta, zonas comunes, Antejardín, intervención hotel existente y cubierta</span>
                                </td>
                                <td colSpan={7} className="p-4 text-center text-xl bg-[#fcf9f4]">{t.grandTotalAll} m²</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderPorPiso = () => {
        const grandTotals = calcTotalsForList(childLevels);

        return (
            <div className="bg-white border-4 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,1)] flex-1 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse font-mono text-[10px]">
                        <TableHeader />
                        <tbody>
                            {rootLevels.map(floor => {
                                const children = childLevels.filter(c => c.parent_id === floor.id);
                                if (children.length === 0) return null;
                                const t = calcTotalsForList(children);

                                return (
                                    <React.Fragment key={floor.id}>
                                        <tr className="bg-[#e5e2dd] font-bold border-y-2 border-[#1c1c19]/40">
                                            <td colSpan={10} className="p-2 uppercase">{floor.nombre}</td>
                                        </tr>
                                        {children.map(child => {
                                            const sub = child.project_area_details || [];
                                            const usage = sub[0]?.usage_type || '-';
                                            const wB = getAreaVal(sub, 'WITHIN NEW PLOT', 'built');
                                            const wU = getAreaVal(sub, 'WITHIN NEW PLOT', 'uncovered');
                                            const eB = getAreaVal(sub, 'EXTENSION EXISTING PLOT', 'built');
                                            const eU = getAreaVal(sub, 'EXTENSION EXISTING PLOT', 'uncovered');
                                            const rB = getAreaVal(sub, 'EXTENSION EXISTING PLOT - REFURBISHMENT', 'built');
                                            const rU = getAreaVal(sub, 'EXTENSION EXISTING PLOT - REFURBISHMENT', 'uncovered');
                                            const g = wB + eB + rB;

                                            return (
                                                <tr key={child.id} className="border-b border-[#1c1c19]/10 hover:bg-[#fcf9f4]">
                                                    <td className="p-2 border-r-2 border-[#1c1c19]/20 truncate max-w-[120px]">{usage}</td>
                                                    <td className="p-2 border-r-2 border-[#1c1c19]/20 truncate max-w-[150px]">{child.nombre}</td>
                                                    <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#4ade80]/5">{wB > 0 ? `${wB} m²` : ''}</td>
                                                    <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#4ade80]/5">{wU > 0 ? `${wU} m²` : ''}</td>
                                                    <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#fdba74]/5">{eB > 0 ? `${eB} m²` : ''}</td>
                                                    <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#fdba74]/5">{eU > 0 ? `${eU} m²` : ''}</td>
                                                    <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#60a5fa]/5">{rB > 0 ? `${rB} m²` : ''}</td>
                                                    <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center bg-[#60a5fa]/5">{rU > 0 ? `${rU} m²` : ''}</td>
                                                    <td className="p-2 text-center bg-[#d1d5db]/10 font-bold">{g > 0 ? `${g} m²` : ''}</td>
                                                </tr>
                                            );
                                        })}
                                        <tr className="bg-[#f6f3ee] font-bold border-t border-[#1c1c19]/20">
                                            <td colSpan={2} className="p-2 border-r-2 border-[#1c1c19]/20 text-right pr-4">Total {floor.nombre}</td>
                                            <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center">{t.wBuilt > 0 ? `${t.wBuilt} m²` : ''}</td>
                                            <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center">{t.wUnc > 0 ? `${t.wUnc} m²` : ''}</td>
                                            <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center">{t.eBuilt > 0 ? `${t.eBuilt} m²` : ''}</td>
                                            <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center">{t.eUnc > 0 ? `${t.eUnc} m²` : ''}</td>
                                            <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center">{t.rBuilt > 0 ? `${t.rBuilt} m²` : ''}</td>
                                            <td className="p-2 border-r-2 border-[#1c1c19]/20 text-center">{t.rUnc > 0 ? `${t.rUnc} m²` : ''}</td>
                                            <td className="p-2 text-center">{t.grand > 0 ? `${t.grand} m²` : ''}</td>
                                        </tr>
                                    </React.Fragment>
                                );
                            })}
                            
                            <tr className="border-t-4 border-[#1c1c19] font-bold bg-[#e5e2dd]">
                                <td colSpan={2} className="p-3 border-r-2 border-[#1c1c19]/20">TOTAL</td>
                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#16a34a]">{grandTotals.wBuilt} m²</td>
                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#16a34a]">{grandTotals.wUnc} m²</td>
                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#ea580c]">{grandTotals.eBuilt} m²</td>
                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#ea580c]">{grandTotals.eUnc} m²</td>
                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#2563eb]">{grandTotals.rBuilt} m²</td>
                                <td className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#2563eb]">{grandTotals.rUnc} m²</td>
                                <td className="p-3 text-center">{grandTotals.grand} m²</td>
                            </tr>
                            <tr className="border-b-2 border-[#1c1c19]/20 font-bold bg-[#e5e2dd]">
                                <td colSpan={2} className="p-3 border-r-2 border-[#1c1c19]/20">TOTAL</td>
                                <td colSpan={2} className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#16a34a]">{grandTotals.wBuilt + grandTotals.wUnc} m²</td>
                                <td colSpan={2} className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#ea580c]">{grandTotals.eBuilt + grandTotals.eUnc} m²</td>
                                <td colSpan={2} className="p-3 border-r-2 border-[#1c1c19]/20 text-center text-[#2563eb]">{grandTotals.rBuilt + grandTotals.rUnc} m²</td>
                                <td className="p-3 text-center"></td>
                            </tr>
                            <tr className="font-bold border-b-4 border-[#1c1c19] bg-white">
                                <td colSpan={2} className="p-4 border-r-2 border-[#1c1c19]/20 text-xs">
                                    TOTAL ÁREA INTERVENIDA<br/>
                                    <span className="text-[9px] font-normal italic text-gray-500">Incluye área construida, área descubierta, zonas comunes, Antejardín, intervención hotel existente y cubierta</span>
                                </td>
                                <td colSpan={7} className="p-4 text-center text-lg">{grandTotals.grandTotalAll} m²</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const tabs = [
        { id: 'norma', label: 'AREA NORMA + RESUMEN' },
        { id: 'overview', label: 'AREAS OVERVIEW' },
        { id: 'intervenida', label: 'TOTAL ÁREA INTERVENIDA' },
        { id: 'piso', label: 'AREA POR PISO' }
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
                        <h1 className="text-xl font-black italic uppercase tracking-tighter">CUADRO DE ÁREAS</h1>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">PROYECTO: {projectId}</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex shrink-0 bg-[#e5e2dd] border-b-4 border-[#1c1c19]">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 p-3 text-xs font-black uppercase tracking-wider transition-all border-r-2 border-[#1c1c19]/20 last:border-r-0
                            ${activeTab === tab.id ? 'bg-[#fcf9f4] text-[#1c1c19] shadow-[inset_0_4px_0_0_#ea580c]' : 'text-gray-500 hover:bg-[#d5d2cd] hover:text-[#1c1c19]'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 flex flex-col overflow-hidden p-6">
                {loading ? (
                    <div className="flex-1 flex items-center justify-center"><Loader2 size={32} className="animate-spin text-[#1c1c19]" /></div>
                ) : (
                    <>
                        {activeTab === 'norma' && renderNorma()}
                        {activeTab === 'overview' && renderOverview()}
                        {activeTab === 'intervenida' && renderIntervenida()}
                        {activeTab === 'piso' && renderPorPiso()}
                    </>
                )}
            </div>
        </div>
    );
};

export default AreasManagerView;
