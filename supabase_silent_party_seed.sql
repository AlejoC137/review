-- Datos de Ejemplo v3: Silent Party - River Park 
-- Este script inserta un proyecto creativo para demostrar la versatilidad de la v3.0

-- 1. Insertar un nuevo Ciclo de Vida para Eventos (si no existe)
INSERT INTO lifecycles (id, name, description) 
VALUES ('b5e9d2f1-6c8a-4e3b-9a2d-1f7e8c9b0a1a', 'Planificación de Eventos Urbanos', 'Marco de trabajo para eventos creativos en espacios públicos.');

-- 2. Insertar las etapas (Eje X) para el evento
INSERT INTO lifecycle_stages (id, lifecycle_id, name, order_index, estimated_days) VALUES
('s1-1a', 'b5e9d2f1-6c8a-4e3b-9a2d-1f7e8c9b0a1a', 'Concepción/Idea', 0, 7),
('s1-2a', 'b5e9d2f1-6c8a-4e3b-9a2d-1f7e8c9b0a1a', 'Permisos y Legal', 1, 14),
('s1-3a', 'b5e9d2f1-6c8a-4e3b-9a2d-1f7e8c9b0a1a', 'Logística/Silent System', 2, 10),
('s1-4a', 'b5e9d2f1-6c8a-4e3b-9a2d-1f7e8c9b0a1a', 'Marketing/Venta', 3, 21),
('s1-5a', 'b5e9d2f1-6c8a-4e3b-9a2d-1f7e8c9b0a1a', 'Día del Evento', 4, 1);

-- 3. Insertar el Proyecto "Silent Party - River Park"
INSERT INTO projects (id, name, description, lifecycle_id, responsible_party, start_date, end_date)
VALUES ('p9999999-8888-7777-6666-555555555555', 'Silent Party - River Park ✨', 'Evento creativo de música con audífonos inalámbricos.', 'b5e9d2f1-6c8a-4e3b-9a2d-1f7e8c9b0a1a', 'Equipo Creativo - Antonina & Jess', '2026-05-15', '2026-06-20');

-- 4. Insertar Actividades (Bloques interactivos)
INSERT INTO activities (project_id, name, start_stage_index, end_stage_index, specificity_level, color_hex) VALUES
('p9999999-8888-7777-6666-555555555555', 'Definición de Temática Musical', 0, 0, 1, '#ec4899'),
('p9999999-8888-7777-6666-555555555555', 'Trámite Permisos (Pico de Placa)', 1, 1, 2, '#ef4444'),
('p9999999-8888-7777-6666-555555555555', 'Alquiler de Silent Headphones', 1, 2, 3, '#8b5cf6'),
('p9999999-8888-7777-6666-555555555555', 'Campaña en Redes Sociales', 3, 3, 1, '#10b981'),
('p9999999-8888-7777-6666-555555555555', 'Montaje de Luces y Sonido', 4, 4, 2, '#f59e0b');
