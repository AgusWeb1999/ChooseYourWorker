-- ============================================
-- VERIFICAR QUE EL REGISTRO FUNCIONA CORRECTAMENTE
-- ============================================

-- 1. Ver todos los usuarios registrados con su tipo
SELECT 
  id,
  email,
  full_name,
  is_professional,
  CASE 
    WHEN is_professional THEN '🛠️ TRABAJADOR'
    ELSE '🔍 CLIENTE'
  END as tipo,
  created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 2. Ver los metadatos guardados en auth.users
SELECT 
  id,
  email,
  raw_user_meta_data->>'full_name' as nombre,
  raw_user_meta_data->>'user_type' as user_type,
  created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 3. Verificar que hay correspondencia entre auth.users y public.users
SELECT 
  au.email,
  au.raw_user_meta_data->>'user_type' as metadata_type,
  pu.is_professional,
  CASE 
    WHEN au.raw_user_meta_data->>'user_type' = 'worker' AND pu.is_professional THEN '✅ OK'
    WHEN au.raw_user_meta_data->>'user_type' = 'client' AND NOT pu.is_professional THEN '✅ OK'
    ELSE '❌ ERROR'
  END as estado
FROM auth.users au
JOIN public.users pu ON au.id = pu.id
ORDER BY au.created_at DESC
LIMIT 10;

-- 4. Contar usuarios por tipo
SELECT 
  CASE 
    WHEN is_professional THEN '🛠️ Trabajadores'
    ELSE '🔍 Clientes'
  END as tipo,
  COUNT(*) as cantidad
FROM public.users
GROUP BY is_professional;
