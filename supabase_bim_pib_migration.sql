-- ==========================================================
-- BIM IMPLEMENTATION PLAN (PIB) - DATABASE MIGRATION
-- ==========================================================

-- 1. Ensure project_id column exists in esquemas table
-- This allows linking specific Mind Maps to Lifecycle Projects
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'esquemas' AND column_name = 'project_id'
    ) THEN
        ALTER TABLE public.esquemas ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;
        COMMENT ON COLUMN public.esquemas.project_id IS 'Link to the project this BIM implementation plan belongs to';
    END IF;
END $$;

-- 2. Initialize map_data with a compliant BIM structure for empty schemas
-- This ensures the recursive explorer doesn't crash on null/empty objects
UPDATE public.esquemas 
SET map_data = '{
    "id": "root_pib", 
    "name": "BIM Implementation Plan", 
    "type": "folder", 
    "isBranchExpanded": true,
    "children": [
        {
            "id": "node_wip",
            "name": "01_WIP (Work In Progress)",
            "type": "folder",
            "children": []
        },
        {
            "id": "node_shared",
            "name": "02_SHARED",
            "type": "folder",
            "children": []
        },
        {
            "id": "node_published",
            "name": "03_PUBLISHED",
            "type": "folder",
            "children": []
        },
         {
            "id": "node_archived",
            "name": "04_ARCHIVED",
            "type": "folder",
            "children": []
        }
    ]
}'::jsonb
WHERE map_data = '{}'::jsonb OR map_data IS NULL;

-- 3. Verify RLS (Row Level Security)
-- Ensure authenticated users can update their schemas
ALTER TABLE public.esquemas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.esquemas;
CREATE POLICY "Enable update for authenticated users only" 
ON public.esquemas 
FOR UPDATE 
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_esquemas_project_id ON public.esquemas(project_id);
