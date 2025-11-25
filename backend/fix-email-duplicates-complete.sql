-- =====================================================
-- SOLUCIÓN COMPLETA PARA EMAILS DUPLICADOS
-- =====================================================
-- Este script hace 4 cosas:
-- 1. Diagnóstico del problema actual
-- 2. Limpieza de duplicados existentes
-- 3. Prevención de futuros duplicados
-- 4. Validación de la solución

-- =====================================================
-- PASO 1: DIAGNÓSTICO
-- =====================================================

DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT email, COUNT(*) as count
    FROM public.users
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
  ) duplicates;
  
  RAISE NOTICE '🔍 Total de emails duplicados: %', duplicate_count;
END $$;

-- Ver detalles de los duplicados
SELECT 
  email,
  COUNT(*) as cantidad,
  ARRAY_AGG(id ORDER BY created_at) as user_ids,
  ARRAY_AGG(created_at ORDER BY created_at) as fechas
FROM public.users
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- =====================================================
-- PASO 2: LIMPIEZA DE DUPLICADOS
-- =====================================================

DO $$
DECLARE
  duplicate_email RECORD;
  user_to_keep UUID;
  user_to_delete UUID;
  deleted_count INTEGER := 0;
BEGIN
  RAISE NOTICE '🧹 Iniciando limpieza de duplicados...';
  
  -- Para cada email duplicado
  FOR duplicate_email IN 
    SELECT email, ARRAY_AGG(id ORDER BY created_at) as user_ids
    FROM public.users
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
  LOOP
    -- Mantener el más antiguo (primer elemento del array)
    user_to_keep := duplicate_email.user_ids[1];
    
    RAISE NOTICE '📧 Procesando email: %', duplicate_email.email;
    RAISE NOTICE '  ✅ Manteniendo usuario: %', user_to_keep;
    
    -- Eliminar los duplicados (todos excepto el primero)
    FOR i IN 2..ARRAY_LENGTH(duplicate_email.user_ids, 1)
    LOOP
      user_to_delete := duplicate_email.user_ids[i];
      RAISE NOTICE '  ❌ Eliminando duplicado: %', user_to_delete;
      
      -- Transferir datos importantes antes de eliminar
      -- 1. Transferir perfil profesional si existe
      UPDATE public.professionals
      SET user_id = user_to_keep
      WHERE user_id = user_to_delete;
      
      -- 2. Transferir reseñas recibidas
      UPDATE public.reviews
      SET professional_id = (
        SELECT id FROM public.professionals WHERE user_id = user_to_keep
      )
      WHERE professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = user_to_delete
      );
      
      -- 3. Transferir reseñas dadas
      UPDATE public.reviews
      SET client_id = user_to_keep
      WHERE client_id = user_to_delete;
      
      -- 4. Transferir chats
      UPDATE public.chats
      SET client_id = user_to_keep
      WHERE client_id = user_to_delete;
      
      UPDATE public.chats
      SET professional_id = (
        SELECT id FROM public.professionals WHERE user_id = user_to_keep
      )
      WHERE professional_id IN (
        SELECT id FROM public.professionals WHERE user_id = user_to_delete
      );
      
      -- 5. Transferir mensajes
      UPDATE public.messages
      SET sender_id = user_to_keep
      WHERE sender_id = user_to_delete;
      
      -- 6. Eliminar el usuario duplicado
      DELETE FROM public.users WHERE id = user_to_delete;
      
      deleted_count := deleted_count + 1;
    END LOOP;
  END LOOP;
  
  RAISE NOTICE '✅ Limpieza completada. Usuarios eliminados: %', deleted_count;
END $$;

-- =====================================================
-- PASO 3: PREVENCIÓN DE DUPLICADOS
-- =====================================================

-- 3.1: Agregar constraint UNIQUE en email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'users_email_unique'
  ) THEN
    ALTER TABLE public.users 
    ADD CONSTRAINT users_email_unique UNIQUE(email);
    RAISE NOTICE '✅ Constraint UNIQUE agregado en email';
  ELSE
    RAISE NOTICE '⚠️  Constraint UNIQUE ya existe en email';
  END IF;
END $$;

-- 3.2: Mejorar el trigger de sincronización
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  existing_user UUID;
BEGIN
  -- Verificar si ya existe un usuario con este email
  SELECT id INTO existing_user
  FROM public.users
  WHERE email = NEW.email;
  
  IF existing_user IS NOT NULL THEN
    RAISE NOTICE 'Usuario con email % ya existe (ID: %), saltando inserción', NEW.email, existing_user;
    RETURN NEW;
  END IF;
  
  -- Verificar si ya existe un usuario con este ID
  SELECT id INTO existing_user
  FROM public.users
  WHERE id = NEW.id;
  
  IF existing_user IS NOT NULL THEN
    RAISE NOTICE 'Usuario con ID % ya existe, saltando inserción', NEW.id;
    RETURN NEW;
  END IF;
  
  -- Insertar el nuevo usuario en public.users
  BEGIN
    INSERT INTO public.users (
      id,
      auth_uid,
      email,
      full_name,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Usuario sincronizado exitosamente: % (ID: %)', NEW.email, NEW.id;
  EXCEPTION
    WHEN unique_violation THEN
      RAISE NOTICE 'Error de unicidad al insertar usuario %, ya existe', NEW.email;
    WHEN OTHERS THEN
      RAISE WARNING 'Error al sincronizar usuario %: %', NEW.email, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Confirmar creación del trigger
DO $$
BEGIN
  RAISE NOTICE '✅ Trigger de sincronización mejorado';
END $$;

-- 3.3: Crear función de validación para el frontend
CREATE OR REPLACE FUNCTION public.check_email_available(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_exists BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.users WHERE LOWER(email) = LOWER(p_email)
  ) INTO email_exists;
  
  RETURN NOT email_exists;
END;
$$;

COMMENT ON FUNCTION public.check_email_available IS 
'Verifica si un email está disponible para registro. Retorna TRUE si está disponible, FALSE si ya existe.';

-- Confirmar creación de la función
DO $$
BEGIN
  RAISE NOTICE '✅ Función de validación de email creada';
END $$;

-- =====================================================
-- PASO 4: VALIDACIÓN DE LA SOLUCIÓN
-- =====================================================

-- 4.1: Verificar que no quedan duplicados
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT email, COUNT(*) as count
    FROM public.users
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
  ) duplicates;
  
  IF duplicate_count = 0 THEN
    RAISE NOTICE '✅ No hay emails duplicados';
  ELSE
    RAISE WARNING '⚠️  Todavía hay % emails duplicados', duplicate_count;
  END IF;
END $$;

-- 4.2: Verificar constraint UNIQUE
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.users'::regclass
  AND contype = 'u'
  AND conname = 'users_email_unique';

-- 4.3: Verificar trigger
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 4.4: Ver estado final de la tabla users
SELECT 
  COUNT(*) as total_usuarios,
  COUNT(DISTINCT email) as emails_unicos,
  COUNT(*) - COUNT(DISTINCT email) as duplicados
FROM public.users;

-- =====================================================
-- RESUMEN Y PRÓXIMOS PASOS
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SCRIPT COMPLETADO EXITOSAMENTE';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📋 CAMBIOS REALIZADOS:';
  RAISE NOTICE '  1. ✅ Duplicados eliminados';
  RAISE NOTICE '  2. ✅ Constraint UNIQUE agregado en email';
  RAISE NOTICE '  3. ✅ Trigger mejorado con validación';
  RAISE NOTICE '  4. ✅ Función de validación creada';
  RAISE NOTICE '';
  RAISE NOTICE '📝 PRÓXIMOS PASOS EN EL FRONTEND:';
  RAISE NOTICE '  1. Actualizar register.tsx para usar "id" en lugar de "auth_uid"';
  RAISE NOTICE '  2. Agregar validación de email antes de registrar';
  RAISE NOTICE '  3. Probar registro de nuevos usuarios';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
