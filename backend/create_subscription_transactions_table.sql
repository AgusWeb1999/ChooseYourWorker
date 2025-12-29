-- Tabla para registrar transacciones de suscripción
CREATE TABLE IF NOT EXISTS subscription_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text NOT NULL,
  status text NOT NULL, -- Ej: 'approved', 'pending', 'rejected', 'cancelled', 'refunded'
  provider text NOT NULL, -- Ej: 'mercadopago', 'paypal'
  created_at timestamptz NOT NULL DEFAULT now(),
  description text
);

-- Índice para búsquedas rápidas por usuario
CREATE INDEX IF NOT EXISTS idx_subscription_transactions_user_id ON subscription_transactions(user_id);
