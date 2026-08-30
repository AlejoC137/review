import React from 'react';

export const PreBEPIndexPage = ({
  chapterOrder,
  chapterVisibility,
  getChapterNum,
  getChapterLabel,
  activeTables
}) => {
  return (
    <div className="w-full py-4 flex flex-col" style={{ boxSizing: 'border-box' }}>
      <section className="mb-8 w-full">
        <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
          ÍNDICE DE CONTENIDO
        </h2>
        <ul className="list-none space-y-2 text-xs font-bold uppercase tracking-widest pl-4 border-l-4 border-[#0f4369]">
          {chapterOrder.filter(k => chapterVisibility[k]).map((k) => (
            <li key={k}>{getChapterNum(k)}. {getChapterLabel(k)}</li>
          ))}
        </ul>
      </section>
      
      {activeTables && activeTables.length > 0 && (
        <section className="mb-8 w-full">
          <h2 className="text-2xl font-black mb-4 border-b-2 border-[#1c1c19] pb-2 uppercase tracking-tight text-[#0f4369]">
            ÍNDICE DE TABLAS
          </h2>
          <ul className="list-none space-y-2 text-xs font-bold uppercase tracking-widest pl-4 border-l-4 border-amber-500">
            {activeTables.map((t) => (
              <li key={t.id} className="text-[#1c1c19]">
                TABLA {t.number}: <span className="font-medium text-[#0f4369]">{t.title}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="w-full border-t border-dashed border-gray-400 my-8"></div>
    </div>
  );
};
export default PreBEPIndexPage;
