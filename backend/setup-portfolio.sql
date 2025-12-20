-- Script para crear la tabla de imágenes de portafolio y el bucket de storage
-- Ejecutar en Supabase SQL Editor

-- 1. Crear la tabla portfolio_images
CREATE TABLE IF NOT EXISTS portfolio_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  professional_id UUID NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_portfolio_images_professional_id ON portfolio_images(professional_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_images_created_at ON portfolio_images(created_at DESC);

-- 3. Habilitar Row Level Security (RLS)
ALTER TABLE portfolio_images ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de seguridad

-- Cualquiera puede ver las imágenes del portafolio
CREATE POLICY "Las imágenes del portafolio son públicas"
  ON portfolio_images
  FOR SELECT
  USING (true);

-- Solo el profesional puede insertar sus propias imágenes
CREATE POLICY "Los profesionales pueden insertar sus propias imágenes"
  ON portfolio_images
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM professionals 
      WHERE id = professional_id
    )
  );

-- Solo el profesional puede eliminar sus propias imágenes
CREATE POLICY "Los profesionales pueden eliminar sus propias imágenes"
  ON portfolio_images
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM professionals 
      WHERE id = professional_id
    )
  );

-- Solo el profesional puede actualizar sus propias imágenes
CREATE POLICY "Los profesionales pueden actualizar sus propias imágenes"
  ON portfolio_images
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM professionals 
      WHERE id = professional_id
    )
  )
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id 
      FROM professionals 
      WHERE id = professional_id
    )
  );

-- 5. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_portfolio_images_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_portfolio_images_updated_at_trigger ON portfolio_images;
CREATE TRIGGER update_portfolio_images_updated_at_trigger
  BEFORE UPDATE ON portfolio_images
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_images_updated_at();

-- 7. Crear el bucket de storage para portafolio
-- Nota: Esto debe ejecutarse manualmente en la interfaz de Supabase Storage
-- O puedes usar este código para verificar si existe:

-- Verificar si el bucket existe
DO $$
BEGIN
  -- Insertar el bucket si no existe (esto debe hacerse desde la UI de Supabase)
  -- Este script solo sirve como referencia
  RAISE NOTICE 'Ahora debes crear el bucket "portfolio" en Supabase Storage con las siguientes configuraciones:';
  RAISE NOTICE '- Nombre: portfolio';
  RAISE NOTICE '- Público: Sí (marcado)';
  RAISE NOTICE '- Tamaño máximo de archivo: 5 MB';
  RAISE NOTICE '- Tipos de archivo permitidos: image/png, image/jpeg, image/jpg, image/webp';
END $$;

-- 8. Una vez creado el bucket, ejecutar estas políticas de storage:

-- NOTA IMPORTANTE:
-- Las siguientes políticas deben configurarse en Supabase Storage UI:
-- 1. Ir a Storage > portfolio > Policies
-- 2. Crear estas políticas:

/*
POLÍTICA 1: "Permitir lectura pública"
Operación: SELECT
Definición: true

POLÍTICA 2: "Permitir subida de imágenes al profesional"
Operación: INSERT
Definición:
bucket_id = 'portfolio' AND 
(storage.foldername(name))[1] IN (
  SELECT id::text 
  FROM professionals 
  WHERE user_id = auth.uid()
)

POLÍTICA 3: "Permitir eliminación de imágenes al profesional"
Operación: DELETE
Definición:
bucket_id = 'portfolio' AND 
(storage.foldername(name))[1] IN (
  SELECT id::text 
  FROM professionals 
  WHERE user_id = auth.uid()
)
*/

-- ¡Script completado!
-- Recuerda crear el bucket "portfolio" manualmente en la interfaz de Supabase Storage
