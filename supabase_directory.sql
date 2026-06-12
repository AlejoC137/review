-- Create table for External Directory Contacts

CREATE TABLE IF NOT EXISTS public.directory_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT,
    discipline TEXT,
    enterprise TEXT,
    phone TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_directory_contacts_project_id ON public.directory_contacts(project_id);

-- Enable RLS
ALTER TABLE public.directory_contacts ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Enable read access for all users" ON public.directory_contacts
    FOR SELECT USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.directory_contacts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update access for authenticated users" ON public.directory_contacts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete access for authenticated users" ON public.directory_contacts
    FOR DELETE USING (auth.role() = 'authenticated');

-- Function to auto-update updated_at on modification
CREATE OR REPLACE FUNCTION public.handle_directory_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
DROP TRIGGER IF EXISTS set_directory_contacts_updated_at ON public.directory_contacts;
CREATE TRIGGER set_directory_contacts_updated_at
BEFORE UPDATE ON public.directory_contacts
FOR EACH ROW
EXECUTE FUNCTION public.handle_directory_contacts_updated_at();

-- Seed data for Directory Contacts
INSERT INTO public.directory_contacts (name, role, enterprise, phone, email)
VALUES 
  ('RONALD_ARK', 'Director General', 'ARQ TVS', '+57 321 000 0000', 'ronald@ark-tvs.com'),
  ('MAURICIO_ESTRUCTURAS', 'Ingeniero Civil', 'MAU_CONSULTING', '+57 315 000 0000', 'mau@estructuras.com')
ON CONFLICT DO NOTHING;
