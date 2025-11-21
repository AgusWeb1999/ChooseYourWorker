-- Consultas SQL Útiles para Verificar y Administrar ChooseYourWorker
-- Ejecutar en Supabase SQL Editor para ver/verificar datos

-- =====================================================
-- CONSULTAS DE VERIFICACIÓN
-- =====================================================

-- 1. Ver todos los usuarios registrados
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.is_professional,
  u.created_at,
  CASE 
    WHEN u.is_professional THEN 'Trabajador'
    ELSE 'Cliente'
  END as tipo_usuario
FROM users u
ORDER BY u.created_at DESC;

-- 2. Ver todos los perfiles de trabajadores completados
SELECT 
  p.id,
  u.full_name,
  u.email,
  p.display_name,
  p.profession,
  p.date_of_birth,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, p.date_of_birth)) as edad,
  p.identification_type,
  p.identification_number,
  p.city,
  p.state,
  p.hourly_rate,
  p.years_experience,
  p.rating,
  p.total_jobs,
  p.is_verified,
  p.created_at
FROM professionals p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC;

-- 3. Encontrar trabajadores sin perfil completado
SELECT 
  u.id,
  u.full_name,
  u.email,
  u.created_at
FROM users u
LEFT JOIN professionals p ON p.user_id = u.id
WHERE u.is_professional = true 
  AND p.id IS NULL
ORDER BY u.created_at DESC;

-- 4. Ver trabajadores por profesión
SELECT 
  p.profession,
  COUNT(*) as cantidad,
  AVG(p.hourly_rate) as tarifa_promedio,
  AVG(p.years_experience) as experiencia_promedio,
  AVG(p.rating) as rating_promedio
FROM professionals p
GROUP BY p.profession
ORDER BY cantidad DESC;

-- 5. Ver trabajadores por ubicación
SELECT 
  p.state as provincia,
  p.city as ciudad,
  COUNT(*) as cantidad_trabajadores
FROM professionals p
GROUP BY p.state, p.city
ORDER BY cantidad_trabajadores DESC;

-- 6. Buscar trabajadores específicos
-- Por profesión y ubicación
SELECT 
  p.display_name,
  p.profession,
  p.city,
  p.state,
  p.hourly_rate,
  p.years_experience,
  p.rating,
  p.phone
FROM professionals p
WHERE p.profession = 'Electricista'
  AND p.state = 'CABA'
  AND p.is_active = true
ORDER BY p.rating DESC;

-- 7. Ver trabajadores con mejor rating
SELECT 
  p.display_name,
  p.profession,
  p.city,
  p.rating,
  p.total_jobs,
  p.years_experience
FROM professionals p
WHERE p.rating > 4.0
  AND p.total_jobs > 5
ORDER BY p.rating DESC, p.total_jobs DESC
LIMIT 10;

-- =====================================================
-- CONSULTAS DE ADMINISTRACIÓN
-- =====================================================

-- 8. Actualizar tarifa de un trabajador
UPDATE professionals
SET hourly_rate = 2000
WHERE identification_number = '12345678';

-- 9. Verificar un trabajador manualmente
UPDATE professionals
SET is_verified = true
WHERE id = 'UUID-DEL-TRABAJADOR';

-- 10. Desactivar un trabajador
UPDATE professionals
SET is_active = false
WHERE id = 'UUID-DEL-TRABAJADOR';

-- 11. Ver trabajadores no verificados
SELECT 
  p.display_name,
  p.profession,
  p.identification_type,
  p.identification_number,
  p.city,
  p.created_at
FROM professionals p
WHERE p.is_verified = false
ORDER BY p.created_at DESC;

-- =====================================================
-- CONSULTAS DE ESTADÍSTICAS
-- =====================================================

-- 12. Estadísticas generales del sistema
SELECT 
  (SELECT COUNT(*) FROM users) as total_usuarios,
  (SELECT COUNT(*) FROM users WHERE is_professional = true) as total_trabajadores,
  (SELECT COUNT(*) FROM users WHERE is_professional = false) as total_clientes,
  (SELECT COUNT(*) FROM professionals) as perfiles_completados,
  (SELECT COUNT(*) FROM professionals WHERE is_verified = true) as trabajadores_verificados,
  (SELECT COUNT(*) FROM professionals WHERE is_active = true) as trabajadores_activos;

-- 13. Estadísticas por rango de edad
SELECT 
  CASE 
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 18 AND 25 THEN '18-25'
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 26 AND 35 THEN '26-35'
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 36 AND 45 THEN '36-45'
    WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, date_of_birth)) BETWEEN 46 AND 55 THEN '46-55'
    ELSE '56+'
  END as rango_edad,
  COUNT(*) as cantidad
FROM professionals
GROUP BY rango_edad
ORDER BY rango_edad;

-- 14. Estadísticas de tarifas por profesión
SELECT 
  p.profession,
  COUNT(*) as cantidad,
  MIN(p.hourly_rate) as tarifa_minima,
  AVG(p.hourly_rate) as tarifa_promedio,
  MAX(p.hourly_rate) as tarifa_maxima
FROM professionals p
WHERE p.hourly_rate IS NOT NULL
GROUP BY p.profession
ORDER BY tarifa_promedio DESC;

-- 15. Trabajadores registrados por mes
SELECT 
  TO_CHAR(created_at, 'YYYY-MM') as mes,
  COUNT(*) as nuevos_trabajadores
FROM professionals
GROUP BY mes
ORDER BY mes DESC;

-- =====================================================
-- CONSULTAS DE VALIDACIÓN/DEBUG
-- =====================================================

-- 16. Verificar duplicados de identificación
SELECT 
  identification_type,
  identification_number,
  COUNT(*) as cantidad
FROM professionals
GROUP BY identification_type, identification_number
HAVING COUNT(*) > 1;

-- 17. Verificar trabajadores sin datos obligatorios
SELECT 
  p.id,
  p.display_name,
  CASE WHEN p.profession IS NULL THEN 'X' ELSE '✓' END as tiene_profesion,
  CASE WHEN p.date_of_birth IS NULL THEN 'X' ELSE '✓' END as tiene_fecha_nac,
  CASE WHEN p.identification_type IS NULL THEN 'X' ELSE '✓' END as tiene_tipo_id,
  CASE WHEN p.identification_number IS NULL THEN 'X' ELSE '✓' END as tiene_num_id,
  CASE WHEN p.city IS NULL THEN 'X' ELSE '✓' END as tiene_ciudad
FROM professionals p
WHERE p.profession IS NULL 
   OR p.date_of_birth IS NULL 
   OR p.identification_type IS NULL 
   OR p.identification_number IS NULL 
   OR p.city IS NULL;

-- 18. Ver usuarios con auth pero sin registro en users
SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
LEFT JOIN users u ON u.auth_uid = au.id
WHERE u.id IS NULL;

-- 19. Ver estructura de la tabla professionals
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'professionals'
ORDER BY ordinal_position;

-- 20. Verificar políticas de seguridad activas
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('users', 'professionals', 'jobs', 'reviews')
ORDER BY tablename, policyname;

-- =====================================================
-- CONSULTAS DE LIMPIEZA (¡USAR CON CUIDADO!)
-- =====================================================

-- 21. Eliminar trabajadores de prueba
-- NOTA: Solo ejecutar si estás seguro, esto elimina datos reales
-- DELETE FROM professionals 
-- WHERE display_name LIKE '%test%' OR display_name LIKE '%prueba%';

-- 22. Eliminar usuarios sin perfil completado (más de 30 días)
-- NOTA: Solo ejecutar si estás seguro
-- DELETE FROM users 
-- WHERE is_professional = true 
--   AND id NOT IN (SELECT user_id FROM professionals)
--   AND created_at < NOW() - INTERVAL '30 days';

-- =====================================================
-- CONSULTAS PARA BÚSQUEDA DE TRABAJADORES (APP)
-- =====================================================

-- 23. Búsqueda avanzada de trabajadores
SELECT 
  p.id,
  p.display_name,
  p.profession,
  p.bio,
  p.city,
  p.state,
  p.hourly_rate,
  p.years_experience,
  p.rating,
  p.total_jobs,
  p.phone
FROM professionals p
WHERE p.is_active = true
  AND p.is_verified = true
  -- Filtros opcionales:
  -- AND p.profession = 'Electricista'
  -- AND p.state = 'CABA'
  -- AND p.hourly_rate <= 2000
  -- AND p.rating >= 4.0
ORDER BY p.rating DESC, p.total_jobs DESC
LIMIT 20;

-- 24. Buscar por múltiples profesiones
SELECT 
  p.display_name,
  p.profession,
  p.city,
  p.hourly_rate,
  p.rating
FROM professionals p
WHERE p.profession IN ('Electricista', 'Plomero', 'Carpintero')
  AND p.is_active = true
ORDER BY p.rating DESC;

-- 25. Buscar trabajadores cerca de un código postal
-- (Requeriría geolocalización real, esto es un ejemplo simple)
SELECT 
  p.display_name,
  p.profession,
  p.zip_code,
  p.city,
  p.hourly_rate
FROM professionals p
WHERE p.zip_code BETWEEN '1400' AND '1499'
  AND p.is_active = true
ORDER BY p.zip_code;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================

/*
1. Estas consultas son seguras para ejecutar en modo lectura (SELECT)
2. Ten cuidado con UPDATE y DELETE, siempre verifica primero con SELECT
3. Usa LIMIT en consultas grandes para evitar timeout
4. Los UUIDs deben reemplazarse con los valores reales de tu base de datos
5. Las consultas con JOIN pueden ser lentas si hay muchos datos, usa índices

Para usar estas consultas:
1. Abrir Supabase Dashboard
2. Ir a SQL Editor
3. Copiar la consulta que necesitas
4. Ejecutar con el botón RUN o Ctrl+Enter
5. Ver resultados en la tabla inferior
*/
