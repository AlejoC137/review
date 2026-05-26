-- Create table for Information Requirements (Requisitos de Información)
-- This table stores instances of the information requirements templates for a given project.

CREATE TABLE IF NOT EXISTS public.information_requirements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    req_code TEXT NOT NULL, -- e.g. 'AIR', 'EIR', 'LOIN', 'MIDP'
    name TEXT NOT NULL,
    description TEXT,
    format_type TEXT, -- e.g. '.DOC', '.FORM'
    roles TEXT,
    category TEXT, -- 'Iniciales', 'Operativos', 'Gestión', 'Entregables Finales'
    status TEXT DEFAULT 'DRAFT', -- 'DRAFT', 'PUBLISHED', 'ARCHIVED'
    content JSONB DEFAULT '{}'::jsonb, -- Store dynamic fields or form data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure category column exists in case the table was created before this update
ALTER TABLE public.information_requirements ADD COLUMN IF NOT EXISTS category TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_info_reqs_project_id ON public.information_requirements(project_id);

-- Enable RLS
ALTER TABLE public.information_requirements ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Adjust according to your auth schema if necessary)
CREATE POLICY "Enable read access for all users" ON public.information_requirements
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.information_requirements
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.information_requirements
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.information_requirements
    FOR DELETE USING (auth.role() = 'authenticated');

-- Function to auto-update updated_at on modification
CREATE OR REPLACE FUNCTION public.handle_info_reqs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
DROP TRIGGER IF EXISTS set_info_reqs_updated_at ON public.information_requirements;
CREATE TRIGGER set_info_reqs_updated_at
BEFORE UPDATE ON public.information_requirements
FOR EACH ROW
EXECUTE FUNCTION public.handle_info_reqs_updated_at();
