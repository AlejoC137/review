-- ==============================================================
-- PRE-BEP CONFIGURACIÓN DE PÁGINAS / ENCUADRE
-- Guarda la cantidad y alto de cada página del Pre-BEP
-- por proyecto. Opcionalmente vinculado a un usuario.
-- ==============================================================

-- 1. Crear la tabla pre_bep_config
CREATE TABLE IF NOT EXISTS public.pre_bep_config (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Referencia al proyecto (slug o UUID en texto)
  project_id    TEXT NOT NULL,

  -- Referencia al usuario autenticado (nullable = configuración global)
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Array de alturas en mm para cada página (e.g. [278.8, 278.8, 200.0])
  page_heights  FLOAT8[] NOT NULL DEFAULT '{278.8, 278.8, 278.8, 278.8, 278.8}'::float8[],

  -- Metadatos de auditoría
  created_at    TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at    TIMESTAMPTZ DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- NOTA IMPORTANTE sobre UNIQUE con NULL en PostgreSQL:
-- En SQL estándar, NULL ≠ NULL, así que una columna UNIQUE nullable
-- permite múltiples filas con NULL. Usamos índices parciales en su lugar.

-- Eliminar constraint antigua si existe
ALTER TABLE public.pre_bep_config
  DROP CONSTRAINT IF EXISTS pre_bep_config_project_user_unique;

-- Índice único para filas CON usuario (evita duplicados por usuario)
DROP INDEX IF EXISTS idx_pre_bep_config_project_user;
CREATE UNIQUE INDEX idx_pre_bep_config_project_user
  ON public.pre_bep_config(project_id, user_id)
  WHERE user_id IS NOT NULL;

-- Índice único para filas SIN usuario (una sola config global por proyecto)
DROP INDEX IF EXISTS idx_pre_bep_config_project_no_user;
CREATE UNIQUE INDEX idx_pre_bep_config_project_no_user
  ON public.pre_bep_config(project_id)
  WHERE user_id IS NULL;

-- Índice de rendimiento general
CREATE INDEX IF NOT EXISTS idx_pre_bep_config_project_id
  ON public.pre_bep_config(project_id);

-- 2. Habilitar Seguridad a Nivel de Fila (RLS)
ALTER TABLE public.pre_bep_config ENABLE ROW LEVEL SECURITY;

-- 3. Políticas RLS
-- SELECT: cualquier usuario puede leer (anónimo o autenticado)
DROP POLICY IF EXISTS "pre_bep_config_select" ON public.pre_bep_config;
CREATE POLICY "pre_bep_config_select"
  ON public.pre_bep_config FOR SELECT
  USING (true);

-- INSERT: cualquier usuario puede insertar (anónimo o autenticado)
-- Necesario para guardar config sin login obligatorio
DROP POLICY IF EXISTS "pre_bep_config_insert" ON public.pre_bep_config;
CREATE POLICY "pre_bep_config_insert"
  ON public.pre_bep_config FOR INSERT
  WITH CHECK (true);

-- UPDATE: cualquier usuario puede actualizar
DROP POLICY IF EXISTS "pre_bep_config_update" ON public.pre_bep_config;
CREATE POLICY "pre_bep_config_update"
  ON public.pre_bep_config FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- DELETE: cualquier usuario puede eliminar
DROP POLICY IF EXISTS "pre_bep_config_delete" ON public.pre_bep_config;
CREATE POLICY "pre_bep_config_delete"
  ON public.pre_bep_config FOR DELETE
  USING (true);

-- 4. Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_pre_bep_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pre_bep_config_updated_at ON public.pre_bep_config;
CREATE TRIGGER pre_bep_config_updated_at
  BEFORE UPDATE ON public.pre_bep_config
  FOR EACH ROW EXECUTE FUNCTION public.update_pre_bep_config_updated_at();

-- ==============================================================
-- DIAGNÓSTICO: Ejecuta esto para verificar que la tabla funciona
-- ==============================================================
-- SELECT * FROM public.pre_bep_config LIMIT 10;
-- SELECT COUNT(*) FROM public.pre_bep_config;

-- ==============================================================
-- INSTRUCCIONES:
-- 1. Ejecuta ESTE SCRIPT COMPLETO en Supabase > SQL Editor
--    https://supabase.com/dashboard/project/irkrljhfbtnjspyvrapa/sql
-- 2. Si la tabla ya existe, el script la modifica sin borrar datos.
-- 3. RLS está en modo abierto (permite anónimos) para que funcione
--    aunque el usuario no esté logueado en la app.
-- ==============================================================
