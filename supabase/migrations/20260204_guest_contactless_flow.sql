-- =====================================================
-- MIGRACIÓN: FLUJO DE CONTACTO SIN CUENTA (GUEST)
-- Fecha: 4 de febrero de 2026
-- Descripción: Permite que usuarios sin cuenta contacten
--              profesionales y dejen reseñas después
-- =====================================================

-- 1. Permitir client_id NULL en hires (para usuarios invitados)
ALTER TABLE hires 
ALTER COLUMN client_id DROP NOT NULL;

-- 2. Agregar columnas para información de usuario invitado
ALTER TABLE hires 
ADD COLUMN IF NOT EXISTS guest_client_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS guest_client_phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS guest_client_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS review_token UUID UNIQUE DEFAULT gen_random_uuid(),
ADD COLUMN IF NOT EXISTS reviewed_by_guest BOOLEAN DEFAULT FALSE;

-- 3. Comentarios en columnas para documentación
COMMENT ON COLUMN hires.guest_client_email IS 'Email del cliente invitado (sin cuenta)';
COMMENT ON COLUMN hires.guest_client_phone IS 'Teléfono del cliente invitado (obligatorio)';
COMMENT ON COLUMN hires.guest_client_name IS 'Nombre del cliente invitado';
COMMENT ON COLUMN hires.review_token IS 'Token único para que el invitado deje reseña sin login';
COMMENT ON COLUMN hires.reviewed_by_guest IS 'Indica si el invitado ya dejó reseña';

-- 4. Crear índice para búsqueda de tokens de reseña
CREATE INDEX IF NOT EXISTS idx_hires_review_token 
ON hires(review_token) 
WHERE review_token IS NOT NULL;

-- 5. Constraint: Debe tener client_id O guest_client_email
ALTER TABLE hires 
DROP CONSTRAINT IF EXISTS check_client_or_guest;

ALTER TABLE hires 
ADD CONSTRAINT check_client_or_guest 
CHECK (
  (client_id IS NOT NULL AND guest_client_email IS NULL) OR
  (client_id IS NULL AND guest_client_email IS NOT NULL)
);

-- 6. Actualizar RLS policies para permitir acceso público a hires con token
DROP POLICY IF EXISTS "Anyone can read hires with valid review token" ON hires;
CREATE POLICY "Anyone can read hires with valid review token"
ON hires FOR SELECT
TO anon
USING (review_token IS NOT NULL);

-- 6.1 Permitir inserts anónimos para hires de invitados (sin cuenta)
DROP POLICY IF EXISTS "Guests can insert hires" ON hires;
CREATE POLICY "Guests can insert hires"
ON hires FOR INSERT
TO anon
WITH CHECK (
  client_id IS NULL
  AND guest_client_email IS NOT NULL
  AND guest_client_phone IS NOT NULL
  AND guest_client_name IS NOT NULL
);

-- 7. Permitir que anónimos actualicen reviewed_by_guest con token válido
DROP POLICY IF EXISTS "Anyone can mark as reviewed with valid token" ON hires;
CREATE POLICY "Anyone can mark as reviewed with valid token"
ON hires FOR UPDATE
TO anon
USING (review_token IS NOT NULL AND reviewed_by_guest = false)
WITH CHECK (reviewed_by_guest = true);

-- 8. Agregar columna is_guest_review a reviews
ALTER TABLE reviews
ADD COLUMN IF NOT EXISTS is_guest_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS guest_reviewer_name VARCHAR(255);

-- 9. Comentarios en reviews
COMMENT ON COLUMN reviews.is_guest_review IS 'Indica si esta reseña fue hecha por un usuario sin cuenta';
COMMENT ON COLUMN reviews.guest_reviewer_name IS 'Nombre del reviewer invitado (si aplica)';

-- 10. Actualizar RLS de reviews para permitir insert anónimo con token válido
DROP POLICY IF EXISTS "Anyone can insert reviews with valid hire token" ON reviews;
CREATE POLICY "Anyone can insert reviews with valid hire token"
ON reviews FOR INSERT
TO anon
WITH CHECK (
  EXISTS (
    SELECT 1 FROM hires 
    WHERE hires.id = hire_id 
    AND hires.review_token IS NOT NULL
    AND hires.reviewed_by_guest = false
  )
);

-- 11. Verificación de datos existentes
DO $$
BEGIN
  -- Verificar que no haya hires sin client_id ni guest_client_email
  IF EXISTS (
    SELECT 1 FROM hires 
    WHERE client_id IS NULL 
    AND guest_client_email IS NULL
  ) THEN
    RAISE NOTICE 'Advertencia: Hay hires sin client_id ni guest_client_email';
  END IF;
END $$;

-- 12. Comentario en tabla
COMMENT ON TABLE hires IS 'Tabla de contrataciones. Puede tener client_id (usuario registrado) O guest_client_email (usuario invitado). El review_token permite reseñas sin cuenta.';
