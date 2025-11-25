-- ============================================
-- ARREGLO DEFINITIVO DEL TRIGGER
-- ============================================
-- Este script FUERZA la creación del trigger con permisos correctos

-- PASO 1: Eliminar completamente el trigger y la función anterior
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- PASO 2: Crear la función con los permisos correctos
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER -- Ejecuta con permisos del dueño de la función
SET search_path = public, auth -- Acceso a ambos schemas
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_type TEXT;
  v_full_name TEXT;
  v_is_professional BOOLEAN;
BEGIN
  -- Log para debugging
  RAISE LOG '🔥 TRIGGER INICIADO para email: %', NEW.email;
  
  -- Extraer datos de los metadatos
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Determinar si es profesional
  -- Si user_type = 'worker' entonces TRUE, si no FALSE
  IF v_user_type = 'worker' THEN
    v_is_professional := true;
  ELSE
    v_is_professional := false;
  END IF;
  
  RAISE LOG '📊 Valores extraídos: user_type=%, is_professional=%', v_user_type, v_is_professional;
  
  -- Insertar el nuevo usuario en public.users
  INSERT INTO public.users (
    id,
    auth_uid,
    email,
    full_name,
    is_professional,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    v_full_name,
    v_is_professional,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    is_professional = EXCLUDED.is_professional,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RAISE LOG '✅ Usuario sincronizado: id=%, is_professional=%', NEW.id, v_is_professional;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG '❌ ERROR en trigger handle_new_user: %', SQLERRM;
    -- No fallar la creación del usuario en auth
    RETURN NEW;
END;
$$;

-- PASO 3: Dar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, authenticated, anon;

-- PASO 4: Crear el trigger en auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- PASO 5: Habilitar el trigger (por si estaba deshabilitado)
ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver que el trigger existe y está habilitado
SELECT 
    tgname as trigger_name,
    tgenabled as enabled,
    CASE tgenabled
        WHEN 'O' THEN '✅ ENABLED'
        WHEN 'D' THEN '❌ DISABLED'
        ELSE '⚠️ ' || tgenabled
    END as status
FROM pg_trigger
WHERE tgname = 'on_auth_user_created';

-- Ver la función
SELECT 
    routine_name,
    routine_type,
    security_type,
    routine_definition
FROM information_schema.routines
WHERE routine_name = 'handle_new_user';

SELECT '✅ Trigger recreado con permisos SECURITY DEFINER' as resultado;
SELECT '🔥 Ahora registra un nuevo usuario y verifica que funcione' as siguiente_paso;
