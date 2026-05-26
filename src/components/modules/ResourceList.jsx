import React, { useState, useEffect } from 'react';
import { ExternalLink, Edit, Trash2, Plus, X, Image as ImageIcon, ArrowRight, Save, LayoutTemplate, FileText, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useResources } from '../../hooks/useResources';
import { useNavigate } from 'react-router-dom';
import ResourcePlaceholder from '../ui/ResourcePlaceholder';
import { RESOURCE_CATEGORIES } from '../../services/sareNames';

export default function ResourceList({ moduleMode = false, moduleId = null, onSelectResource = null, onlyCategory = null }) {
  const { user, isAdmin } = useAuth();

  const navigate = useNavigate();
  const { 
    resources, 
    loading, 
    fetchResources, 
    createResource,
    reorderResources
  } = useResources();

  const [isEditing, setIsEditing] = useState(null);
  const [formData, setFormData] = useState({ 
    category: onlyCategory || RESOURCE_CATEGORIES[0], 
    title: '', 
    image_url: '', 
    description: '',
    url: ''
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [draggedResourceId, setDraggedResourceId] = useState(null);
  const [dragOverResourceId, setDragOverResourceId] = useState(null);

  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  const handleDragStart = (e, resourceId) => {
    if (!isAdmin) return;
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
    if (!isAdmin || draggedResourceId === resourceId) return;
    setDragOverResourceId(resourceId);
  };

  const handleDrop = (e, targetResourceId) => {
    const sourceResourceId = e.dataTransfer.getData('application/resource-id');
    
    if (!isAdmin || sourceResourceId === targetResourceId) return;
    
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
    setFormData({ category: onlyCategory || RESOURCE_CATEGORIES[0], title: '', image_url: '', description: '', url: '' });
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
          navigate(`/resourceView/${res.id}`);
        }
      }
    } catch (e) {
      alert('Error al guardar el recurso.');
    }
  };

  const filteredResources = resources.filter(res => {
    const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) && res.published === true;
    const matchesCategory = onlyCategory ? res.category === onlyCategory : true;
    return matchesSearch && matchesCategory;
  });

  const categories = [...new Set(filteredResources.map(r => r.category))];

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* Remove Add Button */}

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

      {/* Creation form removed for public view */}

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
                {/* No drag visual for users */}
                <button 
                  draggable={false}
                  onClick={() => {
                     if (moduleMode && onSelectResource) {
                        onSelectResource(res);
                     } else {
                        navigate(`/resourceView/${res.id}`);
                     }
                  }}
                  className={`w-full flex flex-col md:flex-row items-stretch rounded-none border-2 border-[#1c1c19] transition-all duration-200 text-left overflow-hidden focus:outline-none relative z-10 shadow-[4px_4px_0_0_rgba(28,28,25,0.1)] hover:shadow-[6px_6px_0_0_rgba(28,28,25,0.15)] hover:-translate-y-[1px] bg-[#fcf9f4] group`}
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
              </button>
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
