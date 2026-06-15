import React, { useState } from 'react';
import { 
  Settings, PenTool, Database, Box, Sparkles, BookOpen, FileText, Package, Users
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import ProjectNamingProtocolModule from './ProjectNamingProtocolModule';

export default function ProjectToolsModule({ project, onTabChange }) {
  const [activeSubTab, setActiveSubTab] = useState('nomenclatura');
  const navigate = useNavigate();

  const handleSubTabChange = (tab) => {
    setActiveSubTab(tab);
  };

  const handleAiShortcut = (path) => {
    navigate(path);
  };

  return (
    <div className="flex flex-col h-full bg-white border-2 border-[#1c1c19] overflow-hidden relative">
      {/* Header with Tabs */}
      <div className="flex-none p-4 border-b-2 border-[#1c1c19] bg-[#f6f3ee] flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#0f4369] text-white border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(28,28,25,1)]">
            <Settings size={18} />
          </div>
          <div>
            <span className="text-[7px] font-black text-[#72777f] uppercase tracking-[0.3em] mb-0.5 opacity-50 italic">
              TOOLSET / {project?.name?.toUpperCase()}
            </span>
            <h2 className="text-xl font-black italic uppercase tracking-tighter leading-none">
              Herramientas BIM
            </h2>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex bg-white border-2 border-[#1c1c19] p-0.5 shadow-[3px_3px_0_0_rgba(28,28,25,1)]">
          <button 
            onClick={() => handleSubTabChange('nomenclatura')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${activeSubTab === 'nomenclatura' ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#f6f3ee]'}`}
          >
            Protocolo Nomenclatura
          </button>
          <button 
            onClick={() => handleSubTabChange('plugins')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${activeSubTab === 'plugins' ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#f6f3ee]'}`}
          >
            Plugins y Exportadores
          </button>
          <button 
            onClick={() => handleSubTabChange('ia')}
            className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-wider transition-all ${activeSubTab === 'ia' ? 'bg-[#1c1c19] text-white' : 'hover:bg-[#f6f3ee]'}`}
          >
            Importadores IA (JSON)
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto bg-[#fcf9f4]">
        {activeSubTab === 'nomenclatura' ? (
          <div className="h-full">
            <ProjectNamingProtocolModule project={project} pebInfo={{ code: 'CCWE' }} />
          </div>
        ) : activeSubTab === 'plugins' ? (
          <div className="p-8 max-w-5xl mx-auto space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Revit Plugin Card */}
              <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(28,28,25,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(28,28,25,1)] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c19] pb-4">
                    <Box size={24} className="text-[#0f4369]" />
                    <h3 className="text-lg font-black uppercase">RevitToSupabase Plugin</h3>
                  </div>
                  <p className="text-xs font-bold text-gray-600 mb-4 uppercase">
                    Plugin oficial para Autodesk Revit. Permite la sincronización bidireccional entre el modelo BIM y la base de datos de proyecto.
                  </p>
                  <div className="bg-[#f6f3ee] p-3 border border-dashed border-[#1c1c19] text-[10px] font-mono text-gray-700">
                    Ruta en repositorio: <br/>
                    <span className="font-bold text-[#1c1c19]">/reviewPlugIn/RevitToSupabasePlugin.addin</span>
                  </div>
                </div>
                <button className="mt-6 w-full py-2 bg-[#0f4369] text-white text-[10px] font-black uppercase border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(28,28,25,1)] hover:bg-[#0a2e49] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-not-allowed opacity-50" title="Próximamente disponible para descarga directa">
                  Descargar Instalador (WIP)
                </button>
              </div>

              {/* Keynotes Downloader Card */}
              <div className="bg-white border-2 border-[#1c1c19] p-6 shadow-[8px_8px_0_0_rgba(28,28,25,1)] hover:translate-x-1 hover:translate-y-1 hover:shadow-[4px_4px_0_0_rgba(28,28,25,1)] transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-4 border-b-2 border-[#1c1c19] pb-4">
                    <Database size={24} className="text-[#0f4369]" />
                    <h3 className="text-lg font-black uppercase">Descargador Keynotes</h3>
                  </div>
                  <p className="text-xs font-bold text-gray-600 mb-4 uppercase">
                    Exporta la base de datos de materiales del proyecto a un archivo de texto compatible con Revit Keynotes.
                  </p>
                </div>
                <button 
                  onClick={() => navigate(`/materials?projectId=${project?.id}`)}
                  className="mt-6 w-full py-2 bg-[#1c1c19] text-white text-[10px] font-black uppercase border-2 border-[#1c1c19] shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:bg-gray-800 hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                >
                  Ir al Módulo de Materiales
                </button>
              </div>

            </div>
          </div>
        ) : activeSubTab === 'ia' ? (
          <div className="p-8 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-8 border-b-2 border-[#1c1c19] pb-4 bg-white p-4 shadow-[4px_4px_0_0_rgba(28,28,25,1)]">
              <Sparkles size={24} className="text-yellow-500" />
              <div>
                <h3 className="text-lg font-black uppercase">Accesos Directos - Importadores IA</h3>
                <p className="text-[10px] font-bold text-gray-500 uppercase mt-1">Navegación rápida hacia las secciones con integración JSON / IA</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              <div className="bg-white border-2 border-[#1c1c19] p-5 shadow-[4px_4px_0_0_rgba(28,28,25,1)] flex flex-col items-start gap-4">
                <div className="p-3 bg-[#e8f0fe] border-2 border-[#0f4369] text-[#0f4369]">
                  <FileText size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase">Protocolos</h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Importar lista de protocolos</p>
                </div>
                <button onClick={() => navigate(`/project/${project?.id}?tab=protocolos`)} className="mt-auto px-4 py-1.5 border-2 border-[#1c1c19] text-[10px] font-black uppercase hover:bg-[#f6f3ee] transition-colors w-full text-left flex justify-between items-center">
                  Ir a Protocolos <Sparkles size={12} className="text-yellow-500" />
                </button>
              </div>

              <div className="bg-white border-2 border-[#1c1c19] p-5 shadow-[4px_4px_0_0_rgba(28,28,25,1)] flex flex-col items-start gap-4">
                <div className="p-3 bg-[#fce8e8] border-2 border-red-700 text-red-700">
                  <Package size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase">Materiales</h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Importar catálogo de materiales</p>
                </div>
                <button onClick={() => navigate(`/materials?projectId=${project?.id}`)} className="mt-auto px-4 py-1.5 border-2 border-[#1c1c19] text-[10px] font-black uppercase hover:bg-[#f6f3ee] transition-colors w-full text-left flex justify-between items-center">
                  Ir a Materiales <Sparkles size={12} className="text-yellow-500" />
                </button>
              </div>

              <div className="bg-white border-2 border-[#1c1c19] p-5 shadow-[4px_4px_0_0_rgba(28,28,25,1)] flex flex-col items-start gap-4">
                <div className="p-3 bg-[#e8f8f5] border-2 border-green-700 text-green-700">
                  <Users size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase">Roles y Equipo</h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Importar diccionario de roles PEB</p>
                </div>
                <button onClick={() => navigate(`/project/${project?.id}?tab=equipo&subtab=roles`)} className="mt-auto px-4 py-1.5 border-2 border-[#1c1c19] text-[10px] font-black uppercase hover:bg-[#f6f3ee] transition-colors w-full text-left flex justify-between items-center">
                  Ir a Roles <Sparkles size={12} className="text-yellow-500" />
                </button>
              </div>

              <div className="bg-white border-2 border-[#1c1c19] p-5 shadow-[4px_4px_0_0_rgba(28,28,25,1)] flex flex-col items-start gap-4">
                <div className="p-3 bg-[#fef5e7] border-2 border-orange-600 text-orange-600">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-black uppercase">Especialidades</h4>
                  <p className="text-[10px] font-bold text-gray-500 uppercase">Importar lista de especialidades</p>
                </div>
                <button onClick={() => navigate(`/project/${project?.id}?tab=datos&subtab=especialidades`)} className="mt-auto px-4 py-1.5 border-2 border-[#1c1c19] text-[10px] font-black uppercase hover:bg-[#f6f3ee] transition-colors w-full text-left flex justify-between items-center">
                  Ir a Especialidades <Sparkles size={12} className="text-yellow-500" />
                </button>
              </div>

            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
