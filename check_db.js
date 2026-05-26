import { supabase } from './src/services/supabaseClient.js';

async function checkTables() {
    const tables = ['Espacio_Elemento', 'Componentes', 'subProjects', 'tasks'];
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ Table ${table} does not exist or error:`, error.message);
        } else {
            console.log(`✅ Table ${table} exists.`);
        }
    }
}

checkTables();
