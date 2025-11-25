-- Verificar que el constraint UNIQUE está activo en la tabla professionals

-- 1. Ver todos los constraints de la tabla professionals
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'professionals'::regclass;

-- 2. Verificar específicamente el constraint unique en user_id
SELECT 
    conname AS constraint_name,
    contype AS constraint_type
FROM pg_constraint
WHERE conrelid = 'professionals'::regclass
  AND contype = 'u'  -- 'u' = UNIQUE constraint
  AND conname = 'professionals_user_id_key';

-- 3. Contar cuántos perfiles profesionales hay por usuario (debe ser 1 para cada uno)
SELECT 
    user_id, 
    COUNT(*) as profile_count,
    STRING_AGG(display_name, ', ') as names
FROM professionals
GROUP BY user_id
ORDER BY profile_count DESC, user_id;

-- 4. Ver todos los perfiles profesionales actuales
SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.profession,
    p.created_at,
    u.email,
    u.full_name,
    u.is_professional
FROM professionals p
JOIN users u ON p.user_id = u.id
ORDER BY p.created_at DESC;
