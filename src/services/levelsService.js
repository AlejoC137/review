import { supabase } from './supabaseClient';

export const levelsService = {
    async getLevels(projectId) {
        if (!projectId) return [];
        const { data, error } = await supabase
            .from('project_levels')
            .select(`
                *,
                project_area_details (*)
            `)
            .eq('project_id', projectId)
            .order('nombre', { ascending: true });
        
        if (error) throw error;
        
        return (data || []).map(level => {
            return {
                ...level,
                sub_lotes: level.project_area_details || []
            };
        });
    },

    async createLevel(levelData) {
        const { sub_lotes, ...levelRecord } = levelData;

        const { data, error } = await supabase
            .from('project_levels')
            .insert([levelRecord])
            .select();
        
        if (error) throw error;
        const newLevel = data[0];

        if (sub_lotes && sub_lotes.length > 0) {
            const areaDetails = sub_lotes.map(lote => ({
                project_id: newLevel.project_id,
                level_id: newLevel.id,
                context_type: 'GENERAL',
                name: lote.name || 'Sin Nombre',
                built_area: parseFloat(lote.built_area) || 0,
                uncovered_area: parseFloat(lote.uncovered_area) || 0
            }));

            const { error: areaError } = await supabase
                .from('project_area_details')
                .insert(areaDetails);

            if (areaError) console.error('Error saving area details:', areaError);
        }

        return { ...newLevel, sub_lotes: sub_lotes || [] };
    },

    async updateLevel(levelId, updates) {
        const { sub_lotes, ...levelRecord } = updates;

        const { data, error } = await supabase
            .from('project_levels')
            .update(levelRecord)
            .eq('id', levelId)
            .select();
            
        if (error) throw error;
        const updatedLevel = data[0];

        // Delete existing sub_lotes for this level
        await supabase
            .from('project_area_details')
            .delete()
            .eq('level_id', levelId);

        // Insert new sub_lotes if any
        if (sub_lotes && sub_lotes.length > 0) {
            const areaDetails = sub_lotes.map(lote => ({
                project_id: updatedLevel.project_id,
                level_id: updatedLevel.id,
                context_type: 'GENERAL',
                name: lote.name || 'Sin Nombre',
                built_area: parseFloat(lote.built_area) || 0,
                uncovered_area: parseFloat(lote.uncovered_area) || 0
            }));

            await supabase
                .from('project_area_details')
                .insert(areaDetails);
        }

        return { ...updatedLevel, sub_lotes: sub_lotes || [] };
    },

    async deleteLevel(levelId) {
        const { error } = await supabase
            .from('project_levels')
            .delete()
            .eq('id', levelId);
            
        if (error) throw error;
        return true;
    }
};
