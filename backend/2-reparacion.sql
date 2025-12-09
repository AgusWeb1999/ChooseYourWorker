-- ============================================
-- WORKINGGO - REPARACIÓN Y MANTENIMIENTO
-- ============================================
-- Este script repara problemas comunes en la base de datos
-- Ejecutar cuando haya inconsistencias o errores

-- 1. REPARAR USUARIOS DUPLICADOS
-- ============================================
-- Elimina usuarios duplicados por email, manteniendo el más reciente

DO $$
DECLARE
    duplicates_count INTEGER;
BEGIN
    -- Eliminar duplicados, dejando el más reciente
    DELETE FROM public.users
    WHERE id IN (
        SELECT id
        FROM (
            SELECT id,
                   ROW_NUMBER() OVER (PARTITION BY email ORDER BY created_at DESC) as rn
            FROM public.users
        ) t
        WHERE t.rn > 1
    );
    
    GET DIAGNOSTICS duplicates_count = ROW_COUNT;
    RAISE NOTICE '✅ Usuarios duplicados eliminados: %', duplicates_count;
END $$;

-- Agregar constraint único en email
ALTER TABLE public.users 
DROP CONSTRAINT IF EXISTS users_email_unique;

ALTER TABLE public.users 
ADD CONSTRAINT users_email_unique UNIQUE (email);

-- 2. SINCRONIZAR USUARIOS DE AUTH A PUBLIC
-- ============================================
-- Sincroniza usuarios que están en auth.users pero no en public.users

INSERT INTO public.users (id, auth_uid, email, full_name, is_professional, created_at, updated_at)
SELECT 
    au.id,
    au.id as auth_uid,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', '') as full_name,
    CASE 
        WHEN au.raw_user_meta_data->>'user_type' = 'worker' THEN true
        ELSE false
    END as is_professional,
    au.created_at,
    NOW() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
    SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO NOTHING;

-- 3. SINCRONIZAR AVATARES
-- ============================================
-- Copia avatar_url de users a professionals

UPDATE public.professionals p
SET 
    avatar_url = u.avatar_url,
    updated_at = NOW()
FROM public.users u
WHERE p.user_id = u.id
  AND u.avatar_url IS NOT NULL
  AND (p.avatar_url IS NULL OR p.avatar_url != u.avatar_url);

-- 4. REPARAR PROFESSIONALS SIN USER_ID VÁLIDO
-- ============================================
-- Intenta vincular professionals huérfanos con usuarios

DO $$
DECLARE
    prof_record RECORD;
    matching_user_id UUID;
    fixed_count INTEGER := 0;
BEGIN
    FOR prof_record IN 
        SELECT p.id, p.user_id, p.display_name, p.email
        FROM professionals p
        WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id)
    LOOP
        matching_user_id := NULL;
        
        -- Buscar por email
        IF prof_record.email IS NOT NULL THEN
            SELECT id INTO matching_user_id
            FROM users WHERE email = prof_record.email LIMIT 1;
        END IF;
        
        -- Buscar por nombre
        IF matching_user_id IS NULL THEN
            SELECT id INTO matching_user_id
            FROM users WHERE full_name = prof_record.display_name LIMIT 1;
        END IF;
        
        -- Actualizar si encontramos match
        IF matching_user_id IS NOT NULL THEN
            UPDATE professionals SET user_id = matching_user_id WHERE id = prof_record.id;
            fixed_count := fixed_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE '✅ Professionals reparados: %', fixed_count;
END $$;

-- 5. REPARAR CHAT
-- ============================================
-- Repara foreign keys y conversaciones rotas

-- Eliminar mensajes sin conversación válida
DELETE FROM public.messages
WHERE conversation_id NOT IN (SELECT id FROM public.conversations);

-- Eliminar conversaciones sin participantes válidos
DELETE FROM public.conversations
WHERE client_id NOT IN (SELECT id FROM public.users)
   OR professional_id NOT IN (SELECT id FROM public.professionals);

-- 6. RECALCULAR RATINGS
-- ============================================
-- Recalcula todos los ratings de profesionales basado en sus reseñas

UPDATE public.professionals p
SET 
    rating = COALESCE((
        SELECT ROUND(AVG(r.rating)::numeric, 1)
        FROM public.reviews r
        WHERE r.professional_id = p.id
    ), 0),
    rating_count = COALESCE((
        SELECT COUNT(*)::integer
        FROM public.reviews r
        WHERE r.professional_id = p.id
    ), 0),
    updated_at = NOW();

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT '✅ Reparación completada' as status;

-- Ver estado de usuarios
SELECT 
    COUNT(*) as total_users,
    COUNT(DISTINCT email) as emails_unicos,
    COUNT(*) - COUNT(DISTINCT email) as duplicados
FROM public.users;

-- Ver estado de professionals
SELECT 
    COUNT(*) as total_professionals,
    COUNT(CASE WHEN EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id) THEN 1 END) as con_usuario_valido,
    COUNT(CASE WHEN NOT EXISTS (SELECT 1 FROM users u WHERE u.id = p.user_id) THEN 1 END) as sin_usuario_valido
FROM public.professionals p;

-- Ver estado de ratings
SELECT 
    COUNT(*) as total_professionals,
    COUNT(CASE WHEN rating > 0 THEN 1 END) as con_rating,
    AVG(rating) as rating_promedio
FROM public.professionals;
