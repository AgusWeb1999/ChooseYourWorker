-- ============================================
-- VER TODAS LAS FUNCIONES EXISTENTES
-- ============================================
-- Ejecuta esto primero para ver qué funciones existen:

SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  'DROP FUNCTION ' || n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') CASCADE;' as drop_statement
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'create_professional_profile';

-- Copia los comandos DROP que aparecen en la columna "drop_statement" y ejecútalos
-- Después ejecuta el resto de este script

-- ============================================
-- FUNCIÓN PARA CREAR PERFIL PROFESIONAL DURANTE REGISTRO
-- ============================================
-- Esta función se ejecuta con privilegios elevados (SECURITY DEFINER)
-- para permitir la creación de perfiles profesionales durante el registro
-- cuando el usuario aún no tiene sesión autenticada.

-- Eliminar las versiones existentes de la función
DROP FUNCTION IF EXISTS public.create_professional_profile(p_user_id uuid, p_display_name text, p_profession text, p_bio text, p_city text, p_state text, p_phone text, p_id_number text, p_country text, p_hourly_rate numeric, p_years_experience integer) CASCADE;
DROP FUNCTION IF EXISTS public.create_professional_profile(p_user_id uuid, p_display_name text, p_profession text, p_bio text, p_hourly_rate numeric, p_years_experience integer, p_phone text, p_city text, p_state text, p_country text, p_province text, p_department text, p_barrio text) CASCADE;

CREATE OR REPLACE FUNCTION create_professional_profile(
  p_user_id UUID,
  p_display_name TEXT,
  p_profession TEXT,
  p_bio TEXT,
  p_hourly_rate NUMERIC,
  p_years_experience INTEGER,
  p_phone TEXT,
  p_city TEXT,
  p_state TEXT,
  p_country TEXT,
  p_province TEXT,
  p_department TEXT,
  p_barrio TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER  -- Ejecutar con privilegios del creador de la función
SET search_path = public
AS $$
DECLARE
  v_professional_id UUID;
BEGIN
  -- Verificar que el usuario exista y sea profesional
  IF NOT EXISTS (
    SELECT 1 FROM users WHERE id = p_user_id AND is_professional = true
  ) THEN
    RAISE EXCEPTION 'Usuario no encontrado o no es profesional';
  END IF;
  
  -- Verificar que no exista ya un perfil profesional
  IF EXISTS (
    SELECT 1 FROM professionals WHERE user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'El perfil profesional ya existe para este usuario';
  END IF;
  
  -- Crear perfil profesional
  INSERT INTO professionals (
    user_id,
    display_name,
    profession,
    bio,
    hourly_rate,
    years_experience,
    phone,
    city,
    state,
    country,
    province,
    department,
    barrio,
    is_verified,
    is_active,
    rating,
    rating_count,
    total_jobs,
    average_rating,
    total_reviews,
    completed_hires_count,
    is_premium,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_display_name,
    p_profession,
    p_bio,
    COALESCE(p_hourly_rate, 0),
    COALESCE(p_years_experience, 0),
    p_phone,
    p_city,
    p_state,
    p_country,
    p_province,
    p_department,
    p_barrio,
    false, -- is_verified: se activará al verificar email
    false, -- is_active: se activará al verificar email
    0.0,
    0,
    0,
    0.0,
    0,
    0,
    false,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_professional_id;
  
  -- Retornar resultado
  RETURN json_build_object(
    'success', true,
    'professional_id', v_professional_id,
    'message', 'Perfil profesional creado exitosamente'
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Dar permisos de ejecución a usuarios autenticados y anónimos
GRANT EXECUTE ON FUNCTION create_professional_profile TO anon, authenticated;

COMMENT ON FUNCTION create_professional_profile IS 'Crea un perfil profesional durante el registro. Se ejecuta con privilegios elevados para permitir creación sin sesión autenticada.';

-- ============================================
-- INSTRUCCIONES DE USO
-- ============================================
-- 
-- 1. Ejecuta este script en Supabase SQL Editor
-- 2. La función estará disponible para ser llamada desde el frontend
-- 3. El frontend la llamará usando: supabase.rpc('create_professional_profile', {...})
-- ============================================
