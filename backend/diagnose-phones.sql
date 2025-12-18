-- Diagnóstico: Verificar teléfonos de clientes que tienen trabajos activos

SELECT 
  h.id as hire_id,
  h.status,
  u.id,
  u.full_name,
  u.email,
  u.phone,
  u.address
FROM hires h
LEFT JOIN users u ON h.client_id = u.id
WHERE h.status IN ('pending', 'accepted', 'in_progress')
ORDER BY h.created_at DESC;

-- Ver estadísticas de clientes
SELECT 
  COUNT(*) as total_clients,
  COUNT(CASE WHEN phone IS NOT NULL THEN 1 END) as with_phone,
  COUNT(CASE WHEN phone IS NULL THEN 1 END) as without_phone
FROM users
WHERE user_type = 'client';
