-- ==========================================================
-- BIM IMPLEMENTATION PLAN - PROJECT GENERAL INFO & LOD/TDI MIGRATION
-- ==========================================================

-- 1. Extend project_general_info table with separate department, city, and additional_info fields, plus software configurations
ALTER TABLE public.project_general_info 
ADD COLUMN IF NOT EXISTS department TEXT NOT NULL DEFAULT 'Sin asignar',
ADD COLUMN IF NOT EXISTS city TEXT NOT NULL DEFAULT 'Sin asignar',
ADD COLUMN IF NOT EXISTS additional_info TEXT NOT NULL DEFAULT 'Sin asignar',
ADD COLUMN IF NOT EXISTS software_principal TEXT NOT NULL DEFAULT 'Revit',
ADD COLUMN IF NOT EXISTS version_software TEXT NOT NULL DEFAULT '2025',
ADD COLUMN IF NOT EXISTS uso_del_modelo TEXT NOT NULL DEFAULT 'Coordinación 3D, Extracción de cantidades',
ADD COLUMN IF NOT EXISTS entorno_comun_de_datos_cde TEXT NOT NULL DEFAULT 'Autodesk Construction Cloud';

-- 2. Create public.project_element_lod_tdi table
CREATE TABLE IF NOT EXISTS public.project_element_lod_tdi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    discipline TEXT NOT NULL,
    element_name TEXT NOT NULL,
    lod INTEGER NOT NULL DEFAULT 100 CHECK (lod IN (100, 200, 300, 350, 400)),
    tdi TEXT[] DEFAULT ARRAY[]::TEXT[],
    notes TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT project_element_lod_tdi_unique UNIQUE (project_id, discipline, element_name)
);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.project_element_lod_tdi ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies for project_element_lod_tdi
DROP POLICY IF EXISTS "Permitir lectura publica de lod tdi" ON public.project_element_lod_tdi;
CREATE POLICY "Permitir lectura publica de lod tdi" 
ON public.project_element_lod_tdi FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir modificacion completa a lod tdi" ON public.project_element_lod_tdi;
CREATE POLICY "Permitir modificacion completa a lod tdi" 
ON public.project_element_lod_tdi FOR ALL USING (auth.role() = 'authenticated');

-- 5. Trigger for updated_at column
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.project_element_lod_tdi;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.project_element_lod_tdi
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
