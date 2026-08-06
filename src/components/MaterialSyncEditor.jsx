import React, { useState, useEffect } from 'react';
import { Save, Edit2, Check, X } from 'lucide-react';
import { pluginDataService } from '../services/pluginDataService';

export default function MaterialSyncEditor({ selectedItem, onSaveSuccess }) {
  const [materials, setMaterials] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedItem?.materials && Array.isArray(selectedItem.materials)) {
      setMaterials([...selectedItem.materials]);
    } else {
      setMaterials([]);
    }
  }, [selectedItem]);

  const handleEditClick = (mat) => {
    setEditingId(mat.id);
    setEditName(mat.name);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const handleConfirmEdit = () => {
    setMaterials(prev => prev.map(m => m.id === editingId ? { ...m, name: editName } : m));
    setEditingId(null);
  };

  const handleSaveToDB = async () => {
    setIsSaving(true);
    try {
      await pluginDataService.updateMaterials(selectedItem.id, materials);
      if (onSaveSuccess) onSaveSuccess(materials);
      alert('Materiales actualizados en Supabase. Ahora puedes sincronizar desde Revit.');
    } catch (err) {
      alert('Error al guardar: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!materials || materials.length === 0) {
    return <p className="text-[#72777f]">No se exportaron materiales en este registro.</p>;
  }

  return (
    <div className="bg-white border-2 border-[#1c1c19] p-4 flex flex-col h-[400px]">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-bold text-[#0f4369]">Materiales ({materials.length})</h4>
        <button
          onClick={handleSaveToDB}
          disabled={isSaving}
          className="flex items-center gap-2 px-3 py-1.5 bg-[#0f4369] hover:bg-[#082a43] text-white text-xs font-bold rounded disabled:opacity-50"
        >
          <Save size={14} />
          {isSaving ? 'Guardando...' : 'Guardar Cambios en Nube'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto border border-[#e5e2dd]">
        <table className="w-full text-left font-mono text-[11px] border-collapse">
          <thead className="bg-[#f6f3ee] sticky top-0 border-b">
            <tr>
              <th className="p-2">ID Material</th>
              <th className="p-2 w-1/2">Nombre de Material</th>
              <th className="p-2">Categoría</th>
              <th className="p-2">Color RGB</th>
              <th className="p-2 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e5e2dd]">
            {materials.map((mat) => (
              <tr key={mat.id} className="hover:bg-[#fcf9f4]">
                <td className="p-2 font-bold text-[#0f4369]">{mat.id}</td>
                <td className="p-2">
                  {editingId === mat.id ? (
                    <input
                      autoFocus
                      type="text"
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleConfirmEdit()}
                      className="w-full px-2 py-1 border-2 border-[#0f4369] focus:outline-none"
                    />
                  ) : (
                    <span className="font-bold">{mat.name}</span>
                  )}
                </td>
                <td className="p-2 text-gray-600">{mat.category || 'N/A'}</td>
                <td className="p-2">
                  {mat.color_rgb ? (
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 border border-[#1c1c19] rounded-sm"
                        style={{ backgroundColor: `rgb(${mat.color_rgb})` }}
                      ></div>
                      <span className="text-[10px]">{mat.color_rgb}</span>
                    </div>
                  ) : 'N/A'}
                </td>
                <td className="p-2 text-right">
                  {editingId === mat.id ? (
                    <div className="flex justify-end gap-1">
                      <button onClick={handleConfirmEdit} className="p-1 text-green-600 hover:bg-green-100 rounded">
                        <Check size={14} />
                      </button>
                      <button onClick={handleCancelEdit} className="p-1 text-red-600 hover:bg-red-100 rounded">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleEditClick(mat)} className="p-1 text-[#0f4369] hover:bg-[#e5f0f8] rounded">
                      <Edit2 size={14} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
