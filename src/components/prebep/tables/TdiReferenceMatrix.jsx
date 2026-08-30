import React from 'react';

export const TdiReferenceMatrix = () => {
  const tdiDefinitions = [
    { tdi: 'TDI 1', nivel: 'Básico', geom: 'LOD 100 - 200', desc: 'Información general de identificación, categoría y dimensiones aproximadas. Parámetros básicos de tipo.' },
    { tdi: 'TDI 2', nivel: 'Estándar', geom: 'LOD 300', desc: 'Definición de materiales, propiedades térmicas/acústicas generales, especificación técnica base y códigos de clasificación (Uniclass/Omniclass).' },
    { tdi: 'TDI 3', nivel: 'Avanzado', geom: 'LOD 350 - 400', desc: 'Datos del fabricante, modelo comercial, garantías, costos unitarios, secuencias de montaje y tolerancias de instalación.' },
    { tdi: 'TDI 4', nivel: 'As-Built / FM', geom: 'LOD 500', desc: 'Información para operación y mantenimiento (COBie), números de serie, fechas de instalación, manuales de mantenimiento y enlaces a fichas técnicas.' }
  ];

  return (
    <div className="border border-[#1c1c19] overflow-hidden my-3 w-full text-left">
      <div className="bg-[#0f4369] text-white text-[9px] font-black uppercase tracking-wider px-3 py-1">
        DEFINICIÓN DE NIVELES TDI (TAMAÑO DE DETALLE DE INFORMACIÓN)
      </div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-[#e5e0d8] text-[#1c1c19] border-b border-[#1c1c19]">
            <th className="p-1.5 border-r border-[#1c1c19] text-[8px] font-black uppercase w-16">NIVEL TDI</th>
            <th className="p-1.5 border-r border-[#1c1c19] text-[8px] font-black uppercase w-20">DENOMINACIÓN</th>
            <th className="p-1.5 border-r border-[#1c1c19] text-[8px] font-black uppercase w-24">GEOMETRÍA TÍPICA</th>
            <th className="p-1.5 text-[8px] font-black uppercase">REQUISITOS DE INFORMACIÓN NO GEOMÉTRICA (DATOS)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-300">
          {tdiDefinitions.map((item, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-[#fcf9f4]'}>
              <td className="p-1.5 border-r border-gray-300 text-[8px] font-black text-[#0f4369] font-mono">{item.tdi}</td>
              <td className="p-1.5 border-r border-gray-300 text-[8px] font-bold text-gray-700">{item.nivel}</td>
              <td className="p-1.5 border-r border-gray-300 text-[8px] font-mono text-gray-600">{item.geom}</td>
              <td className="p-1.5 text-[8px] text-gray-700">{item.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
export default TdiReferenceMatrix;
