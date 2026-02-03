-- =====================================================
-- MIGRACIÓN: ESTRUCTURA TABLA REVIEWS
-- Fecha: 3 de febrero de 2026
-- Descripción: Asegurar que la tabla reviews tenga la
--              estructura correcta para guardar reseñas
--              de profesionales por clientes
-- =====================================================

-- 1. Crear tabla reviews si no existe
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Referencias
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hire_id UUID REFERENCES public.hires(id) ON DELETE SET NULL,
  
  -- Contenido de la reseña
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  costo NUMERIC,
  
  -- Constraints
  CONSTRAINT unique_review_per_hire UNIQUE (hire_id, client_id)
);

-- 2. Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_reviews_professional_id ON public.reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON public.reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_hire_id ON public.reviews(hire_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- 3. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Trigger para actualizar updated_at
DROP TRIGGER IF EXISTS update_reviews_updated_at ON public.reviews;
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 5. Row Level Security (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Todos pueden leer reseñas (son públicas)
DROP POLICY IF EXISTS "Las reseñas son públicas" ON public.reviews;
CREATE POLICY "Las reseñas son públicas"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Los clientes pueden crear reseñas
DROP POLICY IF EXISTS "Los clientes pueden crear reseñas" ON public.reviews;
CREATE POLICY "Los clientes pueden crear reseñas"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (
    client_id = auth.uid()
  );

-- Policy: Los clientes pueden actualizar sus propias reseñas
DROP POLICY IF EXISTS "Los clientes pueden actualizar sus reseñas" ON public.reviews;
CREATE POLICY "Los clientes pueden actualizar sus reseñas"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (client_id = auth.uid())
  WITH CHECK (client_id = auth.uid());

-- Policy: Los clientes pueden eliminar sus propias reseñas
DROP POLICY IF EXISTS "Los clientes pueden eliminar sus reseñas" ON public.reviews;
CREATE POLICY "Los clientes pueden eliminar sus reseñas"
  ON public.reviews FOR DELETE
  TO authenticated
  USING (client_id = auth.uid());

-- 6. Comentarios para documentación
COMMENT ON TABLE public.reviews IS 'Tabla de reseñas de profesionales hechas por clientes';
COMMENT ON COLUMN public.reviews.professional_id IS 'ID del profesional que recibe la reseña';
COMMENT ON COLUMN public.reviews.client_id IS 'ID del cliente que hace la reseña';
COMMENT ON COLUMN public.reviews.hire_id IS 'ID de la contratación relacionada (opcional)';
COMMENT ON COLUMN public.reviews.rating IS 'Calificación de 1 a 5 estrellas';
COMMENT ON COLUMN public.reviews.comment IS 'Comentario opcional del cliente';
COMMENT ON COLUMN public.reviews.costo IS 'Costo opcional del servicio';

-- 7. Verificación de datos
DO $$
BEGIN
  RAISE NOTICE 'Tabla reviews creada/actualizada correctamente';
  RAISE NOTICE 'Total de reseñas existentes: %', (SELECT COUNT(*) FROM public.reviews);
END $$;
