import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { PROJECT_TABS_OPTIONS } from '../utils/preBepHelpers';

export const EditableTabLink = ({ projectId, sectionId, defaultLabel, defaultUrl }) => {
  const [override, setOverride] = useState(() => {
    try {
      const saved = localStorage.getItem(`prebep_link_override_${projectId}_${sectionId}`);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [isEditing, setIsEditing] = useState(false);

  const currentLabel = override ? override.label : defaultLabel;
  const currentUrl = override ? override.url : defaultUrl;

  const handleSelect = (e) => {
    const val = e.target.value;
    const opt = PROJECT_TABS_OPTIONS.find(o => o.value === val);
    if (opt && opt.value !== '') {
      const newOverride = {
        label: opt.label,
        url: opt.value
      };
      setOverride(newOverride);
      try {
        localStorage.setItem(`prebep_link_override_${projectId}_${sectionId}`, JSON.stringify(newOverride));
      } catch (err) {}
    }
    setIsEditing(false);
  };

  const getHref = () => {
    if (!currentUrl) return '#';
    if (currentUrl.startsWith('?')) {
      return `/projects/${projectId}${currentUrl}`;
    }
    return currentUrl;
  };

  return (
    <div className="relative inline-flex items-center group/tablink">
      <a
        href={getHref()}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 font-bold uppercase tracking-wider text-xs md:text-sm text-[#0f4369] hover:text-[#0b2b44] hover:underline decoration-1 underline-offset-2 transition-colors cursor-pointer"
        title="Abrir módulo en nueva pestaña"
      >
        <span>{currentLabel}</span>
        <ChevronRight className="w-3.5 h-3.5 opacity-60 group-hover/tablink:opacity-100 group-hover/tablink:translate-x-0.5 transition-all text-[#0f4369]" />
      </a>

      {/* Botón de configuración/edición */}
      <button
        type="button"
        onClick={() => setIsEditing(!isEditing)}
        className="no-print opacity-0 group-hover/tablink:opacity-100 ml-1.5 text-[10px] font-sans px-1.5 py-0.5 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded text-gray-600 transition-opacity"
        title="Cambiar redirección de esta sección"
      >
        ⚙️
      </button>

      {/* Popover selector */}
      {isEditing && (
        <div className="no-print absolute left-0 top-full mt-1 z-50 bg-white border border-[#1c1c19] shadow-lg p-2 rounded w-64 text-left font-sans">
          <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">
            Redirección para "{defaultLabel}"
          </div>
          <select
            value={currentUrl || ''}
            onChange={handleSelect}
            className="w-full text-xs p-1.5 border border-gray-300 rounded bg-gray-50 focus:bg-white focus:outline-none focus:border-[#0f4369]"
          >
            {PROJECT_TABS_OPTIONS.map((opt, idx) => (
              <option key={idx} value={opt.value} disabled={opt.value === ''}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="flex justify-between items-center mt-2 pt-1 border-t border-gray-100 text-[10px]">
            <button
              type="button"
              onClick={() => {
                setOverride(null);
                try {
                  localStorage.removeItem(`prebep_link_override_${projectId}_${sectionId}`);
                } catch (e) {}
                setIsEditing(false);
              }}
              className="text-red-500 hover:underline"
            >
              Restablecer
            </button>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-gray-500 hover:text-black font-semibold"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default EditableTabLink;
