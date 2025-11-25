-- ==========================================
-- ARREGLAR: Usuario fantasma en conversations
-- ==========================================
-- Este script sincroniza usuarios que existen en auth.users
-- pero NO en public.users (causa del error de foreign key)

-- PASO 1: Diagnosticar el problema
-- ==========================================

SELECT '=== DIAGNÓSTICO: Usuarios Fantasma ===' as info;

-- Ver usuarios en auth.users que NO están en public.users
SELECT 
    'auth.users' as tabla,
    COUNT(*) as total
FROM auth.users;

SELECT 
    'public.users' as tabla,
    COUNT(*) as total
FROM public.users;

-- Encontrar usuarios fantasma (en auth pero no en public)
SELECT 
    '🔍 Usuarios en auth.users pero NO en public.users' as problema,
    COUNT(*) as cantidad
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- Ver detalles de los usuarios fantasma
SELECT 
    au.id,
    au.email,
    au.created_at,
    '❌ NO SINCRONIZADO' as estado
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ORDER BY au.created_at DESC;

-- PASO 2: Sincronizar usuarios fantasma
-- ==========================================

DO $$
DECLARE
    synced_count INTEGER := 0;
    user_record RECORD;
BEGIN
    RAISE NOTICE '🔄 Iniciando sincronización de usuarios fantasma...';
    
    FOR user_record IN 
        SELECT 
            au.id,
            au.email,
            au.raw_user_meta_data->>'full_name' as full_name,
            au.created_at
        FROM auth.users au
        WHERE NOT EXISTS (
            SELECT 1 FROM public.users pu WHERE pu.id = au.id
        )
    LOOP
        BEGIN
            INSERT INTO public.users (
                id,
                auth_uid,
                email,
                full_name,
                created_at,
                updated_at
            )
            VALUES (
                user_record.id,
                user_record.id,
                user_record.email,
                COALESCE(user_record.full_name, ''),
                user_record.created_at,
                NOW()
            );
            
            synced_count := synced_count + 1;
            RAISE NOTICE '✅ Sincronizado: % (%)', user_record.email, user_record.id;
        EXCEPTION
            WHEN unique_violation THEN
                RAISE NOTICE '⚠️ Ya existe: %', user_record.email;
            WHEN OTHERS THEN
                RAISE WARNING '❌ Error sincronizando %: %', user_record.email, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Sincronización completada';
    RAISE NOTICE '📊 Usuarios sincronizados: %', synced_count;
    RAISE NOTICE '========================================';
END $$;

-- PASO 3: Verificar que se arregló
-- ==========================================

SELECT '=== VERIFICACIÓN POST-SINCRONIZACIÓN ===' as info;

-- ¿Quedan usuarios fantasma?
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No hay usuarios fantasma'
        ELSE '⚠️ Todavía hay ' || COUNT(*) || ' usuarios sin sincronizar'
    END as resultado
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- Ver totales
SELECT 
    (SELECT COUNT(*) FROM auth.users) as auth_users,
    (SELECT COUNT(*) FROM public.users) as public_users,
    (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.users) as diferencia;

-- PASO 4: Verificar conversations
-- ==========================================

SELECT '=== VERIFICAR FOREIGN KEYS EN CONVERSATIONS ===' as info;

-- Ver si hay conversaciones con usuarios inexistentes
SELECT 
    'conversations con participant1_id inválido' as problema,
    COUNT(*) as cantidad
FROM conversations c
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = c.participant1_id
);

SELECT 
    'conversations con participant2_id inválido' as problema,
    COUNT(*) as cantidad
FROM conversations c
WHERE NOT EXISTS (
    SELECT 1 FROM public.users u WHERE u.id = c.participant2_id
);

-- Ver detalles si hay problemas
SELECT 
    c.id as conversation_id,
    c.participant1_id,
    c.participant2_id,
    CASE 
        WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE id = c.participant1_id) 
        THEN '❌ participant1 no existe'
        WHEN NOT EXISTS (SELECT 1 FROM public.users WHERE id = c.participant2_id)
        THEN '❌ participant2 no existe'
        ELSE '✅ OK'
    END as estado
FROM conversations c
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = c.participant1_id)
   OR NOT EXISTS (SELECT 1 FROM public.users WHERE id = c.participant2_id);

-- RESUMEN FINAL
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ DIAGNÓSTICO Y REPARACIÓN COMPLETADO';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 PRÓXIMOS PASOS:';
    RAISE NOTICE '  1. ✅ Usuarios sincronizados';
    RAISE NOTICE '  2. 🔄 Reinicia el frontend (npx expo start --clear)';
    RAISE NOTICE '  3. 🧪 Prueba enviar/recibir mensajes';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
