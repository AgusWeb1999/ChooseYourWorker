-- Verificar el usuario específico que está causando el error

-- Ver si el usuario existe en auth.users
SELECT 
    'Usuario en auth.users' as info,
    id,
    email,
    raw_user_meta_data->>'full_name' as full_name,
    raw_user_meta_data->>'role' as role,
    created_at
FROM auth.users 
WHERE id = '67b8281c-8604-414d-8464-88ea778aa6ea';

-- Ver si el usuario existe en public.users
SELECT 
    'Usuario en public.users' as info,
    id,
    email,
    full_name,
    is_professional,
    created_at
FROM public.users 
WHERE id = '67b8281c-8604-414d-8464-88ea778aa6ea';

-- Ver TODOS los usuarios que están en auth pero NO en public
SELECT 
    'Usuarios faltantes en public.users' as info,
    COUNT(*) as total
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- Listar usuarios faltantes
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'full_name' as full_name,
    au.created_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ORDER BY au.created_at DESC;

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
    RAISE NOTICE '📊 DIAGNÓSTICO DE USUARIOS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE 'Usuarios en auth.users:   %', auth_count;
    RAISE NOTICE 'Usuarios en public.users: %', public_count;
    RAISE NOTICE 'Usuarios faltantes:       %', missing_count;
    RAISE NOTICE '';
    
    IF missing_count > 0 THEN
        RAISE NOTICE '⚠️  HAY % USUARIOS SIN SINCRONIZAR', missing_count;
        RAISE NOTICE '   Ejecuta: sync-users-now.sql';
    ELSE
        RAISE NOTICE '✅ Todos los usuarios están sincronizados';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
