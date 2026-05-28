-- ==========================================================
-- BIM PROJECT SOFTWARE & PLATFORMS - TABLE CREATION
-- Supports multiple software entries per project
-- ==========================================================

-- 1. Create project_software table
CREATE TABLE IF NOT EXISTS public.project_software (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    software_principal TEXT NOT NULL DEFAULT 'Revit',
    version_software TEXT NOT NULL DEFAULT '2025',
    uso_del_modelo TEXT NOT NULL DEFAULT 'Coordinación 3D',
    entorno_comun_de_datos_cde TEXT NOT NULL DEFAULT 'Autodesk Construction Cloud',
    es_software_primario BOOLEAN DEFAULT false,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.project_software ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
DROP POLICY IF EXISTS "Permitir lectura publica de software" ON public.project_software;
CREATE POLICY "Permitir lectura publica de software"
ON public.project_software FOR SELECT USING (true);

DROP POLICY IF EXISTS "Permitir modificacion completa a software" ON public.project_software;
CREATE POLICY "Permitir modificacion completa a software"
ON public.project_software FOR ALL USING (auth.role() = 'authenticated');

-- 4. Trigger for updated_at
CREATE OR REPLACE FUNCTION public.handle_project_software_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_project_software_updated_at ON public.project_software;
CREATE TRIGGER set_project_software_updated_at
    BEFORE UPDATE ON public.project_software
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_project_software_updated_at();

-- 5. Seed data: Insert default softwares for the Click Clack project if it exists
DO $$
DECLARE
    v_project_id UUID;
BEGIN
    SELECT id INTO v_project_id FROM public.projects WHERE name ILIKE '%Click Clack%' LIMIT 1;

    IF v_project_id IS NOT NULL THEN
        INSERT INTO public.project_software
            (project_id, software_principal, version_software, uso_del_modelo, entorno_comun_de_datos_cde, es_software_primario, orden)
        VALUES
            (v_project_id, 'Revit', '2025', 'Coordinación 3D, Extracción de cantidades, Modelado BIM', 'Autodesk Construction Cloud', true, 0),
            (v_project_id, 'Navisworks Manage', '2025', 'Detección de conflictos (Clash Detection), Coordinación multidisciplinar', 'Autodesk Construction Cloud', false, 1),
            (v_project_id, 'AutoCAD', '2025', 'Producción de planos técnicos 2D, detalles constructivos', 'Autodesk Construction Cloud', false, 2),
            (v_project_id, 'Dynamo', '2.18', 'Automatización de modelado, scripting paramétrico', 'N/A', false, 3)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
