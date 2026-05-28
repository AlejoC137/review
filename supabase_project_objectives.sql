-- TABLA: project_objectives
CREATE TABLE public.project_objectives (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  prioridad integer NOT NULL DEFAULT 1,
  descripcion text NOT NULL,
  usos_potenciales text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT project_objectives_pkey PRIMARY KEY (id),
  CONSTRAINT project_objectives_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects (id) ON DELETE CASCADE
);

-- TABLA: project_bim_uses
CREATE TABLE public.project_bim_uses (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  valor text NOT NULL DEFAULT 'ALTO', -- ALTO, MEDIO, BAJO
  uso text NOT NULL,
  descripcion text NOT NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT project_bim_uses_pkey PRIMARY KEY (id),
  CONSTRAINT project_bim_uses_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects (id) ON DELETE CASCADE
);

-- Políticas RLS para project_objectives
ALTER TABLE public.project_objectives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.project_objectives FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.project_objectives FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.project_objectives FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.project_objectives FOR DELETE USING (true);

-- Políticas RLS para project_bim_uses
ALTER TABLE public.project_bim_uses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.project_bim_uses FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.project_bim_uses FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.project_bim_uses FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.project_bim_uses FOR DELETE USING (true);
