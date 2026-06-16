-- Crear tabla project_element_lod_tdi que reemplaza a Componentes
CREATE TABLE IF NOT EXISTS public.project_element_lod_tdi (
  id uuid not null default gen_random_uuid (),
  project_id uuid null, -- Opcional para soportar catálogo global si no hay proyecto
  discipline text not null default 'Arquitectura',
  element_name text not null,
  lod integer not null default 100,
  tdi text[] null default array[]::text[],
  notes text null default ''::text,
  
  -- Propiedades migradas de la antigua tabla Componentes
  acabado text null,
  construccion text null,
  descripcion text null,
  
  -- Sistema de Niveles
  nivel_id uuid null REFERENCES public.project_levels(id) ON DELETE SET NULL,

  created_at timestamp with time zone not null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone ('utc'::text, now()),
  
  constraint project_element_lod_tdi_pkey primary key (id),
  constraint project_element_lod_tdi_unique unique (project_id, discipline, element_name),
  constraint project_element_lod_tdi_project_id_fkey foreign KEY (project_id) references projects (id) on delete CASCADE,
  constraint project_element_lod_tdi_lod_check check ((lod = any (array[100, 200, 300, 350, 400])))
) TABLESPACE pg_default;

-- Activar RLS
ALTER TABLE public.project_element_lod_tdi ENABLE ROW LEVEL SECURITY;

-- Politicas basicas
CREATE POLICY "Permitir lectura publica" 
ON public.project_element_lod_tdi FOR SELECT USING (true);

CREATE POLICY "Permitir modificacion a usuarios autenticados" 
ON public.project_element_lod_tdi FOR ALL USING (auth.role() = 'authenticated');

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.project_element_lod_tdi;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.project_element_lod_tdi
FOR EACH ROW
EXECUTE FUNCTION handle_updated_at();

-- (Opcional) Migrar datos si la tabla Componentes todavía existe
-- DO $$
-- BEGIN
--    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'Componentes') THEN
--        INSERT INTO public.project_element_lod_tdi (id, element_name, acabado, construccion, descripcion)
--        SELECT 
--            -- Si el id antiguo era un UUID válido lo usamos, sino generamos uno
--            (CASE WHEN id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN id::uuid ELSE gen_random_uuid() END),
--            nombre, 
--            acabado, 
--            construccion, 
--            descripcion
--        FROM public."Componentes"
--        ON CONFLICT DO NOTHING;
--    END IF;
-- END $$;
