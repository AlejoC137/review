import React, { useState, useEffect } from 'react';
import Sidebar from '../components/layout/Sidebar';
import Header from '../components/layout/Header';
import { 
  Book, Search, Plus, Trash2, Edit3, Save, X, 
  ChevronRight, ArrowUpRight, Loader2, Info
} from 'lucide-react';

const INITIAL_TERMS = [
  { id: 1, term: 'BIM', definition: 'Building Information Modeling. Process for creating and managing information on a construction project throughout its whole life cycle.', category: 'GENERAL' },
  { id: 2, term: 'LOD', definition: 'Level of Development. Specifies the content and reliability of BIM elements at different stages.', category: 'TECHNICAL' },
  { id: 3, term: 'IFC', definition: 'Industry Foundation Classes. Open file format for exchanging BIM data between different software.', category: 'STANDARDS' },
  { id: 4, term: 'COBIE', definition: 'Construction Operations Building information exchange. Non-proprietary data format for the publication of a subset of BIM.', category: 'STANDARDS' },
  { id: 5, term: 'CLASH DETECTION', definition: 'Automated process for identifying where building elements occupy the same space.', category: 'TECHNICAL' }
];

const DictionaryView = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [terms, setTerms] = useState(() => {
    const saved = localStorage.getItem('bim_dictionary_terms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error('Failed to parse dictionary terms from localStorage', e);
      }
    }
    return INITIAL_TERMS;
  });

  useEffect(() => {
    localStorage.setItem('bim_dictionary_terms', JSON.stringify(terms));
  }, [terms]);

  const [activeTermId, setActiveTermId] = useState(terms.length > 0 ? terms[0].id : null);
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [editTerm, setEditTerm] = useState('');
  const [editDefinition, setEditDefinition] = useState('');
  const [editCategory, setEditCategory] = useState('GENERAL');

  const activeTerm = terms.find(t => t.id === activeTermId);

  useEffect(() => {
    if (activeTerm) {
      setEditTerm(activeTerm.term);
      setEditDefinition(activeTerm.definition);
      setEditCategory(activeTerm.category);
    }
  }, [activeTerm]);

  const filteredTerms = terms.filter(t => 
    t.term.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    setTerms(prev => prev.map(t => 
      t.id === activeTermId 
        ? { ...t, term: editTerm, definition: editDefinition, category: editCategory }
        : t
    ));
    setIsEditing(false);
  };

  const handleCreate = () => {
    const newId = Math.max(...terms.map(t => t.id), 0) + 1;
    const newEntry = { 
      id: newId, 
      term: editTerm || 'NEW_TERM', 
      definition: editDefinition || 'Definition goes here...', 
      category: editCategory 
    };
    setTerms([...terms, newEntry]);
    setActiveTermId(newId);
    setIsCreating(false);
    resetForm();
  };

  const handleDelete = (id) => {
    if (!window.confirm("¿Seguro que quieres eliminar este término del diccionario?")) return;
    const newTerms = terms.filter(t => t.id !== id);
    setTerms(newTerms);
    if (activeTermId === id) {
      if (newTerms.length > 0) {
        setActiveTermId(newTerms[0].id);
      } else {
        setActiveTermId(null);
      }
    }
  };

  const resetForm = () => {
    setEditTerm('');
    setEditDefinition('');
    setEditCategory('GENERAL');
  };  return (
    <div className="flex-1 overflow-auto flex flex-col md:row h-full">
      <div className="flex h-full w-full">
        
        {/* LEFT PANEL: Term List */}
        <div className="w-full md:w-80 border-r-2 border-[#1c1c19] bg-[#e5e2dd]/50 flex flex-col shrink-0 overflow-y-auto custom-scrollbar">
          <div className="p-6 border-b-2 border-[#1c1c19] bg-[#e5e2dd]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-black tracking-widest uppercase">GLOSSARY_V1</h2>
              <div className="w-2 h-2 rounded-full bg-[#0f4369]"></div>
            </div>
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#72777f] group-focus-within:text-[#1c1c19] transition-colors" />
              <input
                type="text"
                placeholder="SEARCH_TERMS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#fcf9f4] border-2 border-[#1c1c19] py-2 pl-9 pr-3 text-[10px] font-bold focus:outline-none focus:ring-0 focus:shadow-[4px_4px_0_0_rgba(15,67,105,0.2)] transition-shadow"
              />
            </div>
          </div>

          <div className="p-3 space-y-1.5 flex-1 overflow-y-auto custom-scrollbar">
            {filteredTerms.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTermId(t.id);
                  setIsCreating(false);
                  setIsEditing(false);
                }}
                className={`w-full text-left group transition-all duration-200 ${activeTermId === t.id ? 'translate-x-[4px]' : ''}`}
              >
                <div className={`px-3 py-2 border-2 transition-all duration-200 flex flex-col gap-0.5 relative overflow-hidden
                  ${activeTermId === t.id
                    ? 'bg-[#fcf9f4] border-[#1c1c19] shadow-[4px_4px_0_0_rgba(15,67,105,1)]'
                    : 'bg-transparent border-transparent hover:border-[#1c1c19]/30 hover:bg-[#fcf9f4]/50 hover:shadow-[2px_2px_0_0_rgba(28,28,25,0.1)]'}
                `}>
                  {activeTermId === t.id && (
                    <div className="absolute top-0 right-0 w-4 h-4 bg-[#0f4369] flex items-center justify-center -rotate-12 translate-x-0.5 -translate-y-0.5">
                      <ArrowUpRight size={10} className="text-white" />
                    </div>
                  )}
                  <span className={`text-[11px] font-black uppercase tracking-tight ${activeTermId === t.id ? 'text-[#1c1c19]' : 'text-[#72777f]'}`}>
                    {t.term}
                  </span>
                  <span className="text-[8px] font-bold text-[#72777f] opacity-60">CAT: {t.category}</span>
                </div>
              </button>
            ))}

            <button
              onClick={() => {
                setIsCreating(true);
                setActiveTermId(null);
                resetForm();
              }}
              className="mt-8 border-2 border-dashed border-[#1c1c19]/20 p-4 flex flex-col items-center justify-center gap-2 w-full hover:border-[#1c1c19]/60 hover:bg-white/50 transition-all font-mono"
            >
              <Plus size={16} className="text-[#1c1c19]/40" />
              <span className="text-[9px] font-black text-[#1c1c19]/40 uppercase">ADD_TERM</span>
            </button>
          </div>
          
          <div className="p-4 bg-[#1c1c19] text-[#e5e2dd]">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-1.5 h-1.5 bg-[#0f4369] rounded-full"></div>
              <span className="text-[9px] font-black tracking-widest uppercase">TERMS_COUNT: {terms.length}</span>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Content Viewer/Editor */}
        <div className="flex-1 overflow-y-auto p-8 md:p-16 custom-scrollbar bg-[#fcf9f4] font-mono">
          <div className="max-w-3xl mx-auto">
            {isCreating || isEditing ? (
              <div className="space-y-12">
                <div className="border-b-2 border-[#1c1c19] pb-8">
                  <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
                    {isCreating ? 'CREATE_TERM' : 'EDIT_TERM'}
                  </h1>
                  <div className="flex items-center gap-2 text-[#0f4369]">
                    <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-70 italic">
                      {isCreating ? 'NEW_ENTRY' : `EDITING // ${activeTerm?.term}`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">TERM_NAME</label>
                    <input
                      type="text"
                      value={editTerm}
                      onChange={e => setEditTerm(e.target.value)}
                      placeholder="EJ: DIGITAL_TWIN..."
                      className="bg-white border-2 border-[#1c1c19] p-3 text-xs font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all uppercase"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">CATEGORY</label>
                    <select
                      value={editCategory}
                      onChange={e => setEditCategory(e.target.value)}
                      className="bg-white border-2 border-[#1c1c19] p-3 text-xs font-bold focus:outline-none focus:shadow-[4px_4px_0_0_rgba(15,67,105,1)] transition-all"
                    >
                      <option value="GENERAL">GENERAL</option>
                      <option value="TECHNICAL">TECHNICAL</option>
                      <option value="STANDARDS">STANDARDS</option>
                      <option value="MANAGEMENT">MANAGEMENT</option>
                    </select>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#72777f]">DEFINITION_CONTENT</label>
                  <textarea
                    rows={6}
                    value={editDefinition}
                    onChange={e => setEditDefinition(e.target.value)}
                    placeholder="Explain the term here..."
                    className="bg-white border-2 border-[#1c1c19] p-4 text-xs font-bold focus:outline-none focus:shadow-[8px_8px_0_0_rgba(15,67,105,1)] transition-all resize-none"
                  />
                </div>

                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => {
                      setIsCreating(false);
                      setIsEditing(false);
                    }}
                    className="px-8 py-4 bg-white text-[#1c1c19] border-2 border-[#1c1c19] font-bold text-xs tracking-widest uppercase hover:bg-red-50 transition-all shadow-[6px_6px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0"
                  >
                    CANCELAR
                  </button>
                  <button
                    onClick={isCreating ? handleCreate : handleSave}
                    className="px-8 py-4 bg-[#0f4369] text-white border-2 border-[#1c1c19] font-bold text-xs tracking-widest uppercase hover:bg-[#1a5a8a] transition-all shadow-[6px_6px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0 flex items-center gap-3"
                  >
                    <Save size={16} />
                    {isCreating ? 'CREATE_TERM' : 'SAVE_CHANGES'}
                  </button>
                </div>
              </div>
            ) : activeTerm ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="mb-12 border-b-2 border-[#1c1c19] pb-8 flex justify-between items-end">
                  <div>
                    <div className="flex items-center gap-2 text-[#0f4369] mb-4">
                      <Book size={14} />
                      <span className="text-[10px] font-black tracking-[0.3em] uppercase opacity-70 italic whitespace-nowrap">
                        BIM_GLOSSARY // ENTRY_{activeTerm.id.toString().padStart(3, '0')}
                      </span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter text-[#1c1c19] leading-none uppercase">
                      {activeTerm.term}
                    </h1>
                  </div>
                  
                  <div className="flex gap-3 no-print">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-3 border-2 border-[#1c1c19] bg-white hover:bg-[#e5e2dd] transition-all shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0"
                      title="Edit Term"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(activeTerm.id)}
                      className="p-3 border-2 border-[#1c1c19] bg-white hover:bg-red-50 text-red-600 transition-all shadow-[4px_4px_0_0_rgba(28,28,25,1)] hover:shadow-none translate-x-[-2px] translate-y-[-2px] active:translate-x-0 active:translate-y-0"
                      title="Delete Term"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute -left-8 top-0 bottom-0 w-1 bg-[#1c1c19] opacity-10"></div>
                  <div className="bg-white border-2 border-[#1c1c19] p-10 shadow-[16px_16px_0_0_rgba(28,28,25,0.05)] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                      <Info size={120} strokeWidth={1} />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-8">
                      <div className="px-3 py-1 bg-[#1c1c19] text-white text-[10px] font-black uppercase tracking-widest">
                        CAT: {activeTerm.category}
                      </div>
                      <div className="h-[2px] flex-1 bg-[#1c1c19] opacity-10"></div>
                    </div>

                    <p className="text-lg md:text-xl font-bold text-[#1c1c19] leading-relaxed relative z-10">
                      {activeTerm.definition}
                    </p>

                    <div className="mt-12 pt-8 border-t-2 border-dashed border-[#1c1c19]/20 flex justify-between items-center text-[10px] font-black text-[#72777f] uppercase tracking-widest">
                      <span>REVIEW_BIM_SYSTEM</span>
                      <span>COORD_REF: 44.20.11</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-[#72777f] opacity-50 py-24">
                <Book size={64} strokeWidth={1} className="mb-4" />
                <p className="font-black uppercase tracking-[0.2em] text-sm">SELECT_A_TERM_TO_VIEW_DEFINITION</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DictionaryView;
