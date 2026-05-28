-- Create project_units table
CREATE TABLE IF NOT EXISTS public.project_units (
  project_id uuid REFERENCES public.projects(id) ON DELETE CASCADE PRIMARY KEY,
  length_unit text DEFAULT 'Metros (m)',
  length_precision integer DEFAULT 2,
  area_unit text DEFAULT 'Metros cuadrados (m2)',
  area_precision integer DEFAULT 2,
  volume_unit text DEFAULT 'Metros cúbicos (m3)',
  volume_precision integer DEFAULT 2,
  angle_unit text DEFAULT 'Grados (°)',
  angle_precision integer DEFAULT 1,
  slope_unit text DEFAULT 'Porcentaje (%)',
  slope_precision integer DEFAULT 1,
  mep_exceptions boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.project_units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to all users" ON public.project_units FOR SELECT USING (true);
CREATE POLICY "Allow insert access to authenticated users" ON public.project_units FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Allow update access to authenticated users" ON public.project_units FOR UPDATE USING (auth.role() = 'authenticated');
