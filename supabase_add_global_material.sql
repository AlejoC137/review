-- ============================================================
-- MIGRACIÓN: Agregar columna globalMaterial a tabla Materiales
-- Permite marcar materiales como globales (visibles en todos
-- los proyectos, solo editables por admin).
-- ============================================================

ALTER TABLE public."Materiales"
  ADD COLUMN IF NOT EXISTS "globalMaterial" BOOLEAN DEFAULT FALSE NOT NULL;

-- Índice para consultas rápidas de materiales globales
CREATE INDEX IF NOT EXISTS idx_materiales_global
  ON public."Materiales"("globalMaterial")
  WHERE "globalMaterial" = TRUE;

-- Verificar
SELECT id, "Nombre", "globalMaterial" FROM public."Materiales" LIMIT 5;
