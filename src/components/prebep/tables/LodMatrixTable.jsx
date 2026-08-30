import React from 'react';
import { STATIC_ELEMENTS, formatPhase } from '../utils/preBepHelpers';

export const LodMatrixTable = ({
  lodTdi,
  specialties,
  visibleColumns,
  lodExpandedDisciplines,
  toggleLodDiscipline
}) => {
  const getPhaseColor = (discipline, lod) => {
    const disc = (discipline || '').toLowerCase();
    if (disc.includes('estruct')) return 'bg-sky-50 text-sky-800 border-sky-300';
    if (disc.includes('arquit')) return 'bg-amber-50 text-amber-800 border-amber-300';
    if (disc.includes('hidro') || disc.includes('plom') || disc.includes('sanit')) return 'bg-cyan-50 text-cyan-800 border-cyan-300';
    if (disc.includes('elec')) return 'bg-yellow-50 text-yellow-800 border-yellow-300';
    if (disc.includes('hvac') || disc.includes('clima') || disc.includes('mec')) return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    if (disc.includes('incend')) return 'bg-rose-50 text-rose-800 border-rose-300';
    return 'bg-slate-50 text-slate-800 border-slate-300';
  };

  const parseNotes = (notesString, staticEl) => {
    let raw = (notesString || '').trim();
    const result = {
      formato: 'Nativo (.rvt / .ifc)',
      conceptual: '-',
      anteproyecto: '-',
      detallado: '-',
      documentacion: '-',
      general: '-'
    };

    if (staticEl) {
      result.formato = 'Nativo (.rvt / .ifc)';
      result.conceptual = 'LOD 100 / TDI 1';
      result.anteproyecto = 'LOD 200 / TDI 1';
      result.detallado = `${staticEl.lod} / ${staticEl.tdi}`;
      result.documentacion = `${staticEl.lod} / ${staticEl.tdi}`;
      result.general = 'Definición estándar de elementos constructivos para coordinación BIM.';
    }

    if (!raw) return result;

    if (raw.startsWith('{') && raw.endsWith('}')) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.formato) result.formato = parsed.formato;
        if (parsed.conceptual) result.conceptual = parsed.conceptual;
        if (parsed.anteproyecto) result.anteproyecto = parsed.anteproyecto;
        if (parsed.detallado) result.detallado = parsed.detallado;
        if (parsed.documentacion) result.documentacion = parsed.documentacion;
        if (parsed.general) result.general = parsed.general;
        return result;
      } catch (e) {}
    }

    const clean = raw.replace(/[{}"]/g, '');
    const pairs = clean.split(',').map(p => p.trim());
    pairs.forEach(pair => {
      const [k, v] = pair.split(':').map(s => s ? s.trim() : '');
      if (k && v) {
        const kl = k.toLowerCase();
        if (kl.includes('format')) result.formato = v;
        else if (kl.includes('concept')) result.conceptual = v;
        else if (kl.includes('ante') || kl.includes('esquema')) result.anteproyecto = v;
        else if (kl.includes('detall') || kl.includes('desarroll')) result.detallado = v;
        else if (kl.includes('doc') || kl.includes('const')) result.documentacion = v;
        else if (kl.includes('gen') || kl.includes('nota')) result.general = v;
      }
    });

    if (result.general === '-' && !raw.includes(':')) {
      result.general = raw;
    }

    return result;
  };

  const disciplines = lodTdi.length > 0
    ? [...new Set(lodTdi.map(item => item.disciplina || item.discipline || 'General'))]
    : (specialties && specialties.length > 0 ? specialties.map(s => s.nombre || s.name) : ['General']);

  return (
    <div className="border border-[#1c1c19] overflow-hidden my-3 w-full text-left">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="bg-[#1c1c19] text-white">
              {visibleColumns.includes('disciplina') && (
                <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider w-[120px]">
                  DISCIPLINA
                </th>
              )}
              {visibleColumns.includes('elemento') && (
                <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider w-[180px]">
                  ELEMENTO / SISTEMA
                </th>
              )}
              {visibleColumns.includes('tdi') && (
                <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider text-center w-[70px]">
                  TDI
                </th>
              )}
              {visibleColumns.includes('lod') && (
                <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider text-center w-[75px]">
                  LOD
                </th>
              )}
              {visibleColumns.includes('formato') && (
                <th className="p-2 border-r border-gray-600 text-[10px] font-black uppercase tracking-wider text-center w-[90px]">
                  FORMATO
                </th>
              )}
              {visibleColumns.includes('fase_conceptual') && (
                <th className="p-2 border-r border-gray-600 text-[9px] font-black uppercase tracking-wider text-center w-[85px] bg-[#2a2a26]">
                  {formatPhase('diseno_conceptual')}
                </th>
              )}
              {visibleColumns.includes('fase_anteproyecto') && (
                <th className="p-2 border-r border-gray-600 text-[9px] font-black uppercase tracking-wider text-center w-[85px] bg-[#2a2a26]">
                  {formatPhase('anteproyecto')}
                </th>
              )}
              {visibleColumns.includes('fase_detallado') && (
                <th className="p-2 border-r border-gray-600 text-[9px] font-black uppercase tracking-wider text-center w-[85px] bg-[#2a2a26]">
                  {formatPhase('diseno_detallado')}
                </th>
              )}
              {visibleColumns.includes('fase_documentacion') && (
                <th className="p-2 border-r border-gray-600 text-[9px] font-black uppercase tracking-wider text-center w-[85px] bg-[#2a2a26]">
                  {formatPhase('documentacion')}
                </th>
              )}
              {visibleColumns.includes('notas') && (
                <th className="p-2 text-[10px] font-black uppercase tracking-wider min-w-[140px]">
                  NOTAS / REQUISITOS DE INFORMACIÓN
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1c1c19]">
            {disciplines.map((discipline, dIdx) => {
              const discItems = lodTdi.filter(item => (item.disciplina || item.discipline || 'General') === discipline);
              const itemsToRender = discItems.length > 0
                ? discItems
                : STATIC_ELEMENTS.filter(el => el.discipline.toLowerCase() === discipline.toLowerCase());

              const isExpanded = lodExpandedDisciplines[discipline] ?? true;
              const hasMultiple = itemsToRender.length > 3;

              return (
                <React.Fragment key={dIdx}>
                  <tr className="bg-[#e5e0d8] border-y border-[#1c1c19]">
                    <td colSpan={visibleColumns.length} className="p-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-[#0f4369] text-[10px] uppercase tracking-wider">
                          DISCIPLINA: {discipline}
                        </span>
                        {hasMultiple && (
                          <button
                            type="button"
                            onClick={() => toggleLodDiscipline(discipline)}
                            className="no-print text-[9px] font-bold text-[#0f4369] hover:underline px-2 py-0.5 bg-white border border-[#1c1c19] rounded shadow-sm"
                          >
                            {isExpanded ? '▲ Colapsar' : `▼ Expandir (${itemsToRender.length} elementos)`}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {isExpanded && itemsToRender.map((row, rIdx) => {
                    const elName = row.elemento || row.element_name || row.nombre || row.name || row.element || 'Elemento General';
                    const tdiVal = row.tdi || row.tdi_level || row.nivel_tdi || 'TDI 2';
                    const lodVal = row.lod || row.lod_level || row.nivel_lod || 'LOD 300';
                    const staticEl = STATIC_ELEMENTS.find(el => el.discipline === discipline && el.element === elName);
                    const parsed = parseNotes(row.notas || row.notes || row.descripcion || '', staticEl);

                    return (
                      <tr key={row.id || rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]'}>
                        {visibleColumns.includes('disciplina') && (
                          <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold text-gray-500 uppercase">
                            {discipline}
                          </td>
                        )}
                        {visibleColumns.includes('elemento') && (
                          <td className="p-2 border-r border-[#1c1c19] text-[9px] font-bold text-[#1c1c19]">
                            {elName}
                          </td>
                        )}
                        {visibleColumns.includes('tdi') && (
                          <td className="p-2 border-r border-[#1c1c19] text-[9px] text-center font-bold">
                            <span className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider border border-blue-300 font-mono">
                              {tdiVal}
                            </span>
                          </td>
                        )}
                        {visibleColumns.includes('lod') && (
                          <td className="p-2 border-r border-[#1c1c19] text-[9px] text-center font-bold">
                            <span className="bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider border border-indigo-300 font-mono">
                              {lodVal}
                            </span>
                          </td>
                        )}
                        {visibleColumns.includes('formato') && (
                          <td className="p-2 border-r border-[#1c1c19] text-[8px] text-center text-gray-700 font-mono">
                            {parsed.formato}
                          </td>
                        )}
                        {visibleColumns.includes('fase_conceptual') && (
                          <td className="p-2 border-r border-[#1c1c19] text-[8px] text-center font-mono">
                            <span className={`px-1 py-0.5 rounded border text-[8px] ${getPhaseColor(discipline, parsed.conceptual)}`}>
                              {parsed.conceptual}
                            </span>
                          </td>
                        )}
                        {visibleColumns.includes('fase_anteproyecto') && (
                          <td className="p-2 border-r border-[#1c1c19] text-[8px] text-center font-mono">
                            <span className={`px-1 py-0.5 rounded border text-[8px] ${getPhaseColor(discipline, parsed.anteproyecto)}`}>
                              {parsed.anteproyecto}
                            </span>
                          </td>
                        )}
                        {visibleColumns.includes('fase_detallado') && (
                          <td className="p-2 border-r border-[#1c1c19] text-[8px] text-center font-mono font-bold">
                            <span className={`px-1 py-0.5 rounded border text-[8px] ${getPhaseColor(discipline, parsed.detallado)}`}>
                              {parsed.detallado}
                            </span>
                          </td>
                        )}
                        {visibleColumns.includes('fase_documentacion') && (
                          <td className="p-2 border-r border-[#1c1c19] text-[8px] text-center font-mono font-bold">
                            <span className={`px-1 py-0.5 rounded border text-[8px] ${getPhaseColor(discipline, parsed.documentacion)}`}>
                              {parsed.documentacion}
                            </span>
                          </td>
                        )}
                        {visibleColumns.includes('notas') && (
                          <td className="p-2 text-[8px] text-gray-600 italic">
                            {parsed.general}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default LodMatrixTable;
