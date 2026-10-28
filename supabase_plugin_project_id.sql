-- =========================================================================
-- MIGRACIÓN: Vincular exportaciones de plugin con proyectos del sistema
-- Proyecto: review / Supabase
-- =========================================================================

-- 1. Añadir columna project_id a la tabla plugin_project_data
ALTER TABLE public.plugin_project_data 
    ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL;

-- 2. Crear índice para optimizar consultas por proyecto
CREATE INDEX IF NOT EXISTS idx_plugin_project_data_project_id 
    ON public.plugin_project_data(project_id);

-- 3. Comentarios
COMMENT ON COLUMN public.plugin_project_data.project_id IS 'ID del proyecto al que se ha asignado esta exportación del plugin';
