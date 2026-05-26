import supabase from '../config/supabaseClient';

/**
 * Obtiene la lista de protocolos
 */
export const getProtocols = async () => {
    const { data, error } = await supabase
        .from('Protocolos')
        .select('id, Nombre, Categoria, FechaUpdate, Editor, Contenido')
        .order('FechaUpdate', { ascending: false });

    if (error) {
        console.error('Error fetching protocols:', error);
        throw error;
    }
    return data || [];
};

/**
 * Obtiene detalles de un protocolo específico
 */
export const getProtocolById = async (protocolId) => {
    const { data, error } = await supabase
        .from('Protocolos')
        .select('*')
        .eq('id', protocolId)
        .single();

    if (error) {
        console.error('Error fetching protocol details:', error);
        throw error;
    }
    return data;
};

/**
 * Obtiene categorías únicas de protocolos
 */
export const getProtocolCategories = async () => {
    const { data, error } = await supabase
        .from('Protocolos')
        .select('Categoria')
        .not('Categoria', 'is', null);

    if (error) {
        console.error('Error fetching protocol categories:', error);
        return [];
    }

    // Extraer categorías únicas sustanciales e incluir 'Proveedores' por defecto
    const uniqueCategories = [...new Set(['Proveedores', ...data.map(p => p.Categoria).filter(Boolean)])].sort();
    return uniqueCategories;
};

/**
 * Actualiza un protocolo
 */
export const updateProtocol = async (protocolId, updates) => {
    const { data, error } = await supabase
        .from('Protocolos')
        .update(updates)
        .eq('id', protocolId)
        .select();

    if (error) throw error;
    return data[0];
};

/**
 * Crea un nuevo protocolo
 */
export const createProtocol = async (protocolData) => {
    const { data, error } = await supabase
        .from('Protocolos')
        .insert([{
            ...protocolData,
            FechaUpdate: new Date().toISOString()
        }])
        .select()
        .single();

    if (error) {
        console.error('Error creating protocol:', error);
        throw error;
    }
    return data;
};
