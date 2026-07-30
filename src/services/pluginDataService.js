import { supabase } from './supabaseClient';

export const pluginDataService = {
  // Obtener todas las exportaciones recibidas desde el plugin
  async getAllPluginExports() {
    const { data, error } = await supabase
      .from('plugin_project_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error al obtener datos del plugin:', error);
      throw error;
    }
    return data || [];
  },

  // Eliminar un registro de prueba
  async deleteExport(id) {
    const { data, error } = await supabase
      .from('plugin_project_data')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error al eliminar registro:', error);
      throw error;
    }
    return data;
  },

  // Vaciar toda la tabla de pruebas
  async clearAllExports() {
    const { data, error } = await supabase
      .from('plugin_project_data')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

    if (error) {
      console.error('Error al limpiar registros:', error);
      throw error;
    }
    return data;
  }
};
