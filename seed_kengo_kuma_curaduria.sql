-- Script para poblar las áreas del proyecto (Modelo CURADURÍA)
-- REEMPLAZAR 'a1234567-...' CON EL ID REAL DE TU PROYECTO

DO $$
DECLARE
    v_project_id UUID := 'a1234567-89ab-cdef-0123-456789abcdef';
    
    -- Variables para IDs de niveles
    v_b3_id UUID;
    v_b1_id UUID;
    v_f1_id UUID;
    v_mezz_id UUID;
    v_f2_8_id UUID;
    v_rooftop_id UUID;
    v_all_floors_id UUID;
    
BEGIN
    -- 1. Buscar niveles existentes (creados por el script de Constructiva) o crearlos
    SELECT id INTO v_b3_id FROM public.project_levels WHERE project_id::text = v_project_id::text AND nombre = 'BASEMENT 3' AND parent_id IS NULL LIMIT 1;
    IF v_b3_id IS NULL THEN
        v_b3_id := extensions.uuid_generate_v4();
        INSERT INTO public.project_levels (id, project_id, nombre, indice) VALUES (v_b3_id, v_project_id, 'BASEMENT 3', -3);
    END IF;

    SELECT id INTO v_b1_id FROM public.project_levels WHERE project_id::text = v_project_id::text AND nombre = 'BASEMENT 1' AND parent_id IS NULL LIMIT 1;
    IF v_b1_id IS NULL THEN
        v_b1_id := extensions.uuid_generate_v4();
        INSERT INTO public.project_levels (id, project_id, nombre, indice) VALUES (v_b1_id, v_project_id, 'BASEMENT 1', -1);
    END IF;

    SELECT id INTO v_f1_id FROM public.project_levels WHERE project_id::text = v_project_id::text AND nombre = 'FLOOR 1' AND parent_id IS NULL LIMIT 1;
    IF v_f1_id IS NULL THEN
        v_f1_id := extensions.uuid_generate_v4();
        INSERT INTO public.project_levels (id, project_id, nombre, indice) VALUES (v_f1_id, v_project_id, 'FLOOR 1', 1);
    END IF;

    SELECT id INTO v_rooftop_id FROM public.project_levels WHERE project_id::text = v_project_id::text AND nombre = 'ROOFTOP' AND parent_id IS NULL LIMIT 1;
    IF v_rooftop_id IS NULL THEN
        v_rooftop_id := extensions.uuid_generate_v4();
        INSERT INTO public.project_levels (id, project_id, nombre, indice) VALUES (v_rooftop_id, v_project_id, 'ROOFTOP', 9);
    END IF;

    -- Niveles Agrupados específicos de Curaduría
    SELECT id INTO v_mezz_id FROM public.project_levels WHERE project_id::text = v_project_id::text AND nombre = 'MEZZANINE' AND parent_id IS NULL LIMIT 1;
    IF v_mezz_id IS NULL THEN
        v_mezz_id := extensions.uuid_generate_v4();
        INSERT INTO public.project_levels (id, project_id, nombre, indice) VALUES (v_mezz_id, v_project_id, 'MEZZANINE', 2);
    END IF;

    SELECT id INTO v_f2_8_id FROM public.project_levels WHERE project_id::text = v_project_id::text AND nombre = 'FLOOR 2 TO 8' AND parent_id IS NULL LIMIT 1;
    IF v_f2_8_id IS NULL THEN
        v_f2_8_id := extensions.uuid_generate_v4();
        INSERT INTO public.project_levels (id, project_id, nombre, indice) VALUES (v_f2_8_id, v_project_id, 'FLOOR 2 TO 8', 3);
    END IF;

    SELECT id INTO v_all_floors_id FROM public.project_levels WHERE project_id::text = v_project_id::text AND nombre = 'ALL FLOORS' AND parent_id IS NULL LIMIT 1;
    IF v_all_floors_id IS NULL THEN
        v_all_floors_id := extensions.uuid_generate_v4();
        INSERT INTO public.project_levels (id, project_id, nombre, indice) VALUES (v_all_floors_id, v_project_id, 'ALL FLOORS', 99);
    END IF;


    -- 2. INSERTAR ÁREAS EN MODELO 'curaduria'
    -- Limpiar datos previos de curaduría para evitar duplicados si se corre varias veces
    DELETE FROM public.project_area_details WHERE project_id = v_project_id AND context_type = 'curaduria';

    -- BASEMENT 3
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, built_within_plot, built_extension_new)
    VALUES (v_project_id, v_b3_id, 'curaduria', 'Black box theatre', 541, 194);

    -- BASEMENT 1
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, built_within_plot, built_extension_new)
    VALUES (v_project_id, v_b1_id, 'curaduria', 'Speak Easy / Tea room + Restaurant', 288, 63);

    -- FLOOR 1
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, built_within_plot)
    VALUES (v_project_id, v_f1_id, 'curaduria', 'Covered stage', 300);

    -- MEZZANINE
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, built_within_plot, built_extension_new)
    VALUES (v_project_id, v_mezz_id, 'curaduria', 'Open-air stage', 144, 102);

    -- FLOOR 2 TO 8
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, built_within_plot)
    VALUES (v_project_id, v_f2_8_id, 'curaduria', 'Accommodation 17 rooms aprox 60m2', 967);

    -- FLOOR 9 / ROOFTOP
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, built_within_plot)
    VALUES (v_project_id, v_rooftop_id, 'curaduria', 'Rooftop', 118);

    -- ALL FLOORS (Circulations)
    INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, built_within_plot, built_extension_new)
    VALUES (v_project_id, v_all_floors_id, 'curaduria', 'Circulations', 869, 74);

    -- ALL FLOORS (Technical areas) - Se crea como un subnivel de ALL FLOORS para tener dos filas separadas, o simplemente sumamos todo en uno.
    -- Como la UI muestra una fila por nivel, si insertamos dos veces al mismo level_id con mismo context_type habrá un error de Unique Constraint.
    -- Solución: Insertar "Technical areas" como un subnivel de "ALL FLOORS".
    DECLARE
        v_tech_sublevel UUID := extensions.uuid_generate_v4();
    BEGIN
        INSERT INTO public.project_levels (id, project_id, nombre, indice, parent_id) 
        VALUES (v_tech_sublevel, v_project_id, 'Technical areas', 1, v_all_floors_id);
        
        INSERT INTO public.project_area_details (project_id, level_id, context_type, usage_type, built_within_plot)
        VALUES (v_project_id, v_tech_sublevel, 'curaduria', 'Technical areas', 219);
    END;

END $$;
