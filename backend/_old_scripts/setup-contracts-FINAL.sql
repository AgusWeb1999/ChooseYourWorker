-- ============================================
-- WORKINGGO - SISTEMA DE CONTRATACIONES
-- VERSIÓN FINAL - GARANTIZADA
-- ============================================
-- Este script está diseñado para ejecutarse sin errores
-- incluso si las tablas ya existen o no existen

-- ============================================
-- PASO 1: AGREGAR COLUMNAS A TABLAS EXISTENTES
-- ============================================

DO $$ 
BEGIN
  -- Columnas en users
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.users ADD COLUMN phone TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'contracts_requested_count'
  ) THEN
    ALTER TABLE public.users ADD COLUMN contracts_requested_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'rating'
  ) THEN
    ALTER TABLE public.users ADD COLUMN rating DECIMAL(2,1) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name = 'rating_count'
  ) THEN
    ALTER TABLE public.users ADD COLUMN rating_count INTEGER DEFAULT 0;
  END IF;

  -- Columnas en professionals
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'professionals' 
    AND column_name = 'completed_contracts_count'
  ) THEN
    ALTER TABLE public.professionals ADD COLUMN completed_contracts_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- PASO 2: CREAR TABLA CONTRACTS
-- ============================================

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

-- Índices para contracts
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON public.contracts(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_professional_id ON public.contracts(professional_id);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON public.contracts(status);

-- ============================================
-- PASO 3: CREAR TABLA CLIENT_REVIEWS
-- ============================================

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

-- Índices para client_reviews
CREATE INDEX IF NOT EXISTS idx_client_reviews_client_id ON public.client_reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_client_reviews_professional_id ON public.client_reviews(professional_id);
CREATE INDEX IF NOT EXISTS idx_client_reviews_contract_id ON public.client_reviews(contract_id);

-- ============================================
-- PASO 4: AGREGAR contract_id A REVIEWS
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reviews' 
    AND column_name = 'contract_id'
  ) THEN
    ALTER TABLE public.reviews ADD COLUMN contract_id UUID REFERENCES public.contracts(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_reviews_contract_id ON public.reviews(contract_id);

-- ============================================
-- PASO 5: HABILITAR RLS
-- ============================================

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 6: CREAR POLÍTICAS RLS (PERMISIVAS PARA PRUEBAS)
-- ============================================

-- Limpiar políticas existentes de contracts
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Ver contracts" ON public.contracts;
  DROP POLICY IF EXISTS "Crear contracts" ON public.contracts;
  DROP POLICY IF EXISTS "Actualizar contracts" ON public.contracts;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- Políticas para contracts
CREATE POLICY "Ver contracts" ON public.contracts 
  FOR SELECT USING (true);

CREATE POLICY "Crear contracts" ON public.contracts 
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Actualizar contracts" ON public.contracts 
  FOR UPDATE USING (true);

-- Limpiar políticas existentes de client_reviews
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Ver client reviews" ON public.client_reviews;
  DROP POLICY IF EXISTS "Crear client reviews" ON public.client_reviews;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

-- Políticas para client_reviews
CREATE POLICY "Ver client reviews" ON public.client_reviews 
  FOR SELECT USING (true);

CREATE POLICY "Crear client reviews" ON public.client_reviews 
  FOR INSERT WITH CHECK (true);

-- ============================================
-- PASO 7: CREAR FUNCIONES Y TRIGGERS
-- ============================================

-- Función para actualizar contadores cuando se completa un contrato
CREATE OR REPLACE FUNCTION public.update_contract_counts()
RETURNS TRIGGER 
SECURITY DEFINER 
LANGUAGE plpgsql AS $$
BEGIN
  -- Si el contrato se marcó como completado
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = NOW();
    
    -- Actualizar contador de contratos solicitados del cliente
    UPDATE public.users 
    SET contracts_requested_count = contracts_requested_count + 1,
        updated_at = NOW()
    WHERE id = NEW.client_id;
    
    -- Actualizar contador de contratos completados del profesional
    UPDATE public.professionals 
    SET completed_contracts_count = completed_contracts_count + 1,
        updated_at = NOW()
    WHERE id = NEW.professional_id;
  END IF;
  
  -- Si el contrato se canceló
  IF NEW.status = 'cancelled' AND (OLD.status IS NULL OR OLD.status != 'cancelled') THEN
    NEW.cancelled_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Otorgar permisos a la función
GRANT EXECUTE ON FUNCTION public.update_contract_counts() TO postgres, authenticated, anon;

-- Limpiar trigger existente
DROP TRIGGER IF EXISTS update_contract_counts ON public.contracts;

-- Crear trigger
CREATE TRIGGER update_contract_counts 
  BEFORE INSERT OR UPDATE ON public.contracts 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_contract_counts();

-- ============================================
-- PASO 8: VERIFICACIÓN
-- ============================================

-- Verificar que las tablas existen
DO $$
DECLARE
  contracts_exists BOOLEAN;
  client_reviews_exists BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'contracts'
  ) INTO contracts_exists;
  
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'client_reviews'
  ) INTO client_reviews_exists;
  
  IF contracts_exists AND client_reviews_exists THEN
    RAISE NOTICE '✅ Tablas creadas exitosamente: contracts, client_reviews';
  ELSE
    RAISE EXCEPTION '❌ Error: No se pudieron crear las tablas';
  END IF;
END $$;

-- Mensaje final
SELECT '✅ Migración completada exitosamente' as status;
SELECT 'Tablas: contracts, client_reviews' as info;
SELECT 'Columnas agregadas a: users, professionals, reviews' as info;
SELECT 'RLS habilitado con políticas permisivas' as info;
SELECT 'Triggers configurados para actualizar contadores' as info;
