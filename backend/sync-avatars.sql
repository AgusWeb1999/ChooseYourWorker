-- Script para sincronizar avatares de users a professionals
-- Ejecutar este script una sola vez para copiar los avatares existentes

-- Actualizar avatar_url en professionals desde users
UPDATE professionals
SET avatar_url = users.avatar_url,
    updated_at = NOW()
FROM users
WHERE professionals.user_id = users.id
  AND users.avatar_url IS NOT NULL
  AND users.avatar_url != ''
  AND (professionals.avatar_url IS NULL OR professionals.avatar_url = '');

-- Verificar cuántos se actualizaron
SELECT 
  COUNT(*) as total_actualizados,
  'Profesionales con avatar sincronizado' as descripcion
FROM professionals
WHERE avatar_url IS NOT NULL AND avatar_url != '';
