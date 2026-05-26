import { supabase } from './supabaseClient';

export const plannerService = {
  // Fetch all implementation plans from the dedicated 'bim_plans' table
  async getPlans() {
    const { data, error } = await supabase
      .from('bim_plans')
      .select('*, schema:esquemas(name)'); 

    if (error) {
      console.error("Error fetching plans:", error);
      throw error;
    }
    return data || [];
  },

  // Create a new plan in the 'bim_plans' table
  async createPlan(name, description) {
    const { data, error } = await supabase
      .from('bim_plans')
      .insert({
        name,
        description: description || "",
        plan_data: {} // Now stores a dictionary of { nodeId: { roles, url, etc } }
      })
      .select()
      .single();

    if (error) throw error;
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


