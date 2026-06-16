import { supabase } from './supabaseClient';

export const areasService = {
  async getAreas(projectId) {
    const { data, error } = await supabase
      .from('project_area_details')
      .select(`
        *,
        level:project_levels(nombre, indice, parent_id, elevacion)
      `)
      .eq('project_id', projectId);

    if (error) throw error;
    return data;
  },

  async upsertArea(areaData) {
    const { data, error } = await supabase
      .from('project_area_details')
      .upsert(areaData, { onConflict: 'project_id,level_id,context_type' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteArea(id) {
    const { error } = await supabase
      .from('project_area_details')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};
