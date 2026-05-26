-- Tipo de dato personalizado para asegurar la integridad de los estados permitidos
CREATE TYPE public.module_status AS ENUM ('locked', 'in_progress', 'completed');

-- Crear tabla de progreso del usuario
CREATE TABLE public.user_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module_id TEXT NOT NULL,
  finished public.module_status NOT NULL DEFAULT 'locked',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Restricción única para que el UPSERT (onConflict) en el frontend funcione correctamente
  UNIQUE(user_id, module_id)
);

-- Habilitar Políticas de Seguridad a Nivel de Fila (Row Level Security - RLS)
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;

-- Política 1: Los usuarios solo pueden ver (SELECT) su propio progreso
CREATE POLICY "Los usuarios pueden ver su propio progreso" 
ON public.user_progress FOR SELECT 
USING (auth.uid() = user_id);

-- Política 2: Los usuarios solo pueden insertar (INSERT) su propio progreso
CREATE POLICY "Los usuarios pueden insertar su propio progreso" 
ON public.user_progress FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Política 3: Los usuarios solo pueden actualizar (UPDATE) su propio progreso
CREATE POLICY "Los usuarios pueden actualizar su propio progreso" 
ON public.user_progress FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Tabla para almacenar los Esquemas BIM (Mind Maps interactivos)
CREATE TABLE public.esquemas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  map_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.esquemas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.esquemas FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.esquemas FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users only" ON public.esquemas FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.esquemas FOR DELETE USING (auth.role() = 'authenticated');
-- Tabla de unión bidireccional entre Nodos de Esquemas y Módulos
CREATE TABLE public.esquema_nodes_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  esquema_id UUID NOT NULL REFERENCES public.esquemas(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(esquema_id, node_id, module_id)
);

ALTER TABLE public.esquema_nodes_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.esquema_nodes_modules FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.esquema_nodes_modules FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.esquema_nodes_modules FOR DELETE USING (auth.role() = 'authenticated');

-- Tabla de unión bidireccional entre Nodos de Esquemas y Recursos
CREATE TABLE public.esquema_nodes_resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  esquema_id UUID NOT NULL REFERENCES public.esquemas(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL,
  resource_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(esquema_id, node_id, resource_id)
);

ALTER TABLE public.esquema_nodes_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.esquema_nodes_resources FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users only" ON public.esquema_nodes_resources FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users only" ON public.esquema_nodes_resources FOR DELETE USING (auth.role() = 'authenticated');