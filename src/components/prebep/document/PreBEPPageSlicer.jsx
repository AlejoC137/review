import React, { useRef } from 'react';
import { Save, CheckCircle2, CloudOff } from 'lucide-react';

export const PreBEPPageSlicer = ({
  pageHeights,
  setPageHeights,
  contentHeightMm,
  configSaveStatus,
  addPage,
  deletePage,
  resetPages,
  handlePageHeightChange,
  renderedDocument
}) => {
  const isDragging = useRef(false);
  const dragIdx = useRef(null);
  const startY = useRef(0);
  const startH = useRef(0);

  const startDrag = (e, idx) => {
    e.preventDefault();
    isDragging.current = true;
    dragIdx.current = idx;
    startY.current = e.clientY;
    startH.current = pageHeights[idx];

    const onMouseMove = (moveEvent) => {
      if (!isDragging.current) return;
      const deltaPx = moveEvent.clientY - startY.current;
      // 1px ≈ 0.264583 mm (en 96 DPI: 1in = 25.4mm, 96px = 25.4mm → 1px = 25.4/96 mm)
      const deltaMm = deltaPx * (25.4 / 96);
      const newHeight = Math.max(50, Math.round((startH.current + deltaMm) * 10) / 10);

      setPageHeights(prev => {
        const next = [...prev];
        next[dragIdx.current] = newHeight;
        return next;
      });
    };

    const onMouseUp = () => {
      isDragging.current = false;
      dragIdx.current = null;
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Calcular offsets acumulados de contenido visible
  const offsets = [];
  let currentOffset = 0;
  for (let i = 0; i < pageHeights.length; i++) {
    offsets.push(currentOffset);
    currentOffset += pageHeights[i];
  }

  return (
    <div className="flex-1 overflow-y-auto w-full py-10 px-4 flex flex-col items-center print:p-0 print:block print:overflow-visible prebep-pages-scroll scroll-smooth bg-[#f0ede6]">
      
      {/* PANEL DE CONTROL DE ENCUADRE (PÁGINAS) */}
      <div className="no-print bg-white border-2 border-[#1c1c19] p-4 mb-6 shadow-[4px_4px_0_0_rgba(28,28,25,1)] w-[215.9mm] flex justify-between items-center gap-4">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-[#0f4369] uppercase">Control de Encuadre / Páginas</span>
            {configSaveStatus === 'saving' && (
              <span className="flex items-center gap-1 text-[8px] text-amber-600 uppercase font-black animate-pulse">
                <Save size={9} className="animate-spin" /> Guardando...
              </span>
            )}
            {configSaveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-[8px] text-green-600 uppercase font-black">
                <CheckCircle2 size={9} /> Guardado
              </span>
            )}
            {configSaveStatus === 'error' && (
              <span className="flex items-center gap-1 text-[8px] text-red-600 uppercase font-black">
                <CloudOff size={9} /> Error al guardar
              </span>
            )}
          </div>
          <span className="text-[8px] text-gray-500 uppercase">
            {pageHeights.length} página{pageHeights.length !== 1 ? 's' : ''} · La configuración se guarda automáticamente en la nube.
          </span>
          <span className="text-[7px] text-gray-400 uppercase">Para imprimir: márgenes en "Ninguno" y sin cabeceras/pies.</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={addPage}
            className="px-3 py-1.5 bg-[#0f4369] text-white border-2 border-[#1c1c19] text-[9px] font-black uppercase tracking-wider hover:bg-[#16507c] transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
          >
            + Agregar Página
          </button>
          <button 
            onClick={() => deletePage(pageHeights.length - 1)}
            className="px-3 py-1.5 bg-[#ba1a1a] text-white border-2 border-[#1c1c19] text-[9px] font-black uppercase tracking-wider hover:bg-red-700 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            disabled={pageHeights.length <= 1}
          >
            - Eliminar Última
          </button>
          <button 
            onClick={resetPages}
            className="px-3 py-1.5 bg-white text-[#1c1c19] border-2 border-[#1c1c19] text-[9px] font-black uppercase tracking-wider hover:bg-gray-150 transition-colors shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
          >
            Restablecer
          </button>
        </div>
      </div>

      {/* VISTA NATIVA SOLO PARA IMPRESIÓN */}
      <div className="hidden print:block w-[215.9mm] mx-auto bg-white" style={{ paddingLeft: '20mm', paddingRight: '20mm', boxSizing: 'border-box' }}>
        {renderedDocument}
      </div>

      {/* RENDERIZADO DE LAS PÁGINAS COMO VIEWPORTS (Solo Pantalla) */}
      <div className="print:hidden w-full flex flex-col items-center">
        {pageHeights.map((height, idx) => {
          const offsetY = offsets[idx];
          const isLast = idx === pageHeights.length - 1;
          const isEmpty = contentHeightMm > 0 && offsetY >= contentHeightMm + 20;

          return (
            <div 
              key={idx} 
              id={`page-${idx}`}
              className={`flex flex-col items-center page-container no-break ${isLast ? 'last-page' : 'normal-page'} ${isEmpty ? 'empty-page' : ''}`}
              style={isEmpty ? { opacity: 0.4 } : undefined}
            >
              {isEmpty && (
                <div className="no-print bg-[#ba1a1a] text-white text-[9px] font-black uppercase px-3 py-1 mb-2 border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)]">
                  Página Vacía - No se incluirá en la impresión
                </div>
              )}
              {/* Contenedor Físico de Página (Dimensiones Carta) */}
              <div 
                className="page-wrapper relative bg-white overflow-hidden"
                style={{
                  width: '215.9mm',
                  height: `${height}mm`,
                  '--page-print-height': `${height}mm`,
                  boxSizing: 'border-box'
                }}
              >
                {/* Contenedor de clip interno: solo padding horizontal para no desplazar el offset vertical */}
                <div 
                  className="absolute left-0 right-0 page-clip-inner"
                  style={{
                    top: `-${offsetY}mm`,
                    paddingLeft: '20mm',
                    paddingRight: '20mm',
                    boxSizing: 'border-box',
                    width: '100%'
                  }}
                >
                  {renderedDocument}
                </div>
                
                {/* Numeración de página n/n */}
                <div className="absolute bottom-[10mm] right-[20mm] text-[9px] font-bold text-gray-400 font-mono">
                  Página {idx + 1} / {pageHeights.length}
                </div>
              </div>

              {/* BARRA DE CORTE INTERACTIVA / ARRASTRE */}
              <div className="no-print w-[215.9mm] flex items-center justify-between py-1.5 px-2 bg-[#1c1c19] text-white text-[9px] font-mono mt-1 border-2 border-[#1c1c19]">
                <span className="font-bold uppercase tracking-wider text-[#fcf9f4]">
                  Página {idx + 1} · Alto: {height} mm
                </span>
                
                <div 
                  onMouseDown={(e) => startDrag(e, idx)}
                  className="flex-1 mx-4 flex items-center justify-center cursor-row-resize group/drag py-1"
                  title="Arrastra para ajustar el alto de corte de esta página"
                >
                  <div className="w-full h-[3px] bg-gray-500 group-hover/drag:bg-[#0f4369] transition-colors rounded"></div>
                  <span className="absolute bg-[#0f4369] text-white text-[8px] font-black px-2 py-0.5 rounded opacity-0 group-hover/drag:opacity-100 transition-opacity pointer-events-none uppercase">
                    ↔ Arrastrar para ajustar
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <input 
                    type="number" 
                    value={height}
                    onChange={(e) => handlePageHeightChange(idx, e.target.value)}
                    step="5"
                    min="50"
                    max="600"
                    className="w-14 bg-white text-black px-1.5 py-0.5 text-[9px] font-bold border border-gray-400 text-center outline-none"
                  />
                  <span className="text-[8px] text-gray-400">mm</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
export default PreBEPPageSlicer;
