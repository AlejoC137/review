-- Migración SQL v4: Filas Dinámicas en Ciclos de Vida

-- 1. Añadir columna total_rows a lifecycles
ALTER TABLE lifecycles 
ADD COLUMN IF NOT EXISTS total_rows INTEGER DEFAULT 8;

-- 2. Asegurarse de que el proyecto de prueba tenga el valor por defecto
UPDATE lifecycles 
SET total_rows = 8 
WHERE id IN (SELECT lifecycle_id FROM projects WHERE id = 'a1234567-89ab-cdef-0123-456789abcdef');
