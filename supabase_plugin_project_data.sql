-- =========================================================================
-- SCRIPT DE CREACIÓN Y ACTUALIZACIÓN DE TABLA DE PRUEBAS PARA DATOS DEL PLUGIN
-- Proyecto: review2 / Supabase
-- Pestaña de administración: /fromPlugIn
-- =========================================================================

-- 1. Crear tabla plugin_project_data con todas las columnas necesarias
CREATE TABLE IF NOT EXISTS public.plugin_project_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_email TEXT NOT NULL,
    project_name TEXT,
    project_number TEXT,
    project_address TEXT,
    project_info JSONB DEFAULT '{}'::jsonb,
    site_location JSONB DEFAULT '{}'::jsonb,
    levels JSONB DEFAULT '[]'::jsonb,
    category_summary JSONB DEFAULT '{}'::jsonb,
    elements_by_id JSONB DEFAULT '{}'::jsonb,
    exported_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Asegurar que la columna project_info exista si la tabla se creó previamente
ALTER TABLE public.plugin_project_data 
    ADD COLUMN IF NOT EXISTS project_info JSONB DEFAULT '{}'::jsonb;

-- 3. Comentarios explicativos
COMMENT ON TABLE public.plugin_project_data IS 'Tabla de pruebas para almacenar los proyectos y metadata exportada desde el Plugin de Revit';
COMMENT ON COLUMN public.plugin_project_data.user_email IS 'Correo electrónico ingresado por el usuario en el plugin';
COMMENT ON COLUMN public.plugin_project_data.project_info IS 'Detalles completos de la información del proyecto (Cliente, Edificio, Autor, etc.)';
COMMENT ON COLUMN public.plugin_project_data.elements_by_id IS 'Objeto JSON con los elementos indexados por ElementId de Revit';

-- 4. Configuración de RLS (Row Level Security) permisiva para pruebas
ALTER TABLE public.plugin_project_data ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas previas si existen
DROP POLICY IF EXISTS "Allow public insert on plugin_project_data" ON public.plugin_project_data;
DROP POLICY IF EXISTS "Allow public select on plugin_project_data" ON public.plugin_project_data;
DROP POLICY IF EXISTS "Allow public delete on plugin_project_data" ON public.plugin_project_data;

-- Crear políticas permisivas para lectura, inserción y borrado en ambiente de desarrollo
CREATE POLICY "Allow public insert on plugin_project_data" 
    ON public.plugin_project_data 
    FOR INSERT 
    WITH CHECK (true);

CREATE POLICY "Allow public select on plugin_project_data" 
    ON public.plugin_project_data 
    FOR SELECT 
    USING (true);

CREATE POLICY "Allow public delete on plugin_project_data" 
    ON public.plugin_project_data 
    FOR DELETE 
    USING (true);
