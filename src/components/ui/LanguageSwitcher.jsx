import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LanguageSwitcher({ className = "", showText = true }) {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language.startsWith('es') ? 'en' : 'es';
    i18n.changeLanguage(newLang);
  };

  const currentLang = i18n.language.startsWith('es') ? 'ES' : 'EN';

  return (
    <button
      onClick={toggleLanguage}
      className={`flex items-center space-x-2 px-3 py-1.5 border-2 border-[#1c1c19] bg-[#f6f3ee] hover:bg-[#e5e2dd] transition-all shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] active:translate-y-[2px] active:shadow-none font-mono text-[10px] md:text-xs font-bold tracking-widest text-[#1c1c19] ${className} ${!showText ? 'justify-center space-x-0' : ''}`}
      title={currentLang === 'EN' ? 'Cambiar a Español' : 'Switch to English'}
    >
      <Languages size={14} className="text-[#0f4369]" />
      {showText && <span>{currentLang}</span>}
    </button>
  );
}
