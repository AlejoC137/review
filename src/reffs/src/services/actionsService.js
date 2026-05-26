import supabase from '../config/supabaseClient';
import { startOfWeek, endOfWeek, format } from 'date-fns';

/**
 * Obtiene las acciones para una semana especifica con toda la data relacionada.
 * JOIN IMPLÍCITO: Acciones -> Tareas -> (Proyectos, Espacio_Elemento)
 */
export const getWeeklyActions = async (currentDate = new Date()) => {
  // 1. Calculamos rango de la semana (Lunes a Domingo por defecto)
  const start = startOfWeek(currentDate, { weekStartsOn: 1 });
  const end = endOfWeek(currentDate, { weekStartsOn: 1 });

  const startStr = format(start, 'yyyy-MM-dd');
  const endStr = format(end, 'yyyy-MM-dd');

  const { data, error } = await supabase
    .from('Acciones')
    .select(`
      *,
      requiere_aprobacion_ronald,
      estado_aprobacion_ronald,
      requiere_aprobacion_wiet,
      estado_aprobacion_wiet,
      requiere_aprobacion_alejo,
      estado_aprobacion_alejo,
      fecha_fin,
      tarea:Tareas (
        id,
        task_description,
        fecha_fin_estimada,
        espacio_uuid,
        proyecto:Proyectos (
          id, 
          name, 
          finished
        ),
        espacio:Espacio_Elemento (
          _id,
          nombre
        )
      )
    `)
    .gte('fecha_ejecucion', startStr) // Mayor o igual al Lunes
    .lte('fecha_ejecucion', endStr)   // Menor o igual al Domingo
    .order('fecha_ejecucion', { ascending: true }); // order cronológico

  if (error) {
    console.error('Error fetching weekly actions:', error);
    throw error;
  }

  return data;
};

/**
 * Actualización Optimista del Estado
 */
export const toggleActionStatus = async (id, currentStatus) => {
  const { data, error } = await supabase
    .from('Acciones')
    .update({ completed: !currentStatus })
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
};

/**
 * Actualiza cualquier campo de una acción
 */
export const updateAction = async (id, updates) => {
  const { data, error } = await supabase
    .from('Acciones')
    .update(updates)
    .eq('id', id)
    .select();

  if (error) throw error;
  return data;
};

/**
 * Crea una nueva acción (simple)
 */
export const createAction = async (action) => {
  const { data, error } = await supabase
    .from('Acciones')
    .insert([action])
    .select();

  if (error) throw error;
  return data; // returns array
};

/**
 * Get all actions for a specific task
 */
/**
 * Get all actions for a specific task
 */
export const getTaskActions = async (taskId) => {
  const { data, error } = await supabase
    .from('Acciones')
    .select('*')
    .eq('task_id', taskId)
    .order('order', { ascending: true })
    .order('fecha_ejecucion', { ascending: true });

  if (error) {
    console.error('Error fetching task actions:', error);
    throw error;
  }

  return data || [];
};

/**
 * Update order of multiple actions
 * @param {Array<{id: string, order: number}>} updates
 */
export const updateActionsOrder = async (updates) => {
  if (!updates || updates.length === 0) return;

  // Using upsert is risky if we don't have all fields, and we don't want to nullify others.
  // Safest for reordering is a batch of updates or individual updates.
  // Given low cardinality (actions per task), Promise.all is acceptable.

  const promises = updates.map(({ id, order }) =>
    supabase.from('Acciones').update({ order }).eq('id', id)
  );

  const results = await Promise.all(promises);
  const errors = results.filter(r => r.error);

  if (errors.length > 0) {
    console.error('Errors updating order:', errors);
    throw new Error('Failed to update some items');
  }

  return true;
};

/**
 * Elimina una acción (Hard Delete)
 */
export const deleteAction = async (id) => {
  const { error } = await supabase
    .from('Acciones')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting action:', error);
    throw error;
  }

  return true;
};
