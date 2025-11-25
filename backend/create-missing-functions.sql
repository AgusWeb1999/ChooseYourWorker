-- ============================================
-- CREAR FUNCIONES FALTANTES PARA REGISTRO
-- ============================================

-- 1. Función para verificar si un email está disponible
CREATE OR REPLACE FUNCTION public.check_email_available(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verificar si el email existe en auth.users
  RETURN NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = p_email
  );
END;
$$;

-- Dar permisos públicos para que cualquiera pueda verificar emails
GRANT EXECUTE ON FUNCTION public.check_email_available(TEXT) TO anon, authenticated;

-- Comentario explicativo
COMMENT ON FUNCTION public.check_email_available(TEXT) IS 
'Verifica si un email está disponible para registro. Retorna TRUE si está disponible, FALSE si ya existe.';

-- ============================================
-- 2. ARREGLAR TRIGGER DE SINCRONIZACIÓN
-- ============================================

-- Actualizar la función handle_new_user para capturar user_type
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_type TEXT;
  v_full_name TEXT;
  v_is_professional BOOLEAN;
BEGIN
  -- Extraer datos de los metadatos
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  -- Determinar si es profesional
  -- IMPORTANTE: Si user_type es NULL, por defecto es cliente (false)
  v_is_professional := COALESCE(v_user_type = 'worker', false);
  
  RAISE NOTICE '🔥 TRIGGER EJECUTADO: email=%, user_type=%, is_professional=%', 
    NEW.email, v_user_type, v_is_professional;
  
  -- Insertar el nuevo usuario en public.users con el tipo correcto
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
    v_is_professional,  -- 🔥 ESTO ES LO IMPORTANTE
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    is_professional = EXCLUDED.is_professional,  -- Usar el nuevo valor
    full_name = EXCLUDED.full_name,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Usuario creado/actualizado: is_professional=%', v_is_professional;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ ERROR en trigger: %', SQLERRM;
    RETURN NEW;  -- Retornar NEW para que la creación en auth.users no falle
END;
$$;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 
'Función trigger que sincroniza automáticamente usuarios de auth.users a public.users, capturando el user_type correctamente.';

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Verificar el trigger
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Probar la función de email
SELECT check_email_available('test@example.com') as email_disponible;

SELECT '✅ Funciones creadas exitosamente:' as status;
SELECT '  - check_email_available()' as funcion_1;
SELECT '  - handle_new_user() [ACTUALIZADO para capturar user_type]' as funcion_2;
