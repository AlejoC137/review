import supabase from '../config/supabaseClient';

/**
 * Obtiene la lista de espacios disponibles (solo tipo='Espacio')
 */
export const getSpaces = async () => {
    const { data, error } = await supabase
        .from('Espacio_Elemento')
        .select('_id, nombre, tipo, apellido, piso')
        .eq('tipo', 'Espacio')
        .order('nombre', { ascending: true });

    if (error) {
        console.error('Error fetching spaces:', error);
        throw error;
    }
    return data || [];
};

/**
 * Obtiene detalles completos de un espacio específico
 */
export const getSpaceDetails = async (espacioId) => {
    const { data, error } = await supabase
        .from('Espacio_Elemento')
        .select('_id, nombre, tipo, piso, componentes, apellido')
        .eq('_id', espacioId)
        .single();

    if (error) {
        console.error('Error fetching space details:', error);
        throw error;
    }
    return data;
};

/**
 * Actualiza propiedades de un espacio
 */
export const updateSpace = async (espacioId, updates) => {
    const { data, error } = await supabase
        .from('Espacio_Elemento')
        .update(updates)
        .eq('_id', espacioId)
        .select();

    if (error) throw error;
    return data[0];
};

/**
 * Crea un nuevo espacio o elemento
 */
export const createSpace = async (spaceData) => {
    const { data, error } = await supabase
        .from('Espacio_Elemento')
        .insert([spaceData])
        .select();

    if (error) {
        console.error('Error creating space:', error);
        throw error;
    }
    return data[0];
};

/**
 * Elimina un espacio o elemento
 */
export const deleteSpace = async (espacioId) => {
    const { error } = await supabase
        .from('Espacio_Elemento')
        .delete()
        .eq('_id', espacioId);

    if (error) {
        console.error('Error deleting space:', error);
        throw error;
    }
    return true;
};

/**
 * Obtiene todos los espacios y elementos (ambos tipos) con datos relacionados
 */
export const getAllSpacesAndElements = async () => {
    const { data, error } = await supabase
        .from('Espacio_Elemento')
        .select(`
            _id, nombre, tipo, apellido, piso
        `)
        .order('tipo', { ascending: true })
        .order('nombre', { ascending: true });

    if (error) {
        console.error('Error fetching spaces and elements:', error);
        throw error;
    }
    return data || [];
};

/**
 * Obtiene la lista de etapas (stages)
 */
export const getStages = async () => {
    try {
        const { data, error } = await supabase
            .from('Stage')
            .select('id, name')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error fetching stages:', error);
            if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                console.warn('⚠️  Tabla "Stage" no existe en Supabase');
                return [];
            }
            throw error;
        }
        return data || [];
    } catch (err) {
        console.error('Error inesperado al obtener stages:', err);
        return [];
    }
};

/**
 * Obtiene la lista de staffers/ejecutores
 */
export const getStaffers = async () => {
    try {
        const { data, error } = await supabase
            .from('Staff')
            .select('id, name, role_description')
            .order('name', { ascending: true });

        if (error) {
            console.error('❌ Error fetching staffers:', error);
            console.error('   Detalles:', {
                message: error.message,
                code: error.code,
                hint: error.hint
            });

            if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                console.warn('⚠️  Tabla "Staff" no existe en Supabase');
                return [];
            }

            throw error;
        }

        return data || [];
    } catch (err) {
        console.error('❌ Error inesperado al obtener staff:', err);
        return [];
    }
};

/**
 * Crea un nuevo miembro del staff
 */
export const createStaff = async (staffData) => {
    const { data, error } = await supabase
        .from('Staff')
        .insert([staffData])
        .select();

    if (error) {
        console.error('Error creating staff:', error);
        throw error;
    }
    return data[0];
};

/**
 * Actualiza los datos de un miembro del staff
 */
export const updateStaff = async (staffId, staffData) => {
    const { data, error } = await supabase
        .from('Staff')
        .update(staffData)
        .eq('id', staffId)
        .select();

    if (error) {
        console.error('Error updating staff:', error);
        throw error;
    }
    return data[0];
};

/**
 * Elimina un miembro del staff
 */
export const deleteStaff = async (staffId) => {
    const { error } = await supabase
        .from('Staff')
        .delete()
        .eq('id', staffId);

    if (error) {
        console.error('Error deleting staff:', error);
        throw error;
    }
    return true;
};
