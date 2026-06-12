-- ==========================================================
-- ADD OCCUPIED AREA TO PROJECT GENERAL INFO
-- ==========================================================

-- Add occupied_area column for Index of Occupation (IO)
ALTER TABLE public.project_general_info 
ADD COLUMN IF NOT EXISTS occupied_area NUMERIC(12, 2) DEFAULT 0.00;
