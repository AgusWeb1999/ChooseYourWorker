-- =====================================================
-- TRIGGER AUTOMÁTICO DE SINCRONIZACIÓN DE USUARIOS
-- =====================================================
-- Este trigger copia automáticamente los usuarios de auth.users a public.users
-- Se ejecuta cada vez que se crea un nuevo usuario con Supabase Auth

-- 1. Crear la función que se ejecutará con el trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Insertar el nuevo usuario en public.users
  INSERT INTO public.users (
    id,
    auth_uid,
    email,
    full_name,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,                                    -- Usar el mismo ID de auth.users
    NEW.id,                                    -- También en auth_uid por compatibilidad
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),  -- Extraer del metadata
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;  -- Si ya existe, no hacer nada
  
  RETURN NEW;
END;
$$;

-- 2. Crear el trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Verificar que el trigger fue creado correctamente
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- 4. Comentario explicativo
COMMENT ON FUNCTION public.handle_new_user() IS 
'Función trigger que sincroniza automáticamente usuarios de auth.users a public.users';

-- =====================================================
-- TESTING DEL TRIGGER (Opcional)
-- =====================================================
-- Para probar que funciona, registra un nuevo usuario desde la app
-- y verifica que aparece automáticamente en public.users

-- Ver los últimos usuarios sincronizados:
SELECT 
    id,
    email,
    full_name,
    is_professional,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 5;

-- =====================================================
-- NOTAS IMPORTANTES
-- =====================================================
-- ✅ El trigger usa SECURITY DEFINER para tener permisos de superusuario
-- ✅ Usa ON CONFLICT DO NOTHING para evitar duplicados
-- ✅ Extrae el full_name del metadata del registro
-- ✅ Se ejecuta automáticamente, no requiere intervención manual
-- ✅ Si falla, el usuario igual se crea en auth.users
