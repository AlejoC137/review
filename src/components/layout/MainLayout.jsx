import React, { useState } from 'react';
import { useLocation, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function MainLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { t } = useTranslation();

  return (
    <div className="flex h-screen bg-[#fcf9f4] overflow-hidden font-sans text-[#1c1c19] print:h-auto print:overflow-visible print:block">
      {/* LEFT: Navigation Bar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* CENTER: Dynamic Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden print:h-auto print:overflow-visible print:block">
        {/* Mobile Menu Button */}
        {!isSidebarOpen && (
          <button 
            onClick={() => setIsSidebarOpen(true)}
            className="fixed top-4 left-4 z-40 p-2 bg-[#f6f3ee] border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] text-[#1c1c19] md:hidden transition-all hover:bg-[#e5e2dd] active:translate-y-[2px] print:hidden"
          >
            <Menu size={20} />
          </button>
        )}
        
        <main className="flex-1 flex flex-col relative transition-all duration-500 ease-in-out overflow-y-auto custom-scrollbar print:h-auto print:overflow-visible print:block">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
