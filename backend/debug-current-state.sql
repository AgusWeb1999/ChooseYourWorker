-- Script para debuggear el estado actual de usuarios y profesionales

-- 1. Ver todos los usuarios
SELECT 
    id,
    auth_uid,
    email,
    full_name,
    is_professional,
    created_at
FROM users
ORDER BY created_at DESC;

-- 2. Ver todos los perfiles profesionales
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

-- 3. Contar perfiles por usuario
SELECT 
    user_id,
    COUNT(*) as count,
    STRING_AGG(display_name, ', ') as names
FROM professionals
GROUP BY user_id
HAVING COUNT(*) > 1;

-- 4. Ver usuarios profesionales sin perfil profesional
SELECT 
    u.id,
    u.email,
    u.full_name,
    u.is_professional,
    p.id as professional_profile_id
FROM users u
LEFT JOIN professionals p ON u.id = p.user_id
WHERE u.is_professional = true
ORDER BY u.created_at DESC;

-- 5. Ver el último usuario registrado con detalle completo
SELECT 
    u.id as user_id,
    u.auth_uid,
    u.email,
    u.full_name,
    u.is_professional,
    u.created_at as user_created,
    p.id as prof_id,
    p.display_name,
    p.profession,
    p.created_at as prof_created
FROM users u
LEFT JOIN professionals p ON u.id = p.user_id
ORDER BY u.created_at DESC
LIMIT 5;
