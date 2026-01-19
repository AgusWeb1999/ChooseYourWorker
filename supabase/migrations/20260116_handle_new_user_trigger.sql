-- Trigger para crear usuario completo cuando se registra en auth
-- Captura metadata del signup para llenar todos los campos

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_full_name text;
  v_is_professional boolean;
BEGIN
  -- Extraer y validar full_name
  v_full_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'full_name', '')), '');
  
  -- Si full_name está vacío, usar el email como fallback
  IF v_full_name IS NULL OR v_full_name = '' THEN
    v_full_name := SPLIT_PART(NEW.email, '@', 1);
  END IF;
  
  -- Determinar si es profesional
  v_is_professional := COALESCE(
    (NEW.raw_user_meta_data->>'is_professional')::boolean,
    (NEW.raw_user_meta_data->>'user_type' = 'worker'),
    false
  );

  INSERT INTO public.users (
    id,
    auth_uid,
    email,
    full_name,
    phone,
    id_number,
    country,
    province,
    department,
    city,
    barrio,
    email_verified,
    is_active,
    is_professional
  ) VALUES (
    NEW.id,
    NEW.id,
    NEW.email,
    v_full_name,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'phone'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'id_number'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'country'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'province'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'department'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'city'), ''),
    NULLIF(TRIM(NEW.raw_user_meta_data->>'barrio'), ''),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    true,
    v_is_professional
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE 
      WHEN EXCLUDED.full_name IS NOT NULL AND EXCLUDED.full_name <> '' 
      THEN EXCLUDED.full_name 
      ELSE users.full_name 
    END,
    phone = COALESCE(EXCLUDED.phone, users.phone),
    id_number = COALESCE(EXCLUDED.id_number, users.id_number),
    country = COALESCE(EXCLUDED.country, users.country),
    province = COALESCE(EXCLUDED.province, users.province),
    department = COALESCE(EXCLUDED.department, users.department),
    city = COALESCE(EXCLUDED.city, users.city),
    barrio = COALESCE(EXCLUDED.barrio, users.barrio),
    is_professional = COALESCE(EXCLUDED.is_professional, users.is_professional),
    updated_at = now();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error details para debugging
    RAISE LOG 'Error in handle_new_user trigger: % %', SQLERRM, SQLSTATE;
    RAISE LOG 'User ID: %, Email: %, Metadata: %', NEW.id, NEW.email, NEW.raw_user_meta_data;
    RAISE;
END;
$$;

-- Eliminar trigger existente si existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Crear el trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

COMMENT ON FUNCTION public.handle_new_user() IS 
  'Crea o actualiza usuario en public.users cuando se registra en auth.users, capturando metadata del signup';
