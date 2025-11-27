-- ============================================
-- WORKINGGO - SETUP INICIAL COMPLETO
-- ============================================
-- Este script configura todo el sistema desde cero
-- Ejecutar SOLO UNA VEZ al crear el proyecto

-- 1. SISTEMA DE AVATARES
-- ============================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Crear bucket de storage para avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true,
  5242880, -- 5MB máximo
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas RLS para avatars
DROP POLICY IF EXISTS "Avatars son públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden subir su avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar su avatar" ON storage.objects;

CREATE POLICY "Avatars son públicos" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

CREATE POLICY "Usuarios pueden subir su avatar" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuarios pueden actualizar su avatar" 
ON storage.objects FOR UPDATE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Usuarios pueden eliminar su avatar" 
ON storage.objects FOR DELETE 
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- 2. TRIGGER DE SINCRONIZACIÓN
-- ============================================
-- Sincroniza usuarios de auth.users a public.users automáticamente

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
DECLARE
  v_user_type TEXT;
  v_full_name TEXT;
  v_is_professional BOOLEAN;
BEGIN
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', '');
  
  IF v_user_type = 'worker' THEN
    v_is_professional := true;
  ELSE
    v_is_professional := false;
  END IF;
  
  INSERT INTO public.users (
    id, auth_uid, email, full_name, is_professional, created_at, updated_at
  )
  VALUES (
    NEW.id, NEW.id, NEW.email, v_full_name, v_is_professional, NOW(), NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    is_professional = EXCLUDED.is_professional,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    updated_at = NOW();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.handle_new_user() TO postgres, authenticated, anon;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE auth.users ENABLE TRIGGER on_auth_user_created;

-- 3. TRIGGER DE SINCRONIZACIÓN DE AVATARES
-- ============================================
-- Sincroniza avatares entre users y professionals

DROP TRIGGER IF EXISTS sync_avatar_to_professional ON public.users CASCADE;
DROP FUNCTION IF EXISTS public.sync_avatar_url() CASCADE;

CREATE OR REPLACE FUNCTION public.sync_avatar_url()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_professional = true THEN
    UPDATE public.professionals
    SET avatar_url = NEW.avatar_url,
        updated_at = NOW()
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_avatar_url() TO postgres, authenticated, anon;

CREATE TRIGGER sync_avatar_to_professional
  AFTER UPDATE OF avatar_url ON public.users
  FOR EACH ROW
  WHEN (OLD.avatar_url IS DISTINCT FROM NEW.avatar_url)
  EXECUTE FUNCTION public.sync_avatar_url();

-- 4. TRIGGER DE RATINGS AUTOMÁTICOS
-- ============================================
-- Actualiza el rating de profesionales cuando hay una nueva reseña

DROP TRIGGER IF EXISTS update_rating_after_review ON public.reviews CASCADE;
DROP FUNCTION IF EXISTS public.update_professional_rating() CASCADE;

CREATE OR REPLACE FUNCTION public.update_professional_rating()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_professional_id UUID;
  v_avg_rating DECIMAL(2,1);
  v_review_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_professional_id := OLD.professional_id;
  ELSE
    v_professional_id := NEW.professional_id;
  END IF;

  SELECT 
    ROUND(AVG(rating)::numeric, 1),
    COUNT(*)::integer
  INTO v_avg_rating, v_review_count
  FROM public.reviews
  WHERE professional_id = v_professional_id;

  UPDATE public.professionals
  SET 
    rating = COALESCE(v_avg_rating, 0),
    rating_count = COALESCE(v_review_count, 0),
    updated_at = NOW()
  WHERE id = v_professional_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_professional_rating() TO postgres, authenticated, anon;

CREATE TRIGGER update_rating_after_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_professional_rating();

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT '✅ Setup inicial completado' as status;
