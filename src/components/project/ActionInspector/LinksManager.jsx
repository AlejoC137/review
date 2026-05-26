import React, { useState } from 'react';
import { Link as LinkIcon, Plus, X, Trash2, ExternalLink } from 'lucide-react';

export default function LinksManager({ linksStr, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const links = React.useMemo(() => {
    try {
      const parsed = JSON.parse(linksStr || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }, [linksStr]);

  const handleAddLink = () => {
    if (!newUrl.trim()) return;
    const link = {
      id: Date.now(),
      title: newTitle || 'Enlace sin título',
      url: newUrl.startsWith('http') ? newUrl : `https://${newUrl}`,
    };
    const updated = [...links, link];
    onChange(JSON.stringify(updated));
    setNewTitle('');
    setNewUrl('');
  };

  const handleRemoveLink = (id) => {
    const updated = links.filter(l => l.id !== id);
    onChange(JSON.stringify(updated));
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`h-8 px-3 border-2 border-[#1c1c19] flex items-center gap-2 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 font-black uppercase text-[9px] tracking-widest ${isOpen ? 'bg-[#d1a457] text-white' : 'bg-white text-[#1c1c19]'}`}
      >
        <LinkIcon size={12} /> 
        <span>Links ({links.length})</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white border-4 border-[#1c1c19] shadow-[10px_10px_0_0_rgba(0,0,0,1)] w-full max-w-md flex flex-col max-h-[70vh]">
            <div className="bg-[#1c1c19] text-white p-4 flex justify-between items-center">
              <h3 className="font-black italic uppercase tracking-tighter flex items-center gap-2">
                <LinkIcon size={18} /> Enlaces de Interés
              </h3>
              <button onClick={() => setIsOpen(false)} className="hover:text-red-500 transition-colors">
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto">
              {/* New Link Form */}
              <div className="space-y-3 p-4 bg-[#f6f3ee] border-2 border-[#1c1c19]">
                <div>
                  <label className="text-[9px] font-black text-[#72777f] uppercase block mb-1">Título del Enlace</label>
                  <input 
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-white border-2 border-[#1c1c19] px-2 py-1.5 text-xs font-bold uppercase outline-none"
                    placeholder="Ej. Carpeta Drive, Plano PDF..."
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black text-[#72777f] uppercase block mb-1">URL (Destino)</label>
                  <input 
                    type="text"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="w-full bg-white border-2 border-[#1c1c19] px-2 py-1.5 text-xs font-bold outline-none"
                    placeholder="https://..."
                  />
                </div>
                <button 
                  onClick={handleAddLink}
                  disabled={!newUrl.trim()}
                  className="w-full py-2 bg-[#d1a457] text-white font-black uppercase text-[10px] tracking-widest hover:bg-[#b58d4a] transition-all disabled:opacity-50"
                >
                  AÑADIR ENLACE
                </button>
              </div>

              {/* History */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-black uppercase text-[#1c1c19] border-b-2 border-[#1c1c19] pb-1">Enlaces Registrados</h4>
                {links.length === 0 ? (
                  <div className="text-center py-6 text-[#72777f] italic text-xs font-bold uppercase tracking-widest">No hay enlaces guardados</div>
                ) : (
                  links.map(link => (
                    <div key={link.id} className="bg-white border-2 border-[#1c1c19] p-3 flex items-center justify-between group hover:bg-[#fcf9f4] transition-all">
                      <div className="flex-1 min-w-0 pr-4">
                        <span className="text-[10px] font-black uppercase block truncate">{link.title}</span>
                        <span className="text-[8px] font-mono text-[#72777f] block truncate">{link.url}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-1.5 bg-[#0f4369] text-white hover:scale-110 transition-all"
                        >
                          <ExternalLink size={12} />
                        </a>
                        <button 
                          onClick={() => handleRemoveLink(link.id)}
                          className="p-1.5 bg-red-100 text-red-600 hover:bg-red-600 hover:text-white transition-all"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
