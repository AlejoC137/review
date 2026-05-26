-- SOLUCIÓN CORREGIDA: Nombres de tablas entre comillas
-- El error indica que tus tablas se llaman "Tareas" y "Acciones" (con Mayúscula).
-- En PostgreSQL, si usas mayúsculas, DEBES ponerlas entre comillas dobles.

-- 1. Agregar columna para TAREAS
ALTER TABLE public."Tareas" 
ADD COLUMN IF NOT EXISTS evidence_url text;

-- 2. Agregar columna para ACCIONES
ALTER TABLE public."Acciones"
ADD COLUMN IF NOT EXISTS evidence_url text;

-- 3. Refrescar la caché
NOTIFY pgrst, 'reload config';
