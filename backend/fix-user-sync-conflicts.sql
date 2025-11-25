-- ==========================================
-- RESOLVER: Duplicados de Email con IDs Diferentes
-- ==========================================

-- DIAGNÓSTICO: Ver el problema
SELECT 
    '=== USUARIOS EN AUTH.USERS QUE NO PUEDEN SINCRONIZAR ===' as diagnostico;

SELECT 
    au.id as auth_id,
    au.email,
    au.raw_user_meta_data->>'full_name' as auth_full_name,
    pu.id as public_id,
    pu.full_name as public_full_name,
    'Email existe pero con ID diferente' as problema
FROM auth.users au
INNER JOIN public.users pu ON pu.email = au.email
WHERE pu.id != au.id;

-- SOLUCIÓN: Usar el ID de auth.users como el correcto y actualizar public.users
-- Esto es seguro porque auth.users es la fuente de verdad

DO $$
DECLARE
    conflicting_record RECORD;
    temp_email TEXT;
BEGIN
    RAISE NOTICE 'Resolviendo duplicados de email...';
    
    FOR conflicting_record IN 
        SELECT 
            au.id as correct_id,
            au.email as email,
            pu.id as old_id,
            COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
            COALESCE((au.raw_user_meta_data->>'role')::text = 'professional', false) as is_professional
        FROM auth.users au
        INNER JOIN public.users pu ON pu.email = au.email
        WHERE pu.id != au.id
    LOOP
        RAISE NOTICE 'Procesando: % (ID correcto: %, ID antiguo: %)', 
            conflicting_record.email, 
            conflicting_record.correct_id, 
            conflicting_record.old_id;
        
        -- Cambiar temporalmente el email del registro antiguo
        temp_email := conflicting_record.email || '.OLD.' || conflicting_record.old_id;
        
        UPDATE public.users 
        SET email = temp_email
        WHERE id = conflicting_record.old_id;
        
        RAISE NOTICE '  ✓ Email antiguo cambiado temporalmente';
        
        -- Insertar el usuario correcto con el ID de auth
        INSERT INTO public.users (id, email, full_name, is_professional, created_at, updated_at)
        VALUES (
            conflicting_record.correct_id,
            conflicting_record.email,
            conflicting_record.full_name,
            conflicting_record.is_professional,
            NOW(),
            NOW()
        )
        ON CONFLICT (id) DO UPDATE
        SET 
            email = EXCLUDED.email,
            full_name = EXCLUDED.full_name,
            is_professional = EXCLUDED.is_professional,
            updated_at = NOW();
        
        RAISE NOTICE '  ✓ Usuario correcto insertado/actualizado';
        
        -- Eliminar el registro antiguo
        DELETE FROM public.users WHERE id = conflicting_record.old_id;
        
        RAISE NOTICE '  ✓ Registro antiguo eliminado';
        RAISE NOTICE '';
    END LOOP;
    
    RAISE NOTICE 'Duplicados resueltos.';
END $$;

-- Ahora sincronizar usuarios restantes
INSERT INTO public.users (id, email, full_name, is_professional, created_at, updated_at)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
    COALESCE((au.raw_user_meta_data->>'role')::text = 'professional', false) as is_professional,
    au.created_at,
    NOW()
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- Verificar resultado
SELECT 
    '=== VERIFICACIÓN FINAL ===' as diagnostico;

SELECT 
    'Usuarios en auth.users' as tipo,
    COUNT(*) as cantidad
FROM auth.users
UNION ALL
SELECT 
    'Usuarios en public.users',
    COUNT(*)
FROM public.users
UNION ALL
SELECT 
    'Usuarios sin sincronizar',
    COUNT(*)
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);

-- Resumen
DO $$
DECLARE
    auth_count INTEGER;
    public_count INTEGER;
    missing_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO auth_count FROM auth.users;
    SELECT COUNT(*) INTO public_count FROM public.users;
    SELECT COUNT(*) INTO missing_count 
    FROM auth.users au
    WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ SINCRONIZACIÓN COMPLETA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Usuarios en auth.users:   %', auth_count;
    RAISE NOTICE 'Usuarios en public.users: %', public_count;
    RAISE NOTICE 'Usuarios sin sincronizar: %', missing_count;
    RAISE NOTICE '';
    
    IF missing_count = 0 THEN
        RAISE NOTICE '✅ Todos los usuarios están sincronizados correctamente';
    ELSE
        RAISE NOTICE '⚠️  Aún hay % usuarios sin sincronizar', missing_count;
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
