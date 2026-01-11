-- Función para sincronizar el email de auth.users a public.users
CREATE OR REPLACE FUNCTION sync_email_to_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar el email en la tabla users cuando cambia en auth.users
  UPDATE public.users
  SET 
    email = NEW.email,
    updated_at = NOW()
  WHERE auth_uid = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear el trigger en la tabla auth.users
DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;

CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION sync_email_to_users();

-- Comentario explicativo
COMMENT ON FUNCTION sync_email_to_users() IS 
  'Sincroniza automáticamente el email de auth.users a public.users cuando se actualiza';
