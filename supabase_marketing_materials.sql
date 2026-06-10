-- marketing_materials schema

CREATE TABLE IF NOT EXISTS public.marketing_materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- 'tarjeta', 'volante', 'qr_poster'
    title VARCHAR(255) NOT NULL,
    data JSONB DEFAULT '{}'::jsonb, -- Configuration data (colors, texts, links, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable RLS
ALTER TABLE public.marketing_materials ENABLE ROW LEVEL SECURITY;

-- Policies for admin only (Assuming your setup allows authenticated users to read, but only admins to edit, or keeping it open for MVP)
-- For simplicity in MVP, we allow all authenticated users (assuming they have access to the admin area)
CREATE POLICY "Enable all access for authenticated users" ON public.marketing_materials
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Insert some default seeds so the UI has something to show initially
INSERT INTO public.marketing_materials (type, title, data)
VALUES 
('tarjeta', 'Tarjeta de Presentación Estándar', '{"front_title": "Review", "front_subtitle": "Transformando la gestión y coordinación.", "email": "admin@review.com", "website": "www.review.com"}'::jsonb),
('volante', 'Volante Promocional', '{"headline": "Descubre el futuro del ciclo de vida", "description": "Gestiona tus proyectos BIM como nunca antes.", "call_to_action": "Contáctanos hoy"}'::jsonb),
('qr_poster', 'Poster Instagram QR', '{"title": "Síguenos en IG", "qr_url": "https://instagram.com/review_app", "handle": "@review_app"}'::jsonb);
