-- ============================================================
-- MIGRACIÓN SUPABASE: AGREGAR project_id A TABLAS CLAVE
-- Permite que cada tabla aísle su información por proyecto.
-- Ejecutar en Supabase → SQL Editor.
-- ============================================================

-- ──────────────────────────────────────────────────────────
-- 1. TABLA staff (Personal)
--    Permite filtrar el personal por proyecto activo.
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.staff
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_staff_project_id ON public.staff(project_id);

-- ──────────────────────────────────────────────────────────
-- 2. TABLA subProjects (Subproyectos / Fases)
-- ──────────────────────────────────────────────────────────
ALTER TABLE public."subProjects"
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_subprojects_project_id ON public."subProjects"(project_id);

-- ──────────────────────────────────────────────────────────
-- 3. TABLA specialties (Especialidades técnicas)
--    NULL = global/compartida entre proyectos.
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.specialties
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_specialties_project_id ON public.specialties(project_id);

-- ──────────────────────────────────────────────────────────
-- 4. TABLA roles (Catálogo de Roles)
--    NULL = rol global disponible en todos los proyectos.
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.roles
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_roles_project_id ON public.roles(project_id);

-- ──────────────────────────────────────────────────────────
-- 5. TABLA Materiales (Base de Datos de Materiales)
--    NULL = material global de biblioteca.
-- ──────────────────────────────────────────────────────────
ALTER TABLE public."Materiales"
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_materiales_project_id ON public."Materiales"(project_id);

-- ──────────────────────────────────────────────────────────
-- 6. TABLA esquemas (Ecosistemas / Esquemas BIM)
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.esquemas
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_esquemas_project_id ON public.esquemas(project_id);

-- ──────────────────────────────────────────────────────────
-- 7. TABLA bim_plans (Planes de Implementación BIM)
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.bim_plans
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_bim_plans_project_id ON public.bim_plans(project_id);

-- ──────────────────────────────────────────────────────────
-- 8. TABLA lifecycles (Ciclos de Vida)
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.lifecycles
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_lifecycles_project_id ON public.lifecycles(project_id);

-- ──────────────────────────────────────────────────────────
-- 9. TABLA lifecycle_stages (Etapas de Ciclo de Vida)
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.lifecycle_stages
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_lifecycle_stages_project_id ON public.lifecycle_stages(project_id);

-- ──────────────────────────────────────────────────────────
-- 10. TABLA actions (Sub-Tareas / Acciones de Control)
--     Añadir project_id directo para evitar JOINs costosos.
-- ──────────────────────────────────────────────────────────
ALTER TABLE public.actions
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_actions_project_id ON public.actions(project_id);

-- ============================================================
-- ASIGNACIÓN AUTOMÁTICA DE project_id A REGISTROS HUÉRFANOS
-- Asigna el primer proyecto encontrado a los registros que
-- tienen project_id = NULL, evitando que queden invisibles
-- tras la migración.
-- NOTA: Si prefieres mantener registros globales (NULL),
--       comenta o elimina este bloque DO.
-- ============================================================
DO $$
DECLARE
    default_proj_id UUID;
BEGIN
    -- Obtener el primer proyecto disponible
    SELECT id INTO default_proj_id FROM public.projects ORDER BY created_at ASC LIMIT 1;

    IF default_proj_id IS NOT NULL THEN
        -- Staff: asignar proyecto por defecto si no tienen uno
        UPDATE public.staff
          SET project_id = default_proj_id
          WHERE project_id IS NULL;

        -- subProjects: asignar proyecto por defecto
        UPDATE public."subProjects"
          SET project_id = default_proj_id
          WHERE project_id IS NULL;

        -- esquemas: asignar proyecto por defecto
        UPDATE public.esquemas
          SET project_id = default_proj_id
          WHERE project_id IS NULL;

        -- lifecycles: asignar proyecto por defecto
        UPDATE public.lifecycles
          SET project_id = default_proj_id
          WHERE project_id IS NULL;

        -- lifecycle_stages: asignar proyecto por defecto
        UPDATE public.lifecycle_stages
          SET project_id = default_proj_id
          WHERE project_id IS NULL;

        -- bim_plans: asignar proyecto por defecto
        UPDATE public.bim_plans
          SET project_id = default_proj_id
          WHERE project_id IS NULL;

        -- actions: propagar project_id desde la tarea padre
        UPDATE public.actions a
          SET project_id = t.project_id
          FROM public.tasks t
          WHERE a.task_id = t.id
            AND a.project_id IS NULL
            AND t.project_id IS NOT NULL;

        RAISE NOTICE 'Migración completada. project_id asignado usando el proyecto: %', default_proj_id;
    ELSE
        RAISE NOTICE 'No se encontró ningún proyecto en la base de datos. Los registros permanecen sin project_id.';
    END IF;
END $$;
