import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import {
  Bell,
  Activity,
  ChevronDown
} from 'lucide-react';

// Integrated Modules
import HousesModule from '../components/project/HousesModule';
import TeamModule from '../components/project/TeamModule';
import CalendarModule from '../components/project/CalendarModule';
import CallsModule from '../components/project/CallsModule';
import ActionInspectorPanel from '../components/project/ActionInspectorPanel';
import MonthlyModule from '../components/project/MonthlyModule';
import ProtocolsModule from '../components/project/ProtocolsModule';
import DirectoryModule from '../components/project/DirectoryModule';
import RequirementsModule from '../components/project/RequirementsModule';




export default function MainProject({ project }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'mes');

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const onTabChange = (tab) => {
    setSearchParams({ tab });
  };

  const renderContent = () => {
    const props = { project, onTabChange };
    switch (activeTab) {
      case 'mes':
        return <MonthlyModule {...props} />;
      case 'semanal':
        return <CalendarModule {...props} />;
      case 'proyecto':
        return <HousesModule {...props} />;
      case 'equipo':
        return <TeamModule {...props} />;
      case 'llamados':
        return <CallsModule {...props} />;
      case 'protocolos':
        return <ProtocolsModule {...props} />;
      case 'directorio':
        return <DirectoryModule {...props} />;
      case 'requisitos':
        return <RequirementsModule {...props} />;
      default:
        return <MonthlyModule {...props} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#fcf9f4] font-sans relative overflow-hidden">
      {/* HUD PRINCIPAL - TOTALMENTE LIMPIO */}
      <header className="flex-none p-2 border-b border-[#1c1c19]/20 bg-white flex justify-between items-center relative z-50">
        <div className="flex gap-4 items-center">
          <div className="flex flex-col">
    
          </div>

          <div className="flex flex-col border-l border-[#1c1c19]/10 pl-4">
            <span className="text-[7px] font-black text-[#72777f] uppercase tracking-widest opacity-40 italic">PROJECT_CORE</span>
            <h1 className="text-[11px] font-black uppercase italic tracking-tight">{project?.name || 'ACTIVE_SESSION'}</h1>
          </div>
        </div>

        {/* Notificaciones / Status simple en lugar de navegación */}
        <div className="flex items-center gap-4 text-[7px] font-black text-[#72777f] uppercase tracking-[0.2em] italic">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
            SYSTEM_ONLINE
          </div>
          <div className="opacity-30">|</div>
          <div>ENCRYPTED_STREAM</div>
        </div>
      </header>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden relative">
        <div className="h-full">
          {renderContent()}
        </div>
      </main>

      <ActionInspectorPanel />

      <footer className="flex-none h-4 bg-[#1c1c19] text-white text-[6px] font-black uppercase tracking-[0.4em] flex items-center justify-between px-4">
        <div>STATUS: OK // {project?.name}</div>
        <div>ARK_TVS // {new Date().toLocaleDateString()}</div>
      </footer>
    </div>
  );
}
