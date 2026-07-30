import { supabase } from './supabaseClient';

/**
 * Obtiene la lista de materiales con todas sus propiedades técnicas.
 * Usamos comillas dobles para columnas con mayúsculas según el esquema SQL.
 */
/**
 * Obtiene la lista de materiales:
 * - Si hay projectId: materiales del proyecto + todos los globales (globalMaterial=true)
 * - Si no hay projectId (vista admin global): todos los materiales
 */
export const getMaterials = async (projectId = null) => {
    try {
        if (projectId) {
            // Obtener materiales del proyecto y globales en paralelo
            const [projectRes, globalRes] = await Promise.all([
                supabase
                    .from('Materiales')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('Nombre', { ascending: false }),
                supabase
                    .from('Materiales')
                    .select('*')
                    .eq('globalMaterial', true)
                    .order('Nombre', { ascending: false })
            ]);

            if (projectRes.error) console.warn('❌ Error fetching project materials:', projectRes.error);
            if (globalRes.error) console.warn('❌ Error fetching global materials:', globalRes.error);

            const projectMaterials = projectRes.data || [];
            const globalMaterials = globalRes.data || [];

            // Fusionar, evitando duplicados (si un material global tiene project_id del proyecto activo)
            const projectIds = new Set(projectMaterials.map(m => m.id));
            const uniqueGlobals = globalMaterials.filter(m => !projectIds.has(m.id));

            return [...projectMaterials, ...uniqueGlobals];
        }

        // Vista admin: obtener TODOS los materiales
        const { data, error } = await supabase
            .from('Materiales')
            .select('*')
            .order('Nombre', { ascending: false });

        if (error) {
            console.warn('❌ Error fetching materials:', error);
            return [];
        }

        return data || [];
    } catch (err) {
        console.error('❌ Error inesperado al obtener materiales:', err);
        return [];
    }
};

/**
 * Activa o desactiva el modo global de un material (solo para admin).
 */
export const toggleGlobalMaterial = async (materialId, currentValue) => {
    const { data, error } = await supabase
        .from('Materiales')
        .update({ globalMaterial: !currentValue })
        .eq('id', materialId)
        .select()
        .single();

    if (error) {
        console.error('Error toggling globalMaterial:', error);
        throw error;
    }
    return data;
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

    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(materialId);
    let query = supabase.from('Materiales').update(payload);
    
    if (isUuid) {
        query = query.eq('id', materialId);
    } else {
        query = query.eq('Nombre', updates.Nombre || materialId);
    }

    const { data, error } = await query.select().single();

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
    const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(materialId);
    let query = supabase.from('Materiales').delete();
    
    if (isUuid) {
        query = query.eq('id', materialId);
    } else {
        query = query.eq('Nombre', materialId);
    }

    const { error } = await query;

    if (error) {
        throw error;
    }
    return true;
};

/**
 * Crea varios materiales en lote (batch)
 */
export const createMaterialsBatch = async (materialsList) => {
    const payload = materialsList.map(m => ({
        ...m,
        ultima_actualizacion: new Date().toISOString()
    }));

    const { data, error } = await supabase
        .from('Materiales')
        .insert(payload)
        .select();

    if (error) {
        console.error('Error creating materials batch:', error);
        throw error;
    }
    return data;
};

export const getMaterialCategories = async () => {
    const { data } = await supabase.from('Materiales').select('categoria').not('categoria', 'is', null);
    return [...new Set((data || []).map(m => m.categoria))].sort();
};

