-- Tablas para bloques de contenido en los recursos (similar a módulos)
-- Permite intercalar texto en Markdown con imágenes subidas

CREATE TABLE IF NOT EXISTS resource_content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES resources(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('text', 'image')),
  content TEXT NOT NULL, -- Para texto: el contenido Markdown. Para imagen: la URL pública.
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE resource_content_blocks ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para todos (lectura)
DROP POLICY IF EXISTS "Permitir lectura pública de bloques de recursos" ON resource_content_blocks;
CREATE POLICY "Permitir lectura pública de bloques de recursos" 
ON resource_content_blocks FOR SELECT 
USING (true);

-- Políticas para administradores y usuarios autenticados (CRUD completo para prototipo)
DROP POLICY IF EXISTS "Permitir edición total de bloques de recursos" ON resource_content_blocks;
CREATE POLICY "Permitir edición total de bloques de recursos" 
ON resource_content_blocks FOR ALL 
TO authenticated, anon 
USING (true) 
WITH CHECK (true);

-- Trigger para actualizar updated_at (asumiendo que update_updated_at_column ya existe de v5)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_resource_content_blocks_updated_at') THEN
        CREATE TRIGGER update_resource_content_blocks_updated_at
            BEFORE UPDATE ON resource_content_blocks
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- Índice para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_resource_content_blocks_resource_id ON resource_content_blocks(resource_id);
