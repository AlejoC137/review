import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageSquare, X, Info, Book, Zap, ChevronRight, Search, Briefcase, Lock as LockIcon, Printer } from 'lucide-react';
import { bimKnowledgeBase } from '../../config/bimKnowledgeBase';
import { useAuth } from '../../context/AuthContext';

export default function BimAssistant() {
  const { user, isBimManager, setBimManager } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('glossary'); // 'insights', 'glossary', 'project'
  const [searchQuery, setSearchQuery] = useState('');
  const [passkey, setPasskey] = useState('');
  const [glossary, setGlossary] = useState([]);
  const location = useLocation();

  useEffect(() => {
    if (isOpen && activeTab === 'glossary') {
      const saved = localStorage.getItem('bim_dictionary_terms');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            setGlossary(parsed);
            return;
          }
        } catch (e) {
          console.error("Local storage parse error:", e);
        }
      }
      setGlossary(bimKnowledgeBase.terms);
    }
  }, [isOpen, activeTab]);

  if (!user) return null;

  const currentPhase = location.hash ? location.hash.substring(1) : 'phase-01';
  const phaseInsight = bimKnowledgeBase.phases[currentPhase] || bimKnowledgeBase.phases['phase-01'];

  const filteredGlossary = glossary.filter(item =>
    item.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div id="bim-assistant" className="fixed bottom-6 right-6 z-[100] flex flex-col items-end print:hidden">
      {/* Assistant Bubble */}
      {isOpen ? (
        <div className="w-80 bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[12px_12px_0_0_rgba(28,28,25,0.2)] flex flex-col animate-blueprint-unfold assistant-panel relative overflow-hidden">
          {/* Header */}
          <div className="bg-[#0f4369] p-3 flex justify-between items-center border-b-2 border-[#1c1c19]">
            <div className="flex items-center gap-2 text-white">
              <Zap size={14} className="animate-pulse" />
              <span className="text-[10px] font-display font-bold tracking-widest uppercase">BIM_STRATEGIST_AGENT v1.0</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.print()}
                className="text-white/70 hover:text-white hover:scale-110 transition-all"
                title="Imprimir / Guardar como PDF"
              >
                <Printer size={14} />
              </button>
              <button onClick={() => setIsOpen(false)} className="text-white hover:rotate-90 transition-transform">
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b-2 border-[#1c1c19]">
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 p-2 text-[9px] font-display font-bold tracking-widest uppercase transition-colors ${activeTab === 'insights' ? 'bg-[#e5e2dd] text-[#1c1c19]' : 'bg-[#f6f3ee] text-[#72777f] hover:text-[#1c1c19]'}`}
            >
              INSIGHTS
            </button>
            <button
              onClick={() => setActiveTab('glossary')}
              className={`flex-1 p-2 text-[9px] font-display font-bold tracking-widest uppercase transition-colors ${activeTab === 'glossary' ? 'bg-[#e5e2dd] text-[#1c1c19]' : 'bg-[#f6f3ee] text-[#72777f] hover:text-[#1c1c19]'}`}
            >
              GLOSARIO_BIM
            </button>
            <button
              onClick={() => isBimManager && setActiveTab('project')}
              className={`flex-1 p-2 text-[9px] font-display font-bold tracking-widest uppercase transition-colors relative ${activeTab === 'project' ? 'bg-[#e5e2dd] text-[#1c1c19]' : 'bg-[#f6f3ee] text-[#72777f] hover:text-[#1c1c19]'} ${!isBimManager ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-center justify-center gap-1">
                {!isBimManager && <LockIcon size={8} />}
                MANEJO_PROYECTO
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="p-4 max-h-96 overflow-y-auto overflow-x-hidden font-mono text-[11px] leading-relaxed">
            {activeTab === 'project' ? (
              <div className="space-y-4 py-6 flex flex-col items-center justify-center text-center opacity-50">
                <div className="w-10 h-10 border-2 border-dashed border-[#1c1c19]/30 flex items-center justify-center mb-2">
                  <Briefcase size={16} className="text-[#1c1c19]" />
                </div>
                <p className="font-display font-bold text-[9px] tracking-widest uppercase">
                  MANEJO_DE_PROYECTO
                </p>
                <div className="text-[8px] italic font-sans px-4">
                  Sección configurada. Esperando datos sobre la gestión del proyecto para su visualización.
                </div>
              </div>
            ) : activeTab === 'insights' ? (
              <div className="space-y-4">
                <div className="border-l-2 border-[#0f4369] pl-3 py-1">
                  <h4 className="text-[#0f4369] font-bold uppercase mb-1">{phaseInsight.title}</h4>
                  <p className="text-[#1c1c19]/80 italic">"{phaseInsight.insight}"</p>
                </div>

                <div className="bg-[#f6f3ee] p-3 border-2 border-dashed border-[#1c1c19]/30">
                  <h5 className="text-[9px] font-bold text-[#493f36] uppercase mb-2 flex items-center gap-2">
                    <ChevronRight size={10} /> RECO_DEL_CONSULTOR:
                  </h5>
                  <ul className="space-y-1">
                    {phaseInsight.checklist.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-[#0f4369] tracking-tighter">[{idx + 1}]</span>
                        <span className="uppercase text-[9px] tracking-tight">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative mb-3">
                  <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#72777f]" />
                  <input
                    type="text"
                    name="bim_assistant_search"
                    autoComplete="off"
                    placeholder="BUSCAR_TÉRMINO..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border-2 border-[#1c1c19] py-1.5 pl-7 pr-2 text-[9px] uppercase focus:outline-none focus:border-[#0f4369]"
                  />
                </div>

                {glossary.length === 0 ? (
                  <div className="text-center py-6 text-[#72777f] text-[9px] font-bold uppercase">NO_HAY_TÉRMINOS</div>
                ) : (
                  filteredGlossary.map((item) => (
                    <div key={item.id} className="pb-3 border-b-2 border-dotted border-[#1c1c19]/10">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[#0f4369] uppercase">{item.term}</span>
                        <span className="bg-[#e5e2dd] px-1 text-[8px] text-[#493f36]">{item.category}</span>
                      </div>
                      <p className="text-[10px] text-[#1c1c19]/70 font-sans leading-tight normal-case">{item.definition}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="p-2 px-3 bg-[#f6f3ee] border-t-2 border-[#1c1c19] text-[8px] font-mono flex justify-between items-center uppercase overflow-hidden">
            <div className="flex items-center gap-2 group">
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${isBimManager ? 'bg-[#22c55e] shadow-[0_0_8px_#22c55e] animate-pulse' : 'bg-[#ba1a1a] shadow-[0_0_4px_#ba1a1a]'}`} />
              <div className="relative flex items-center gap-2">
                <input 
                   type="text"
                   name="bim_manager_key_entry"
                   autoComplete="off"
                   value={passkey}
                   placeholder={isBimManager ? "SISTEMA_ACTIVO" : "ENTER_PASSKEY"}
                   style={{ WebkitTextSecurity: 'disc' }}
                   className={`bg-transparent border-none p-0 text-[9px] font-mono focus:outline-none w-28 transition-all duration-300 ${isBimManager ? 'text-[#22c55e] font-black tracking-widest' : 'text-[#72777f] focus:text-[#1c1c19]'}`}
                   onChange={(e) => {
                      const val = e.target.value;
                      setPasskey(val);
                      if (val === '123123') {
                         setBimManager(true);
                      } else if (val === 'lock') {
                         setBimManager(false);
                      }
                   }}
                />
                {isBimManager && (
                  <button 
                    onClick={() => {
                      setBimManager(false);
                      setPasskey('');
                    }}
                    className="text-[#ba1a1a] hover:scale-125 transition-transform"
                    title="Disconnect Key"
                  >
                    <X size={10} strokeWidth={4} />
                  </button>
                )}
                <div className={`absolute -bottom-1 left-0 h-[1px] transition-all duration-500 ${isBimManager ? 'w-full bg-[#22c55e]' : 'w-0 group-focus-within:w-full bg-[#1c1c19]'}`} />
              </div>
            </div>
            <span className="text-[#72777f] opacity-50 tracking-tighter truncate ml-2">BLUEPRINT_ENGINE_V2.9</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative w-14 h-14 bg-[#0f4369] text-white border-2 border-[#1c1c19] shadow-[6px_6px_0_0_rgba(28,28,25,0.2)] hover:shadow-[4px_4px_0_0_rgba(28,28,25,0.2)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all flex items-center justify-center overflow-hidden"
          title="Open BIM Assistant"
        >
          <div className="absolute inset-0 bg-[#fcf9f4]/10 group-hover:bg-transparent transition-colors"></div>
          <Zap size={24} className="relative z-10" />
          <div className="absolute -bottom-1 -right-1 bg-white text-[#0f4369] p-0.5 border-l-2 border-t-2 border-[#1c1c19]">
            <Info size={10} />
          </div>
        </button>
      )}
    </div>
  );
}
