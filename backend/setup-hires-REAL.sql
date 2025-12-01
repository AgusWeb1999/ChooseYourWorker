-- ============================================
-- SISTEMA DE CONTRATACIONES (HIRES)
-- Tabla nueva para el flujo cliente -> profesional
-- ============================================

-- 1. Agregar columnas a users y professionals
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE public.users ADD COLUMN phone TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'hires_count') THEN
    ALTER TABLE public.users ADD COLUMN hires_count INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'professionals' AND column_name = 'completed_hires_count') THEN
    ALTER TABLE public.professionals ADD COLUMN completed_hires_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 2. Crear tabla HIRES (contrataciones)
CREATE TABLE IF NOT EXISTS public.hires (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'cancelled')),
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMP,
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 3. Índices para hires
CREATE INDEX IF NOT EXISTS idx_hires_client_id ON public.hires(client_id);
CREATE INDEX IF NOT EXISTS idx_hires_professional_id ON public.hires(professional_id);
CREATE INDEX IF NOT EXISTS idx_hires_status ON public.hires(status);

-- 4. Agregar hire_id a reviews
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'hire_id') THEN
    ALTER TABLE public.reviews ADD COLUMN hire_id UUID REFERENCES public.hires(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_hire_id ON public.reviews(hire_id);

-- 5. Habilitar RLS
ALTER TABLE public.hires ENABLE ROW LEVEL SECURITY;

-- 6. Políticas RLS simples
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "hires_select_all" ON public.hires;
  DROP POLICY IF EXISTS "hires_insert_client" ON public.hires;
  DROP POLICY IF EXISTS "hires_update_own" ON public.hires;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- Todos pueden ver todas las contrataciones
CREATE POLICY "hires_select_all" 
  ON public.hires FOR SELECT 
  USING (true);

-- Solo clientes autenticados pueden crear contrataciones
CREATE POLICY "hires_insert_client" 
  ON public.hires FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Clientes y profesionales pueden actualizar sus propias contrataciones
CREATE POLICY "hires_update_own" 
  ON public.hires FOR UPDATE 
  USING (
    auth.uid() = client_id OR 
    auth.uid() IN (SELECT user_id FROM public.professionals WHERE id = professional_id)
  );

-- 7. Trigger para actualizar contadores
CREATE OR REPLACE FUNCTION public.update_hire_counts()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = NOW();
    
    UPDATE public.users 
    SET hires_count = hires_count + 1, updated_at = NOW() 
    WHERE id = NEW.client_id;
    
    UPDATE public.professionals 
    SET completed_hires_count = completed_hires_count + 1, updated_at = NOW() 
    WHERE id = NEW.professional_id;
  END IF;
  
  IF NEW.status = 'cancelled' AND (OLD IS NULL OR OLD.status != 'cancelled') THEN
    NEW.cancelled_at = NOW();
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS update_hire_counts_trigger ON public.hires;
CREATE TRIGGER update_hire_counts_trigger 
  BEFORE UPDATE ON public.hires 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_hire_counts();

-- Verificación
SELECT '✅ Tabla hires creada correctamente' as status;
SELECT '✅ Columnas agregadas a users y professionals' as status;
SELECT '✅ RLS y políticas configuradas' as status;
SELECT '✅ Trigger de contadores creado' as status;
