-- SOLUCIÓN DEFINITIVA PARA ERROR "new row violates row-level security policy"
-- Problema: Tu app sube fotos como usuario "anon" (Anónimo), pero las políticas anteriores exigían ser "authenticated".

-- 1. Limpiar TODAS las políticas previas del bucket 'evidencias' para evitar conflictos
DROP POLICY IF EXISTS "Cualquiera puede ver evidencias" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios autenticados pueden subir evidencias" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida autenticada" ON storage.objects;
DROP POLICY IF EXISTS "Permitir ver evidencias" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Full" ON storage.objects;
DROP POLICY IF EXISTS "Lectura Publica" ON storage.objects;
DROP POLICY IF EXISTS "Escritura Publica" ON storage.objects;
DROP POLICY IF EXISTS "Modificacion Publica" ON storage.objects;
DROP POLICY IF EXISTS "Borrado Publico" ON storage.objects;

-- 2. Asegurar que el bucket existe y es público
INSERT INTO storage.buckets (id, name, public)
VALUES ('evidencias', 'evidencias', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. CREADA ÚNICA POLÍTICA PERMISIVA (Crucial para tu caso)
-- Esta política permite a CUALQUIER USUARIO (Logueado o Anónimo) ver y subir fotos.
create policy "Acceso Total Evidencias"
on storage.objects for all
using ( bucket_id = 'evidencias' )
with check ( bucket_id = 'evidencias' );
