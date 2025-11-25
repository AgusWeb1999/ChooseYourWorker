-- Script para eliminar perfiles profesionales duplicados
-- Mantiene solo el perfil más reciente de cada usuario

-- 1. Ver los duplicados antes de eliminar
SELECT user_id, COUNT(*) as count
FROM professionals
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 2. Eliminar duplicados, manteniendo solo el más reciente
DELETE FROM professionals
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM professionals
  ORDER BY user_id, created_at DESC
);

-- 3. Agregar constraint UNIQUE para prevenir duplicados futuros
ALTER TABLE professionals
DROP CONSTRAINT IF EXISTS professionals_user_id_key;

ALTER TABLE professionals
ADD CONSTRAINT professionals_user_id_key UNIQUE (user_id);

-- 4. Verificar que no hay duplicados
SELECT user_id, COUNT(*) as count
FROM professionals
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 5. Ver todos los perfiles profesionales restantes
SELECT p.id, p.user_id, p.display_name, p.profession, p.created_at, u.email, u.full_name
FROM professionals p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC;
