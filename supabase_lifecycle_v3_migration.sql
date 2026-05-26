-- Migración SQL v3: Metadatos del Proyecto

-- 1. Añadir columnas de responsables y fechas al proyecto
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS responsible_party TEXT DEFAULT 'Sin asignar',
ADD COLUMN IF NOT EXISTS start_date DATE,
ADD COLUMN IF NOT EXISTS end_date DATE;

-- 2. Asegurarse de que el finished existe
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS finished TEXT DEFAULT 'active';

-- Actualizar proyecto de prueba con algunos datos
UPDATE projects 
SET responsible_party = 'Ing. Juan Pérez / Arq. María García',
    start_date = '2026-04-01',
    end_date = '2026-12-31'
WHERE id = 'a1234567-89ab-cdef-0123-456789abcdef';
