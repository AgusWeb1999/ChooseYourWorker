-- ============================================
-- WORKINGGO - SISTEMA DE CONTRATACIONES
-- ============================================
-- Paso 1: Solo crear tablas e índices
-- Las políticas RLS se crean DESPUÉS

-- Limpiar triggers y funciones viejas
DROP TRIGGER IF EXISTS update_rating_after_review ON public.reviews CASCADE;
DROP TRIGGER IF EXISTS update_client_rating_after_review ON public.client_reviews CASCADE;
DROP TRIGGER IF EXISTS update_contract_counts ON public.contracts CASCADE;
DROP FUNCTION IF EXISTS public.update_professional_rating() CASCADE;
DROP FUNCTION IF EXISTS public.update_client_rating() CASCADE;
DROP FUNCTION IF EXISTS public.update_contract_counts() CASCADE;

-- Agregar columnas necesarias
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE public.users ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'contracts_requested_count') THEN
    ALTER TABLE public.users ADD COLUMN contracts_requested_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'rating') THEN
    ALTER TABLE public.users ADD COLUMN rating DECIMAL(2,1) DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'rating_count') THEN
    ALTER TABLE public.users ADD COLUMN rating_count INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'professionals' AND column_name = 'completed_contracts_count') THEN
    ALTER TABLE public.professionals ADD COLUMN completed_contracts_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Crear tabla CONTRACTS (en vez de jobs)
CREATE TABLE IF NOT EXISTS public.contracts (
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

CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_professional_id ON public.contracts(professional_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);

-- Crear tabla CLIENT_REVIEWS
CREATE TABLE IF NOT EXISTS public.client_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.contracts(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE(contract_id)
);

CREATE INDEX IF NOT EXISTS idx_client_reviews_client_id ON public.client_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_client_reviews_professional_id ON public.client_reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_client_reviews_contract_id ON public.client_reviews(contract_id);

-- Agregar contract_id a reviews
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reviews' AND column_name = 'contract_id') THEN
    ALTER TABLE public.reviews ADD COLUMN contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_contract_id ON public.reviews(contract_id);

-- ============================================
-- PASO 2: HABILITAR RLS (sin políticas todavía)
-- ============================================

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 3: CREAR POLÍTICAS RLS SIMPLES
-- ============================================

-- Políticas SIMPLES para reviews
CREATE POLICY "Cualquiera puede ver reviews" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Usuarios pueden crear reviews" ON public.reviews FOR INSERT WITH CHECK (true);

-- Políticas SIMPLES para contracts (sin referencias complejas)
CREATE POLICY "Ver contracts" ON public.contracts FOR SELECT USING (true);
CREATE POLICY "Crear contracts" ON public.contracts FOR INSERT WITH CHECK (true);
CREATE POLICY "Actualizar contracts" ON public.contracts FOR UPDATE USING (true);

-- Políticas SIMPLES para client_reviews
CREATE POLICY "Ver client reviews" ON public.client_reviews FOR SELECT USING (true);
CREATE POLICY "Crear client reviews" ON public.client_reviews FOR INSERT WITH CHECK (true);

-- ============================================
-- PASO 4: TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION public.update_contract_counts()
RETURNS TRIGGER SECURITY DEFINER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = NOW();
    UPDATE public.users SET contracts_requested_count = contracts_requested_count + 1, updated_at = NOW() WHERE id = NEW.client_id;
    UPDATE public.professionals SET completed_contracts_count = completed_contracts_count + 1, updated_at = NOW() WHERE id = NEW.professional_id;
  END IF;
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
    NEW.cancelled_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_contract_counts() TO postgres, authenticated, anon;
CREATE TRIGGER update_contract_counts BEFORE INSERT OR UPDATE ON public.contracts FOR EACH ROW EXECUTE FUNCTION public.update_contract_counts();

-- ============================================
-- VERIFICACIÓN
-- ============================================

SELECT '✅ Tablas creadas: contracts, client_reviews' as status;
SELECT '✅ Columnas agregadas a users y professionals' as status;
SELECT '✅ RLS habilitado con políticas simples' as status;
SELECT '✅ Triggers configurados' as status;
