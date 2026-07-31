-- ==========================================================
-- ADD MISSING PROPERTIES TO PROJECT GENERAL INFO
-- ==========================================================

ALTER TABLE public.project_general_info 
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS occupied_area_plataforma NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS occupied_area_torre NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS ic_norma NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS io_norma_plataforma NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS io_norma_torre NUMERIC(12, 2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS additional_info TEXT;
