import { supabase } from './supabaseClient';

export const bimService = {
  // Fetch a specific schema by ID, including project info if available
  async getEsquemaById(schemaId) {
    const { data, error } = await supabase
      .from('esquemas')
      .select('*, project_id') // We'll assume the SQL migration was run
      .eq('id', schemaId)
      .single();

    if (error) {
      console.error("Error fetching schema:", error);
      throw error;
    }
    return data;
  },

  // Fetch all schemas (or filtered by projectId)
  async getEsquemas(projectId = null) {
    let query = supabase
      .from('esquemas')
      .select('*')
      .order('name', { ascending: true });

    if (projectId) {
      query = query.eq('project', projectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching esquemas:", error);
      return { data: [] };
    }
    return { data: data || [] };
  },

  // Save the entire JSON structure (map_data)
  async saveFullSchema(schemaId, mapData) {
    const { error } = await supabase
      .from('esquemas')
      .update({ 
        map_data: mapData
      })
      .eq('id', schemaId);

    if (error) {
      console.error("Error saving schema:", error);
      throw error;
    }
  },

  // Specialized update for a specific node's URL (Google Drive integration)
  async updateNodeUrl(esquemaId, nodeId, url) {
    const { data: current, error: fetchError } = await supabase
      .from('esquemas')
      .select('map_data')
      .eq('id', esquemaId)
      .single();
    
    if (fetchError) throw fetchError;

    const updateRecursive = (node) => {
        if (node.id === nodeId) return { ...node, url };
        if (node.children) return { ...node, children: node.children.map(updateRecursive) };
        return node;
    };

    const newMapData = updateRecursive(current.map_data);
    
    const { error: updateError } = await supabase
      .from('esquemas')
      .update({ map_data: newMapData })
      .eq('id', esquemaId);

    if (updateError) throw updateError;
  }
};
