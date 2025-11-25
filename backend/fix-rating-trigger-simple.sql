-- ==========================================
-- ARREGLAR: Trigger de Rating (Versión Simplificada)
-- ==========================================

-- Eliminar el trigger problemático y todos los triggers dependientes
DROP TRIGGER IF EXISTS update_rating_after_review ON public.reviews;
DROP TRIGGER IF EXISTS trigger_update_rating_on_insert ON public.reviews;
DROP TRIGGER IF EXISTS trigger_update_rating_on_update ON public.reviews;
DROP TRIGGER IF EXISTS trigger_update_rating_on_delete ON public.reviews;

-- Eliminar la función con CASCADE para eliminar cualquier dependencia restante
DROP FUNCTION IF EXISTS update_professional_rating() CASCADE;

-- Crear función simplificada (solo ratings, sin jobs)
CREATE OR REPLACE FUNCTION update_professional_rating()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
    target_professional_id UUID;
BEGIN
    -- Determinar qué professional actualizar
    IF TG_OP = 'DELETE' THEN
        target_professional_id := OLD.professional_id;
    ELSE
        target_professional_id := NEW.professional_id;
    END IF;
    
    -- Actualizar solo rating y rating_count (sin total_jobs)
    UPDATE public.professionals
    SET 
        rating = (
            SELECT COALESCE(AVG(rating)::DECIMAL(2,1), 0)
            FROM public.reviews
            WHERE professional_id = target_professional_id
        ),
        rating_count = (
            SELECT COUNT(*)
            FROM public.reviews
            WHERE professional_id = target_professional_id
        )
    WHERE id = target_professional_id;
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;

-- Recrear el trigger
CREATE TRIGGER update_rating_after_review
    AFTER INSERT OR UPDATE OR DELETE ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_professional_rating();

-- Recalcular todos los ratings existentes
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
    );

-- Verificar
SELECT 
    p.id,
    p.display_name,
    p.rating,
    p.rating_count,
    COUNT(r.id) as reviews_reales
FROM professionals p
LEFT JOIN reviews r ON p.id = r.professional_id
GROUP BY p.id, p.display_name, p.rating, p.rating_count
ORDER BY p.display_name;

-- Resumen
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ TRIGGER DE RATING ARREGLADO';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Cambios:';
    RAISE NOTICE '  ✅ Eliminada referencia a tabla jobs';
    RAISE NOTICE '  ✅ Trigger simplificado y funcional';
    RAISE NOTICE '  ✅ Ratings recalculados';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximos pasos:';
    RAISE NOTICE '  1. Recarga el frontend (r)';
    RAISE NOTICE '  2. Intenta dejar una reseña';
    RAISE NOTICE '  3. Verifica que se actualiza el rating';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
