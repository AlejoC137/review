-- Migration: Add fields for parallel and concatenated actions
-- Target Table: Acciones

ALTER TABLE "public"."Acciones" 
ADD COLUMN IF NOT EXISTS "es_paralela" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "porcentaje_duracion" NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS "color_ui" TEXT DEFAULT '#3b82f6';

COMMENT ON COLUMN "public"."Acciones"."es_paralela" IS 'Indica si la acción es transversal a toda la tarea';
COMMENT ON COLUMN "public"."Acciones"."porcentaje_duracion" IS 'Porcentaje de duración relativa para acciones concatenadas';
COMMENT ON COLUMN "public"."Acciones"."color_ui" IS 'Color para visualización en el cronograma';
