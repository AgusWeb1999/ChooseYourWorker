-- ============================================
-- SCRIPT MINIMALISTA - Solo Jobs
-- ============================================
-- Crear SOLO lo esencial, sin triggers ni políticas complejas

-- 1. Agregar columnas necesarias
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS jobs_requested_count INTEGER DEFAULT 0;
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS completed_jobs_count INTEGER DEFAULT 0;

-- 2. Crear tabla jobs (si no existe)
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 2b. Si la tabla jobs ya existe, agregar las columnas faltantes
DO $$ 
BEGIN
  -- Verificar si la tabla existe antes de agregar columnas
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'jobs') THEN
    -- Agregar started_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'started_at') THEN
      ALTER TABLE public.jobs ADD COLUMN started_at TIMESTAMP DEFAULT NOW();
      -- Actualizar registros existentes
      UPDATE public.jobs SET started_at = created_at WHERE started_at IS NULL;
    END IF;
    
    -- Agregar completed_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'completed_at') THEN
      ALTER TABLE public.jobs ADD COLUMN completed_at TIMESTAMP;
      -- Actualizar registros existentes con status completed
      UPDATE public.jobs SET completed_at = updated_at WHERE status = 'completed' AND completed_at IS NULL;
    END IF;
    
    -- Agregar cancelled_at si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'jobs' AND column_name = 'cancelled_at') THEN
      ALTER TABLE public.jobs ADD COLUMN cancelled_at TIMESTAMP;
      -- Actualizar registros existentes con status cancelled
      UPDATE public.jobs SET cancelled_at = updated_at WHERE status = 'cancelled' AND cancelled_at IS NULL;
    END IF;
  END IF;
END $$;

-- 3. Agregar job_id a reviews (si no existe)
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id) ON DELETE CASCADE;

-- 4. Índices básicos
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON public.jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_professional_id ON public.jobs(professional_id);
CREATE INDEX IF NOT EXISTS idx_reviews_job_id ON public.reviews(job_id);

-- 5. RLS simple
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Políticas MUY simples
DROP POLICY IF EXISTS "jobs_select_policy" ON public.jobs;
CREATE POLICY "jobs_select_policy" ON public.jobs FOR SELECT USING (true);

DROP POLICY IF EXISTS "jobs_insert_policy" ON public.jobs;
CREATE POLICY "jobs_insert_policy" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = client_id);

DROP POLICY IF EXISTS "reviews_select_policy" ON public.reviews;
CREATE POLICY "reviews_select_policy" ON public.reviews FOR SELECT USING (true);

DROP POLICY IF EXISTS "reviews_insert_policy" ON public.reviews;
CREATE POLICY "reviews_insert_policy" ON public.reviews FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Verificación
SELECT '✅ Jobs table created' as status;
SELECT '✅ Reviews updated with job_id' as status;
SELECT '✅ Basic RLS policies set' as status;
