import React from 'react';
import { X, Save, Phone, Trash2, ChevronUp, ChevronDown } from 'lucide-react';
import BitacoraManager from './BitacoraManager';
import LinksManager from './LinksManager';

export default function InspectorHeader({
    type,
    editItem,
    staffers,
    projects,
    onFieldChange,
    onSave,
    onDelete,
    onClose,
    isMinimized,
    setIsMinimized,
    saving
}) {
    const currentProject = projects?.find(p => p.id === editItem?.project_id);

    return (
        <div className="h-12 bg-white border-b-4 border-[#1c1c19] flex items-center justify-between px-4 select-none">
            {/* LEFT: Context */}
            <div className="flex items-center gap-3">
                <span className="bg-[#0f4369] text-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.1em] italic shadow-[2px_2px_0_0_rgba(0,0,0,1)] shrink-0">
                    {editItem?.id && editItem.id !== 'new' ? 'DETALLE TAREA' : 'NUEVA TAREA'}
                </span>
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={editItem?.name || ''}
                        onChange={(e) => onFieldChange('name', e.target.value)}
                        placeholder="ESCRIBIR_TÍTULO_DE_TAREAS..."
                        className="w-[280px] bg-white border-2 border-[#1c1c19] px-3 py-1 text-[15px] font-black italic outline-none focus:bg-[#f6f3ee] shadow-[4px_4px_0_0_rgba(0,0,0,0.1)] placeholder:opacity-30"
                    />
                    
                    {currentProject && (
                        <div className="px-3 py-1 bg-white border-2 border-[#1c1c19] text-[9px] font-black text-[#0f4369] font-black uppercase tracking-widest italic truncate max-w-[200px]">
                            {currentProject.name}
                        </div>
                    )}
                </div>
            </div>

            {/* CENTER: Manager Buttons */}
            <div className="flex items-center gap-2">
                <BitacoraManager 
                    notesStr={editItem?.notes} 
                    onChange={(val) => onFieldChange('notes', val)} 
                    staffers={staffers}
                />
                <LinksManager 
                    linksStr={editItem?.links_de_interes} 
                    onChange={(val) => onFieldChange('links_de_interes', val)} 
                />
                <button className="h-8 px-3 border-2 border-[#1c1c19] bg-white text-[#1c1c19] flex items-center gap-1.5 hover:bg-[#f6f3ee] transition-all shadow-[2px_2px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 font-black uppercase text-[9px] tracking-widest">
                    <Phone size={12} />
                    <span>Llamada</span>
                </button>
            </div>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-3">
                {saving && (
                  <div className="flex items-center gap-1.5 text-[8px] font-black text-green-600 animate-pulse uppercase tracking-widest">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    Sincronizando
                  </div>
                )}

                <button 
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1 hover:bg-gray-100 rounded text-gray-500 transition-colors"
                >
                    {isMinimized ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </button>
                
                {editItem?.id && (
                    <button 
                        onClick={onDelete}
                        className="p-1 hover:bg-red-50 text-red-400 hover:text-red-600 rounded transition-colors"
                        title="Eliminar tarea"
                    >
                        <Trash2 size={18} />
                    </button>
                )}
                
                <button 
                    onClick={onSave}
                    disabled={saving}
                    className="h-8 px-5 bg-[#d4f3e5] text-[#0f4369] border-2 border-[#1c1c19] shadow-[3px_3px_0_0_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group"
                >
                    <Save size={14} className={saving ? 'animate-spin' : 'group-hover:scale-110 transition-transform'} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">{saving ? 'Guardando...' : 'Guardar'}</span>
                </button>

                <button 
                    onClick={onClose}
                    className="p-1 hover:bg-gray-100 rounded text-gray-800 transition-colors"
                >
                    <X size={24} />
                </button>
            </div>
        </div>
    );
}
