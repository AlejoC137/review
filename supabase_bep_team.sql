-- ==========================================================
-- PLAN DE EJECUCIÓN BIM (PEB) - EQUIPO Y RESPONSABILIDADES
-- ==========================================================

-- 1. Crear la tabla bep_team
CREATE TABLE IF NOT EXISTS public.bep_team (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  organization TEXT NOT NULL,
  responsibilities TEXT NOT NULL,
  bim_uses TEXT DEFAULT '',
  lod_tdi TEXT DEFAULT '',
  cde_collaboration TEXT DEFAULT '',
  staff_ids UUID[] DEFAULT '{}'::uuid[],
  created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  CONSTRAINT bep_team_project_role_unique UNIQUE (project_id, role_name)
);

-- 1.1 Asegurar que las columnas existen si la tabla ya había sido creada previamente
ALTER TABLE public.bep_team ADD COLUMN IF NOT EXISTS bim_uses TEXT DEFAULT '';
ALTER TABLE public.bep_team ADD COLUMN IF NOT EXISTS lod_tdi TEXT DEFAULT '';
ALTER TABLE public.bep_team ADD COLUMN IF NOT EXISTS cde_collaboration TEXT DEFAULT '';

-- 2. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.bep_team ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas RLS
DROP POLICY IF EXISTS "Enable read access for all users" ON public.bep_team;
CREATE POLICY "Enable read access for all users" 
  ON public.bep_team FOR SELECT 
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.bep_team;
CREATE POLICY "Enable insert for authenticated users only" 
  ON public.bep_team FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.bep_team;
CREATE POLICY "Enable update for authenticated users only" 
  ON public.bep_team FOR UPDATE 
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.bep_team;
CREATE POLICY "Enable delete for authenticated users only" 
  ON public.bep_team FOR DELETE 
  USING (auth.role() = 'authenticated');

-- 4. Crear índice de rendimiento por project_id
CREATE INDEX IF NOT EXISTS idx_bep_team_project_id ON public.bep_team(project_id);

-- 5. Insertar datos semilla (Seed) para el proyecto 'click clack agora' (ID: a1234567-89ab-cdef-0123-456789abcdef)
DO $$
DECLARE
    proj_id UUID;
    natalia_id UUID := '80000000-0000-0000-0000-000000000001';
    daniel_id UUID := '80000000-0000-0000-0000-000000000002';
    jorge_id UUID := '80000000-0000-0000-0000-000000000003';
BEGIN
    -- Intentar obtener el ID del proyecto Click Clack
    SELECT id INTO proj_id FROM public.projects WHERE id = 'a1234567-89ab-cdef-0123-456789abcdef' OR name ILIKE '%click clack%' LIMIT 1;
    
    -- Si no existe, usamos el primer proyecto disponible en la tabla
    IF proj_id IS NULL THEN
        SELECT id INTO proj_id FROM public.projects LIMIT 1;
    END IF;

    -- Si hay algún proyecto en la base de datos, insertamos los datos semilla
    IF proj_id IS NOT NULL THEN
        -- Insertar integrantes iniciales del staff si no existen
        INSERT INTO public.staff (id, name, role_description, email, color)
        VALUES 
            (natalia_id, 'Natalia Ruiz', 'Gerencia (Grupo Attia)', 'natalia.ruiz@attia.com', '#e11d48'),
            (daniel_id, 'Daniel Castro', 'Dirección (Grupo Attia)', 'daniel.castro@attia.com', '#ea580c'),
            (jorge_id, 'Jorge Preciado', 'Coordinador del Proyecto y BIM Manager (Bioclimática)', 'jorge.preciado@bioclimatica.com', '#0f4369')
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            role_description = EXCLUDED.role_description,
            email = EXCLUDED.email,
            color = EXCLUDED.color;

        -- Insertar los roles del PEB vinculados al proyecto
        -- Gerencia y Dirección del Proyecto
        INSERT INTO public.bep_team (project_id, role_name, organization, responsibilities, bim_uses, lod_tdi, cde_collaboration, staff_ids)
        VALUES (
            proj_id, 
            'Gerencia y Dirección del Proyecto', 
            'Grupo Attia', 
            'Encabezados por el Grupo Attia (con figuras como Natalia Ruiz y Daniel Castro), son responsables de la comunicación directa con el promotor y la interventoría. Definen el alcance, tiempo y costos, planifican los recursos, y supervisan el avance general y la calidad de los entregables.', 
            'Supervisión de costos (Uso 5D), planificación macro y control de entregables clave.',
            'Valida que los entregables cumplan con el LOD contractual antes de ser aprobados.',
            'Acceso de Lectura/Validación en la carpeta SHARED y PUBLICABLES de Autodesk Construction Cloud.',
            ARRAY[natalia_id, daniel_id]
        ) ON CONFLICT (project_id, role_name) DO UPDATE SET
            organization = EXCLUDED.organization,
            responsibilities = EXCLUDED.responsibilities,
            bim_uses = EXCLUDED.bim_uses,
            lod_tdi = EXCLUDED.lod_tdi,
            cde_collaboration = EXCLUDED.cde_collaboration,
            staff_ids = EXCLUDED.staff_ids;

        -- Coordinador del Proyecto y BIM Manager
        INSERT INTO public.bep_team (project_id, role_name, organization, responsibilities, bim_uses, lod_tdi, cde_collaboration, staff_ids)
        VALUES (
            proj_id, 
            'Coordinador del Proyecto y BIM Manager', 
            'Bioclimática', 
            'Liderado por Jorge Preciado (de la empresa Bioclimática), este rol es el motor de la estrategia tecnológica. Sus responsabilidades incluyen proponer y hacer cumplir el PEB, gestionar los perfiles de acceso a la información y liderar la coordinación técnica.', 
            'Lidera la definición del PEB, gestiona perfiles de modelado y dirige la integración multidisciplinaria.',
            'Define las exigencias de LOD (ej. LOD 200 a 300) y las plantillas TDI para cada disciplina.',
            'Administrador del Entorno Común de Datos (CDE). Valida y aprueba la promoción de archivos.',
            ARRAY[jorge_id]
        ) ON CONFLICT (project_id, role_name) DO UPDATE SET
            organization = EXCLUDED.organization,
            responsibilities = EXCLUDED.responsibilities,
            bim_uses = EXCLUDED.bim_uses,
            lod_tdi = EXCLUDED.lod_tdi,
            cde_collaboration = EXCLUDED.cde_collaboration,
            staff_ids = EXCLUDED.staff_ids;

        -- Coordinador BIM
        INSERT INTO public.bep_team (project_id, role_name, organization, responsibilities, bim_uses, lod_tdi, cde_collaboration, staff_ids)
        VALUES (
            proj_id, 
            'Coordinador BIM', 
            'Bioclimática / Interno', 
            'Trabaja de la mano con el BIM Manager para llevar a cabo el control de calidad. Su tarea principal es revisar la correcta parametrización, cruzar los modelos para prever conflictos (detección de interferencias), conciliar soluciones entre disciplinas y auditar la calidad de los entregables de los modeladores.', 
            'Coordinación 3D en Navisworks. Detección de interferencias y conciliación espacial.',
            'Auditor de datos: valida que los modelos alcancen el LOD requerido y contengan los campos TDI correctos.',
            'Revisa, audita y promueve los archivos desde TRABAJO EN PROGRESO (WIP) a la carpeta de COMPARTIDOS.',
            '{}'::uuid[]
        ) ON CONFLICT (project_id, role_name) DO UPDATE SET
            organization = EXCLUDED.organization,
            responsibilities = EXCLUDED.responsibilities,
            bim_uses = EXCLUDED.bim_uses,
            lod_tdi = EXCLUDED.lod_tdi,
            cde_collaboration = EXCLUDED.cde_collaboration,
            staff_ids = EXCLUDED.staff_ids;

        -- Especialistas BIM (Diseñadores/Modeladores)
        INSERT INTO public.bep_team (project_id, role_name, organization, responsibilities, bim_uses, lod_tdi, cde_collaboration, staff_ids)
        VALUES (
            proj_id, 
            'Especialistas BIM (Diseñadores/Modeladores)', 
            'PLAN B (Arq.), Click Clack Equipo Creativo (Int.), CNI Ingenieros (Est.)', 
            'Responsables técnicos de su respectiva disciplina. Encargados de modelar la geometría y los datos, así como de realizar chequeos de calidad internos antes de entregar la información.', 
            'Desarrollo de modelos tridimensionales (Uso 3D) y extracción de cantidades de obra (Uso 5D).',
            'Operativamente responsable de modelar la geometría con el LOD exigido y llenar los TDI (A a la O).',
            'Crea, edita y publica información exclusivamente en su carpeta dedicada de TRABAJO EN PROGRESO (WIP).',
            '{}'::uuid[]
        ) ON CONFLICT (project_id, role_name) DO UPDATE SET
            organization = EXCLUDED.organization,
            responsibilities = EXCLUDED.responsibilities,
            bim_uses = EXCLUDED.bim_uses,
            lod_tdi = EXCLUDED.lod_tdi,
            cde_collaboration = EXCLUDED.cde_collaboration,
            staff_ids = EXCLUDED.staff_ids;

        -- Interventoría
        INSERT INTO public.bep_team (project_id, role_name, organization, responsibilities, bim_uses, lod_tdi, cde_collaboration, staff_ids)
        VALUES (
            proj_id, 
            'Interventoría', 
            'Interventoría Externa', 
            'Actúa como supervisor externo para asegurar que se cumplan los requerimientos del cliente, gestionando la comunicación con la gerencia y aprobando cambios en el proyecto.', 
            'Supervisión y control externo de estándares de calidad solicitados por el cliente.',
            'Revisa y audita reportes de cumplimiento de LOD e interferencias.',
            'Acceso de Auditoría y Lectura general en las carpetas COMPARTIDOS y PUBLICABLES.',
            '{}'::uuid[]
        ) ON CONFLICT (project_id, role_name) DO UPDATE SET
            organization = EXCLUDED.organization,
            responsibilities = EXCLUDED.responsibilities,
            bim_uses = EXCLUDED.bim_uses,
            lod_tdi = EXCLUDED.lod_tdi,
            cde_collaboration = EXCLUDED.cde_collaboration,
            staff_ids = EXCLUDED.staff_ids;
    END IF;
END $$;
