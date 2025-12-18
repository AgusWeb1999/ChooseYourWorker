-- Fix reviews constraint to allow multiple reviews per client-professional pair
-- But only one review per hire (trabajo realizado)

-- 1. Verificar constraints actuales en la tabla reviews
SELECT 
    con.conname as constraint_name,
    con.contype as constraint_type,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'reviews';

-- 2. Eliminar constraint única antigua si existe (basada en client_id + professional_id)
DO $$ 
BEGIN
    -- Buscar y eliminar constraints únicos que involucren client_id y professional_id pero no hire_id
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'reviews' 
        AND con.contype = 'u'
        AND pg_get_constraintdef(con.oid) LIKE '%client_id%'
        AND pg_get_constraintdef(con.oid) LIKE '%professional_id%'
        AND pg_get_constraintdef(con.oid) NOT LIKE '%hire_id%'
    ) THEN
        EXECUTE (
            SELECT 'ALTER TABLE reviews DROP CONSTRAINT ' || con.conname || ';'
            FROM pg_constraint con
            JOIN pg_class rel ON rel.oid = con.conrelid
            WHERE rel.relname = 'reviews' 
            AND con.contype = 'u'
            AND pg_get_constraintdef(con.oid) LIKE '%client_id%'
            AND pg_get_constraintdef(con.oid) LIKE '%professional_id%'
            AND pg_get_constraintdef(con.oid) NOT LIKE '%hire_id%'
            LIMIT 1
        );
        RAISE NOTICE 'Constraint antigua eliminada';
    END IF;
END $$;

-- 3. Crear constraint única correcta: una reseña por hire_id
-- Esto permite que el mismo cliente deje múltiples reseñas al mismo profesional,
-- pero solo una reseña por cada trabajo realizado
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint con
        JOIN pg_class rel ON rel.oid = con.conrelid
        WHERE rel.relname = 'reviews' 
        AND con.conname = 'reviews_hire_id_unique'
    ) THEN
        ALTER TABLE reviews ADD CONSTRAINT reviews_hire_id_unique UNIQUE (hire_id);
        RAISE NOTICE 'Constraint reviews_hire_id_unique creada correctamente';
    ELSE
        RAISE NOTICE 'Constraint reviews_hire_id_unique ya existe';
    END IF;
END $$;

-- 4. Verificar la nueva estructura
SELECT 
    con.conname as constraint_name,
    con.contype as constraint_type,
    pg_get_constraintdef(con.oid) as constraint_definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
WHERE rel.relname = 'reviews'
ORDER BY con.conname;

-- 5. Verificar que hire_id no sea null en reviews existentes
SELECT COUNT(*) as reviews_sin_hire_id
FROM reviews
WHERE hire_id IS NULL;

-- Si hay reviews sin hire_id, necesitarás asignarles un hire_id válido o eliminarlas
-- antes de aplicar la constraint NOT NULL si es necesaria
