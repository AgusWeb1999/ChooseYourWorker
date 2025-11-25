-- ============================================
-- DIAGNÓSTICO Y ARREGLO DE USUARIOS MAL SINCRONIZADOS
-- ============================================

-- 1. Ver qué usuarios tenemos y sus metadatos
SELECT 
  au.id,
  au.email,
  au.raw_user_meta_data->>'user_type' as metadata_user_type,
  au.raw_user_meta_data->>'full_name' as metadata_name,
  pu.full_name as db_name,
  pu.is_professional,
  CASE 
    WHEN au.raw_user_meta_data->>'user_type' = 'worker' AND pu.is_professional THEN '✅ Correcto'
    WHEN au.raw_user_meta_data->>'user_type' = 'client' AND NOT pu.is_professional THEN '✅ Correcto'
    WHEN au.raw_user_meta_data->>'user_type' = 'worker' AND NOT pu.is_professional THEN '❌ DEBE SER TRABAJADOR'
    WHEN au.raw_user_meta_data->>'user_type' = 'client' AND pu.is_professional THEN '❌ DEBE SER CLIENTE'
    WHEN au.raw_user_meta_data->>'user_type' IS NULL THEN '⚠️ Sin metadata'
    ELSE '❓ Desconocido'
  END as estado,
  au.created_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC;

-- 2. Contar cuántos están mal
SELECT 
  CASE 
    WHEN au.raw_user_meta_data->>'user_type' = 'worker' AND pu.is_professional THEN '✅ Correctos'
    WHEN au.raw_user_meta_data->>'user_type' = 'client' AND NOT pu.is_professional THEN '✅ Correctos'
    ELSE '❌ Incorrectos'
  END as estado,
  COUNT(*) as cantidad
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.raw_user_meta_data->>'user_type' IS NOT NULL
GROUP BY estado;

-- ============================================
-- ARREGLO: SINCRONIZAR CORRECTAMENTE
-- ============================================

-- 3. Arreglar todos los usuarios que están mal sincronizados
UPDATE public.users pu
SET 
  is_professional = (au.raw_user_meta_data->>'user_type' = 'worker'),
  updated_at = NOW()
FROM auth.users au
WHERE pu.id = au.id
  AND au.raw_user_meta_data->>'user_type' IS NOT NULL
  AND (
    (au.raw_user_meta_data->>'user_type' = 'worker' AND NOT pu.is_professional)
    OR
    (au.raw_user_meta_data->>'user_type' = 'client' AND pu.is_professional)
  );

-- 4. Verificar que se arreglaron
SELECT 
  au.email,
  au.raw_user_meta_data->>'user_type' as metadata_type,
  pu.is_professional,
  CASE 
    WHEN pu.is_professional THEN '🛠️ TRABAJADOR'
    ELSE '🔍 CLIENTE'
  END as tipo_en_db,
  CASE 
    WHEN au.raw_user_meta_data->>'user_type' = 'worker' AND pu.is_professional THEN '✅ OK'
    WHEN au.raw_user_meta_data->>'user_type' = 'client' AND NOT pu.is_professional THEN '✅ OK'
    ELSE '❌ TODAVÍA MAL'
  END as estado
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
WHERE au.raw_user_meta_data->>'user_type' IS NOT NULL
ORDER BY au.created_at DESC;

-- 5. Ver cuántos profesionales tienen perfil completo
SELECT 
  u.email,
  u.full_name,
  u.is_professional,
  CASE 
    WHEN u.is_professional AND p.id IS NOT NULL THEN '✅ Perfil completo'
    WHEN u.is_professional AND p.id IS NULL THEN '⚠️ Falta completar perfil'
    ELSE 'N/A (cliente)'
  END as estado_perfil
FROM public.users u
LEFT JOIN public.professionals p ON p.user_id = u.id
WHERE u.is_professional = true
ORDER BY u.created_at DESC;

SELECT '✅ Script de diagnóstico y arreglo completado' as resultado;
