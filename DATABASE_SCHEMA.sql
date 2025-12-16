-- Database Schema Updates for Notification System
-- Run these SQL queries in Supabase to enable the notification features

-- =====================================================
-- 1. CREATE NOTIFICATIONS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_name VARCHAR(100),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  related_type VARCHAR(50),
  action_url TEXT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true);

-- =====================================================
-- 2. UPDATE HIRINGS TABLE
-- =====================================================

-- Add new columns for message and contact visibility
ALTER TABLE hirings ADD COLUMN IF NOT EXISTS hire_message TEXT;
ALTER TABLE hirings ADD COLUMN IF NOT EXISTS accepted_status VARCHAR(20) DEFAULT 'pending_acceptance';
ALTER TABLE hirings ADD COLUMN IF NOT EXISTS professional_phone VARCHAR(20);
ALTER TABLE hirings ADD COLUMN IF NOT EXISTS professional_address TEXT;
ALTER TABLE hirings ADD COLUMN IF NOT EXISTS professional_email VARCHAR(100);
ALTER TABLE hirings ADD COLUMN IF NOT EXISTS client_name VARCHAR(100);

-- Create index for status queries
CREATE INDEX IF NOT EXISTS idx_hirings_status ON hirings(status);
CREATE INDEX IF NOT EXISTS idx_hirings_accepted_status ON hirings(accepted_status);

-- =====================================================
-- 3. UPDATE JOBS TABLE (FOR PROFESSIONALS)
-- =====================================================

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS hire_message TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_contact_visible BOOLEAN DEFAULT FALSE;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_phone VARCHAR(20);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_address TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS client_email VARCHAR(100);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_client_id ON jobs(client_id);

-- =====================================================
-- 4. CREATE EMAIL LOG TABLE (FOR TRACKING)
-- =====================================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID REFERENCES notifications(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed, bounced
  error_message TEXT,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_email_logs_status ON email_logs(status);
CREATE INDEX idx_email_logs_created_at ON email_logs(created_at DESC);

-- =====================================================
-- 5. CREATE PUSH TOKENS TABLE (FOR EXPO)
-- =====================================================

CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform VARCHAR(20), -- ios, android
  is_valid BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_push_tokens_user_id ON push_tokens(user_id);

-- Enable RLS
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own push tokens"
  ON push_tokens FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- 6. CREATE NOTIFICATION PREFERENCES TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  push_notifications BOOLEAN DEFAULT TRUE,
  in_app_notifications BOOLEAN DEFAULT TRUE,
  solicitud_enviada BOOLEAN DEFAULT TRUE,
  solicitud_aceptada BOOLEAN DEFAULT TRUE,
  solicitud_rechazada BOOLEAN DEFAULT TRUE,
  trabajo_completado BOOLEAN DEFAULT TRUE,
  mensaje_nuevo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own preferences"
  ON notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- 7. UPDATE PROFILES TABLE
-- =====================================================

-- Add contact fields (if not already exist)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT;

-- =====================================================
-- 8. TRIGGERS & FUNCTIONS
-- =====================================================

-- Function to update 'updated_at' column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER trigger_notifications_updated_at
BEFORE UPDATE ON notifications
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_push_tokens_updated_at
BEFORE UPDATE ON push_tokens
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_notification_preferences_updated_at
BEFORE UPDATE ON notification_preferences
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 9. VIEWS FOR EASIER QUERIES
-- =====================================================

-- View for unread notifications count
CREATE OR REPLACE VIEW unread_notifications_count AS
SELECT 
  user_id,
  COUNT(*) as count
FROM notifications
WHERE read = FALSE
GROUP BY user_id;

-- View for recent notifications
CREATE OR REPLACE VIEW recent_notifications AS
SELECT *
FROM notifications
WHERE created_at > NOW() - INTERVAL '7 days'
ORDER BY created_at DESC;

-- =====================================================
-- 10. SAMPLE DATA (FOR TESTING)
-- =====================================================

-- Insert test notification (after setting up auth user)
-- INSERT INTO notifications (
--   type, user_id, sender_id, sender_name, title, message, related_id, related_type
-- ) VALUES (
--   'solicitud_enviada',
--   'user-uuid-here',
--   'pro-uuid-here',
--   'Juan García',
--   'Nueva solicitud de contratación',
--   'Juan García quiere contratar tus servicios',
--   'hiring-id-here',
--   'hiring'
-- );

-- =====================================================
-- 11. SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12. CLEANUP/DROP (if needed)
-- =====================================================

-- DROP TABLE IF EXISTS notifications CASCADE;
-- DROP TABLE IF EXISTS email_logs CASCADE;
-- DROP TABLE IF EXISTS push_tokens CASCADE;
-- DROP TABLE IF EXISTS notification_preferences CASCADE;
-- DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =====================================================
-- MIGRATION SCRIPT SUMMARY
-- =====================================================
/*

Este script SQL configura la base de datos para el sistema de notificaciones.

Tablas creadas:
1. notifications - Almacena todas las notificaciones
2. email_logs - Historial de emails enviados
3. push_tokens - Tokens de Expo para push notifications
4. notification_preferences - Preferencias de usuario

Tablas modificadas:
1. hirings - Agrega campos para mensaje y contacto
2. jobs - Agrega campos para mensaje y contacto
3. profiles - Agrega campos de teléfono y dirección

Funcionalidades incluidas:
✅ Row Level Security (RLS)
✅ Indexes para performance
✅ Triggers para updated_at
✅ Views para queries comunes
✅ Audit trail con email_logs

Próximos pasos:
1. Ejecutar este script en Supabase SQL Editor
2. Implementar backend en API (Node/Express)
3. Conectar Frontend con endpoints
4. Setup SendGrid/Resend para emails
5. Setup Expo Push Notifications

*/
