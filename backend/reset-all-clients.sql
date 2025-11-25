-- ================================================
-- BORRAR TODOS LOS CLIENTES Y REINICIAR
-- ================================================
-- ⚠️ ADVERTENCIA: Este script eliminará todos los usuarios,
-- conversaciones, mensajes y reseñas. Solo usar en desarrollo.

-- PASO 1: Eliminar todos los mensajes
DELETE FROM messages;

-- PASO 2: Eliminar todas las conversaciones
DELETE FROM conversations;

-- PASO 3: Eliminar todas las reseñas
DELETE FROM reviews WHERE TRUE;

-- PASO 4: Eliminar todas las reseñas de clientes (si existe la tabla)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_reviews') THEN
    DELETE FROM client_reviews;
  END IF;
END $$;

-- PASO 5: Desasignar user_id de profesionales (no eliminarlos)
UPDATE professionals SET user_id = NULL;

-- PASO 6: Eliminar todos los usuarios de public.users
DELETE FROM public.users;

-- PASO 7: Eliminar todos los usuarios de auth.users
-- Esto eliminará permanentemente las cuentas de autenticación
DELETE FROM auth.users;

-- PASO 8: Resetear secuencias (si las hay)
-- Si usas secuencias para IDs, esto las reinicia
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'messages', 'conversations', 'reviews')) LOOP
    EXECUTE 'ALTER TABLE ' || quote_ident(r.tablename) || ' ALTER COLUMN id RESTART WITH 1' 
    WHERE EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = r.tablename 
      AND column_name = 'id' 
      AND column_default LIKE 'nextval%'
    );
  END LOOP;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- VERIFICACIÓN FINAL
SELECT 
  'auth.users' as tabla,
  COUNT(*) as registros,
  CASE WHEN COUNT(*) = 0 THEN '✓ Limpio' ELSE '✗ Tiene datos' END as estado
FROM auth.users
UNION ALL
SELECT 
  'public.users',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✓ Limpio' ELSE '✗ Tiene datos' END
FROM public.users
UNION ALL
SELECT 
  'conversations',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✓ Limpio' ELSE '✗ Tiene datos' END
FROM conversations
UNION ALL
SELECT 
  'messages',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✓ Limpio' ELSE '✗ Tiene datos' END
FROM messages
UNION ALL
SELECT 
  'reviews',
  COUNT(*),
  CASE WHEN COUNT(*) = 0 THEN '✓ Limpio' ELSE '✗ Tiene datos' END
FROM reviews
UNION ALL
SELECT 
  'profesionales sin user_id',
  COUNT(*),
  CASE WHEN COUNT(*) = (SELECT COUNT(*) FROM professionals) THEN '✓ Todos desasignados' ELSE '⚠️ Algunos tienen user_id' END
FROM professionals
WHERE user_id IS NULL;

SELECT '✅ LIMPIEZA COMPLETA - TODOS LOS CLIENTES ELIMINADOS' as resultado;
