-- =========================================================================
-- SCRIPT DE ACTUALIZACIÓN DE TABLA PARA SINCRONIZACIÓN
-- Proyecto: review / Supabase
-- Añade columnas faltantes para el exportador completo de Revit
-- =========================================================================

-- Asegurar que las nuevas columnas existan en plugin_project_data
ALTER TABLE public.plugin_project_data 
    ADD COLUMN IF NOT EXISTS materials JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS rooms JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS schedules JSONB DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS sheets_and_views JSONB DEFAULT '{}'::jsonb,
    ADD COLUMN IF NOT EXISTS interactive_3d_scene JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.plugin_project_data.materials IS 'Lista de materiales exportados desde Revit';
COMMENT ON COLUMN public.plugin_project_data.rooms IS 'Lista de habitaciones (rooms) exportadas desde Revit';
COMMENT ON COLUMN public.plugin_project_data.schedules IS 'Tablas de planificación exportadas desde Revit';
COMMENT ON COLUMN public.plugin_project_data.sheets_and_views IS 'Planos y vistas exportados desde Revit';
COMMENT ON COLUMN public.plugin_project_data.interactive_3d_scene IS 'Escena 3D web estilizada exportada desde Revit';
