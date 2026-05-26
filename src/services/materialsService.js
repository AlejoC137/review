import { supabase } from './supabaseClient';

/**
 * Obtiene la lista de materiales con todas sus propiedades técnicas.
 * Usamos comillas dobles para columnas con mayúsculas según el esquema SQL.
 */
export const getMaterials = async () => {
    try {
        const { data, error } = await supabase
            .from('Materiales')
            .select(`
                id, 
                "Nombre", 
                categoria, 
                tipo, 
                unidad, 
                stock, 
                proveedor, 
                "precio_COP", 
                precio_por_m2, 
                precio_por_m_lineal,
                alto_mm, 
                ancho_mm, 
                espesor_mm, 
                largo_m, 
                area_mm2,
                peso_kg_m, 
                acabado, 
                grado,
                uso_recomendado, 
                observaciones_tecnicas, 
                notas,
                foto_url, 
                ultima_actualizacion
            `)
            .order('Nombre', { ascending: false });

        if (error) {
            console.error('❌ Error fetching materials:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('❌ Error inesperado al obtener materiales:', err);
        return [];
    }
};

/**
 * Actualiza un material con todas sus propiedades.
 */
export const updateMaterial = async (materialId, updates) => {
    const payload = {
        Nombre: updates.Nombre,
        categoria: updates.categoria,
        tipo: updates.tipo,
        unidad: updates.unidad,
        stock: updates.stock,
        proveedor: updates.proveedor,
        precio_COP: updates.precio_COP,
        precio_por_m2: updates.precio_por_m2,
        precio_por_m_lineal: updates.precio_por_m_lineal,
        alto_mm: updates.alto_mm,
        ancho_mm: updates.ancho_mm,
        espesor_mm: updates.espesor_mm,
        largo_m: updates.largo_m,
        area_mm2: updates.area_mm2,
        peso_kg_m: updates.peso_kg_m,
        acabado: updates.acabado,
        grado: updates.grado,
        uso_recomendado: updates.uso_recomendado,
        observaciones_tecnicas: updates.observaciones_tecnicas,
        notas: updates.notas,
        foto_url: updates.foto_url,
        ultima_actualizacion: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('Materiales')
        .update(payload)
        .eq('id', materialId)
        .select()
        .single();

    if (error) {
        console.error('Error updating material:', error);
        throw error;
    }
    return data;
};

/**
 * Crea un nuevo material
 */
export const createMaterial = async (materialData) => {
    const payload = {
        ...materialData,
        ultima_actualizacion: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('Materiales')
        .insert([payload])
        .select()
        .single();

    if (error) {
        console.error('Error creating material:', error);
        throw error;
    }
    return data;
};

/**
 * Elimina un material
 */
export const deleteMaterial = async (materialId) => {
    const { error } = await supabase
        .from('Materiales')
        .delete()
        .eq('id', materialId);

    if (error) {
        throw error;
    }
    return true;
};

export const getMaterialCategories = async () => {
    const { data } = await supabase.from('Materiales').select('categoria').not('categoria', 'is', null);
    return [...new Set((data || []).map(m => m.categoria))].sort();
};
