-- Función para crear o actualizar usuario durante el registro
-- Se ejecuta con SECURITY DEFINER para bypass RLS
CREATE OR REPLACE FUNCTION create_user_on_registration(
  user_id uuid,
  user_auth_uid uuid,
  user_email text,
  user_full_name text,
  user_phone text DEFAULT NULL,
  user_id_number text DEFAULT NULL,
  user_country text DEFAULT NULL,
  user_province text DEFAULT NULL,
  user_department text DEFAULT NULL,
  user_city text DEFAULT NULL,
  user_barrio text DEFAULT NULL,
  user_is_professional boolean DEFAULT false
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_user users%ROWTYPE;
  result_user users%ROWTYPE;
  auth_user_email text;
BEGIN
  -- SEGURIDAD 1: Verificar que hay un usuario autenticado
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: Authentication required';
  END IF;
  
  -- SEGURIDAD 2: Verificar que el usuario autenticado sea el mismo que se está creando
  IF auth.uid() != user_id AND auth.uid() != user_auth_uid THEN
    RAISE EXCEPTION 'Unauthorized: You can only create your own profile';
  END IF;
  
  -- SEGURIDAD 3: Verificar que el email coincide con el email del token de auth
  SELECT email INTO auth_user_email FROM auth.users WHERE id = auth.uid();
  IF auth_user_email IS NULL OR auth_user_email != user_email THEN
    RAISE EXCEPTION 'Unauthorized: Email mismatch';
  END IF;
  
  -- SEGURIDAD 4: Validar formato de email
  IF user_email !~ '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$' THEN
    RAISE EXCEPTION 'Invalid email format';
  END IF;
  
  -- SEGURIDAD 5: Validar que full_name no esté vacío
  IF user_full_name IS NULL OR trim(user_full_name) = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;

  -- Verificar si el usuario ya existe
  SELECT * INTO existing_user
  FROM users
  WHERE id = user_id OR auth_uid = user_auth_uid;

  -- SEGURIDAD 6: Si el usuario ya existe, solo puede actualizar su propia cuenta
  IF existing_user IS NOT NULL AND existing_user.id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify another user''s profile';
  END IF;

  IF existing_user IS NULL THEN
    -- Insertar nuevo usuario
    INSERT INTO users (
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
      user_id,
      user_auth_uid,
      user_email,
      user_full_name,
      user_phone,
      user_id_number,
      user_country,
      user_province,
      user_department,
      user_city,
      user_barrio,
      false,  -- email_verified se actualiza con el trigger
      true,   -- is_active
      user_is_professional
    )
    RETURNING * INTO result_user;

    RETURN json_build_object(
      'success', true,
      'action', 'inserted',
      'user', row_to_json(result_user)
    );
  ELSE
    -- Actualizar usuario existente
    UPDATE users
    SET
      email = COALESCE(user_email, email),
      full_name = COALESCE(user_full_name, full_name),
      phone = COALESCE(user_phone, phone),
      id_number = COALESCE(user_id_number, id_number),
      country = COALESCE(user_country, country),
      province = COALESCE(user_province, province),
      department = COALESCE(user_department, department),
      city = COALESCE(user_city, city),
      barrio = COALESCE(user_barrio, barrio),
      is_professional = COALESCE(user_is_professional, is_professional),
      updated_at = now()
    WHERE id = user_id OR auth_uid = user_auth_uid
    RETURNING * INTO result_user;

    RETURN json_build_object(
      'success', true,
      'action', 'updated',
      'user', row_to_json(result_user)
    );
  END IF;
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION create_user_on_registration TO authenticated;

-- Comentario explicativo
COMMENT ON FUNCTION create_user_on_registration IS 
  'Crea o actualiza un usuario durante el registro. Se ejecuta con SECURITY DEFINER para bypass RLS.';
