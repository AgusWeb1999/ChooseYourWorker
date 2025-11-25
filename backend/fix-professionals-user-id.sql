-- ==========================================
-- ARREGLAR: Professionals sin usuario válido
-- ==========================================

-- PASO 1: Ver el problema en detalle
-- ==========================================

SELECT '=== PROFESSIONALS CON PROBLEMA ===' as info;

SELECT 
    p.id as professional_id,
    p.user_id as user_id_invalido,
    p.display_name,
    p.profession,
    p.email as email_en_professional,
    p.created_at,
    '❌ user_id no existe en users' as problema
FROM professionals p
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = p.user_id
)
ORDER BY p.created_at DESC;

-- Ver si hay usuarios en users que podrían ser estos professionals
SELECT '=== USUARIOS DISPONIBLES ===' as info;

SELECT 
    u.id as user_id,
    u.email,
    u.full_name,
    u.is_professional,
    CASE 
        WHEN EXISTS (SELECT 1 FROM professionals WHERE user_id = u.id)
        THEN '✅ Ya tiene professional'
        ELSE '⚠️ Sin professional'
    END as estado
FROM users u
ORDER BY u.created_at DESC;

-- PASO 2: Arreglar professionals huérfanos
-- ==========================================

DO $$
DECLARE
    prof_record RECORD;
    matching_user_id UUID;
    fixed_count INTEGER := 0;
BEGIN
    RAISE NOTICE '🔧 Iniciando reparación de professionals...';
    RAISE NOTICE '';
    
    FOR prof_record IN 
        SELECT 
            p.id,
            p.user_id,
            p.display_name,
            p.email
        FROM professionals p
        WHERE NOT EXISTS (
            SELECT 1 FROM users u WHERE u.id = p.user_id
        )
    LOOP
        matching_user_id := NULL;
        
        -- Intentar encontrar usuario por email
        IF prof_record.email IS NOT NULL THEN
            SELECT id INTO matching_user_id
            FROM users
            WHERE email = prof_record.email
            LIMIT 1;
        END IF;
        
        -- Si no hay email o no se encontró, buscar por nombre
        IF matching_user_id IS NULL THEN
            SELECT id INTO matching_user_id
            FROM users
            WHERE full_name = prof_record.display_name
            LIMIT 1;
        END IF;
        
        -- Si aún no se encuentra, tomar el primer usuario disponible que sea professional
        IF matching_user_id IS NULL THEN
            SELECT id INTO matching_user_id
            FROM users
            WHERE is_professional = true
            AND NOT EXISTS (SELECT 1 FROM professionals WHERE user_id = users.id)
            LIMIT 1;
        END IF;
        
        -- Si encontramos un usuario, actualizar
        IF matching_user_id IS NOT NULL THEN
            UPDATE professionals
            SET user_id = matching_user_id
            WHERE id = prof_record.id;
            
            fixed_count := fixed_count + 1;
            RAISE NOTICE '✅ Fixed: % → user: %', prof_record.display_name, matching_user_id;
        ELSE
            RAISE WARNING '❌ No se encontró usuario para: % (id: %)', prof_record.display_name, prof_record.id;
            RAISE NOTICE '📋 Considera eliminar este professional o crear un usuario manualmente';
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ Reparación completada';
    RAISE NOTICE '📊 Professionals arreglados: %', fixed_count;
    RAISE NOTICE '========================================';
END $$;

-- PASO 3: Verificar que se arregló
-- ==========================================

SELECT '=== VERIFICACIÓN POST-REPARACIÓN ===' as info;

-- ¿Quedan professionals sin usuario?
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todos los professionals tienen usuario válido'
        ELSE '⚠️ Todavía hay ' || COUNT(*) || ' professionals sin usuario válido'
    END as resultado
FROM professionals p
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = p.user_id
);

-- Ver estado final
SELECT 
    p.id as professional_id,
    p.user_id,
    p.display_name,
    p.profession,
    u.email,
    u.full_name,
    CASE 
        WHEN u.id IS NULL THEN '❌ USER NO EXISTE'
        ELSE '✅ OK'
    END as estado
FROM professionals p
LEFT JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC;

-- PASO 4: Eliminar professionals huérfanos (OPCIONAL)
-- ==========================================
-- Solo ejecutar esta parte si el paso 2 no pudo arreglar algunos professionals

/*
DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Eliminar professionals sin usuario válido
    DELETE FROM professionals p
    WHERE NOT EXISTS (
        SELECT 1 FROM users u WHERE u.id = p.user_id
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🗑️  Professionals huérfanos eliminados: %', deleted_count;
    RAISE NOTICE '========================================';
END $$;
*/

-- RESUMEN FINAL
-- ==========================================

DO $$
DECLARE
    total_professionals INTEGER;
    professionals_sin_user INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_professionals FROM professionals;
    
    SELECT COUNT(*) INTO professionals_sin_user
    FROM professionals p
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id);
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 ESTADO FINAL';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Total professionals: %', total_professionals;
    RAISE NOTICE 'Professionals sin user válido: %', professionals_sin_user;
    RAISE NOTICE '========================================';
    
    IF professionals_sin_user = 0 THEN
        RAISE NOTICE '✅ PROBLEMA RESUELTO';
        RAISE NOTICE '📋 Ahora puedes dejar reseñas sin problemas';
    ELSE
        RAISE NOTICE '⚠️ TODAVÍA HAY PROFESSIONALS SIN USUARIO';
        RAISE NOTICE '📋 Opción 1: Crear usuarios manualmente para ellos';
        RAISE NOTICE '📋 Opción 2: Descomentar la sección de eliminación';
    END IF;
    
    RAISE NOTICE '========================================';
END $$;
