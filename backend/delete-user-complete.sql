-- ================================================
-- SCRIPT: Eliminar Usuario Completamente
-- ================================================
-- Este script elimina un usuario y TODOS sus datos relacionados
-- de forma segura y en el orden correcto
--
-- ⚠️ ADVERTENCIA: Esta acción NO SE PUEDE DESHACER
-- ⚠️ Solo usar en DESARROLLO
--
-- INSTRUCCIONES:
-- 1. Reemplaza 'EMAIL_DEL_USUARIO_AQUI' con el email real
-- 2. Ejecuta el script completo en Supabase SQL Editor
-- 3. Verifica con las queries de verificación al final

-- ================================================
-- CONFIGURACIÓN
-- ================================================
DO $$
DECLARE
  v_email TEXT := 'EMAIL_DEL_USUARIO_AQUI'; -- 👈 CAMBIA ESTE EMAIL
  v_user_id UUID;
  v_deleted_messages INT := 0;
  v_deleted_conversations INT := 0;
  v_deleted_reviews_given INT := 0;
  v_deleted_reviews_received INT := 0;
  v_deleted_client_reviews_given INT := 0;
  v_deleted_client_reviews_received INT := 0;
  v_deleted_professional INT := 0;
BEGIN
  RAISE NOTICE '================================================';
  RAISE NOTICE 'INICIANDO ELIMINACIÓN DE USUARIO: %', v_email;
  RAISE NOTICE '================================================';
  
  -- Obtener el ID del usuario
  SELECT id INTO v_user_id FROM public.users WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ Usuario no encontrado en public.users: %', v_email;
    DELETE FROM auth.users WHERE email = v_email;
    IF FOUND THEN
      RAISE NOTICE '✅ Usuario eliminado solo de auth.users';
    ELSE
      RAISE NOTICE '❌ Usuario no existe en ninguna tabla';
    END IF;
    RETURN;
  END IF;

  RAISE NOTICE '📍 Usuario encontrado: ID = %', v_user_id;

  -- 1. ELIMINAR MENSAJES
  RAISE NOTICE '🗑️  Eliminando mensajes...';
  DELETE FROM messages WHERE sender_id = v_user_id;
  GET DIAGNOSTICS v_deleted_messages = ROW_COUNT;
  RAISE NOTICE '   ✅ % mensajes eliminados', v_deleted_messages;

  -- 2. ELIMINAR CONVERSACIONES
  RAISE NOTICE '🗑️  Eliminando conversaciones...';
  DELETE FROM conversations WHERE participant1_id = v_user_id OR participant2_id = v_user_id;
  GET DIAGNOSTICS v_deleted_conversations = ROW_COUNT;
  RAISE NOTICE '   ✅ % conversaciones eliminadas', v_deleted_conversations;

  -- 3. ELIMINAR RESEÑAS (como cliente)
  RAISE NOTICE '🗑️  Eliminando reseñas dadas...';
  DELETE FROM reviews WHERE client_id = v_user_id;
  GET DIAGNOSTICS v_deleted_reviews_given = ROW_COUNT;
  RAISE NOTICE '   ✅ % reseñas eliminadas (dadas)', v_deleted_reviews_given;

  -- 4. ELIMINAR RESEÑAS (como profesional)
  RAISE NOTICE '🗑️  Eliminando reseñas recibidas...';
  DELETE FROM reviews WHERE professional_id = v_user_id;
  GET DIAGNOSTICS v_deleted_reviews_received = ROW_COUNT;
  RAISE NOTICE '   ✅ % reseñas eliminadas (recibidas)', v_deleted_reviews_received;

  -- 5. ELIMINAR CLIENT REVIEWS (dadas)
  RAISE NOTICE '🗑️  Eliminando calificaciones dadas...';
  DELETE FROM client_reviews WHERE professional_id = v_user_id;
  GET DIAGNOSTICS v_deleted_client_reviews_given = ROW_COUNT;
  RAISE NOTICE '   ✅ % calificaciones eliminadas (dadas)', v_deleted_client_reviews_given;

  -- 6. ELIMINAR CLIENT REVIEWS (recibidas)
  RAISE NOTICE '🗑️  Eliminando calificaciones recibidas...';
  DELETE FROM client_reviews WHERE client_id = v_user_id;
  GET DIAGNOSTICS v_deleted_client_reviews_received = ROW_COUNT;
  RAISE NOTICE '   ✅ % calificaciones eliminadas (recibidas)', v_deleted_client_reviews_received;

  -- 7. ELIMINAR PERFIL PROFESIONAL
  RAISE NOTICE '🗑️  Eliminando perfil profesional...';
  DELETE FROM professionals WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_deleted_professional = ROW_COUNT;
  IF v_deleted_professional > 0 THEN
    RAISE NOTICE '   ✅ Perfil profesional eliminado';
  ELSE
    RAISE NOTICE '   ℹ️  No tenía perfil profesional';
  END IF;

  -- 8. ELIMINAR DE PUBLIC.USERS
  RAISE NOTICE '🗑️  Eliminando de public.users...';
  DELETE FROM public.users WHERE id = v_user_id;
  RAISE NOTICE '   ✅ Usuario eliminado de public.users';

  -- 9. ELIMINAR DE AUTH.USERS
  RAISE NOTICE '��️  Eliminando de auth.users...';
  DELETE FROM auth.users WHERE email = v_email;
  IF FOUND THEN
    RAISE NOTICE '   ✅ Usuario eliminado de auth.users';
  ELSE
    RAISE NOTICE '   ⚠️  No encontrado en auth.users';
  END IF;

  -- RESUMEN
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ ELIMINACIÓN COMPLETADA: %', v_email;
  RAISE NOTICE '================================================';
  RAISE NOTICE '📊 Mensajes: % | Conversaciones: %', v_deleted_messages, v_deleted_conversations;
  RAISE NOTICE '📊 Reseñas: % dadas, % recibidas', v_deleted_reviews_given, v_deleted_reviews_received;
  RAISE NOTICE '📊 Calificaciones: % dadas, % recibidas', v_deleted_client_reviews_given, v_deleted_client_reviews_received;
  RAISE NOTICE '📊 Perfil profesional: %', v_deleted_professional;
  RAISE NOTICE '================================================';
END $$;

-- ================================================
-- VERIFICACIÓN
-- ================================================
-- Reemplaza 'EMAIL_DEL_USUARIO_AQUI' para verificar

SELECT 
  '👤 AUTH.USERS' as tabla,
  COUNT(*) as registros,
  CASE WHEN COUNT(*) = 0 THEN '✅ Eliminado' ELSE '❌ EXISTE' END as estado
FROM auth.users WHERE email = 'EMAIL_DEL_USUARIO_AQUI'
UNION ALL
SELECT '👥 PUBLIC.USERS', COUNT(*), 
  CASE WHEN COUNT(*) = 0 THEN '✅ Eliminado' ELSE '❌ EXISTE' END
FROM public.users WHERE email = 'EMAIL_DEL_USUARIO_AQUI';
