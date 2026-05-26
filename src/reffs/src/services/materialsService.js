import supabase from '../config/supabaseClient';

/**
 * Obtiene la lista de materiales
 */
export const getMaterials = async () => {
    try {
        const { data, error } = await supabase
            .from('Materiales')
            .select('id, Nombre, categoria, tipo, precio_COP, proveedor, stock, notas, unidad')
            .order('Nombre', { ascending: true });

        if (error) {
            console.error('❌ Error fetching materials:', error);
            console.error('   Detalles:', {
                message: error.message,
                code: error.code,
                hint: error.hint
            });

            if (error.code === 'PGRST116' || error.message.includes('does not exist')) {
                console.warn('⚠️  Tabla "Materiales" no existe en Supabase');
                return [];
            }

            throw error;
        }

        return data || [];
    } catch (err) {
        console.error('❌ Error inesperado al obtener materiales:', err);
        return [];
    }
};

/**
 * Obtiene detalles de un material específico
 */
export const getMaterialById = async (materialId) => {
    const { data, error } = await supabase
        .from('Materiales')
        .select('*')
        .eq('id', materialId)
        .single();

    if (error) {
        console.error('Error fetching material details:', error);
        throw error;
    }
    return data;
};

/**
 * Obtiene categorías únicas de materiales
 */
export const getMaterialCategories = async () => {
    const { data, error } = await supabase
        .from('Materiales')
        .select('categoria')
        .not('categoria', 'is', null);

    if (error) {
        console.error('Error fetching material categories:', error);
        return [];
    }

    // Extraer categorías únicas
    const uniqueCategories = [...new Set(data.map(m => m.categoria).filter(Boolean))].sort();
    return uniqueCategories;
};

/**
 * Actualiza un material existente.
 * Asegura conversión de tipos estricta para campos numéricos.
 * @param {number} materialId - ID del material a actualizar
 * @param {object} updates - Objeto con las propiedades a actualizar
 */
export const updateMaterial = async (materialId, updates) => {
    const updatePayload = {};

    // Campos de texto
    if (updates.Nombre !== undefined) {
        updatePayload.Nombre = updates.Nombre;
    }
    if (updates.proveedor !== undefined) {
        updatePayload.proveedor = updates.proveedor;
    }
    if (updates.categoria !== undefined) {
        updatePayload.categoria = updates.categoria;
    }
    if (updates.tipo !== undefined) {
        updatePayload.tipo = updates.tipo;
    }
    if (updates.unidad !== undefined) {
        updatePayload.unidad = updates.unidad;
    }
    if (updates.notas !== undefined) {
        updatePayload.notas = updates.notas;
    }

    // Campos numéricos - conversión estricta
    if (updates.precio_COP !== undefined) {
        updatePayload.precio_COP = updates.precio_COP === '' ? null : parseFloat(updates.precio_COP);
    }
    if (updates.precio_por_m2 !== undefined) {
        updatePayload.precio_por_m2 = updates.precio_por_m2 === '' ? null : parseFloat(updates.precio_por_m2);
    }
    if (updates.stock !== undefined) {
        updatePayload.stock = updates.stock === '' ? null : parseInt(updates.stock, 10);
    }
    if (updates.alto_mm !== undefined) {
        updatePayload.alto_mm = updates.alto_mm === '' ? null : parseFloat(updates.alto_mm);
    }
    if (updates.ancho_mm !== undefined) {
        updatePayload.ancho_mm = updates.ancho_mm === '' ? null : parseFloat(updates.ancho_mm);
    }
    if (updates.espesor_mm !== undefined) {
        updatePayload.espesor_mm = updates.espesor_mm === '' ? null : parseFloat(updates.espesor_mm);
    }

    const { data, error } = await supabase
        .from('Materiales')
        .update(updatePayload)
        .eq('id', materialId)
        .select()
        .single();

    if (error) {
        console.error('Error updating material:', error);
        throw error;
    }
    return data;
};
