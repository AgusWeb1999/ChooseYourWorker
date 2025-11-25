-- ============================================
-- VERIFICAR QUE EL TRIGGER ESTÉ FUNCIONANDO
-- ============================================

-- 1. Verificar que el trigger existe
SELECT 
    trigger_name,
    event_manipulation,
    event_object_schema,
    event_object_table,
    action_statement,
    action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 2. Ver la definición de la función handle_new_user
SELECT 
    proname as function_name,
    prosrc as source_code
FROM pg_proc
WHERE proname = 'handle_new_user';

-- 3. Verificar el usuario específico que acabas de crear
SELECT 
    au.id,
    au.email,
    au.raw_user_meta_data->>'user_type' as metadata_user_type,
    au.raw_user_meta_data->>'full_name' as metadata_full_name,
    au.raw_user_meta_data as all_metadata,
    pu.is_professional,
    pu.full_name as db_full_name,
    CASE 
        WHEN au.raw_user_meta_data->>'user_type' = 'worker' AND pu.is_professional THEN '✅ CORRECTO'
        WHEN au.raw_user_meta_data->>'user_type' = 'client' AND NOT pu.is_professional THEN '✅ CORRECTO'
        WHEN au.raw_user_meta_data->>'user_type' = 'worker' AND NOT pu.is_professional THEN '❌ ERROR - Debería ser trabajador'
        WHEN au.raw_user_meta_data->>'user_type' = 'client' AND pu.is_professional THEN '❌ ERROR - Debería ser cliente'
        ELSE '⚠️ Sin metadata de user_type'
    END as diagnostico,
    au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email = 'maximilianogonzale836@gmail.com';

-- 4. Ver los logs/notices de PostgreSQL (si están habilitados)
-- Nota: Puede que no veas nada aquí dependiendo de la configuración
SELECT * FROM pg_stat_activity WHERE query LIKE '%handle_new_user%';

SELECT '🔍 Verificación completada - Revisa los resultados arriba' as status;
