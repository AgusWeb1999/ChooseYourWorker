-- ================================================
-- ELIMINAR CLIENTES ESPECÍFICOS
-- ================================================
-- Este script elimina solo clientes (no profesionales)
-- Útil cuando quieres mantener los profesionales

-- Opción 1: Eliminar TODOS los clientes (usuarios que no son profesionales)
DELETE FROM messages 
WHERE sender_id IN (SELECT id FROM public.users WHERE is_professional = false);

DELETE FROM conversations
WHERE participant1_id IN (SELECT id FROM public.users WHERE is_professional = false)
   OR participant2_id IN (SELECT id FROM public.users WHERE is_professional = false);

DELETE FROM reviews
WHERE client_id IN (SELECT id FROM public.users WHERE is_professional = false);

DELETE FROM public.users WHERE is_professional = false;

DELETE FROM auth.users 
WHERE id NOT IN (
  SELECT user_id FROM professionals WHERE user_id IS NOT NULL
);

-- Verificación
SELECT 
  'Clientes restantes' as tipo,
  COUNT(*) as cantidad
FROM public.users
WHERE is_professional = false
UNION ALL
SELECT 
  'Profesionales (NO eliminados)',
  COUNT(*)
FROM professionals;

-- Opción 2: Eliminar un cliente específico por email
-- Descomenta y reemplaza el email para usar esta opción
/*
DO $$
DECLARE
  v_email TEXT := 'cliente@example.com'; -- CAMBIA ESTE EMAIL
  v_user_id UUID;
BEGIN
  -- Obtener el ID del usuario
  SELECT id INTO v_user_id FROM public.users WHERE email = v_email;

  IF v_user_id IS NOT NULL THEN
    -- Eliminar sus mensajes
    DELETE FROM messages WHERE sender_id = v_user_id;
    
    -- Eliminar sus conversaciones
    DELETE FROM conversations 
    WHERE participant1_id = v_user_id OR participant2_id = v_user_id;
    
    -- Eliminar sus reseñas
    DELETE FROM reviews WHERE client_id = v_user_id;
    
    -- Eliminar de public.users
    DELETE FROM public.users WHERE id = v_user_id;
    
    -- Eliminar de auth.users
    DELETE FROM auth.users WHERE email = v_email;
    
    RAISE NOTICE 'Cliente % eliminado exitosamente', v_email;
  ELSE
    RAISE NOTICE 'Cliente % no encontrado', v_email;
  END IF;
END $$;
*/

SELECT '✅ CLIENTES ELIMINADOS (PROFESIONALES PRESERVADOS)' as resultado;
