-- =====================================================
-- Script para Actualizar Profesiones de Inglés a Español
-- =====================================================

-- 1. Ver las profesiones actuales
SELECT DISTINCT profession, COUNT(*) as cantidad
FROM professionals
GROUP BY profession
ORDER BY profession;

-- 2. Actualizar profesiones de inglés a español
UPDATE professionals SET profession = 'Carpintero' WHERE profession = 'Carpenter';
UPDATE professionals SET profession = 'Electricista' WHERE profession = 'Electrician';
UPDATE professionals SET profession = 'Plomero' WHERE profession = 'Plumber';
UPDATE professionals SET profession = 'Pintor' WHERE profession = 'Painter';
UPDATE professionals SET profession = 'Técnico de HVAC' WHERE profession = 'HVAC Technician';
UPDATE professionals SET profession = 'Jardinero' WHERE profession = 'Gardener';
UPDATE professionals SET profession = 'Limpieza del Hogar' WHERE profession = 'House Cleaning';
UPDATE professionals SET profession = 'Mantenimiento General' WHERE profession = 'Handyman';
UPDATE professionals SET profession = 'Servicios de Mudanza' WHERE profession = 'Moving Services';
UPDATE professionals SET profession = 'Cerrajero' WHERE profession = 'Locksmith';
UPDATE professionals SET profession = 'Albañil' WHERE profession = 'Mason';
UPDATE professionals SET profession = 'Gasista' WHERE profession = 'Gas Technician';
UPDATE professionals SET profession = 'Techista' WHERE profession = 'Roofer';
UPDATE professionals SET profession = 'Decorador' WHERE profession = 'Decorator';
UPDATE professionals SET profession = 'Control de Plagas' WHERE profession = 'Pest Control';

-- 3. Ver las profesiones después de la actualización
SELECT DISTINCT profession, COUNT(*) as cantidad
FROM professionals
GROUP BY profession
ORDER BY profession;

-- 4. Listar todos los profesionales con sus profesiones actualizadas
SELECT 
  id,
  display_name,
  profession,
  city,
  state,
  average_rating,
  total_reviews
FROM professionals
ORDER BY display_name;
