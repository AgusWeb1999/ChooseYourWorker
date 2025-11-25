-- ================================================
-- SINCRONIZACIÓN RÁPIDA: auth.users → public.users
-- ================================================

-- Ver el problema actual
SELECT '=== USUARIOS DESINCRONIZADOS ===' as diagnostico;

SELECT 
  'auth.users' as tabla,
  COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
  'public.users',
  COUNT(*)
FROM public.users;

-- Ver usuarios que están en auth.users pero NO en public.users
SELECT '=== USUARIOS FALTANTES EN PUBLIC.USERS ===' as diagnostico;

SELECT 
  au.id,
  au.email,
  au.created_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
);

-- SINCRONIZAR: Copiar usuarios de auth.users a public.users
INSERT INTO public.users (id, email, full_name, is_professional, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email) as full_name,
  false as is_professional,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
WHERE NOT EXISTS (
  SELECT 1 FROM public.users pu WHERE pu.id = au.id
)
ON CONFLICT (id) DO UPDATE 
SET 
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  updated_at = NOW();

-- Verificar sincronización
SELECT '=== DESPUÉS DE SINCRONIZAR ===' as diagnostico;

SELECT 
  'auth.users' as tabla,
  COUNT(*) as total
FROM auth.users
UNION ALL
SELECT 
  'public.users',
  COUNT(*)
FROM public.users
UNION ALL
SELECT 
  'Diferencia (debe ser 0)',
  (SELECT COUNT(*) FROM auth.users) - (SELECT COUNT(*) FROM public.users);

-- Ver todos los usuarios sincronizados
SELECT '=== USUARIOS SINCRONIZADOS ===' as diagnostico;

SELECT 
  u.id,
  u.email,
  u.full_name,
  u.is_professional,
  CASE 
    WHEN EXISTS (SELECT 1 FROM auth.users WHERE id = u.id) THEN '✓'
    ELSE '✗'
  END as en_auth
FROM public.users u
ORDER BY u.created_at DESC;

SELECT '✅ SINCRONIZACIÓN COMPLETA' as resultado;
