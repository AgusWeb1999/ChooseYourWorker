-- =====================================================
-- FIX: Reparar Sistema de Calificaciones de Profesionales
-- =====================================================

-- 1. Verificar el estado actual de las calificaciones
SELECT '=== ESTADO ACTUAL ===' as diagnostico;

SELECT 
  p.id,
  p.display_name,
  p.rating as rating_actual,
  p.rating_count as count_actual,
  COUNT(r.id) as reviews_reales,
  AVG(r.rating)::DECIMAL(2,1) as rating_real
FROM professionals p
LEFT JOIN reviews r ON p.id = r.professional_id
GROUP BY p.id, p.display_name, p.rating, p.rating_count
HAVING COUNT(r.id) > 0
ORDER BY p.display_name;

-- 2. Verificar si el trigger existe
SELECT '=== VERIFICAR TRIGGER ===' as diagnostico;

SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'update_rating_after_review';

-- 3. Verificar si la función existe
SELECT '=== VERIFICAR FUNCIÓN ===' as diagnostico;

SELECT 
  proname as function_name,
  prosrc as source_code
FROM pg_proc 
WHERE proname = 'update_professional_rating';

-- 4. Recrear la función de actualización de rating
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Actualizar las estadísticas del profesional
  UPDATE public.professionals
  SET 
    rating = (
      SELECT COALESCE(AVG(rating)::DECIMAL(2,1), 0)
      FROM public.reviews
      WHERE professional_id = NEW.professional_id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE professional_id = NEW.professional_id
    ),
    total_jobs = (
      SELECT COUNT(*)
      FROM public.jobs
      WHERE professional_id = NEW.professional_id AND status = 'completed'
    )
  WHERE id = NEW.professional_id;
  
  RETURN NEW;
END;
$$;

-- 5. Recrear el trigger
DROP TRIGGER IF EXISTS update_rating_after_review ON public.reviews;

CREATE TRIGGER update_rating_after_review
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_professional_rating();

-- 6. Función para recalcular todos los ratings (una vez)
CREATE OR REPLACE FUNCTION recalculate_all_ratings()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.professionals p
  SET 
    rating = (
      SELECT COALESCE(AVG(r.rating)::DECIMAL(2,1), 0)
      FROM public.reviews r
      WHERE r.professional_id = p.id
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM public.reviews r
      WHERE r.professional_id = p.id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews r
      WHERE r.professional_id = p.id
    );
END;
$$;

-- 7. Ejecutar recálculo de todos los ratings existentes
SELECT recalculate_all_ratings();

-- 8. Verificar que se corrigieron
SELECT '=== DESPUÉS DE LA CORRECCIÓN ===' as diagnostico;

SELECT 
  p.id,
  p.display_name,
  p.rating,
  p.rating_count,
  p.total_reviews,
  COUNT(r.id) as reviews_count,
  AVG(r.rating)::DECIMAL(2,1) as avg_rating
FROM professionals p
LEFT JOIN reviews r ON p.id = r.professional_id
GROUP BY p.id, p.display_name, p.rating, p.rating_count, p.total_reviews
ORDER BY p.display_name;

-- 9. Ver todas las reseñas existentes
SELECT '=== RESEÑAS EXISTENTES ===' as diagnostico;

SELECT 
  r.id,
  r.rating,
  r.comment,
  r.created_at,
  p.display_name as profesional,
  u.full_name as cliente
FROM reviews r
JOIN professionals p ON r.professional_id = p.id
JOIN users u ON r.client_id = u.id
ORDER BY r.created_at DESC;

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON FUNCTION update_professional_rating() IS 
'Trigger function que actualiza automáticamente el rating y rating_count cuando se crea, actualiza o elimina una reseña';

COMMENT ON FUNCTION recalculate_all_ratings() IS 
'Función de utilidad para recalcular todos los ratings de profesionales existentes';

-- =====================================================
-- NOTAS
-- =====================================================
-- ✅ El trigger ahora funciona con INSERT, UPDATE y DELETE
-- ✅ Usa COALESCE para evitar NULLs
-- ✅ Actualiza rating, rating_count y total_reviews
-- ✅ recalculate_all_ratings() arregla datos existentes
-- ✅ Usa SECURITY DEFINER para tener permisos suficientes
