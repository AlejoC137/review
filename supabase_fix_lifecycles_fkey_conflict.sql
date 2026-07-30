-- ============================================================
-- FIX URGENTE: Eliminar FK constraints ambiguas en lifecycles
-- y lifecycle_stages que causaban el error PGRST201.
--
-- El problema: projects.lifecycle_id → lifecycles.id (ya existía)
-- + la nueva lifecycles.project_id → projects.id
-- creaban DOS rutas entre projects y lifecycles, y PostgREST
-- no podía resolver el embed automático.
--
-- Solución: Quitar el FK constraint de lifecycles.project_id y
-- lifecycle_stages.project_id (mantener las columnas para filtrar,
-- pero sin la referencia formal que confunde a PostgREST).
-- ============================================================

-- 1. Quitar FK constraint de lifecycles.project_id
ALTER TABLE public.lifecycles
  DROP CONSTRAINT IF EXISTS lifecycles_project_id_fkey;

-- 2. Quitar FK constraint de lifecycle_stages.project_id
ALTER TABLE public.lifecycle_stages
  DROP CONSTRAINT IF EXISTS lifecycle_stages_project_id_fkey;

-- Las columnas project_id permanecen para poder filtrar por proyecto,
-- pero ya no tienen una referencia formal de FK que cause ambigüedad.
-- Los índices de rendimiento también se mantienen.

-- Verificar que los constraints fueron eliminados:
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f'
  AND (conrelid = 'public.lifecycles'::regclass OR conrelid = 'public.lifecycle_stages'::regclass);
