-- Create table if it doesn't exist (in case it wasn't there before)
CREATE TABLE IF NOT EXISTS public.specialties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add abbreviation column
ALTER TABLE public.specialties ADD COLUMN IF NOT EXISTS abbreviation VARCHAR(10);

-- Add project_id column
ALTER TABLE public.specialties ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- Add responsible_name column
ALTER TABLE public.specialties ADD COLUMN IF NOT EXISTS responsible_name VARCHAR(255);
