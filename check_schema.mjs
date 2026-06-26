import { supabase } from './src/services/supabaseClient.js';

async function checkSchema() {
    const { data, error } = await supabase.from('user_profiles').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        if (data && data.length > 0) {
            console.log('Columns in user_profiles:');
            console.log(Object.keys(data[0]));
        } else {
            console.log('No data found in user_profiles to infer columns.');
        }
    }
}

checkSchema();
