import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://irkrljhfbtnjspyvrapa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlya3JsamhmYnRuanNweXZyYXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTI3OTEsImV4cCI6MjA4OTg4ODc5MX0.c_Rd0hc11NRXX3aWYOODhU-e5GjGcoxobJQbBOc6LOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('specialties').select('*').limit(1);
  if (error) {
    console.error("Query error:", error);
  } else {
    console.log("Data keys:", data.length > 0 ? Object.keys(data[0]) : 'Empty table');
  }

  // Also let's try the query to see the error
  const { error: queryError } = await supabase.from('specialties').select('*').or('project_id.is.null').limit(1);
  if (queryError) {
    console.error("Project_id query error:", queryError);
  } else {
    console.log("project_id query succeeded!");
  }
}
check();
