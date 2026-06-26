import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('ATTENTION: Supabase is using placeholder credentials. Please create a .env file in the project root with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY. See .env.example for reference.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Intercept mutations for Demo Mode
const originalFrom = supabase.from.bind(supabase);
supabase.from = (table) => {
  const builder = originalFrom(table);
  const originalInsert = builder.insert.bind(builder);
  const originalUpdate = builder.update.bind(builder);
  const originalDelete = builder.delete.bind(builder);
  const originalUpsert = builder.upsert.bind(builder);

  const checkDemo = () => {
    if (localStorage.getItem('isDemo') === 'true') {
      alert('Esta acción está deshabilitada en el Modo Demo.');
      // Return a fake promise that rejects to stop the execution flow in the components
      throw new Error('Modo Demo Activo - Acción Deshabilitada');
    }
  };

  builder.insert = (...args) => { checkDemo(); return originalInsert(...args); };
  builder.update = (...args) => { checkDemo(); return originalUpdate(...args); };
  builder.delete = (...args) => { checkDemo(); return originalDelete(...args); };
  builder.upsert = (...args) => { checkDemo(); return originalUpsert(...args); };

  return builder;
};
