-- Migración SQL para el Ciclo de Vida v2.0 (Interactividad Ampliada)

-- 1. Añadir columna de días estimados para cada etapa
ALTER TABLE lifecycle_stages 
ADD COLUMN IF NOT EXISTS estimated_days INTEGER DEFAULT 14; 

-- 2. Añadir color para personalización de actividades (rectángulos)
ALTER TABLE activities 
ADD COLUMN IF NOT EXISTS color_hex TEXT DEFAULT '#3b82f6';

-- 3. Función auxiliar para actualizar proyectos (si hace falta)
-- Añadir campos de metadatos adicionales si se requiere.
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS finished TEXT DEFAULT 'active';

-- Actualizar datos de prueba con algunos colores y días
UPDATE lifecycle_stages SET estimated_days = 10 WHERE name = 'Planeación';
UPDATE lifecycle_stages SET estimated_days = 20 WHERE name = 'Diseño';
UPDATE lifecycle_stages SET estimated_days = 45 WHERE name = 'Modelado';
UPDATE lifecycle_stages SET estimated_days = 60 WHERE name = 'Construcción';
UPDATE lifecycle_stages SET estimated_days = 30 WHERE name = 'Operación';

UPDATE activities SET color_hex = '#10b981' WHERE name ILIKE '%Nomenclatura%';
UPDATE activities SET color_hex = '#f59e0b' WHERE name ILIKE '%Suelos%';
UPDATE activities SET color_hex = '#ef4444' WHERE name ILIKE '%Estructural%';
UPDATE activities SET color_hex = '#8b5cf6' WHERE name ILIKE '%Simulación%';
