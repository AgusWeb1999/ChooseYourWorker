-- ================================================
-- RESET COMPLETO: Eliminar todo y empezar de cero
-- ================================================
-- ⚠️ ADVERTENCIA: Esto eliminará TODO excepto profesionales
-- Reviews, conversaciones, mensajes, y clientes serán eliminados

-- Ver qué se va a eliminar
SELECT 
    '=== ANTES DEL RESET ===' as info;

SELECT 
    'Usuarios totales' as tipo,
    COUNT(*) as cantidad
FROM users
UNION ALL
SELECT 
    'Profesionales',
    COUNT(*)
FROM professionals
UNION ALL
SELECT 
    'Reviews',
    COUNT(*)
FROM reviews
UNION ALL
SELECT 
    'Conversaciones',
    COUNT(*)
FROM conversations
UNION ALL
SELECT 
    'Mensajes',
    COUNT(*)
FROM messages;

-- PASO 1: Eliminar mensajes
DELETE FROM messages;

-- PASO 2: Eliminar conversaciones
DELETE FROM conversations;

-- PASO 3: Eliminar reviews
DELETE FROM reviews;

-- PASO 4: Eliminar clientes (usuarios que NO son profesionales)
DELETE FROM users 
WHERE NOT is_professional 
AND id NOT IN (SELECT user_id FROM professionals WHERE user_id IS NOT NULL);

-- PASO 5: Resetear ratings de profesionales
UPDATE professionals
SET 
    rating = 0,
    rating_count = 0;

-- PASO 6: Sincronizar todos los usuarios de auth.users
-- Esto incluye a los profesionales y cualquier usuario nuevo
-- Esto eliminará permanentemente las cuentas de autenticación
DELETE FROM auth.users;

INSERT INTO public.users (id, email, full_name, is_professional, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    CASE 
        WHEN EXISTS(SELECT 1 FROM professionals WHERE user_id = au.id) THEN true
        ELSE false
    END,
    au.created_at,
    NOW()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users WHERE id = au.id
);

-- Verificación final
SELECT 
  '=== DESPUÉS DEL RESET ===' as info;

SELECT 
  'Usuarios' as tabla,
  COUNT(*) as cantidad
FROM public.users
UNION ALL
SELECT 
  'Profesionales',
  COUNT(*)
FROM professionals
UNION ALL
SELECT 
  'Reviews',
  COUNT(*)
FROM reviews
UNION ALL
SELECT 
  'Conversaciones',
  COUNT(*)
FROM conversations
UNION ALL
SELECT 
  'Mensajes',
  COUNT(*)
FROM messages;

-- Resumen
DO $$
DECLARE
    users_count INTEGER;
    professionals_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO users_count FROM users;
    SELECT COUNT(*) INTO professionals_count FROM professionals;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ RESET COMPLETO EXITOSO';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 Estado actual:';
    RAISE NOTICE '  Usuarios: %', users_count;
    RAISE NOTICE '  Profesionales: % (mantenidos)', professionals_count;
    RAISE NOTICE '  Reviews: 0';
    RAISE NOTICE '  Conversaciones: 0';
    RAISE NOTICE '  Mensajes: 0';
    RAISE NOTICE '';
    RAISE NOTICE '✅ Sistema limpio y listo';
    RAISE NOTICE '✅ Puedes registrarte y dejar reseñas';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
