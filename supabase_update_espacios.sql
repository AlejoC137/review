-- Agregar nuevas columnas a Espacio_Elemento para áreas y niveles
ALTER TABLE public."Espacio_Elemento"
ADD COLUMN IF NOT EXISTS level_id UUID REFERENCES public.project_levels(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS area NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS area_category TEXT DEFAULT 'Construida'; -- 'Construida' o 'Descubierta'

-- Crear índice para la columna level_id
CREATE INDEX IF NOT EXISTS idx_espacio_elemento_level_id ON public."Espacio_Elemento"(level_id);
