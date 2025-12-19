-- Script para normalizar ciudades y profesiones en la base de datos
-- Ejecutar este script una vez para limpiar los datos existentes

-- Normalizar ciudades (primera letra mayúscula, resto minúscula)
UPDATE professionals
SET city = INITCAP(LOWER(city))
WHERE city IS NOT NULL;

-- Normalizar profesiones (primera letra mayúscula, resto minúscula)
UPDATE professionals
SET profession = INITCAP(LOWER(profession))
WHERE profession IS NOT NULL;

-- Verificar los cambios
SELECT DISTINCT city FROM professionals ORDER BY city;
SELECT DISTINCT profession FROM professionals ORDER BY profession;
