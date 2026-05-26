import React, { useState, useEffect } from 'react';
import { ExternalLink, Edit, Trash2, Plus, X, Image as ImageIcon, ArrowRight, Save, LayoutTemplate, FileText, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useResources } from '../../hooks/useResources';
import { useNavigate } from 'react-router-dom';
import ResourcePlaceholder from '../ui/ResourcePlaceholder';
import { RESOURCE_CATEGORIES } from '../../services/sareNames';

export default function AdminResourceList({ moduleMode = false, moduleId = null, onSelectResource = null, onlyCategory = null }) {
  const { user, isAdmin, isBimManager } = useAuth();
  const canEdit = isAdmin || isBimManager;

  const navigate = useNavigate();
  const { 
    resources, 
    loading, 
    fetchResources, 
    createResource,
    updateResource,
    reorderResources
  } = useResources();

  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({ 
    category: onlyCategory || RESOURCE_CATEGORIES[0], 
    title: '', 
    image_url: '', 
    description: '',
    url: '',
    published: false
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedResourceId, setDraggedResourceId] = useState(null);
  const [dragOverResourceId, setDragOverResourceId] = useState(null);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleDragStart = (e, resourceId) => {
    if (!canEdit) return;
    setDraggedResourceId(resourceId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/resource-id', resourceId);
    setTimeout(() => {
      e.target.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedResourceId(null);
    setDragOverResourceId(null);
  };

  const handleDragOver = (e, resourceId) => {
    e.preventDefault();
    if (!canEdit || draggedResourceId === resourceId) return;
    setDragOverResourceId(resourceId);
  };

  const handleDrop = (e, targetResourceId) => {
    const sourceResourceId = e.dataTransfer.getData('application/resource-id');
    
    if (!canEdit || sourceResourceId === targetResourceId) return;
    
    const targetIndex = resources.findIndex(r => r.id === targetResourceId);
    const sourceIndex = resources.findIndex(r => r.id === sourceResourceId);

    if (sourceIndex !== -1 && targetIndex !== -1 && sourceIndex !== targetIndex) {
      const reorderedResources = Array.from(resources);
      const [removed] = reorderedResources.splice(sourceIndex, 1);
      
      const targetResource = resources[targetIndex];
      // When dragging between categories, update the category of the moved item
      removed.category = targetResource.category;

      reorderedResources.splice(targetIndex, 0, removed);
      
      const updatedResources = reorderedResources.map((r, idx) => ({
        ...r,
        sort_order: idx + 1
      }));
      
      reorderResources(updatedResources);
    }
    
    setDraggedResourceId(null);
    setDragOverResourceId(null);
  };

  const handleAdd = () => {
    setIsEditing('new');
    setFormData({ category: onlyCategory || RESOURCE_CATEGORIES[0], title: '', image_url: '', description: '', url: '', published: false });
  };

  const handleSave = async () => {
    if (!formData.title || !formData.category) {
      alert('Por favor provee un título y categoría.');
      return;
    }

    try {
      if (isEditing === 'new') {
        const res = await createResource(formData);
        setIsEditing(null);
        fetchResources();
        // Redirect to detail view to work on it
        if (!moduleMode && res?.id) {
          navigate(`/admin/resourceEdit/${res.id}`);
        }
      }
    } catch (e) {
      alert('Error al guardar el recurso.');
    }
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = onlyCategory ? res.category === onlyCategory : true;
    const isExcluded = res.category === 'Protocolo' || res.category === 'Manual';
    return matchesSearch && matchesCategory && !isExcluded;
  });

  const categories = [...new Set(filteredResources.map(r => r.category))];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {canEdit && !isEditing && !moduleMode && (
          <button 
            onClick={handleAdd}
            className="bg-[#0f4369] text-[#fcf9f4] px-5 py-3 font-display font-bold text-[11px] md:text-[12px] tracking-[0.15em] uppercase flex items-center justify-center gap-3 hover:bg-[#1a5b8a] transition-all border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] active:translate-y-[2px] w-full md:w-max whitespace-nowrap"
          >
            <Plus size={16} strokeWidth={2.5} /> NEW RESOURCE ENTRY
          </button>
        )}

        {!isEditing && (
          <div className="relative flex-1 w-full max-w-none md:max-w-md">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-[#72777f]">
              <Search size={16} />
            </div>
            <input 
              id="resource-search"
              type="text" 
              placeholder="PROCURAR RECURSOS POR NOMBRE..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border-2 border-[#1c1c19] pl-11 md:pl-12 pr-4 py-3 font-display font-bold text-[11px] md:text-[12px] tracking-widest uppercase focus:outline-none focus:border-[#0f4369] shadow-[4px_4px_0_0_rgba(28,28,25,0.05)] transition-all placeholder-[#d8d3cc]"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-4 flex items-center text-[#72777f] hover:text-[#ba1a1a] transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Redesigned Create Form */}
      {isEditing === 'new' && (
        <div className="bg-[#fcf9f4] border-2 border-[#1c1c19] shadow-[8px_8px_0_0_rgba(28,28,25,0.2)] flex flex-col relative z-20 overflow-hidden mt-4">
          
          <div className="flex justify-between items-center bg-[#1c1c19] p-4 text-[#fcf9f4]">
            <div className="flex items-center gap-3">
              <LayoutTemplate size={18} className="text-[#e5e2dd]" />
              <span className="font-display font-bold text-[12px] md:text-[14px] tracking-[0.2em] uppercase">
                Initialize Resource
              </span>
            </div>
            <button onClick={() => setIsEditing(null)} className="hover:text-[#ba1a1a] transition-colors p-1">
              <X size={20} strokeWidth={2.5} />
            </button>
          </div>
          
          <div className="flex flex-col xl:flex-row divide-y-2 xl:divide-y-0 xl:divide-x-2 divide-[#1c1c19]">
            
            {/* Form Fields */}
            <div className="p-5 md:p-8 xl:w-2/3 flex flex-col gap-5 md:gap-6 bg-[#f6f3ee]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                
                <div className="flex flex-col gap-2">
                  <label className="text-[9px] md:text-[10px] font-display font-bold text-[#72777f] tracking-widest uppercase">Resource Title *</label>
                  <input 
                    type="text" 
                    placeholder="E.g. ISO 19650 Execution Plan"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    className="border-2 border-[#1c1c19] px-3 md:px-4 py-2.5 md:py-3 text-sm font-display font-bold bg-white focus:outline-none focus:border-[#0f4369] transition-all placeholder-[#d8d3cc]"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[9px] md:text-[10px] font-display font-bold text-[#72777f] tracking-widest uppercase">Category *</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    className="border-2 border-[#1c1c19] px-3 md:px-4 py-2.5 md:py-3 text-sm font-display font-bold bg-white focus:outline-none focus:border-[#0f4369] transition-all appearance-none cursor-pointer"
                  >
                    {RESOURCE_CATEGORIES.filter(cat => cat !== 'Protocolo' && cat !== 'Manual').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[9px] md:text-[10px] font-display font-bold text-[#72777f] tracking-widest uppercase">External URL (Google Drive / Website)</label>
                  <input 
                    type="url" 
                    placeholder="https://drive.google.com/..."
                    value={formData.url}
                    onChange={(e) => setFormData({...formData, url: e.target.value})}
                    className="border-2 border-[#1c1c19] px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-mono bg-white focus:outline-none focus:border-[#0f4369] transition-all placeholder-[#d8d3cc]"
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[9px] md:text-[10px] font-display font-bold text-[#72777f] tracking-widest uppercase">Cover Image URL</label>
                  <input 
                    type="url" 
                    placeholder="https://images.unsplash.com/..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                    className="border-2 border-[#1c1c19] px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-mono bg-white focus:outline-none focus:border-[#0f4369] transition-all placeholder-[#d8d3cc]"
                  />
                </div>

                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="text-[9px] md:text-[10px] font-display font-bold text-[#72777f] tracking-widest uppercase">Brief Description</label>
                  <textarea
                    placeholder="Explain the purpose and usage of this resource..."
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="border-2 border-[#1c1c19] px-3 md:px-4 py-2.5 md:py-3 text-xs md:text-sm font-sans leading-relaxed bg-white focus:outline-none focus:border-[#0f4369] transition-all placeholder-[#d8d3cc] resize-y"
                  />
                </div>
                
                <div className="flex flex-col gap-2 md:col-span-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={formData.published}
                      onChange={(e) => setFormData({...formData, published: e.target.checked})}
                      className="w-4 h-4 text-[#0f4369] border-2 border-[#1c1c19] focus:ring-0 focus:ring-offset-0 bg-white"
                    />
                    <span className="text-[9px] md:text-[10px] font-display font-bold text-[#1c1c19] tracking-widest uppercase group-hover:text-[#0f4369] transition-colors">
                      Publish to public resources
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end gap-3 md:gap-4 mt-2 md:mt-4 pt-6 border-t-[1px] border-dashed border-[#1c1c19]/30">
                <button 
                  onClick={() => setIsEditing(null)}
                  className="px-6 py-2.5 md:py-3 font-display font-bold text-[11px] md:text-[12px] tracking-widest uppercase border-2 border-[#1c1c19] text-[#1c1c19] hover:bg-[#e5e2dd] transition-colors order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSave}
                  className="bg-[#0f4369] text-[#fcf9f4] px-6 md:px-8 py-2.5 md:py-3 font-display font-bold text-[11px] md:text-[12px] tracking-[0.15em] uppercase flex items-center justify-center gap-2 hover:bg-[#1c1c19] transition-all border-2 border-[#1c1c19] order-1 sm:order-2"
                >
                  <Save size={16} strokeWidth={2.5} /> Save & Open
                </button>
              </div>
            </div>

            {/* Live Preview Pane */}
            <div className="p-5 md:p-8 xl:w-1/3 bg-[#fcf9f4] flex flex-col gap-4">
               <span className="text-[9px] md:text-[10px] font-display font-bold text-[#72777f] tracking-widest uppercase mb-1 flex items-center gap-2">
                 <span className="w-2 h-2 bg-[#ba1a1a] rounded-full animate-pulse"></span>
                 Live Preview
               </span>
               
               <div className="pointer-events-none opacity-90 scale-95 origin-top relative bg-[#fcf9f4] flex flex-col border-2 border-[#1c1c19] shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] overflow-hidden max-w-[300px] mx-auto xl:max-w-none">
                <div className="w-full h-32 md:h-40 bg-[#e5e2dd] border-b-2 border-[#1c1c19] flex items-center justify-center relative">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Preview" className="w-full h-full object-cover mix-blend-multiply" />
                  ) : (
                    <ResourcePlaceholder seed={formData.title || 'preview'} iconSize={24} />
                  )}
                </div>
                <div className="flex flex-col p-3 md:p-4 gap-2 md:gap-3">
                  <span className="text-[8px] md:text-[9px] font-display font-bold tracking-[0.2em] uppercase text-[#0f4369]">
                    {formData.category || 'CATEGORY'}
                  </span>
                  <h4 className="font-display font-bold text-[12px] md:text-[14px] text-[#1c1c19] uppercase leading-tight line-clamp-2">
                    {formData.title || 'RESOURCE TITLE'}
                  </h4>
                  <p className="text-[10px] md:text-[11px] font-sans text-[#493f36] line-clamp-2 md:line-clamp-3 leading-relaxed">
                    {formData.description || 'Resource description will appear here...'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {loading && <div className="text-center p-8 font-display text-[12px] uppercase text-[#72777f]">Loading Resources...</div>}
      
      {!loading && categories.map(category => (
        <div key={category} className="flex flex-col gap-5">
          <h3 className="font-display font-bold text-[14px] text-[#1c1c19] uppercase tracking-[0.2em] border-b-2 border-[#1c1c19] pb-2">
            {category}
          </h3>
          <div className="flex flex-col gap-6">
            {filteredResources.filter(r => r.category === category).map(res => (
              
              <div 
                key={res.id}
                onDragOver={(e) => handleDragOver(e, res.id)}
                onDrop={(e) => handleDrop(e, res.id)}
                className="relative"
              >
                {canEdit && dragOverResourceId === res.id && (
                  <div className="absolute -top-3 left-0 right-0 h-[6px] bg-[#0f4369] z-50">
                    <div className="absolute right-0 -top-2 bg-[#0f4369] text-white text-[8px] px-1 font-bold italic tracking-tighter">REorderAR_AQUÍ</div>
                  </div>
                )}
                <div 
                  draggable={canEdit}
                  onDragStart={(e) => handleDragStart(e, res.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => {
                     if (moduleMode && onSelectResource) {
                        onSelectResource(res);
                     } else {
                        navigate(`/admin/resourceEdit/${res.id}`);
                     }
                  }}
                  className={`w-full flex flex-col md:flex-row items-stretch rounded-none border-2 border-[#1c1c19] transition-all duration-200 text-left overflow-hidden focus:outline-none relative z-10 shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] hover:shadow-[6px_6px_0_0_rgba(28,28,25,0.15)] hover:-translate-y-[1px] bg-[#fcf9f4] group cursor-pointer ${canEdit ? 'cursor-grab active:cursor-grabbing' : ''}`}
                >
                
                {/* 1. Name and Category Panel */}
                <div className={`flex flex-col flex-1 min-w-[150px] md:min-w-[200px] p-4 md:p-5 border-b-2 md:border-b-0 md:border-r-2 border-[#1c1c19]/20`}>
                  <div className="flex items-center gap-2 mb-2 md:mb-3">
                    <div className={`p-1 border-2 border-[#1c1c19] bg-[#0f4369]`}>
                      <FileText size={10} strokeWidth={3} className="text-white" />
                    </div>
                    <span className={`text-[8px] md:text-[9px] font-display font-bold tracking-[0.2em] uppercase text-[#1c1c19]`}>
                      ID_{res.id.substring(0,8)} // {res.category}
                    </span>
                  </div>
                  <h3 className={`font-sans text-xs md:text-base font-semibold leading-tight text-[#1c1c19] uppercase`}>
                    {res.title}
                  </h3>
                  
                  {/* Decorative line matching aesthetic */}
                  <div className="mt-auto pt-4 hidden md:block">
                     <div className={`h-[4px] w-full max-w-[120px] overflow-hidden border-2 bg-[#e5e2dd] border-[#1c1c19]`}>
                       <div className="h-full w-1/2 bg-[#0f4369]"></div>
                     </div>
                  </div>
                </div>

                {/* 1.5. Published Switch (Admin Only) */}
                <div className="w-full md:w-[100px] shrink-0 border-b-2 md:border-b-0 md:border-r-2 border-[#1c1c19]/20 bg-[#f6f3ee] flex flex-col items-center justify-center p-2" onClick={(e) => e.stopPropagation()}>
                  <label className="flex flex-col items-center gap-1.5 cursor-pointer">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${res.published ? 'text-[#0f4369]' : 'text-[#72777f]'}`}>
                      {res.published ? 'PUBLICADO' : 'BORRADOR'}
                    </span>
                    <div className="relative">
                      <input 
                        type="checkbox" 
                        className="sr-only peer"
                        checked={res.published}
                        onChange={() => updateResource(res.id, { published: !res.published })}
                      />
                      <div className="w-10 h-5 bg-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#0f4369]"></div>
                    </div>
                  </label>
                </div>

                {/* 2. Image / Preview Panel */}
                <div className={`w-full md:w-[150px] lg:w-[180px] shrink-0 min-h-[100px] md:min-h-[120px] border-b-2 md:border-b-0 md:border-r-2 border-[#1c1c19]/20 bg-[#e5e2dd] relative flex items-center justify-center overflow-hidden`}>
                   {res.image_url ? (
                     <img src={res.image_url} alt={res.title} className="w-full h-full object-cover mix-blend-multiply transition-transform duration-700 group-hover:scale-105" />
                   ) : (
                     <ResourcePlaceholder seed={res.id} iconSize={24} md:iconSize={32} />
                   )}
                </div>

                {/* 3. Explanation Panel */}
                <div className={`flex flex-col justify-center flex-[1.5] p-4 md:p-5 border-b-2 md:border-b-0 md:border-r-2 border-[#1c1c19]/20`}>
                   <p className={`text-[10px] md:text-xs leading-relaxed font-sans text-[#1c1c19]/80 line-clamp-2 md:line-clamp-none`}>
                      {res.description || "No description provided format for this resource asset item."}
                   </p>
                </div>

                {/* 4. Click to open Panel */}
                <div className={`w-full md:w-[100px] lg:w-[120px] shrink-0 flex items-center justify-center p-3 md:p-4 bg-[#f6f3ee] transition-colors group-hover:bg-[#1c1c19]`}>
                   <div className={`flex items-center md:flex-col gap-2 text-[#1c1c19] group-hover:text-white transition-colors`}>
                      {moduleMode ? <Plus size={16} strokeWidth={2} /> : <ArrowRight size={16} strokeWidth={2} />}
                      <span className="text-[9px] md:text-[10px] font-display font-bold tracking-widest uppercase md:hidden">
                        {moduleMode ? 'Add' : 'Open'}
                      </span>
                   </div>
                </div>
              </div>
            </div>
            ))}
          </div>
        </div>
      ))}

      {!loading && resources.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center text-[#72777f] border-2 border-dashed border-[#d8d3cc] bg-[#fcf9f4]/50">
          <ImageIcon size={32} className="mb-4 text-[#d8d3cc]" strokeWidth={1} />
          <span className="font-display font-bold text-[12px] uppercase tracking-widest">No resources found in the database.</span>
        </div>
      )}

      {!loading && resources.length > 0 && filteredResources.length === 0 && (
        <div className="py-12 flex flex-col items-center justify-center text-[#72777f] border-2 border-dashed border-[#d8d3cc] bg-[#fcf9f4]/50">
          <Search size={32} className="mb-4 text-[#d8d3cc]" strokeWidth={1} />
          <span className="font-display font-bold text-[12px] uppercase tracking-widest">No matching resources found for "{searchQuery}".</span>
        </div>
      )}
    </div>
  );
}
