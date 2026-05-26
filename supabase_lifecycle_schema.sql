-- Script para crear la estructura de base de datos para los ciclos de vida y actividades (Gantt Cartesiano)

-- 1. Tabla de Ciclos de Vida (Plantillas que agrupan las etapas y actividades)
CREATE TABLE lifecycles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en lifecycles
ALTER TABLE lifecycles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on lifecycles" ON lifecycles
    FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users on lifecycles" ON lifecycles
    FOR ALL USING (auth.role() = 'authenticated');


-- 2. Tabla de Etapas del Ciclo de Vida (El Eje X - ej: Planeación, Modelado)
CREATE TABLE lifecycle_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lifecycle_id UUID NOT NULL REFERENCES lifecycles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    order_index INTEGER NOT NULL, -- El order de izquierda a derecha (0, 1, 2...)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en lifecycle_stages
ALTER TABLE lifecycle_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on lifecycle_stages" ON lifecycle_stages
    FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users on lifecycle_stages" ON lifecycle_stages
    FOR ALL USING (auth.role() = 'authenticated');


-- 3. Modificación o creación base de Proyectos (Si no existe, sino adaptarlo en la app)
-- Si ya existe 'projects', solo necesitamos asegurarnos de que tengan lifecycle_id.
-- Crearemos una tabla 'projects' simple para el diagrama. Si ya tienes una,
-- bastará con añadirle la columna 'lifecycle_id' referenciando lifecycles(id).
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    lifecycle_id UUID REFERENCES lifecycles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on projects" ON projects
    FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users on projects" ON projects
    FOR ALL USING (auth.role() = 'authenticated');


-- 4. Tabla de Actividades (Los bloques/rectángulos interactivos)
CREATE TABLE activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE, -- La actividad pertenece a un proyecto
    name TEXT NOT NULL,
    start_stage_index INTEGER NOT NULL DEFAULT 0, -- Índice de etapa inicio (Eje X)
    end_stage_index INTEGER NOT NULL DEFAULT 0,   -- Índice de etapa final (Eje X)
    specificity_level INTEGER NOT NULL DEFAULT 1, -- Nivel de especificidad (Eje Y)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS en activities
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users on activities" ON activities
    FOR SELECT USING (true);
CREATE POLICY "Enable all access for authenticated users on activities" ON activities
    FOR ALL USING (auth.role() = 'authenticated');


-------------------------------------------------------------------------
-- Datos de Semilla (Seed Data) para propósitos de la DEMO/Preview
-------------------------------------------------------------------------
-- Insertar un ciclo de vida demo
INSERT INTO lifecycles (id, name, description) 
VALUES ('c3b4a20b-04f7-4a0d-be94-1a92da6f0b81', 'Ciclo de Vida BIM Integral', 'Etapas estándar para un proyecto BIM según marcos de trabajo comunes.');

-- Insertar las etapas (Plano X)
INSERT INTO lifecycle_stages (id, lifecycle_id, name, order_index) VALUES
('e8e0cc0a-6d65-4f32-8494-cf5dcd8db671', 'c3b4a20b-04f7-4a0d-be94-1a92da6f0b81', 'Planeación', 0),
('d9dbaf98-8e6d-4959-99bb-9c3f4ce8e001', 'c3b4a20b-04f7-4a0d-be94-1a92da6f0b81', 'Diseño', 1),
('1b80db26-7c37-4c75-ba7e-a0e28f7fcb18', 'c3b4a20b-04f7-4a0d-be94-1a92da6f0b81', 'Modelado', 2),
('6c30df05-591e-4503-ac8b-b1eb21379eb4', 'c3b4a20b-04f7-4a0d-be94-1a92da6f0b81', 'Construcción', 3),
('96e6d764-13fd-44b4-a2b1-5f257dff66a0', 'c3b4a20b-04f7-4a0d-be94-1a92da6f0b81', 'Operación', 4);

-- Insertar un proyecto de prueba
INSERT INTO projects (id, name, description, lifecycle_id)
VALUES ('a1234567-89ab-cdef-0123-456789abcdef', 'Torre Empresarial Alpha', 'Proyecto piloto BIM nivel 2', 'c3b4a20b-04f7-4a0d-be94-1a92da6f0b81');

-- Insertar actividades por defecto (nuestros rectángulos iniciales de prueba)
INSERT INTO activities (project_id, name, start_stage_index, end_stage_index, specificity_level) VALUES
('a1234567-89ab-cdef-0123-456789abcdef', 'Nomenclatura (Elementos no estructurales)', 0, 2, 1),
('a1234567-89ab-cdef-0123-456789abcdef', 'Estudio de Suelos y Topografía', 0, 0, 2),
('a1234567-89ab-cdef-0123-456789abcdef', 'Diseño Estructural (LOD 300)', 1, 2, 3),
('a1234567-89ab-cdef-0123-456789abcdef', 'Simulación 4D de Obra Seca', 2, 3, 2),
('a1234567-89ab-cdef-0123-456789abcdef', 'Mantenimiento Preventivo Modelo AS-BUILT', 4, 4, 1);
