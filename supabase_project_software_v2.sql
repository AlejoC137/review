-- ==========================================================
-- ADD FORMATOS AND POLITICA_VERSION TO PROJECT_SOFTWARE
-- ==========================================================

-- Add formatos column
ALTER TABLE public.project_software 
ADD COLUMN IF NOT EXISTS formatos TEXT;

-- Add politica_version column
ALTER TABLE public.project_software 
ADD COLUMN IF NOT EXISTS politica_version TEXT;
