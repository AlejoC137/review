import { supabase } from './supabaseClient';

export const spacesService = {
    async getSpaces(subProjectId = null) {
        let query = supabase
            .from('Espacio_Elemento')
            .select('id, nombre, tipo, apellido, piso, level_id, area, area_category, subProject_id, componentes, categoria_uso')
            .order('nombre', { ascending: true });
        
        if (subProjectId) {
            query = query.eq('subProject_id', subProjectId);
        } else {
            query = query.is('subProject_id', null);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },
    async getTemplates() {
        const { data, error } = await supabase
            .from('Espacio_Elemento')
            .select('id, nombre, tipo, apellido, piso, level_id, area, area_category, componentes, categoria_uso')
            .is('subProject_id', null)
            .order('nombre', { ascending: true });
        if (error) throw error;
        return data || [];
    },
    async getBySubProject(subProjectId) {
        const { data, error } = await supabase
            .from('Espacio_Elemento')
            .select('id, nombre, tipo, apellido, piso, level_id, area, area_category, componentes, subProject_id, categoria_uso')
            .eq('subProject_id', subProjectId)
            .order('nombre', { ascending: true });
        if (error) throw error;
        return data || [];
    },
    async getSpaceDetails(espacioId) {
        const { data, error } = await supabase
            .from('Espacio_Elemento')
            .select('id, nombre, tipo, piso, level_id, area, area_category, componentes, apellido, categoria_uso')
            .eq('id', espacioId)
            .single();
        if (error) throw error;
        return data;
    },
    async updateSpace(espacioId, updates) {
        const { data, error } = await supabase
            .from('Espacio_Elemento')
            .update(updates)
            .eq('id', espacioId)
            .select();
        if (error) throw error;
        return data[0];
    },
    async createSpace(spaceData) {
        const { data, error } = await supabase
            .from('Espacio_Elemento')
            .insert([spaceData])
            .select();
        if (error) throw error;
        return data[0];
    },
    async deleteSpace(espacioId) {
        const { error } = await supabase
            .from('Espacio_Elemento')
            .delete()
            .eq('id', espacioId);
        if (error) throw error;
        return true;
    },
    async getAllSpacesAndElements(subProjectId = null) {
        let query = supabase
            .from('Espacio_Elemento')
            .select('id, nombre, tipo, apellido, piso, level_id, area, area_category, subProject_id, componentes, categoria_uso')
            .order('tipo', { ascending: true })
            .order('nombre', { ascending: true });

        if (subProjectId) {
            query = query.eq('subProject_id', subProjectId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    },
    async getProjectSpaces(projectId) {
        // First get all subProjects for this project (currently global)
        const { data: subProjs, error: subProjError } = await supabase
            .from('subProjects')
            .select('id');
        
        if (subProjError) throw subProjError;
        
        if (!subProjs || subProjs.length === 0) return [];
        
        const subProjIds = subProjs.map(sp => sp.id);
        
        // Then get all spaces for those subProjects
        const { data, error } = await supabase
            .from('Espacio_Elemento')
            .select('id, nombre, tipo, apellido, piso, level_id, area, area_category, subProject_id, componentes, categoria_uso')
            .in('subProject_id', subProjIds)
            .order('tipo', { ascending: true })
            .order('nombre', { ascending: true });

        if (error) throw error;
        return data || [];
    }
};

