-- Agrega la columna email_verified a la tabla users
ALTER TABLE users ADD COLUMN email_verified boolean DEFAULT false;

-- Opcional: index para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);