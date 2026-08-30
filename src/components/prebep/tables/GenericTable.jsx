import React from 'react';
import { cleanObjectFromUuids, renderObjectOrValue } from '../utils/preBepHelpers';

export const GenericTable = ({ tableName, records, error }) => {
  if (error) {
    return (
      <div className="p-3 bg-red-50 text-red-700 text-xs border border-red-200">
        Error al cargar {tableName}: {error}
      </div>
    );
  }

  if (!records || records.length === 0) {
    return (
      <div className="p-3 bg-gray-50 text-gray-500 text-xs italic border border-gray-200">
        No hay registros disponibles en {tableName}.
      </div>
    );
  }

  const columns = Object.keys(records[0]).filter(col => {
    const lower = col.toLowerCase();
    return lower !== 'id' && !lower.endsWith('_id') && !lower.includes('uuid');
  });

  const hasUuid = records.some(row => {
    return Object.entries(row).some(([key, val]) => {
      const isIdKey = key.toLowerCase().includes('id') || key.toLowerCase().includes('uuid') || key.toLowerCase() === 'key';
      const isUuidVal = typeof val === 'string' && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val);
      return isIdKey || isUuidVal;
    });
  });

  return (
    <div className="border border-[#1c1c19] overflow-hidden my-2 w-full text-left">
      <div className="bg-[#1c1c19] text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 flex justify-between items-center">
        <span>TABLA: {tableName}</span>
        <span className="text-[8px] text-[#fcf9f4] font-normal lowercase">{records.length} registros</span>
      </div>
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="bg-[#e5e0d8] border-b border-[#1c1c19]">
              {columns.map(col => (
                <th key={col} className="p-2 border-r border-[#1c1c19] text-[9px] font-black uppercase text-[#1c1c19] whitespace-nowrap">
                  {col.replace(/_/g, ' ')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map((row, rIdx) => {
              const cleanedRow = cleanObjectFromUuids(row);
              return (
                <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]'}>
                  {columns.map((col, cIdx) => (
                    <td key={cIdx} className="p-2 border-t border-r border-[#1c1c19] text-[9px] text-gray-800 align-top break-words max-w-[200px]">
                      {renderObjectOrValue(cleanedRow[col])}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default GenericTable;
