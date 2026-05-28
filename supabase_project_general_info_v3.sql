-- ==========================================================
-- ADD LOT AREA TO PROJECT GENERAL INFO
-- ==========================================================

-- Add lot_area column
ALTER TABLE public.project_general_info 
ADD COLUMN IF NOT EXISTS lot_area NUMERIC(12, 2) DEFAULT 0.00;
