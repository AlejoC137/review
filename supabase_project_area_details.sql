-- Recreate project_area_details table with exact columns matching the Area Overview spreadsheet

-- Ensure the trigger function exists
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TABLE IF EXISTS public.project_area_details;

CREATE TABLE public.project_area_details (
  id uuid not null default extensions.uuid_generate_v4 (),
  project_id uuid references public.projects(id) on delete cascade,
  level_id uuid references public.project_levels(id) on delete cascade,
  context_type text not null default 'GENERAL', -- 'curaduria', 'comercial', 'constructiva', 'GENERAL'
  usage_type text, -- Room / Space name (optional)
  
  -- SUB LOTE (Dinámico)
  name text not null, -- e.g. "WITHIN NEW PLOT", "EXTENSION EXISTING PLOT"
  built_area numeric default 0,
  uncovered_area numeric default 0,
  
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  primary key (id)
);

-- Indexes for performance
CREATE INDEX idx_project_area_details_project_id ON public.project_area_details(project_id);
CREATE INDEX idx_project_area_details_level_id ON public.project_area_details(level_id);
CREATE INDEX idx_project_area_details_context ON public.project_area_details(context_type);

-- Constraint to ensure unique level+context+name per project so we don't have duplicates
ALTER TABLE public.project_area_details
ADD CONSTRAINT unique_level_context_name UNIQUE (project_id, level_id, context_type, name);

-- RLS Policies
ALTER TABLE public.project_area_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users" ON public.project_area_details FOR SELECT USING (true);
CREATE POLICY "Allow insert access to authenticated users" ON public.project_area_details FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access to authenticated users" ON public.project_area_details FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Allow delete access to authenticated users" ON public.project_area_details FOR DELETE USING (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE TRIGGER update_project_area_details_updated_at
BEFORE UPDATE ON public.project_area_details
FOR EACH ROW EXECUTE FUNCTION public.update_modified_column();
