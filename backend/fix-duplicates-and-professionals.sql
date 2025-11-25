-- ==========================================
-- SOLUCIÓN COMPLETA: Duplicados + Professionals
-- ==========================================

-- PASO 1: DIAGNÓSTICO COMPLETO
-- ==========================================

SELECT '========================================' as separador;
SELECT '🔍 DIAGNÓSTICO COMPLETO' as titulo;
SELECT '========================================' as separador;

-- Ver emails duplicados
SELECT 
    '1. EMAILS DUPLICADOS' as problema,
    COUNT(*) as cantidad
FROM (
    SELECT email, COUNT(*) as count
    FROM public.users
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
) duplicates;

-- Ver professionals sin usuario
SELECT 
    '2. PROFESSIONALS SIN USER' as problema,
    COUNT(*) as cantidad
FROM professionals p
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = p.user_id
);

-- Ver detalles de duplicados
SELECT 
    email,
    COUNT(*) as cantidad,
    ARRAY_AGG(id ORDER BY created_at) as user_ids,
    ARRAY_AGG(created_at ORDER BY created_at) as fechas
FROM public.users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Ver professionals problemáticos
SELECT 
    p.id as professional_id,
    p.user_id,
    p.display_name,
    p.profession,
    '❌ user_id no existe' as problema
FROM professionals p
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = p.user_id
)
ORDER BY p.created_at DESC;

-- PASO 2: LIMPIAR DUPLICADOS EN USERS
-- ==========================================

DO $$
DECLARE
    duplicate_email RECORD;
    user_to_keep UUID;
    user_to_delete UUID;
    deleted_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🧹 PASO 1: LIMPIANDO EMAILS DUPLICADOS';
    RAISE NOTICE '========================================';
    
    FOR duplicate_email IN 
        SELECT email, ARRAY_AGG(id ORDER BY created_at) as user_ids
        FROM public.users
        WHERE email IS NOT NULL
        GROUP BY email
        HAVING COUNT(*) > 1
    LOOP
        user_to_keep := duplicate_email.user_ids[1];
        
        RAISE NOTICE '📧 Email: %', duplicate_email.email;
        RAISE NOTICE '  ✅ Manteniendo: %', user_to_keep;
        
        FOR i IN 2..ARRAY_LENGTH(duplicate_email.user_ids, 1)
        LOOP
            user_to_delete := duplicate_email.user_ids[i];
            
            -- Transferir professionals
            UPDATE public.professionals
            SET user_id = user_to_keep
            WHERE user_id = user_to_delete;
            
            -- Transferir reviews recibidas
            UPDATE public.reviews
            SET professional_id = (
                SELECT id FROM public.professionals WHERE user_id = user_to_keep
            )
            WHERE professional_id IN (
                SELECT id FROM public.professionals WHERE user_id = user_to_delete
            );
            
            -- Transferir reviews dadas
            UPDATE public.reviews
            SET client_id = user_to_keep
            WHERE client_id = user_to_delete;
            
            -- Transferir chats
            UPDATE public.conversations
            SET participant1_id = user_to_keep
            WHERE participant1_id = user_to_delete;
            
            UPDATE public.conversations
            SET participant2_id = user_to_keep
            WHERE participant2_id = user_to_delete;
            
            -- Transferir mensajes
            UPDATE public.messages
            SET sender_id = user_to_keep
            WHERE sender_id = user_to_delete;
            
            -- Eliminar el duplicado
            DELETE FROM public.users WHERE id = user_to_delete;
            
            deleted_count := deleted_count + 1;
            RAISE NOTICE '  ❌ Eliminado: %', user_to_delete;
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Duplicados eliminados: %', deleted_count;
END $$;

-- PASO 3: ARREGLAR PROFESSIONALS SIN USER
-- ==========================================

DO $$
DECLARE
    prof_record RECORD;
    matching_user_id UUID;
    fixed_count INTEGER := 0;
    deleted_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🔧 PASO 2: ARREGLANDO PROFESSIONALS';
    RAISE NOTICE '========================================';
    
    FOR prof_record IN 
        SELECT 
            p.id,
            p.user_id,
            p.display_name
        FROM professionals p
        WHERE NOT EXISTS (
            SELECT 1 FROM users u WHERE u.id = p.user_id
        )
    LOOP
        matching_user_id := NULL;
        
        -- Buscar por nombre
        SELECT id INTO matching_user_id
        FROM users
        WHERE full_name = prof_record.display_name
        LIMIT 1;
        
        -- Buscar cualquier professional disponible
        IF matching_user_id IS NULL THEN
            SELECT id INTO matching_user_id
            FROM users
            WHERE is_professional = true
            AND NOT EXISTS (SELECT 1 FROM professionals WHERE user_id = users.id)
            LIMIT 1;
        END IF;
        
        IF matching_user_id IS NOT NULL THEN
            UPDATE professionals
            SET user_id = matching_user_id
            WHERE id = prof_record.id;
            
            fixed_count := fixed_count + 1;
            RAISE NOTICE '✅ Arreglado: % → %', prof_record.display_name, matching_user_id;
        ELSE
            -- Si no se encuentra usuario, eliminar el professional
            DELETE FROM professionals WHERE id = prof_record.id;
            deleted_count := deleted_count + 1;
            RAISE NOTICE '❌ Eliminado: % (sin usuario)', prof_record.display_name;
        END IF;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE '✅ Professionals arreglados: %', fixed_count;
    RAISE NOTICE '🗑️  Professionals eliminados: %', deleted_count;
END $$;

-- PASO 4: PREVENIR DUPLICADOS FUTUROS
-- ==========================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🛡️  PASO 3: PREVINIENDO DUPLICADOS';
    RAISE NOTICE '========================================';
    
    -- Agregar constraint UNIQUE si no existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique'
    ) THEN
        ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE(email);
        RAISE NOTICE '✅ Constraint UNIQUE agregado';
    ELSE
        RAISE NOTICE '⚠️  Constraint UNIQUE ya existe';
    END IF;
END $$;

-- Mejorar trigger de sincronización
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    existing_user UUID;
BEGIN
    -- Verificar si existe usuario con este email
    SELECT id INTO existing_user FROM public.users WHERE email = NEW.email;
    
    IF existing_user IS NOT NULL THEN
        RAISE NOTICE 'Usuario con email % ya existe, saltando', NEW.email;
        RETURN NEW;
    END IF;
    
    -- Verificar si existe usuario con este ID
    SELECT id INTO existing_user FROM public.users WHERE id = NEW.id;
    
    IF existing_user IS NOT NULL THEN
        RAISE NOTICE 'Usuario con ID % ya existe, saltando', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Insertar usuario
    BEGIN
        INSERT INTO public.users (id, auth_uid, email, full_name, created_at, updated_at)
        VALUES (NEW.id, NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NOW(), NOW());
        
        RAISE NOTICE 'Usuario sincronizado: %', NEW.email;
    EXCEPTION
        WHEN unique_violation THEN
            RAISE NOTICE 'Error de unicidad al insertar %', NEW.email;
        WHEN OTHERS THEN
            RAISE WARNING 'Error al sincronizar %: %', NEW.email, SQLERRM;
    END;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- PASO 5: VERIFICACIÓN FINAL
-- ==========================================

SELECT '========================================' as separador;
SELECT '✅ VERIFICACIÓN FINAL' as titulo;
SELECT '========================================' as separador;

-- Duplicados
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ No hay emails duplicados'
        ELSE '❌ Todavía hay ' || COUNT(*) || ' emails duplicados'
    END as resultado_duplicados
FROM (
    SELECT email, COUNT(*) as count
    FROM public.users
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
) duplicates;

-- Professionals sin user
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Todos los professionals tienen usuario válido'
        ELSE '❌ Todavía hay ' || COUNT(*) || ' professionals sin usuario'
    END as resultado_professionals
FROM professionals p
WHERE NOT EXISTS (
    SELECT 1 FROM users u WHERE u.id = p.user_id
);

-- Constraint
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_unique')
        THEN '✅ Constraint UNIQUE existe'
        ELSE '❌ Constraint UNIQUE no existe'
    END as resultado_constraint;

-- Estado final
SELECT 
    (SELECT COUNT(*) FROM users) as total_users,
    (SELECT COUNT(DISTINCT email) FROM users) as emails_unicos,
    (SELECT COUNT(*) FROM professionals) as total_professionals,
    (SELECT COUNT(*) FROM reviews) as total_reviews;

-- RESUMEN
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 REPARACIÓN COMPLETADA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Cambios realizados:';
    RAISE NOTICE '  ✅ Emails duplicados limpiados';
    RAISE NOTICE '  ✅ Professionals arreglados/eliminados';
    RAISE NOTICE '  ✅ Constraint UNIQUE agregado';
    RAISE NOTICE '  ✅ Trigger mejorado';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximos pasos:';
    RAISE NOTICE '  1. Reinicia el frontend';
    RAISE NOTICE '  2. Prueba dejar una reseña';
    RAISE NOTICE '  3. Verifica que no se crean más duplicados';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
