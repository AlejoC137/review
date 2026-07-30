import { supabase } from './supabaseClient';

export const plannerService = {
  // Fetch all implementation plans from the dedicated 'bim_plans' table
  async getPlans(projectId = null) {
    let query = supabase
      .from('bim_plans')
      .select('*, schema:esquemas(name, project)'); 

    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching plans:", error);
      return [];
    }

    if (projectId && data) {
      return data.filter(p => p.project_id === projectId || p.schema?.project === projectId);
    }

    return data || [];
  },

  // Create a new plan in the 'bim_plans' table
  async createPlan(name, description, projectId = null) {
    const payload = {
      name,
      description: description || "",
      plan_data: {},
      ...(projectId ? { project_id: projectId } : {})
    };

    const { data, error } = await supabase
      .from('bim_plans')
      .insert(payload)
      .select()
      .single();

    if (error) {
      // Fallback if project_id column does not exist
      delete payload.project_id;
      const { data: fallback, error: err2 } = await supabase
        .from('bim_plans')
        .insert(payload)
        .select()
        .single();
      if (err2) throw err2;
      return fallback;
    }
    return data;
  },

  // Establish the link between a plan and a schema (Just the ID, no cold copy)
  async connectSchema(planId, schema) {
    const { error } = await supabase
      .from('bim_plans')
      .update({
        schema_id: schema.id,
        plan_data: {} // Initialize with empty implementation data
      })
      .eq('id', planId);

    if (error) throw error;
  },

  // Save the implementation data (delta modifications only)
  async savePlanData(planId, planData) {
    const { error } = await supabase
      .from('bim_plans')
      .update({
        plan_data: planData
      })
      .eq('id', planId);

    if (error) throw error;
  },

  // Delete an implementation plan
  async deletePlan(planId) {
    const { error } = await supabase
      .from('bim_plans')
      .delete()
      .eq('id', planId);

    if (error) throw error;
  }
};


