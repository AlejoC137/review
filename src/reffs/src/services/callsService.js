import supabase from '../config/supabaseClient';

/**
 * Registra una nueva llamada en la tabla "Llamadas"
 * @param {Object} callData - Datos de la llamada (task_id, llamador_id, llamado_id, proyecto_id)
 */
export const createCall = async (callData) => {
    const { data, error } = await supabase
        .from('Llamadas')
        .insert([{
            task_id: callData.task_id,
            llamador_name: callData.llamador_name || 'Sistema',
            llamado_id: callData.llamado_id,
            proyecto_id: callData.proyecto_id || null,
            Comments: callData.Comments || null,
            created_at: new Date().toISOString()
        }]);

    if (error) {
        console.error('Error creating call record:', error);
        throw error;
    }
    return data;
};

/**
 * Registra múltiples llamadas (útil para el equipo de seguimiento)
 * @param {Array} callsArray - Array de objetos de llamada
 */
export const createMultipleCalls = async (callsArray) => {
    const { data, error } = await supabase
        .from('Llamadas')
        .insert(callsArray.map(call => ({
            task_id: call.task_id,
            llamador_name: call.llamador_name || 'Sistema',
            llamado_id: call.llamado_id,
            proyecto_id: call.proyecto_id || null,
            Comments: call.Comments || null,
            created_at: new Date().toISOString()
        })));

    if (error) {
        console.error('Error creating multiple call records:', error);
        throw error;
    }
    return data;
};

/**
 * Obtiene todas las llamadas con detalles de la tarea y el personal llamado
 */
export const getCallsWithDetails = async () => {
    const { data, error } = await supabase
        .from('Llamadas')
        .select(`
            *,
            tarea:Tareas(
                *,
                proyecto:Proyectos(id, name),
                espacio:Espacio_Elemento(_id, nombre, tipo),
                staff:Staff(id, name),
                stage:Stage(id, name),
                condicionada_por_task:Tareas!condicionada_por(id, task_description),
                condiciona_a_task:Tareas!condiciona_a(id, task_description)
            ),
            llamado:Staff!llamado_id(id, name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching calls with details:', error);
        throw error;
    }
    return data || [];
};

/**
 * Actualiza una llamada existente
 */
export const updateCall = async (callId, updates) => {
    const { data, error } = await supabase
        .from('Llamadas')
        .update(updates)
        .eq('id', callId)
        .select();

    if (error) {
        console.error('Error updating call:', error);
        throw error;
    }
    return data[0];
};

/**
 * Obtiene el conteo de llamadas no atendidas
 */
export const getPendingCallsCount = async () => {
    const { count, error } = await supabase
        .from('Llamadas')
        .select('*', { count: 'exact', head: true })
        .eq('atendido', false);

    if (error) {
        console.error('Error fetching pending calls count:', error);
        throw error;
    }
    return count || 0;
};


