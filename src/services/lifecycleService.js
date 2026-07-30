import { supabase } from './supabaseClient';
import { databaseReportService } from './databaseReportService';
import { filterProjectsByUser } from '../utils/projectAccess';

const isValidUUID = (str) => typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const lifecycleService = {
  // Obtener todos los ciclos de vida
  getLifecycles: async () => {
    const { data, error } = await supabase
      .from('lifecycles')
      .select('*');
    if (error) throw error;
    return data;
  },

  // Obtener todos los proyectos (filtrados según permisos del usuario)
  getProjects: async (user, isAdmin) => {
    const { data, error } = await supabase
      .from('projects')
      // Usar FK explícita para evitar PGRST201 (ambigüedad entre lifecycle_id y project_id)
      .select('*, lifecycles!lifecycle_id(*)');
    if (error) throw error;
    return filterProjectsByUser(data, user, isAdmin);
  },

  // Crear un nuevo proyecto vinculado a un ciclo
  createProject: async (project) => {
    const userId = project.id_user || (typeof window !== 'undefined' ? localStorage.getItem('custom_user_id') : null);
    let payload = {
      ...project,
      ...(userId ? { id_user: userId } : {})
    };
    delete payload.finished;

    if (payload.lifecycle_id && !isValidUUID(payload.lifecycle_id)) {
      payload.lifecycle_id = null;
    }

    let retries = 5;
    while (retries > 0) {
      const { data, error } = await supabase
        .from('projects')
        .insert([payload])
        .select();

      if (!error && data && data.length > 0) {
        return data[0];
      }

      const errorMsg = error?.message || '';
      const match = errorMsg.match(/Could not find the '([^']+)' column/);
      const isFkeyViolation = error?.code === '23503' || errorMsg.includes('foreign key constraint') || errorMsg.includes('_fkey');

      if (match && match[1]) {
        const missingColumn = match[1];
        console.warn(`Removing missing column '${missingColumn}' from projects insert payload.`);
        delete payload[missingColumn];
        retries--;
      } else if (isFkeyViolation) {
        if (payload.lifecycle_id && (errorMsg.includes('lifecycle') || errorMsg.includes('projects_lifecycle_id_fkey'))) {
          console.warn(`Lifecycle ID '${payload.lifecycle_id}' does not exist in DB 'lifecycles'. Retrying with null lifecycle_id.`);
          payload.lifecycle_id = null;
          retries--;
        } else if (payload.id_user && (errorMsg.includes('user') || errorMsg.includes('id_user'))) {
          console.warn(`User ID '${payload.id_user}' does not exist in DB. Retrying with null id_user.`);
          payload.id_user = null;
          retries--;
        } else if (payload.lifecycle_id) {
          console.warn(`Foreign key violation on insert. Retrying with null lifecycle_id.`);
          payload.lifecycle_id = null;
          retries--;
        } else {
          throw error;
        }
      } else {
        throw error;
      }
    }
  },

  // Eliminar un proyecto (Solo Admin)
  deleteProject: async (projectId) => {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId);
    if (error) throw error;
    return true;
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
      
      const errorMsg = error?.message || '';
      const match = errorMsg.match(/Could not find the '([^']+)' column/);
      const isFkeyViolation = error?.code === '23503' || errorMsg.includes('foreign key constraint') || errorMsg.includes('_fkey');

      if (match && match[1]) {
        const missingColumn = match[1];
        console.warn(`Removing missing column '${missingColumn}' from projects update payload.`);
        delete payload[missingColumn];
        retries--;
      } else if (isFkeyViolation && payload.lifecycle_id) {
        console.warn(`Foreign key constraint on update. Retrying with null lifecycle_id.`);
        payload.lifecycle_id = null;
        retries--;
      } else {
        throw error;
      }
    }
  },

  // Obtener etapas de un ciclo de vida específico
  getStages: async (lifecycleId) => {
    if (!lifecycleId || !isValidUUID(lifecycleId)) return [];
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
  getProjectsByLifecycle: async (lifecycleId, user, isAdmin) => {
    if (!lifecycleId || !isValidUUID(lifecycleId)) return [];
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('lifecycle_id', lifecycleId);
    if (error) throw error;
    return filterProjectsByUser(data, user, isAdmin);
  },

  // Obtener actividades de un proyecto
  getActivities: async (projectId) => {
    const available = await databaseReportService.getAvailableTables().catch(() => []);
    if (!available.includes('activities')) {
      console.warn("Table 'activities' is not available in Supabase. Returning empty array.");
      return [];
    }
    const { data, error } = await supabase
      .from('activities')
      .select('*')
      .eq('project_id', projectId);
    if (error) throw error;
    return data;
  },

  // Crear una nueva actividad
  createActivity: async (activity) => {
    const available = await databaseReportService.getAvailableTables().catch(() => []);
    if (!available.includes('activities')) {
      console.warn("Table 'activities' is not available. Skipping insertion.");
      return null;
    }
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
    const available = await databaseReportService.getAvailableTables().catch(() => []);
    if (!available.includes('activities')) {
      console.warn("Table 'activities' is not available. Skipping update.");
      return null;
    }
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
    const available = await databaseReportService.getAvailableTables().catch(() => []);
    if (!available.includes('activities') || activities.length === 0) {
      return [];
    }
    const { data, error } = await supabase
      .from('activities')
      .upsert(activities)
      .select();
    if (error) throw error;
    return data;
  },

  // Actualizar metadatos de un ciclo de vida
  updateLifecycle: async (id, updates) => {
    if (!id || !isValidUUID(id)) return null;
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
    const available = await databaseReportService.getAvailableTables().catch(() => []);
    if (!available.includes('activities')) {
      return;
    }
    const { error } = await supabase
      .from('activities')
      .delete()
      .eq('id', id);
    if (error) throw error;
  }
};
