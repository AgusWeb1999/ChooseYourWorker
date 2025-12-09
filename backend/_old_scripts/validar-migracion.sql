-- ============================================
-- SCRIPT DE VALIDACIÓN POST-MIGRACIÓN
-- ============================================
-- Ejecutar DESPUÉS de 1-setup-inicial-sin-permisos.sql
-- Compatible con Supabase SQL Editor

-- ============================================
-- 📊 1. VERIFICAR ESTRUCTURA DE TABLAS
-- ============================================

-- Verificar columnas en users
SELECT 
  '✓ users' as tabla,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columnas
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('avatar_url', 'jobs_requested_count', 'phone');

-- Verificar columnas en professionals
SELECT 
  '✓ professionals' as tabla,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columnas
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'professionals'
  AND column_name IN ('avatar_url', 'completed_jobs_count');

-- Verificar columnas en reviews
SELECT 
  '✓ reviews' as tabla,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columnas
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reviews'
  AND column_name IN ('client_id', 'professional_id', 'job_id');

-- Verificar tabla jobs existe
SELECT 
  '✓ jobs' as tabla,
  COUNT(*) as columnas_totales,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columnas_principales
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'jobs';

-- Verificar tabla client_reviews existe
SELECT 
  '✓ client_reviews' as tabla,
  COUNT(*) as columnas_totales,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columnas_principales
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'client_reviews';

-- ============================================
-- 🔍 2. VERIFICAR ÍNDICES
-- ============================================

SELECT 
  schemaname,
  tablename,
  indexname,
  '✓' as estado
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('jobs', 'reviews', 'client_reviews')
ORDER BY tablename, indexname;

-- ============================================
-- 🔐 3. VERIFICAR POLÍTICAS RLS
-- ============================================

SELECT 
  schemaname,
  tablename,
  policyname,
  '✓' as estado
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('jobs', 'reviews', 'client_reviews')
ORDER BY tablename, policyname;

-- ============================================
-- ⚡ 4. VERIFICAR TRIGGERS
-- ============================================

SELECT 
  event_object_table as tabla,
  trigger_name,
  event_manipulation as evento,
  action_timing as timing,
  '✓' as estado
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('jobs', 'reviews', 'client_reviews', 'users')
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 📈 5. VERIFICAR FOREIGN KEYS
-- ============================================

SELECT
  tc.table_name as tabla,
  kcu.column_name as columna,
  ccu.table_name AS tabla_referenciada,
  ccu.column_name AS columna_referenciada,
  '✓' as estado
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND tc.table_name IN ('jobs', 'reviews', 'client_reviews')
ORDER BY tc.table_name, kcu.column_name;

-- ============================================
-- ✅ 6. RESUMEN FINAL
-- ============================================

-- ============================================
-- ✅ 6. RESUMEN FINAL
-- ============================================

-- Contar elementos creados
WITH validacion AS (
  SELECT 
    'Tablas nuevas' as elemento,
    COUNT(*) as cantidad
  FROM information_schema.tables
  WHERE table_schema = 'public' 
    AND table_name IN ('jobs', 'client_reviews')
  
  UNION ALL
  
  SELECT 
    'Columnas agregadas' as elemento,
    COUNT(*) as cantidad
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND (
      (table_name = 'users' AND column_name IN ('avatar_url', 'jobs_requested_count', 'phone', 'rating', 'rating_count'))
      OR (table_name = 'professionals' AND column_name IN ('avatar_url', 'completed_jobs_count'))
      OR (table_name = 'reviews' AND column_name = 'job_id')
    )
  
  UNION ALL
  
  SELECT 
    'Índices creados' as elemento,
    COUNT(*) as cantidad
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename IN ('jobs', 'reviews', 'client_reviews')
  
  UNION ALL
  
  SELECT 
    'Políticas RLS' as elemento,
    COUNT(*) as cantidad
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('jobs', 'reviews', 'client_reviews')
  
  UNION ALL
  
  SELECT 
    'Triggers activos' as elemento,
    COUNT(DISTINCT trigger_name) as cantidad
  FROM information_schema.triggers
  WHERE event_object_schema = 'public'
    AND event_object_table IN ('jobs', 'reviews', 'client_reviews', 'users')
)
SELECT 
  elemento,
  cantidad,
  CASE 
    WHEN cantidad > 0 THEN '✅'
    ELSE '❌'
  END as estado
FROM validacion
ORDER BY elemento;

-- Mensaje final
SELECT '🎯 VALIDACIÓN COMPLETA - Si todos los elementos muestran ✅, la migración fue exitosa.' as mensaje;
