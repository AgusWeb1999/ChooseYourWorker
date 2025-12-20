-- Da permiso solo de select sobre la columna email de auth.users al rol anon
GRANT SELECT(email) ON TABLE auth.users TO anon;

-- Reemplaza la función para máxima seguridad: nunca expone datos, solo true/false
CREATE OR REPLACE FUNCTION public.email_exists(email_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  exists_email boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = email_input
  ) INTO exists_email;
  RETURN exists_email;
END;
$$;

ALTER FUNCTION public.email_exists(text) OWNER TO postgres;
GRANT EXECUTE ON FUNCTION public.email_exists(text) TO anon, authenticated;
