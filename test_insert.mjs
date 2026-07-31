import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://irkrljhfbtnjspyvrapa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlya3JsamhmYnRuanNweXZyYXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTI3OTEsImV4cCI6MjA4OTg4ODc5MX0.c_Rd0hc11NRXX3aWYOODhU-e5GjGcoxobJQbBOc6LOE';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase
    .from('project_element_lod_tdi')
    .upsert({
      project_id: '123e4567-e89b-12d3-a456-426614174000',
      discipline: 'Test',
      element_name: 'Test Element',
      lod: 100,
      tdi: [],
      notes: ''
    }, { onConflict: 'project_id,discipline,element_name' });
    
  console.log('Result:', { data, error });
}

test();
