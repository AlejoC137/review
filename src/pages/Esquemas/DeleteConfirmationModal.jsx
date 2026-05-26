import React from 'react';
import { Trash2 } from 'lucide-react';

const DeleteConfirmationModal = ({ onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#fcf9f4] border-[3px] border-[#1c1c19] w-full max-w-sm shadow-[12px_12px_0_0_rgba(230,32,32,1)] flex flex-col p-6 text-center transform animate-in zoom-in-95 duration-200">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 bg-[#e62020] text-white flex items-center justify-center rounded-full border-4 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.2)]">
            <Trash2 size={32} strokeWidth={3} />
          </div>
        </div>
        
        <h2 className="text-xl font-black uppercase tracking-tighter mb-2">Protocolo de Eliminación</h2>
        <p className="font-mono text-[10px] text-[#72777f] uppercase tracking-widest leading-relaxed mb-8">
          ADVERTENCIA: Esta acción purgará el nodo seleccionado y todas sus dependencias jerárquicas del esquema activo.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={onCancel}
            className="py-3 border-2 border-[#1c1c19] font-black uppercase tracking-widest text-[11px] hover:bg-[#1c1c19] hover:text-white transition-all shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] active:translate-y-0.5 active:shadow-none"
          >
            Cancelar
          </button>
          <button 
            onClick={onConfirm}
            className="py-3 bg-[#e62020] text-white border-2 border-[#1c1c19] font-black uppercase tracking-widest text-[11px] hover:bg-red-700 transition-all shadow-[4px_4px_0_0_rgba(28,28,25,0.2)] active:translate-y-0.5 active:shadow-none"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmationModal;
