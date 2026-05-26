import { useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';

export const useResources = () => {
  const [resources, setResources] = useState([]);
  const [moduleResources, setModuleResources] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch all global resources for Resource Lab
  const fetchResources = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setResources(data || []);
      return data;
    } catch (err) {
      console.error('Error fetching resources:', err);
      // Fallback empty if table doesn't exist yet
      setResources([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Fetch resources for a specific project
  const fetchProjectResources = useCallback(async (projectId) => {
    setLoading(true);
    try {
      // We first try with sorting, if it fails we try without it
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        // If project_id doesn't exist, we fallback to an empty list or global
        console.error('Database Error:', error.message);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Error fetching project resources:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch a single resource detail
  const fetchResourceById = useCallback(async (id) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching resource by id:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch resources linked to a specific module
  const fetchResourcesForModule = useCallback(async (moduleId) => {
    setLoading(true);
    try {
      // Join module_resources and resources
      const { data, error } = await supabase
        .from('module_resources')
        .select('*, resources(*)')
        .eq('module_id', moduleId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      const linked = data ? data.map(mr => mr.resources) : [];
      setModuleResources(linked);
      return linked;
    } catch (err) {
      console.error('Error fetching module resources:', err);
      setModuleResources([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Create a new globally available resource
  const createResource = async (resourceData) => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .insert([resourceData])
        .select()
        .single();
      
      if (error) throw error;
      setResources(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating resource:', err);
      throw err;
    }
  };

  // Update a resource
  const updateResource = async (id, updates) => {
    try {
      const { data, error } = await supabase
        .from('resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
        
      if (error) throw error;
      setResources(prev => prev.map(r => r.id === id ? data : r));
      return data;
    } catch (err) {
      console.error('Error updating resource:', err);
      throw err;
    }
  };

  // Delete a resource
  const deleteResource = async (id) => {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      setResources(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error('Error deleting resource:', err);
      throw err;
    }
  };

  // Link an existing resource to a module
  const linkResourceToModule = async (moduleId, resourceId, sortOrder = 0) => {
    try {
      const { error } = await supabase
        .from('module_resources')
        .insert([{ module_id: moduleId, resource_id: resourceId, sort_order: sortOrder }]);
        
      if (error) throw error;
      // Refresh the module resources list
      await fetchResourcesForModule(moduleId);
    } catch (err) {
      console.error('Error linking resource:', err);
      throw err;
    }
  };

  // Unlink a resource from a module
  const unlinkResourceFromModule = async (moduleId, resourceId) => {
    try {
       const { error } = await supabase
        .from('module_resources')
        .delete()
        .match({ module_id: moduleId, resource_id: resourceId });

       if (error) throw error;
       setModuleResources(prev => prev.filter(r => r.id !== resourceId));
    } catch (err) {
      console.error('Error unlinking resource:', err);
      throw err;
    }
  };

  // Bulk reorder resources
  const reorderResources = async (updatedResources) => {
    try {
      // Optimistic update
      setResources(updatedResources);

      const payload = updatedResources.map(r => ({
        id: r.id,
        category: r.category,
        title: r.title,
        image_url: r.image_url,
        description: r.description,
        url: r.url,
        sort_order: r.sort_order
      }));

      const { error } = await supabase
        .from('resources')
        .upsert(payload, { onConflict: 'id' });

      if (error) throw error;
    } catch (err) {
      console.error('Error reordering resources:', err);
      fetchResources(); // Revert on failure
      throw err;
    }
  };

  // ---------------- CONTENT BLOCKS FOR RESOURCES ----------------

  const fetchResourceBlocks = useCallback(async (resourceId) => {
    try {
      const { data, error } = await supabase
        .from('resource_content_blocks')
        .select('*')
        .eq('resource_id', resourceId)
        .order('sort_order', { ascending: true });
      
      if (error) {
        console.warn("Could not fetch resource_content_blocks, table might not exist yet:", error);
        return [];
      }
      return data || [];
    } catch (err) {
      console.error('Error fetching resource blocks:', err);
      return [];
    }
  }, []);

  const updateResourceBlocks = async (resourceId, blocks) => {
    try {
      // 1. Delete existing blocks for this resource
      const { error: deleteError } = await supabase
        .from('resource_content_blocks')
        .delete()
        .eq('resource_id', resourceId);
      
      if (deleteError) throw deleteError;

      // 2. Insert new blocks
      if (blocks.length > 0) {
        const blocksWithResourceId = blocks.map((b, i) => ({
          resource_id: resourceId,
          type: b.type,
          content: b.content,
          sort_order: i
        }));

        const { error: insertError } = await supabase
          .from('resource_content_blocks')
          .insert(blocksWithResourceId);
        
        if (insertError) throw insertError;
      }
    } catch (error) {
      console.error("Error updating resource blocks:", error);
      throw error;
    }
  };

  const uploadResourceImage = async (file) => {
    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const compressionOptions = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true
      };
      const compressedFile = await imageCompression(file, compressionOptions);
      const fileExt = file.name.split('.').pop();
      const fileName = `resource_${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('images')
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error("Error uploading resource image:", error);
      throw error;
    }
  };

  return {
    resources,
    moduleResources,
    loading,
    fetchResources,
    fetchProjectResources,
    fetchResourceById,
    fetchResourcesForModule,
    fetchResourceBlocks,
    updateResourceBlocks,
    uploadResourceImage,
    createResource,
    updateResource,
    deleteResource,
    reorderResources,
    linkResourceToModule,
    unlinkResourceFromModule
  };
};
