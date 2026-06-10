import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://irkrljhfbtnjspyvrapa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlya3JsamhmYnRuanNweXZyYXBhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzMTI3OTEsImV4cCI6MjA4OTg4ODc5MX0.c_Rd0hc11NRXX3aWYOODhU-e5GjGcoxobJQbBOc6LOE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const { data: materials, error: fetchError } = await supabase
    .from('marketing_materials')
    .select('*')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error('Fetch Error:', fetchError);
    return;
  }

  if (!materials || materials.length === 0) {
    console.log('No materials found');
    return;
  }

  const material = materials[0];
  let updated = false;

  const newElements = material.data.sides.A.elements.map(el => {
    if (el.type === 'image' && el.id === 'n7ok1hxga') {
      updated = true;
      return {
        ...el,
        x: 40,
        y: 20,
        width: 120,
        height: 163,
        objectFit: 'contain',
        locked: false
      };
    }
    return el;
  });

  if (updated) {
    const newData = {
      ...material.data,
      sides: {
        ...material.data.sides,
        A: {
          ...material.data.sides.A,
          elements: newElements
        }
      }
    };

    const { error: updateError } = await supabase
      .from('marketing_materials')
      .update({ data: newData })
      .eq('id', material.id);

    if (updateError) {
      console.error('Update Error:', updateError);
    } else {
      console.log('Successfully fixed the DB!');
    }
  } else {
    console.log('Image element not found');
  }
}

fix();
