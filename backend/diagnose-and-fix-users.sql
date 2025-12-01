-- ============================================
-- DIAGNÓSTICO COMPLETO - Encontrar el error
-- ============================================

-- 1. VER TODAS LAS TABLAS
SELECT '=== TABLAS EXISTENTES ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. ESTRUCTURA DE USERS
SELECT '=== ESTRUCTURA DE USERS ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'users'
ORDER BY ordinal_position;

-- 3. ESTRUCTURA DE PROFESSIONALS
SELECT '=== ESTRUCTURA DE PROFESSIONALS ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'professionals'
ORDER BY ordinal_position;

-- 4. ESTRUCTURA DE REVIEWS
SELECT '=== ESTRUCTURA DE REVIEWS ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'reviews'
ORDER BY ordinal_position;

-- 5. ESTRUCTURA DE JOBS (si existe)
SELECT '=== ESTRUCTURA DE JOBS ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'jobs'
ORDER BY ordinal_position;

-- 6. VER POLÍTICAS RLS ACTUALES
SELECT '=== POLÍTICAS RLS ===' as info;
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as comando
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. VER TRIGGERS ACTUALES
SELECT '=== TRIGGERS ===' as info;
SELECT 
  event_object_table as tabla,
  trigger_name,
  event_manipulation as evento
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY event_object_table, trigger_name;
