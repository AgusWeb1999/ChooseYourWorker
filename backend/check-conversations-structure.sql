-- ==========================================
-- VERIFICAR: Estructura de la tabla conversations
-- ==========================================

-- Ver todas las columnas de la tabla conversations
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'conversations'
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Ver los datos de una conversación de ejemplo
SELECT * FROM conversations LIMIT 1;

-- Ver las foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'conversations';

-- Ver usuarios sin sincronizar
SELECT 
    au.id,
    au.email,
    'NO existe en public.users' as problema
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- Resumen
DO $$
DECLARE
    conversations_exists BOOLEAN;
    missing_users INTEGER;
BEGIN
    -- Verificar si existe la tabla
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'conversations'
    ) INTO conversations_exists;
    
    -- Contar usuarios sin sincronizar
    SELECT COUNT(*) INTO missing_users
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '📊 VERIFICACIÓN DE ESTRUCTURA';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    
    IF conversations_exists THEN
        RAISE NOTICE '✅ Tabla conversations existe';
        RAISE NOTICE '   Revisa arriba las columnas que tiene';
    ELSE
        RAISE NOTICE '❌ Tabla conversations NO existe';
        RAISE NOTICE '   Necesitas ejecutar: database-migrations.sql';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '👥 Usuarios sin sincronizar: %', missing_users;
    
    IF missing_users > 0 THEN
        RAISE NOTICE '⚠️  Ejecuta primero: sync-users-now.sql';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
END $$;
