import supabase from '../config/supabaseClient';

/**
 * Obtiene los componentes de un espacio específico (Instancias).
 * @param {string} espacioUuid - UUID del espacio (Espacio_Elemento)
 */
export const getSpaceComponents = async (espacioUuid) => {
    if (!espacioUuid) return [];

    const { data, error } = await supabase
        .from('Instancias_Componentes')
        .select('id, espacio_id, componente_id, cantidad, notas, estado, especificaciones_tecnicas, dimensiones_reales')
        .eq('espacio_id', espacioUuid);

    if (error) {
        console.error('Error fetching space components:', error);
        throw error;
    }
    return data || [];
};

/**
 * Actualiza un componente específico (Instancia).
 */
export const updateComponent = async (id, updates) => {
    const { data, error } = await supabase
        .from('Instancias_Componentes')
        .update(updates)
        .eq('id', id)
        .select();

    if (error) throw error;
    return data[0];
};

/**
 * Obtiene el catálogo de componentes (Componentes table)
 */
export const getComponents = async () => {
    try {
        const { data, error } = await supabase
            .from('Componentes')
            .select('id, nombre, acabado, construcción, description, espacio_elemento')
            .order('nombre', { ascending: true });

        if (error) {
            console.error('❌ Error fetching components catalog:', error);
            console.error('   Detalles:', {
                message: error.message,
                code: error.code,
                hint: error.hint
            });

            // Si la tabla no existe, retornar array vacío en lugar de lanzar error
            if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                console.warn('⚠️  Tabla "Componentes" no existe en Supabase');
                return [];
            }

            throw error;
        }

        return data || [];
    } catch (err) {
        console.error('❌ Error inesperado al obtener componentes:', err);
        return [];
    }
};

/**
 * Obtiene detalles de un componente del catálogo
 */
export const getComponentById = async (componentId) => {
    const { data, error } = await supabase
        .from('Componentes')
        .select('*')
        .eq('id', componentId)
        .single();

    if (error) {
        console.error('Error fetching component details:', error);
        throw error;
    }
    return data;
};

/**
 * Crea una nueva instancia de componente en un espacio
 */
export const createSpaceComponent = async (componentData) => {
    const { data, error } = await supabase
        .from('Instancias_Componentes')
        .insert([componentData])
        .select();

    if (error) {
        console.error('Error creating space component:', error);
        throw error;
    }
    return data[0];
};

/**
 * Actualiza un componente del catálogo
 */
export const updateCatalogComponent = async (componentId, updates) => {
    const { data, error } = await supabase
        .from('Componentes')
        .update(updates)
        .eq('id', componentId)
        .select();

    if (error) throw error;
    return data[0];
};
