import { supabase } from './supabaseClient';

export const componentsService = {
    async getComponents() {
        const { data, error } = await supabase
            .from('Catalogo_Componentes')
            .select('*')
            .order('categoria_revit', { ascending: true })
            .order('subcomponente', { ascending: true });
        if (error) throw error;
        return data || [];
    },
    async getSpaceComponents(spaceId) {
        const { data, error } = await supabase
            .from('Espacio_Elemento')
            .select('*, componente:project_element_lod_tdi(*)')
            .eq('espacio_id', spaceId);
        if (error) throw error;
        return data || [];
    },
    async createComponent(componentData) {
        const { data, error } = await supabase
            .from('project_element_lod_tdi')
            .insert([componentData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    async updateComponent(componentId, updates) {
        const { data, error } = await supabase
            .from('project_element_lod_tdi')
            .update(updates)
            .eq('id', componentId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    async deleteComponent(componentId) {
        const { error } = await supabase
            .from('project_element_lod_tdi')
            .delete()
            .eq('id', componentId);
        if (error) throw error;
        return true;
    }
};
