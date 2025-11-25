-- ================================================
-- VERIFICACIÓN: Sistema Limpio para Empezar
-- ================================================

-- 1. Verificar que no hay clientes
SELECT '=== USUARIOS ===' as seccion;
SELECT 
  'Clientes (debe ser 0)' as tipo,
  COUNT(*) as cantidad
FROM public.users
WHERE is_professional = false
UNION ALL
SELECT 
  'Profesionales (mantener)',
  COUNT(*)
FROM public.users
WHERE is_professional = true;

-- 2. Verificar auth.users
SELECT '=== AUTH.USERS ===' as seccion;
SELECT 
  'Total en auth.users' as tipo,
  COUNT(*) as cantidad
FROM auth.users;

-- 3. Verificar conversaciones
SELECT '=== CONVERSACIONES ===' as seccion;
SELECT 
  'Total conversaciones' as tipo,
  COUNT(*) as cantidad
FROM conversations;

-- 4. Verificar mensajes
SELECT '=== MENSAJES ===' as seccion;
SELECT 
  'Total mensajes' as tipo,
  COUNT(*) as cantidad
FROM messages;

-- 5. Verificar reseñas
SELECT '=== RESEÑAS ===' as seccion;
SELECT 
  'Total reseñas' as tipo,
  COUNT(*) as cantidad
FROM reviews;

-- 6. Verificar profesionales
SELECT '=== PROFESIONALES ===' as seccion;
SELECT 
  'Total profesionales' as tipo,
  COUNT(*) as cantidad
FROM professionals
UNION ALL
SELECT 
  'Con user_id asignado',
  COUNT(*)
FROM professionals
WHERE user_id IS NOT NULL
UNION ALL
SELECT 
  'Sin user_id (normales)',
  COUNT(*)
FROM professionals
WHERE user_id IS NULL;

-- 7. Estado del sistema
SELECT '=== RESUMEN ===' as seccion;
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM public.users WHERE is_professional = false) = 0 THEN '✅'
    ELSE '❌'
  END || ' Clientes eliminados' as estado
UNION ALL
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM conversations) = 0 THEN '✅'
    ELSE '⚠️'
  END || ' Conversaciones limpias'
UNION ALL
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM messages) = 0 THEN '✅'
    ELSE '⚠️'
  END || ' Mensajes limpios'
UNION ALL
SELECT 
  CASE 
    WHEN (SELECT COUNT(*) FROM professionals) > 0 THEN '✅'
    ELSE '❌'
  END || ' Profesionales preservados';

SELECT '🎉 SISTEMA LISTO PARA NUEVOS CLIENTES' as mensaje;
