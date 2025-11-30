-- ============================================
-- SISTEMA DE SUSCRIPCIONES PREMIUM
-- ============================================
-- Este script agrega todo lo necesario para el sistema de suscripciones

-- 1. AGREGAR CAMPOS DE SUSCRIPCIÓN A USERS
-- ============================================

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS subscription_type TEXT DEFAULT 'free' CHECK (subscription_type IN ('free', 'premium')),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_provider TEXT CHECK (payment_provider IN ('mercadopago', 'paypal', NULL)),
ADD COLUMN IF NOT EXISTS subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'pending'));

-- Índices para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_users_subscription_type ON public.users(subscription_type);
CREATE INDEX IF NOT EXISTS idx_users_subscription_end_date ON public.users(subscription_end_date);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON public.users(subscription_status);

-- 2. TABLA DE TRANSACCIONES DE PAGO
-- ============================================

CREATE TABLE IF NOT EXISTS public.payment_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'ARS',
  payment_provider TEXT NOT NULL CHECK (payment_provider IN ('mercadopago', 'paypal')),
  transaction_id TEXT NOT NULL, -- ID de la transacción en el proveedor
  subscription_id TEXT, -- ID de suscripción en el proveedor
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'refunded')),
  metadata JSONB, -- Información adicional del proveedor
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_transactions_user_id ON public.payment_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON public.payment_transactions(payment_provider);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_created_at ON public.payment_transactions(created_at DESC);

-- 3. TABLA DE HISTORIAL DE SUSCRIPCIONES
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscription_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  subscription_type TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('activated', 'renewed', 'cancelled', 'expired', 'downgraded')),
  payment_provider TEXT CHECK (payment_provider IN ('mercadopago', 'paypal')),
  transaction_id UUID REFERENCES public.payment_transactions(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscription_history_user_id ON public.subscription_history(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_history_created_at ON public.subscription_history(created_at DESC);

-- 4. POLÍTICAS RLS (Row Level Security)
-- ============================================

-- Payment Transactions
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver sus propias transacciones" ON public.payment_transactions;
CREATE POLICY "Usuarios pueden ver sus propias transacciones" 
ON public.payment_transactions FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema puede insertar transacciones" ON public.payment_transactions;
CREATE POLICY "Sistema puede insertar transacciones" 
ON public.payment_transactions FOR INSERT 
WITH CHECK (true); -- Los webhooks necesitan insertar

DROP POLICY IF EXISTS "Sistema puede actualizar transacciones" ON public.payment_transactions;
CREATE POLICY "Sistema puede actualizar transacciones" 
ON public.payment_transactions FOR UPDATE 
USING (true); -- Los webhooks necesitan actualizar

-- Subscription History
ALTER TABLE public.subscription_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Usuarios pueden ver su historial" ON public.subscription_history;
CREATE POLICY "Usuarios pueden ver su historial" 
ON public.subscription_history FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Sistema puede insertar historial" ON public.subscription_history;
CREATE POLICY "Sistema puede insertar historial" 
ON public.subscription_history FOR INSERT 
WITH CHECK (true);

-- 5. FUNCIÓN PARA VERIFICAR SI LA SUSCRIPCIÓN ESTÁ ACTIVA
-- ============================================

CREATE OR REPLACE FUNCTION public.is_subscription_active(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_active BOOLEAN;
BEGIN
  SELECT 
    subscription_type = 'premium' 
    AND subscription_status = 'active'
    AND subscription_end_date > NOW()
  INTO v_is_active
  FROM public.users
  WHERE id = user_uuid;
  
  RETURN COALESCE(v_is_active, false);
END;
$$;

-- 6. FUNCIÓN PARA ACTUALIZAR SUSCRIPCIÓN
-- ============================================

CREATE OR REPLACE FUNCTION public.update_subscription(
  p_user_id UUID,
  p_subscription_type TEXT,
  p_subscription_status TEXT,
  p_payment_provider TEXT,
  p_subscription_id TEXT,
  p_months INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_start_date TIMESTAMPTZ;
  v_end_date TIMESTAMPTZ;
BEGIN
  v_start_date := NOW();
  v_end_date := NOW() + (p_months || ' months')::INTERVAL;
  
  UPDATE public.users
  SET 
    subscription_type = p_subscription_type,
    subscription_status = p_subscription_status,
    subscription_start_date = v_start_date,
    subscription_end_date = v_end_date,
    payment_provider = p_payment_provider,
    subscription_id = p_subscription_id,
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Registrar en historial
  INSERT INTO public.subscription_history (user_id, subscription_type, action, payment_provider)
  VALUES (p_user_id, p_subscription_type, 'activated', p_payment_provider);
END;
$$;

-- 7. FUNCIÓN PARA CANCELAR SUSCRIPCIÓN
-- ============================================

CREATE OR REPLACE FUNCTION public.cancel_subscription(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.users
  SET 
    subscription_status = 'cancelled',
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Registrar en historial
  INSERT INTO public.subscription_history (user_id, subscription_type, action, payment_provider)
  SELECT subscription_type, 'cancelled', payment_provider
  FROM public.users
  WHERE id = p_user_id;
END;
$$;

-- 8. FUNCIÓN PARA EXPIRAR SUSCRIPCIONES VENCIDAS
-- ============================================
-- Esta función debe ejecutarse diariamente con un cron job

CREATE OR REPLACE FUNCTION public.expire_subscriptions()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_affected_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE public.users
    SET 
      subscription_type = 'free',
      subscription_status = 'inactive',
      updated_at = NOW()
    WHERE subscription_end_date < NOW()
      AND subscription_status = 'active'
      AND subscription_type = 'premium'
    RETURNING id, subscription_type, payment_provider
  )
  INSERT INTO public.subscription_history (user_id, subscription_type, action, payment_provider)
  SELECT id, subscription_type, 'expired', payment_provider
  FROM expired;
  
  GET DIAGNOSTICS v_affected_count = ROW_COUNT;
  RETURN v_affected_count;
END;
$$;

-- 9. TRIGGER PARA ACTUALIZAR TIMESTAMP
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON public.payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON public.payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 10. VISTAS ÚTILES
-- ============================================

-- Vista de usuarios premium activos
CREATE OR REPLACE VIEW public.active_premium_users AS
SELECT 
  u.id,
  u.email,
  u.full_name,
  u.subscription_start_date,
  u.subscription_end_date,
  u.payment_provider,
  u.subscription_id
FROM public.users u
WHERE u.subscription_type = 'premium'
  AND u.subscription_status = 'active'
  AND u.subscription_end_date > NOW();

-- Vista de transacciones recientes
CREATE OR REPLACE VIEW public.recent_transactions AS
SELECT 
  pt.id,
  pt.user_id,
  u.email,
  u.full_name,
  pt.amount,
  pt.currency,
  pt.payment_provider,
  pt.status,
  pt.created_at
FROM public.payment_transactions pt
JOIN public.users u ON u.id = pt.user_id
ORDER BY pt.created_at DESC
LIMIT 100;

-- 11. INSERTAR CONFIGURACIÓN DE PRECIOS
-- ============================================

CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  price_ars DECIMAL(10,2) NOT NULL,
  price_usd DECIMAL(10,2) NOT NULL,
  duration_months INTEGER NOT NULL DEFAULT 1,
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.subscription_plans (name, price_ars, price_usd, duration_months, features)
VALUES (
  'Premium Mensual',
  4999.00,
  9.99,
  1,
  '{"unlimited_messages": true, "priority_support": true, "featured_profile": true, "advanced_filters": true}'::jsonb
)
ON CONFLICT DO NOTHING;

-- 12. COMENTARIOS PARA DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE public.payment_transactions IS 'Registro de todas las transacciones de pago realizadas';
COMMENT ON TABLE public.subscription_history IS 'Historial de cambios en las suscripciones de usuarios';
COMMENT ON TABLE public.subscription_plans IS 'Planes de suscripción disponibles con sus precios';
COMMENT ON FUNCTION public.is_subscription_active IS 'Verifica si un usuario tiene una suscripción premium activa';
COMMENT ON FUNCTION public.update_subscription IS 'Actualiza la suscripción de un usuario cuando se confirma un pago';
COMMENT ON FUNCTION public.cancel_subscription IS 'Cancela la suscripción de un usuario';
COMMENT ON FUNCTION public.expire_subscriptions IS 'Expira automáticamente las suscripciones vencidas (ejecutar diariamente)';
