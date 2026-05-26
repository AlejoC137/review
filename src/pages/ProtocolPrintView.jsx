import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import ContentBlockEditor from '../components/modules/ContentBlockEditor';
import { Layers, Book, Download, FileText, CheckCircle2 } from 'lucide-react';

export default function ProtocolPrintView() {
  const { protocolId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // 1. Fetch protocol
        const { data: protocolData, error: protocolError } = await supabase
          .from('resources')
          .select('*')
          .eq('id', protocolId)
          .single();
        
        if (protocolError) throw protocolError;

        // 2. Fetch children (manuals, templates)
        const { data: childrenData, error: childrenError } = await supabase
          .from('resources')
          .select('*')
          .eq('image_url', protocolId);
          
        if (childrenError) throw childrenError;

        // 3. Helper to fetch blocks
        const fetchBlocks = async (resource) => {
          const { data: blocks } = await supabase
            .from('resource_blocks')
            .select('*')
            .eq('resource_id', resource.id)
            .order('sort_order', { ascending: true });
            
          if (blocks && blocks.length > 0) return blocks;
          if (resource.manual) return [{ type: 'text', content: resource.manual, id: `migrated-${resource.id}` }];
          return [];
        };

        const protocolBlocks = await fetchBlocks(protocolData);
        
        const childrenWithBlocks = await Promise.all(childrenData.map(async (child) => {
          const blocks = await fetchBlocks(child);
          return { ...child, blocks };
        }));

        const manuals = childrenWithBlocks.filter(c => c.category === 'Manual');
        const templates = childrenWithBlocks.filter(c => c.category === 'Plantilla');

        setData({
          protocol: { ...protocolData, blocks: protocolBlocks },
          manuals,
          templates
        });
        
        // Allow time for rendering then print
        setTimeout(() => {
          window.print();
        }, 2000);

      } catch (err) {
        console.error("Error loading for print:", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (protocolId) {
      loadData();
    }
  }, [protocolId]);

  if (loading) {
    return (
      <div className="h-screen w-full flex flex-col items-center justify-center bg-[#fcf9f4]">
        <div className="w-16 h-16 border-4 border-[#1c1c19] border-t-transparent rounded-full animate-spin mb-4"></div>
        <div className="text-sm font-black uppercase tracking-[0.2em] text-[#1c1c19]">Generando Documento...</div>
      </div>
    );
  }

  if (!data) {
    return <div className="p-8 text-center text-sm font-bold text-red-500">Error al cargar el protocolo.</div>;
  }

  return (
    <div className="bg-white text-black min-h-screen font-sans print:bg-white print:p-0">
      
      {/* Estilos específicos para impresión */}
      <style>{`
        @media print {
          @page { size: letter; margin: 15mm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; background-color: white !important; }
          .page-break { page-break-before: always; break-before: page; display: block; height: 0px; overflow: hidden; }
          .avoid-break { page-break-inside: avoid; break-inside: avoid; }
          .cover-page { 
             height: 240mm !important; 
             page-break-after: always !important; 
             break-after: page !important;
             margin-bottom: 0 !important;
             display: flex;
             flex-direction: column;
          }
        }
      `}</style>

      {/* PORTADA (COVER PAGE) */}
      <div className="p-12 min-h-screen flex flex-col border-[12px] border-[#1c1c19] m-4 print:m-0 print:border-[8px] box-border relative overflow-hidden cover-page">
        
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 border-b-[12px] border-l-[12px] border-[#1c1c19] opacity-10"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 border-t-[12px] border-r-[12px] border-[#1c1c19] opacity-10"></div>

        <div className="flex-1 flex flex-col justify-center items-center text-center relative z-10">
          <div className="mb-12">
             <div className="w-24 h-24 bg-[#1c1c19] text-white flex items-center justify-center mx-auto mb-8 shadow-[8px_8px_0_0_rgba(15,67,105,0.3)]">
               <Layers size={48} />
             </div>
             <div className="text-xs font-black uppercase tracking-[0.5em] text-[#72777f] border-b-2 border-[#1c1c19] pb-2 inline-block">
               PROTOCOLO OFICIAL DE PROYECTO
             </div>
          </div>
          
          <h1 className="text-5xl lg:text-7xl font-black uppercase leading-[1.1] tracking-tighter mb-8 text-[#1c1c19] max-w-4xl">
            {data.protocol.title}
          </h1>
          
          {data.protocol.description && (
            <div className="bg-[#f6f3ee] border-l-4 border-[#1c1c19] p-6 max-w-2xl text-left shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
               <p className="text-lg font-medium text-[#1c1c19] italic">{data.protocol.description}</p>
            </div>
          )}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-8 border-t-4 border-[#1c1c19] pt-8 w-full z-10">
           <div>
             <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#72777f] mb-1">FECHA DE GENERACIÓN</div>
             <div className="text-sm font-bold uppercase">{new Date().toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
           </div>
           <div className="text-right">
             <div className="text-[10px] font-black uppercase tracking-[0.2em] text-[#72777f] mb-1">ESTADO DEL DOCUMENTO</div>
             <div className="text-sm font-bold uppercase flex items-center justify-end gap-2">
               <CheckCircle2 size={16} className="text-green-600" /> APROBADO
             </div>
           </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* ÍNDICE (TABLE OF CONTENTS) */}
      <div className="max-w-4xl mx-auto p-12 print:p-0 mt-12 print:mt-0 mb-24 print:mb-8">
        <h2 className="text-3xl font-black uppercase tracking-tighter border-b-4 border-[#1c1c19] pb-4 mb-8">Índice del Documento</h2>
        
        <div className="space-y-6 text-lg font-bold">
          <div className="flex justify-between items-end border-b-2 border-dotted border-gray-400 pb-2">
            <span className="uppercase">1. Protocolo Maestro: {data.protocol.title}</span>
          </div>
          
          {data.manuals.length > 0 && (
            <div className="pl-8 space-y-4 pt-4">
              <div className="text-sm text-gray-500 uppercase tracking-widest font-black mb-2">Manuales Secundarios</div>
              {data.manuals.map((m, idx) => (
                <div key={m.id} className="flex justify-between items-end border-b-2 border-dotted border-gray-300 pb-2 text-base">
                  <span>2.{idx + 1} {m.title}</span>
                </div>
              ))}
            </div>
          )}

          {data.templates.length > 0 && (
            <div className="pl-8 space-y-4 pt-4">
              <div className="text-sm text-gray-500 uppercase tracking-widest font-black mb-2">Plantillas y Anexos</div>
              {data.templates.map((t, idx) => (
                <div key={t.id} className="flex justify-between items-end border-b-2 border-dotted border-gray-300 pb-2 text-base">
                  <span>3.{idx + 1} {t.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="page-break"></div>

      <div className="max-w-4xl mx-auto p-12 print:p-0">
        
        {/* PROTOCOL CONTENT */}
        <div className="mb-16">
          <div className="flex items-center gap-4 border-b-4 border-[#1c1c19] pb-4 mb-8">
            <div className="w-12 h-12 bg-[#0f4369] text-white flex items-center justify-center font-black text-xl">1</div>
            <h2 className="text-3xl font-black uppercase tracking-tighter">Protocolo Maestro</h2>
          </div>
          
          <div className="prose prose-lg max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-tight prose-a:text-[#0f4369]">
            {data.protocol.blocks.length > 0 ? (
              <ContentBlockEditor blocks={data.protocol.blocks} isEditing={false} onChange={() => {}} onUploadImage={() => {}} />
            ) : (
              <p className="text-sm italic text-gray-500 border-l-4 border-gray-300 pl-4">No hay contenido redactado para el protocolo principal.</p>
            )}
          </div>
        </div>

        {/* MANUALS */}
        {data.manuals.length > 0 && (
          <div className="mt-16">
            <div className="page-break"></div>
            <div className="flex items-center gap-4 border-b-4 border-[#1c1c19] pb-4 mb-12">
              <div className="w-12 h-12 bg-[#1c1c19] text-white flex items-center justify-center font-black text-xl">2</div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Manuales Secundarios</h2>
            </div>
            
            <div className="space-y-16">
              {data.manuals.map((manual, idx) => (
                <div key={manual.id} className="avoid-break mb-12">
                  <div className="bg-[#f6f3ee] border-2 border-[#1c1c19] p-6 mb-6 shadow-[6px_6px_0_0_rgba(28,28,25,1)]">
                    <div className="flex items-center gap-3 mb-2">
                      <Book size={20} className="text-[#0f4369]" />
                      <span className="text-xs font-black uppercase tracking-widest text-[#72777f]">MANUAL 2.{idx + 1}</span>
                    </div>
                    <h3 className="text-2xl font-black uppercase">{manual.title}</h3>
                    {manual.description && <p className="mt-2 text-sm text-[#1c1c19]">{manual.description}</p>}
                  </div>
                  
                  <div className="pl-4 prose max-w-none prose-headings:font-bold prose-a:text-[#0f4369]">
                    {manual.blocks.length > 0 ? (
                      <ContentBlockEditor blocks={manual.blocks} isEditing={false} onChange={() => {}} onUploadImage={() => {}} />
                    ) : (
                      <p className="text-sm italic text-gray-500 border-l-4 border-gray-300 pl-4">No hay contenido redactado para este manual.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TEMPLATES */}
        {data.templates.length > 0 && (
          <div className="mt-16 page-break">
            <div className="flex items-center gap-4 border-b-4 border-[#1c1c19] pb-4 mb-12">
              <div className="w-12 h-12 bg-white text-[#1c1c19] border-4 border-[#1c1c19] flex items-center justify-center font-black text-xl">3</div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Plantillas y Anexos</h2>
            </div>
            
            <div className="grid grid-cols-1 gap-8">
              {data.templates.map((template, idx) => (
                <div key={template.id} className="avoid-break border-2 border-[#1c1c19] bg-white p-8 relative overflow-hidden">
                  
                  {/* Etiqueta lateral decorativa */}
                  <div className="absolute top-4 -right-10 bg-[#1c1c19] text-white text-[10px] font-black uppercase tracking-widest py-1 px-10 rotate-45">
                    ANEXO
                  </div>

                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 bg-[#0f4369] flex items-center justify-center flex-none">
                      <FileText size={24} className="text-white" />
                    </div>
                    <div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-[#72777f] mb-1">PLANTILLA 3.{idx + 1}</div>
                      <h4 className="text-xl font-black uppercase leading-tight">{template.title}</h4>
                      {template.description && <p className="text-sm mt-2 text-gray-700">{template.description}</p>}
                    </div>
                  </div>
                  
                  {template.url && (
                    <div className="bg-[#f6f3ee] border border-[#1c1c19] p-4 flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <Download size={16} className="text-[#1c1c19] flex-none" />
                        <span className="text-xs font-mono text-[#1c1c19] truncate">{template.url}</span>
                      </div>
                      <a 
                        href={template.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[10px] font-black uppercase tracking-widest bg-[#1c1c19] text-white px-3 py-2 flex-none hover:bg-[#0f4369] print:hidden"
                      >
                        Abrir Enlace
                      </a>
                    </div>
                  )}

                  <div className="mt-6 border-t border-gray-200 pt-6">
                    {template.blocks.length > 0 ? (
                      <div className="prose max-w-none text-sm">
                        <ContentBlockEditor blocks={template.blocks} isEditing={false} onChange={() => {}} onUploadImage={() => {}} />
                      </div>
                    ) : (
                      <p className="text-xs italic text-gray-500 text-center">Sin detalles adicionales.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
