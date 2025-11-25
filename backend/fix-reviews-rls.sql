-- ==========================================
-- ARREGLAR: RLS y Permisos de Reviews
-- ==========================================

-- Ver las políticas actuales
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'reviews';

-- Eliminar TODAS las políticas existentes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'reviews'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON reviews';
        RAISE NOTICE 'Eliminada política: %', policy_record.policyname;
    END LOOP;
END $$;

-- Deshabilitar RLS temporalmente para probar
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;

-- Volver a habilitar RLS con políticas correctas
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Política 1: Cualquiera puede VER las reviews
CREATE POLICY "Anyone can view reviews"
ON reviews FOR SELECT
USING (true);

-- Política 2: Solo usuarios autenticados pueden CREAR reviews
CREATE POLICY "Authenticated users can create reviews"
ON reviews FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- Política 3: Solo el autor puede ACTUALIZAR su review
CREATE POLICY "Users can update their own reviews"
ON reviews FOR UPDATE
USING (client_id IN (SELECT id FROM users WHERE auth_uid = auth.uid()));

-- Política 4: Solo el autor puede ELIMINAR su review
CREATE POLICY "Users can delete their own reviews"
ON reviews FOR DELETE
USING (client_id IN (SELECT id FROM users WHERE auth_uid = auth.uid()));

-- Verificar que las políticas se crearon
SELECT 
    '✅ Políticas RLS creadas' as resultado;

SELECT 
    policyname,
    cmd,
    CASE 
        WHEN cmd = 'SELECT' THEN '👁️  Ver'
        WHEN cmd = 'INSERT' THEN '➕ Crear'
        WHEN cmd = 'UPDATE' THEN '✏️  Editar'
        WHEN cmd = 'DELETE' THEN '🗑️  Eliminar'
    END as accion
FROM pg_policies
WHERE tablename = 'reviews'
ORDER BY cmd;

-- RESUMEN
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ POLÍTICAS RLS ACTUALIZADAS';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Políticas configuradas:';
    RAISE NOTICE '  👁️  Anyone can view reviews';
    RAISE NOTICE '  ➕ Authenticated users can create reviews';
    RAISE NOTICE '  ✏️  Users can update their own reviews';
    RAISE NOTICE '  🗑️  Users can delete their own reviews';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Próximos pasos:';
    RAISE NOTICE '  1. Recarga el frontend (r)';
    RAISE NOTICE '  2. Intenta dejar una reseña';
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
