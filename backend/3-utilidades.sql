-- ============================================
-- WORKINGGO - UTILIDADES
-- ============================================
-- Scripts útiles para mantenimiento y limpieza

-- 1. ELIMINAR UN USUARIO COMPLETO
-- ============================================
-- Elimina un usuario y todos sus datos relacionados
-- USAR CON CUIDADO - Esta acción NO se puede deshacer

-- Reemplazar 'EMAIL_DEL_USUARIO' con el email real
DO $$
DECLARE
    v_user_id UUID;
    v_email TEXT := 'EMAIL_DEL_USUARIO'; -- CAMBIAR ESTO
BEGIN
    -- Buscar el usuario
    SELECT id INTO v_user_id FROM public.users WHERE email = v_email;
    
    IF v_user_id IS NULL THEN
        RAISE NOTICE '❌ Usuario no encontrado: %', v_email;
        RETURN;
    END IF;
    
    RAISE NOTICE '🗑️ Eliminando usuario: % (ID: %)', v_email, v_user_id;
    
    -- Eliminar en orden correcto para respetar foreign keys
    DELETE FROM public.messages WHERE sender_id = v_user_id;
    DELETE FROM public.conversations WHERE client_id = v_user_id;
    DELETE FROM public.reviews WHERE client_id = v_user_id;
    
    -- Si es profesional
    DELETE FROM public.conversations WHERE professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = v_user_id
    );
    DELETE FROM public.reviews WHERE professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = v_user_id
    );
    DELETE FROM public.professionals WHERE user_id = v_user_id;
    
    -- Eliminar usuario
    DELETE FROM public.users WHERE id = v_user_id;
    DELETE FROM auth.users WHERE id = v_user_id;
    
    RAISE NOTICE '✅ Usuario eliminado completamente';
END $$;

-- 2. RESETEAR TODOS LOS CLIENTES
-- ============================================
-- Elimina TODOS los usuarios que NO son profesionales
-- USAR SOLO EN DESARROLLO

DO $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Eliminar mensajes de clientes
    DELETE FROM public.messages 
    WHERE sender_id IN (
        SELECT id FROM public.users WHERE is_professional = false
    );
    
    -- Eliminar conversaciones de clientes
    DELETE FROM public.conversations 
    WHERE client_id IN (
        SELECT id FROM public.users WHERE is_professional = false
    );
    
    -- Eliminar reseñas de clientes
    DELETE FROM public.reviews 
    WHERE client_id IN (
        SELECT id FROM public.users WHERE is_professional = false
    );
    
    -- Eliminar clientes de auth.users
    DELETE FROM auth.users 
    WHERE id IN (
        SELECT id FROM public.users WHERE is_professional = false
    );
    
    -- Eliminar clientes de public.users
    DELETE FROM public.users WHERE is_professional = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RAISE NOTICE '✅ Clientes eliminados: %', deleted_count;
END $$;

-- 3. ACTUALIZAR PROFESIONES A ESPAÑOL
-- ============================================
-- Traduce las profesiones de inglés a español

UPDATE public.professionals
SET profession = CASE 
    WHEN profession = 'Plumber' THEN 'Plomero'
    WHEN profession = 'Electrician' THEN 'Electricista'
    WHEN profession = 'Carpenter' THEN 'Carpintero'
    WHEN profession = 'Painter' THEN 'Pintor'
    WHEN profession = 'Mechanic' THEN 'Mecánico'
    WHEN profession = 'Gardener' THEN 'Jardinero'
    WHEN profession = 'Cleaner' THEN 'Personal de Limpieza'
    WHEN profession = 'Chef' THEN 'Chef'
    WHEN profession = 'Driver' THEN 'Conductor'
    WHEN profession = 'Teacher' THEN 'Profesor'
    WHEN profession = 'Developer' THEN 'Desarrollador'
    WHEN profession = 'Designer' THEN 'Diseñador'
    ELSE profession
END
WHERE profession IN (
    'Plumber', 'Electrician', 'Carpenter', 'Painter', 'Mechanic',
    'Gardener', 'Cleaner', 'Chef', 'Driver', 'Teacher', 
    'Developer', 'Designer'
);

-- 4. LIMPIAR AVATARES HUÉRFANOS
-- ============================================
-- Elimina archivos de avatares que ya no tienen usuario

-- Primero, ver qué avatares están en storage pero no en users
SELECT 
    name,
    created_at
FROM storage.objects
WHERE bucket_id = 'avatars'
  AND (storage.foldername(name))[1] NOT IN (
    SELECT id::text FROM public.users
  );

-- Para eliminarlos (descomentar si estás seguro):
/*
DELETE FROM storage.objects
WHERE bucket_id = 'avatars'
  AND (storage.foldername(name))[1] NOT IN (
    SELECT id::text FROM public.users
  );
*/

-- 5. VER ESTADÍSTICAS
-- ============================================

SELECT '=== ESTADÍSTICAS GENERALES ===' as seccion;

SELECT 
    'Usuarios' as tabla,
    COUNT(*) as total,
    COUNT(CASE WHEN is_professional THEN 1 END) as profesionales,
    COUNT(CASE WHEN NOT is_professional THEN 1 END) as clientes
FROM public.users
UNION ALL
SELECT 
    'Professionals' as tabla,
    COUNT(*) as total,
    COUNT(CASE WHEN rating > 0 THEN 1 END) as con_rating,
    AVG(rating)::numeric(3,1) as rating_promedio
FROM public.professionals
UNION ALL
SELECT 
    'Reviews' as tabla,
    COUNT(*) as total,
    AVG(rating)::numeric(3,1) as rating_promedio,
    NULL
FROM public.reviews
UNION ALL
SELECT 
    'Conversations' as tabla,
    COUNT(*) as total,
    NULL,
    NULL
FROM public.conversations
UNION ALL
SELECT 
    'Messages' as tabla,
    COUNT(*) as total,
    NULL,
    NULL
FROM public.messages;

-- 6. VERIFICAR INTEGRIDAD
-- ============================================

SELECT '=== VERIFICACIÓN DE INTEGRIDAD ===' as seccion;

-- Usuarios duplicados
SELECT 
    'Emails duplicados' as check_name,
    COUNT(*) - COUNT(DISTINCT email) as cantidad
FROM public.users
UNION ALL
-- Professionals sin usuario
SELECT 
    'Professionals sin user_id válido' as check_name,
    COUNT(*) as cantidad
FROM public.professionals p
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id)
UNION ALL
-- Mensajes huérfanos
SELECT 
    'Mensajes sin conversación' as check_name,
    COUNT(*) as cantidad
FROM public.messages m
WHERE NOT EXISTS (SELECT 1 FROM conversations c WHERE c.id = m.conversation_id)
UNION ALL
-- Conversaciones rotas
SELECT 
    'Conversaciones con participantes inválidos' as check_name,
    COUNT(*) as cantidad
FROM public.conversations c
WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = c.client_id)
   OR NOT EXISTS (SELECT 1 FROM professionals p WHERE p.id = c.professional_id);

SELECT '✅ Verificación completada' as status;
