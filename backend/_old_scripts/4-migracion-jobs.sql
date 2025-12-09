-- ============================================
-- WORKINGGO - MIGRACIÓN SISTEMA DE JOBS
-- ============================================
-- Este script agrega el sistema de trabajos a una BD existente
-- Ejecutar UNA SOLA VEZ si ya tienes el proyecto funcionando

-- 1. Agregar columnas necesarias
-- ============================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS jobs_requested_count INTEGER DEFAULT 0;

ALTER TABLE public.professionals 
ADD COLUMN IF NOT EXISTS completed_jobs_count INTEGER DEFAULT 0;

-- 2. Crear tabla de trabajos
-- ============================================

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

-- 3. Índices para rendimiento
-- ============================================

CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON public.jobs(client_id);
CREATE INDEX IF NOT EXISTS idx_jobs_professional_id ON public.jobs(professional_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);

-- Solo 1 job activo entre cliente-profesional
CREATE UNIQUE INDEX IF NOT EXISTS idx_jobs_active_unique 
ON public.jobs(client_id, professional_id) 
WHERE status = 'in_progress';

-- 4. Vincular reviews con jobs (mantiene compatibilidad)
-- ============================================

ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES public.jobs(id) ON DELETE SET NULL;

-- 5. Políticas RLS para jobs
-- ============================================

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver sus propios jobs" ON public.jobs;
DROP POLICY IF EXISTS "Clientes pueden crear jobs" ON public.jobs;
DROP POLICY IF EXISTS "Clientes pueden completar sus jobs" ON public.jobs;
DROP POLICY IF EXISTS "Trabajadores pueden cancelar jobs" ON public.jobs;

CREATE POLICY "Usuarios pueden ver sus propios jobs" 
ON public.jobs FOR SELECT 
USING (
  auth.uid() = client_id 
  OR auth.uid() IN (SELECT user_id FROM public.professionals WHERE id = professional_id)
);

CREATE POLICY "Clientes pueden crear jobs" 
ON public.jobs FOR INSERT 
WITH CHECK (
  auth.uid() = client_id
  AND NOT EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE client_id = auth.uid() 
    AND professional_id = public.jobs.professional_id 
    AND status = 'in_progress'
  )
);

CREATE POLICY "Clientes pueden completar sus jobs" 
ON public.jobs FOR UPDATE 
USING (auth.uid() = client_id AND status = 'in_progress')
WITH CHECK (status IN ('completed', 'in_progress'));

CREATE POLICY "Trabajadores pueden cancelar jobs" 
ON public.jobs FOR UPDATE 
USING (
  auth.uid() IN (SELECT user_id FROM public.professionals WHERE id = professional_id)
  AND status = 'in_progress'
)
WITH CHECK (status = 'cancelled');

-- 6. Triggers
-- ============================================

-- Trigger para actualizar contador de jobs completados
DROP TRIGGER IF EXISTS update_job_counts ON public.jobs CASCADE;
DROP FUNCTION IF EXISTS public.update_job_counts() CASCADE;

CREATE OR REPLACE FUNCTION public.update_job_counts()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.users
    SET jobs_requested_count = jobs_requested_count + 1,
        updated_at = NOW()
    WHERE id = NEW.client_id;
    
    UPDATE public.professionals
    SET completed_jobs_count = completed_jobs_count + 1,
        updated_at = NOW()
    WHERE id = NEW.professional_id;
  END IF;
  
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_job_counts() TO postgres, authenticated, anon;

CREATE TRIGGER update_job_counts
  AFTER INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_job_counts();

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_jobs_updated_at ON public.jobs CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_jobs() CASCADE;

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

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT '✅ Migración de sistema de jobs completada' as status;

-- Ver estructura de la tabla jobs
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
    AND table_name = 'jobs'
ORDER BY ordinal_position;

-- Ver políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies
WHERE tablename = 'jobs'
ORDER BY policyname;
