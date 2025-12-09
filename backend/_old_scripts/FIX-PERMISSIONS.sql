-- ============================================
-- FIX DE PERMISOS - WORKINGGO
-- ============================================
-- Ejecutar SOLO si 1-setup-inicial.sql falla con error de permisos
-- Este script toma ownership de las tablas necesarias

-- Cambiar owner de tablas existentes
ALTER TABLE IF EXISTS public.users OWNER TO postgres;
ALTER TABLE IF EXISTS public.professionals OWNER TO postgres;
ALTER TABLE IF EXISTS public.reviews OWNER TO postgres;
ALTER TABLE IF EXISTS public.conversations OWNER TO postgres;
ALTER TABLE IF EXISTS public.messages OWNER TO postgres;

-- Cambiar owner de secuencias si existen
ALTER SEQUENCE IF EXISTS public.users_id_seq OWNER TO postgres;
ALTER SEQUENCE IF EXISTS public.professionals_id_seq OWNER TO postgres;
ALTER SEQUENCE IF EXISTS public.reviews_id_seq OWNER TO postgres;

-- Dar permisos completos a postgres
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Verificación
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

SELECT '✅ Permisos corregidos - Ahora ejecuta 1-setup-inicial.sql' as status;
