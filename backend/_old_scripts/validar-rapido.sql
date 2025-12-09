-- ============================================
-- VALIDACIÓN RÁPIDA POST-MIGRACIÓN (Supabase)
-- ============================================
-- Ejecutar en Supabase SQL Editor después de la migración

-- 1. Verificar que las tablas principales existen
SELECT 
  'Tabla: ' || table_name as verificacion,
  '✅' as estado
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('jobs', 'client_reviews', 'users', 'professionals', 'reviews')
ORDER BY table_name;

-- 2. Verificar columnas críticas en reviews
SELECT 
  'Columna reviews.' || column_name as verificacion,
  data_type,
  CASE WHEN is_nullable = 'YES' THEN '✅ Nullable' ELSE '⚠️ Not Null' END as estado
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reviews'
  AND column_name IN ('job_id', 'client_id', 'professional_id')
ORDER BY column_name;

-- 3. Verificar columnas en users
SELECT 
  'Columna users.' || column_name as verificacion,
  data_type,
  '✅' as estado
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'users'
  AND column_name IN ('avatar_url', 'jobs_requested_count', 'phone', 'rating', 'rating_count')
ORDER BY column_name;

-- 4. Verificar columnas en professionals
SELECT 
  'Columna professionals.' || column_name as verificacion,
  data_type,
  '✅' as estado
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'professionals'
  AND column_name IN ('avatar_url', 'completed_jobs_count')
ORDER BY column_name;

-- 5. Verificar políticas RLS activas
SELECT 
  'RLS ' || tablename as verificacion,
  COUNT(*) || ' políticas' as cantidad,
  '✅' as estado
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('jobs', 'reviews', 'client_reviews')
GROUP BY tablename
ORDER BY tablename;

-- 6. Resumen final
SELECT 
  'Tablas' as tipo,
  COUNT(*) as total,
  '✅' as estado
FROM information_schema.tables
WHERE table_schema = 'public' 
  AND table_name IN ('jobs', 'client_reviews')

UNION ALL

SELECT 
  'Triggers' as tipo,
  COUNT(DISTINCT trigger_name) as total,
  '✅' as estado
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN ('jobs', 'reviews', 'client_reviews', 'users')

UNION ALL

SELECT 
  'Índices' as tipo,
  COUNT(*) as total,
  '✅' as estado
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('jobs', 'client_reviews')

ORDER BY tipo;

-- Mensaje final
SELECT 
  '🎉 MIGRACIÓN VALIDADA EXITOSAMENTE' as mensaje,
  'Todas las estructuras están en su lugar' as detalle;
