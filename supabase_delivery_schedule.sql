-- Create table for Delivery Schedule (Cronograma de Entregas)

CREATE TABLE IF NOT EXISTS public.project_delivery_schedule (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    entregable_bim TEXT,
    responsable TEXT,
    fase TEXT,
    fecha DATE,
    observaciones TEXT,
    formato TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.project_delivery_schedule ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Assuming users can view and edit if they are authenticated, similar to other project modules.
-- Adjust policies if there's a specific role system in place (like bep_team or admin only).

CREATE POLICY "Users can view delivery schedule for projects"
    ON public.project_delivery_schedule FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert delivery schedule"
    ON public.project_delivery_schedule FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update delivery schedule"
    ON public.project_delivery_schedule FOR UPDATE
    USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete delivery schedule"
    ON public.project_delivery_schedule FOR DELETE
    USING (auth.role() = 'authenticated');


