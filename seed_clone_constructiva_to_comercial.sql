-- Script para duplicar todas las áreas del modelo Constructiva hacia el modelo Comercial
-- Esto te ahorra volver a ingresar todo, ya que usan exactamente el mismo desglose.

DO $$
DECLARE
    v_project_id UUID := 'a1234567-89ab-cdef-0123-456789abcdef';
BEGIN

    -- 1. Limpiar datos comerciales previos (por si se corre el script varias veces)
    DELETE FROM public.project_area_details 
    WHERE project_id = v_project_id 
      AND context_type = 'comercial';

    -- 2. Clonar exactamente todas las filas de 'constructiva' pero con contexto 'comercial'
    INSERT INTO public.project_area_details (
        project_id, 
        level_id, 
        context_type, 
        usage_type, 
        built_within_plot, 
        uncovered_within_plot, 
        built_extension_new, 
        uncovered_extension_new, 
        built_extension_refurb, 
        uncovered_extension_refurb,
        created_at,
        updated_at
    )
    SELECT 
        project_id, 
        level_id, 
        'comercial', -- Acá le cambiamos el contexto
        usage_type, 
        built_within_plot, 
        uncovered_within_plot, 
        built_extension_new, 
        uncovered_extension_new, 
        built_extension_refurb, 
        uncovered_extension_refurb,
        now(),
        now()
    FROM public.project_area_details
    WHERE project_id = v_project_id 
      AND context_type = 'constructiva';

END $$;
