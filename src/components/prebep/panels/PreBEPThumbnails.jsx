import React from 'react';

export const PreBEPThumbnails = ({
  pageHeights,
  contentHeightMm
}) => {
  const offsets = [];
  let currentOffset = 0;
  for (let i = 0; i < pageHeights.length; i++) {
    offsets.push(currentOffset);
    currentOffset += pageHeights[i];
  }

  const thumbWidth = 48; // px

  return (
    <div className="no-print w-[80px] md:w-[100px] bg-[#2c2c29] border-r-2 border-[#1c1c19] flex flex-col items-center py-4 gap-3 overflow-y-auto z-10 flex-shrink-0">
      <div className="text-[9px] md:text-[10px] font-black uppercase text-white tracking-widest mb-1 text-center select-none">
        PÁGINAS
      </div>
      {pageHeights.map((h, i) => {
        const offsetY = offsets[i];
        const isEmpty = contentHeightMm > 0 && offsetY >= contentHeightMm + 20;
        const thumbHeight = Math.round(thumbWidth * (h / 215.9));

        return (
          <div 
            key={i}
            onClick={() => {
              const el = document.getElementById(`page-${i}`);
              if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            className="flex flex-col items-center gap-1 cursor-pointer group"
          >
            <div 
              className={`border-2 transition-all shadow-md relative bg-white flex flex-col items-center justify-between p-1 select-none ${
                isEmpty 
                  ? 'border-[#ba1a1a] opacity-40 hover:opacity-75' 
                  : 'border-[#1c1c19] group-hover:border-[#0f4369] group-hover:scale-105'
              }`}
              style={{
                width: `${thumbWidth}px`, 
                height: `${thumbHeight}px`,
                overflow: 'hidden'
              }}
            >
              <div className="absolute inset-1.5 flex flex-col gap-[3px] opacity-10 pointer-events-none">
                <div className="h-[2px] bg-black w-3/4"></div>
                <div className="h-[2px] bg-black w-full"></div>
                <div className="h-[2px] bg-black w-5/6"></div>
                <div className="h-[2px] bg-black w-full"></div>
                <div className="h-[2px] bg-black w-2/3"></div>
                <div className="h-[2px] bg-black w-4/5 mt-1"></div>
                <div className="h-[2px] bg-black w-full"></div>
              </div>
              {isEmpty && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#ba1a1a]/5 backdrop-blur-[0.5px]">
                  <span className="text-[7px] font-black text-[#ba1a1a] uppercase bg-white/90 px-1 py-0.5 rounded shadow-sm border border-[#ba1a1a]/20">Vacía</span>
                </div>
              )}
            </div>
            <span className={`text-[9px] font-mono font-bold ${isEmpty ? 'text-[#ba1a1a]' : 'text-gray-400 group-hover:text-white transition-colors'}`}>
              {i + 1}
            </span>
          </div>
        );
      })}
    </div>
  );
};
export default PreBEPThumbnails;
