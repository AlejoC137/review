-- Tablas para bloques de contenido en los módulos del roadmap
-- Permite intercalar texto en Markdown con imágenes subidas

CREATE TABLE IF NOT EXISTS module_content_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id TEXT NOT NULL REFERENCES roadmap_modules(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'image')),
  content TEXT NOT NULL, -- Para texto: el contenido Markdown. Para imagen: la URL pública.
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE module_content_blocks ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para todos (lectura)
DROP POLICY IF EXISTS "Permitir lectura pública de bloques" ON module_content_blocks;
CREATE POLICY "Permitir lectura pública de bloques" 
ON module_content_blocks FOR SELECT 
USING (true);

-- Políticas para administradores (CRUD completo)
DROP POLICY IF EXISTS "Permitir edición a todos los roles" ON module_content_blocks;
CREATE POLICY "Permitir edición a todos los roles" 
ON module_content_blocks FOR ALL 
TO authenticated, anon 
USING (true) 
WITH CHECK (true);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_module_content_blocks_updated_at ON module_content_blocks;
CREATE TRIGGER update_module_content_blocks_updated_at
    BEFORE UPDATE ON module_content_blocks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Índice para mejorar el rendimiento de las consultas por módulo
CREATE INDEX IF NOT EXISTS idx_module_content_blocks_module_id ON module_content_blocks(module_id);

-- POLÍTICAS PARA STORAGE (Bucket 'images')
-- Nota: Activa estas políticas si aún no las tienes configuradas.
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'images' );

DROP POLICY IF EXISTS "Public Upload" ON storage.objects;
CREATE POLICY "Public Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'images' );

DROP POLICY IF EXISTS "Public Update" ON storage.objects;
CREATE POLICY "Public Update" ON storage.objects FOR UPDATE USING ( bucket_id = 'images' );

DROP POLICY IF EXISTS "Public Delete" ON storage.objects;
CREATE POLICY "Public Delete" ON storage.objects FOR DELETE USING ( bucket_id = 'images' );
