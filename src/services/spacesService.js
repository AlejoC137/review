import { supabase } from './supabaseClient';

export const spacesService = {
    async getSpaces(subProjectId = null) {
        let query = supabase
            .from('Espacio_Elemento')
            .select('id, nombre, tipo, apellido, piso, subProject_id, componentes')
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
            .select('id, nombre, tipo, apellido, piso, componentes')
            .is('subProject_id', null)
            .order('nombre', { ascending: true });
        if (error) throw error;
        return data || [];
    },
    async getBySubProject(subProjectId) {
        const { data, error } = await supabase
            .from('Espacio_Elemento')
            .select('id, nombre, tipo, apellido, piso, componentes, subProject_id')
            .eq('subProject_id', subProjectId)
            .order('nombre', { ascending: true });
        if (error) throw error;
        return data || [];
    },
    async getSpaceDetails(espacioId) {
        const { data, error } = await supabase
            .from('Espacio_Elemento')
            .select('id, nombre, tipo, piso, componentes, apellido')
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
            .select('id, nombre, tipo, apellido, piso, subProject_id, componentes')
            .order('tipo', { ascending: true })
            .order('nombre', { ascending: true });

        if (subProjectId) {
            query = query.eq('subProject_id', subProjectId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data || [];
    }
};
