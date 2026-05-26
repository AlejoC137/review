import supabase from '../config/supabaseClient';
import { startOfWeek, endOfWeek, format } from 'date-fns';

/**
 * Obtiene todas las tareas con sus relaciones
 */
export const getTasks = async () => {
    const { data, error } = await supabase
        .from('Tareas')
        .select(`
            *,
            proyecto:Proyectos(id, name),
            espacio:Espacio_Elemento(_id, nombre, tipo, apellido, piso),
            staff:Staff(id, name),
            stage:Stage(id, name),
            condicionada_por_task:Tareas!condicionada_por(id, task_description),
            condiciona_a_task:Tareas!condiciona_a(id, task_description)
        `)
        .order('fecha_inicio', { ascending: false });

    if (error) {
        console.error('Error fetching tasks:', error);
        throw error;
    }
    return data || [];
};

/**
 * Obtiene una tarea específica por ID
 */
export const getTaskById = async (taskId) => {
    const { data, error } = await supabase
        .from('Tareas')
        .select(`
            *,
            proyecto:Proyectos(id, name),
            espacio:Espacio_Elemento(_id, nombre, tipo, apellido, piso),
            staff:Staff(id, name),
            stage:Stage(id, name),
            condicionada_por_task:Tareas!condicionada_por(id, task_description),
            condiciona_a_task:Tareas!condiciona_a(id, task_description)
        `)
        .eq('id', taskId)
        .single();

    if (error) {
        console.error('Error fetching task:', error);
        throw error;
    }
    return data;
};

/**
 * Busca tareas por nombre (para autocompleted)
 */
export const searchTasks = async (query) => {
    if (!query || query.length < 2) return [];

    const { data, error } = await supabase
        .from('Tareas')
        .select('id, task_description, proyecto:Proyectos(name)')
        .ilike('task_description', `%${query}%`)
        .limit(10);

    if (error) {
        console.error('Error searching tasks:', error);
        return [];
    }
    return data;
};

/**
 * Crea una nueva tarea
 * Column names from DATABASE_CONTEXT.md:
 * - project_id, staff_id, stage_id, espacio_uuid
 */
export const createTask = async (taskData) => {
    // Build payload with ACTUAL database column names from DATABASE_CONTEXT.md
    const payload = {
        task_description: taskData.task_description,
        project_id: taskData.proyecto_id || taskData.proyecto || null,
        staff_id: taskData.staff_id || taskData.asignado_a || null,
        stage_id: taskData.stage_id || taskData.etapa || null,
        espacio_uuid: taskData.espacio_uuid || null,
        fecha_inicio: taskData.fecha_inicio,
        fecha_fin_estimada: taskData.fecha_fin_estimada,
        finished: taskData.finished || 'Pendiente',
        finished: taskData.finished || false,
        RonaldPass: taskData.RonaldPass || false,
        WietPass: taskData.WietPass || false,
        AlejoPass: taskData.AlejoPass || false,
        links_de_interes: taskData.links_de_interes || '',
        evidence_url: taskData.evidence_url || null
    };

    // Remove null/undefined values to avoid sending nulls for optional fields
    Object.keys(payload).forEach(key => {
        if (payload[key] === undefined || payload[key] === null) delete payload[key];
    });

    const { data, error } = await supabase
        .from('Tareas')
        .insert([payload])
        .select(`
            *,
            proyecto:Proyectos(id, name),
            espacio:Espacio_Elemento(_id, nombre, tipo, apellido, piso),
            staff:Staff(id, name),
            stage:Stage(id, name),
            condicionada_por_task:Tareas!condicionada_por(id, task_description),
            condiciona_a_task:Tareas!condiciona_a(id, task_description)
        `);

    if (error) {
        console.error('Error creating task:', error);
        throw error;
    }
    return data[0];
};

/**
 * Actualiza una tarea existente
 */
export const updateTask = async (taskId, updates) => {
    const { data, error } = await supabase
        .from('Tareas')
        .update(updates)
        .eq('id', taskId)
        .select(`
            *,
            proyecto:Proyectos(id, name),
            espacio:Espacio_Elemento(_id, nombre, tipo, apellido, piso),
            staff:Staff(id, name),
            stage:Stage(id, name),
            condicionada_por_task:Tareas!condicionada_por(id, task_description),
            condiciona_a_task:Tareas!condiciona_a(id, task_description)
        `);

    if (error) {
        console.error('Error updating task:', error);
        throw error;
    }
    return data[0];
};

/**
 * Elimina una tarea
 */
export const deleteTask = async (taskId) => {
    const { error } = await supabase
        .from('Tareas')
        .delete()
        .eq('id', taskId);

    if (error) {
        console.error('Error deleting task:', error);
        throw error;
    }
};

/**
 * Obtiene proyectos disponibles para asignar a tareas
 */
export const getProjects = async () => {
    const { data, error } = await supabase
        .from('Proyectos')
        .select('id, name, finished')
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching projects:', error);
        throw error;
    }
    return data || [];
};

/**
 * Obtiene las etapas disponibles (Stages)
 */
export const getStages = async () => {
    const { data, error } = await supabase
        .from('Stage')
        .select('id, name') // Assuming 'name' exists, if not I might need to check columns or just select *
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching stages:', error);
        return []; // Fail gracefully
    }
    return data || [];
};

/**
 * Obtiene tareas por fecha específica (para Day View)
 */
export const getTasksByDate = async (dateStr) => {
    const { data, error } = await supabase
        .from('Tareas')
        .select(`
            *,
            proyecto:Proyectos(id, name),
            espacio:Espacio_Elemento(_id, nombre, tipo, apellido, piso),
            staff:Staff(id, name),
            stage:Stage(id, name),
            condicionada_por_task:Tareas!condicionada_por(id, task_description),
            condiciona_a_task:Tareas!condiciona_a(id, task_description)
        `)
        .or(`fecha_inicio.eq.${dateStr},fecha_fin_estimada.eq.${dateStr}`); // Simple logic: starts or ends on that day

    if (error) {
        console.error('Error fetching tasks by date:', error);
        throw error;
    }
    return data || [];
};

/**
 * Obtiene tareas que inician o terminan en la semana actual
 */
export const getWeeklyTasks = async (currentDate = new Date()) => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });

    const startStr = format(start, 'yyyy-MM-dd');
    const endStr = format(end, 'yyyy-MM-dd');

    const { data, error } = await supabase
        .from('Tareas')
        .select(`
          *,
          proyecto:Proyectos(id, name),
          espacio:Espacio_Elemento(_id, nombre, tipo, apellido, piso),
          staff:Staff(id, name),
          stage:Stage(id, name),
          condicionada_por_task:Tareas!condicionada_por(id, task_description),
          condiciona_a_task:Tareas!condiciona_a(id, task_description)
      `)
        .or(`and(fecha_inicio.gte.${startStr},fecha_inicio.lte.${endStr}),and(fecha_fin_estimada.gte.${startStr},fecha_fin_estimada.lte.${endStr})`);

    if (error) {
        console.error('Error fetching weekly tasks:', error);
        throw error;
    }
    return data || [];
};

/**
 * Obtiene tareas por ID de proyecto
 */
export const getTasksByProject = async (projectId) => {
    const { data, error } = await supabase
        .from('Tareas')
        .select(`
            *,
            proyecto:Proyectos(id, name),
            espacio:Espacio_Elemento(_id, nombre, tipo, apellido, piso),
            staff:Staff(id, name),
            stage:Stage(id, name),
            condicionada_por_task:Tareas!condicionada_por(id, task_description),
            condiciona_a_task:Tareas!condiciona_a(id, task_description)
        `)
        .eq('project_id', projectId)
        .order('fecha_inicio', { ascending: false });

    if (error) {
        console.error('Error fetching tasks by project:', error);
        throw error;
    }
    return data || [];
};
