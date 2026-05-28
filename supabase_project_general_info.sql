-- Tabla para almacenar la Información General detallada de cada Proyecto
CREATE TABLE IF NOT EXISTS public.project_general_info (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID UNIQUE NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    client TEXT NOT NULL DEFAULT 'Sin asignar',
    code TEXT NOT NULL DEFAULT 'Sin asignar',
    location TEXT NOT NULL DEFAULT 'Sin asignar',
    scope TEXT NOT NULL DEFAULT 'Sin asignar',
    typology TEXT NOT NULL DEFAULT 'Sin asignar',
    modules TEXT[] DEFAULT ARRAY[]::TEXT[],
    sales_area NUMERIC(12, 2) DEFAULT 0.00,
    built_area NUMERIC(12, 2) DEFAULT 0.00,
    circulation_area NUMERIC(12, 2) DEFAULT 0.00,
    tdi_correlation TEXT DEFAULT 'TDI_A (General Project Info)',
    oir_pir_compliance TEXT DEFAULT 'Requisitos OIR (Organizational Information Requirements) y PIR (Project Information Requirements)',
    bim_uses TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS (Seguridad a Nivel de Fila)
ALTER TABLE public.project_general_info ENABLE ROW LEVEL SECURITY;

-- Crear políticas de acceso
CREATE POLICY "Permitir lectura publica de informacion general" 
ON public.project_general_info FOR SELECT USING (true);

CREATE POLICY "Permitir modificacion completa a usuarios autenticados" 
ON public.project_general_info FOR ALL USING (auth.role() = 'authenticated');

-- Bloque PL/pgSQL para poblar el proyecto Click Clack si ya existe
DO $$
DECLARE
    v_project_id UUID;
BEGIN
    -- Intentar obtener el ID del proyecto de Click Clack
    SELECT id INTO v_project_id FROM public.projects WHERE name ILIKE '%Click Clack%' LIMIT 1;
    
    IF v_project_id IS NOT NULL THEN
        INSERT INTO public.project_general_info (
            project_id, client, code, location, scope, typology, modules, 
            sales_area, built_area, circulation_area, tdi_correlation, oir_pir_compliance, bim_uses
        ) VALUES (
            v_project_id,
            'Grupo Attia',
            'CCWE-E2',
            'Medellín, Antioquia',
            'Desarrollo de diseños técnicos de la Etapa 2',
            'Uso Residencial',
            ARRAY['Gimnasio', 'Zonas húmedas', 'Áreas sociales y de recreación'],
            2500.00, -- Área de Ventas (ejemplo m2)
            3500.00, -- Área Construida (ejemplo m2)
            1000.00, -- Área de Circulación (ejemplo m2)
            'TDI_A (General Project Info)',
            'Requisitos de Información Organizacional (OIR) y Requisitos de Información del Proyecto (PIR)',
            ARRAY['Coordinación 3D', 'Cuantificación 5D']
        ) ON CONFLICT (project_id) DO UPDATE SET
            client = EXCLUDED.client,
            code = EXCLUDED.code,
            location = EXCLUDED.location,
            scope = EXCLUDED.scope,
            typology = EXCLUDED.typology,
            modules = EXCLUDED.modules,
            sales_area = EXCLUDED.sales_area,
            built_area = EXCLUDED.built_area,
            circulation_area = EXCLUDED.circulation_area,
            tdi_correlation = EXCLUDED.tdi_correlation,
            oir_pir_compliance = EXCLUDED.oir_pir_compliance,
            bim_uses = EXCLUDED.bim_uses;
    END IF;
END $$;
