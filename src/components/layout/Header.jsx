import { useAuth } from '../../context/AuthContext';
import { LogOut, User, Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import SiteLogo from '../ui/SiteLogo';
import LanguageSwitcher from '../ui/LanguageSwitcher';

export default function Header({ title, onMenuClick, className = "" }) {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();

  return (
    <header className={`h-16 border-b-2 border-[#1c1c19] flex items-center justify-between px-4 md:px-6 shrink-0 relative z-20 shadow-[4px_4px_0_0_rgba(28,28,25,0.05)] bg-[#fcf9f4] ${className}`}>
      <div className="flex items-center space-x-2 md:space-x-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-[#1c1c19] hover:bg-[#e5e2dd] md:hidden transition-colors"
          title={t('header.toggle_menu')}
        >
          <Menu size={20} />
        </button>
        <SiteLogo className="w-5 h-5 md:w-6 md:h-6" color="#0f4369" />
        <h1 id="header-title" className="text-[10px] md:text-sm font-bold tracking-widest text-[#1c1c19] uppercase font-mono line-clamp-1">{title}</h1>
      </div>

      <div className="flex items-center space-x-3 md:space-x-6">
        <LanguageSwitcher />

        <div className="flex items-center space-x-2 md:space-x-3 text-[10px] md:text-xs font-mono tracking-wider text-[#1c1c19] bg-[#f6f3ee] px-2 md:px-4 py-1.5 md:py-2 border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)]">
          <User size={12} className="text-[#0f4369] shrink-0" />
          <span className="font-bold truncate max-w-[80px] md:max-w-none">
            {user?.userName || user?.email?.split('@')[0] || t('header.guest')}
          </span>
        </div>
        
        <button 
          onClick={() => signOut()}
          className="text-[#1c1c19] hover:bg-[#ba1a1a] hover:text-white transition-colors p-1.5 md:p-2 border-2 border-transparent hover:border-[#1c1c19] hover:shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] active:translate-y-[2px]"
          title={t('header.logout')}
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  );
}

