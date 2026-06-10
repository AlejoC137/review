import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://irkrljhfbtnjspyvrapa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlya3JsamhmYnRuanNweXZyYXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTI3OTEsImV4cCI6MjA4OTg4ODc5MX0.c_Rd0hc11NRXX3aWYOODhU-e5GjGcoxobJQbBOc6LOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase
    .from('marketing_materials')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error:', error);
    return;
  }

  console.log(JSON.stringify(data, null, 2));
}

check();
