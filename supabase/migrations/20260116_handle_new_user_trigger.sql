-- Trigger para crear usuario completo cuando se registra en auth
-- Captura metadata del signup para llenar todos los campos

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
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
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'id_number',
    NEW.raw_user_meta_data->>'country',
    NEW.raw_user_meta_data->>'province',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'barrio',
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    true,
    COALESCE((NEW.raw_user_meta_data->>'is_professional')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, users.full_name),
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
