import React from 'react';
import { useAntigravityDrive } from '../hooks/useAntigravityDrive';
import { ExternalLink } from 'lucide-react';

const DriveConnector = ({ targetKey, label, description }) => {
  const { getFolderUrl } = useAntigravityDrive();
  const url = getFolderUrl(targetKey);

  if (!url) return <div className="p-4 border rounded text-red-500">Configuración de Drive no encontrada para la llave: {targetKey}</div>;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-lg p-5 shadow-lg flex flex-col gap-3 transition-all hover:border-blue-500/50">
      <div className="flex items-center gap-2 text-blue-400">
        <h4 className="font-semibold text-lg">{label}</h4>
      </div>
      <p className="text-sm text-slate-400">{description || 'Acceso directo a la nube del proyecto.'}</p>
      
      <a 
        href={url} 
        target="_blank" 
        rel="noreferrer" 
        className="mt-2 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
      >
        <ExternalLink size={16} />
        Abrir Carpeta en Google Drive
      </a>
    </div>
  );
};

export default DriveConnector;
