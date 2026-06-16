-- Migration script to add new columns to project_levels for hierarchy, indexing, areas and sub-unit links

ALTER TABLE public.project_levels
  ADD COLUMN IF NOT EXISTS indice INTEGER,
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.project_levels(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS areas_generales TEXT,
  ADD COLUMN IF NOT EXISTS sub_unidad_id TEXT;

-- Add indexes for the new relationships to improve performance
CREATE INDEX IF NOT EXISTS idx_project_levels_parent_id ON public.project_levels(parent_id);
CREATE INDEX IF NOT EXISTS idx_project_levels_sub_unidad_id ON public.project_levels(sub_unidad_id);
