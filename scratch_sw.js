require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
  const { data: sw } = await supabase.from('project_software').select('*').limit(3);
  console.log('SOFTWARE:', sw);
}
run();
