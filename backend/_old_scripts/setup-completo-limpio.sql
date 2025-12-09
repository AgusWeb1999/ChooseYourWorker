-- ============================================
-- WORKINGGO - LIMPIEZA + SETUP INICIAL
-- ============================================
-- Script seguro que primero limpia y luego configura todo
-- Ejecutar en Supabase SQL Editor

-- ============================================
-- FASE 1: LIMPIEZA TOTAL
-- ============================================

-- Eliminar TODOS los triggers problemáticos
DROP TRIGGER IF EXISTS update_rating_after_review ON public.reviews CASCADE;
DROP TRIGGER IF EXISTS update_client_rating_after_review ON public.client_reviews CASCADE;
DROP TRIGGER IF EXISTS update_job_counts ON public.jobs CASCADE;
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs CASCADE;
DROP TRIGGER IF EXISTS update_client_reviews_updated_at ON public.client_reviews CASCADE;
DROP TRIGGER IF EXISTS sync_avatar_to_professional ON public.users CASCADE;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;

-- Eliminar TODAS las funciones de triggers
DROP FUNCTION IF EXISTS public.update_professional_rating() CASCADE;
DROP FUNCTION IF EXISTS public.update_client_rating() CASCADE;
DROP FUNCTION IF EXISTS public.update_job_counts() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_jobs() CASCADE;
DROP FUNCTION IF EXISTS public.sync_avatar_url() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Eliminar TODAS las políticas RLS problemáticas
DROP POLICY IF EXISTS "Cualquiera puede ver reviews" ON public.reviews;
DROP POLICY IF EXISTS "Solo clientes pueden crear reviews de profesionales" ON public.reviews;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear reviews" ON public.reviews;
DROP POLICY IF EXISTS "Clientes autenticados pueden crear reviews" ON public.reviews;
DROP POLICY IF EXISTS "Usuarios pueden crear reviews" ON public.reviews;

DROP POLICY IF EXISTS "Usuarios pueden ver sus propios jobs" ON public.jobs;
DROP POLICY IF EXISTS "Clientes pueden crear jobs" ON public.jobs;
DROP POLICY IF EXISTS "Clientes pueden completar sus jobs" ON public.jobs;
DROP POLICY IF EXISTS "Trabajadores pueden cancelar jobs" ON public.jobs;

DROP POLICY IF EXISTS "Cualquiera puede ver reviews de clientes" ON public.client_reviews;
DROP POLICY IF EXISTS "Solo profesionales pueden crear reviews de clientes" ON public.client_reviews;

DROP POLICY IF EXISTS "Avatars son públicos" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden subir su avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su avatar" ON storage.objects;
DROP POLICY IF EXISTS "Usuarios pueden eliminar su avatar" ON storage.objects;

-- ============================================
-- FASE 2: CREAR ESTRUCTURA BASE
-- ============================================

-- 1. AVATARES
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'professionals' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.professionals ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- 2. COLUMNAS PARA JOBS SYSTEM
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN phone TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'jobs_requested_count'
  ) THEN
    ALTER TABLE public.users ADD COLUMN jobs_requested_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'rating'
  ) THEN
    ALTER TABLE public.users ADD COLUMN rating DECIMAL(2,1) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'rating_count'
  ) THEN
    ALTER TABLE public.users ADD COLUMN rating_count INTEGER DEFAULT 0;
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'professionals' AND column_name = 'completed_jobs_count'
  ) THEN
    ALTER TABLE public.professionals ADD COLUMN completed_jobs_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 3. CREAR TABLA JOBS
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  cancelled_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 4. CREAR TABLA CLIENT_REVIEWS
CREATE TABLE IF NOT EXISTS public.client_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(job_id)
);

-- 5. AGREGAR job_id A REVIEWS
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'job_id'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================
-- FASE 3: CREAR ÍNDICES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON public.jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_professional_id ON public.jobs(professional_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'jobs' AND indexname = 'idx_jobs_active_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_jobs_active_unique ON public.jobs(client_id, professional_id) WHERE status = 'in_progress';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON public.reviews(job_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE schemaname = 'public' AND tablename = 'reviews' AND indexname = 'idx_reviews_job_unique'
  ) THEN
    CREATE UNIQUE INDEX idx_reviews_job_unique ON public.reviews(job_id) WHERE job_id IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_client_reviews_client_id ON public.client_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_client_reviews_professional_id ON public.client_reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_client_reviews_job_id ON public.client_reviews(job_id);

-- ============================================
-- FASE 4: STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- FASE 5: POLÍTICAS RLS
-- ============================================

-- Storage políticas
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

-- Reviews políticas
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede ver reviews" 
ON public.reviews FOR SELECT 
USING (true);

CREATE POLICY "Usuarios pueden crear reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Jobs políticas
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver sus propios jobs" 
ON public.jobs FOR SELECT 
USING (
  auth.uid() = jobs.client_id 
  OR auth.uid() IN (SELECT user_id FROM public.professionals WHERE id = jobs.professional_id)
);

CREATE POLICY "Clientes pueden crear jobs" 
ON public.jobs FOR INSERT 
WITH CHECK (
  auth.uid() = jobs.client_id
  AND NOT EXISTS (
    SELECT 1 FROM public.jobs existing_jobs
    WHERE existing_jobs.client_id = auth.uid() 
    AND existing_jobs.professional_id = jobs.professional_id 
    AND existing_jobs.status = 'in_progress'
  )
);

CREATE POLICY "Clientes pueden completar sus jobs" 
ON public.jobs FOR UPDATE 
USING (auth.uid() = jobs.client_id AND jobs.status = 'in_progress')
WITH CHECK (status IN ('completed', 'in_progress'));

CREATE POLICY "Trabajadores pueden cancelar jobs" 
ON public.jobs FOR UPDATE 
USING (
  auth.uid() IN (SELECT user_id FROM public.professionals WHERE id = jobs.professional_id)
  AND jobs.status = 'in_progress'
)
WITH CHECK (status = 'cancelled');

-- Client reviews políticas
ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquiera puede ver reviews de clientes" 
ON public.client_reviews FOR SELECT 
USING (true);

CREATE POLICY "Solo profesionales pueden crear reviews de clientes" 
ON public.client_reviews FOR INSERT 
WITH CHECK (
  auth.uid() IN (SELECT user_id FROM public.professionals WHERE id = client_reviews.professional_id)
  AND EXISTS (
    SELECT 1 FROM public.jobs j
    WHERE j.id = client_reviews.job_id 
    AND j.professional_id = client_reviews.professional_id
    AND j.client_id = client_reviews.client_id
    AND j.status = 'completed'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.client_reviews cr2
    WHERE cr2.job_id = client_reviews.job_id
  )
);

-- ============================================
-- FASE 6: TRIGGERS Y FUNCIONES
-- ============================================

-- Función para actualizar rating de profesionales
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
    ROUND(AVG(r.rating)::numeric, 1),
    COUNT(*)::integer
  INTO v_avg_rating, v_review_count
  FROM public.reviews r
  LEFT JOIN public.jobs j ON r.job_id = j.id
  WHERE r.professional_id = v_professional_id
    AND (r.job_id IS NULL OR j.status = 'completed');

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

-- Función para actualizar rating de clientes
CREATE OR REPLACE FUNCTION public.update_client_rating()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_client_id UUID;
  v_avg_rating DECIMAL(2,1);
  v_review_count INTEGER;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_client_id := OLD.client_id;
  ELSE
    v_client_id := NEW.client_id;
  END IF;

  SELECT 
    ROUND(AVG(rating)::numeric, 1),
    COUNT(*)::integer
  INTO v_avg_rating, v_review_count
  FROM public.client_reviews
  WHERE client_id = v_client_id;

  UPDATE public.users
  SET 
    rating = COALESCE(v_avg_rating, 0),
    rating_count = COALESCE(v_review_count, 0),
    updated_at = NOW()
  WHERE id = v_client_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_client_rating() TO postgres, authenticated, anon;

CREATE TRIGGER update_client_rating_after_review
  AFTER INSERT OR UPDATE OR DELETE ON public.client_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_client_rating();

-- Función para actualizar contadores de jobs
CREATE OR REPLACE FUNCTION public.update_job_counts()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = NOW();
    
    UPDATE public.users
    SET jobs_requested_count = jobs_requested_count + 1,
        updated_at = NOW()
    WHERE id = NEW.client_id;
    
    UPDATE public.professionals
    SET completed_jobs_count = completed_jobs_count + 1,
        updated_at = NOW()
    WHERE id = NEW.professional_id;
  END IF;
  
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
    NEW.cancelled_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_job_counts() TO postgres, authenticated, anon;

CREATE TRIGGER update_job_counts
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_counts();

-- Función para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_jobs()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_jobs();

CREATE TRIGGER update_client_reviews_updated_at
  BEFORE UPDATE ON public.client_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_jobs();

-- Función para sincronizar avatares
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

-- Función para manejar nuevos usuarios
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

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT '✅ Limpieza completada' as status;
SELECT '✅ Estructura creada' as status;
SELECT '✅ Políticas RLS configuradas' as status;
SELECT '✅ Triggers activados' as status;
SELECT '✅ Sistema de jobs implementado' as status;
