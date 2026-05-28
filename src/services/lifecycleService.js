import { supabase } from './supabaseClient';

export const lifecycleService = {
  // Obtener todos los ciclos de vida
  getLifecycles: async () => {
    const { data, error } = await supabase
      .from('lifecycles')
      .select('*');
    if (error) throw error;
    return data;
  },

  // Obtener todos los proyectos
  getProjects: async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*, lifecycles(*)');
    if (error) throw error;
    return data;
  },

  // Crear un nuevo proyecto vinculado a un ciclo
  createProject: async (project) => {
    const { data, error } = await supabase
      .from('projects')
      .insert([project])
      .select();
    if (error) throw error;
    return data[0];
  },

  // Actualizar metadatos del proyecto
  updateProject: async (id, updates) => {
    let payload = { ...updates };
    let retries = 5;
    
    while (retries > 0) {
      const { data, error } = await supabase
        .from('projects')
        .update(payload)
        .eq('id', id)
        .select();
        
      if (!error) {
        return data[0];
      }
      
      const errorMsg = error.message || '';
      const match = errorMsg.match(/Could not find the '([^']+)' column/);
      if (match && match[1]) {
        const missingColumn = match[1];
        console.warn(`Removing missing column '${missingColumn}' from projects update payload.`);
        delete payload[missingColumn];
        retries--;
      } else {
        throw error;
      }
    }
  },

  // Obtener etapas de un ciclo de vida específico
  getStages: async (lifecycleId) => {
    const { data, error } = await supabase
      .from('lifecycle_stages')
      .select('*')
      .eq('lifecycle_id', lifecycleId)
      .order('order_index', { ascending: true });
    if (error) throw error;
    return data;
  },

  // Actualizar una etapa (ej. nombre o días estimados)
  updateStage: async (id, updates) => {
    const { data, error } = await supabase
      .from('lifecycle_stages')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  // Obtener proyectos asociados a un ciclo de vida
  getProjectsByLifecycle: async (lifecycleId) => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('lifecycle_id', lifecycleId);
    if (error) throw error;
    return data;
  },

  // Obtener actividades de un proyecto
  getActivities: async (projectId) => {
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('project_id', projectId);
    if (error) throw error;
    return data;
  },

  // Crear una nueva actividad
  createActivity: async (activity) => {
    const { data, error } = await supabase
      .from('activities')
      .insert([{
        ...activity,
        color_hex: activity.color_hex || '#3b82f6'
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  // Actualizar una actividad (ej: mover o redimensionar suavemente)
  updateActivity: async (id, updates) => {
    const { data, error } = await supabase
      .from('activities')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  // Eliminar una etapa y reorderar el resto
  deleteStage: async (id) => {
    const { error } = await supabase
      .from('lifecycle_stages')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  // Crear una nueva etapa
  createStage: async (stage) => {
    const { data, error } = await supabase
      .from('lifecycle_stages')
      .insert([stage])
      .select();
    if (error) throw error;
    return data[0];
  },

  // Actualizar múltiples actividades a la vez (Batch Update)
  updateActivitiesBatch: async (activities) => {
    const { data, error } = await supabase
      .from('activities')
      .upsert(activities)
      .select();
    if (error) throw error;
    return data;
  },

  // Actualizar metadatos de un ciclo de vida
  updateLifecycle: async (id, updates) => {
    const { data, error } = await supabase
      .from('lifecycles')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  // Eliminar una actividad
  deleteActivity: async (id) => {
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
