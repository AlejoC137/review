-- Create table for Project Levels (Sistema de Niveles)
CREATE TABLE IF NOT EXISTS public.project_levels (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id TEXT NOT NULL,
    nombre TEXT NOT NULL,
    elevacion TEXT,
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_project_levels_project_id ON public.project_levels(project_id);

-- Enable RLS
ALTER TABLE public.project_levels ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Enable read access for all users" ON public.project_levels
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.project_levels
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.project_levels
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.project_levels
    FOR DELETE USING (auth.role() = 'authenticated');

-- Function to auto-update updated_at on modification
CREATE OR REPLACE FUNCTION public.handle_project_levels_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
DROP TRIGGER IF EXISTS set_project_levels_updated_at ON public.project_levels;
CREATE TRIGGER set_project_levels_updated_at
BEFORE UPDATE ON public.project_levels
FOR EACH ROW
EXECUTE FUNCTION public.handle_project_levels_updated_at();

-- Seed data for Project Levels
INSERT INTO public.project_levels (project_id, nombre, elevacion, descripcion)
VALUES 
  ('kengo-kuma', 'Nivel 1', '+0.00m', 'Planta de acceso principal'),
  ('kengo-kuma', 'Nivel 2', '+4.50m', 'Planta de habitaciones estandar'),
  ('kengo-kuma', 'Sótano 1', '-3.00m', 'Parqueaderos y cuartos tecnicos')
ON CONFLICT DO NOTHING;
