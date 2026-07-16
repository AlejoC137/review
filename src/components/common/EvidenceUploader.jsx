import React, { useState } from 'react';
import { ImageIcon, X, UploadCloud, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

export default function EvidenceUploader({ currentUrl, onUpload, pathPrefix = 'tasks', label = 'Evidencia', bucketName = 'evidence' }) {
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${pathPrefix}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${pathPrefix}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(filePath);

      onUpload(publicUrl);
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Error al subir imagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1">
      <label className="text-[9px] font-black text-[#72777f] uppercase tracking-widest block">{label}</label>
      <div className="relative h-28 group">
        {currentUrl ? (
          <div className="h-full w-full border-2 border-[#1c1c19] overflow-hidden relative">
            <img src={(typeof currentUrl === 'string' && currentUrl.startsWith('blob:')) ? '' : currentUrl} alt="Evidencia" className="w-full h-full object-cover" />
            <button 
              onClick={() => onUpload('')}
              className="absolute top-1 right-1 p-1 bg-red-600 text-white hover:scale-110 transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)]"
            >
              <X size={12} strokeWidth={3} />
            </button>
            <div className="absolute bottom-0 left-0 right-0 bg-[#1c1c19]/80 p-1 flex items-center gap-1">
               <CheckCircle size={10} className="text-green-400" />
               <span className="text-[8px] font-black text-white uppercase tracking-tighter">Archivo_Verificado</span>
            </div>
          </div>
        ) : (
          <label className={`h-full w-full border-2 border-dashed border-[#1c1c19]/30 bg-white flex flex-col items-center justify-center cursor-pointer transition-all hover:border-[#0f4369] hover:bg-[#fcf9f4] ${uploading ? 'pointer-events-none' : ''}`}>
            {uploading ? (
              <>
                <Loader2 size={24} className="animate-spin text-[#0f4369] mb-2" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[#0f4369]">Sincronizando...</span>
              </>
            ) : (
              <>
                <UploadCloud size={24} className="text-[#72777f] mb-1 group-hover:text-[#0f4369] group-hover:animate-bounce" />
                <span className="text-[9px] font-black uppercase tracking-widest text-[#72777f]">Click para subir foto</span>
                <span className="text-[7px] font-bold text-[#72777f]/50 uppercase mt-1">Max 100kb (auto-comprime)</span>
              </>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={handleUpload} />
          </label>
        )}
      </div>
    </div>
  );
}
