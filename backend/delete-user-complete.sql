-- ================================================
-- UTILIDAD: Borrar usuario completamente
-- ================================================
-- Usa este script cuando quieras borrar y recrear un usuario
-- Esto limpia TODAS las tablas relacionadas

-- REEMPLAZA 'EMAIL_A_BORRAR' con el email del usuario que quieres eliminar

DO $$
DECLARE
  v_email TEXT := 'agumazzini@hotmail.com'; -- CAMBIA ESTE EMAIL
  v_user_id UUID;
BEGIN
  -- Obtener el ID del usuario en public.users
  SELECT id INTO v_user_id FROM public.users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    -- Borrar mensajes
    DELETE FROM messages WHERE sender_id = v_user_id;
    RAISE NOTICE 'Mensajes eliminados';

    -- Borrar conversaciones
    DELETE FROM conversations 
    WHERE participant1_id = v_user_id 
       OR participant2_id = v_user_id;
    RAISE NOTICE 'Conversaciones eliminadas';

    -- Actualizar profesionales (no borrar, solo desasignar)
    UPDATE professionals SET user_id = NULL WHERE user_id = v_user_id;
    RAISE NOTICE 'Profesionales desasignados';

    -- Borrar reviews del cliente
    DELETE FROM reviews WHERE client_id = v_user_id;
    RAISE NOTICE 'Reviews eliminadas';

    -- Borrar de public.users
    DELETE FROM public.users WHERE id = v_user_id;
    RAISE NOTICE 'Usuario eliminado de public.users: %', v_user_id;
  END IF;

  -- Borrar de auth.users
  DELETE FROM auth.users WHERE email = v_email;
  RAISE NOTICE 'Usuario eliminado de auth.users: %', v_email;

  RAISE NOTICE 'Usuario % completamente eliminado', v_email;
END $$;

-- Verificar que el usuario fue eliminado
SELECT 
  'EN AUTH.USERS' as tabla,
  COUNT(*) as debe_ser_0
FROM auth.users
WHERE email = 'agumazzini@hotmail.com'
UNION ALL
SELECT 
  'EN PUBLIC.USERS',
  COUNT(*)
FROM public.users
WHERE email = 'agumazzini@hotmail.com';
