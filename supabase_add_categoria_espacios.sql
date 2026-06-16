-- 1. Agregar la columna categoria_uso si no existe
ALTER TABLE public."Espacio_Elemento"
ADD COLUMN IF NOT EXISTS categoria_uso VARCHAR(100) DEFAULT 'General';

-- 2. Actualizar registros existentes que no tengan categoría
UPDATE public."Espacio_Elemento"
SET categoria_uso = 'General'
WHERE categoria_uso IS NULL;

-- 3. Insertar catálogo masivo de espacios y elementos (Plantillas Globales, "subProject_id" IS NULL)
-- Usamos ON CONFLICT DO NOTHING o insertamos directamente si generamos UUIDs nuevos.
-- Para asegurar, usamos UUIDs aleatorios o gen_random_uuid().

INSERT INTO public."Espacio_Elemento" (id, nombre, tipo, categoria_uso, componentes, "subProject_id") VALUES
-- RESIDENCIAL
(gen_random_uuid(), 'Sala de Estar', 'Espacio', 'Residencial', '[]', NULL),
(gen_random_uuid(), 'Comedor', 'Espacio', 'Residencial', '[]', NULL),
(gen_random_uuid(), 'Cocina Principal', 'Espacio', 'Residencial', '[]', NULL),
(gen_random_uuid(), 'Dormitorio Principal', 'Espacio', 'Residencial', '[]', NULL),
(gen_random_uuid(), 'Dormitorio Secundario', 'Espacio', 'Residencial', '[]', NULL),
(gen_random_uuid(), 'Baño Principal', 'Espacio', 'Residencial', '[]', NULL),
(gen_random_uuid(), 'Baño de Visitas', 'Espacio', 'Residencial', '[]', NULL),
(gen_random_uuid(), 'Vestidor (Walk-in Closet)', 'Espacio', 'Residencial', '[]', NULL),
(gen_random_uuid(), 'Zona de Ropas / Lavandería', 'Espacio', 'Residencial', '[]', NULL),
(gen_random_uuid(), 'Terraza / Balcón', 'Espacio', 'Residencial', '[]', NULL),
(gen_random_uuid(), 'Estudio / Biblioteca', 'Espacio', 'Residencial', '[]', NULL),
(gen_random_uuid(), 'Garaje', 'Espacio', 'Residencial', '[]', NULL),
(gen_random_uuid(), 'Sótano', 'Espacio', 'Residencial', '[]', NULL),
(gen_random_uuid(), 'Ático', 'Espacio', 'Residencial', '[]', NULL),

-- COMERCIAL / OFICINAS
(gen_random_uuid(), 'Recepción', 'Espacio', 'Comercial/Oficinas', '[]', NULL),
(gen_random_uuid(), 'Sala de Juntas', 'Espacio', 'Comercial/Oficinas', '[]', NULL),
(gen_random_uuid(), 'Oficina Privada', 'Espacio', 'Comercial/Oficinas', '[]', NULL),
(gen_random_uuid(), 'Espacio de Coworking (Open Plan)', 'Espacio', 'Comercial/Oficinas', '[]', NULL),
(gen_random_uuid(), 'Cubículo', 'Espacio', 'Comercial/Oficinas', '[]', NULL),
(gen_random_uuid(), 'Área de Descanso (Break Room)', 'Espacio', 'Comercial/Oficinas', '[]', NULL),
(gen_random_uuid(), 'Cuarto de Servidores (Data Center)', 'Espacio', 'Comercial/Oficinas', '[]', NULL),
(gen_random_uuid(), 'Baños Públicos (Hombres)', 'Espacio', 'Comercial/Oficinas', '[]', NULL),
(gen_random_uuid(), 'Baños Públicos (Mujeres)', 'Espacio', 'Comercial/Oficinas', '[]', NULL),
(gen_random_uuid(), 'Local Comercial', 'Espacio', 'Comercial/Oficinas', '[]', NULL),
(gen_random_uuid(), 'Bodega de Almacenamiento', 'Espacio', 'Comercial/Oficinas', '[]', NULL),

-- INDUSTRIAL / FÁBRICAS
(gen_random_uuid(), 'Planta de Producción', 'Espacio', 'Industrial/Fábricas', '[]', NULL),
(gen_random_uuid(), 'Línea de Ensamblaje', 'Espacio', 'Industrial/Fábricas', '[]', NULL),
(gen_random_uuid(), 'Almacén de Materia Prima', 'Espacio', 'Industrial/Fábricas', '[]', NULL),
(gen_random_uuid(), 'Almacén de Producto Terminado', 'Espacio', 'Industrial/Fábricas', '[]', NULL),
(gen_random_uuid(), 'Zona de Carga y Descarga', 'Espacio', 'Industrial/Fábricas', '[]', NULL),
(gen_random_uuid(), 'Cuarto de Máquinas', 'Espacio', 'Industrial/Fábricas', '[]', NULL),
(gen_random_uuid(), 'Cuarto Eléctrico', 'Espacio', 'Industrial/Fábricas', '[]', NULL),
(gen_random_uuid(), 'Cuarto de Calderas', 'Espacio', 'Industrial/Fábricas', '[]', NULL),
(gen_random_uuid(), 'Vestuarios Industriales', 'Espacio', 'Industrial/Fábricas', '[]', NULL),
(gen_random_uuid(), 'Comedor Industrial', 'Espacio', 'Industrial/Fábricas', '[]', NULL),

-- CIENTÍFICO / LABORATORIOS
(gen_random_uuid(), 'Laboratorio Químico', 'Espacio', 'Científico/Laboratorios', '[]', NULL),
(gen_random_uuid(), 'Laboratorio Biológico (BSL)', 'Espacio', 'Científico/Laboratorios', '[]', NULL),
(gen_random_uuid(), 'Laboratorio de Física', 'Espacio', 'Científico/Laboratorios', '[]', NULL),
(gen_random_uuid(), 'Cuarto Limpio (Clean Room)', 'Espacio', 'Científico/Laboratorios', '[]', NULL),
(gen_random_uuid(), 'Área de Preparación de Muestras', 'Espacio', 'Científico/Laboratorios', '[]', NULL),
(gen_random_uuid(), 'Almacén de Reactivos', 'Espacio', 'Científico/Laboratorios', '[]', NULL),
(gen_random_uuid(), 'Cuarto de Balanzas', 'Espacio', 'Científico/Laboratorios', '[]', NULL),
(gen_random_uuid(), 'Zona de Lavado y Esterilización', 'Espacio', 'Científico/Laboratorios', '[]', NULL),

-- EDUCACIONAL
(gen_random_uuid(), 'Aula de Clases', 'Espacio', 'Educacional', '[]', NULL),
(gen_random_uuid(), 'Auditorio', 'Espacio', 'Educacional', '[]', NULL),
(gen_random_uuid(), 'Biblioteca Educativa', 'Espacio', 'Educacional', '[]', NULL),
(gen_random_uuid(), 'Laboratorio Escolar', 'Espacio', 'Educacional', '[]', NULL),
(gen_random_uuid(), 'Cancha Deportiva / Gimnasio', 'Espacio', 'Educacional', '[]', NULL),
(gen_random_uuid(), 'Oficina de Profesores', 'Espacio', 'Educacional', '[]', NULL),
(gen_random_uuid(), 'Cafetería Estudiantil', 'Espacio', 'Educacional', '[]', NULL),

-- SALUD / HOSPITALARIO
(gen_random_uuid(), 'Habitación de Pacientes', 'Espacio', 'Salud/Hospitalario', '[]', NULL),
(gen_random_uuid(), 'Quirófano', 'Espacio', 'Salud/Hospitalario', '[]', NULL),
(gen_random_uuid(), 'Sala de Triage', 'Espacio', 'Salud/Hospitalario', '[]', NULL),
(gen_random_uuid(), 'Consultorio Médico', 'Espacio', 'Salud/Hospitalario', '[]', NULL),
(gen_random_uuid(), 'Estación de Enfermería', 'Espacio', 'Salud/Hospitalario', '[]', NULL),
(gen_random_uuid(), 'Sala de Rayos X', 'Espacio', 'Salud/Hospitalario', '[]', NULL),
(gen_random_uuid(), 'Sala de Resonancia Magnética (MRI)', 'Espacio', 'Salud/Hospitalario', '[]', NULL),
(gen_random_uuid(), 'Unidad de Cuidados Intensivos (UCI)', 'Espacio', 'Salud/Hospitalario', '[]', NULL),

-- EXTERIORES / URBANISMO
(gen_random_uuid(), 'Jardín Paisajístico', 'Espacio', 'Exteriores/Urbanismo', '[]', NULL),
(gen_random_uuid(), 'Plaza Pública', 'Espacio', 'Exteriores/Urbanismo', '[]', NULL),
(gen_random_uuid(), 'Estacionamiento Descubierto', 'Espacio', 'Exteriores/Urbanismo', '[]', NULL),
(gen_random_uuid(), 'Aceras y Caminos', 'Espacio', 'Exteriores/Urbanismo', '[]', NULL),

-- ELEMENTOS ARQUITECTÓNICOS GLOBALES (Categorizados)
(gen_random_uuid(), 'Muro Cortina', 'Elemento', 'General', '[]', NULL),
(gen_random_uuid(), 'Columna Estructural', 'Elemento', 'General', '[]', NULL),
(gen_random_uuid(), 'Viga Estructural', 'Elemento', 'General', '[]', NULL),
(gen_random_uuid(), 'Cielo Raso / Plafón', 'Elemento', 'General', '[]', NULL),
(gen_random_uuid(), 'Puerta Principal', 'Elemento', 'Residencial', '[]', NULL),
(gen_random_uuid(), 'Puerta de Emergencia', 'Elemento', 'Comercial/Oficinas', '[]', NULL),
(gen_random_uuid(), 'Ventana Panorámica', 'Elemento', 'General', '[]', NULL),
(gen_random_uuid(), 'Escalera Principal', 'Elemento', 'General', '[]', NULL),
(gen_random_uuid(), 'Escalera de Emergencia', 'Elemento', 'General', '[]', NULL),
(gen_random_uuid(), 'Ascensor', 'Elemento', 'General', '[]', NULL),
(gen_random_uuid(), 'Montacargas', 'Elemento', 'Industrial/Fábricas', '[]', NULL),
(gen_random_uuid(), 'Mesón de Trabajo', 'Elemento', 'Científico/Laboratorios', '[]', NULL),
(gen_random_uuid(), 'Campana Extractora', 'Elemento', 'Científico/Laboratorios', '[]', NULL),
(gen_random_uuid(), 'Mueble de Recepción', 'Elemento', 'Comercial/Oficinas', '[]', NULL),
(gen_random_uuid(), 'Rack de Servidores', 'Elemento', 'Comercial/Oficinas', '[]', NULL);
