import { supabase } from './supabaseClient';

export const componentsService = {
    async getComponents() {
        const { data, error } = await supabase
            .from('Componentes')
            .select('*')
            .order('nombre', { ascending: true });
        if (error) throw error;
        return data || [];
    },
    async getSpaceComponents(spaceId) {
        const { data, error } = await supabase
            .from('Espacio_Elemento')
            .select('*, componente:Componentes(*)')
            .eq('espacio_id', spaceId);
        if (error) throw error;
        return data || [];
    },
    async createComponent(componentData) {
        const { data, error } = await supabase
            .from('Componentes')
            .insert([componentData])
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    async updateComponent(componentId, updates) {
        const { data, error } = await supabase
            .from('Componentes')
            .update(updates)
            .eq('id', componentId)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    async deleteComponent(componentId) {
        const { error } = await supabase
            .from('Componentes')
            .delete()
            .eq('id', componentId);
        if (error) throw error;
        return true;
    }
};
