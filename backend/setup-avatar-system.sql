-- ============================================
-- SISTEMA DE FOTOS DE PERFIL
-- ============================================
-- Este script configura todo lo necesario para subir fotos de perfil

-- 1. Agregar columnas avatar_url a las tablas
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Crear bucket de storage para avatars (si no existe)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true,
  5242880, -- 5MB máximo
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas RLS para el bucket de avatars

-- Eliminar políticas si ya existen (para evitar errores)
DROP POLICY IF EXISTS "Avatars son públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden subir su avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar su avatar" ON storage.objects;

-- Permitir a todos VER los avatars (público)
CREATE POLICY "Avatars son públicos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Permitir a usuarios autenticados SUBIR su propio avatar
CREATE POLICY "Usuarios pueden subir su avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios ACTUALIZAR su propio avatar
CREATE POLICY "Usuarios pueden actualizar su avatar" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Permitir a usuarios ELIMINAR su propio avatar
CREATE POLICY "Usuarios pueden eliminar su avatar" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 4. Comentarios explicativos
COMMENT ON COLUMN public.users.avatar_url IS 
'URL pública de la foto de perfil del usuario almacenada en Supabase Storage';

COMMENT ON COLUMN public.professionals.avatar_url IS 
'URL pública de la foto de perfil del profesional almacenada en Supabase Storage';

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar que las columnas se crearon
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE column_name = 'avatar_url'
  AND table_schema = 'public'
ORDER BY table_name;

-- Verificar que el bucket existe
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE id = 'avatars';

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY policyname;

SELECT '✅ Sistema de fotos de perfil configurado correctamente' as status;
