-- =====================================================
-- MIGRACIÓN: ARQUITECTURA UNIFICADA WORKINGGO
-- Fecha: 2 de febrero de 2026
-- Descripción: Permite solicitudes abiertas de clientes
--              sin profesional asignado
-- =====================================================

-- 1. Permitir professional_id NULL en hires (para solicitudes abiertas)
ALTER TABLE hires 
ALTER COLUMN professional_id DROP NOT NULL;

-- 2. Agregar nuevas columnas para solicitudes abiertas
ALTER TABLE hires 
ADD COLUMN IF NOT EXISTS service_description TEXT,
ADD COLUMN IF NOT EXISTS service_category VARCHAR(100),
ADD COLUMN IF NOT EXISTS service_location VARCHAR(200);

-- 3. Comentarios en columnas para documentación
COMMENT ON COLUMN hires.service_description IS 'Descripción detallada del servicio que el cliente necesita';
COMMENT ON COLUMN hires.service_category IS 'Categoría del servicio (Sanitario, Electricista, etc.)';
COMMENT ON COLUMN hires.service_location IS 'Ubicación donde se necesita el servicio';

-- 4. Crear índice para búsquedas rápidas de solicitudes abiertas
CREATE INDEX IF NOT EXISTS idx_hires_open_requests 
ON hires(created_at DESC) 
WHERE professional_id IS NULL AND status = 'pending';

-- 5. Crear índice para búsquedas por categoría
CREATE INDEX IF NOT EXISTS idx_hires_service_category 
ON hires(service_category, created_at DESC) 
WHERE professional_id IS NULL;

-- 6. Actualizar RLS policies para permitir ver solicitudes abiertas
-- Policy para que profesionales puedan ver solicitudes abiertas
DROP POLICY IF EXISTS "Profesionales pueden ver solicitudes abiertas" ON hires;
CREATE POLICY "Profesionales pueden ver solicitudes abiertas"
ON hires FOR SELECT
TO authenticated
USING (
  professional_id IS NULL OR 
  professional_id IN (
    SELECT id FROM professionals WHERE user_id = auth.uid()
  ) OR
  client_id = auth.uid()
);

-- Policy para que profesionales puedan asignarse a solicitudes abiertas
DROP POLICY IF EXISTS "Profesionales pueden asignarse a solicitudes" ON hires;
CREATE POLICY "Profesionales pueden asignarse a solicitudes"
ON hires FOR UPDATE
TO authenticated
USING (
  professional_id IS NULL AND status = 'pending'
)
WITH CHECK (
  professional_id IN (
    SELECT id FROM professionals WHERE user_id = auth.uid()
  )
);

-- 7. Función para notificar cuando un profesional se asigna a una solicitud
CREATE OR REPLACE FUNCTION notify_professional_assigned()
RETURNS TRIGGER AS $$
BEGIN
  -- Solo notificar si cambió de NULL a un profesional asignado
  IF OLD.professional_id IS NULL AND NEW.professional_id IS NOT NULL THEN
    -- Insertar notificación para el cliente
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      related_id,
      related_type,
      sender_id
    )
    SELECT 
      NEW.client_id,
      'professional_assigned',
      'Un profesional respondió a tu solicitud',
      (SELECT display_name FROM professionals WHERE id = NEW.professional_id) || ' está interesado en tu solicitud.',
      NEW.id,
      'hire',
      (SELECT user_id FROM professionals WHERE id = NEW.professional_id)
    WHERE NEW.client_id IS NOT NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Trigger para ejecutar la notificación
DROP TRIGGER IF EXISTS trigger_professional_assigned ON hires;
CREATE TRIGGER trigger_professional_assigned
  AFTER UPDATE ON hires
  FOR EACH ROW
  WHEN (OLD.professional_id IS DISTINCT FROM NEW.professional_id)
  EXECUTE FUNCTION notify_professional_assigned();

-- 9. Comentario en tabla para documentación
COMMENT ON TABLE hires IS 'Tabla de contrataciones. Puede tener professional_id NULL para solicitudes abiertas que aún no tienen profesional asignado.';

-- 10. Verificación de datos existentes
DO $$
BEGIN
  -- Verificar que no haya problemas con datos existentes
  IF EXISTS (
    SELECT 1 FROM hires 
    WHERE professional_id IS NULL 
    AND status NOT IN ('pending', 'cancelled')
  ) THEN
    RAISE NOTICE 'Advertencia: Hay hires sin profesional con status diferente a pending/cancelled';
  END IF;
END $$;
