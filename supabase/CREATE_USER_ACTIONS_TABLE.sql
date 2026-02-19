-- Tabla para trackear acciones de usuarios (tracking simple y anónimo)
-- Ejecutar este script en Supabase SQL Editor para crear la tabla

CREATE TABLE IF NOT EXISTS user_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  
  -- Tipo de acción realizada (ej: "search_professionals_clicked")
  action_type TEXT NOT NULL,
  
  -- Datos adicionales en JSON (ej: {category: "Electricista", city: "Montevideo"})
  action_data JSONB,
  
  -- Origen de la acción (ej: "login_page")
  source TEXT,
  
  -- Usuario asociado (NULL si es anónimo, se llena automáticamente si está logueado)
  user_id UUID
);

-- Índices para mejorar rendimiento de queries
CREATE INDEX IF NOT EXISTS idx_user_actions_action_type ON user_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_user_actions_created_at ON user_actions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_actions_user_id ON user_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_actions_source ON user_actions(source);

-- Dar permisos de INSERT a los roles anon y authenticated
GRANT INSERT ON user_actions TO anon, authenticated;

-- IMPORTANTE: RLS está DESHABILITADO para esta tabla
-- El tracking es data pública (clicks anónimos) y no necesita protección
-- Esto permite que funcione sin problemas de permisos
ALTER TABLE user_actions DISABLE ROW LEVEL SECURITY;

-- Nota: Los datos se pueden consultar solo desde el SQL Editor de Supabase
-- o desde el admin dashboard que usa consultas autenticadas

-- Comentarios para documentación
COMMENT ON TABLE user_actions IS 'Tracking simple de acciones de usuarios (anónimos y logueados)';
COMMENT ON COLUMN user_actions.action_type IS 'Tipo de evento: search_professionals_clicked, profile_viewed, etc.';
COMMENT ON COLUMN user_actions.action_data IS 'Datos del evento en JSON: {category, city, department, etc}';
COMMENT ON COLUMN user_actions.source IS 'Origen: login_page, home_page, explore_page, etc.';

-- ============================================
-- QUERIES ÚTILES PARA CONSULTAR LOS DATOS
-- ============================================

-- Ver últimos 50 eventos registrados
-- SELECT * FROM user_actions ORDER BY created_at DESC LIMIT 50;

-- Contar cuántas veces se tocó "Buscar profesionales"
-- SELECT COUNT(*) as total_clicks 
-- FROM user_actions 
-- WHERE action_type = 'search_professionals_clicked';

-- Ver qué categorías buscan más
-- SELECT 
--   action_data->>'category' as categoria,
--   COUNT(*) as cantidad
-- FROM user_actions 
-- WHERE action_type = 'search_professionals_clicked'
-- GROUP BY action_data->>'category'
-- ORDER BY cantidad DESC;

-- Ver qué ciudades buscan más
-- SELECT 
--   action_data->>'city' as ciudad,
--   COUNT(*) as cantidad
-- FROM user_actions 
-- WHERE action_type = 'search_professionals_clicked'
-- GROUP BY action_data->>'city'
-- ORDER BY cantidad DESC;

-- Eventos por día (últimos 7 días)
-- SELECT 
--   DATE(created_at) as fecha,
--   COUNT(*) as eventos
-- FROM user_actions
-- WHERE created_at >= NOW() - INTERVAL '7 days'
-- GROUP BY DATE(created_at)
-- ORDER BY fecha DESC;
