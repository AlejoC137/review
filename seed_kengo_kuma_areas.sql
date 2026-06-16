-- Script para poblar las áreas del proyecto (Ágora / Kengo Kuma)
-- REEMPLAZAR 'a1234567-...' CON EL ID REAL DE TU PROYECTO

DO $$
DECLARE
    v_project_id UUID := 'a1234567-89ab-cdef-0123-456789abcdef';
    
    -- Variables para los IDs de los niveles principales
    v_b4_id UUID := extensions.uuid_generate_v4();
    v_b3_id UUID := extensions.uuid_generate_v4();
    v_b2_id UUID := extensions.uuid_generate_v4();
    v_b1_id UUID := extensions.uuid_generate_v4();
    v_f1_id UUID := extensions.uuid_generate_v4();
    v_f2_id UUID := extensions.uuid_generate_v4();
    v_f3_id UUID := extensions.uuid_generate_v4();
    v_f4_id UUID := extensions.uuid_generate_v4();
    v_f5_id UUID := extensions.uuid_generate_v4();
    v_f6_id UUID := extensions.uuid_generate_v4();
    v_f7_id UUID := extensions.uuid_generate_v4();
    v_f8_id UUID := extensions.uuid_generate_v4();
    v_rooftop_id UUID := extensions.uuid_generate_v4();
    
    -- Subniveles
    v_sub_id UUID;
BEGIN

    -- 1. CREACIÓN DE NIVELES PRINCIPALES
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES
    (v_b4_id, v_project_id, 'BASEMENT 4', -4, null),
    (v_b3_id, v_project_id, 'BASEMENT 3', -3, null),
    (v_b2_id, v_project_id, 'BASEMENT 2', -2, null),
    (v_b1_id, v_project_id, 'BASEMENT 1', -1, null),
    (v_f1_id, v_project_id, 'FLOOR 1', 1, null),
    (v_f2_id, v_project_id, 'FLOOR 2', 2, null),
    (v_f3_id, v_project_id, 'FLOOR 3', 3, null),
    (v_f4_id, v_project_id, 'FLOOR 4', 4, null),
    (v_f5_id, v_project_id, 'FLOOR 5', 5, null),
    (v_f6_id, v_project_id, 'FLOOR 6', 6, null),
    (v_f7_id, v_project_id, 'FLOOR 7', 7, null),
    (v_f8_id, v_project_id, 'FLOOR 8', 8, null),
    (v_rooftop_id, v_project_id, 'ROOFTOP', 9, null);

    INSERT INTO public.project_area_details (project_id, level_id, context_type, name, built_area, uncovered_area) VALUES
    (v_project_id, v_b4_id, 'GENERAL', 'WITHIN NEW PLOT', 116.0, 0),
    (v_project_id, v_b3_id, 'GENERAL', 'WITHIN NEW PLOT', 426.0, 0),
    (v_project_id, v_b3_id, 'GENERAL', 'EXTENSION EXISTING PLOT', 124.0, 0),
    (v_project_id, v_b2_id, 'GENERAL', 'WITHIN NEW PLOT', 251.0, 0),
    (v_project_id, v_b2_id, 'GENERAL', 'EXTENSION EXISTING PLOT', 94.0, 0),
    (v_project_id, v_b1_id, 'GENERAL', 'WITHIN NEW PLOT', 408.0, 0),
    (v_project_id, v_b1_id, 'GENERAL', 'EXTENSION EXISTING PLOT', 87.0, 0),
    (v_project_id, v_b1_id, 'GENERAL', 'EXTENSION EXISTING PLOT - REFURBISHMENT', 57.0, 0),
    (v_project_id, v_f1_id, 'GENERAL', 'WITHIN NEW PLOT', 521.0, 152.0),
    (v_project_id, v_f1_id, 'GENERAL', 'EXTENSION EXISTING PLOT', 13.0, 123.0),
    (v_project_id, v_f1_id, 'GENERAL', 'EXTENSION EXISTING PLOT - REFURBISHMENT', 62.0, 145.0),
    (v_project_id, v_f2_id, 'GENERAL', 'WITHIN NEW PLOT', 325.0, 98.0),
    (v_project_id, v_f2_id, 'GENERAL', 'EXTENSION EXISTING PLOT', 102.0, 0),
    (v_project_id, v_f2_id, 'GENERAL', 'EXTENSION EXISTING PLOT - REFURBISHMENT', 4.0, 77.0),
    (v_project_id, v_f3_id, 'GENERAL', 'WITHIN NEW PLOT', 271.0, 0),
    (v_project_id, v_f4_id, 'GENERAL', 'WITHIN NEW PLOT', 222.0, 0),
    (v_project_id, v_f5_id, 'GENERAL', 'WITHIN NEW PLOT', 173.0, 0),
    (v_project_id, v_f6_id, 'GENERAL', 'WITHIN NEW PLOT', 172.0, 0),
    (v_project_id, v_f7_id, 'GENERAL', 'WITHIN NEW PLOT', 158.0, 0),
    (v_project_id, v_f7_id, 'GENERAL', 'EXTENSION EXISTING PLOT', 13.0, 0),
    (v_project_id, v_f8_id, 'GENERAL', 'WITHIN NEW PLOT', 158.0, 0),
    (v_project_id, v_rooftop_id, 'GENERAL', 'WITHIN NEW PLOT', 148.0, 0),
    (v_project_id, v_rooftop_id, 'GENERAL', 'EXTENSION EXISTING PLOT', 16.0, 0);

    -- 2. CREACIÓN DE SUBNIVELES (Espacios) Y SUS ÁREAS (Modelo Constructiva)

    -- ==================== BASEMENT 4 ====================
    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Fire Protection Water tank', 1, v_b4_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Technical floor', 'WITHIN NEW PLOT', 46, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Water Supply Water tank', 2, v_b4_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Technical floor', 'WITHIN NEW PLOT', 49, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Lift Pit', 3, v_b4_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Technical floor', 'WITHIN NEW PLOT', 20, 0);

    -- ==================== BASEMENT 3 ====================
    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Lobby', 1, v_b3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'EXTENSION EXISTING PLOT', 38, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Bar', 2, v_b3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 10, 0);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'EXTENSION EXISTING PLOT', 44, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Stage + Seating', 3, v_b3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 212, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Backstage', 4, v_b3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 76, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Restrooms W/M', 5, v_b3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 45, 0);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'EXTENSION EXISTING PLOT', 24, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Green Room', 6, v_b3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 13, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation (service lift)', 7, v_b3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 29, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 2', 8, v_b3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 24, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 3', 9, v_b3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 18, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 4', 10, v_b3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'EXTENSION EXISTING PLOT', 17, 0);

    -- ==================== BASEMENT 2 ====================
    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Lobby', 1, v_b2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 3, 0);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'EXTENSION EXISTING PLOT', 19, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'VIP', 2, v_b2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 48, 0);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'EXTENSION EXISTING PLOT', 68, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Restrooms W/M', 3, v_b2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 42, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Storage', 4, v_b2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 79, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Technical for show', 5, v_b2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 13, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation (service lift)', 6, v_b2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 16, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 2', 7, v_b2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 33, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 3', 8, v_b2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'WITHIN NEW PLOT', 18, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 4', 9, v_b2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Black box theatre', 'EXTENSION EXISTING PLOT', 8, 0);

    -- ==================== BASEMENT 1 ====================
    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Lobby commercial area', 1, v_b1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Speak Easy / Tea room', 'WITHIN NEW PLOT', 3, 0);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Speak Easy / Tea room', 'EXTENSION EXISTING PLOT', 18, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Tea room', 2, v_b1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Speak Easy / Tea room', 'WITHIN NEW PLOT', 20, 0);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Speak Easy / Tea room', 'EXTENSION EXISTING PLOT', 63, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Speak Easy', 3, v_b1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Speak Easy / Tea room', 'WITHIN NEW PLOT', 215, 0);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Speak Easy / Tea room', 'EXTENSION EXISTING PLOT', 1, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Shadow Garden', 4, v_b1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Speak Easy / Tea room', 'WITHIN NEW PLOT', 54, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Restrooms W/M', 5, v_b1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Speak Easy / Tea room', 'EXTENSION EXISTING PLOT - REFURBISHMENT', 57, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Power plant', 6, v_b1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Technical area', 'WITHIN NEW PLOT', 21, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Technical circulation', 7, v_b1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Technical area', 'WITHIN NEW PLOT', 6, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Garbage room', 8, v_b1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Technical area', 'WITHIN NEW PLOT', 7, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Telecomunications', 9, v_b1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Technical area', 'WITHIN NEW PLOT', 10, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Hot water', 10, v_b1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Technical area', 'WITHIN NEW PLOT', 11, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation (service lift)', 11, v_b1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Speak Easy / Tea room', 'WITHIN NEW PLOT', 5, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 2', 12, v_b1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Speak Easy / Tea room', 'WITHIN NEW PLOT', 39, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 3', 13, v_b1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Speak Easy / Tea room', 'WITHIN NEW PLOT', 18, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 4', 14, v_b1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Speak Easy / Tea room', 'EXTENSION EXISTING PLOT', 6, 0);

    -- ==================== FLOOR 1 ====================
    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Covered stage', 1, v_f1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'WITHIN NEW PLOT', 151, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Bleachers', 2, v_f1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'WITHIN NEW PLOT', 150, 0);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'EXTENSION EXISTING PLOT', 49, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Kitchen', 3, v_f1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'EXTENSION EXISTING PLOT - REFURBISHMENT', 33, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Outdoor passage (urbanism)', 4, v_f1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'WITHIN NEW PLOT', 0, 152);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'EXTENSION EXISTING PLOT', 0, 74);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'EXTENSION EXISTING PLOT - REFURBISHMENT', 0, 145);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Electric Substation', 5, v_f1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'WITHIN NEW PLOT', 27, 0);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'EXTENSION EXISTING PLOT - REFURBISHMENT', 20, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation (service lift)', 6, v_f1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'WITHIN NEW PLOT', 3, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 2', 7, v_f1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'WITHIN NEW PLOT', 90, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 3', 8, v_f1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'WITHIN NEW PLOT', 22, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 4', 9, v_f1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'EXTENSION EXISTING PLOT', 13, 0);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'EXTENSION EXISTING PLOT - REFURBISHMENT', 9, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 5', 10, v_f1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'WITHIN NEW PLOT', 20, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 6', 11, v_f1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'WITHIN NEW PLOT', 16, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation 7', 12, v_f1_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Covered stage', 'WITHIN NEW PLOT', 43, 0);

    -- ==================== FLOOR 2 ====================
    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 1', 1, v_f2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 36, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 2', 2, v_f2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 36, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 3', 3, v_f2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 57, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 4', 4, v_f2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 47, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'open air stage', 5, v_f2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Open air stage', 'WITHIN NEW PLOT', 46, 98);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Open air stage', 'EXTENSION EXISTING PLOT', 102, 0);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Open air stage', 'EXTENSION EXISTING PLOT - REFURBISHMENT', 4, 77);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Storage', 6, v_f2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 9, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation', 7, v_f2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 64, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Circulation', 8, v_f2_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 30, 0);

    -- ==================== FLOOR 3 ====================
    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 5', 1, v_f3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 32, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 6', 2, v_f3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 77, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 7', 3, v_f3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 87, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Storage', 4, v_f3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 11, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation', 5, v_f3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 28, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Circulation', 6, v_f3_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 35, 0);

    -- ==================== FLOOR 4 ====================
    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 8', 1, v_f4_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 98, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 9', 2, v_f4_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 67, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Storage', 3, v_f4_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 7, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation', 4, v_f4_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 29, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Circulation', 5, v_f4_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 21, 0);

    -- ==================== FLOOR 5 ====================
    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 10', 1, v_f5_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 56, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 11', 2, v_f5_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 59, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation', 3, v_f5_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 35, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Circulation', 4, v_f5_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 23, 0);

    -- ==================== FLOOR 6 ====================
    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 12', 1, v_f6_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 52, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 13', 2, v_f6_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 61, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation', 3, v_f6_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 35, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Circulation', 4, v_f6_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 25, 0);

    -- ==================== FLOOR 7 ====================
    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 14', 1, v_f7_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 44, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 15', 2, v_f7_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 57, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Connection', 3, v_f7_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'EXTENSION EXISTING PLOT', 13, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation', 4, v_f7_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 32, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Circulation', 5, v_f7_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 25, 0);

    -- ==================== FLOOR 8 ====================
    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 16', 1, v_f8_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 44, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Room 17', 2, v_f8_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 57, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation', 3, v_f8_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 32, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Circulation', 4, v_f8_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Accommodation', 'WITHIN NEW PLOT', 25, 0);

    -- ==================== ROOFTOP ====================
    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Rooftop', 1, v_rooftop_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Rooftop', 'WITHIN NEW PLOT', 118, 0);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Rooftop', 'EXTENSION EXISTING PLOT', 16, 0);

    v_sub_id := extensions.uuid_generate_v4();
    INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) VALUES (v_sub_id, v_project_id, 'Vertical circulation', 2, v_rooftop_id);
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, name, built_area, uncovered_area) VALUES (v_project_id, v_sub_id, 'constructiva', 'Rooftop', 'WITHIN NEW PLOT', 30, 0);

END $$;
