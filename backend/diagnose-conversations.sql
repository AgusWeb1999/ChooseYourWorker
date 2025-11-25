-- ==========================================
-- DIAGNÓSTICO: Problema de Conversaciones
-- ==========================================

-- 1. Verificar estructura de la tabla conversations
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns
WHERE table_name = 'conversations'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Verificar foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'conversations';

-- 3. Ver la función get_or_create_conversation
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'get_or_create_conversation'
AND routine_schema = 'public';

-- 4. Verificar si hay usuarios que no están en public.users pero sí en auth.users
SELECT 
    au.id,
    au.email,
    au.created_at,
    CASE 
        WHEN pu.id IS NULL THEN '❌ NO existe en public.users'
        ELSE '✅ Existe en public.users'
    END as estado
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 5. Ver todas las conversaciones existentes (con nombres de usuarios)
SELECT 
    c.id,
    c.participant1_id,
    c.participant2_id,
    u1.display_name as participant1_name,
    u2.display_name as participant2_name,
    c.created_at
FROM conversations c
LEFT JOIN users u1 ON c.participant1_id = u1.id
LEFT JOIN users u2 ON c.participant2_id = u2.id
ORDER BY c.created_at DESC
LIMIT 10;

-- 6. Buscar conversaciones con foreign keys inválidas
SELECT 
    c.id,
    c.participant1_id,
    c.participant2_id,
    CASE WHEN u1.id IS NULL THEN '❌ participant1_id inválido' ELSE '✅' END as participant1_status,
    CASE WHEN u2.id IS NULL THEN '❌ participant2_id inválido' ELSE '✅' END as participant2_status
FROM conversations c
LEFT JOIN users u1 ON c.participant1_id = u1.id
LEFT JOIN users u2 ON c.participant2_id = u2.id
WHERE u1.id IS NULL OR u2.id IS NULL;

-- Resumen
DO $$
DECLARE
    total_conversations INTEGER;
    invalid_conversations INTEGER;
    missing_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_conversations FROM conversations;
    
    SELECT COUNT(*) INTO invalid_conversations 
    FROM conversations c
    LEFT JOIN users u1 ON c.participant1_id = u1.id
    LEFT JOIN users u2 ON c.participant2_id = u2.id
    WHERE u1.id IS NULL OR u2.id IS NULL;
    
    SELECT COUNT(*) INTO missing_users
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 DIAGNÓSTICO DE CONVERSACIONES';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Estadísticas:';
    RAISE NOTICE '  Total conversaciones: %', total_conversations;
    RAISE NOTICE '  Conversaciones con FK inválidas: %', invalid_conversations;
    RAISE NOTICE '  Usuarios sin sincronizar: %', missing_users;
    RAISE NOTICE '';
    
    IF invalid_conversations > 0 THEN
        RAISE NOTICE '⚠️  HAY CONVERSACIONES CON FOREIGN KEYS INVÁLIDAS';
        RAISE NOTICE '   Necesitas ejecutar: fix-conversations.sql';
    END IF;
    
    IF missing_users > 0 THEN
        RAISE NOTICE '⚠️  HAY USUARIOS SIN SINCRONIZAR';
        RAISE NOTICE '   Ejecuta primero: sync-users-now.sql';
        RAISE NOTICE '   Y luego: fix-conversations.sql';
    END IF;
    
    IF invalid_conversations = 0 AND missing_users = 0 THEN
        RAISE NOTICE '✅ TODO ESTÁ CORRECTO';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
