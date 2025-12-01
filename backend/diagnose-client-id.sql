-- ============================================
-- DIAGNÓSTICO: Encontrar referencias a client_id
-- ============================================

-- 1. Ver todas las políticas RLS que mencionan client_id
SELECT 
  schemaname,
  tablename,
  policyname,
  pg_get_expr(qual, (schemaname||'.'||tablename)::regclass) as using_expression,
  pg_get_expr(with_check, (schemaname||'.'||tablename)::regclass) as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    pg_get_expr(qual, (schemaname||'.'||tablename)::regclass) LIKE '%client_id%'
    OR pg_get_expr(with_check, (schemaname||'.'||tablename)::regclass) LIKE '%client_id%'
  )
ORDER BY tablename, policyname;

-- 2. Ver todos los triggers y sus funciones
SELECT 
  t.tgname as trigger_name,
  c.relname as table_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND NOT t.tgisinternal
  AND pg_get_functiondef(p.oid) LIKE '%client_id%'
ORDER BY c.relname, t.tgname;

-- 3. Ver estructura EXACTA de la tabla reviews
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'reviews'
ORDER BY ordinal_position;

-- 4. Ver si hay vistas que usen client_id
SELECT 
  table_name,
  view_definition
FROM information_schema.views
WHERE table_schema = 'public'
  AND view_definition LIKE '%client_id%';
